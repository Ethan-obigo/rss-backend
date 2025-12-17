import { Injectable } from '@nestjs/common';
import { Podcast } from 'podcast';
import { Channel, Video } from 'src/types/channel.types';

@Injectable()
export class RssService {
  generateRSS(channelInfo: Channel, videos: Video[], baseUrl: string): string {
    const feed = new Podcast({
      title: channelInfo.title || 'Podcast Channel',
      description:
        channelInfo.summary || channelInfo.description || 'Podcast RSS Feed',
      feedUrl: `${baseUrl}/rss/${channelInfo.id}`,
      siteUrl: channelInfo.url || baseUrl,
      imageUrl: channelInfo.thumbnail || '',
      author: channelInfo.author || channelInfo.copyright || 'Unknown',
      copyright: channelInfo.copyright || channelInfo.author || '',
      language: channelInfo.language || 'ko',
      itunesAuthor: channelInfo.host || channelInfo.author || 'Unknown',
      itunesOwner: {
        name:
          channelInfo.owner?.name ||
          channelInfo.host ||
          channelInfo.author ||
          'Unknown',
        email: channelInfo.owner?.email || 'noreply@example.com',
      },
      itunesSummary: channelInfo.summary || channelInfo.description || '',
      itunesImage: channelInfo.thumbnail || '',
      itunesExplicit: false,
      itunesType: 'episodic',
      itunesCategory: channelInfo.category
        ? [{ text: channelInfo.category }]
        : [{ text: 'Society & Culture' }], // 추후 기본값 정의 필요함
      pubDate: new Date(),
      ttl: 60,
    });

    videos.forEach((video) => {
      const item: {
        title: string;
        description: string;
        url: string;
        guid: string;
        date: Date | string;
        itunesAuthor: string;
        itunesExplicit: boolean;
        itunesSubtitle: string;
        itunesSummary: string;
        itunesEpisodeType: 'full' | 'trailer' | 'bonus';
        itunesImage?: string;
        enclosure?: {
          url: string;
          type: string;
          size: number;
        };
        itunesDuration?: number;
      } = {
        title: video.title,
        description: video.description || video.title,
        url: video.url,
        guid: video.id,
        date: video.publishedAt || video.uploadDate || new Date(),
        itunesAuthor: channelInfo.host || channelInfo.author || 'Unknown',
        itunesExplicit: false,
        itunesSubtitle: video.title,
        itunesSummary: video.description || video.title,
        itunesEpisodeType: 'full' as const,
      };

      if (video.thumbnail) {
        item.itunesImage = video.thumbnail;
      }

      if (video.audioPath) {
        item.enclosure = {
          url: video.audioPath,
          type: 'audio/mpeg',
          size: video.audioSize || 0,
        };
      }

      if (video.duration) {
        item.itunesDuration = video.duration;
      }

      feed.addItem(item);
    });

    return feed.buildXml({ indent: '  ' });
  }
}
