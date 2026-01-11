(() => {
  const statusEl = document.getElementById('status');
  const wsProto = (location.protocol === 'https:') ? 'wss' : 'ws';
  const wsUrl = wsProto + '://' + location.host;
  const ws = new WebSocket(wsUrl);

  function setStatus(t) { statusEl.textContent = t; }

  ws.addEventListener('open', () => { setStatus('server: connected'); updateButtons(false); });
  ws.addEventListener('close', () => { setStatus('server: disconnected'); updateButtons(false); });
  ws.addEventListener('error', () => { setStatus('server: error'); updateButtons(false); });
  ws.addEventListener('message', (m) => {
    try {
      const obj = JSON.parse(m.data);
      console.log('Server:', obj);
      if (obj && obj.type === 'ack') {
        // brief ack, but do not indicate bridge availability here
        setStatus(obj.ok ? 'sent' : 'no-bridge');
        setTimeout(() => setStatus(ws.readyState===1 ? 'server: connected' : 'server: disconnected'), 600);
      }
      if (obj && obj.type === 'bridge-status') {
        if (obj.available) {
          setStatus('bridge: connected');
          updateButtons(true);
        } else {
          setStatus('bridge: disconnected');
          updateButtons(false);
        }
      }
    } catch(e){}
  });

  function updateButtons(enabled) {
    document.querySelectorAll('button').forEach(b => b.disabled = !enabled);
  }

  // disable buttons until websocket ready
  updateButtons(false);

  document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const payload = JSON.parse(btn.getAttribute('data-action'));
      ws.send(JSON.stringify(payload));
    });
  });

  document.getElementById('allFlash').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'lights', mode: 'flash' }));
    ws.send(JSON.stringify({ type: 'siren', mode: 'off' }));
  });

  document.getElementById('panic').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'lights', mode: 'flash' }));
    ws.send(JSON.stringify({ type: 'siren', mode: 'wail' }));
  });
})();
