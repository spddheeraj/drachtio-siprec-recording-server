const http = require('http');

const makeApiCall = (param) => {
  let options;

  // Determine the options based on the parameter
  if (param === 'status') {
    options = {
      hostname: 'localhost',
      port: 3939,
      path: '/status',
      method: 'GET',
    };
  } else if (param === 'memory-dump') {
    options = {
      hostname: 'localhost',
      port: 3939,
      path: '/memory-dump',
      method: 'GET',
    };
  } else if (param === 'record') {
    options = {
      hostname: 'localhost',
      port: 3939,
      path: '/record',
      method: 'POST',
    };
  } else {
    console.error('Invalid parameter. Use "status" or "record".');
    return;
  }

  // Make the HTTP request
  const req = http.request(options, (res) => {
    let data = '';

    // Append data chunks
    res.on('data', (chunk) => {
      data += chunk;
    });

    // Handle end of response
    res.on('end', () => {
      console.log(`Response: ${data}`);
    });
  });

  // Handle request errors
  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  // End the request
  req.end();
};

// Example usage
const param = process.argv[2]; // Get the parameter from command line arguments
makeApiCall(param);