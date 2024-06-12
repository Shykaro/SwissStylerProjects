import config from './config.js';

const playerCountElem = document.getElementById('player-count');
const readyCountElem = document.getElementById('ready-count');
const startGameButton = document.getElementById('start-game-button');
const playerReadyContainer = document.getElementById('player-ready-container');
const canvas = document.getElementById('controller-canvas');
const context = canvas.getContext('2d');

const socket = new WebSocket(`${config['websocket-url']}controller`);

const playerBoxes = {};

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
          updatePlayerCount(data[1], data[2]);
          break;
        case 'draw-point':
          changeBackgroundColor(data[3]);
          break;
        case 'player-ready':
          updatePlayerReady(data[1], data[2]);
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

function updatePlayerCount(playerCount, readyCount) {
  playerCountElem.innerHTML = playerCount;
  readyCountElem.innerHTML = readyCount;

  // Only create player boxes if they do not exist
  if (Object.keys(playerBoxes).length !== playerCount) {
    // Clear existing player boxes
    playerReadyContainer.innerHTML = '';
    for (let i = 0; i < playerCount; i++) {
      const box = document.createElement('div');
      box.classList.add('player-box');
      box.setAttribute('data-index', i);
      playerReadyContainer.appendChild(box);
      playerBoxes[i] = box;
      console.log(`Created box for player ${i}`);
    }
  }
}

function updatePlayerReady(index, color) {
  console.log(`Updating player ${index} box with color ${color}`);
  const box = playerBoxes[index];
  if (box) {
    console.log(`Player box before update: ${box.style.backgroundColor}`);
    box.style.backgroundColor = color;
    console.log(`Player box after update: ${box.style.backgroundColor}`);
  } else {
    console.log(`Player box for index ${index} not found`);
  }
}

function changeBackgroundColor(color) {
  console.log('Changing background color to:', color);
  document.body.style.backgroundColor = color;
  setTimeout(() => {
    console.log('Resetting background color to black');
    document.body.style.backgroundColor = '#000';
  }, 200);
}
