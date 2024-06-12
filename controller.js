import config from './config.js';

const playerCountElem = document.getElementById('player-count');
const readyCountElem = document.getElementById('ready-count');
const startGameButton = document.getElementById('start-game-button');

const socket = new WebSocket(`${config['websocket-url']}controller`);

socket.addEventListener('open', () => {
  console.log('WebSocket connection opened');
  setInterval(() => {
    if (socket.readyState === socket.OPEN) {
      socket.send('');
    }
  }, 10000);
});

socket.addEventListener('message', (event) => {
  if (event.data) {
    try {
      const data = JSON.parse(event.data);
      console.log('Message received from server:', data);
      switch (data[0]) {
        case 'player-count':
          playerCountElem.innerHTML = data[1];
          readyCountElem.innerHTML = data[2];
          break;
        case 'draw-point':
          changeBackgroundColor(data[3]);
          break;
        default:
          console.error(`Unknown message type: ${data[0]}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
});

startGameButton.addEventListener('click', () => {
  socket.send(JSON.stringify(['start-game']));
  startGameButton.style.display = 'none';
});

function changeBackgroundColor(color) {
  console.log('Changing background color to:', color);
  document.body.style.backgroundColor = color;
  setTimeout(() => {
    document.body.style.backgroundColor = '#000';
  }, 200);
}
