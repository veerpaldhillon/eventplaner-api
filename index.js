// Suggested code may be subject to a license. Learn more: ~LicenseLog:2510723213.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:743064951.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:4248432748.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:779350014.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:1889760545.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:3877731976.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:3598573082.
import express from 'express';
import mongoose, { Schema } from 'mongoose';
import 'dotenv/config';

const app = express();

app.use(express.json());

// Define the user schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Create the user model
const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

// Create the /signup route
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});
const connectDB = async () => {
  const dbName = "event_planer_app";
  try {
    const connectionString = `${process.env.MONGO_URI}/${dbName}`;
    const conn = await mongoose.connect(connectionString);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

connectDB().then(() => {
const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
})