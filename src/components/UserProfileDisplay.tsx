import React from 'react';
import { Avatar, Box, Button, Flex, Text } from '@radix-ui/themes';
import { useLoginStore } from '../store/loginStore';

interface UserProfileDisplayProps {
  showLogout?: boolean;
}

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ showLogout = true }) => {
  const { isLoggedIn, username, userId, avatar, logout } = useLoginStore();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Flex align="center" gap="3" p="2">
      <Avatar src={avatar} fallback={username?.[0] || 'B'} size="3" radius="full" />

      <Box>
        <Text size="2" weight="bold">
          {username}
        </Text>
        <Text size="1" color="gray">
          UID: {userId}
        </Text>
      </Box>

      {showLogout && (
        <Button size="1" variant="soft" color="red" onClick={logout}>
          退出登录
        </Button>
      )}
    </Flex>
  );
};

export default UserProfileDisplay;
