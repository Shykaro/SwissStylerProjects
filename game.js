import config from './config.js';

const socket = new WebSocket(config['websocket-url']);
let playerCount = 0;

socket.addEventListener('open', () => {
  console.log('WebSocket connection opened in game.js');
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  switch (data[0]) {
    case 'start-game':
      playerCount = data[1]; // Anzahl der Spieler erhalten
      generateCanvases(playerCount);
      break;
    case 'player-action':
      handlePlayerAction(data[1]); // Spieleraktionen (z.B. Drücken auf dem Handy)
      break;
    default:
      console.error(`Unknown message type: ${data[0]}`);
  }
});

function handlePlayerAction(playerIndex) {
  moveBallToTopRight(playerIndex);
}

function generateCanvases(numCanvases) {
  console.log(`Generating ${numCanvases} canvases`);
  let container = document.getElementById('canvasContainer');
  container.innerHTML = ''; // Vorherige Canvas-Felder löschen

  for (let i = 0; i < numCanvases; i++) {
    let canvas = document.createElement('canvas');
    canvas.className = 'canva';
    container.appendChild(canvas);
  }

  initializeBalls();
}

function initializeBalls() {
  let canvases = document.querySelectorAll('.canva');
  let balls = [createBall(0, 10, 10, 1, 4)];

  function createBall(canvasIndex, x, y, dx, dy) {
    return { canvasIndex, x, y, dx, dy, radius: 10, initialRadius: 10, angle: Math.atan2(dy, dx) };
  }

  function resetGame() {
    balls = [createBall(0, 10, 10, 1, 4)];
  }

  function drawCircle() {
    canvases.forEach((canvas, index) => {
      let context = canvas.getContext('2d');
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      context.fillStyle = 'rgba(0, 0, 0, 0.05)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const areaX = 0;
      const areaY = canvas.height * 2 / 3;
      const areaWidth = canvas.width;
      const areaHeight = canvas.height / 3;
      context.fillStyle = 'red';
      context.fillRect(areaX, areaY, areaWidth, areaHeight);
      context.strokeStyle = 'red';
      context.strokeRect(areaX, areaY, areaWidth, areaHeight);

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

    balls.forEach(updateBall);

    requestAnimationFrame(drawCircle);
  }

  function updateBall(ball) {
    let canvas = canvases[ball.canvasIndex];
    let h = canvas.clientHeight;
    let w = canvas.clientWidth;

    ball.x += ball.dx;
    ball.y += ball.dy;

    const areaY = h * 2 / 3;
    const areaHeight = h / 3;
    const distanceFromRed = Math.abs(ball.y - (areaY + areaHeight / 2));
    const maxDistance = h / 2;

    ball.radius = ball.initialRadius * (1 - 0.5 * (distanceFromRed / maxDistance));

    if (ball.y + ball.radius < 0) {
      const nextCanvasIndex = (ball.canvasIndex + 1) % canvases.length;
      balls.push(createBall(nextCanvasIndex, 10, 10, 5 * Math.cos(ball.angle), -5 * Math.sin(ball.angle)));
      balls = balls.filter(b => b !== ball);
      balls.pop();
      return;
    }

    if (ball.y + ball.radius > h) {
      resetGame();
      return;
    }

    if (ball.x + ball.radius > w) {
      ball.canvasIndex++;
      if (ball.canvasIndex >= canvases.length) {
        ball.canvasIndex = 0;
      }
      ball.x = ball.radius;
    }

    if (ball.x - ball.radius < 0) {
      ball.canvasIndex--;
      if (ball.canvasIndex < 0) {
        ball.canvasIndex = canvases.length - 1;
      }
      ball.x = w - ball.radius;
    }
  }

  function moveBallToTopRight(index) {
    balls.forEach(ball => {
      if (ball.canvasIndex === index && isBallInRedArea(ball)) {
        ball.dx *= 1.2;
        ball.dy *= 1.2;
        shootBallToTopRight(ball);
        const nextCanvasIndex = (ball.canvasIndex + 1) % canvases.length;
        balls.push(createBall(nextCanvasIndex, 10, 10, 5 * Math.cos(ball.angle), -5 * Math.sin(ball.angle)));
      }
    });
  }

  function shootBallToTopRight(ball) {
    const canvas = canvases[ball.canvasIndex];
    const targetX = canvas.clientWidth - ball.radius - 10;
    const targetY = ball.radius + 10;

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

  resetGame();
  drawCircle();
}

document.getElementById('generateButton').addEventListener('click', () => {
  const numCanvases = document.getElementById('numCanvases').value;
  generateCanvases(numCanvases);
});
