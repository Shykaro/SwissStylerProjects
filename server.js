import express from 'express';
import http from 'http';
import { createRequire } from 'module';
import { v4 as uuidv4 } from 'uuid';
import config from './config.js';

const require = createRequire(import.meta.url);
const WebSocket = require('ws');

const WebSocketServer = WebSocket.Server;

const app = express();
const httpServer = http.createServer(app);
const webSocketServer = new WebSocketServer({ server: httpServer });

const playerStates = {};
const controllerSockets = new Set();
const playerSockets = new Set();
let gameStarted = false;

const playerColors = [
  '#fb0c0c', '#fed034', '#4043ff', '#ff40fa', '#40ff57', '#fe8021'
];

app.use(express.static('.'));

// WebSocket connection handling
webSocketServer.on('connection', (socket, req) => {
  const isController = req.url === '/controller';
  let playerId = null;

  if (isController) {
    controllerSockets.add(socket);
    socket.send(JSON.stringify(['player-states', playerStates]));

    socket.on('close', () => {
      controllerSockets.delete(socket);
    });

    socket.on('message', (data) => {
      if (data.length > 0) {
        try {
          const message = JSON.parse(data);
          console.log('Message received from controller:', message);
          switch (message[0]) {
            case 'start-game':
              if (canStartGame()) {
                gameStarted = true;
                broadcastToPlayers(['start-game', Object.keys(playerStates).length]); // Spieleranzahl senden
              } else {
                socket.send(JSON.stringify(['error', 'Cannot start game. Ensure all players are ready and at least one player is connected.']));
              }
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error parsing message from controller:', error);
        }
      } else {
        socket.send('');
      }
    });
  } else {
    playerSockets.add(socket);
    socket.on('message', (data) => {
      if (data.length > 0) {
        try {
          const message = JSON.parse(data);
          console.log('Message received from player:', message);
          switch (message[0]) {
            case 'player-connect':
              playerId = message[1] || uuidv4();
              if (!playerStates[playerId]) {
                const assignedColor = playerColors[Object.keys(playerStates).length % playerColors.length];
                playerStates[playerId] = { ready: false, color: assignedColor };
              }
              socket.send(JSON.stringify(['player-index', playerId, playerStates[playerId].color]));
              if (gameStarted) {
                socket.send(JSON.stringify(['start-game']));
              }
              broadcastToControllers(['player-states', playerStates]);
              break;
            case 'player-ready':
              if (playerStates[playerId]) {
                playerStates[playerId].ready = true;
                broadcastToControllers(['player-ready', playerId, playerStates[playerId].color]);
                broadcastToControllers(['player-states', playerStates]);
                if (gameStarted) {
                  socket.send(JSON.stringify(['start-game']));
                }
              }
              break;
            case 'draw-point':
              broadcastToControllers(['draw-point', message[1], message[2], message[3]]);
              break;
            case 'player-action':
              const playerIndex = Object.keys(playerStates).indexOf(message[1]);
              broadcastToControllers(['player-action', playerIndex]);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error parsing message from player:', error);
        }
      }
    });

    socket.on('close', () => {
      playerSockets.delete(socket);
      if (playerId && playerStates[playerId]) {
        playerStates[playerId].ready = false;
        broadcastToControllers(['player-states', playerStates]);
      }
    });
  }
});

function broadcastToControllers(message) {
  const str = JSON.stringify(message);
  console.log('Broadcasting to controllers:', str);
  for (const controllerSocket of controllerSockets) {
    controllerSocket.send(str);
  }
}

function broadcastToPlayers(message) {
  const str = JSON.stringify(message);
  console.log('Broadcasting to players:', str);
  for (const playerSocket of playerSockets) {
    playerSocket.send(str);
  }
}

function canStartGame() {
  const playerIds = Object.keys(playerStates);
  const allReady = playerIds.length > 0 && playerIds.every(playerId => playerStates[playerId].ready);
  const anyReady = playerIds.some(playerId => playerStates[playerId].ready);
  return allReady && anyReady;
}

const port = config['server-port'] || 3000;
httpServer.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
