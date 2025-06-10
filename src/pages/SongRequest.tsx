import React, { useEffect, useState } from 'react';
import { Text, Box } from '@radix-ui/themes';
import { LaplaceEventBridgeClient } from '@laplace.live/event-bridge-sdk';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

const SongRequest: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Initialize client
    const newClient = new LaplaceEventBridgeClient({
      url: 'ws://localhost:9696',
      token: '',
      reconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
    });

    // Set up event listeners
    newClient.on('message', event => {
      setMessages(prev => [...prev, `${event.username}: ${event.message}`]);
    });

    newClient.on('system', event => {
      setMessages(prev => [...prev, `System: ${event.message}`]);
    });

    newClient.onAny(event => {
      console.log(`Received event of type: ${event.type}`);
    });

    newClient.onConnectionStateChange((state: ConnectionState) => {
      console.log(`Connection state changed to: ${state}`);
      setConnectionState(state);
    });

    // Connect to the server
    const connect = async () => {
      try {
        await newClient.connect();
      } catch (error) {
        console.error('Failed to connect to WebSocket server:', error);
        setMessages(prev => [...prev, 'Failed to connect to WebSocket server']);
      }
    };

    connect();

    // Cleanup function
    return () => {
      if (newClient) {
        newClient.disconnect();
      }
    };
  }, []);

  const connectionStatus = {
    disconnected: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    reconnecting: '重新连接中...',
  }[connectionState];

  return (
    <div className="w-full h-full flex flex-col p-4">
      <Box className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
        <Text>连接状态: {connectionStatus}</Text>
      </Box>

      <Box className="flex-1 overflow-auto border rounded p-2 mb-4 bg-white dark:bg-gray-900">
        {messages.length === 0 ? (
          <Text color="gray" align="center">
            暂无消息
          </Text>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="py-1 border-b border-gray-100 dark:border-gray-800">
              <Text>{msg}</Text>
            </div>
          ))
        )}
      </Box>
    </div>
  );
};

export default SongRequest;
