const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'sstv2026';

let ticketCount = 0;

app.use(express.static(path.join(__dirname, 'public')));

// Keep-alive ping for Render
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

// Botrix calls this URL on !taillight
app.get('/api/add', (req, res) => {
  if (req.query.key !== SECRET_KEY) return res.status(403).send('Invalid key');
  ticketCount++;
  io.emit('ticketUpdate', { count: ticketCount, action: 'add' });
  // Return plain text so Botrix can read it directly into chat!
  res.send(`Ticket issued! Total SSTV Tail Light Violations today: ${ticketCount}`);
});

// Botrix calls this URL on !unticket
app.get('/api/undo', (req, res) => {
  if (req.query.key !== SECRET_KEY) return res.status(403).send('Invalid key');
  if (ticketCount > 0) ticketCount--;
  io.emit('ticketUpdate', { count: ticketCount, action: 'undo' });
  res.send(`Ticket cancelled! Total violations now: ${ticketCount}`);
});

// Botrix calls this URL on !resettickets
app.get('/api/reset', (req, res) => {
  if (req.query.key !== SECRET_KEY) return res.status(403).send('Invalid key');
  ticketCount = 0;
  io.emit('ticketUpdate', { count: ticketCount, action: 'reset' });
  res.send('SSTV Tail Light Ticket counter reset to 0.');
});

io.on('connection', (socket) => {
  socket.emit('ticketUpdate', { count: ticketCount, action: 'sync' });
});

server.listen(PORT, () => {
  console.log(`SSTV Ticket Overlay running on port ${PORT}`);
});
