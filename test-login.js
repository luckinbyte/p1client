import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:44446/ws');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // 发送握手
  const handshake = Buffer.from([0x04]);
  console.log('Sending handshake:', handshake);
  ws.send(handshake);
});

ws.on('message', (data) => {
  console.log('Received message:', data);
  
  // 检查是否是握手响应
  const buffer = Buffer.from(data);
  if (buffer[0] === 0x02) {
    console.log('Handshake response received');
    
    // 发送登录请求
    const login = Buffer.from([0x01, 0x03, 0xe9]); // 0x01=Request, 0x03e9=1001
    console.log('Sending login request:', login);
    ws.send(login);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

// 5秒后自动关闭
setTimeout(() => {
  ws.close();
}, 5000);