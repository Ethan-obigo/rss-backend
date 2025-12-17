export interface ItunesSearchResult {
  wrapperType: string;
  kind: string;
  artistId?: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionCensoredName?: string;
  trackCensoredName?: string;
  collectionViewUrl?: string;
  feedUrl: string;
  trackViewUrl?: string;
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  collectionPrice?: number;
  trackPrice?: number;
  collectionHdPrice?: number;
  releaseDate?: string;
  collectionExplicitness?: string;
  trackExplicitness?: string;
  trackCount?: number;
  trackTimeMillis?: number;
  country?: string;
  currency?: string;
  primaryGenreName?: string;
  contentAdvisoryRating?: string;
  genres?: string[];
  genreIds?: string[];
}

export interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesSearchResult[];
}
