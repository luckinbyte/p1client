// 模拟浏览器环境中的WebSocket连接测试
import WebSocket from 'ws';

console.log('Testing WebSocket connection to ws://localhost:44446/ws...');

const ws = new WebSocket('ws://localhost:44446/ws');

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened');
  console.log('Connection readyState:', ws.readyState);
  ws.close();
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket connection error:', err);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
});

ws.on('close', function close(code, reason) {
  console.log('🔒 WebSocket connection closed');
  console.log('Close code:', code);
  console.log('Close reason:', reason.toString());
});

ws.on('message', function message(data) {
  console.log('📩 Received message:', data);
});

// 设置超时，防止无限等待
setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.log('⏰ Connection timeout - still connecting');
    ws.close();
  }
}, 5000);