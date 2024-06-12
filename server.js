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

let playerCount = 0;
let readyCount = 0;
const controllerSockets = new Set();
const playerSockets = new Set();

const playerColors = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800000', '#808000', '#008000', '#800080', '#008080', '#000080'
];

app.use(express.static('.'));

webSocketServer.on('connection', (socket, req) => {
  if (req.url === '/controller') {
    controllerSockets.add(socket);
    socket.send(JSON.stringify(['player-count', playerCount, readyCount]));

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
              broadcastToPlayers(['start-game']);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error parsing message from controller:', error);
        }
      } else {
        socket.send(''); // ping response
      }
    });
  } else {
    playerSockets.add(socket);
    playerCount++;
    const assignedColor = playerColors[playerCount % playerColors.length];
    broadcastToControllers(['player-count', playerCount, readyCount]);

    socket.send(JSON.stringify(['player-index', playerCount - 1, assignedColor]));

    socket.on('message', (data) => {
      if (data.length > 0) {
        try {
          const message = JSON.parse(data);
          console.log('Message received from player:', message);
          switch (message[0]) {
            case 'player-ready':
              readyCount++;
              broadcastToControllers(['player-count', playerCount, readyCount]);
              break;
            case 'draw-point':
              console.log('Forwarding draw-point message to controllers:', message);
              broadcastToControllers(['draw-point', message[1], message[2], message[3]]);
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
      playerCount--;
      broadcastToControllers(['player-count', playerCount, readyCount]);
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

const port = config['server-port'] || 3000;
httpServer.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
