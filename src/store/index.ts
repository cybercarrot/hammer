import { create } from 'zustand';

// 定义存储状态的接口
interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

// 创建状态存储
const useBearStore = create<BearState>(set => ({
  bears: 0,
  increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: newBears => set({ bears: newBears }),
}));

export default useBearStore;
