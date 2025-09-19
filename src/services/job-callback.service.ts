import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import {
  JobCallbackDto,
  JobCallbackWithTimestamp,
} from '../dto/job-callback.dto';
import { CallbackResponseDto } from '../dto/callback-response.dto';
import * as crypto from 'crypto';

@Injectable()
export class JobCallbackService {
  private readonly logger = new Logger(JobCallbackService.name);
  private readonly jobCallbacks = new Map<number, JobCallbackWithTimestamp[]>(); // In-memory storage for demo

  private readonly SHARED_SECRET =
    process.env.CALLBACK_SECRET || 'JLwe345A2Wjd45';

  /**
   * Verify HMAC signature from headers
   */
  verifyHmacSignature(rawBody: string, signatureHeader?: string): void {
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing X-Signature header');
    }

    // Header is just the hex signature (simplified from docs)
    const signatureHex = signatureHeader.trim();

    const hmac = crypto.createHmac('sha256', this.SHARED_SECRET);
    hmac.update(rawBody, 'utf8');
    const expectedHex = hmac.digest('hex');

    // Compare securely
    const ok =
      signatureHex.length === expectedHex.length &&
      crypto.timingSafeEqual(
        Buffer.from(signatureHex, 'hex'),
        Buffer.from(expectedHex, 'hex'),
      );

    if (!ok) {
      this.logger.error(
        `❌ Invalid signature. Received=${signatureHex}, Expected=${expectedHex}`,
      );
      throw new UnauthorizedException('Invalid signature');
    }

    this.logger.log(`✅ HMAC verified successfully`);
  }

  async processJobCallback(
    jobCallbackData: JobCallbackDto,
  ): Promise<CallbackResponseDto> {
    this.logger.log(
      `🔔 CALLBACK RECEIVED - Event: ${jobCallbackData.eventType}, JobId: ${jobCallbackData.jobId}`,
    );
    this.logger.log(`📊 Job Status: ${jobCallbackData.jobStatus}`);
    this.logger.log(`📝 Job Name: ${jobCallbackData.jobName}`);
    if (jobCallbackData.guardianPhone) {
      this.logger.log(`📞 Guardian Phone: ${jobCallbackData.guardianPhone}`);
    }

    // Store + process
    this.storeCallbackHistory(jobCallbackData);
    await this.updateJobStatus(jobCallbackData);
    await this.triggerWorkflows(jobCallbackData);

    return {
      success: true,
      message: `Job callback processed successfully: ${jobCallbackData.eventType}`,
      jobId: jobCallbackData.jobId,
      processedAt: new Date().toISOString(),
    };
  }

  private storeCallbackHistory(jobData: JobCallbackDto): void {
    if (!this.jobCallbacks.has(jobData.jobId)) {
      this.jobCallbacks.set(jobData.jobId, []);
    }

    const callbackWithTimestamp: JobCallbackWithTimestamp = {
      ...jobData,
      receivedAt: new Date().toISOString(),
    };

    this.jobCallbacks.get(jobData.jobId)!.push(callbackWithTimestamp);
    this.logger.log(`📚 Stored callback history for jobId: ${jobData.jobId}`);
  }

  getJobCallbackHistory(jobId: number): JobCallbackWithTimestamp[] {
    return this.jobCallbacks.get(jobId) || [];
  }

  getAllJobCallbacks(): Map<number, JobCallbackWithTimestamp[]> {
    return this.jobCallbacks;
  }

  private async saveJobToDatabase(jobData: JobCallbackDto): Promise<void> {
    this.logger.log(`💾 Saving job ${jobData.jobId} to database`);

    // TODO: Implement your database logic here
    // await this.jobRepository.save(jobData);

    // Simulate database operation
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.log(`✅ Job ${jobData.jobId} saved to database`);
  }

  private async notifyRelevantParties(jobData: JobCallbackDto): Promise<void> {
    this.logger.log(`📧 Sending notifications for job ${jobData.jobId}`);

    switch (jobData['eventType']) {
      case 'JobAssigned':
        this.logger.log(`📨 Notify client: Guardian assigned`);
        break;
      case 'JobStarted':
        this.logger.log(`📨 Notify client: Job started`);
        break;
      case 'JobCompleted':
        this.logger.log(`📨 Notify client + billing: Job completed`);
        break;
      case 'JobWithdrawed':
        this.logger.log(`📨 Notify all: Job cancelled/withdrawn`);
        break;
      default:
        this.logger.log(`ℹ️ Unknown event type: ${jobData['eventType']}`);
    }
  }

  private async updateJobStatus(jobData: JobCallbackDto): Promise<void> {
    this.logger.log(
      `🔄 Updating status for job ${jobData.jobId} to ${jobData['jobStatus']}`,
    );

    // TODO: Update job status in your system
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.logger.log(`✅ Status updated for job ${jobData.jobId}`);
  }

  private async triggerWorkflows(jobData: JobCallbackDto): Promise<void> {
    this.logger.log(
      `⚡ Triggering workflows for job ${jobData.jobId} with event ${jobData['eventType']}`,
    );

    switch (jobData['eventType']) {
      case 'JobAssigned':
        this.logger.log(`🎯 Trigger guardian tracking workflow`);
        break;
      case 'JobStarted':
        this.logger.log(`📍 Trigger monitoring workflow`);
        break;
      case 'JobCompleted':
        this.logger.log(`💰 Trigger billing + reporting workflow`);
        break;
      case 'JobWithdrawed':
        this.logger.log(`🧹 Trigger cancellation workflow`);
        break;
    }
  }
}
