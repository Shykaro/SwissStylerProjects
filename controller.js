import config from './config.js';

const playerCountElem = document.getElementById('player-count');
const readyCountElem = document.getElementById('ready-count');
const startGameButton = document.getElementById('start-game-button');
const playerReadyContainer = document.getElementById('player-ready-container');
const errorMessageElem = document.getElementById('error-message');

const playerBoxes = {};
let playerCount = 0;

console.log('Connecting to WebSocket server at:', `${config['websocket-url']}controller`);
const socket = new WebSocket(`${config['websocket-url']}controller`);

socket.addEventListener('open', () => {
  console.log('WebSocket connection opened');
  setInterval(() => {
    if (socket.readyState === socket.OPEN) {
      socket.send('');
    }
  }, 10000);
  socket.send(JSON.stringify(['request-player-count'])); // Spieleranzahl anfordern
});

socket.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.addEventListener('close', (event) => {
  console.error('WebSocket connection closed:', event);
});

socket.addEventListener('message', (event) => {
  if (event.data) {
    try {
      const data = JSON.parse(event.data);
      console.log('Message received from server:', data);
      switch (data[0]) {
        case 'player-count':
          console.log('Current playercount (before data[1]): ', playerCount);
          playerCount = data[1];
          localStorage.setItem('playerCount', playerCount); // Spieleranzahl im localStorage speichern
          updatePlayerStates(data[2]); // Aktualisieren Sie den Zustand der Spieler
          break;
        case 'player-ready':
          updatePlayerStates(data[1]);
          break;
        case 'player-states':
          updatePlayerStates(data[1]);
          break;
        case 'player-disconnected':
          removePlayerBox(data[1]);
          break;
        case 'error':
          showError(data[1]);
          break;
        default:
          console.error(`Unknown message type: ${data[0]}`);
      }
    } catch (error) {
      console.error('Error parsing message from server:', error);
    }
  }
});

startGameButton.addEventListener('click', () => {
  console.log('Start game button clicked');
  socket.send(JSON.stringify(['start-game', playerCount]));
  localStorage.setItem('playerCount', playerCount);
  console.log(`Stored player count in localStorage: ${playerCount}`);
  setTimeout(() => {
    window.location.href = 'game.html';
  }, 100);
});

function updatePlayerStates(states) {
  const playerCount = Object.keys(states).length;
  const readyCount = Object.values(states).filter(player => player.ready).length;

  playerCountElem.innerHTML = playerCount;
  readyCountElem.innerHTML = readyCount;

  // Aktualisieren Sie die Spielerboxen basierend auf dem aktuellen Status
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
      playerBoxes[boxIndex].style.borderColor = state.color;
      playerBoxes[boxIndex].style.borderWidth = '2px';
      playerBoxes[boxIndex].style.borderStyle = 'solid';

      const img = document.createElement('img');
      img.src = 'Player.png';
      img.alt = 'Player Image';
      img.style.width = '100%';
      img.style.height = '100%';

      const existingImg = playerBoxes[boxIndex].querySelector('img');
      if (existingImg) {
        playerBoxes[boxIndex].removeChild(existingImg);
      }

      playerBoxes[boxIndex].appendChild(img);
    } else {
      playerBoxes[boxIndex].style.backgroundColor = 'transparent';
      playerBoxes[boxIndex].style.borderColor = 'white';
    }
  }

  const canStart = Object.values(states).length > 0 && Object.values(states).every(player => player.ready);
  startGameButton.disabled = !canStart;
}

function removePlayerBox(playerId) {
  const boxIndex = playerId;
  const box = playerBoxes[boxIndex];
  if (box) {
    box.remove();
    delete playerBoxes[boxIndex];
  }

  const playerCount = Object.keys(playerBoxes).length;
  playerCountElem.innerHTML = playerCount;
}

function showError(message) {
  errorMessageElem.innerText = message;
  errorMessageElem.style.display = 'block';
  setTimeout(() => {
    errorMessageElem.style.display = 'none';
  }, 5000);
}
