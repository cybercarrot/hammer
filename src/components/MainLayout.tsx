import React from 'react';
import DanmakuViewer from './DanmakuViewer';
import SongRequest from './SongRequest';
import ControlPanel from './ControlPanel';
import Settings from './Settings';
import ThemeSwitch from './ThemeSwitch';
import UserProfileSection from './UserProfileSection';
import { useLoginStore } from '../store/loginStore';
import { Badge, Flex, Tabs, Box, Text, Container } from '@radix-ui/themes';
import packageJson from '../../package.json';

type TabType = 'danmaku' | 'song' | 'control' | 'settings';

const MainLayout: React.FC = () => {
  const { isLoggedIn } = useLoginStore();

  return (
    <Tabs.Root defaultValue="danmaku">
      <Flex direction="column" height="100vh">
        {/* 顶部栏 */}
        <Box py="2" px="4" className="shadow-sm">
          <Flex justify="between" align="center">
            <Box>
              <Flex align="baseline" gap="2">
                <h1 className="text-xl font-bold">大锤</h1>
                <Text size="2" color="gray">
                  bilibili直播助手
                </Text>
              </Flex>
            </Box>

            {/* 标签切换放在顶部栏中间 */}
            <Box style={{ position: 'relative', top: '8px' }}>
              <Tabs.List color="blue" size="2">
                <Tabs.Trigger value="danmaku">弹幕机</Tabs.Trigger>
                <Tabs.Trigger value="song">点歌机</Tabs.Trigger>
                <Tabs.Trigger value="control">控制台</Tabs.Trigger>
                <Tabs.Trigger value="settings">设置</Tabs.Trigger>
              </Tabs.List>
            </Box>

            <Flex gap="4" align="center">
              <UserProfileSection />
              <ThemeSwitch />
            </Flex>
          </Flex>
        </Box>

        {/* 内容区域 */}
        <Box p="4" style={{ overflow: 'auto', flexGrow: 1 }}>
          <Tabs.Content value="danmaku">
            <Container size="4">
              <DanmakuViewer />
            </Container>
          </Tabs.Content>
          <Tabs.Content value="song">
            <Container size="4">
              <SongRequest />
            </Container>
          </Tabs.Content>
          <Tabs.Content value="control">
            <Container size="4">
              <ControlPanel />
            </Container>
          </Tabs.Content>
          <Tabs.Content value="settings">
            <Container size="4">
              <Settings />
            </Container>
          </Tabs.Content>
        </Box>

        {/* 底部栏 */}
        <Box py="2" px="4" className="shadow-sm border-t" style={{ borderColor: 'var(--gray-5)' }}>
          <Flex justify="end">
            <Flex gap="2" align="center">
              <Badge variant="solid" color="blue">
                v{packageJson.version}
              </Badge>
              <Badge variant="solid" color="pink">
                by 阿酒
              </Badge>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Tabs.Root>
  );
};

export default MainLayout;
