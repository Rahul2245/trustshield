const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/trust_db').then(async () => {
  const result = await mongoose.connection.db.collection('posts').updateMany({}, { $set: { status: 'APPROVED' } });
  console.log('Updated', result.modifiedCount, 'posts to APPROVED');
  process.exit(0);
});
