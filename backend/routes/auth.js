require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');

const router = express.Router();

/* ═══════════════════════════════════════════
   REGISTER
   ═══════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: 'Username taken' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username, userId: user._id });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   CHANGE PASSWORD  (moved BEFORE module.exports)
   ═══════════════════════════════════════════ */
router.post('/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be 6+ characters' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.password = newHash;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   DELETE ACCOUNT  (moved BEFORE module.exports)
   ═══════════════════════════════════════════ */
router.post('/delete-account', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    // Delete user's chats
    await Chat.deleteMany({ userId: user._id });

    // Delete user
    await User.deleteOne({ _id: user._id });

    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   RENAME USERNAME (optional)
   ═══════════════════════════════════════════ */
router.post('/rename-username', async (req, res) => {
  try {
    const { userId, newUsername } = req.body;

    if (!userId || !newUsername) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (newUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be 3+ characters' });
    }

    const exists = await User.findOne({ username: newUsername });
    if (exists) return res.status(400).json({ error: 'Username taken' });

    const user = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('Rename error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   EXPORT — MUST BE THE LAST LINE
   ═══════════════════════════════════════════ */
module.exports = router;