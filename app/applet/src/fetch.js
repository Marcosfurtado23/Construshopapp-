async function run() {
  const res = await fetch('https://postimg.cc/Sn8bj5pp');
  const text = await res.text();
  const matches = text.match(/https:\/\/i\.postimg\.cc\/[^\"]+/g);
  console.log(matches);
}
run();
