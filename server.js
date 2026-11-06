const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'js')));

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username || 'Anonymous';

    if (!rooms[roomId]) {
      rooms[roomId] = { currentUrl: '', isPlaying: false, currentTime: 0 };
    }

    socket.emit('init-state', rooms[roomId]);
    socket.to(roomId).emit('chat-message', {
      user: 'System',
      text: `${socket.username} room me aa gaya!`
    });
  });

  socket.on('sync-action', (data) => {
    if (rooms[data.roomId]) {
      rooms[data.roomId].isPlaying = data.action === 'PLAY';
      rooms[data.roomId].currentTime = data.currentTime;
    }
    socket.to(data.roomId).emit('apply-sync', data);
  });

  socket.on('change-media', (data) => {
    if (rooms[data.roomId]) {
      rooms[data.roomId].currentUrl = data.url;
      rooms[data.roomId].currentTime = 0;
      rooms[data.roomId].isPlaying = true;
    }
    io.to(data.roomId).emit('media-changed', data);
  });

  socket.on('send-chat', (data) => {
    io.to(data.roomId).emit('chat-message', data);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
