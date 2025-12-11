import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { ChannelModule } from './modules/channel/channel.module';
import { RssModule } from './modules/rss/rss.module';
import { PodbbangModule } from './modules/podbbang/podbbang.module';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { YoutubeModule } from './modules/youtube/youtube.module';

@Module({
  imports: [
    SharedModule,
    ChannelModule,
    RssModule,
    PodbbangModule,
    SpotifyModule,
    YoutubeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
