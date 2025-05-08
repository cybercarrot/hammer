import React from 'react';

const ControlPanel: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-green-600 text-white p-2 font-medium rounded-t-lg">控制台</div>
      <div className="flex-1 border border-gray-300 rounded-b-lg p-4">
        <div className="text-center text-gray-500 my-8">
          <p>控制台功能开发中...</p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
