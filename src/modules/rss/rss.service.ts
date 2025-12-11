import { Injectable } from '@nestjs/common';
import { Podcast } from 'podcast';
import { Channel, Video } from '../../shared/services/channel-db.service';

@Injectable()
export class RssService {
  /**
   * iTunes 표준 RSS 피드 생성
   */
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
        : undefined,
      pubDate: new Date(),
      ttl: 60,
      customElements: [
        { 'channel:type': channelInfo.contentType || channelInfo.type },
        { 'channel:category': channelInfo.category || '기타' },
        {
          'channel:publisher':
            channelInfo.publisher || channelInfo.author || 'Unknown',
        },
        { 'channel:host': channelInfo.host || channelInfo.author || 'Unknown' },
        { 'channel:addedAt': channelInfo.addedAt },
        ...(channelInfo.tags || []).map((tag) => ({ 'channel:tag': tag })),
      ],
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
        customElements?: Array<{ [key: string]: string }>;
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

      // 에피소드 커스텀 메타데이터 추가
      item.customElements = [
        { 'episode:id': video.id },
        { 'episode:publishedAt': video.publishedAt || video.uploadDate || '' },
        { 'episode:type': video.contentType || '기타' },
        { 'episode:channelName': channelInfo.title },
        ...(video.tags || []).map((tag) => ({ 'episode:tag': tag })),
      ];

      feed.addItem(item);
    });

    return feed.buildXml({ indent: '  ' });
  }
}
