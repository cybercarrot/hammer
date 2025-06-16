import React, { useEffect, useRef, useState } from 'react';
import { useGetState } from 'ahooks';
import { useToast } from '../context/ToastContext';
import {
  Text,
  Button,
  Flex,
  Box,
  Select,
  TextField,
  Separator,
  Spinner,
  Tabs,
  IconButton,
  Tooltip,
} from '@radix-ui/themes';
import {
  MagnifyingGlassIcon,
  PlayIcon,
  PlusIcon,
  PinTopIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { LaplaceEventBridgeClient } from '@laplace.live/event-bridge-sdk';
// @ts-expect-error APlayer types are not available
import APlayer from 'aplayer';
import 'aplayer/dist/APlayer.min.css';
import { searchSongs, getSongInfo, SearchResult } from '../services/musicApi';

// type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

const MUSIC_SOURCES = [
  { value: 'netease', label: '网易云音乐' },
  // { value: 'tencent', label: 'QQ音乐' },
  // { value: 'kugou', label: '酷狗音乐' },
  { value: 'kuwo', label: '酷我音乐' },
  // { value: 'migu', label: '咪咕音乐' },
  { value: 'tidal', label: 'Tidal' },
  // { value: 'spotify', label: 'Spotify' },
  // { value: 'ytmusic', label: 'YouTube Music' },
  // { value: 'qobuz', label: 'Qobuz' },
  { value: 'joox', label: 'JOOX' },
  // { value: 'deezer', label: 'Deezer' },
  // { value: 'ximalaya', label: '喜马拉雅' },
];

const SongRequest: React.FC = () => {
  // const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('netease');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingSongInfo, setIsGettingSongInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'default'>('request');
  const { showToast } = useToast();

  const playerRef = useRef<APlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // 点歌列表
  const [requestPlaylist, setRequestPlaylist, getRequestPlaylist] = useGetState<SearchResult[]>([]);

  // 固定歌单（默认播放列表）
  const [defaultPlaylist, , getDefaultPlaylist] = useGetState<SearchResult[]>([
    {
      album: 'My Story,Your Song 经典全记录',
      artist: ['孙燕姿'],
      id: '287221',
      lyric_id: '287221',
      name: '绿光',
      pic_id: '109951166887388958',
      source: 'netease',
    },
    {
      album: '火车驶向云外，梦安魂于九霄',
      artist: ['刺猬'],
      id: '528272281',
      lyric_id: '528272281',
      name: '火车驶向云外，梦安魂于九霄',
      pic_id: '109951163102691938',
      source: 'netease',
    },
    {
      album: '七里香',
      artist: ['周杰伦'],
      id: '94237',
      lyric_id: '94237',
      name: '七里香',
      pic_id: '120/s4s81/2/3200337129.jpg',
      source: 'kuwo',
    },
  ]);

  const [defaultPlaylistIndex, setDefaultPlaylistIndex, getDefaultPlaylistIndex] =
    useGetState<number>(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchSongs(searchQuery, searchSource);

      setSearchResults(results);

      if (results.length === 0) {
        showToast('未找到相关歌曲', 'info');
      }
    } catch (error) {
      console.error('搜索歌曲出错:', error);
      showToast('搜索歌曲出错', 'error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addSongToRequestPlaylist = async (song: SearchResult, top = false) => {
    // 需要是异步方法，需要等待setRequestPlaylist生效
    setRequestPlaylist(prev => (top ? [song, ...prev] : [...prev, song]));
    // setActiveTab('request');
  };

  const removeSongFromRequestPlaylist = async (index: number) => {
    setRequestPlaylist(prev => prev.filter((_, i) => i !== index));
  };

  const playNextSong = () => {
    const currentRequestPlaylist = getRequestPlaylist();
    const currentDefaultPlaylist = getDefaultPlaylist();
    const currentDefaultPlaylistIndex = getDefaultPlaylistIndex();
    if (currentRequestPlaylist.length <= 0 && currentDefaultPlaylist.length <= 0) {
      showToast('播放列表为空', 'info');
      console.log('播放列表为空');
      return;
    }

    let song: SearchResult;
    if (currentRequestPlaylist.length > 0) {
      // 如果点歌列表有歌，取出一首插队播放
      song = currentRequestPlaylist[0];
      setRequestPlaylist(currentRequestPlaylist.slice(1));
    } else if (currentDefaultPlaylist.length > 0) {
      // 如果点歌列表没有歌，播放默认歌单
      // 先只支持列表循环播放
      const nextIndex = (currentDefaultPlaylistIndex + 1) % currentDefaultPlaylist.length;
      song = currentDefaultPlaylist[nextIndex];
      setDefaultPlaylistIndex(nextIndex);
      setActiveTab('default');
    }

    // 获取播放链接并播放
    setIsGettingSongInfo(true);
    getSongInfo(song)
      .then(songInfo => {
        playerRef.current.list.clear();
        playerRef.current.list.add(songInfo);
        playerRef.current.play();
        setIsGettingSongInfo(false);
      })
      .catch(error => {
        console.error('获取歌曲信息失败:', error);
        showToast('获取歌曲信息失败', 'error');
        setIsGettingSongInfo(false);
      });
  };

  useEffect(() => {
    // 初始化客户端
    const newClient = new LaplaceEventBridgeClient({
      url: 'ws://localhost:9696',
      token: '',
      reconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
    });

    // 设置事件监听器
    newClient.on('message', () => {
      // TODO: 待实现
    });

    // newClient.onConnectionStateChange((state: ConnectionState) => {
    //   console.log(`Connection state changed to: ${state}`);
    //   setConnectionState(state);
    // });

    // 连接到服务器
    const connect = async () => {
      try {
        await newClient.connect();
      } catch (error) {
        console.error('Failed to connect to WebSocket server:', error);
      }
    };

    connect();

    // MARK: 初始化播放器
    if (playerContainerRef.current && !playerRef.current) {
      playerRef.current = new APlayer({
        container: playerContainerRef.current,
        audio: [],
        autoplay: false,
        // loop: 'none',
        // order: 'random',
        preload: 'auto',
        volume: 0.7,
        mutex: true,
        lrcType: 1,
        listFolded: true,
        listMaxHeight: '0px',
        storageName: 'aplayer-setting',
        theme: '#ff92ad',
      });

      // 监听播放结束事件
      playerRef.current.on('ended', () => {
        console.log('播放结束，切换下一首');
        playNextSong();
      });

      // 如果固定歌单有歌，就先加载第一首
      if (defaultPlaylist.length > 0) {
        setIsGettingSongInfo(true);
        getSongInfo(defaultPlaylist[0])
          .then(songInfo => {
            playerRef.current.list.clear();
            playerRef.current.list.add(songInfo);
            setIsGettingSongInfo(false);
          })
          .catch(error => {
            console.error('获取歌曲信息失败:', error);
            showToast('获取歌曲信息失败', 'error');
            setIsGettingSongInfo(false);
          });
      }

      console.log(playerRef.current);
    }

    // 清理函数
    return () => {
      if (newClient) {
        newClient.disconnect();
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // const connectionStatus = {
  //   disconnected: '未连接',
  //   connecting: '连接中...',
  //   connected: '已连接',
  //   reconnecting: '重新连接中...',
  // }[connectionState];

  return (
    <div className="w-full h-full flex p-4 flex-row space-x-4">
      {/* 左侧：播放区域 */}
      <div className="w-1/3 flex flex-col space-y-4">
        {/* 播放器容器 */}
        <div className="flex flex-col">
          <Flex align="center" className="mb-2">
            <Text size="1" color="gray" weight="medium">
              播放器
            </Text>
            <Separator orientation="horizontal" className="flex-1 ml-2" />
          </Flex>
          <Box className="w-full relative">
            {isGettingSongInfo && (
              <Flex
                align="center"
                justify="center"
                className="w-full h-full absolute z-1 bg-black/50"
              >
                <Spinner size="3" />
              </Flex>
            )}
            <Box ref={playerContainerRef} className="!m-0" />
          </Box>
        </div>

        {/* 点歌列表和固定歌单 */}
        <Tabs.Root
          value={activeTab}
          // @ts-expect-error onValueChange类型不匹配
          onValueChange={setActiveTab}
        >
          <Tabs.List color="ruby" size="1">
            <Tabs.Trigger value="request">点歌列表({requestPlaylist.length})</Tabs.Trigger>
            <Tabs.Trigger value="default">固定歌单({defaultPlaylist.length})</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="request" className="h-full">
            {requestPlaylist.length > 0 ? (
              <div className="mt-2">
                {requestPlaylist.map((song, index) => (
                  <React.Fragment key={`req-${index}`}>
                    {index > 0 && <Separator size="4" className="my-1" />}
                    <div className="group flex items-center p-2 rounded relative">
                      <div className="w-2/3 truncate pr-2">
                        <Text className="truncate" size="2">
                          {song.name}
                        </Text>
                      </div>
                      <div className="w-1/3 truncate px-1">
                        <Text className="truncate text-gray-500" size="1">
                          {Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist}
                        </Text>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2 bg-black/0 group-hover:bg-black/70 transition-background duration-200 rounded overflow-hidden">
                        <div className="opacity-0 group-hover:opacity-100 flex transition-opacity duration-200">
                          <Tooltip content="立即播放" side="top">
                            <IconButton
                              className="!m-0"
                              variant="ghost"
                              size="2"
                              color="ruby"
                              onClick={async () => {
                                removeSongFromRequestPlaylist(index);
                                await addSongToRequestPlaylist(song, true);
                                playNextSong();
                              }}
                            >
                              <PlayIcon width={14} height={14} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="置顶" side="top">
                            <IconButton
                              className="!m-0"
                              variant="ghost"
                              size="2"
                              color="ruby"
                              onClick={() => {
                                removeSongFromRequestPlaylist(index);
                                addSongToRequestPlaylist(song, true);
                              }}
                            >
                              <PinTopIcon width={14} height={14} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="删除" side="top">
                            <IconButton
                              className="!m-0"
                              variant="ghost"
                              size="2"
                              color="ruby"
                              onClick={() => removeSongFromRequestPlaylist(index)}
                            >
                              <TrashIcon width={14} height={14} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center text-gray-500 text-sm p-4">
                点歌列表为空
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="default" className="h-full">
            {defaultPlaylist.length > 0 ? (
              <div className="mt-2">
                {defaultPlaylist.map((song: SearchResult, index: number) => {
                  const isCurrent = index === defaultPlaylistIndex;
                  return (
                    <React.Fragment key={`def-${index}`}>
                      {index > 0 && <Separator size="4" className="my-1" />}
                      <div
                        className={`group flex items-center p-2 rounded relative ${
                          isCurrent ? 'bg-gray-100 dark:bg-gray-800/50' : ''
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#ff92ad]"></div>
                        )}
                        <div className="w-2/3 truncate pr-2">
                          <Text className="truncate" size="2">
                            {song.name}
                          </Text>
                        </div>
                        <div className="w-1/3 truncate px-1">
                          <Text className="truncate text-gray-500" size="1">
                            {Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist}
                          </Text>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-end pr-2 bg-black/0 group-hover:bg-black/70 transition-background duration-200 rounded overflow-hidden">
                          <div className="opacity-0 group-hover:opacity-100 flex transition-opacity duration-200">
                            <Tooltip content="立即播放" side="top">
                              <IconButton
                                className="!m-0"
                                variant="ghost"
                                size="2"
                                color="ruby"
                                onClick={async () => {
                                  await addSongToRequestPlaylist(song, true);
                                  playNextSong();
                                  setDefaultPlaylistIndex(index);
                                }}
                              >
                                <PlayIcon width={14} height={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="置顶点歌" side="top">
                              <IconButton
                                className="!m-0"
                                variant="ghost"
                                size="2"
                                color="ruby"
                                onClick={() => {
                                  addSongToRequestPlaylist(song, true);
                                }}
                              >
                                <PinTopIcon width={14} height={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip content="点歌" side="top">
                              <IconButton
                                className="!m-0"
                                variant="ghost"
                                size="2"
                                color="ruby"
                                onClick={() => {
                                  addSongToRequestPlaylist(song);
                                }}
                              >
                                <PlusIcon width={14} height={14} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm p-4">
                固定歌单为空
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* 右侧：搜索区域 */}
      <div className="w-2/3 flex flex-col ">
        <Flex align="center" className="mb-2">
          <Text size="1" color="gray" weight="medium">
            搜索歌曲
          </Text>
          <Separator orientation="horizontal" className="flex-1 ml-2" />
        </Flex>
        <Box className="flex-1 flex flex-col overflow-hidden">
          <form onSubmit={handleSearch}>
            <Flex gap="2">
              <Select.Root value={searchSource} onValueChange={setSearchSource} size="1">
                <Select.Trigger className="w-[120px]" />
                <Select.Content>
                  {MUSIC_SOURCES.map(source => (
                    <Select.Item key={source.value} value={source.value}>
                      {source.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <TextField.Root
                className="flex-1"
                placeholder="搜索歌曲、歌手或专辑"
                value={searchQuery}
                size="1"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
              />
              <Button type="submit" disabled={isSearching} size="1" variant="surface">
                <MagnifyingGlassIcon width="14" height="14" className="mr-1" />
                {isSearching ? '搜索中...' : '搜索'}
              </Button>
            </Flex>
          </form>

          <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            <div className="mt-2">
              {searchResults.map((song, index) => (
                <React.Fragment key={`${song.source}-${song.id}`}>
                  {index > 0 && <Separator size="4" className="my-1" />}
                  <div className="group flex items-center p-2 rounded relative">
                    <div className="w-1/2 truncate pr-2">
                      <Text className="truncate" size="2">
                        {song.name}
                      </Text>
                    </div>
                    <div className="w-1/4 truncate px-1">
                      <Text className="truncate text-gray-500" size="1">
                        {Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist}
                      </Text>
                    </div>
                    <div className="w-1/4 truncate pl-1">
                      <Text className="truncate text-gray-500" size="1">
                        {song.album}
                      </Text>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-end pr-2 bg-black/0 group-hover:bg-black/70 transition-background duration-200 rounded overflow-hidden">
                      <div className="opacity-0 group-hover:opacity-100 flex transition-opacity duration-200">
                        <Tooltip content="立即播放" side="top">
                          <IconButton
                            className="!m-0"
                            variant="ghost"
                            size="2"
                            color="ruby"
                            onClick={async () => {
                              await addSongToRequestPlaylist(song, true);
                              playNextSong();
                            }}
                          >
                            <PlayIcon width={14} height={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="置顶点歌" side="top">
                          <IconButton
                            className="!m-0"
                            variant="ghost"
                            size="2"
                            color="ruby"
                            onClick={() => {
                              addSongToRequestPlaylist(song, true);
                            }}
                          >
                            <PinTopIcon width={14} height={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="点歌" side="top">
                          <IconButton
                            className="!m-0"
                            variant="ghost"
                            size="2"
                            color="ruby"
                            onClick={() => {
                              addSongToRequestPlaylist(song);
                            }}
                          >
                            <PlusIcon width={14} height={14} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default SongRequest;
