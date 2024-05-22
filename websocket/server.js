var FileWriter = require('wav').FileWriter;

const WebSocketClient = require('./wrapper_client');

const serverUrl = 'wss://35ce-27-58-37-185.ngrok-free.app/call_stream';
const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 9999 });

// Handle incoming connections
wss.on('connection', (ws) => {
  console.log('Client connected');
	const client = new WebSocketClient(serverUrl);
  var fileName = new Date().getTime();
  var outputFileStream = new FileWriter(fileName+".wav", {
  	sampleRate: 16000,
  	channels: 2
  });
  // Handle incoming messages
  ws.on('message', (message) => {
	outputFileStream.write(message);
	  client.sendMessage(message);
  });
  ws.on("close", () => {
	  client.closeConnection()
  	outputFileStream.end();
  });

  // Send a welcome message to the client
  ws.send('Welcome to the WebSocket server!');
});
