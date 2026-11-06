const socket = io();
let player = null;
let isRemoteUpdate = false;
let currentRoomId = null;
let currentUsername = 'User_' + Math.floor(Math.random() * 1000);

// URL से रूम कोड उठाओ या नया बनाओ
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');

if (roomFromUrl) {
  currentRoomId = roomFromUrl;
} else {
  currentRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  window.history.replaceState({}, '', `?room=${currentRoomId}`);
}

const roomDisplay = document.getElementById('roomCode') || document.getElementById('room-id');
if (roomDisplay) roomDisplay.innerText = currentRoomId;

socket.emit('join-room', { roomId: currentRoomId, username: currentUsername });

// YouTube API लोड करना
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: 'dQw4w9WgXcQ',
    playerVars: { playsinline: 1, rel: 0 },
    events: {
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
  if (isRemoteUpdate || !player) return;

  if (event.data === YT.PlayerState.PLAYING) {
    socket.emit('sync-action', {
      roomId: currentRoomId,
      action: 'PLAY',
      currentTime: player.getCurrentTime()
    });
  } else if (event.data === YT.PlayerState.PAUSED) {
    socket.emit('sync-action', {
      roomId: currentRoomId,
      action: 'PAUSE',
      currentTime: player.getCurrentTime()
    });
  }
}

// सर्वर से सिंक कमांड हैंडल करना
socket.on('apply-sync', (data) => {
  if (!player || typeof player.getPlayerState !== 'function') return;

  isRemoteUpdate = true;
  const localTime = player.getCurrentTime();

  if (Math.abs(localTime - data.currentTime) > 0.75) {
    player.seekTo(data.currentTime, true);
  }

  if (data.action === 'PLAY') {
    player.playVideo();
  } else if (data.action === 'PAUSE') {
    player.pauseVideo();
  }

  setTimeout(() => { isRemoteUpdate = false; }, 400);
});

// मीडिया चेंज हैंडल करना
socket.on('media-changed', (data) => {
  if (!player) return;
  const videoId = extractYouTubeID(data.url);
  if (videoId) {
    isRemoteUpdate = true;
    player.loadVideoById(videoId);
    setTimeout(() => { isRemoteUpdate = false; }, 800);
  }
});

// URL से YouTube ID निकालना
function extractYouTubeID(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// लोड मीडिया बटन
const loadBtn = document.getElementById('loadMediaBtn') || document.getElementById('load-btn');
const urlInput = document.getElementById('mediaUrl') || document.getElementById('url-input');

if (loadBtn && urlInput) {
  loadBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
      socket.emit('change-media', { roomId: currentRoomId, url: url });
      urlInput.value = '';
    }
  });
}
