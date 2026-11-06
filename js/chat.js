const chatMessages = document.getElementById('chatMessages') || document.getElementById('chat-messages');
const chatInput = document.getElementById('chatInput') || document.getElementById('message-input');
const sendChatBtn = document.getElementById('sendChatBtn') || document.getElementById('send-btn');

function appendMessage(user, text) {
  if (!chatMessages) return;
  const msgDiv = document.createElement('div');
  msgDiv.className = 'mb-2 text-sm';

  if (user === 'System') {
    msgDiv.innerHTML = `<span class="text-xs text-gray-400 italic">${text}</span>`;
  } else {
    msgDiv.innerHTML = `<span class="font-bold text-indigo-400">${user}: </span><span class="text-gray-200">${text}</span>`;
  }
  
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on('chat-message', (data) => {
  appendMessage(data.user, data.text);
});

function handleSendMessage() {
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if (text && currentRoomId) {
    socket.emit('send-chat', {
      roomId: currentRoomId,
      user: currentUsername,
      text: text
    });
    chatInput.value = '';
  }
}

if (sendChatBtn) {
  sendChatBtn.addEventListener('click', handleSendMessage);
}

if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });
}
