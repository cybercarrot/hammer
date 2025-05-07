import React from 'react';
import Counter from './components/Counter';
import PopoverDemo from './components/PopoverDemo';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <h1>💖 Hello World!</h1>
      <p>Welcome to your Electron + React application.</p>
      <Counter />
      <div style={{ marginTop: '20px' }}>
        <h2>Radix UI Popover Demo</h2>
        <PopoverDemo />
      </div>
    </div>
  );
};

export default App;
