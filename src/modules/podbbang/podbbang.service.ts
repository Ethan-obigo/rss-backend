import { Injectable } from '@nestjs/common';
import * as https from 'https';
import {
  PodbbangChannelResponse,
  PodbbangEpisodesResponse,
} from 'src/types/podbbang.types';

@Injectable()
export class PodbbangService {
  /**
   * HTTPS GET 요청 헬퍼 함수
   */
  private httpsGet<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            } else {
              try {
                resolve(JSON.parse(data));
              } catch (err) {
                const errorMessage =
                  err instanceof Error ? err.message : 'Unknown error';
                reject(new Error(`JSON parse error: ${errorMessage}`));
              }
            }
          });
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  /**
   * 팟빵 채널 정보 및 에피소드 정보를 가져옵니다.
   */
  async fetchPodbbangChannel(channelId: string) {
    try {
      const firstPageUrl = `https://app-api6.podbbang.com/channels/${channelId}/episodes?offset=0&limit=20&sort=desc&episode_id=0&focus_center=0&with=image`;
      const firstPageData =
        await this.httpsGet<PodbbangEpisodesResponse>(firstPageUrl);

      const totalCount = firstPageData.summary?.totalCount || 0;
      let allEpisodes = [...firstPageData.data];

      if (totalCount > 20) {
        const numPages = Math.ceil(totalCount / 20);

        for (let pageNum = 1; pageNum < numPages; pageNum++) {
          const pageUrl = `https://app-api6.podbbang.com/channels/${channelId}/episodes?offset=${pageNum}&limit=20&sort=desc&episode_id=0&focus_center=0&with=image`;
          const pageData =
            await this.httpsGet<PodbbangEpisodesResponse>(pageUrl);

          if (pageData.data && pageData.data.length > 0) {
            allEpisodes = allEpisodes.concat(pageData.data);
          }
        }
      }

      const channelUrl = `https://app-api6.podbbang.com/channels/${channelId}`;
      const channelData =
        await this.httpsGet<PodbbangChannelResponse>(channelUrl);

      const episodesData = {
        data: allEpisodes,
        summary: firstPageData.summary,
      };

      const channelInfo = {
        id: channelId,
        title: channelData.title || 'Podbbang Channel',
        description: channelData.description || channelData.summary || '',
        summary: channelData.summary || channelData.description || '',
        url: `https://www.podbbang.com/channels/${channelId}`,
        thumbnail: channelData.image || channelData.thumbnail?.url || '',
        author: channelData.mc || channelData.copyright || 'Unknown',
        copyright: channelData.copyright || '',
        owner: {
          name: channelData.mc || channelData.copyright || 'Unknown',
          email: channelData.contacts?.email || '',
        },
        language: 'ko',
        addedAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        type: 'podbbang',
      };

      const episodes =
        episodesData.data?.map((episode) => ({
          id: episode.id.toString(),
          title: episode.title || 'Untitled Episode',
          description: episode.description || '',
          url: `https://www.podbbang.com/channels/${channelId}/episodes/${episode.id}`,
          audioPath: episode.media?.url || '',
          thumbnail: episode.thumbnail?.url || episode.image?.url || '',
          publishedAt:
            episode.published_at ||
            episode.created_at ||
            new Date().toISOString(),
          duration: episode.duration || null,
        })) || [];

      return {
        channelInfo,
        episodes,
      };
    } catch (error) {
      console.error('Podbbang fetch error:', error);
      throw error;
    }
  }

  /**
   * 팟빵 채널 정보를 업데이트합니다.
   */
  async updatePodbbangChannel(channelId: string) {
    const { episodes } = await this.fetchPodbbangChannel(channelId);
    return episodes;
  }
}
