// Suggested code may be subject to a license. Learn more: ~LicenseLog:498324683.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:3360560962.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:4191049963.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:2671752221.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:2034108589.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:524218866.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:1769410078.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:747491518.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:3058243094.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:657264507.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:830679361.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:446557208.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:2033393828.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:4097226031.
import express from 'express';
import mongoose, { Schema, model } from 'mongoose';
import 'dotenv/config';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const app = express();

app.use(express.json());

// Define the user schemai
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const passwordResetSessionSchema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 120 },
});
const PasswordResetSession = model('PasswordResetSession', passwordResetSessionSchema);

// Define the chat schema
const chatSchema = new Schema({
  chatName: { type: String, required: true },
  chatSessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  lastMessageSent: { type: Date, default: Date.now },
});
// Define the message schema
const messageSchema = new Schema({
  chatSessionId: { type: String, required: true },
  chatName: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
// Create the Message model
const Message = mongoose.model('Message', messageSchema);

// Create the user model
const User = mongoose.model('User', userSchema);

const Chat = model('Chat', chatSchema);

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
    res.status(200).json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create the /signup route
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create the /messages route
app.post('/chat', async (req, res) => {
  try {
    const { chatSessionId, chatName, userId, role, content } = req.body;
    const newMessage = new Message({ chatSessionId, chatName, userId, role, content });
    await newMessage.save();
    await Chat.updateOne(
      { chatSessionId },
      { lastMessageSent: new Date() }
    );
    res.status(201).json({ message: 'Message created successfully', message: newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create the /chat/:chatSessionId route to retrieve messages by chatSessionId
app.get('/chat/:chatSessionId', async (req, res) => {
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

// Create the /chat/:chatSessionId route to delete messages by chatSessionId
app.delete('/chat/:chatSessionId', async (req, res) => {
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

// Create the /chat/user/:userId route to get user chat
app.get('/chat/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Message.find({ userId })
      .sort({ lastMessageSent: -1 })
      .select('chatName chatSessionId');

    res.status(200).json({ chats });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Create the /forgot-password route to send OTP
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const newPasswordResetSession = new PasswordResetSession({ email, otp });
    await newPasswordResetSession.save();
    console.log(`Generated OTP: ${otp} for email: ${email}`);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}. It will expire in 2 minutes.`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log(`Error sending email: ${error}`);
      else console.log(`Email sent: ${info.response}`);
    });
    res.status(200).json({ message: 'OTP sent successfully', otp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create the /verify-otp route to verify OTP
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const passwordResetSession = await PasswordResetSession.findOne({ email, otp });
    if (!passwordResetSession) {
      return res.status(400).json({ message: 'Invalid OTP or OTP expired' });
    }
    // Delete the OTP session after successful verification
    await PasswordResetSession.deleteOne({ email, otp });
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create the /reset-password route to reset the password
app.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password reset successfully' });
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