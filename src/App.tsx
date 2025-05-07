import React from 'react';
import Counter from './components/Counter';
import PopoverDemo from './components/PopoverDemo';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">💖 Hello World!</h1>
        <p className="text-gray-600 text-lg mb-8">Welcome to your Electron + React application.</p>
        <Counter />
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Radix UI Popover Demo</h2>
          <PopoverDemo />
        </div>
      </div>
    </div>
  );
};

export default App;
