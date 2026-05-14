import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ─── Health check for UptimeRobot ───
app.get('/health', (req, res) => res.status(200).send('OK'));

// Serve static files from Vite build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB max file size
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// ─── HTTP Routes ───
app.post('/api/upload', upload.single('file'), (req, res) => {
  const { roomCode, senderId, senderName, senderType } = req.body;
  const file = req.file;

  if (!file || !roomCode) {
    return res.status(400).json({ error: 'Missing file or room code' });
  }

  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const fullItem = {
    id: crypto.randomUUID(),
    type: 'file',
    fileName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
    content: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    senderId,
    senderName: senderName || 'Unknown',
    senderType: senderType || 'desktop',
    timestamp: Date.now(),
    pinned: false,
  };

  addItemToRoom(room, fullItem);
  trackItemShared();
  
  // Broadcast to the room
  io.to(roomCode).emit('new-item', fullItem);
  
  console.log(`📁 File uploaded via POST to room "${roomCode}": ${file.originalname}`);
  res.json({ success: true, item: fullItem });
});

// ─── Word lists for memorable room codes ───
const adjectives = [
  'swift','calm','bold','bright','cool','dark','deep','fast','free','gold',
  'grand','keen','kind','lazy','loud','neat','pure','rare','rich','safe',
  'shy','slim','soft','tall','tiny','true','vast','warm','wild','wise',
  'blue','red','green','amber','coral','ivory','jade','lime','mint','navy',
  'plum','rose','ruby','sage','teal','aqua','gray','pink','snow','onyx',
];
const nouns = [
  'tiger','river','cloud','storm','eagle','flame','frost','grove','haven','jewel',
  'knight','lemon','moon','night','ocean','pearl','quest','rain','spark','stone',
  'thorn','umbra','viper','wave','xenon','yield','zenith','apex','bird','cape',
  'dawn','echo','fern','gaze','hill','iris','jazz','kite','lake','mesa',
  'nest','opal','pine','quill','reef','star','tree','vine','wolf','yarn',
];

