import React, { useRef, useEffect, useState } from 'react';
import {
  Button,
  TextField,
  Flex,
  Text,
  Spinner,
  Callout,
  Badge,
  Separator,
  IconButton,
  Tooltip,
} from '@radix-ui/themes';
import { ReloadIcon, ClipboardCopyIcon } from '@radix-ui/react-icons';
import { ConfigProps, uploadCookies } from '../utils/cookies';
import { WebviewTag } from 'electron';
import { useToast } from '../context/ToastContext';
import { useSettingStore } from '../store/settingStore';
import { useUserStore } from '../store/userStore';

interface DanmakuViewerProps {
  url?: string;
}

const DanmakuViewer: React.FC<DanmakuViewerProps> = ({ url = 'https://chat.laplace.live/' }) => {
  const webviewRef = useRef<WebviewTag>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const { showToast } = useToast();

  // 使用settingStore管理弹幕机配置
  const { danmakuConfig, regenerateDanmakuIds, getMergedToken } = useSettingStore();

  // 获取合并的token字符串
  const mergedToken = getMergedToken();

  // 获取用户登录状态
  const { isLoggedIn } = useUserStore();

  // 在新窗口中打开链接
  const openInNewWindow = () => {
    try {
      // 使用window.open()创建新窗口
      const newWindow = window.open(url, '_blank', 'width=1280,height=720');
      if (newWindow) {
        newWindow.focus();
        console.log('已在新窗口中打开:', url);
      } else {
        console.error('无法打开新窗口，可能被浏览器阻止');
        showToast('无法打开新窗口', 'error');
      }
    } catch (err) {
      console.error('打开新窗口失败:', err);
      showToast('打开新窗口失败', 'error');
    }
  };

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
    // 检查用户是否已登录
    if (!isLoggedIn) {
      showToast('请先关联账号', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const configData: ConfigProps = {
        uuid: danmakuConfig.uuid,
        password: danmakuConfig.password,
      };

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

  // 重新生成IDs
  const generateNewIds = () => {
    regenerateDanmakuIds();
  };

  // 复制到剪贴板
  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(mergedToken);
      showToast('已复制密钥到剪贴板', 'success');
    } catch (err) {
      console.error('复制失败:', err);
      showToast('复制失败，请手动复制', 'error');
    }
  };

  // 复制OBS链接
  const copyOBSLink = () => {
    const webview = webviewRef.current;
    if (webview) {
      // 执行脚本在webview中查找id为roomUrl的input元素并获取其值
      const scriptToExecute = `
        (function() {
          // 查找id为roomUrl的input元素
          const roomUrlInput = document.getElementById('roomUrl');
          
          if (roomUrlInput) {
            console.log('找到roomUrl输入框');
            return roomUrlInput.value || '';
          } else {
            console.error('未找到roomUrl输入框');
            return null;
          }
        })();
      `;

      webview
        .executeJavaScript(scriptToExecute)
        .then(result => {
          if (result) {
            // 复制链接到剪贴板
            navigator.clipboard
              .writeText(result)
              .then(() => {
                console.log('OBS链接已复制:', result);
                showToast('OBS 链接已复制到剪贴板', 'success');
              })
              .catch(err => {
                console.error('复制到剪贴板失败:', err);
                showToast('复制到剪贴板失败', 'error');
              });
          } else {
            showToast('未找到OBS链接，请先在 LAPLACE 中配置直播间', 'error');
          }
        })
        .catch(err => {
          console.error('获取OBS链接失败:', err);
          showToast('获取OBS链接失败', 'error');
        });
    } else {
      showToast('LAPLACE页面未加载完成', 'error');
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

  return (
    <div className="w-full h-full flex flex-col">
      {/* 用户提示信息 */}
      <Callout.Root color="blue" size="1" className="mb-3 !p-2">
        <Callout.Text>
          初次打开先
          <Badge color="indigo" variant="solid">
            关联账号
          </Badge>
          ，成功后打开 LAPLACE 中的<Badge color="gray">进阶</Badge>标签，打开后点击
          <Badge color="indigo" variant="solid">
            同步登录状态
          </Badge>
          ，即可自动完成同步与密钥设置。接下来在 LAPLACE 中进行直播间与弹幕的配置，每次修改完点击
          <Badge color="green">复制 OBS 链接</Badge>，再粘贴到 OBS 中。
        </Callout.Text>
      </Callout.Root>

      {/* 设置按钮 */}
      <div className="mb-4">
        <Flex align="center" className="mb-2">
          <Text size="1" color="gray" weight="medium">
            调试
          </Text>
          <Separator orientation="horizontal" className="flex-1 ml-2" />
        </Flex>
        <Flex gap="2">
          <Button onClick={() => setTokenToDanmaku(mergedToken)} variant="soft" color="red">
            设置到弹幕机
          </Button>
        </Flex>
      </div>

      {/* 操作模块 */}
      <div className="mb-4">
        <Flex align="center" className="mb-2">
          <Text size="1" color="gray" weight="medium">
            操作
          </Text>
          <Separator orientation="horizontal" className="flex-1 ml-2" />
        </Flex>
        <div className="flex gap-2 items-center">
          <div className="relative flex-shrink-0" style={{ minWidth: '200px' }}>
            <TextField.Root placeholder="用户密钥" value={mergedToken} readOnly>
              <TextField.Slot side="right">
                <Tooltip content="复制到剪贴板">
                  <IconButton size="1" variant="ghost" color="blue" onClick={copyToClipboard}>
                    <ClipboardCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip content="重新生成密钥">
                  <IconButton size="1" variant="ghost" color="red" onClick={generateNewIds}>
                    <ReloadIcon />
                  </IconButton>
                </Tooltip>
              </TextField.Slot>
            </TextField.Root>
          </div>
          <Tooltip content="同步登录状态后，自动在 LAPLACE 中完成配置">
            <Button onClick={handleUploadCookies} variant="solid" disabled={isLoading}>
              <Spinner size="1" loading={isLoading} />
              {isLoading ? '同步中' : '同步登录状态'}
            </Button>
          </Tooltip>
          <Tooltip content="新开窗口并放大，更方便配置">
            <Button variant="soft" onClick={openInNewWindow}>
              新窗口打开 LAPLACE
            </Button>
          </Tooltip>
          <Tooltip content="与 LAPLACE 页面中的复制作用相同">
            <Button variant="soft" color="green" onClick={copyOBSLink}>
              复制 OBS 链接
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* LAPLACE模块 */}
      <div className="flex flex-1 flex-col">
        <Flex align="center" className="mb-2">
          <Text size="1" color="gray" weight="medium">
            LAPLACE
          </Text>
          <Separator orientation="horizontal" className="flex-1 ml-2" />
        </Flex>
        <div className="border border-gray-300 rounded-lg overflow-hidden relative flex flex-1 flex-col">
          <webview
            ref={webviewRef}
            src={url}
            className="w-full h-full"
            style={{ flex: '1 1 auto', minHeight: '0' }}
            // @ts-expect-error 官方类型定义有误
            allowpopups="true"
          />
          {webviewLoading && (
            <div className="absolute top-2 left-2 px-3 py-2 flex items-center gap-2">
              <Spinner size="1" />
              <span>加载 LAPLACE 中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DanmakuViewer;
