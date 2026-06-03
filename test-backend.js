const http = require('http');

const data1 = JSON.stringify({
  url: 'https://example.com/page?utm_source=fb&fbclid=123',
  userId: 'test'
});

const req1 = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/tools/cleaner',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data1)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Cleaner:', res.statusCode, body));
});
req1.on('error', err => console.log('Cleaner Error:', err.message));
req1.write(data1);
req1.end();

const data2 = JSON.stringify({
  url: 'https://example.com/page',
  utm: { source: 'test' }
});

const req2 = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/tools/utm',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data2)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('UTM:', res.statusCode, body));
});
req2.on('error', err => console.log('UTM Error:', err.message));
req2.write(data2);
req2.end();