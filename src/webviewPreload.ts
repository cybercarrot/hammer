import { ipcRenderer } from 'electron';

// 保存原始WebSocket
const OriginalWebSocket = window.WebSocket;

// 重写WebSocket
// @ts-expect-error 类型错误
window.WebSocket = function (url, protocols) {
  console.log('WebSocket连接被创建:', url);

  // 创建原始WebSocket实例
  const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);

  // 保存原始方法
  const originalSend = ws.send;

  // 重写send方法
  ws.send = function (data) {
    // 向父窗口发送消息
    // console.log('preload send:', data);
    ipcRenderer.sendToHost('send', data);

    // 调用原始send方法
    // eslint-disable-next-line prefer-rest-params
    return originalSend.apply(this, arguments);
  };

  // 监听收到的消息
  ws.addEventListener('message', async function (event) {
    // 向父窗口发送消息
    // debugger;
    const uint8Array = new Uint8Array(await event.data.arrayBuffer());
    // console.log('preload message:', uint8Array);
    ipcRenderer.sendToHost('message', uint8Array);
  });

  return ws;
};

// 复制原型和静态属性
window.WebSocket.prototype = OriginalWebSocket.prototype;
Object.keys(OriginalWebSocket).forEach(key => {
  // @ts-expect-error 类型错误
  window.WebSocket[key] = OriginalWebSocket[key];
});

console.log('WebSocket已被成功劫持');
