// TODO: 已弃用，劫持websocket的方法来实现弹幕监听，不过代码先保留
import { ipcRenderer } from 'electron';
import { inflate, brotliDecompress } from 'zlib';
import { promisify } from 'util';

// 将 zlib 方法转换为 Promise 形式
const inflateAsync = promisify(inflate);
const brotliDecompressAsync = promisify(brotliDecompress);

// 保存原始WebSocket
const OriginalWebSocket = window.WebSocket;

// 操作码
const OP_HEARTBEAT_REPLY = 3; // 心跳包回复
const OP_MESSAGE = 5; // 普通消息
const OP_AUTH_REPLY = 8; // 认证回复

// 协议版本
const PROTOCOL_VERSION_JSON = 0; // JSON 数据
const PROTOCOL_VERSION_INT = 1; // 心跳包
const PROTOCOL_VERSION_ZLIB = 2; // zlib 压缩
const PROTOCOL_VERSION_BROTLI = 3; // brotli 压缩

// 数据包类型
interface BiliPacket {
  protocolVersion: number;
  operation: number;
  sequence: number;
  body: unknown;
}

// 解析数据包
async function parsePacket(buffer: ArrayBuffer): Promise<BiliPacket[]> {
  const dataView = new DataView(buffer);
  const packets: BiliPacket[] = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    // 读取头部
    const packetLength = dataView.getUint32(offset);
    const headerLength = dataView.getUint16(offset + 4);
    const protocolVersion = dataView.getUint16(offset + 6);
    const operation = dataView.getUint32(offset + 8);
    const sequence = dataView.getUint32(offset + 12);

    // 读取正文
    const body = new Uint8Array(buffer, offset + headerLength, packetLength - headerLength);

    // 处理不同协议版本
    let parsedBody: unknown = null;

    switch (protocolVersion) {
      case PROTOCOL_VERSION_JSON:
      case PROTOCOL_VERSION_INT:
        // JSON 或整数数据
        try {
          const text = new TextDecoder().decode(body);
          parsedBody = JSON.parse(text);
        } catch (e) {
          console.error('解析JSON失败:', e);
        }
        break;

      case PROTOCOL_VERSION_ZLIB: {
        // zlib 压缩数据
        try {
          // 使用 Node.js 的 zlib 模块解压 zlib 数据
          const decompressed = await inflateAsync(Buffer.from(body));

          // 递归解析解压后的数据
          const subPackets = await parsePacket(
            decompressed.buffer.slice(
              decompressed.byteOffset,
              decompressed.byteOffset + decompressed.byteLength
            ) as ArrayBuffer
          );
          packets.push(...subPackets);
        } catch (e) {
          console.error('解压zlib数据失败:', e);
          // 发送原始数据以便调试
          ipcRenderer.sendToHost('raw', {
            error: '解压zlib数据失败',
            data: Array.from(body),
          });
        }
        break;
      }

      case PROTOCOL_VERSION_BROTLI: {
        // brotli 压缩数据
        try {
          // 使用 Node.js 的 zlib 模块解压 brotli 数据
          const decompressed = await brotliDecompressAsync(Buffer.from(body));
          // 递归解析解压后的数据
          const subPackets = await parsePacket(
            decompressed.buffer.slice(
              decompressed.byteOffset,
              decompressed.byteOffset + decompressed.byteLength
            ) as ArrayBuffer
          );
          packets.push(...subPackets);
        } catch (e) {
          console.error('解压brotli数据失败:', e);
          // 发送原始数据以便调试
          ipcRenderer.sendToHost('raw', {
            error: '解压brotli数据失败',
            data: Array.from(body),
          });
        }
        break;
      }
    }

    // 添加到结果
    if (parsedBody !== null) {
      packets.push({
        protocolVersion,
        operation,
        sequence,
        body: parsedBody,
      });
    }

    offset += packetLength;
  }

  return packets;
}

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
    try {
      // 获取二进制数据
      const arrayBuffer = await event.data.arrayBuffer();

      // 解析数据包
      const packets = await parsePacket(arrayBuffer);

      // 处理解析后的数据包
      for (const packet of packets) {
        switch (packet.operation) {
          case OP_HEARTBEAT_REPLY:
            // 心跳包回复，包含人气值
            console.log('[WebSocket] 心跳包回复，人气值:', packet.body);
            ipcRenderer.sendToHost('popularity', packet.body);
            break;

          case OP_MESSAGE:
            // 普通消息
            if (Array.isArray(packet.body)) {
              // 批量消息
              for (const msg of packet.body) {
                ipcRenderer.sendToHost('message', msg);
              }
            } else {
              // 单条消息
              ipcRenderer.sendToHost('message', packet.body);
            }
            break;

          case OP_AUTH_REPLY:
            // 认证回复
            console.log('[WebSocket] 认证回复:', packet.body);
            ipcRenderer.sendToHost('auth', packet.body);
            break;

          default:
            console.log('[WebSocket] 未知操作码:', packet.operation, packet);
            ipcRenderer.sendToHost('raw', {
              operation: packet.operation,
              data: packet.body,
            });
        }
      }
    } catch (error) {
      console.error('处理WebSocket消息时出错:', error);
      // 发送原始数据以便调试
      const errorData = new Uint8Array(await event.data.arrayBuffer());
      ipcRenderer.sendToHost('raw', {
        error: (error as Error).message,
        rawData: Array.from(errorData),
      });
    }
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
