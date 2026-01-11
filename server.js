const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const STATIC_PORT = process.env.PORT || 3000;
const TCP_HOST = process.env.TCP_HOST || '127.0.0.1';
const TCP_PORT = parseInt(process.env.TCP_PORT || '5555', 10);

app.use(express.static('public'));

let tcpConn = null;
let tcpConnected = false;

// Keep track of connected WS bridges (PC-side) and controllers (phone)
const wsBridges = new Set();
const wsControllers = new Set();

function connectTcp() {
  if (tcpConn) return;
  tcpConn = new net.Socket();
  tcpConn.connect(TCP_PORT, TCP_HOST, () => {
    tcpConnected = true;
    console.log('Connected to local TCP bridge', TCP_HOST, TCP_PORT);
    broadcastBridgeStatus();
  });
  tcpConn.on('data', (d) => {
    console.log('TCP <-', d.toString());
  });
  tcpConn.on('close', () => {
    console.log('TCP connection closed');
    tcpConn = null;
    tcpConnected = false;
    broadcastBridgeStatus();
    setTimeout(connectTcp, 2000);
  });
  tcpConn.on('error', (err) => {
    console.log('TCP error', err.message);
    tcpConn.destroy();
    tcpConn = null;
    tcpConnected = false;
    broadcastBridgeStatus();
    setTimeout(connectTcp, 2000);
  });
}

function sendToControllers(obj) {
  // prune controllers and send
  for (const c of Array.from(wsControllers)) {
    try {
      if (c.readyState !== WebSocket.OPEN) { wsControllers.delete(c); continue; }
      c.send(JSON.stringify(obj));
    } catch (e) { wsControllers.delete(c); }
  }
}

function activeBridgeCount() {
  // prune dead bridges and count only open sockets
  for (const b of Array.from(wsBridges)) {
    if (b.readyState !== WebSocket.OPEN) wsBridges.delete(b);
  }
  return wsBridges.size;
}

function broadcastBridgeStatus() {
  const available = tcpConnected || activeBridgeCount() > 0;
  sendToControllers({ type: 'bridge-status', available });
}

// Periodically broadcast bridge status to controllers to keep UI accurate
setInterval(broadcastBridgeStatus, 2000);

connectTcp();

function forwardToTcp(obj) {
  const s = JSON.stringify(obj) + '\n';
  if (tcpConnected && tcpConn) {
    tcpConn.write(s);
    return true;
  }
  console.log('No TCP connection — would send:', s.trim());
  return false;
}

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  ws._role = null; // 'controller' or 'bridge'
  ws.send(JSON.stringify({ type: 'welcome', tcpConnected }));

  ws.on('message', (message) => {
    let obj = null;
    try {
      obj = JSON.parse(message);
    } catch (e) {
      console.log('Invalid JSON from client');
      return;
    }

    // Role identification for bridge clients
    if (!ws._role) {
      if (obj && obj.identify === 'bridge') {
        ws._role = 'bridge';
        wsBridges.add(ws);
        console.log('Registered WS bridge client');
        ws.send(JSON.stringify({ type: 'identified', role: 'bridge' }));
        broadcastBridgeStatus();
        return;
      }
      // first message wasn't an identify -> treat as controller
      ws._role = 'controller';
      wsControllers.add(ws);
      // send immediate bridge status to the controller
      ws.send(JSON.stringify({ type: 'bridge-status', available: tcpConnected || wsBridges.size > 0 }));
    }

    if (ws._role === 'controller') {
      console.log('Controller WS <-', obj);
      // forward to TCP if available
      const okTcp = forwardToTcp(obj);
      // forward to any connected WS bridges
      let okWs = false;
      wsBridges.forEach((b) => {
        try { b.send(JSON.stringify(obj)); okWs = true; } catch (e) {}
      });
      const ok = okTcp || okWs;
      ws.send(JSON.stringify({ type: 'ack', ok }));
      return;
    }

    if (ws._role === 'bridge') {
      // bridge can send status updates or responses if needed
      console.log('Bridge WS <-', obj);
      return;
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (ws._role === 'bridge') {
      wsBridges.delete(ws);
      broadcastBridgeStatus();
    }
    if (ws._role === 'controller') wsControllers.delete(ws);
  });
});

// Fallback route for root
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(STATIC_PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${STATIC_PORT}`);
  console.log(`Forwarding to TCP ${TCP_HOST}:${TCP_PORT}`);
});
