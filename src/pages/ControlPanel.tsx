import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUserStore } from '../store/userStore';
import {
  Button,
  Spinner,
  TextField,
  Flex,
  Text,
  Separator,
  Callout,
  Badge,
} from '@radix-ui/themes';
import { WebviewTag } from 'electron';

// MARK: 控制台
const ControlPanel: React.FC = () => {
  const { roomId } = useUserStore();
  const webviewRef = useRef<WebviewTag>(null);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const [showWebview, setShowWebview] = useState(false);
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

  // 当 showWebview 变为 true 时，设置 webview 事件监听
  useEffect(() => {
    if (!showWebview) return;

    const webview = webviewRef.current;
    if (!webview) return;

    webview.addEventListener('did-finish-load', handleWebviewLoad);
    return () => {
      webview.removeEventListener('did-finish-load', handleWebviewLoad);
    };
  }, [showWebview, handleWebviewLoad]);

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

  return (
    <div className="w-full h-full flex flex-col">
      {!showWebview && (
        <div className="mb-4">
          <Flex align="center" className="mb-2">
            <Text size="1" color="gray" weight="medium">
              操作
            </Text>
            <Separator orientation="horizontal" className="flex-1 ml-2" />
          </Flex>
          <div className="flex gap-2 items-center">
            <div className="w-24">
              <TextField.Root
                placeholder="房间号"
                value={localRoomId}
                onChange={e => setLocalRoomId(e.target.value)}
              />
            </div>
            <Button
              variant="solid"
              size="2"
              onClick={() => setShowWebview(true)}
              disabled={!localRoomId}
            >
              连接弹幕并打开控制台
            </Button>
          </div>
        </div>
      )}
      {showWebview && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden relative flex-1 flex flex-col">
          <webview
            ref={webviewRef}
            src={`https://chat.laplace.live/dashboard/${localRoomId}`}
            className="w-full h-full"
            style={{ flex: '1 1 auto', minHeight: '0' }}
            // @ts-expect-error 官方类型定义有误
            allowpopups="true"
          />
          {webviewLoading && (
            <div className="absolute top-2 left-2 px-3 py-2 flex items-center gap-2">
              <Spinner size="1" />
              <span>加载控制台中...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
