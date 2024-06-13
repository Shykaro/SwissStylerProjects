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
    console.log(`Player box before update: ${box.style.backgroundColor}`);
    //box.style.backgroundColor = color;
    //box.style.bord = color;
    console.log(`Player box after update: ${box.style.backgroundColor}`);
  } else {
    console.log(`Player box for index ${index} not found`);
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


    // Only update the box color if the player is ready
    if (state.ready) {
      playerBoxes[boxIndex].style.backgroundColor = state.color;
      console.log(`Player ${boxIndex} box updated to color ${state.color}`);
      playerBoxes[boxIndex].style.borderColor = state.color;
      playerBoxes[boxIndex].style.borderWidth = '2px'; // Ensure the border is visible
      playerBoxes[boxIndex].style.borderStyle = 'solid'; // Define border style if not already set
      console.log(`Player ${boxIndex} box border updated to color ${state.color}`);

      // Create an img element
      const img = document.createElement('img');
      img.src = 'Player.png'; // Set the source of the image
      img.alt = 'Player Image'; // Alternative text for the image
      img.style.width = '100%'; // Set the image to take up the full width of the box
      img.style.height = '100%'; // Set the image to take up the full height of the box

      // Remove any existing image before adding the new one
      const existingImg = playerBoxes[boxIndex].querySelector('img');
      if (existingImg) {
        playerBoxes[boxIndex].removeChild(existingImg);
      }

      // Append the new image to the box
      playerBoxes[boxIndex].appendChild(img);
      console.log(`Player ${boxIndex} box image updated with ${state.imgUrl}`);
    } else {
      playerBoxes[boxIndex].style.borderColor = 'white'; // Or any default border color
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
