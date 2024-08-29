const WebSocket = require('ws');

class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.pendingMessages = [];
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('WebSocket connection established');
      this.flushPendingMessages();
    });

    this.ws.on('message', (data) => {
      console.log(`Received message: ${data}`);
    });

    this.ws.on('error', (error) => {
      console.error(`WebSocket error: ${error}`);
    });

    this.ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  }

  reconnect() {
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 5000); // Retry after 5 seconds
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      //console.log("Sending message", message);
      this.ws.send(message);
    } else {
      this.pendingMessages.push(message);
    }
  }

  flushPendingMessages() {
	  console.log("Flushing messages");
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.ws.send(message);
    }
  }
  closeConnection() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

module.exports = WebSocketClient;
