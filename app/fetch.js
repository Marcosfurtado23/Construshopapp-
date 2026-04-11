const https = require('https');
https.get('https://postimg.cc/QBXkZkq4', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/https:\/\/i\.postimg\.cc\/[^"']+/g);
    if (match) console.log(match);
  });
});
