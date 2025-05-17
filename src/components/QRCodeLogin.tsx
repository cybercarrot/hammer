import React, { useEffect, useState, useRef } from 'react';
import { Button, Dialog, Flex, Text, Box } from '@radix-ui/themes';
import { Cross1Icon } from '@radix-ui/react-icons';
import QRCode from 'qrcode';
import { BiliLoginService } from '../services/BiliLogin';
import { useUserStore } from '../store/userStore';

interface QRCodeLoginProps {
  onLoginSuccess?: () => void;
}

const QRCodeLogin: React.FC<QRCodeLoginProps> = ({ onLoginSuccess }) => {
  // 登录状态
  const { isLoggedIn, setLoginState } = useUserStore();

  // 对话框状态
  const [open, setOpen] = useState(false);

  // 二维码状态
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [scanStatus, setScanStatus] = useState('等待生成二维码');
  const [isLoading, setIsLoading] = useState(false);

  // 轮询定时器引用
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 追踪组件是否挂载
  const isMountedRef = useRef(true);

  // 初始化登录状态（从本地存储恢复）
  useEffect(() => {
    // 设置组件已挂载
    isMountedRef.current = true;

    const checkExistingLogin = async () => {
      try {
        // 尝试获取用户信息，验证登录状态
        const userInfo = await BiliLoginService.getUserInfo();

        // 如果已登录，更新登录状态
        if (userInfo && userInfo.isLogin) {
          setLoginState(true, userInfo.uname, userInfo.mid.toString(), userInfo.face);
        }
      } catch (error) {
        console.error('恢复登录状态失败', error);
      }
    };

    // 仅在首次打开且未登录状态下检查
    if (!isLoggedIn) {
      checkExistingLogin();
    }

    // 组件卸载时清理
    return () => {
      isMountedRef.current = false;
      clearPollingTimer();
    };
  }, [isLoggedIn, setLoginState]);

  // 安全地更新状态，确保组件仍然挂载
  const safeSetState = (callback: () => void) => {
    if (isMountedRef.current) {
      callback();
    }
  };

  // 清除轮询定时器
  const clearPollingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 生成二维码
  const generateQRCode = async () => {
    // 避免重复请求
    if (isLoading) return;

    // 检查对话框是否打开
    if (!open) return;

    try {
      // 设置加载状态
      safeSetState(() => {
        setIsLoading(true);
        setScanStatus('正在生成二维码...');
        setQrImageUrl('');
      });

      // 清除之前的轮询
      clearPollingTimer();

      // 获取二维码数据
      const qrData = await BiliLoginService.getQRCode();

      // 再次检查组件是否挂载且对话框是否打开
      if (!isMountedRef.current || !open) return;

      // 生成二维码图片
      const qrImage = await QRCode.toDataURL(qrData.url, {
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // 最后一次检查组件是否挂载且对话框是否打开
      if (!isMountedRef.current || !open) return;

      // 更新状态
      safeSetState(() => {
        setQrImageUrl(qrImage);
        setScanStatus('请使用哔哩哔哩APP扫描二维码');
        setIsLoading(false);
      });

      // 开始轮询
      startPolling(qrData.qrcode_key);
    } catch (error) {
      console.error('生成二维码失败', error);

      if (isMountedRef.current && open) {
        safeSetState(() => {
          setScanStatus('生成二维码失败，请重试');
          setIsLoading(false);
        });
      }
    }
  };

  // 开始轮询
  const startPolling = (key: string) => {
    // 清除之前的轮询
    clearPollingTimer();

    // 开始新的轮询
    timerRef.current = setInterval(async () => {
      try {
        // 检查组件是否挂载且对话框是否打开
        if (!isMountedRef.current || !open) {
          clearPollingTimer();
          return;
        }

        // 轮询扫码状态
        const result = await BiliLoginService.pollQRCodeStatus(key);

        // 再次检查组件是否挂载且对话框是否打开
        if (!isMountedRef.current || !open) {
          clearPollingTimer();
          return;
        }

        // 处理不同状态
        switch (result.code) {
          case 0: // 登录成功
            handleLoginSuccess();
            safeSetState(() => setScanStatus('登录成功！'));
            clearPollingTimer();
            break;

          case 86038: // 二维码已失效
            safeSetState(() => setScanStatus('二维码已失效，请点击刷新'));
            clearPollingTimer();
            break;

          case 86090: // 已扫码但未确认
            safeSetState(() => setScanStatus('已扫描，请在手机上确认'));
            break;

          case 86101: // 未扫码
            safeSetState(() => setScanStatus('请使用哔哩哔哩APP扫描二维码'));
            break;

          default:
            safeSetState(() => setScanStatus(`未知状态：${result.message}`));
        }
      } catch (error) {
        console.error('轮询扫码状态失败', error);

        if (isMountedRef.current && open) {
          safeSetState(() => setScanStatus('检查扫码状态失败，请刷新二维码'));
          clearPollingTimer();
        }
      }
    }, 3000);
  };

  // 处理登录成功
  const handleLoginSuccess = async () => {
    try {
      // 获取用户信息
      const userInfo = await BiliLoginService.getUserInfo();

      if (!isMountedRef.current) return;

      if (userInfo && userInfo.isLogin) {
        // 更新登录状态
        setLoginState(true, userInfo.uname, userInfo.mid.toString(), userInfo.face);

        // 关闭对话框
        setTimeout(() => {
          if (isMountedRef.current) {
            setOpen(false);
            onLoginSuccess?.();
          }
        }, 1000);
      } else {
        safeSetState(() => setScanStatus('登录成功，但无法获取用户信息'));
      }
    } catch (error) {
      console.error('处理登录成功失败', error);

      if (isMountedRef.current) {
        safeSetState(() => setScanStatus('登录成功，但无法获取用户信息'));
      }
    }
  };

  // 对话框打开/关闭处理
  const handleOpenChange = (openState: boolean) => {
    // 如果状态相同则不处理
    if (open === openState) return;

    setOpen(openState);

    if (!openState) {
      // 关闭对话框，清除轮询和状态
      clearPollingTimer();
      safeSetState(() => {
        setQrImageUrl('');
        setScanStatus('等待生成二维码');
        setIsLoading(false);
      });
    }
  };

  // 监听对话框打开状态，生成二维码
  useEffect(() => {
    if (open) {
      generateQRCode();
    }
  }, [open]);

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>关联账号</Button>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Content style={{ maxWidth: 350 }}>
          <Dialog.Title>关联账号信息</Dialog.Title>
          <Flex direction="column" align="center" gap="3">
            {qrImageUrl ? (
              <Box
                style={{
                  position: 'relative',
                  marginTop: '8px',
                }}
              >
                <img
                  src={qrImageUrl}
                  alt="哔哩哔哩二维码登录"
                  width={200}
                  height={200}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                />
                {isLoading && (
                  <Text
                    as="div"
                    size="2"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: '8px',
                      borderRadius: '4px',
                    }}
                  >
                    生成中...
                  </Text>
                )}
              </Box>
            ) : (
              <Box
                style={{
                  width: 200,
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <Text color="gray">{isLoading ? '生成二维码中...' : '等待生成二维码'}</Text>
              </Box>
            )}

            <Text
              size="2"
              color={
                scanStatus.includes('失效') || scanStatus.includes('失败')
                  ? 'red'
                  : scanStatus.includes('成功')
                    ? 'green'
                    : scanStatus.includes('已扫描')
                      ? 'blue'
                      : 'gray'
              }
            >
              {scanStatus}
            </Text>

            <Button onClick={generateQRCode} disabled={isLoading} variant="soft">
              刷新二维码
            </Button>
          </Flex>

          <button
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              appearance: 'none',
              border: 'none',
              backgroundColor: 'transparent',
              borderRadius: '50%',
              cursor: 'pointer',
              padding: 5,
            }}
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default QRCodeLogin;
