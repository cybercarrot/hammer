import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { useSettingStore } from '../store/settingStore';
import { Button, Spinner, TextField, Flex, Text, Separator, Callout, Badge, Box } from '@radix-ui/themes';
import { WebviewTag } from 'electron';

// MARK: 控制台
const ControlPanel: React.FC = () => {
  const { roomId } = useUserStore();
  const webviewRef = useRef<WebviewTag>(null);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const { consoleConnected, setConsoleConnected } = useSettingStore();
  const [localRoomId, setLocalRoomId] = useState<string>(roomId + '');

  // 注入并初始化 event_bridge_settings 的代码
  const injectEventBridgeSettings = useCallback((webview: WebviewTag) => {
    const initScript = `
(function() {
  try {
    const settings = localStorage.getItem('event_bridge_settings');
    if (!settings || settings === 'null') {
      const defaultSettings = { address: 'localhost', port: 9696 };
      localStorage.setItem('event_bridge_settings', JSON.stringify(defaultSettings));
      console.log('已初始化 event_bridge_settings:', defaultSettings);
    } else {
      console.log('event_bridge_settings 已存在:', JSON.parse(settings));
    }
  } catch (error) {
    console.error('初始化 event_bridge_settings 失败:', error);
  }
})();
    `.trim();

    // 立即执行初始化脚本
    webview.executeJavaScript(initScript).catch(console.error);
  }, []);

  // 处理 webview 加载完成事件
  const handleWebviewLoad = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    console.log('控制台webview加载完成');
    setWebviewLoading(false);
    // 注入 event_bridge_settings 初始化代码
    injectEventBridgeSettings(webview);
  }, [injectEventBridgeSettings]);

  // 当 consoleConnected 变为 true 时，设置 webview 事件监听
  useEffect(() => {
    if (!consoleConnected) return;

    const webview = webviewRef.current;
    if (!webview) return;

    webview.addEventListener('did-finish-load', handleWebviewLoad);
    return () => {
      webview.removeEventListener('did-finish-load', handleWebviewLoad);
    };
  }, [consoleConnected, handleWebviewLoad]);

  if (!roomId) {
    return (
      <Callout.Root color="blue" size="1" className="mb-3 !p-2">
        <Callout.Text>
          请先关联账号并在
          <Badge color="indigo" variant="solid" ml="1" mr="1">
            弹幕机
          </Badge>
          中同步设置
        </Callout.Text>
      </Callout.Root>
    );
  }

  // 渲染操作模块
  const renderOperationSection = () => (
    <Box mb="4">
      <Flex align="center" mb="2">
        <Text size="1" color="gray">
          操作
        </Text>
        <Separator orientation="horizontal" className="flex-auto ml-2" />
      </Flex>
      <Flex align="center" gap="2">
        <Text>房间号</Text>
        <TextField.Root
          className="w-24"
          placeholder="房间号"
          value={localRoomId}
          onChange={e => setLocalRoomId(e.target.value)}
        />
        <Button variant="solid" onClick={() => setConsoleConnected(!consoleConnected)} disabled={!localRoomId}>
          打开控制台并连接弹幕
        </Button>
      </Flex>
    </Box>
  );

  // 渲染控制台面板模块
  const renderConsolePanel = () => (
    <Box position="relative" flexGrow="1" className="border rounded-sm [border-color:var(--gray-5)]">
      <webview
        ref={webviewRef}
        src={`https://chat.laplace.live/dashboard/${localRoomId}`}
        className="h-full"
        // @ts-expect-error 官方类型定义有误
        allowpopups="true"
      />
      {webviewLoading && (
        <Flex position="absolute" left="3" top="3" align="center" gap="2">
          <Spinner />
          <Text color="gray">加载控制台中...</Text>
        </Flex>
      )}
    </Box>
  );

  return (
    <Flex direction="column" height="100%">
      {consoleConnected ? renderConsolePanel() : renderOperationSection()}
    </Flex>
  );
};

export default ControlPanel;
