import React from 'react';
import { Box, Button, Flex, Separator, Text, Checkbox } from '@radix-ui/themes';
import { useSettingStore } from '../store/settingStore';
import VersionManager from '../components/VersionManager';

// MARK: 设置
const Settings: React.FC = () => {
  const { contentProtection, setMainWindowContentProtection, setChatOverlayWindowContentProtection } =
    useSettingStore();

  // MARK: 重置窗口大小与位置
  const handleResetWindowSizeAndPosition = async () => {
    try {
      const result = await window.electron.window.resetSizeAndPosition();
      if (result.success) {
        console.log('窗口大小与位置重置成功');
      } else {
        console.error('重置失败:', result.error);
      }
    } catch (error) {
      console.error('重置窗口大小与位置时出错:', error);
    }
  };

  // MARK: 设置主窗口内容保护
  const handleMainWindowContentProtectionChange = async (enabled: boolean) => {
    try {
      const result = await window.electron.window.setContentProtection(enabled);
      if (result.success) {
        setMainWindowContentProtection(enabled);
        console.log('主窗口内容保护设置成功:', enabled);
      } else {
        console.error('设置主窗口内容保护失败:', result.error);
      }
    } catch (error) {
      console.error('设置主窗口内容保护时出错:', error);
    }
  };

  // MARK: 设置弹幕浮层窗口内容保护
  const handleChatOverlayWindowContentProtectionChange = async (enabled: boolean) => {
    try {
      // 先更新设置值
      setChatOverlayWindowContentProtection(enabled);

      // 尝试设置浮层窗口内容保护（如果浮层窗口存在的话）
      const result = await window.electron.chatOverlay.setContentProtection(enabled);
      if (result.success) {
        console.log('弹幕浮层窗口内容保护设置成功:', enabled);
      } else {
        // 如果浮层窗口不存在，这是正常情况，不需要报错
        if (result.error && result.error.includes('not found')) {
          console.log('弹幕浮层窗口未创建，设置已保存，将在窗口创建时应用');
        } else {
          console.error('设置弹幕浮层窗口内容保护失败:', result.error);
        }
      }
    } catch (error) {
      console.error('设置弹幕浮层窗口内容保护时出错:', error);
    }
  };

  // MARK: 退出程序
  const handleQuitApp = () => {
    try {
      window.electron.app.quit();
    } catch (error) {
      console.error('退出程序时出错:', error);
    }
  };

  // MARK: 渲染界面控制区域
  const renderInterfaceControls = () => (
    <Box className="mb-4">
      <Flex align="center" mb="2">
        <Text size="1" color="gray">
          界面配置
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>
      <Flex direction="column" gap="2" align="start">
        <Button size="1" variant="soft" onClick={handleResetWindowSizeAndPosition}>
          重置主窗口大小位置
        </Button>
        <Text as="label" size="2" className="flex-none">
          <Checkbox
            className="mr-2!"
            checked={contentProtection.mainWindow}
            onCheckedChange={handleMainWindowContentProtectionChange}
          />
          在屏幕采集中隐藏主窗口
        </Text>
        <Text as="label" size="2">
          <Checkbox
            className="mr-2!"
            checked={contentProtection.chatOverlayWindow}
            onCheckedChange={handleChatOverlayWindowContentProtectionChange}
          />
          在屏幕采集中隐藏弹幕浮层窗口
        </Text>
      </Flex>
    </Box>
  );

  // MARK: 渲染版本管理区域
  const renderVersionControls = () => (
    <Box className="mb-4">
      <Flex align="center" mb="2">
        <Text size="1" color="gray">
          版本管理
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>
      <VersionManager />
    </Box>
  );

  // MARK: 渲染其他区域
  const renderOtherControls = () => (
    <Box className="mb-4">
      <Flex align="center" mb="2">
        <Text size="1" color="gray">
          其他
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>
      <Button size="2" variant="soft" color="red" onClick={handleQuitApp}>
        退出程序
      </Button>
    </Box>
  );

  return (
    <Flex direction="column" height="100%">
      {renderInterfaceControls()}
      {renderVersionControls()}
      {renderOtherControls()}
    </Flex>
  );
};

export default Settings;
