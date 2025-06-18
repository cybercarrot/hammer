import axios from 'axios';

// 缓存配置
const SONG_INFO_CACHE_EXPIRE = 30 * 60000; // 30分钟

interface CachedSongInfo {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc: string | null;
}

interface SongInfoCache {
  data: CachedSongInfo;
  timestamp: number;
}

const songInfoCache = new Map<string, SongInfoCache>();

// 生成缓存键的辅助函数
const getCacheKey = (song: SearchResult): string => {
  return `${song.source}:${song.id}`;
};

// 检查缓存是否仍然有效的辅助函数
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < SONG_INFO_CACHE_EXPIRE;
};

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

export const searchSongs = async (query: string, source: string, count = 20, page = 1) => {
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
  const cacheKey = getCacheKey(song);
  const cachedData = songInfoCache.get(cacheKey);

  // 如果缓存存在且仍然有效，则返回缓存数据
  if (cachedData && isCacheValid(cachedData.timestamp)) {
    return cachedData.data;
  }

  // 如果缓存无效或不存在，则获取新数据
  const [url, cover, lrc] = await Promise.all([
    getSongUrl(song.source, song.id),
    getAlbumCover(song.source, song.pic_id),
    getLyric(song.source, song.lyric_id),
  ]);

  const songInfo: CachedSongInfo = {
    name: song.name,
    artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist,
    url,
    cover,
    lrc: lrc || null,
  };

  // 更新缓存
  songInfoCache.set(cacheKey, {
    data: songInfo,
    timestamp: Date.now(),
  });

  return songInfo;
};
