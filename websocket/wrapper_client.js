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
      this.ws = null;
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
      if (this.pendingMessages.length < 1000) { // Limit to 1000 pending messages
        this.pendingMessages.push(message);
      } else {
        if(!this.warningLogged) console.warn("Pending message queue full, discarding message.");
        this.warningLogged = true;
      }
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
      this.ws.removeAllListeners();  // Remove event listeners
      this.ws.close();
      this.ws = null; 
    }
  }
}

module.exports = WebSocketClient;
