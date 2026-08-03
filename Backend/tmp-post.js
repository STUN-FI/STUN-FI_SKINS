const http = require('http');
const querystring = require('querystring');
const body = querystring.stringify({
  mode: 'individual',
  device: 'laptop',
  coverage: JSON.stringify(['top-lid','keyboard-deck','bottom-base']),
  finish: 'standard',
  customText: 'TEST',
  installRequested: 'true',
  quantity: '1',
  storeName: '',
  surfaceDesigns: '[]',
});
const req = http.request({
  host: '127.0.0.1',
  port: 5000,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('status', res.statusCode, '\n', data));
});
req.on('error', (err) => console.error(err));
req.write(body);
req.end();
