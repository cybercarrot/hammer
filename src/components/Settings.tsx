import React, { useState } from 'react';

interface SettingsProps {
  onSave?: (settings: SettingsData) => void;
}

interface SettingsData {
  defaultRoomId: string;
  theme: 'light' | 'dark';
  chatFontSize: number;
  notificationEnabled: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState<SettingsData>({
    defaultRoomId: '',
    theme: 'light',
    chatFontSize: 14,
    notificationEnabled: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setSettings(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(settings);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-600 text-white p-2 font-medium rounded-t-lg">设置</div>
      <div className="flex-1 border border-gray-300 rounded-b-lg p-6 overflow-auto">
        <div className="max-w-xl mx-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">基本设置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    默认直播间ID
                  </label>
                  <input
                    type="text"
                    name="defaultRoomId"
                    value={settings.defaultRoomId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：21852"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
                  <select
                    name="theme"
                    value={settings.theme}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">弹幕设置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    弹幕字体大小 ({settings.chatFontSize}px)
                  </label>
                  <input
                    type="range"
                    name="chatFontSize"
                    min="12"
                    max="24"
                    value={settings.chatFontSize}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="notificationEnabled"
                      checked={settings.notificationEnabled}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">启用通知</label>
                    <p className="text-gray-500">当收到礼物或特殊弹幕时显示通知</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
