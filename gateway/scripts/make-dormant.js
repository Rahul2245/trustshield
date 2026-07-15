const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb+srv://Rahul_2245:GameGame2245@trustshield.7fq4rna.mongodb.net/trustshield?retryWrites=true&w=majority&appName=trustshield');
    console.log("Connected to MongoDB.");

    const UserSchema = new mongoose.Schema({
        email: String,
        lastLoginAt: Date,
        status: String
    }, { strict: false });
    
    const UserModel = mongoose.model('User', UserSchema);

    const email = 'naanigs2245@gmail.com';
    const pastDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);

    const result = await UserModel.updateOne(
        { email: email.toLowerCase() },
        { $set: { lastLoginAt: pastDate } }
    );

    if (result.matchedCount > 0) {
        console.log(`Successfully updated ${email} to be dormant (lastLoginAt: ${pastDate.toISOString()})`);
    } else {
        console.log(`User ${email} not found.`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
