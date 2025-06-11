import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { Spinner } from '@radix-ui/themes';
import { WebviewTag } from 'electron';

const ControlPanel: React.FC = () => {
  const { roomId } = useUserStore();
  const webviewRef = useRef<WebviewTag>(null);
  const [webviewLoading, setWebviewLoading] = useState(true);

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

  useEffect(() => {
    const webview = webviewRef.current;

    const handleWebviewLoad = () => {
      console.log('webview加载完成');
      setWebviewLoading(false);
      // 注入 event_bridge_settings 初始化代码
      injectEventBridgeSettings(webview);
    };

    if (webview) {
      webview.addEventListener('did-finish-load', handleWebviewLoad);
      // webview.addEventListener('ipc-message', handleIpcMessage);

      return () => {
        webview.removeEventListener('did-finish-load', handleWebviewLoad);
        // webview.removeEventListener('ipc-message', handleIpcMessage);
      };
    }
  }, []);

  if (!roomId) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md p-4">
          <div className="text-center text-gray-500 my-8">
            <p>请先关联账号</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden relative flex flex-1 flex-col">
        <webview
          ref={webviewRef}
          src={`https://chat.laplace.live/dashboard/${roomId}`}
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
    </div>
  );
};

export default ControlPanel;
