import React, { useState } from 'react';
import DanmakuViewer from './DanmakuViewer';
import SongRequest from './SongRequest';
import ControlPanel from './ControlPanel';
import Settings from './Settings';

type TabType = 'danmaku' | 'song' | 'control' | 'settings';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('danmaku');

  return (
    <div className="flex flex-col h-screen">
      {/* 标题栏 */}
      <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">哔哩哔哩直播助手</h1>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">v1.0.0</span>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边导航栏 */}
        <div className="w-48 bg-gray-100 p-4">
          <nav className="space-y-2">
            <button
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'danmaku' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('danmaku')}
            >
              弹幕机
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'song' ? 'bg-purple-600 text-white' : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('song')}
            >
              点歌机
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'control' ? 'bg-green-600 text-white' : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('control')}
            >
              控制台
            </button>
            <div className="border-t border-gray-300 my-2"></div>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-gray-600 text-white' : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              设置
            </button>
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-4 overflow-auto">
          {activeTab === 'danmaku' && <DanmakuViewer />}
          {activeTab === 'song' && <SongRequest />}
          {activeTab === 'control' && <ControlPanel />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>

      {/* 状态栏 */}
      <div className="bg-gray-200 p-2 text-sm text-gray-600 flex justify-between">
        <div>状态: 正常运行中</div>
        <div>
          <span className="text-xs text-gray-500">Made with 💖 by CLAUDE</span>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
