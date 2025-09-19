import { ApiProperty } from '@nestjs/swagger';

export class CallbackResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Job callback processed successfully' })
  message: string;

  @ApiProperty({ example: 1 })
  jobId: number;

  @ApiProperty({ example: '2025-01-27T10:30:00Z' })
  processedAt: string;
}
