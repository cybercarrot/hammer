import React, { useRef, useEffect, useState } from 'react';

interface DanmakuViewerProps {
  url?: string;
}

// 定义HTMLWebViewElement接口
interface HTMLWebViewElement extends HTMLElement {
  src: string;
  allowpopups?: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  reload(): void;
}

// 扩展React的内部类型
interface WebViewHTMLAttributes<T> extends React.HTMLAttributes<T> {
  src?: string;
  allowpopups?: boolean;
}

// 通过模块增强的方式扩展React类型
declare module 'react' {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;
  }
}

const DanmakuViewer: React.FC<DanmakuViewerProps> = ({ url = 'https://chat.laplace.live/' }) => {
  const webviewRef = useRef<HTMLWebViewElement>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>(url);
  const [obsLink, setObsLink] = useState<string>('');
  const [showCopyMessage, setShowCopyMessage] = useState<boolean>(false);

  // 处理房间号变更
  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(e.target.value);
  };

  // 连接到指定房间
  const connectToRoom = () => {
    if (!roomId) return;

    // 构建带有房间号的URL
    const newUrl = `${url}?room=${roomId}`;
    setBaseUrl(newUrl);

    // 设置OBS链接
    setObsLink(`${url}?room=${roomId}&obs=1`);

    // 重新加载webview
    if (webviewRef.current) {
      webviewRef.current.src = newUrl;
      webviewRef.current.reload();
    }

    // 设置连接状态
    setIsConnected(true);
  };

  // 复制OBS链接到剪贴板
  const copyObsLink = () => {
    if (!obsLink) return;

    navigator.clipboard
      .writeText(obsLink)
      .then(() => {
        setShowCopyMessage(true);
        setTimeout(() => {
          setShowCopyMessage(false);
        }, 2000);
      })
      .catch(err => {
        console.error('无法复制链接: ', err);
      });
  };

  useEffect(() => {
    // 当webview加载完成后执行相关操作
    const handleWebviewLoad = () => {
      console.log('Danmaku viewer loaded');
    };

    const webview = webviewRef.current;
    if (webview) {
      webview.addEventListener('did-finish-load', handleWebviewLoad);

      return () => {
        webview.removeEventListener('did-finish-load', handleWebviewLoad);
      };
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-blue-600 text-white p-2 font-medium rounded-t-lg flex justify-between items-center">
        <span>弹幕机</span>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={roomId}
            onChange={handleRoomIdChange}
            placeholder="输入房间号"
            className="px-2 py-1 text-sm rounded text-gray-800 w-32"
          />
          <button
            onClick={connectToRoom}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm hover:bg-gray-100"
          >
            连接
          </button>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
            ></div>
            <span className="text-xs">{isConnected ? '已连接' : '未连接'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* 主弹幕显示区域 */}
        <div className="flex-1 border border-gray-300 overflow-hidden">
          <webview ref={webviewRef} src={baseUrl} className="w-full h-full" allowpopups={true} />
        </div>

        {/* OBS链接区域 */}
        {isConnected && (
          <div className="p-3 bg-gray-100 border-t border-gray-300">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">OBS弹幕机链接:</div>
              <div className="flex items-center">
                <input
                  type="text"
                  value={obsLink}
                  readOnly
                  className="bg-white border border-gray-300 text-sm px-2 py-1 rounded mr-2 w-64"
                />
                <button
                  onClick={copyObsLink}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 relative"
                >
                  复制
                  {showCopyMessage && (
                    <div className="absolute top-full right-0 mt-1 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      已复制到剪贴板
                    </div>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              可以将此链接添加到OBS中作为浏览器源，实现透明背景弹幕效果
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DanmakuViewer;
