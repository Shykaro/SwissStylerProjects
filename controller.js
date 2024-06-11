import config from './config.js';

const playerCountElem = document.getElementById('player-count');
const readyCountElem = document.getElementById('ready-count');
const startGameButton = document.getElementById('start-game-button');
const canvas = document.getElementById('controller-canvas');
const context = canvas.getContext('2d');

const socket = new WebSocket(`${config['websocket-url']}controller`);

socket.addEventListener('open', () => {
  setInterval(() => {
    if (socket.readyState === socket.OPEN) {
      socket.send('');
    }
  }, 10000);
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  switch (data[0]) {
    case 'player-count':
      playerCountElem.innerHTML = data[1];
      readyCountElem.innerHTML = data[2];
      break;
    case 'draw-point':
      drawPoint(data[1], data[2], data[3]);
      break;
    default:
      console.error(`Unknown message type: ${data[0]}`);
  }
});

startGameButton.addEventListener('click', () => {
  socket.send(JSON.stringify(['start-game']));
  startGameButton.style.display = 'none';
});

function drawPoint(x, y, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, 10, 0, 2 * Math.PI);
  context.fill();
}
