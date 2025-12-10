import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { ChannelModule } from './modules/channel/channel.module';
import { RssModule } from './modules/rss/rss.module';
import { PodbbangModule } from './modules/podbbang/podbbang.module';
import { SpotifyModule } from './modules/spotify/spotify.module';

@Module({
  imports: [
    SharedModule,
    ChannelModule,
    RssModule,
    PodbbangModule,
    SpotifyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
