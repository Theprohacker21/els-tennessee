const WebSocket = require('ws');

const SERVER = process.env.SERVER || 'ws://127.0.0.1:3000';

function start() {
  const ws = new WebSocket(SERVER);
  ws.on('open', () => {
    console.log('Connected to server as bridge');
    ws.send(JSON.stringify({ identify: 'bridge' }));
  });
  ws.on('message', (m) => {
    try { const obj = JSON.parse(m); console.log('SERVER ->', obj); }
    catch(e) { console.log('MSG', m.toString()); }
  });
  ws.on('close', () => { console.log('Server WS closed, retry in 2s'); setTimeout(start, 2000); });
  ws.on('error', (e) => { /* ignore */ });
}

start();
