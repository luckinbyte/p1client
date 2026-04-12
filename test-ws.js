// 测试WebSocket连接
import WebSocket from 'ws';

const wsUrl = 'ws://localhost:44446/ws';
console.log('Testing WebSocket connection to', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ WebSocket connection opened');
  console.log('Connection readyState:', ws.readyState);
  
  // 发送心跳消息
  console.log('Sending heartbeat...');
  ws.send(JSON.stringify({ msg_id: 1, rid: 1 }));
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
  if (ws.readyState === WebSocket.OPEN) {
    console.log('Connection still open after 5 seconds');
    ws.close();
  } else {
    console.error('❌ WebSocket connection timeout');
  }
}, 5000);