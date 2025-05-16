import React, { useState, useEffect } from 'react';
import { Button, TextField, Card, Flex, Heading, Text, Separator } from '@radix-ui/themes';
import shortUuid from 'short-uuid';
import { ConfigProps, uploadCookies } from '../utils/cookies';

interface SettingsProps {
  onSave?: (settings: any) => void;
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

const Settings: React.FC<SettingsProps> = () => {
  const [configData, setConfigData] = useState<ConfigProps>(getInitialConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    type: 'info',
  });

  // 每次配置变更时自动保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configData));
    } catch (error) {
      console.error('自动保存配置失败:', error);
    }
  }, [configData]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotification({
        open: true,
        message: '已拷贝到剪切板',
        type: 'success',
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `拷贝至剪切板出错: ${error}`,
        type: 'error',
      });
    }
  };

  const handleUploadCookies = async () => {
    setIsLoading(true);
    try {
      console.log('开始上传Cookie数据, 配置:', configData);

      const result = await uploadCookies(configData);

      console.log('上传结果:', result);

      setNotification({
        open: true,
        message: result.message,
        type: result.success ? 'success' : 'error',
      });
    } catch (error) {
      console.error('上传过程中出错:', error);
      setNotification({
        open: true,
        message: `上传失败: ${error}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewIds = () => {
    setConfigData(prev => ({
      ...prev,
      uuid: shortUuid.generate(),
      password: shortUuid.generate(),
    }));
    // 自动保存会通过useEffect完成
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // 合并的token字符串
  const mergedToken = `${configData.uuid}@${configData.password}`;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 border border-gray-300 rounded-lg p-6 overflow-auto">
        <div className="max-w-xl mx-auto">
          <Heading size="5" className="mb-4">
            Cookie同步设置
          </Heading>

          <Card className="mb-4 p-4">
            <Heading size="3" className="mb-2">
              同步密钥
            </Heading>
            <Separator className="mb-4" />

            <Flex direction="column" gap="4">
              <Flex direction="row" gap="2" align="center">
                <TextField.Root
                  placeholder="端对端用户密钥"
                  value={mergedToken}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={() => copyToClipboard(mergedToken)} disabled={isLoading}>
                  复制密钥
                </Button>
                <Button onClick={handleUploadCookies} variant="solid" disabled={isLoading}>
                  {isLoading ? '上传中...' : '保存并同步'}
                </Button>
              </Flex>

              <Button variant="soft" color="red" onClick={generateNewIds} className="mt-2">
                重置登录密钥
              </Button>
            </Flex>
          </Card>
        </div>
      </div>

      {notification.open && (
        <div
          className="fixed bottom-4 right-4 p-3 rounded-md shadow-lg"
          style={{
            backgroundColor:
              notification.type === 'success'
                ? '#10b981'
                : notification.type === 'error'
                  ? '#ef4444'
                  : '#3b82f6',
            color: 'white',
          }}
        >
          <Flex gap="2" align="center">
            <Text>{notification.message}</Text>
            <Button size="1" variant="ghost" onClick={closeNotification}>
              ✕
            </Button>
          </Flex>
        </div>
      )}
    </div>
  );
};

export default Settings;
