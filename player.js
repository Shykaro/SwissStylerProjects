import config from './config.js';

const socket = new WebSocket(config['websocket-url']);
let playerId = localStorage.getItem('playerId');
let isGameStarted = false;
let playerColor = null;

socket.addEventListener('open', () => {
  console.log('WebSocket connection opened');
  sendMessage(['player-connect', playerId]);
});

socket.addEventListener('message', (event) => {
  if (event.data) {
    try {
      const data = JSON.parse(event.data);
      console.log('Message received from server:', data);
      switch (data[0]) {
        case 'player-index':
          playerId = data[1];
          localStorage.setItem('playerId', playerId);
          playerColor = data[2];
          displayMessage('Tap screen to start!', true);
          window.addEventListener('touchend', startPlaying);
          break;
        case 'start-game':
          isGameStarted = true;
          displayMessage('Game started! Tap to play.');
          break;
        default:
          console.error(`Unknown message type: ${data[0]}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
});

function sendMessage(message) {
  const str = JSON.stringify(message);
  console.log('Sending message to server:', str);
  socket.send(str);
}

function startPlaying() {
  window.removeEventListener('touchend', startPlaying);
  sendMessage(['player-ready', playerId]);
  displayMessage('Ready to play!');
  window.addEventListener('touchend', sendTouchPosition);
}

function sendTouchPosition(event) {
  if (!isGameStarted) return;

  const playerIndex = parseInt(playerId, 10); // Spielerindex ab 1 senden
  sendMessage(['player-action', playerIndex]);
}

function displayMessage(text, title = false) {
  const playerMessage = document.getElementById('player-message');
  playerMessage.innerHTML = text;
}
