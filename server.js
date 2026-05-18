const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'yanyu-moyu-ban-secret-key-2026';
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper: read users
function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Helper: save users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// ========== Auth Middleware ==========
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

// ========== Register ==========
app.post('/api/register', async (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '账号和密码不能为空' });
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '账号长度需2-20位' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '密码至少4位' });
  }

  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: '账号已存在' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    username,
    password: hashedPassword,
    nickname: nickname || username,
    avatar: '🎭',
    role: 'member',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);

  const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: newUser.id, username: newUser.username, nickname: newUser.nickname, avatar: newUser.avatar, role: newUser.role } });
});

// ========== Login ==========
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '账号和密码不能为空' });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ error: '账号或密码错误' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: '账号或密码错误' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } });
});

// ========== Get Current User ==========
app.get('/api/me', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } });
});

// ========== Get All Members (public) ==========
app.get('/api/members', (req, res) => {
  const users = readUsers();
  res.json(users.map(u => ({ id: u.id, nickname: u.nickname, avatar: u.avatar, role: u.role, createdAt: u.createdAt })));
});

// ========== Change Password ==========
app.post('/api/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '参数不完整' });
  }
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: '用户不存在' });

  const valid = await bcrypt.compare(oldPassword, users[idx].password);
  if (!valid) return res.status(400).json({ error: '旧密码错误' });

  users[idx].password = await bcrypt.hash(newPassword, 10);
  saveUsers(users);
  res.json({ message: '密码修改成功' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`燕云摸鱼办服务器启动！`);
  console.log(`本地访问: http://localhost:${PORT}`);
  console.log(`局域网访问: http://本机IP:${PORT}`);
});
