const res = await fetch('https://postimg.cc/QBXkZkq4');
const data = await res.text();
const match = data.match(/https:\/\/i\.postimg\.cc\/[^"']+/g);
console.log(match);
