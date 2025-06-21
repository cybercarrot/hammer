import React, { useEffect } from 'react';
import DanmakuViewer from './DanmakuViewer';
import SongRequest from './SongRequest';
import ControlPanel from './ControlPanel';
import Settings from './Settings';
import Tools from './Tools';
import ThemeSwitch from '../components/ThemeSwitch';
import UserProfile from '../components/UserProfile';
import { Badge, Flex, Tabs, Box, Text, Container, Heading } from '@radix-ui/themes';
import packageJson from '../../../package.json';
import { useUserStore } from '../store/userStore';
import { useSettingStore } from '../store/settingStore';

// MARK: 主布局
const MainLayout: React.FC = () => {
  // 获取检查登录状态的方法
  const { isLoggedIn, refreshUserData } = useUserStore();
  // 获取当前选中的tab和设置方法
  const { currentTab, setCurrentTab } = useSettingStore();

  // 组件挂载时检查登录状态
  useEffect(() => {
    // 应用启动时验证登录状态
    if (isLoggedIn) {
      refreshUserData()
        .then(() => {
          console.log('更新用户信息');
        })
        .catch(error => {
          console.error('验证登录状态出错:', error);
        });
    }
  }, []);

  return (
    <Tabs.Root value={currentTab} onValueChange={setCurrentTab}>
      <Flex direction="column" height="100vh">
        {/* 顶部栏 */}
        <Box p="2" className="shadow-sm">
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
            <Box className="relative top-2">
              <Tabs.List color="ruby" size="2">
                <Tabs.Trigger value="danmaku">弹幕机</Tabs.Trigger>
                <Tabs.Trigger value="control">控制台</Tabs.Trigger>
                <Tabs.Trigger value="song">点歌机</Tabs.Trigger>
                <Tabs.Trigger value="tools">小工具</Tabs.Trigger>
                <Tabs.Trigger value="settings">其他设置</Tabs.Trigger>
              </Tabs.List>
            </Box>

            <Flex align="center">
              <UserProfile />
              <ThemeSwitch />
            </Flex>
          </Flex>
        </Box>

        {/* 内容区域 */}
        <Container p="2" size="4" height="100%">
          <Tabs.Content value="danmaku" className="h-full data-[state=inactive]:hidden" forceMount>
            <DanmakuViewer />
          </Tabs.Content>
          <Tabs.Content value="control" className="h-full data-[state=inactive]:hidden" forceMount>
            <ControlPanel />
          </Tabs.Content>
          <Tabs.Content value="song" className="h-full data-[state=inactive]:hidden" forceMount>
            <SongRequest />
          </Tabs.Content>
          <Tabs.Content value="tools" className="h-full data-[state=inactive]:hidden" forceMount>
            <Tools />
          </Tabs.Content>
          <Tabs.Content value="settings" className="h-full data-[state=inactive]:hidden" forceMount>
            <Settings />
          </Tabs.Content>
        </Container>

        {/* 底部栏 */}
        <Box p="2" className="border-t [border-color:var(--gray-5)]">
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
