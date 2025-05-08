import React from 'react';
import useBearStore from '../store';

export const BearCounter: React.FC = () => {
  // 使用状态
  const bears = useBearStore(state => state.bears);

  return <h1>{bears} 只熊在这里...</h1>;
};

export const Controls: React.FC = () => {
  // 使用状态更新方法
  const increasePopulation = useBearStore(state => state.increasePopulation);
  const removeAllBears = useBearStore(state => state.removeAllBears);

  return (
    <div>
      <button onClick={increasePopulation}>增加一只熊</button>
      <button onClick={removeAllBears}>移除所有熊</button>
    </div>
  );
};
