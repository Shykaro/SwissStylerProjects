import config from './config.js';

const socket = new WebSocket(config['websocket-url']);
let playerCount = localStorage.getItem('playerCount'); // Spieleranzahl aus dem localStorage lesen
let score = 0;

function generateCanvases() {
  let numCanvases = document.getElementById('numCanvases').value;
  let container = document.getElementById('canvasContainer');
  container.innerHTML = ''; // Vorherige Canvas-Felder löschen

  for (let i = 0; i < numCanvases; i++) {
    let canvas = document.createElement('canvas');
    canvas.className = 'canva';
    container.append(canvas);
    canvas.id = "gifCanvas-" + i;
  }
}
socket.addEventListener('open', () => {
  console.log('WebSocket connection opened in game.js');
  if (playerCount) {
    console.log(`Starting game with ${playerCount} players`);  // Debug-Log hinzugefügt
    generateCanvases(playerCount); // Canvases basierend auf der gespeicherten Spieleranzahl generieren
  }
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Message received in game.js:', data);  // Debug-Log hinzugefügt
  switch (data[0]) {
    case 'start-game':
      playerCount = data[1]; // Anzahl der Spieler erhalten
      console.log(`Starting game with ${playerCount} players`);  // Debug-Log hinzugefügt
      generateCanvases(playerCount);
      break;
    case 'player-action':
      console.log(`Player action received for player index ${data[1]}`);  // Debug-Log hinzugefügt
      handlePlayerAction(data[1]); // Spieleraktionen (z.B. Drücken auf dem Handy)
      break;
    default:
      console.error(`Unknown message type: ${data[0]}`);
  }
});

function handlePlayerAction(playerIndex) {
  console.log(`Handling action for player ${playerIndex}`);  // Debug-Log hinzugefügt
  moveBallToTopRight(playerIndex);
}

function generateCanvases(numCanvases) {
  console.log(`Generating ${numCanvases} canvases`);  // Debug-Log hinzugefügt
  let container = document.getElementById('canvasContainer');
  container.innerHTML = ''; // Vorherige Canvas-Felder löschen

  for (let i = 0; i < numCanvases; i++) {
    let canvas = document.createElement('canvas');
    canvas.className = 'canva';
    container.appendChild(canvas);
  }

  initializeBalls();
}

// HIERRRRR
function createBall(canvasIndex, x, y, dx, dy) {
  return { canvasIndex, x, y, dx, dy, radius: 10, initialRadius: 10, angle: Math.atan2(dy, dx) };
}

// HIERRRRR
function resetGame() {
  balls = [createBall(0, 10, 10, 1, 4)];
}

function initializeBalls() {
  let canvases = document.querySelectorAll('.canva');
  let balls = [createBall(0, 10, 10, 1, 4)];

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

  context.fillStyle = 'rgba(0, 0, 0, 0.05)';
  context.fillRect(0, 0, canvas.width, canvas.height);


  // Bilder laden und IDs zuweisen
  redAreaImagePaths.forEach((path, index) => {
    let img = new Image();
    img.src = path;
    img.id = `#gif${index * 3 + 1}`; // ID zuweisen
    redAreaImages[index] = img;
  });

  topLeftImagePaths.forEach((path, index) => {
    let img = new Image();
    img.src = path;
    img.id = `#gif${index * 3 + 2}`; // ID zuweisen
    topLeftImages[index] = img;
  });


  topRightImagePaths.forEach((path, index) => {
    let img = new Image();
    img.src = path;
    img.id = `#gif${index * 3 + 3}`; // ID zuweisen
    topRightImages[index] = img;
  });

  ball.angle = Math.atan2(targetY - ball.y, targetX - ball.x);
  ball.dx = 5 * Math.cos(ball.angle);
  ball.dy = 5 * Math.sin(ball.angle);
}

function isBallInRedArea(ball) {
  const canvas = canvases[ball.canvasIndex];
  const areaY = canvas.height * 2 / 3;
  const areaHeight = canvas.height / 3;
  return ball.y > areaY && ball.y < areaY + areaHeight;
}

window.addEventListener('keydown', (event) => {
  const key = event.key;
  if (key >= '1' && key <= '5') {
    const index = parseInt(key) - 1;
    if (index < canvases.length) {
      moveBallToTopRight(index);
    }
  }
});

function resetGame() {
  balls = [createBall(0, 10, 10, 1, 4)]; // Stärker nach unten fliegen und weniger stark nach rechts
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
    const areaY = canvas.height * 2 / 3;
    const areaWidth = canvas.width;
    const areaHeight = canvas.height / 3;
    context.fillStyle = 'red';
    context.fillRect(areaX, areaY, areaWidth, areaHeight);
    context.strokeStyle = 'red';
    context.strokeRect(areaX, areaY, areaWidth, areaHeight);

    // Bild im roten Bereich zeichnen
    if (redAreaImages[index]) {
      context.drawImage(redAreaImages[index], areaX + 25, areaY + 2, areaWidth, areaHeight);
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
    balls.pop(); // Ball entfernen
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
      ball.dx *= 1.2;
      ball.dy *= 1.2;
      shootBallToTopRight(ball);
      const nextCanvasIndex = (ball.canvasIndex + 1) % canvases.length;
      balls.push(createBall(nextCanvasIndex, 10, 10, 5 * Math.cos(ball.angle), -5 * Math.sin(ball.angle)));

      score++;
      document.getElementById('score').innerText = `Punkte: ${score}`;
    }
  });
}

function shootBallToTopRight(ball) {
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
  const areaY = canvas.height * 2 / 3;
  const areaHeight = canvas.height / 3;
  return ball.y > areaY && ball.y < areaY + areaHeight;
}

window.addEventListener('keydown', (event) => {
  const key = event.key;
  if (key >= '1' && key <= '5') {
    const index = parseInt(key) - 1;
    if (index < canvases.length) {
      moveBallToTopRight(index);
    }
  }

});

window.addEventListener('keydown', (event) => {
  const key = event.key;
  if (key >= '1' && key <= '5') {
    const index = parseInt(key) - 1;
    if (index < canvases.length) {
      playGifOnce(redAreaImages[index]);
    }
  }
});

firstPlayerImages = [
  '/GIFs/Yellow_front.gif',
  '/GIFs/Blue_front.gif',
  '/GIFs/Green_front.gif',
  '/GIFs/Orange_front.gif',
  '/GIFs/Blue_front.gif',
]

secondPlayerImages = [
  '/GIFs/Yellow_front.gif',
  '/GIFs/Blue_front.gif',
  '/GIFs/Green_front.gif',
  '/GIFs/Orange_front.gif',
  '/GIFs/Pink_front.gif'
]

function playGifOnce(image) {
  if (image) {
    let tempImage = new Image();
    tempImage.src = image.src;
    image.src = '';

    topLeftImagePaths.forEach((el, index) => {
      setTimeout(() => {
        image.src = el;
      }, 58 * index);
    });
  }
}


//     resetGame();
//     drawCircle();
// }

window.onload = function () {
  generateCanvases();
}
