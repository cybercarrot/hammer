import React from 'react';
import {
  Heading,
  Card,
  Text,
  Button,
  Flex,
  Box,
  Separator,
  Avatar,
  TextField,
  Grid,
  Container,
} from '@radix-ui/themes';

const RadixContent: React.FC = () => {
  return (
    <Container>
      <Heading size="6" mb="4">
        Radix UI 主题演示
      </Heading>

      <Grid columns={{ initial: '1', md: '2' }} gap="4" mb="4">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">用户信息</Heading>
            <Flex align="center" gap="3">
              <Avatar fallback="用户" color="indigo" variant="solid" size="3" radius="full" />
              <Box>
                <Text size="2" weight="bold">
                  用户名
                </Text>
                <Text size="1" color="gray">
                  用户@example.com
                </Text>
              </Box>
            </Flex>
            <TextField.Root placeholder="发送消息..." />
            <Flex gap="2">
              <Button>发送</Button>
              <Button variant="outline">取消</Button>
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">通知</Heading>
            <Text size="2">您有 3 条未读消息</Text>
            <Separator size="4" />
            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text size="2" weight="bold">
                  系统通知
                </Text>
                <Text size="1" color="gray">
                  1小时前
                </Text>
              </Flex>
              <Text size="2">您的账户已成功创建</Text>
            </Flex>
            <Button variant="soft" color="blue">
              查看全部
            </Button>
          </Flex>
        </Card>
      </Grid>

      <Card>
        <Flex direction="column" gap="4">
          <Heading size="4">主题切换示例</Heading>
          <Text>
            Radix UI 主题支持明亮和暗黑模式，可以通过右上角的开关切换。主题会自动 适应各种 UI
            元素，包括卡片、按钮、文本等，无需额外的样式配置。
          </Text>
          <Flex wrap="wrap" gap="2">
            <Button variant="solid" color="indigo">
              实心按钮
            </Button>
            <Button variant="soft" color="crimson">
              柔和按钮
            </Button>
            <Button variant="outline" color="grass">
              轮廓按钮
            </Button>
            <Button variant="ghost" color="amber">
              幽灵按钮
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Container>
  );
};

export default RadixContent;
