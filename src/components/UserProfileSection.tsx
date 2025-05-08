import React from 'react';
import { Avatar, Text, DropdownMenu, Button, Flex } from '@radix-ui/themes';
import QRCodeLogin from './QRCodeLogin';
import { useLoginStore } from '../store/loginStore';

const UserProfileSection: React.FC = () => {
  const { isLoggedIn, username, avatar, logout } = useLoginStore();

  return (
    <div className="flex items-center space-x-3">
      {isLoggedIn ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="ghost" radius="large">
              <Flex align="center" gap="2">
                {avatar && <Avatar size="2" src={avatar} fallback="U" radius="full" />}
                <Text size="2">{username || '未知用户'}</Text>
              </Flex>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onClick={logout}>退出登录</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ) : (
        <QRCodeLogin onLoginSuccess={() => console.log('登录成功')} />
      )}
    </div>
  );
};

export default UserProfileSection;
