import config from './config.js';

const playerCountElem = document.getElementById('player-count');
const readyCountElem = document.getElementById('ready-count');
const startGameButton = document.getElementById('start-game-button');
const playerReadyContainer = document.getElementById('player-ready-container');
const errorMessageElem = document.getElementById('error-message');
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
        case 'player-states':
          updatePlayerStates(data[1]);
          break;
        case 'error':
          showError(data[1]);
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
});

function updatePlayerCount(playerCount, readyCount) {
  playerCountElem.innerHTML = playerCount;
  readyCountElem.innerHTML = readyCount;

  // Add new player boxes if necessary
  for (let i = 0; i < playerCount; i++) {
    if (!playerBoxes[i]) {
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

function updatePlayerStates(states) {
  console.log('Updating player states:', states);
  const playerCount = Object.keys(states).length;
  const readyCount = Object.values(states).filter(player => player.ready).length;

  playerCountElem.innerHTML = playerCount;
  readyCountElem.innerHTML = readyCount;

  for (const [index, state] of Object.entries(states)) {
    const boxIndex = parseInt(index, 10);
    if (!playerBoxes[boxIndex]) {
      const box = document.createElement('div');
      box.classList.add('player-box');
      box.setAttribute('data-index', boxIndex);
      playerReadyContainer.appendChild(box);
      playerBoxes[boxIndex] = box;
      console.log(`Created box for player ${boxIndex}`);
    }
    // Only update the box color if the player is ready
    if (state.ready) {
      playerBoxes[boxIndex].style.backgroundColor = state.color;
      console.log(`Player ${boxIndex} box updated to color ${state.color}`);
    } else {
      playerBoxes[boxIndex].style.backgroundColor = 'transparent'; // Or any default color
    }
  }

  // Enable or disable the start game button based on the player states
  const canStart = Object.values(states).length > 0 && Object.values(states).every(player => player.ready);
  startGameButton.disabled = !canStart;
}

function changeBackgroundColor(color) {
  console.log('Changing background color to:', color);
  document.body.style.backgroundColor = color;
  setTimeout(() => {
    console.log('Resetting background color to black');
    document.body.style.backgroundColor = '#000';
  }, 200);
}

function showError(message) {
  errorMessageElem.innerText = message;
  errorMessageElem.style.display = 'block';
  setTimeout(() => {
    errorMessageElem.style.display = 'none';
  }, 5000);
}
