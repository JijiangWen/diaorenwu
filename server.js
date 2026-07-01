import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pathModule from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection middleware
let isConnected = false;
app.use(async (req, res, next) => {
  // If it's a static file request (production dist), we don't necessarily block on MongoDB connection check
  if (req.path.startsWith('/assets') || req.path === '/favicon.ico') {
    return next();
  }

  if (isConnected) {
    return next();
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('Warning: MONGODB_URI is not set. Database operations will fail.');
    return res.status(500).json({ error: '服务器未配置数据库环境变量 MONGODB_URI' });
  }

  try {
    const db = await mongoose.connect(mongoUri);
    isConnected = db.connections[0].readyState === 1;
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ error: '数据库连接失败，请稍后重试' });
  }
});

// User Schema & Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  usernameLower: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  token: { type: String, required: true },
  emoji: { type: String, default: '🎮' },
  color: { type: String, default: '#6c5ce7' },
  status: { type: String, default: 'gaming' },
  caption: { type: String, default: '准备开黑！' },
  lastActive: { type: Number, default: Date.now, index: true }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Password hashing helper
function hashPassword(password, salt) {
  const hash = crypto.createHmac('sha256', salt);
  hash.update(password);
  return hash.digest('hex');
}

// 1. Register User
app.post('/api/register', async (req, res) => {
  const { username, password, emoji, color, caption } = req.body;

  if (!username || !password || !emoji || !color) {
    return res.status(400).json({ error: '请填写所有必填字段（用户名、密码、头像、颜色）' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 2) {
    return res.status(400).json({ error: '用户名长度至少为 2 个字符' });
  }

  try {
    const exists = await User.findOne({ usernameLower: cleanUsername });
    if (exists) {
      return res.status(400).json({ error: '用户名已被占用，换一个吧！' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const token = crypto.randomBytes(24).toString('hex');

    const newUser = await User.create({
      username: username.trim(),
      usernameLower: cleanUsername,
      passwordHash,
      salt,
      token,
      emoji: emoji || '🎮',
      color: color || '#6c5ce7',
      status: 'gaming',
      caption: caption || '准备开黑！',
      lastActive: Date.now()
    });

    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;
    delete userResponse.salt;
    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败，服务器故障' });
  }
});

// 2. Login User
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const user = await User.findOne({ usernameLower: cleanUsername });
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const calculatedHash = hashPassword(password, user.salt);
    if (calculatedHash !== user.passwordHash) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    user.token = crypto.randomBytes(24).toString('hex');
    user.lastActive = Date.now();
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    delete userResponse.salt;
    res.json(userResponse);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败，服务器故障' });
  }
});

// 3. Get All Users (with active states and optional timestamp filtering)
app.get('/api/users', async (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since, 10) : 0;

    // Find the latest active timestamp among all users
    const latestUser = await User.findOne({}, 'lastActive').sort({ lastActive: -1 });
    const latestActive = latestUser ? latestUser.lastActive : 0;

    // If client is already up-to-date, return unmodified status
    if (since && latestActive <= since) {
      return res.json({ modified: false });
    }

    const usersList = await User.find({}, '-passwordHash -salt -token');
    res.json({
      modified: true,
      users: usersList,
      syncTime: latestActive
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 4. Update Current Status / Room
app.post('/api/status', async (req, res) => {
  const { username, token, status, caption } = req.body;

  if (!username || !token || !status) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const cleanUsername = username.trim().toLowerCase();

  const allowedRooms = ['gaming', 'eating', 'showering', 'working', 'sleeping', 'out', 'commuting', 'baby'];
  if (!allowedRooms.includes(status)) {
    return res.status(400).json({ error: '无效的状态区域' });
  }

  try {
    const user = await User.findOne({ usernameLower: cleanUsername });
    if (!user || user.token !== token) {
      return res.status(403).json({ error: '登录已失效，请重新登录' });
    }

    user.status = status;
    if (caption !== undefined) {
      user.caption = caption;
    }
    user.lastActive = Date.now();
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;
    delete updatedUser.salt;
    delete updatedUser.token;
    res.json(updatedUser);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: '更新状态失败' });
  }
});

// 5. Update Profile (Emoji, Color, Caption)
app.post('/api/profile', async (req, res) => {
  const { username, token, emoji, color, caption } = req.body;

  if (!username || !token) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const user = await User.findOne({ usernameLower: cleanUsername });
    if (!user || user.token !== token) {
      return res.status(403).json({ error: '登录已失效，请重新登录' });
    }

    if (emoji) user.emoji = emoji;
    if (color) user.color = color;
    if (caption !== undefined) user.caption = caption;
    user.lastActive = Date.now();
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;
    delete updatedUser.salt;
    delete updatedUser.token;
    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: '更新资料失败' });
  }
});

// Serve frontend in production (for self-hosting, fallback)
const distPath = pathModule.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(pathModule.join(distPath, 'index.html'));
  });
}

// Export the app for Vercel serverless
export default app;

// Only listen if not in Vercel environment (local running)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running locally on port ${PORT}`);
  });
}
