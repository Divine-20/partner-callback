import { Module } from '@nestjs/common';
import { JobCallbackController } from './controllers/job-callback.controller';
import { JobCallbackService } from './services/job-callback.service';

@Module({
  imports: [],
  controllers: [JobCallbackController],
  providers: [JobCallbackService],
})
export class AppModule {}
