import React from 'react';
import Counter from './components/Counter';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <h1>💖 Hello World!</h1>
      <p>Welcome to your Electron + React application.</p>
      <Counter />
    </div>
  );
};

export default App;
