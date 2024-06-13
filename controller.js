import config from './config.js';

const playerCountElem = document.getElementById('player-count');
const readyCountElem = document.getElementById('ready-count');
const startGameButton = document.getElementById('start-game-button');
const playerReadyContainer = document.getElementById('player-ready-container');
const errorMessageElem = document.getElementById('error-message');

const playerBoxes = {};
let playerCount = 0;

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
          playerCount = data[1];
          updatePlayerCount(data[1], data[2]);
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
  console.log('Start game button clicked'); // Debug-Log hinzugefügt
  socket.send(JSON.stringify(['start-game', playerCount])); // Spieleranzahl senden
  localStorage.setItem('playerCount', playerCount); // Spieleranzahl im localStorage speichern
  setTimeout(() => {
    window.location.href = 'game.html';
  }, 100); // 100ms Verzögerung einfügen, um sicherzustellen, dass die Nachricht gesendet wird
});

function updatePlayerCount(playerCount, readyCount) {
  playerCountElem.innerHTML = playerCount;
  readyCountElem.innerHTML = readyCount;

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
  const box = playerBoxes[index];
  if (box) {
    box.style.backgroundColor = color;
  }
}

function updatePlayerStates(states) {
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
      box.classList.add('player-box' + boxIndex);
      playerReadyContainer.appendChild(box);
      playerBoxes[boxIndex] = box;
    }
    if (state.ready) {
      playerBoxes[boxIndex].style.backgroundColor = state.color;
    } else {
      playerBoxes[boxIndex].style.backgroundColor = 'transparent';
    }
  }

  const canStart = Object.values(states).length > 0 && Object.values(states).every(player => player.ready);
  startGameButton.disabled = !canStart;
}

function showError(message) {
  errorMessageElem.innerText = message;
  errorMessageElem.style.display = 'block';
  setTimeout(() => {
    errorMessageElem.style.display = 'none';
  }, 5000);
}
