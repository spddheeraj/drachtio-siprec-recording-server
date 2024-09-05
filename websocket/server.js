var FileWriter = require('wav').FileWriter;

const WebSocketClient = require('./wrapper_client');

//const serverUrl = 'wss://agentassist-server.ngrok.io/call_stream?mode=siprec&account_uuid=';
const serverUrl = 'wss://aa2.avaamo.com/call_stream?mode=siprec&account_uuid=';
// const serverUrl = 'wss://35ce-27-58-37-185.ngrok-free.app/call_stream?account_uuid=';
const WebSocket = require('ws');

let writeFiles = false;

// Create a WebSocket server
const wss = new WebSocket.Server({
	port: 9999
});

function splitChannels(buffer) {
	const numSamples = buffer.length / 4; // Each sample is 4 bytes (2 bytes per channel)
	const leftChannel = Buffer.alloc(numSamples * 2);
	const rightChannel = Buffer.alloc(numSamples * 2);

	for (let i = 0; i < numSamples; i++) {
		const leftSample = buffer.readInt16LE(i * 4);
		const rightSample = buffer.readInt16LE(i * 4 + 2);
		leftChannel.writeInt16LE(leftSample, i * 2);
		rightChannel.writeInt16LE(rightSample, i * 2);
	}

	return {
		leftChannel,
		rightChannel
	};
}

// Handle incoming connections
wss.on('connection', (ws) => {
	console.log('Client connected');
	var client;
	if (writeFiles) {

		var fileName = new Date().getTime();
		var outputFileStream = new FileWriter(fileName + ".wav", {
			sampleRate: 8000,
			channels: 2
		});
		var leftOutputFileStream = new FileWriter(fileName + "_left.wav", {
			sampleRate: 8000,
			channels: 1
		});
		var rightOutputFileStream = new FileWriter(fileName + "_right.wav", {
			sampleRate: 8000,
			channels: 1
		});
	}
	// Handle incoming messages
	ws.on('message', (message) => {
		if (!client) {
			try {
				let data = JSON.parse(message);
				console.log("data available", data);
				client = new WebSocketClient((data.start.customParameters.wsUrl || serverUrl) + (data.start.accountSid || data.start.customParameters.accountUuid));
			} catch (e) {
				console.error(e)
			}
		} else {
			if (writeFiles) {

				outputFileStream.write(message);
				try {
					let {
						leftChannel,
						rightChannel
					} = splitChannels(message);
					leftOutputFileStream.write(leftChannel);
					rightOutputFileStream.write(rightChannel);
				} catch (e) {
					console.log(e)
				};
			}
		}
		client.sendMessage(message);
	});
	ws.on("close", () => {
		if (client) client.closeConnection()
		if (writeFiles) {

			outputFileStream.end();
			leftOutputFileStream.end();
			rightOutputFileStream.end();
		}
	});

	// Send a welcome message to the client
	ws.send('Welcome to the WebSocket server!');
});
