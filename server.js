const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ڕێکخستنی Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ١. Health Endpoint (بۆ پشکنینی پەیوەستبوون)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'سێرڤەر بە سەرکەوتوویی کار دەکات 🚀' });
});

// ٢. Telegram Image Proxy Endpoint (بۆ نوێکردنەوەی لینکی وێنە)
app.get('/telegram-image', async (req, res) => {
  const { file_id, token } = req.query;

  if (!file_id || !token) {
    return res.status(400).send('file_id and token are required');
  }

  try {
    // داواکردنی فایلی نوێ لە Telegram API
    const getFileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${file_id}`);
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      return res.status(400).send('Failed to fetch file from Telegram');
    }

    const filePath = getFileData.result.file_path;
    const directImageUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // ناردنی ڕاستەوخۆی وێنەکە بۆ وێبگەڕ
    const imageRes = await fetch(directImageUrl);
    const contentType = imageRes.headers.get('content-type');
    
    res.setHeader('Content-Type', contentType || 'image/jpeg');
    imageRes.body.pipe(res);

  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ٣. ڕووداوەکانی Socket.io
io.on('connection', (socket) => {
  console.log('🔌 بەکارهێنەرێک پەیوەست بوو:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ بەکارهێنەرێک پچڕا:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 سێرڤەر بەگەڕخرا لەسەر پۆڕتی ${PORT}`);
});
