const https = require('https');

function fetchUrl(url) {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const match = data.match(/https:\/\/i\.postimg\.cc\/[a-zA-Z0-9]+\/[^"']+/);
      if (match) console.log(url, '->', match[0]);
    });
  });
}

fetchUrl('https://postimg.cc/4HgNqVTn');
fetchUrl('https://postimg.cc/Lgp6wLM6');
fetchUrl('https://postimg.cc/Fk4s83QR');
