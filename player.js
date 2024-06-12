import config from './config.js';

const socket = new WebSocket(config['websocket-url']);
let playerIndex = null;
let isGameStarted = false;
let playerColor = null;

socket.addEventListener('open', () => {
  console.log('WebSocket connection opened');
  sendMessage(['get-params']);
});

socket.addEventListener('message', (event) => {
  if (event.data) {
    try {
      const data = JSON.parse(event.data);
      console.log('Message received from server:', data);
      switch (data[0]) {
        case 'player-index':
          playerIndex = data[1];
          playerColor = data[2];
          console.log(`Player index: ${playerIndex}, color: ${playerColor}`);
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
  sendMessage(['player-ready', playerIndex]);
  displayMessage('Ready to play!');
  window.addEventListener('touchend', sendTouchPosition);
}

function sendTouchPosition(event) {
  if (!isGameStarted) return;

  const x = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
  const y = event.changedTouches ? event.changedTouches[0].pageY : event.pageY;
  console.log('Touch position:', { x, y, color: playerColor });
  sendMessage(['draw-point', x, y, playerColor]);
}

function displayMessage(text, title = false) {
  const playerMessage = document.getElementById('player-message');
  playerMessage.innerHTML = text;
}
