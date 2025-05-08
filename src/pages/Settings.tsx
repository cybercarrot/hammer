import React from 'react';

interface SettingsProps {
  onSave?: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 border border-gray-300 rounded-lg p-6 overflow-auto">
        <div className="max-w-xl mx-auto">
          <div className="text-center text-gray-500 my-8">
            <p>设置功能开发中...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
