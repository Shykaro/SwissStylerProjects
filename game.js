import config from './config.js';

const socket = new WebSocket(`${config['websocket-url']}game`);
let playerCount = parseInt(localStorage.getItem('playerCount')) || 0; // Spieleranzahl aus dem localStorage lesen
let score = 0;
let balls = [];
let canvases = [];
let redAreaImages = [];
let topLeftImages = [];
let topRightImages = [];
let ballClicked = false;
let actionInProgress = false; // Flag to prevent duplicate processing

// Bildpfade für jeden roten Bereich
let redAreaImagePaths = [
  '/GIFs/Blue_back.gif',
  '/GIFs/Green_back.gif',
  '/GIFs/Orange_back.gif',
  '/GIFs/Pink_back.gif',
  '/GIFs/Yellow_back.gif'
];

// Bildpfade für die oberen linken und rechten Ecken
let topLeftImagePaths = [
  '/GIFs/Yellow_front.gif',
  '/GIFs/Blue_front.gif',
  '/GIFs/Green_front.gif',
  '/GIFs/Orange_front.gif',
  '/GIFs/Pink_front.gif'
];

let topRightImagePaths = [
  '/GIFs/Green_front.gif',
  '/GIFs/Orange_front.gif',
  '/GIFs/Pink_front.gif',
  '/GIFs/Yellow_front.gif',
  '/GIFs/Blue_front.gif'
];

socket.addEventListener('open', () => {
  console.log('WebSocket connection opened in game.js');
  if (playerCount > 0) {
    console.log(`Starting game with ${playerCount} players`);
    generateCanvases(playerCount); // Canvases basierend auf der gespeicherten Spieleranzahl generieren
  }
});

console.log(socket);

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Message received in game.js:', data);
  switch (data[0]) {
    case 'start-game':
      playerCount = data[1]; // Anzahl der Spieler erhalten
      console.log(`Starting game with ${playerCount} players`);
      generateCanvases(playerCount);
      break;
    case 'player-action':
      if (!actionInProgress) {
        console.log(`Player action received for player index ${data[1]}`);
        handlePlayerAction(data[1]); // Spieleraktionen (z.B. Drücken auf dem Handy)
      }
      break;
    default:
      console.error(`Unknown message type: ${data[0]}`);
  }
});

function handlePlayerAction(playerIndex) {
  console.log(`Handling action for player ${playerIndex}`);
  if (playerIndex >= 0 && playerIndex < redAreaImages.length) {

    if (!ballClicked) {
      ballClicked = true;
      actionInProgress = true; // Set flag to indicate action is in progress
      playSound();
      moveBallToTopRight(playerIndex);
      playGifOnce(redAreaImages[playerIndex], playerIndex); // GIF abspielen, wenn ein Spieler eine Aktion ausführt
      setTimeout(() => {
        ballClicked = false;
        actionInProgress = false; // Reset flag after action is processed
      }, 500);
    }
  } else {
    console.error(`Invalid player index: ${playerIndex}`);
  }
}

function playGifOnce(image, index) {
  if (image && allPlayerFrames[index]) {
    // Preload all images for the given index
    preloadImages(allPlayerFrames[index]);

    // Set the first frame immediately
    image.src = allPlayerFrames[index][0];

    // Loop through all frames and set a timeout for each frame with an increasing delay
    for (let i = 1; i < allPlayerFrames[index].length; i++) {
      setTimeout(() => {
        image.src = allPlayerFrames[index][i];
      }, 30 * i);
    }
  } else {
    console.error(`Invalid image or frames for index: ${index}`);
  }
}

function preloadImages(frames) {
  if (frames) {
    frames.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  } else {
    console.error('No frames provided to preload');
  }
}

export function generateCanvases(numCanvases) {
  console.log(`Generating ${numCanvases} canvases`);
  let container = document.getElementById('canvasContainer');
  container.innerHTML = ''; // Vorherige Canvas-Felder löschen

  for (let i = 0; i < numCanvases; i++) {
    let canvas = document.createElement('canvas');
    canvas.className = 'canva';
    container.appendChild(canvas);
  }

  canvases = document.querySelectorAll('.canva');
  initializeBalls();
}

