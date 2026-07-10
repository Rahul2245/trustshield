const { createClient } = require('redis');
async function run() {
  const client = createClient({ url: 'redis://localhost:6379' });
  await client.connect();
  const keys = await client.keys('*');
  console.log("Keys:", keys);
  for (const key of keys) {
    console.log(key, await client.get(key));
  }
  process.exit(0);
}
run();
