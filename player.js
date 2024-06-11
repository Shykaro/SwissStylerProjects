import config from './config.js';

const socket = new WebSocket(config['websocket-url']);
let playerIndex = null;
let isGameStarted = false;

socket.addEventListener('open', () => {
  sendMessage(['get-params']);
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  switch (data[0]) {
    case 'player-index':
      playerIndex = data[1];
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
});

function sendMessage(message) {
  const str = JSON.stringify(message);
  socket.send(str);
}

function startPlaying() {
  window.removeEventListener('touchend', startPlaying);
  sendMessage(['player-ready', playerIndex]);
  displayMessage('Ready to play!');
  window.addEventListener('touchend', sendTouchPosition);
}

function sendTouchPosition(event) {
  if (!isGameStarted) return;

  const x = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
  const y = event.changedTouches ? event.changedTouches[0].pageY : event.pageY;
  const color = getRandomColor();
  sendMessage(['draw-point', x, y, color]);
}

function displayMessage(text, title = false) {
  const playerMessage = document.getElementById('player-message');
  playerMessage.innerHTML = text;
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