function initializeBalls() {
  balls = [createBall(0, 10, 10, 1, 4)]; // Initialisiere die Bälle hier

  // Bilder laden und IDs zuweisen
  redAreaImagePaths.forEach((path, index) => {
    let img = new Image();
    img.src = path;
    img.id = `gif${index * 3 + 1}`; // ID zuweisen
    redAreaImages[index] = img;
  });

  topLeftImagePaths.forEach((path, index) => {
    let img = new Image();
    img.src = path;
    img.id = `gif${index * 3 + 2}`; // ID zuweisen
    topLeftImages[index] = img;
  });

  topRightImagePaths.forEach((path, index) => {
    let img = new Image();
    img.src = path;
    img.id = `gif${index * 3 + 3}`; // ID zuweisen
    topRightImages[index] = img;
  });

  drawCircle();
}

function createBall(canvasIndex, x, y, dx, dy) {
  return { canvasIndex, x, y, dx, dy, radius: 10, initialRadius: 10, angle: Math.atan2(dy, dx) };
}

function resetGame() {
  balls = [createBall(0, 10, 10, 1, 4)];
  score = 0;
  document.getElementById('score').innerText = `Punkte: ${score}`;
}

function drawCircle() {
  canvases.forEach((canvas, index) => {
    let context = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Bewegungsunschärfe erzeugen
    context.fillStyle = 'rgba(0, 0, 0, 0.05)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Bereich zeichnen und füllen
    const areaX = 0;
    const areaY = canvas.height * 4 / 5;
    const areaWidth = canvas.width;
    const areaHeight = canvas.height / 6;
    let gradient = context.createLinearGradient(areaX, areaY, areaX, areaY + areaHeight);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(areaX, areaY, areaWidth, areaHeight);
    context.strokeStyle = 'transparent';
    context.strokeRect(areaX, areaY, areaWidth, areaHeight);

    // Bild im roten Bereich zeichnen
    if (redAreaImages[index]) {
      context.drawImage(redAreaImages[index], areaX, areaY - 125, 275, 275);
    }

    // Bild in der oberen linken Ecke zeichnen
    if (topLeftImages[index]) {
      context.drawImage(topLeftImages[index], 0, 10, 70, 70);
    }

    // Bild in der oberen rechten Ecke zeichnen
    if (topRightImages[index]) {
      context.drawImage(topRightImages[index], canvas.width - 75, 10, 70, 70);
    }

    // Bälle zeichnen
    balls.forEach(ball => {
      if (ball.canvasIndex === index) {
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
        context.fillStyle = 'white';
        context.fill();
        context.closePath();
      }
    });
  });

  // Bewegung der Bälle aktualisieren
  balls.forEach(updateBall);

  requestAnimationFrame(drawCircle);
}

function updateBall(ball) {
  let canvas = canvases[ball.canvasIndex];
  let h = canvas.clientHeight;
  let w = canvas.clientWidth;

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Entfernung zum roten Bereich berechnen
  const areaY = h * 2 / 3;
  const areaHeight = h / 3;
  const distanceFromRed = Math.abs(ball.y - (areaY + areaHeight / 2));
  const maxDistance = h / 2; // Maximale Entfernung, bei der der Ball noch sichtbar ist

  // Radius basierend auf der Entfernung anpassen
  ball.radius = ball.initialRadius * (1 - 0.5 * (distanceFromRed / maxDistance));

  // Wenn der Ball die Oberseite erreicht, verschwindet er und ein neuer Spiegelball wird im nächsten Canvas erstellt
  if (ball.y + ball.radius < 0) {
    const nextCanvasIndex = (ball.canvasIndex + 1) % canvases.length;
    balls.push(createBall(nextCanvasIndex, 10, 10, 5 * Math.cos(ball.angle), -5 * Math.sin(ball.angle)));
    balls = balls.filter(b => b !== ball); // Ball entfernen
    return;
  }

  // Wenn der Ball die Unterseite erreicht, das Spiel zurücksetzen
  if (ball.y + ball.radius > h) {
    resetGame();
    return;
  }

  // Wenn der Ball die rechte Kante erreicht, zum nächsten Canvas springen
  if (ball.x + ball.radius > w) {
    ball.canvasIndex++;
    if (ball.canvasIndex >= canvases.length) {
      ball.canvasIndex = 0; // Zurück zum ersten Canvas, wenn das Ende erreicht ist
    }
    ball.x = ball.radius; // Ball startet am linken Rand des nächsten Canvas
  }

  // Wenn der Ball die linke Kante erreicht, zum vorherigen Canvas springen
  if (ball.x - ball.radius < 0) {
    ball.canvasIndex--;
    if (ball.canvasIndex < 0) {
      ball.canvasIndex = canvases.length - 1; // Zum letzten Canvas, wenn das erste erreicht ist
    }
    ball.x = w - ball.radius; // Ball startet am rechten Rand des vorherigen Canvas
  }
}

