import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Text, Badge, Spinner, ScrollArea, Card, Tooltip } from '@radix-ui/themes';
import { UpdateIcon } from '@radix-ui/react-icons';
import { useToast } from '../context/ToastContext';
import packageJson from '../../../package.json';

interface VersionInfo {
  currentVersion: string;
  latestVersion?: string;
  hasUpdate?: boolean;
  releaseUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
}

const VersionManager: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({ currentVersion: packageJson.version });
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [hasCheckedOnStartup, setHasCheckedOnStartup] = useState(false);
  const { showToast } = useToast();

  // 检查更新
  const checkForUpdates = async (silent = false) => {
    setIsChecking(true);
    try {
      const result = await window.electron.app.checkForUpdates();
      if (result.success) {
        setVersionInfo({
          currentVersion: result.currentVersion || packageJson.version,
          latestVersion: result.latestVersion,
          hasUpdate: result.hasUpdate,
          releaseUrl: result.releaseUrl,
          releaseNotes: result.releaseNotes,
          publishedAt: result.publishedAt,
        });

        if (!silent) {
          if (result.hasUpdate) {
            showToast(`发现新版本 v${result.latestVersion}`, 'success');
          } else {
            showToast('当前已是最新版本', 'success');
          }
        }
      } else {
        if (!silent) {
          showToast('检查更新失败: ' + result.error, 'error');
        }
        console.error('检查更新失败:', result.error);
      }
    } catch (error) {
      console.error('检查更新失败:', error);
      if (!silent) {
        showToast('检查更新失败', 'error');
      }
    } finally {
      setIsChecking(false);
    }
  };

  // 手动检查更新（按钮点击）
  const handleCheckForUpdates = () => {
    checkForUpdates(false);
  };

  // 下载更新
  const handleDownload = async () => {
    setIsDownloading(true);
    setUpdateReady(false);
    try {
      const result = await window.electron.app.downloadUpdate();
      if (!result.success) {
        showToast('下载更新失败: ' + result.error, 'error');
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('下载更新失败:', error);
      showToast('下载更新失败', 'error');
      setIsDownloading(false);
    }
  };

  // 安装更新并重启应用
  const handleInstallUpdate = async () => {
    try {
      const result = await window.electron.app.installUpdate();
      if (!result.success) {
        showToast('安装更新失败: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('安装更新失败:', error);
      showToast('安装更新失败', 'error');
    }
  };

  // 监听更新相关事件
  useEffect(() => {
    // 监听更新可用事件（开始下载）
    const cleanupUpdateAvailable = window.electron.app.onUpdateAvailable(() => {
      console.log('开始下载更新');
      showToast('开始下载更新...', 'success');
      setIsDownloading(true);
    });

    // 监听更新错误事件
    const cleanupUpdateError = window.electron.app.onUpdateError(info => {
      console.error('更新错误', info);
      showToast('更新过程中发生错误', 'error');
      setIsDownloading(false);
    });

    // 监听更新下载完成事件
    const cleanupUpdateDownloaded = window.electron.app.onUpdateDownloaded(info => {
      console.log('更新完成', info);
      showToast('更新完成，将在下次应用打开时生效', 'success');
      setIsDownloading(false);
      setUpdateReady(true);
    });

    return () => {
      cleanupUpdateAvailable();
      cleanupUpdateError();
      cleanupUpdateDownloaded();
    };
  }, []);

  // 组件挂载时自动检查更新（静默）
  useEffect(() => {
    if (!hasCheckedOnStartup) {
      checkForUpdates(true); // 静默检查
      setHasCheckedOnStartup(true);
    }
  }, [hasCheckedOnStartup]);

  // 格式化发布日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Text size="2">当前版本</Text>
        <Badge variant="solid">v{versionInfo.currentVersion}</Badge>
        {!versionInfo.hasUpdate && (
          <>
            <Badge variant="solid" color="green">
              已是最新
            </Badge>
            <Button size="1" variant="soft" onClick={handleCheckForUpdates} disabled={isChecking}>
              {isChecking ? <Spinner size="1" /> : <UpdateIcon />}
              {isChecking ? '检查中...' : '检查更新'}
            </Button>
          </>
        )}
      </Flex>

      {versionInfo.hasUpdate && versionInfo.latestVersion && (
        <Flex gap="2">
          <Flex align="center" gap="2">
            <Text size="2">最新版本</Text>
            <Badge variant="solid" color="green">
              v{versionInfo.latestVersion}
            </Badge>
          </Flex>

          {!updateReady && (
            <Tooltip content="静默下载更新包，更新完成后将在下次应用打开时生效">
              <Button size="1" color="green" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? <Spinner size="1" /> : <UpdateIcon />}
                {isDownloading ? '下载中...' : '静默更新'}
              </Button>
            </Tooltip>
          )}

          {updateReady && (
            <Tooltip content="立即重启应用，生效新版本">
              <Button size="1" color="red" onClick={handleInstallUpdate}>
                <UpdateIcon />
                立即重启应用
              </Button>
            </Tooltip>
          )}
        </Flex>
      )}

      {versionInfo.hasUpdate && versionInfo.releaseNotes && (
        <Card size="1">
          <Flex align="baseline" mb="2" gap="2">
            <Text size="2" color="green">
              更新说明
            </Text>
            {versionInfo.publishedAt && (
              <Text size="1" color="gray">
                {formatDate(versionInfo.publishedAt)}
              </Text>
            )}
          </Flex>

          <Box height="200px">
            <ScrollArea>
              <Text size="2" className="whitespace-pre-wrap">
                {versionInfo.releaseNotes}
              </Text>
            </ScrollArea>
          </Box>

          {/* {versionInfo.releaseUrl && (
            <Flex justify="end">
              <Link href={versionInfo.releaseUrl} target="_blank">
                <Button size="1" variant="outline">
                  <ExternalLinkIcon />
                  查看详情
                </Button>
              </Link>
            </Flex>
          )} */}
        </Card>
      )}
    </Flex>
  );
};

export default VersionManager;
