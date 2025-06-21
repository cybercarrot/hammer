import React from 'react';
import { Box, Button, Flex, Separator, Text } from '@radix-ui/themes';

// MARK: 设置
const Settings: React.FC = () => {
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
      <Flex gap="2" align="center">
        <Button size="2" onClick={handleResetWindowSizeAndPosition}>
          重置窗口大小与位置
        </Button>
      </Flex>
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
      <Button size="2" color="red" onClick={handleQuitApp}>
        退出程序
      </Button>
    </Box>
  );

  return (
    <Flex direction="column" height="100%">
      {renderInterfaceControls()}
      {renderOtherControls()}
    </Flex>
  );
};

export default Settings;
