import express from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3001;

const CREDENTIALS_FILE = path.join(__dirname, '..', 'data', 'credentials.dat');
const PHOTOS_DIR = path.join(__dirname, '..', 'data', 'photos');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Ensure directories exist
if (!fs.existsSync(path.dirname(CREDENTIALS_FILE))) {
  fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
}
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

// Initialize with default credentials if file doesn't exist
if (!fs.existsSync(CREDENTIALS_FILE)) {
  const defaultCredentials = {
    demo: crypto.createHash('sha256').update('demo123').digest('hex')
  };
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(defaultCredentials));
}

app.use(express.json());
app.use(fileUpload());

// Serve static files from the React app
app.use(express.static(DIST_DIR));

// Serve uploaded photos
app.use('/photos', express.static(PHOTOS_DIR));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (credentials[username] === hashedPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/upload', (req, res) => {
  if (!req.files || !req.files.photo) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const photo = req.files.photo;
  const fileName = `${Date.now()}-${photo.name}`;
  const filePath = path.join(PHOTOS_DIR, fileName);

  photo.mv(filePath, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error uploading file' });
    }
    res.json({ success: true, url: `/photos/${fileName}` });
  });
});

app.get('/api/photos', (req, res) => {
  try {
    const photos = fs.readdirSync(PHOTOS_DIR);
    const photoList = photos.map(fileName => ({
      id: fileName,
      url: `/photos/${fileName}`,
      username: 'demo'
    }));
    res.json({ success: true, photos: photoList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reading photos' });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});