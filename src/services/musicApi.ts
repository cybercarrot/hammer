import axios from 'axios';

export interface SongUrlResponse {
  url: string;
  br: string;
  size: number;
}

export interface AlbumCoverResponse {
  url: string;
}

export interface LyricResponse {
  lyric?: string;
  tlyric?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  artist: string | string[];
  album: string;
  source: string;
  pic_id?: string;
  lyric_id?: string;
}

const API_BASE_URL = 'https://music-api.gdstudio.xyz/api.php';

export const searchSongs = async (query: string, source: string, count = 10, page = 1) => {
  const { data } = await axios.get<SearchResult[]>(API_BASE_URL, {
    params: {
      types: 'search',
      source,
      name: query,
      count,
      pages: page,
    },
  });
  return data;
};

export const getSongUrl = async (source: string, id: string, br = '320') => {
  const { data } = await axios.get<SongUrlResponse>(API_BASE_URL, {
    params: {
      types: 'url',
      source,
      id,
      br,
    },
  });
  return data.url;
};

export const getAlbumCover = async (source: string, picId: string, size = '300') => {
  const { data } = await axios.get<AlbumCoverResponse>(API_BASE_URL, {
    params: {
      types: 'pic',
      source,
      id: picId,
      size,
    },
  });
  return data.url;
};

export const getLyric = async (source: string, lyricId: string) => {
  const { data } = await axios.get<LyricResponse>(API_BASE_URL, {
    params: {
      types: 'lyric',
      source,
      id: lyricId,
    },
  });

  const lrc = data.lyric;
  // 先不添加翻译歌词
  // if (data.tlyric) lrc += '\n' + data.tlyric;

  return lrc;
};

export const getSongInfo = async (song: SearchResult) => {
  const [url, cover, lrc] = await Promise.all([
    getSongUrl(song.source, song.id),
    getAlbumCover(song.source, song.pic_id),
    getLyric(song.source, song.lyric_id),
  ]);

  return {
    name: song.name,
    artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist,
    url,
    cover,
    lrc,
  };
};
