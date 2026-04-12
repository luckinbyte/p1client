// 测试WebSocket连接并发送握手消息
import WebSocket from 'ws';

const wsUrl = 'ws://localhost:44446/ws';
console.log('Testing WebSocket connection to', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ WebSocket connection opened');
  console.log('Connection readyState:', ws.readyState);
  
  // 发送握手消息
  console.log('Sending handshake message...');
  const msgType = 0x04; // MsgTypeHandshake
  const payload = new Uint8Array(0); // 空 payload
  const message = new Uint8Array([msgType, ...payload]);
  ws.send(message);
  console.log('Handshake message sent');
  
  // 等待一段时间，看看连接是否保持稳定
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('✅ Connection still open after 5 seconds - handshake successful!');
    } else {
      console.error('❌ Connection closed before 5 seconds - handshake failed');
    }
    ws.close();
  }, 5000);
});

ws.on('message', (data) => {
  console.log('Received message:', data);
});

ws.on('close', (code, reason) => {
  console.log('WebSocket connection closed:', code, reason.toString());
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// 设置连接超时
setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket connection timeout');
    ws.close();
  }
}, 10000);