function moveBallToTopRight(index) {
  balls.forEach(ball => {
    if (ball.canvasIndex === index && isBallInRedArea(ball)) {
      // Geschwindigkeit erhöhen
      ball.dx = 1.2;
      ball.dy = 1.2;
      shootBallToTopRight(ball);
      const nextCanvasIndex = (ball.canvasIndex + 1) % canvases.length;
      balls.push(createBall(nextCanvasIndex, 10, 10, 5 * Math.cos(ball.angle), -5 * Math.sin(ball.angle)));

      score++;
      document.getElementById('score').innerText = `Punkte: ${score}`;
    }
  });
}

function shootBallToTopRight(ball) {
  console.log("ShootBattTopRight wurde aufgerufen");
  const canvas = canvases[ball.canvasIndex];
  const targetX = canvas.clientWidth - ball.radius - 10; // Zielposition nahe der oberen rechten Ecke
  const targetY = ball.radius + 10;

  // Berechnung der Geschwindigkeit in Richtung des Zielpunkts
  ball.angle = Math.atan2(targetY - ball.y, targetX - ball.x);
  ball.dx = 5 * Math.cos(ball.angle);
  ball.dy = 5 * Math.sin(ball.angle);
}

function isBallInRedArea(ball) {
  const canvas = canvases[ball.canvasIndex];
  const areaY = canvas.height * 4 / 5;
  const areaHeight = canvas.height / 6;
  return ball.y > areaY && ball.y < areaY + areaHeight;
}

let allPlayerFrames = [
  // Beispiel-Daten: Liste von Frame-URLs für jeden Spieler
  // Fügen Sie reale Daten entsprechend hinzu
  ['frame1.png', 'frame2.png', 'frame3.png'], // Spieler 1 Frames
  ['frame1.png', 'frame2.png', 'frame3.png'], // Spieler 2 Frames
  // Fügen Sie mehr Frames für andere Spieler hinzu...
];

function loadFrames() {
  fetch('playerFrames.json')
    .then(response => response.json())
    .then(data => {
      allPlayerFrames = data.allPlayerFrames; // Speichern der Daten in der globalen Variable
      allPlayerFrames.forEach(frames => preloadImages(frames));
    })
    .catch(error => console.error('Error loading frames:', error));
}

window.onload = loadFrames;

window.addEventListener('keydown', (event) => {
  if (!ballClicked) {
    const key = event.key;
    if (key >= '1' && key <= '5') {
      const index = parseInt(key) - 1;
      if (index < canvases.length) {
        ballClicked = true;
        playSound();
        moveBallToTopRight(index);
        playGifOnce(redAreaImages[index], index);
        setTimeout(() => {
          ballClicked = false;
        }, 500);
      }
    }
  }
});

function playSound() {
  var sound = new Audio('baseballHit.mp3');
  sound.play();
}

document.addEventListener('DOMContentLoaded', () => {
  if (playerCount) {
    console.log(`Generating canvases on page load for ${playerCount} players`);
    generateCanvases(playerCount);
  } else {
    console.log('No player count found in localStorage on page load');
  }
});

document.getElementById('generateButton').addEventListener('click', () => {
  const numCanvases = parseInt(document.getElementById('numCanvases').value);
  console.log(`Button clicked to generate ${numCanvases} canvases`);
  generateCanvases(numCanvases);
});
