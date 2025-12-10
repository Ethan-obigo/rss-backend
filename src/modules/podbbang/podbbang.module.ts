import { Module } from '@nestjs/common';
import { PodbbangService } from './podbbang.service';

@Module({
  providers: [PodbbangService],
  exports: [PodbbangService],
})
export class PodbbangModule {}
