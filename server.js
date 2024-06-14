import express from 'express';
import http from 'http';
import { createRequire } from 'module';
import config from './config.js';

const require = createRequire(import.meta.url);
const WebSocket = require('ws');

const WebSocketServer = WebSocket.Server;

const app = express();
const httpServer = http.createServer(app);
const webSocketServer = new WebSocketServer({ server: httpServer });

const playerStates = {};
const controllerSockets = new Set();
const playerSockets = new Map();
let gameStarted = false;
let nextPlayerId = 1;

const playerColors = [
  '#4043ff', '#40ff57', '#fe8021', '#ff40fa', '#fed034'
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
                broadcastToPlayers(['start-game', Object.keys(playerStates).length]);
              } else {
                socket.send(JSON.stringify(['error', 'Cannot start game. Ensure all players are ready and at least one player is connected.']));
              }
              break;
            case 'request-player-count':
              socket.send(JSON.stringify(['player-count', Object.keys(playerStates).length, playerStates]));
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
    playerSockets.set(socket, playerId);
    socket.on('message', (data) => {
      if (data.length > 0) {
        try {
          const message = JSON.parse(data);
          console.log('Message received from player:', message);
          switch (message[0]) {
            case 'player-connect':
              playerId = nextPlayerId++;
              playerSockets.set(socket, playerId);
              if (!playerStates[playerId]) {
                const assignedColor = playerColors[Object.keys(playerStates).length % playerColors.length];
                playerStates[playerId] = { ready: false, color: assignedColor };
              }
              socket.send(JSON.stringify(['player-index', playerId, playerStates[playerId].color]));
              if (gameStarted) {
                socket.send(JSON.stringify(['start-game']));
              }
              broadcastToControllers(['player-states', playerStates]);
              broadcastToControllers(['player-count', Object.keys(playerStates).length, playerStates]); // Spieleranzahl senden
              break;
            case 'player-ready':
              if (playerStates[playerId]) {
                playerStates[playerId].ready = true;
                broadcastToControllers(['player-ready', playerId, playerStates[playerId].color]);
                broadcastToControllers(['player-states', playerStates]);
                broadcastToControllers(['player-count', Object.keys(playerStates).length, playerStates]); // Spieleranzahl senden
                if (gameStarted) {
                  socket.send(JSON.stringify(['start-game']));
                }
              }
              break;
            case 'player-action':
              const playerIndex = parseInt(message[1], 10);
              if (!isNaN(playerIndex)) {
                console.log(`Forwarding player action for player ${playerIndex - 1}`);
                broadcastToControllers(['player-action', playerIndex - 1]);
              } else {
                console.error('Invalid playerIndex received:', message[1]);
              }
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
      const disconnectedPlayerId = playerSockets.get(socket);
      playerSockets.delete(socket);
      if (disconnectedPlayerId && playerStates[disconnectedPlayerId]) {
        delete playerStates[disconnectedPlayerId];
        broadcastToControllers(['player-disconnected', disconnectedPlayerId]);
        broadcastToControllers(['player-states', playerStates]);
        broadcastToControllers(['player-count', Object.keys(playerStates).length, playerStates]); // Spieleranzahl senden
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
  for (const playerSocket of playerSockets.keys()) {
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
