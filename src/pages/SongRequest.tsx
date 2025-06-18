import React, { useEffect, useRef, useState } from 'react';
import { useGetState } from 'ahooks';
import { useToast } from '../context/ToastContext';
import { useSongStore, Song, MUSIC_SOURCES, MusicSourceValue } from '../store/songStore';
import { useSettingStore } from '../store/settingStore';
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
  BadgeProps,
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

// MARK: 点歌机
const SongRequest: React.FC = () => {
  const { showToast } = useToast();

  // 播放器
  const playerRef = useRef<APlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'default'>('default');

  // 点歌列表
  const [requestPlaylist, setRequestPlaylist, getRequestPlaylist] = useGetState<Song[]>([]);

  // 默认播放歌单和索引
  const {
    defaultPlaylist,
    getDefaultPlaylist,
    defaultPlaylistIndex,
    getDefaultPlaylistIndex,
    setDefaultPlaylistIndex,
  } = useSongStore();

  // 当前播放的歌曲
  const [, setCurrentSong, getCurrentSong] = useGetState<Song | null>(null);
  // 播放历史
  const [playHistory, setPlayHistory] = useState<Song[]>([]);

  // 弹幕连接
  const clientRef = useRef<LaplaceEventBridgeClient | null>(null);
  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  >('disconnected');

  // 前缀配置
  const { prefixConfig, updatePrefixConfig, getPrefixConfig } = useSettingStore();

  // 黑名单关键词配置
  const { blacklist, addToBlacklist, removeFromBlacklist, hasBlacklistedKeyword } =
    useSettingStore();
  const [newBlacklistItem, setNewBlacklistItem] = useState('');

  // 歌曲搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('netease');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingSongInfo, setIsGettingSongInfo] = useState(false);

  // 添加歌曲到点歌列表
  const addSongToRequestPlaylist = (_song: Song, top = false) => {
    const song = {
      ..._song,
      requester: _song.requester || '[系统]',
    };
    setRequestPlaylist(prev => (top ? [song, ...prev] : [...prev, song]));
  };

  // 从点歌列表中移除歌曲
  const removeSongFromRequestPlaylist = (index: number) => {
    setRequestPlaylist(prev => prev.filter((_, i) => i !== index));
  };

  // 添加到播放历史
  const addToPlayHistory = (song: Song) => {
    setPlayHistory(prev => {
      // 添加到开头并限制最多20条
      return [song, ...prev].slice(0, 20);
    });
  };

  // 播放下一首
  const playNextSong = async (justLoad = false) => {
    // 需要异步一下，防止 requestPlaylist 还未更新
    await Promise.resolve();
    const currentRequestPlaylist = getRequestPlaylist();
    const currentDefaultPlaylist = getDefaultPlaylist();
    const currentSong = getCurrentSong();
    let nextSong: Song | null = null;

    // 将当前播放的歌曲添加到历史记录
    if (currentSong) {
      addToPlayHistory(currentSong);
    }

    // 获取下一首歌曲
    if (currentRequestPlaylist.length > 0) {
      // 从点歌列表获取下一首
      nextSong = currentRequestPlaylist[0];
      setRequestPlaylist(currentRequestPlaylist.slice(1));
    } else if (currentDefaultPlaylist.length > 0) {
      // 从默认歌单获取下一首
      const currentIndex = getDefaultPlaylistIndex();
      const nextIndex = (currentIndex + 1) % currentDefaultPlaylist.length;
      nextSong = currentDefaultPlaylist[nextIndex];
      setDefaultPlaylistIndex(nextIndex);
      setActiveTab('default');
    }

    // 检查是否还有歌曲可播
    if (!nextSong) {
      showToast('播放列表为空', 'info');
      setCurrentSong(null);
      return;
    }

    // 更新当前播放歌曲
    setCurrentSong(nextSong);

    // 获取播放链接并播放
    setIsGettingSongInfo(true);
    getSongInfo(nextSong)
      .then(songInfo => {
        if (playerRef.current) {
          playerRef.current.list.clear();
          playerRef.current.list.add(songInfo);
          if (!justLoad) {
            playerRef.current.play();
          }
        }
        setIsGettingSongInfo(false);
      })
      .catch(error => {
        console.error('获取歌曲信息失败:', error);
        showToast('获取歌曲信息失败', 'error');
        setIsGettingSongInfo(false);
      });
  };

  // 开关弹幕点歌
  const { consoleConnected, setConsoleConnected } = useSettingStore();
  const handleToggleDanmu = async () => {
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

    // 如果控制台弹幕未连接，则自动开启
    if (!consoleConnected) {
      setConsoleConnected(true);
      showToast('已自动开启控制台弹幕连接', 'info');
    }

    // 如果未连接，则创建新的客户端实例
    const client = new LaplaceEventBridgeClient({
      url: 'ws://localhost:9696',
      token: '',
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 0,
    });
    // TODO: 判断控制台的弹幕连接有无开启，如果未开启，则自动开启

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

  // 搜索歌曲
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
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

  // 处理弹幕点歌
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
        addSongToRequestPlaylist(song);
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

  // 添加黑名单关键词
  const handleAddToBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlacklistItem) {
      return;
    }
    if (blacklist.includes(newBlacklistItem)) {
      showToast('关键词已存在', 'error');
      return;
    }
    addToBlacklist(newBlacklistItem);
    setNewBlacklistItem('');
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
        addSongToRequestPlaylist(defaultPlaylist[defaultPlaylistIndex]);
        playNextSong(true);
      }
    }

    // 清理函数
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // 渲染播放器区域
  const renderPlayer = () => (
    <Box mb="2">
      <Flex align="center" mb="2">
        <Text size="1" color="gray">
          播放器
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>
      <Box position="relative">
        {isGettingSongInfo && (
          <Flex
            position="absolute"
            align="center"
            justify="center"
            width="100%"
            height="100%"
            className="z-1 bg-black/50"
          >
            <Spinner size="3" />
          </Flex>
        )}
        <Box ref={playerContainerRef} className="!m-0" />
      </Box>
    </Box>
  );

  // 渲染点歌播放列表项
  const renderRequestPlaylistItem = (song: Song, index: number) => (
    <Flex
      position="relative"
      align="center"
      p="2"
      className="group border-b [border-color:var(--gray-5)]"
      gap="2"
      key={`req-${index}`}
    >
      <Text className="flex-2" size="2" truncate>
        {song.name}
      </Text>
      <Text className="flex-1" color="gray" size="1" truncate>
        {Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist}
      </Text>
      <Text className="flex-1" color="gray" size="1" truncate>
        {song.requester}
      </Text>
      <Box
        position="absolute"
        right="3"
        className="hidden! group-hover:flex! group-hover:[background-color:var(--gray-5)] rounded"
      >
        <Tooltip content="立即播放" side="top">
          <IconButton
            className="!m-0"
            variant="ghost"
            size="2"
            color="ruby"
            onClick={async () => {
              removeSongFromRequestPlaylist(index);
              addSongToRequestPlaylist(song, true);
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
      </Box>
    </Flex>
  );

  // 渲染默认播放歌单项
  const renderDefaultPlaylistItem = (song: Song, index: number) => {
    const isCurrent = index === defaultPlaylistIndex;
    return (
      <Flex
        position="relative"
        align="center"
        p="2"
        className="group border-b [border-color:var(--gray-5)]"
        gap="2"
        key={`req-${index}`}
      >
        {isCurrent && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#ff92ad]"></div>}
        <Text className="flex-2" size="2" truncate>
          {song.name}
        </Text>
        <Text className="flex-1" color="gray" size="1" truncate>
          {Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist}
        </Text>
        <Box
          position="absolute"
          right="3"
          className="hidden! group-hover:flex! group-hover:[background-color:var(--gray-5)] rounded"
        >
          <Tooltip content="立即播放" side="top">
            <IconButton
              className="!m-0"
              variant="ghost"
              size="2"
              color="ruby"
              onClick={() => {
                addSongToRequestPlaylist(song, true);
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
        </Box>
      </Flex>
    );
  };

  // 渲染播放历史项
  const renderPlayHistoryItem = (song: Song, index: number) => (
    <Flex
      position="relative"
      align="center"
      p="2"
      className="group border-b [border-color:var(--gray-5)]"
      gap="2"
      key={`history-${index}`}
    >
      <Text className="flex-2" size="2" truncate>
        {song.name}
      </Text>
      <Text className="flex-1" color="gray" size="1" truncate>
        {Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist}
      </Text>
      <Box
        position="absolute"
        right="3"
        className="hidden! group-hover:flex! group-hover:[background-color:var(--gray-5)] rounded"
      >
        <Tooltip content="立即播放" side="top">
          <IconButton
            className="!m-0"
            variant="ghost"
            size="2"
            color="ruby"
            onClick={() => {
              addSongToRequestPlaylist(song, true);
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
      </Box>
    </Flex>
  );

  // 渲染播放列表标签页
  const renderPlaylistTabs = () => (
    <Tabs.Root
      className="flex-auto flex flex-col"
      value={activeTab}
      // @ts-expect-error onValueChange类型不匹配
      onValueChange={setActiveTab}
    >
      <Tabs.List color="ruby" size="1">
        <Tabs.Trigger value="request">点歌列表({requestPlaylist.length})</Tabs.Trigger>
        <Tabs.Trigger value="default">固定歌单({defaultPlaylist.length})</Tabs.Trigger>
        <Tabs.Trigger value="history">播放历史({playHistory.length})</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="request" className="flex-auto h-0">
        <ScrollArea type="auto" scrollbars="vertical">
          {requestPlaylist.length > 0 ? (
            requestPlaylist.map((song, index) => renderRequestPlaylistItem(song, index))
          ) : (
            <Text as="p" align="center" color="gray" size="2" className="p-4">
              点歌列表为空
            </Text>
          )}
        </ScrollArea>
      </Tabs.Content>

      <Tabs.Content value="default" className="flex-auto h-0">
        <ScrollArea type="auto" scrollbars="vertical">
          {defaultPlaylist.length > 0 ? (
            defaultPlaylist.map((song, index) => renderDefaultPlaylistItem(song, index))
          ) : (
            <Text as="p" align="center" color="gray" size="2" className="p-4">
              固定歌单为空
            </Text>
          )}
        </ScrollArea>
      </Tabs.Content>

      <Tabs.Content value="history" className="flex-auto h-0">
        <ScrollArea type="auto" scrollbars="vertical">
          {playHistory.length > 0 ? (
            playHistory.map((song, index) => renderPlayHistoryItem(song, index))
          ) : (
            <Text as="p" align="center" color="gray" size="2" className="p-4">
              暂无播放历史
            </Text>
          )}
        </ScrollArea>
      </Tabs.Content>
    </Tabs.Root>
  );

  // 渲染控制按钮区域
  const renderControls = () => (
    <Box className="mb-4">
      <Flex align="center" mb="2">
        <Text size="1" color="gray">
          操作
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>
      <Flex gap="2" align="center">
        {/* 弹幕点歌状态 */}
        <Badge
          color={
            {
              connected: 'green',
              disconnected: 'red',
              reconnecting: 'gray',
              connecting: 'gray',
            }[connectionState] as BadgeProps['color']
          }
          variant="soft"
          size="3"
        >
          状态：
          {
            {
              connected: '已开启',
              disconnected: '未开启',
              reconnecting: '开启中',
              connecting: '开启中',
            }[connectionState]
          }
        </Badge>
        {/* 开关弹幕点歌 */}
        <Tooltip content="如未开启控制台弹幕连接，将同时开启" side="top">
          <Button
            size="2"
            color={connectionState === 'connected' ? 'red' : 'indigo'}
            onClick={handleToggleDanmu}
            disabled={connectionState === 'connecting' || connectionState === 'reconnecting'}
          >
            {connectionState === 'connected' ? '关闭弹幕点歌' : '开启弹幕点歌'}
          </Button>
        </Tooltip>

        {/* 点歌前缀配置 */}
        <Popover.Root>
          <Popover.Trigger>
            <Button variant="soft" size="2">
              点歌前缀
            </Button>
          </Popover.Trigger>
          <Popover.Content className="w-48" size="1">
            <Text size="1" color="gray" as="p" mb="2">
              修改实时生效
            </Text>
            {Object.entries(prefixConfig).map(([source, prefix]: [MusicSourceValue, string]) => (
              <Flex key={source} gap="2" align="center" mb="2">
                <Text size="2" className="w-24">
                  {MUSIC_SOURCES.find(s => s.value === source)?.label || source}:
                </Text>
                <TextField.Root
                  size="2"
                  value={prefix}
                  onChange={e => updatePrefixConfig(source, e.target.value)}
                  className="w-16"
                />
              </Flex>
            ))}
          </Popover.Content>
        </Popover.Root>

        {/* 点歌黑名单配置 */}
        <Popover.Root>
          <Popover.Trigger>
            <Button variant="soft" size="2">
              点歌黑名单
            </Button>
          </Popover.Trigger>
          <Popover.Content className="w-48" size="1">
            <Text size="1" color="gray" as="p" mb="2">
              关键词(不区分大小写)
            </Text>
            <form onSubmit={handleAddToBlacklist} className="flex gap-2 mb-2">
              <TextField.Root
                size="2"
                placeholder="输入关键词"
                value={newBlacklistItem}
                onChange={e => setNewBlacklistItem(e.target.value.trim())}
              />
              <Button size="2" type="submit">
                添加
              </Button>
            </form>

            <Text size="2" color="gray" as="p">
              当前黑名单：
            </Text>
            <ScrollArea type="auto" scrollbars="vertical" className="max-h-50">
              {blacklist.length > 0 ? (
                <Flex direction="column">
                  {blacklist.map(keyword => (
                    <Flex
                      key={keyword}
                      justify="between"
                      align="center"
                      className="pt-1 pb-1 border-b [border-color:var(--gray-5)]"
                    >
                      <Text size="2">{keyword}</Text>
                      <Tooltip content="删除" side="top">
                        <IconButton
                          className="!m-0 !mr-3"
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
                <Text size="2" color="gray">
                  无
                </Text>
              )}
            </ScrollArea>
          </Popover.Content>
        </Popover.Root>
      </Flex>
    </Box>
  );

  // 渲染搜索区域
  const renderSearchSection = () => (
    <Flex direction="column" className="flex-auto h-0">
      <Flex align="center" className="mb-2">
        <Text size="1" color="gray">
          搜索歌曲
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>
      <form onSubmit={handleSearch} className="flex gap-2">
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
          className="flex-auto"
          placeholder="搜索歌曲、歌手或专辑"
          value={searchQuery}
          size="2"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value.trim())
          }
        />
        <Button type="submit" disabled={isSearching} size="2" variant="surface">
          <MagnifyingGlassIcon />
          {isSearching ? '搜索中...' : '搜索'}
        </Button>
      </form>
      {renderSearchResults()}
    </Flex>
  );

  // 渲染搜索结果
  const renderSearchResults = () => (
    <ScrollArea type="auto" scrollbars="vertical">
      {searchResults.map(song => (
        <Flex
          position="relative"
          align="center"
          p="2"
          className="group border-b [border-color:var(--gray-5)]"
          gap="2"
          key={`${song.source}-${song.id}`}
        >
          <Text className="flex-2" size="2" truncate>
            {song.name}
          </Text>
          <Text className="flex-1" color="gray" size="1" truncate>
            {Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist}
          </Text>
          <Text className="flex-1" color="gray" size="1" truncate>
            {song.album}
          </Text>
          <Box
            position="absolute"
            right="3"
            className="hidden! group-hover:flex! group-hover:[background-color:var(--gray-5)] rounded"
          >
            <Tooltip content="立即播放" side="top">
              <IconButton
                className="!m-0"
                variant="ghost"
                size="2"
                color="ruby"
                onClick={() => {
                  addSongToRequestPlaylist(song, true);
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
          </Box>
        </Flex>
      ))}
      {searchResults.length === 0 && (
        <Text size="2" align="center" color="gray" as="p" className="p-4">
          歌曲服务由GD音乐台(music.gdstudio.xyz)提供
        </Text>
      )}
    </ScrollArea>
  );

  return (
    <Flex height="100%" maxHeight="100%" gap="2">
      {/* 左侧：播放区域 */}
      <Flex direction="column" className="flex-2">
        {renderPlayer()}
        {renderPlaylistTabs()}
      </Flex>

      {/* 右侧：操作区域 */}
      <Flex direction="column" className="flex-3">
        {renderControls()}
        {renderSearchSection()}
      </Flex>
    </Flex>
  );
};

export default SongRequest;
