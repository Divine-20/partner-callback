import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum JobEventType {
  JobAssigned = 'JobAssigned',
  JobStarted = 'JobStarted',
  JobCompleted = 'JobCompleted',
  JobWithdrawed = 'JobWithdrawed',
}

export class JobCallbackDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  jobId: number;

  @ApiProperty({ enum: JobEventType, example: JobEventType.JobAssigned })
  @IsEnum(JobEventType)
  eventType: JobEventType;

  @ApiProperty({ example: 'Open House at 123 Main St' })
  @IsString()
  jobName: string;

  @ApiProperty({ example: 'Assigned' })
  @IsString()
  jobStatus: string;

  @ApiProperty({ example: '+12345678901', required: false })
  @IsOptional()
  @IsString()
  guardianPhone?: string;
}

export interface JobCallbackWithTimestamp extends JobCallbackDto {
  receivedAt?: string;
}
