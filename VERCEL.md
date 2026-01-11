# Deploying to Vercel

## Steps

1. **Install Vercel CLI** (if you haven't):
```bash
npm install -g vercel
```

2. **Authenticate** (one-time):
```bash
vercel login
```

3. **Deploy** from the project folder:
```bash
cd "C:\Users\anton\Desktop\iframe-bcine"
vercel
```

Vercel will prompt you to create a new project or link to an existing one. Follow the prompts.

## Access from Phone

After deployment, Vercel will give you a public URL like `https://els-remote-abc123.vercel.app`. 

On your phone, open:
```
https://els-remote-abc123.vercel.app
```

(Replace with your actual Vercel URL.)

## Bridge Connection

Your local PC bridge still runs on your machine:
```powershell
node bridge/bridge-ws.js
```

Update the bridge to connect to your Vercel URL:
```powershell
set SERVER=wss://els-remote-abc123.vercel.app
node bridge/bridge-ws.js
```

Or on PowerShell:
```powershell
$env:SERVER="wss://els-remote-abc123.vercel.app"
node bridge/bridge-ws.js
```

## Notes

- Vercel provides a public URL with HTTPS/WSS (secure WebSocket).
- Your bridge connects from your local PC to the cloud server, then your phone connects to the cloud server.
- All traffic is encrypted in transit.
