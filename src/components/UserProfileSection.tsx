import React from 'react';
import { Avatar, Text, DropdownMenu, Button, Flex } from '@radix-ui/themes';
import QRCodeLogin from './QRCodeLogin';
import { useLoginStore } from '../store/loginStore';

const UserProfileSection: React.FC = () => {
  const { isLoggedIn, username, userId, avatar, logout } = useLoginStore();

  return (
    <div className="flex items-center">
      {isLoggedIn ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="ghost" style={{ padding: 4 }}>
              <Avatar size="2" src={avatar} fallback={username?.[0] || 'U'} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Label>
              <Flex direction="column" gap="1" p="1">
                {userId && <Text size="1">UID: {userId}</Text>}
                <Text size="2">{username || '未知用户'}</Text>
              </Flex>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Item color="red" onClick={logout}>
              退出登录
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ) : (
        <QRCodeLogin onLoginSuccess={() => console.log('登录成功')} />
      )}
    </div>
  );
};

export default UserProfileSection;
