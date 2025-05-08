interface ElectronAPI {
  utils: {
    sendToMain: (channel: string, data: any) => void;
    onFromMain: (channel: string, callback: (...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  };
}

interface Window {
  electron: ElectronAPI;
}
