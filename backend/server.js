// SkillSwap Backend - Complete Node.js + Express + MongoDB Implementation
// File: server.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Environment Variables (use .env file in production)
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==================== MONGOOSE SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  offeredSkills: [{ type: String }],
  desiredSkills: [{ type: String }],
  isAdmin: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Request Schema
const requestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Chat Schema
const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Request = mongoose.model('Request', requestSchema);
const Chat = mongoose.model('Chat', chatSchema);

// ==================== MIDDLEWARE ====================

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, bio, offeredSkills, desiredSkills } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      bio: bio || '',
      offeredSkills: offeredSkills || [],
      desiredSkills: desiredSkills || []
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        offeredSkills: user.offeredSkills,
        desiredSkills: user.desiredSkills,
        verified: user.verified,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        offeredSkills: user.offeredSkills,
        desiredSkills: user.desiredSkills,
        verified: user.verified,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Current User
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      bio: req.user.bio,
      offeredSkills: req.user.offeredSkills,
      desiredSkills: req.user.desiredSkills,
      verified: req.user.verified,
      isAdmin: req.user.isAdmin
    }
  });
});

// ==================== USER ROUTES ====================

// Get All Users (for matching)
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get Skill Matches
app.get('/api/users/matches', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    
    // Find users who offer skills the current user wants OR want skills the current user offers
    const matches = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { offeredSkills: { $in: currentUser.desiredSkills } },
        { desiredSkills: { $in: currentUser.offeredSkills } }
      ]
    }).select('-password');

    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Update User Profile
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, offeredSkills, desiredSkills } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, bio, offeredSkills, desiredSkills },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== REQUEST ROUTES ====================

// Send Connection Request
app.post('/api/requests/send', authMiddleware, async (req, res) => {
  try {
    const { toUserId } = req.body;

    // Check if request already exists
    const existingRequest = await Request.findOne({
      from: req.userId,
      to: toUserId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent or accepted' });
    }

    const request = new Request({
      from: req.userId,
      to: toUserId
    });

    await request.save();
    await request.populate('from to', 'name email');

    res.status(201).json({
      message: 'Request sent successfully',
      request
    });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Get My Requests (incoming)
app.get('/api/requests/incoming', authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({ to: req.userId })
      .populate('from', 'name email offeredSkills desiredSkills')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get Sent Requests
app.get('/api/requests/sent', authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({ from: req.userId })
      .populate('to', 'name email offeredSkills desiredSkills')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

// Accept Request
app.put('/api/requests/:requestId/accept', authMiddleware, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.to.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    request.status = 'accepted';
    await request.save();

    // Create a chat between the two users
    const existingChat = await Chat.findOne({
      participants: { $all: [request.from, request.to] }
    });

    if (!existingChat) {
      const chat = new Chat({
        participants: [request.from, request.to]
      });
      await chat.save();
    }

    res.json({
      message: 'Request accepted',
      request
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Reject Request
app.put('/api/requests/:requestId/reject', authMiddleware, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.to.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({
      message: 'Request rejected',
      request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ==================== CHAT ROUTES ====================

// Get My Chats
app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.userId })
      .populate('participants', 'name email')
      .populate('messages.sender', 'name')
      .sort({ 'messages.timestamp': -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get Specific Chat
app.get('/api/chats/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    })
    .populate('participants', 'name email')
    .populate('messages.sender', 'name');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Send Message
app.post('/api/chats/:chatId/message', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = {
      sender: req.userId,
      text,
      timestamp: new Date()
    };

    chat.messages.push(message);
    await chat.save();
    await chat.populate('messages.sender', 'name');

    // Emit socket event for real-time messaging
    io.to(req.params.chatId).emit('newMessage', message);

    res.status(201).json({
      message: 'Message sent',
      newMessage: chat.messages[chat.messages.length - 1]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get All Users (Admin)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Verify User (Admin)
app.put('/api/admin/users/:userId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User verified successfully',
      user
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// Delete User (Admin)
app.delete('/api/admin/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clean up related data
    await Request.deleteMany({ $or: [{ from: user._id }, { to: user._id }] });
    await Chat.deleteMany({ participants: user._id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== SOCKET.IO (Real-time Chat) ====================

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
    console.log(`Socket ${socket.id} left chat ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log(`🚀 SkillSwap Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time chat`);
});