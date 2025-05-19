import React, { useRef, useEffect, useState } from 'react';
import { useUserStore } from '../store/userStore';
import { Button, Flex, Text, Separator, Spinner } from '@radix-ui/themes';
import { WebviewTag } from 'electron';

const ControlPanel: React.FC = () => {
  const { roomId } = useUserStore();
  const webviewRef = useRef<WebviewTag>(null);
  const [webviewLoading, setWebviewLoading] = useState(true);

  // 打开开发者工具
  const openDevTools = () => {
    const webview = webviewRef.current;
    if (webview) {
      webview.openDevTools();
    }
  };

  useEffect(() => {
    // 当webview加载完成后执行相关操作
    const webview = webviewRef.current;

    const handleWebviewLoad = () => {
      console.log('webview加载完成');
      setWebviewLoading(false);
    };

    if (webview) {
      webview.addEventListener('did-finish-load', handleWebviewLoad);
      return () => {
        webview.removeEventListener('did-finish-load', handleWebviewLoad);
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
      {/* 调试模块 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex-shrink-0 mb-4">
          <Flex align="center" className="mb-2">
            <Text size="1" color="gray" weight="medium">
              调试
            </Text>
            <Separator orientation="horizontal" className="flex-1 ml-2" />
          </Flex>
          <Flex gap="2">
            <Button onClick={openDevTools} variant="soft" color="red">
              打开控制台
            </Button>
          </Flex>
        </div>
      )}

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
