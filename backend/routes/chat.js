require('dotenv').config();

const express = require('express');
const Groq = require('groq-sdk');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ═══════════════════════════════════════════
   MULTER — FILE UPLOAD CONFIG
   ═══════════════════════════════════════════ */
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/* ═══════════════════════════════════════════
   SEND MESSAGE (main chat)
   ═══════════════════════════════════════════ */
router.post('/', auth, async (req, res) => {
  try {
    const { message, chatId, model, temperature, maxTokens, systemPrompt } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.userId });
    }
    if (!chat) {
      chat = await Chat.create({
        userId: req.userId,
        title: message.slice(0, 40),
        messages: []
      });
    }

    const history = chat.messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const completion = await groq.chat.completions.create({
      model: model || 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are AURA AI, a helpful, intelligent, and concise assistant.'
        },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: maxTokens || 1024
    });

    const reply = completion.choices[0]?.message?.content || 'No response';

    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'ai', content: reply });
    chat.updatedAt = new Date();
    await chat.save();

    res.json({ reply, chatId: chat._id });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   STREAMING MESSAGE (SSE — typewriter effect)
   ═══════════════════════════════════════════ */
router.post('/stream', auth, async (req, res) => {
  try {
    const { message, chatId, model } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.userId });
    }
    if (!chat) {
      chat = await Chat.create({
        userId: req.userId,
        title: message.slice(0, 40),
        messages: []
      });
    }

    const history = chat.messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ chatId: chat._id })}\n\n`);

    const stream = await groq.chat.completions.create({
      model: model || 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'You are AURA AI, a helpful, intelligent, and concise assistant.' },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true
    });

    let fullReply = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullReply += delta;
        res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'ai', content: fullReply });
    chat.updatedAt = new Date();
    await chat.save();
  } catch (err) {
    console.error('Stream error:', err.message);
    try {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } catch {}
  }
});

/* ═══════════════════════════════════════════
   CHAT HISTORY (sidebar list)
   ═══════════════════════════════════════════ */
router.get('/history', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('title updatedAt createdAt');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   FILE UPLOAD
   ═══════════════════════════════════════════ */
router.post('/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    res.json({
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   IMAGE GENERATION (Pollinations.ai — FREE)
   ═══════════════════════════════════════════ */
router.post('/generate-image', auth, async (req, res) => {
  try {
    const { prompt, style, chatId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const styleMap = {
      realistic: ', photorealistic, 8k, highly detailed, professional photography',
      anime: ', anime style, studio ghibli, vibrant, detailed illustration',
      cartoon: ', cartoon style, disney pixar, colorful, cute',
      cyberpunk: ', cyberpunk style, neon lights, futuristic, dark atmosphere',
      watercolor: ', watercolor painting, soft colors, artistic',
      sketch: ', pencil sketch, black and white, hand drawn',
      oil: ', oil painting, impressionist style, textured',
      '3d': ', 3d render, octane, blender, cinema 4d'
    };

    const stylePrompt = style && styleMap[style] ? styleMap[style] : '';
    const fullPrompt = encodeURIComponent(prompt + stylePrompt);
    const seed = Math.floor(Math.random() * 1000000);

    const imageUrl = `https://image.pollinations.ai/prompt/${fullPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.userId });
    }
    if (!chat) {
      chat = await Chat.create({
        userId: req.userId,
        title: `🎨 ${prompt.slice(0, 35)}`,
        messages: []
      });
    }

    chat.messages.push({ role: 'user', content: `Generate image: ${prompt}` });
    chat.messages.push({
      role: 'ai',
      content: `![Generated Image](${imageUrl})\n\n**Prompt:** ${prompt}${style ? `\n**Style:** ${style}` : ''}\n\n*Click image to open full size*`
    });
    chat.updatedAt = new Date();
    await chat.save();

    res.json({ imageUrl, chatId: chat._id, prompt, style });
  } catch (err) {
    console.error('Image gen error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   IMAGE ANALYSIS (Groq Vision — Llama 3.2 90B)
   ═══════════════════════════════════════════ */
router.post('/analyze-image', auth, async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL required' });

    const analysisPrompt = prompt || 'Describe this image in detail. What do you see?';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });

    const reply = completion.choices[0]?.message?.content || 'Could not analyze';
    res.json({ reply });
  } catch (err) {
    console.error('Image analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   DELETE ALL CHATS
   ═══════════════════════════════════════════ */
router.delete('/', auth, async (req, res) => {
  try {
    const result = await Chat.deleteMany({ userId: req.userId });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   GET ONE CHAT
   ═══════════════════════════════════════════ */
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   RENAME CHAT
   ═══════════════════════════════════════════ */
router.patch('/:id/rename', auth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title required' });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title: title.trim().slice(0, 100), updatedAt: new Date() },
      { new: true }
    );

    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json({ success: true, chat: { _id: chat._id, title: chat.title } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════
   DELETE CHAT
   ═══════════════════════════════════════════ */
router.delete('/:id', auth, async (req, res) => {
  try {
    await Chat.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;