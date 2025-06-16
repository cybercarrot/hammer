import React, { useEffect } from 'react';
import DanmakuViewer from './DanmakuViewer';
import SongRequest from './SongRequest';
import ControlPanel from './ControlPanel';
import Settings from './Settings';
import Tools from './Tools';
import ThemeSwitch from '../components/ThemeSwitch';
import UserProfile from '../components/UserProfile';
import { Badge, Flex, Tabs, Box, Text, Container, Heading } from '@radix-ui/themes';
import packageJson from '../../package.json';
import { useUserStore } from '../store/userStore';

// MARK: 主布局
const MainLayout: React.FC = () => {
  // 获取检查登录状态的方法
  const { checkExistingLogin } = useUserStore();

  // 组件挂载时检查登录状态
  useEffect(() => {
    // 应用启动时验证登录状态
    checkExistingLogin()
      .then(isLoggedIn => {
        console.log('登录状态验证结果:', isLoggedIn);
      })
      .catch(error => {
        console.error('验证登录状态出错:', error);
      });
  }, [checkExistingLogin]);

  return (
    <Tabs.Root defaultValue="danmaku">
      <Flex direction="column" height="100vh">
        {/* 顶部栏 */}
        <Box py="2" px="4" className="shadow-sm">
          <Flex justify="between" align="center">
            <Box>
              <Flex align="baseline" gap="2">
                <Heading color="crimson">锤子</Heading>
                <Text size="2" color="gray">
                  bilibili直播助手
                </Text>
              </Flex>
            </Box>

            {/* 标签切换放在顶部栏中间 */}
            <Box style={{ position: 'relative', top: '8px' }}>
              <Tabs.List color="ruby" size="2">
                <Tabs.Trigger value="danmaku">弹幕机</Tabs.Trigger>
                <Tabs.Trigger value="control">控制台</Tabs.Trigger>
                <Tabs.Trigger value="song">点歌机</Tabs.Trigger>
                <Tabs.Trigger value="tools">小工具</Tabs.Trigger>
                <Tabs.Trigger value="settings">设置</Tabs.Trigger>
              </Tabs.List>
            </Box>

            <Flex align="center">
              <UserProfile />
              <ThemeSwitch />
            </Flex>
          </Flex>
        </Box>

        {/* 内容区域 */}
        <Box p="2" style={{ overflow: 'auto', flexGrow: 1 }}>
          <Tabs.Content value="danmaku" className="h-full data-[state=inactive]:hidden" forceMount>
            <Container size="4" height="100%" className="h-full">
              <DanmakuViewer />
            </Container>
          </Tabs.Content>
          <Tabs.Content value="control" className="h-full data-[state=inactive]:hidden" forceMount>
            <Container size="4" height="100%" className="h-full">
              <ControlPanel />
            </Container>
          </Tabs.Content>
          <Tabs.Content value="song" className="h-full data-[state=inactive]:hidden" forceMount>
            <Container size="4" height="100%" className="h-full">
              <SongRequest />
            </Container>
          </Tabs.Content>
          <Tabs.Content value="tools" className="h-full data-[state=inactive]:hidden" forceMount>
            <Container size="4" height="100%" className="h-full">
              <Tools />
            </Container>
          </Tabs.Content>
          <Tabs.Content value="settings" className="h-full data-[state=inactive]:hidden" forceMount>
            <Container size="4" height="100%" className="h-full">
              <Settings />
            </Container>
          </Tabs.Content>
        </Box>

        {/* 底部栏 */}
        <Box py="2" px="4" className="shadow-sm border-t" style={{ borderColor: 'var(--gray-5)' }}>
          <Flex justify="end">
            <Flex gap="2" align="center">
              <Badge variant="solid" color="jade">
                v{packageJson.version}
              </Badge>
              <Badge variant="solid" color="crimson">
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
