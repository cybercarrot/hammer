import React from 'react';
import { Card, Heading, Text, Separator } from '@radix-ui/themes';

interface SettingsProps {
  onSave?: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 border border-gray-300 rounded-lg p-6 overflow-auto">
        <div className="max-w-xl mx-auto">
          <Card className="mb-4 p-4">
            <Heading size="3" className="mb-2">
              设置
            </Heading>
            <Separator className="mb-4" />

            <Text size="2" className="mb-4">
              设置面板
            </Text>

            {/* 其他设置项可以在这里添加 */}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
