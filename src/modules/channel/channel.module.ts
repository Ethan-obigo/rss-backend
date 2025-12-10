import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { PodbbangService } from '../podbbang/podbbang.service';
import { SpotifyService } from '../spotify/spotify.service';

@Module({
  controllers: [ChannelController],
  providers: [PodbbangService, SpotifyService],
})
export class ChannelModule {}
