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
  Badge,
  Popover,
  ScrollArea,
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

// MARK: 点歌机
const SongRequest: React.FC = () => {
  const clientRef = useRef<LaplaceEventBridgeClient | null>(null);
  const [prefixConfig, setPrefixConfig, getPrefixConfig] = useGetState({
    netease: '点歌',
    kuwo: '点k歌',
    tidal: '点t歌',
    joox: '点j歌',
  });

  // 黑名单关键词
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newBlacklistItem, setNewBlacklistItem] = useState('');
  const [showBlacklistConfig, setShowBlacklistConfig] = useState(false);

  // 添加黑名单关键词
  const addToBlacklist = () => {
    if (newBlacklistItem.trim() && !blacklist.includes(newBlacklistItem.trim())) {
      setBlacklist([...blacklist, newBlacklistItem.trim()]);
      setNewBlacklistItem('');
    }
  };

  // 移除黑名单关键词
  const removeFromBlacklist = (keyword: string) => {
    setBlacklist(blacklist.filter(item => item !== keyword));
  };

  // 检查是否包含黑名单关键词
  const hasBlacklistedKeyword = (text: string) => {
    return blacklist.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  };
  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  >('disconnected');
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
  type Song = SearchResult & {
    requester?: string;
  };
  const [requestPlaylist, setRequestPlaylist, getRequestPlaylist] = useGetState<Song[]>([]);

  // 固定歌单（默认播放列表）
  const [defaultPlaylist, , getDefaultPlaylist] = useGetState<Song[]>([
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

  const addSongToRequestPlaylist = async (_song: Song, top = false) => {
    // 需要是异步方法，需要等待setRequestPlaylist生效
    const song = {
      ..._song,
      requester: _song.requester || '[系统]',
    };
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

    let song: Song;
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

  const handleToggleDanmu = () => {
    if (connectionState === 'connecting' || connectionState === 'reconnecting') {
      showToast('弹幕正在连接中', 'info');
      return;
    }

    if (connectionState === 'connected') {
      // 如果已连接，则关闭连接
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        showToast('弹幕连接已关闭', 'info');
      }
      return;
    }

    // 如果未连接，则创建新的客户端实例
    const client = new LaplaceEventBridgeClient({
      url: 'ws://localhost:9696',
      token: '',
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 0,
    });

    // 保存客户端实例引用
    clientRef.current = client;

    // 设置消息处理器
    client.on('message', event => {
      const content = event.message;
      if (!content) return;

      let source: string;
      let keyword: string;

      // 检查消息是否以配置的前缀开头
      for (const [src, prefix] of Object.entries(getPrefixConfig())) {
        if (content.startsWith(prefix)) {
          source = src;
          keyword = content.slice(prefix.length).trim();
          break;
        }
      }

      if (source && keyword) {
        const requester = event.username;
        console.log(`收到${requester}的弹幕点歌:`, source, keyword);
        handleDanmuSongRequest(source, keyword, requester);
      }
    });

    // 设置连接状态变化处理器
    client.onConnectionStateChange(
      (state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting') => {
        console.log(`Connection state changed to: ${state}`);
        setConnectionState(state);

        if (state === 'connected') {
          showToast('弹幕连接成功', 'success');
        }
      }
    );

    // 连接服务器
    client.connect().catch(error => {
      console.error('Failed to connect to WebSocket server:', error);
      showToast('弹幕连接失败: ' + error.message, 'error');
    });
  };

  const handleDanmuSongRequest = async (source: string, keyword: string, requester = '[匿名]') => {
    try {
      // 检查是否包含黑名单关键词
      if (hasBlacklistedKeyword(keyword)) {
        console.log(`已拦截黑名单关键词点歌: ${keyword}`);
        showToast(`${requester}的点歌包含黑名单关键词，已拦截`, 'error');
        return;
      }

      // Type assertion for source since we know it's a valid source from our config
      const results = await searchSongs(keyword, source as 'netease' | 'kuwo' | 'tidal' | 'joox');
      if (results.length > 0) {
        const song = {
          ...results[0],
          requester, // 添加点歌者信息
        };
        await addSongToRequestPlaylist(song);
        const artistName = Array.isArray(song.artist)
          ? song.artist.join('/')
          : song.artist || '未知艺术家';
        showToast(`已添加${requester}的点歌: ${song.name} - ${artistName}`, 'info');
      } else {
        showToast(`${requester}点歌未找到: ${keyword}`, 'error');
      }
    } catch (error) {
      console.error('Failed to process danmu song request:', error);
      showToast('弹幕点歌失败', 'error');
    }
  };

  const handlePrefixChange = (source: string, value: string) => {
    setPrefixConfig(prev => ({ ...prev, [source]: value }));
  };

  useEffect(() => {
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
      // 注意：客户端实例现在在 handleToggleDanmu 中管理
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
      <div className="w-2/5 flex flex-col space-y-4">
        {/* 播放器容器 */}
        <div className="flex flex-col">
          <Flex align="center" className="mb-2">
            <Text size="1" color="gray">
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
                      <div className="w-1/4 truncate px-1">
                        <Text className="truncate text-gray-500" size="1">
                          {song.requester}
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
                {defaultPlaylist.map((song: Song, index: number) => {
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

      {/* 右侧：操作区域 */}
      <div className="w-3/5 flex flex-col">
        <Flex align="center" className="mb-2">
          <Text size="1" color="gray">
            操作
          </Text>
          <Separator orientation="horizontal" className="flex-1 ml-2" />
        </Flex>
        <Box className="mb-4 space-y-2">
          <Flex gap="2" align="center">
            <Badge
              color={
                connectionState === 'connected'
                  ? 'green'
                  : connectionState === 'disconnected'
                    ? 'red'
                    : 'gray'
              }
              variant="soft"
              size="3"
            >
              当前状态：
              {connectionState === 'connected'
                ? '已开启'
                : connectionState === 'disconnected'
                  ? '未开启'
                  : '开启中'}
            </Badge>
            <Button
              size="2"
              color={connectionState === 'connected' ? 'red' : 'indigo'}
              onClick={handleToggleDanmu}
              disabled={connectionState === 'connecting' || connectionState === 'reconnecting'}
            >
              {connectionState === 'connected' ? '关闭弹幕点歌' : '开启弹幕点歌'}
            </Button>

            <Popover.Root>
              <Popover.Trigger>
                <Button variant="soft" size="2">
                  点歌前缀
                </Button>
              </Popover.Trigger>
              <Popover.Content className="w-50" size="1">
                <Text size="1" color="gray" as="p" mb="2">
                  修改实时生效
                </Text>
                {Object.entries(prefixConfig).map(([source, prefix]) => (
                  <Flex key={source} gap="2" align="center" mb="2">
                    <Text size="1" className="w-18">
                      {MUSIC_SOURCES.find(s => s.value === source)?.label || source}:
                    </Text>
                    <TextField.Root
                      size="1"
                      value={prefix}
                      onChange={e => handlePrefixChange(source, e.target.value)}
                      className="w-18"
                    />
                  </Flex>
                ))}
              </Popover.Content>
            </Popover.Root>

            <Popover.Root open={showBlacklistConfig} onOpenChange={setShowBlacklistConfig}>
              <Popover.Trigger>
                <Button variant="soft" size="2">
                  点歌黑名单
                </Button>
              </Popover.Trigger>
              <Popover.Content className="w-50" size="1">
                <Text size="1" color="gray" as="p" mb="2">
                  关键词(不区分大小写)
                </Text>
                <Flex gap="2" mb="2">
                  <TextField.Root
                    size="1"
                    placeholder="输入关键词"
                    value={newBlacklistItem}
                    onChange={e => setNewBlacklistItem(e.target.value.trim())}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        addToBlacklist();
                      }
                    }}
                  />
                  <Button size="1" onClick={addToBlacklist}>
                    添加
                  </Button>
                </Flex>

                <Text size="1" color="gray" as="p" mb="2">
                  当前黑名单：
                </Text>
                <ScrollArea type="always" scrollbars="vertical" className="max-h-50">
                  {blacklist.length > 0 ? (
                    <Flex direction="column" gap="1">
                      {blacklist.map(keyword => (
                        <Flex
                          key={keyword}
                          justify="between"
                          align="center"
                          className="p-1 mr-2 hover:bg-black/20 rounded"
                        >
                          <Text size="1">{keyword}</Text>
                          <Tooltip content="删除" side="top">
                            <IconButton
                              className="!m-0"
                              variant="ghost"
                              size="2"
                              color="ruby"
                              onClick={() => removeFromBlacklist(keyword)}
                            >
                              <TrashIcon width={14} height={14} />
                            </IconButton>
                          </Tooltip>
                        </Flex>
                      ))}
                    </Flex>
                  ) : (
                    <Text size="1" color="gray">
                      无
                    </Text>
                  )}
                </ScrollArea>
              </Popover.Content>
            </Popover.Root>
          </Flex>
        </Box>

        {/* 搜索区域 */}
        <Flex align="center" className="mb-2">
          <Text size="1" color="gray">
            搜索歌曲
          </Text>
          <Separator orientation="horizontal" className="flex-1 ml-2" />
        </Flex>
        <Box className="flex-1 flex flex-col overflow-hidden">
          <form onSubmit={handleSearch}>
            <Flex gap="2">
              <Select.Root value={searchSource} onValueChange={setSearchSource} size="2">
                <Select.Trigger className="w-30" />
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
                size="2"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
              />
              <Button type="submit" disabled={isSearching} size="2" variant="surface">
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
              {searchResults.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm p-4">
                  歌曲服务由GD音乐台(music.gdstudio.xyz)提供
                </div>
              )}
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default SongRequest;
