import { Injectable } from '@nestjs/common';
import {
  SpotifyEpisode,
  SpotifyEpisodesPage,
  SpotifyShow,
  SpotifyToken,
} from 'src/types/spotify.types';

@Injectable()
export class SpotifyService {
  private readonly SPOTIFY_CLIENT_ID: string;
  private readonly SPOTIFY_CLIENT_SECRET: string;

  constructor() {
    this.SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
    this.SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
  }

  /**
   * 스포티파이 API 액세스 토큰을 받아옵니다.
   */
  private async getSpotifyToken(): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.SPOTIFY_CLIENT_ID,
      client_secret: this.SPOTIFY_CLIENT_SECRET,
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to get Spotify token: ${res.status} ${res.statusText}`,
      );
    }

    const { access_token: token } = (await res.json()) as SpotifyToken;
    return token;
  }

  /**
   * 스포티파이 쇼 ID를 URL에서 추출합니다.
   */
  private extractShowId(url: string): string {
    const match = url.match(/show\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid Spotify show URL');
    }
    return match[1];
  }

  /**
   * 스포티파이 쇼 정보 및 에피소드 정보를 가져옵니다.
   */
  async fetchSpotifyShow(showUrl: string) {
    try {
      const showId = this.extractShowId(showUrl);
      const token = await this.getSpotifyToken();

      const showRes = await fetch(
        `https://api.spotify.com/v1/shows/${showId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!showRes.ok) {
        throw new Error(
          `Failed to fetch show: ${showRes.status} ${showRes.statusText}`,
        );
      }

      const showData = (await showRes.json()) as SpotifyShow;

      const channelInfo = {
        id: showId,
        title: showData.name || 'Spotify Podcast',
        description: showData.description || '',
        summary: showData.description || '',
        url: showUrl,
        thumbnail: showData.images?.[0]?.url || '',
        author: showData.publisher || 'Unknown',
        copyright: showData.publisher || '',
        owner: {
          name: showData.publisher || 'Unknown',
          email: '',
        },
        addedAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        type: 'spotify',
      };

      let allEpisodes: SpotifyEpisode[] = [];
      let offset = 0;
      const limit = 50;
      const totalEpisodes = showData.total_episodes || 0;

      while (offset < totalEpisodes) {
        const episodesRes = await fetch(
          `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!episodesRes.ok) {
          throw new Error(
            `Failed to fetch episodes at offset ${offset}: ${episodesRes.status} ${episodesRes.statusText}`,
          );
        }

        const episodesData = (await episodesRes.json()) as SpotifyEpisodesPage;

        if (!episodesData.items || episodesData.items.length === 0) {
          break;
        }

        allEpisodes = allEpisodes.concat(episodesData.items);
        offset += limit;

        if (offset < totalEpisodes) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const episodes = allEpisodes.map((episode) => ({
        id: episode.id,
        title: episode.name || 'Untitled Episode',
        description: episode.description || episode.html_description || '',
        url:
          episode.external_urls?.spotify ||
          `https://open.spotify.com/episode/${episode.id}`,
        audioPath: episode.audio_preview_url || '',
        thumbnail: episode.images?.[0]?.url || channelInfo.thumbnail,
        publishedAt: episode.release_date || new Date().toISOString(),
        duration: episode.duration_ms
          ? Math.floor(episode.duration_ms / 1000)
          : null,
      }));

      return {
        channelInfo,
        episodes,
      };
    } catch (error) {
      console.error('Spotify fetch error:', error);
      throw error;
    }
  }

  /**
   * 스포티파이 쇼 정보를 업데이트합니다.
   */
  async updateSpotifyShow(showUrl: string) {
    const { episodes } = await this.fetchSpotifyShow(showUrl);
    return episodes;
  }
}
