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
// Define the message schema
const messageSchema = new Schema({
  chatSessionId: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
});
// Create the Message model
const Message = mongoose.model('Message', messageSchema);

// Create the user model
const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

// Create the /login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
});

// Create the /messages route
app.post('/messages', async (req, res) => {
  try {
    const { chatSessionId, chatName, role, content } = req.body;
    const newMessage = new Message({ chatSessionId,chatName, role, content });
    await newMessage.save();
    res.status(201).json({ message: 'Message created successfully', message: newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create the /messages/:chatSessionId route to retrieve messages by chatSessionId
app.get('/messages/:chatSessionId', async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const messages = await Message.find({ chatSessionId });
    if (messages.length === 0) {
      return res.status(404).json({ message: 'No messages found for this chat session' });
    }
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create the /messages/:chatSessionId route to delete messages by chatSessionId
app.delete('/messages/:chatSessionId', async (req, res) => {
  try {
    const { chatSessionId } = req.params;
    const deletedMessages = await Message.deleteMany({ chatSessionId });
    if (deletedMessages.deletedCount === 0) {
      return res.status(404).json({ message: 'No messages found for this chat session' });
    }
    res.status(200).json({
      message: `Successfully deleted ${deletedMessages.deletedCount} messages for chat session ${chatSessionId}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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