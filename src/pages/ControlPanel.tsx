import React, { useRef, useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { Spinner } from '@radix-ui/themes';
import { WebviewTag } from 'electron';

const ControlPanel: React.FC = () => {
  const { roomId } = useUserStore();
  const webviewRef = useRef<WebviewTag>(null);
  const [webviewLoading, setWebviewLoading] = useState(true);

  useEffect(() => {
    // 当webview加载完成后执行相关操作
    const webview = webviewRef.current;

    const handleWebviewLoad = () => {
      console.log('webview加载完成');
      setWebviewLoading(false);
    };

    const handleIpcMessage = (event: Electron.IpcMessageEvent) => {
      switch (event.channel) {
        case 'send':
          console.log('send:', event.args[0]);
          break;
        case 'message':
          console.log('message:', event.args[0]);
          break;
      }
    };

    if (webview) {
      webview.addEventListener('did-finish-load', handleWebviewLoad);
      webview.addEventListener('ipc-message', handleIpcMessage);

      return () => {
        webview.removeEventListener('did-finish-load', handleWebviewLoad);
        webview.removeEventListener('ipc-message', handleIpcMessage);
      };
    }
  }, []);

  if (!roomId) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 border border-gray-300 rounded-lg p-4">
          <div className="text-center text-gray-500 my-8">
            <p>请先关联账号</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="border border-gray-300 rounded-lg overflow-hidden relative flex flex-1 flex-col">
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
