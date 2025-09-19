import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  Param,
  ParseIntPipe,
  Headers,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common'; // Use import type
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JobCallbackService } from '../services/job-callback.service';
import {
  JobCallbackWithTimestamp,
  JobCallbackDto,
  JobEventType,
} from '../dto/job-callback.dto';
import { CallbackResponseDto } from '../dto/callback-response.dto';
import * as crypto from 'crypto';

@ApiTags('Job Callbacks')
@Controller('api/v1/job-callback')
export class JobCallbackController {
  private readonly logger = new Logger(JobCallbackController.name);
  private readonly SHARED_SECRET = 'JLwe345A2Wjd45';

  constructor(private readonly jobCallbackService: JobCallbackService) {}

  private parseSignatureHeader(headerValue: string) {
    const parts = headerValue.split(',').map((p) => p.trim());
    const tPart = parts.find((p) => p.startsWith('t='));
    const sPart = parts.find((p) => p.startsWith('s='));
    if (!tPart || !sPart) return null;

    const t = tPart.slice(2);
    const s = sPart.slice(2);
    if (!t || !s) return null;
    return { t, s };
  }

  private verifyHmac(req: RawBodyRequest<Request>, signatureHeader: string) {
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing signature header');
    }

    const parsed = this.parseSignatureHeader(signatureHeader);
    if (!parsed) {
      throw new UnauthorizedException('Invalid signature header format');
    }

    const { t: timestamp, s: signatureHex } = parsed;

    if (!req.rawBody) {
      throw new UnauthorizedException('Missing request body');
    }

    const rawBody = req.rawBody.toString('utf8');
    const toSign = `${timestamp}.${rawBody}`;

    const hmac = crypto.createHmac('SHA256', this.SHARED_SECRET);
    hmac.update(toSign, 'utf8');
    const expectedHex = hmac.digest('hex');

    if (signatureHex.length !== expectedHex.length) {
      this.logger.error('Signature length mismatch', {
        signature: expectedHex,
        expectedSignature: expectedHex,
      });
      throw new UnauthorizedException('Signature length mismatch');
    }

    const ok = crypto.timingSafeEqual(
      Buffer.from(signatureHex, 'hex'),
      Buffer.from(expectedHex, 'hex'),
    );

    if (!ok) {
      this.logger.error('Signature mismatch', {
        signature: signatureHex,
        expectedSignature: expectedHex,
      });
      throw new UnauthorizedException('Invalid signature');
    }

    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) {
      throw new UnauthorizedException('Signature too old');
    }

    return true;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook endpoint for partner API callbacks',
    description:
      'Receives job status updates from G2Sentry. Verifies HMAC signature and processes callback.',
  })
  @ApiBody({
    type: JobCallbackDto,
  })
  async handleJobCallback(
    @Req() req: RawBodyRequest<Request>, // Fixed import type
    @Headers('X-Signature') signatureHeader: string,
  ): Promise<CallbackResponseDto> {
    this.verifyHmac(req, signatureHeader);

    if (!req.rawBody) {
      throw new UnauthorizedException('Missing request body');
    }

    const jobCallbackData: JobCallbackDto = JSON.parse(
      req.rawBody.toString('utf8'),
    );

    this.logger.log(
      `✅ Valid callback received: ${jobCallbackData.eventType} for jobId ${jobCallbackData.jobId}`,
    );

    return await this.jobCallbackService.processJobCallback(jobCallbackData);
  }

  @Get('history/:jobId')
  @ApiOperation({
    summary: 'Get callback history for a specific job',
    description: 'Retrieve all callback events received for a specific job ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback history retrieved successfully',
  })
  async getJobCallbackHistory(@Param('jobId', ParseIntPipe) jobId: number) {
    this.logger.log(`📚 Retrieving callback history for jobId: ${jobId}`);
    const history = this.jobCallbackService.getJobCallbackHistory(jobId);
    return {
      jobId,
      callbackCount: history.length,
      callbacks: history,
    };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get all callback history',
    description: 'Retrieve callback history for all jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'All callback history retrieved successfully',
  })
  async getAllCallbackHistory() {
    this.logger.log(`📚 Retrieving all callback history`);
    const allCallbacks = this.jobCallbackService.getAllJobCallbacks();
    const summary = Array.from(allCallbacks.entries()).map(
      ([jobId, callbacks]) => ({
        jobId,
        callbackCount: callbacks.length,
        latestStatus: callbacks[callbacks.length - 1]?.eventType,
        lastUpdated: callbacks[callbacks.length - 1]?.receivedAt,
      }),
    );

    return {
      totalJobs: allCallbacks.size,
      totalCallbacks: Array.from(allCallbacks.values()).reduce(
        (sum, callbacks) => sum + callbacks.length,
        0,
      ),
      jobs: summary,
    };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test the callback endpoint',
    description:
      'Test endpoint to simulate a callback from the partner API with sample job data',
  })
  @ApiResponse({
    status: 200,
    description: 'Test callback processed successfully',
    type: CallbackResponseDto,
  })
  async testJobCallback(): Promise<CallbackResponseDto> {
    const testData: JobCallbackDto = {
      jobId: 999,
      eventType: JobEventType.JobAssigned,
      jobName: 'Open House 23 Main St',
      jobStatus: 'New',
      guardianPhone: '+1234567890',
    };

    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(testData);
    const toSign = `${timestamp}.${payloadString}`;

    const signature = crypto
      .createHmac('sha256', this.SHARED_SECRET)
      .update(toSign)
      .digest('hex');

    const signatureHeader = `t=${timestamp},s=${signature}`;

    this.logger.log(`🧪 Computed X-Signature for test: ${signatureHeader}`);
    this.logger.log('🧪 Processing test job callback with sample data');

    return await this.jobCallbackService.processJobCallback(testData);
  }
}
