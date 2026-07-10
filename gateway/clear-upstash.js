const { createClient } = require('redis');
require('dotenv').config({ path: '.env' });
async function run() {
  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();
  const keys = await client.keys('rate:*');
  console.log("Found keys:", keys.length);
  if (keys.length > 0) {
    await client.del(keys);
    console.log("Deleted rate limit keys.");
  }
  process.exit(0);
}
run();
