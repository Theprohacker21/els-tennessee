# ELS Remote (phone -> PC bridge)

Overview
- Small Node.js server that serves a phone-friendly web UI and forwards real-time commands to a local TCP bridge.

Files
- `server.js`: Express + WebSocket server. Forwards messages to TCP `127.0.0.1:5555` by default.
- `public/`: static site for phone controls (open from your phone browser).
- `bridge/bridge.py`: example Python TCP bridge that prints received JSON commands.
- `package.json`: Node dependency manifest.

Quick start

1. Install Node.js (v16+ recommended).
2. In a terminal, install deps and start the server:

```bash
npm install
npm start
```

The server will listen on port 3000 by default.

How to connect your phone
- Option A — Same Wi‑Fi network: open `http://<PC_IP>:3000` from your phone.
- Option B — USB tethering: enable USB tethering on your phone; open the PC IP shown in network settings (often `192.168.42.129` or similar) at port 3000.
- Option C — Android USB debug (adb): with the phone connected via USB and `adb` installed, run:

```bash
adb reverse tcp:3000 tcp:3000
```

Then open `http://localhost:3000` on the phone's browser.

Integrating with your ELS system
- The server forwards JSON lines (one per \n) to a TCP socket. Example message: `{ "type":"lights", "mode":"flash" }`.
- Run the example bridge to see messages:

```bash
python bridge/bridge.py
```

- Replace the TODO in `bridge.py` with code that sends commands to your ERLC/Els mod or API.

WebSocket bridge (recommended)
- You can run a Node-based bridge that connects to the server over WebSocket. This removes the need for a raw TCP bridge and works well across platforms.

```bash
node bridge/bridge-ws.js
```

When the web UI sends control messages the server will forward them to any connected WS bridge clients (or to the TCP bridge if configured).

Configuration
- Set `TCP_HOST` and `TCP_PORT` environment variables to change where the server forwards commands.
- Set `PORT` to change the web server port.

Security
- This initial version is local-network only and has no authentication. Only run on trusted local networks.
