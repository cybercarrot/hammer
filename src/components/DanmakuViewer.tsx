import React, { useRef, useEffect } from 'react';

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
      <div className="flex-1 flex flex-col">
        {/* 主弹幕显示区域 */}
        <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
          <webview ref={webviewRef} src={url} className="w-full h-full" allowpopups={true} />
        </div>
      </div>
    </div>
  );
};

export default DanmakuViewer;
