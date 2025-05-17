import React, { useRef, useEffect, useState } from 'react';
import { Button, TextField, Card, Flex, Text, Spinner } from '@radix-ui/themes';
import shortUuid from 'short-uuid';
import { ConfigProps, uploadCookies } from '../utils/cookies';
import { WebviewTag } from 'electron';
import { useToast } from '../context/ToastContext';

interface DanmakuViewerProps {
  url?: string;
}

// 本地存储键名
const STORAGE_KEY = 'COOKIE_SYNC_SETTINGS';

// 初始化配置或从localStorage加载
const getInitialConfig = (): ConfigProps => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }

  // 默认配置
  return {
    password: shortUuid.generate(),
    uuid: shortUuid.generate(),
  };
};

const DanmakuViewer: React.FC<DanmakuViewerProps> = ({ url = 'https://chat.laplace.live/' }) => {
  const webviewRef = useRef<WebviewTag>(null);
  const [configData, setConfigData] = useState<ConfigProps>(getInitialConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const { showToast } = useToast();

  // 合并的token字符串
  const mergedToken = `${configData.uuid}@${configData.password}`;

  // 设置token到webview中的输入框
  const setSyncToken = (token: string) => {
    const webview = webviewRef.current;
    if (webview) {
      // 直接调用React的onChange方法
      const scriptToExecute = `
        {
          const tokenInput = document.getElementById('laplace-login-sync-token-input');
          if (tokenInput) {
            // 设置值
            tokenInput.value = "${token}";
            
            // 查找React属性并触发onChange
            const reactPropsKey = Object.keys(tokenInput).find(key => key.startsWith('__reactProps$'));
            if (reactPropsKey) {
              const reactProps = tokenInput[reactPropsKey];
              if (reactProps && reactProps.onChange) {
                // 创建一个合成事件对象
                const syntheticEvent = {
                  currentTarget: tokenInput,
                };
                // 调用React的onChange处理函数
                reactProps.onChange(syntheticEvent);
              }
            }
          }
        }
      `;

      webview
        .executeJavaScript(scriptToExecute)
        .catch(err => console.error('Error setting token:', err));
    }
  };

  // 直接设置token到弹幕机
  const setTokenToDanmaku = (text: string) => {
    setSyncToken(text);
    showToast('已设置同步密钥到LAPLACE', 'success');
  };

  // 同步cookie
  const handleUploadCookies = async () => {
    setIsLoading(true);
    try {
      console.log('开始上传Cookie数据, 配置:', configData);

      const result = await uploadCookies(configData);

      console.log('上传结果:', result);

      showToast(result.message, result.success ? 'success' : 'error');

      // 如果同步成功，则设置token到弹幕查看器
      if (result.success) {
        setTokenToDanmaku(mergedToken);
        console.log('已发送token到弹幕机', mergedToken);
      }
    } catch (error) {
      console.error('上传过程中出错:', error);
      showToast(`上传失败: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成新的IDs
  const generateNewIds = () => {
    setConfigData(prev => ({
      ...prev,
      uuid: shortUuid.generate(),
      password: shortUuid.generate(),
    }));
  };

  useEffect(() => {
    // 每次配置变更时自动保存
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configData));
    } catch (error) {
      console.error('自动保存配置失败:', error);
    }
  }, [configData]);

  useEffect(() => {
    // 当webview加载完成后执行相关操作
    const handleWebviewLoad = () => {
      console.log('webview加载完成');
      setWebviewLoading(false);
      if (process.env.NODE_ENV === 'development') {
        webview.openDevTools();
      }
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
      {/* 登录态同步区域 */}
      <Card className="mb-4 p-3">
        <Flex direction="row" gap="2" align="center">
          <TextField.Root placeholder="用户密钥" value={mergedToken} readOnly className="flex-1" />
          {/* 先隐藏设置按钮节省空间，后续看设计可以展示 */}
          <Button onClick={() => setTokenToDanmaku(mergedToken)} disabled={isLoading}>
            设置到弹幕机
          </Button>
          <Button onClick={handleUploadCookies} variant="solid" disabled={isLoading}>
            <Spinner size="1" loading={isLoading} />
            {isLoading ? '同步中' : '同步登录状态'}
          </Button>
          <Button variant="soft" color="red" onClick={generateNewIds}>
            换密钥
          </Button>
        </Flex>
      </Card>

      <div className="flex-1 flex flex-col">
        {/* 主弹幕显示区域 */}
        <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden relative">
          <webview ref={webviewRef} src={url} style={{ minHeight: '800px' }} />
          {webviewLoading && (
            <div className="absolute top-2 left-2 px-3 py-2 flex items-center gap-2">
              <Spinner size="1" />
              <span>加载中</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DanmakuViewer;