function generateRoomCode() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}-${noun}-${num}`;
}

// ─── In-memory room storage ───
const rooms = new Map();
const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORY = 50;

// ─── Global stats ───
let itemsSharedToday = 0;
let lastStatsReset = new Date().toDateString();

function trackItemShared() {
  const today = new Date().toDateString();
  if (today !== lastStatsReset) {
    itemsSharedToday = 0;
    lastStatsReset = today;
  }
  itemsSharedToday++;
}

function getOrCreateRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      code: roomCode,
      createdAt: Date.now(),
      devices: new Map(),
      items: [],
      pinnedIds: new Set(),
    });
  }
  const room = rooms.get(roomCode);
  room.lastActivity = Date.now();
  return room;
}

function addItemToRoom(room, item) {
  room.items.push(item);
  if (room.items.length > MAX_HISTORY) {
    room.items = room.items.slice(-MAX_HISTORY);
  }
  room.lastActivity = Date.now();
}

// ─── Cleanup stale rooms every 10 minutes ───
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > ROOM_EXPIRY_MS) {
      rooms.delete(code);
      console.log(`🗑️  Room "${code}" expired and removed.`);
    }
  }
}, 10 * 60 * 1000);

// ─── REST API ───
app.post('/api/rooms', (req, res) => {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }
  const room = getOrCreateRoom(code);
  res.json({ code: room.code, createdAt: room.createdAt });
});

app.get('/api/stats', (req, res) => {
  // Count rooms with at least one connected device
  let activeRooms = 0;
  let totalDevices = 0;
  for (const room of rooms.values()) {
    if (room.devices.size > 0) {
      activeRooms++;
      totalDevices += room.devices.size;
    }
  }
  const today = new Date().toDateString();
  if (today !== lastStatsReset) {
    itemsSharedToday = 0;
    lastStatsReset = today;
  }
  res.json({ activeRooms, totalDevices, itemsSharedToday });
});

app.get('/api/rooms/:code/exists', (req, res) => {
  const { code } = req.params;
  // Any code is valid - rooms are created on join
  res.json({ exists: rooms.has(code), code });
});

// ─── Socket.IO ───
io.on('connection', (socket) => {
  console.log(`🔌 Device connected: ${socket.id}`);

  let currentRoom = null;
  let deviceInfo = null;

  socket.on('join-room', ({ roomCode, device }) => {
    currentRoom = roomCode;
    deviceInfo = {
      id: socket.id,
      name: device?.name || 'Unknown Device',
      type: device?.type || 'desktop',
      joinedAt: Date.now(),
    };

    const room = getOrCreateRoom(roomCode);
    room.devices.set(socket.id, deviceInfo);
    socket.join(roomCode);

    // Send existing items to the joining device
    socket.emit('room-state', {
      items: room.items,
      pinnedIds: [...room.pinnedIds],
      devices: [...room.devices.values()],
    });

    // Notify others in the room
    socket.to(roomCode).emit('device-joined', {
      device: deviceInfo,
      devices: [...room.devices.values()],
    });

    console.log(`📱 ${deviceInfo.name} (${deviceInfo.type}) joined room "${roomCode}" — ${room.devices.size} device(s)`);
  });

  socket.on('send-item', ({ roomCode, item }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const fullItem = {
      id: crypto.randomUUID(),
      ...item,
      senderId: socket.id,
      senderName: deviceInfo?.name || 'Unknown',
      senderType: deviceInfo?.type || 'desktop',
      timestamp: Date.now(),
      pinned: false,
    };

    addItemToRoom(room, fullItem);
    trackItemShared();

    // Send to ALL devices in the room (including sender for confirmation)
    io.to(roomCode).emit('new-item', fullItem);
    console.log(`📋 Item sent in room "${roomCode}": ${item.type} (${item.content?.length || 0} chars)`);
  });

  socket.on('send-file', ({ roomCode, fileData, metadata }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const fullItem = {
      id: crypto.randomUUID(),
      type: 'file',
      fileName: metadata.name,
      fileSize: metadata.size,
      fileType: metadata.type,
      content: fileData, // base64
      senderId: socket.id,
      senderName: deviceInfo?.name || 'Unknown',
      senderType: deviceInfo?.type || 'desktop',
      timestamp: Date.now(),
      pinned: false,
    };

    addItemToRoom(room, fullItem);
    trackItemShared();
    io.to(roomCode).emit('new-item', fullItem);
    console.log(`📁 File sent in room "${roomCode}": ${metadata.name} (${(metadata.size / 1024).toFixed(1)} KB)`);
  });

  socket.on('toggle-pin', ({ roomCode, itemId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const item = room.items.find((i) => i.id === itemId);
    if (item) {
      item.pinned = !item.pinned;
      if (item.pinned) {
        room.pinnedIds.add(itemId);
      } else {
        room.pinnedIds.delete(itemId);
      }
      io.to(roomCode).emit('item-pinned', { itemId, pinned: item.pinned });
    }
  });

  socket.on('delete-item', ({ roomCode, itemId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.items = room.items.filter((i) => i.id !== itemId);
    room.pinnedIds.delete(itemId);
    io.to(roomCode).emit('item-deleted', { itemId });
  });

  socket.on('clear-history', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.items = [];
    room.pinnedIds.clear();
    io.to(roomCode).emit('history-cleared');
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.devices.delete(socket.id);
        socket.to(currentRoom).emit('device-left', {
          deviceId: socket.id,
          devices: [...room.devices.values()],
        });
        console.log(`👋 ${deviceInfo?.name || socket.id} left room "${currentRoom}" — ${room.devices.size} device(s) remaining`);

        // Don't delete empty rooms - they persist for 24h for re-joining
      }
    }
    console.log(`❌ Device disconnected: ${socket.id}`);
  });
});

// ─── SPA Fallback (must be after API routes) ───
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Portal server running on http://localhost:${PORT}\n`);
});
