export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyCopyright {
  text: string;
  type: string;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyResumePoint {
  fully_played: boolean;
  resume_position_ms: number;
}

export interface SpotifyRestrictions {
  reason: string;
}

export interface SpotifyEpisode {
  audio_preview_url: string;
  description: string;
  html_description: string;
  duration_ms: number;
  explicit: boolean;
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  images: SpotifyImage[];
  is_externally_hosted: boolean;
  is_playable: boolean;
  language: string;
  languages: string[];
  name: string;
  release_date: string;
  release_date_precision: string;
  resume_point: SpotifyResumePoint;
  type: string;
  uri: string;
  restrictions: SpotifyRestrictions;
}

export interface SpotifyEpisodesPage {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: SpotifyEpisode[];
}

export interface SpotifyShow {
  available_markets: string[];
  copyrights: SpotifyCopyright[];
  description: string;
  html_description: string;
  explicit: boolean;
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  images: SpotifyImage[];
  is_externally_hosted: boolean;
  languages: string[];
  media_type: string;
  name: string;
  publisher: string;
  type: string;
  uri: string;
  total_episodes: number;
  episodes: SpotifyEpisodesPage;
}
