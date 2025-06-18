import React, { useEffect, useState, useRef } from 'react';
import { Button, Dialog, Flex, Text, Box } from '@radix-ui/themes';
import { Cross1Icon } from '@radix-ui/react-icons';
import QRCode from 'qrcode';
import { BilibiliService } from '../services/bilibiliApi';
import { useUserStore } from '../store/userStore';
import { useToast } from '../context/ToastContext';

const QRCodeLogin: React.FC = () => {
  // 登录状态
  const { setLoginState } = useUserStore();
  const { showToast } = useToast();

  // 对话框状态
  const [open, setOpen] = useState(false);

  // 二维码状态
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [scanStatus, setScanStatus] = useState('等待生成二维码');
  const [isLoading, setIsLoading] = useState(false);

  // 轮询定时器引用
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      clearPollingTimer();
    };
  }, []);

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
      setIsLoading(true);
      setScanStatus('正在生成二维码...');
      setQrImageUrl('');

      // 清除之前的轮询
      clearPollingTimer();

      // 获取二维码数据
      const qrData = await BilibiliService.getQRCode();

      // 生成二维码图片
      const qrImage = await QRCode.toDataURL(qrData.url, {
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // 更新状态
      setQrImageUrl(qrImage);
      setScanStatus('请使用哔哩哔哩APP扫描二维码');
      setIsLoading(false);

      // 开始轮询
      startPolling(qrData.qrcode_key);
    } catch (error) {
      console.error('生成二维码失败', error);
      setScanStatus('生成二维码失败，请重试');
      setIsLoading(false);
    }
  };

  // 开始轮询
  const startPolling = (key: string) => {
    // 清除之前的轮询
    clearPollingTimer();

    // 开始新的轮询
    timerRef.current = setInterval(async () => {
      try {
        // 如果对话框已关闭，停止轮询
        if (!open) {
          clearPollingTimer();
          return;
        }

        // 轮询扫码状态
        const result = await BilibiliService.pollQRCodeStatus(key);

        // 处理不同状态
        switch (result.code) {
          case 0: // 登录成功
            handleLoginSuccess();
            setScanStatus('登录成功！');
            clearPollingTimer();
            break;

          case 86038: // 二维码已失效
            setScanStatus('二维码已失效，请点击刷新');
            clearPollingTimer();
            break;

          case 86090: // 已扫码但未确认
            setScanStatus('已扫描，请在手机上确认');
            break;

          case 86101: // 未扫码
            setScanStatus('请使用哔哩哔哩APP扫描二维码');
            break;

          default:
            setScanStatus(`未知状态：${result.message}`);
        }
      } catch (error) {
        console.error('轮询扫码状态失败', error);
        setScanStatus('检查扫码状态失败，请刷新二维码');
        clearPollingTimer();
      }
    }, 3000);
  };

  // 处理登录成功
  const handleLoginSuccess = async () => {
    try {
      // 获取用户信息
      const userInfo = await BilibiliService.getUserInfo();

      if (userInfo && userInfo.isLogin) {
        // 登录成功，更新状态
        setLoginState(true, userInfo.uname, userInfo.mid, userInfo.face);

        // 关闭对话框
        setOpen(false);

        // 显示成功提示
        showToast('账号关联成功', 'success');
      } else {
        setScanStatus('登录成功，但无法获取用户信息');
      }
    } catch (error) {
      console.error('处理登录成功失败', error);
      setScanStatus('登录成功，但无法获取用户信息');
    }
  };

  // 监听对话框打开/关闭状态
  useEffect(() => {
    if (open) {
      // 对话框打开，生成二维码
      generateQRCode();
    } else {
      // 对话框关闭，清理状态
      clearPollingTimer();
      setQrImageUrl('');
      setScanStatus('等待生成二维码');
      setIsLoading(false);
    }
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>关联账号</Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content style={{ maxWidth: 350 }}>
          <Dialog.Title>关联账号信息</Dialog.Title>
          <Flex direction="column" align="center" gap="3">
            {qrImageUrl ? (
              <Box className="relative mt-2">
                <img
                  src={qrImageUrl}
                  alt="哔哩哔哩二维码登录"
                  width={200}
                  height={200}
                  className="border border-gray-300 rounded-sm opacity-50"
                  style={{ opacity: isLoading ? 0.5 : 1 }}
                />
                {isLoading && (
                  <Text
                    as="div"
                    size="2"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-sm"
                  >
                    生成中...
                  </Text>
                )}
              </Box>
            ) : (
              <Box
                className="flex items-center justify-center border border-gray-300 rounded-sm"
                height="200"
                width="200"
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
            className="absolute top-2 right-2 appearance-none border-none bg-transparent rounded-full cursor-pointer p-2"
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
