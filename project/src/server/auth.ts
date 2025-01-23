import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CREDENTIALS_FILE = path.join(process.cwd(), 'data', 'credentials.dat');
const PHOTOS_DIR = path.join(process.cwd(), 'data', 'photos');

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
    demo: hashPassword('demo123')
  };
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(defaultCredentials));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyCredentials(username: string, password: string): boolean {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    const hashedPassword = hashPassword(password);
    return credentials[username] === hashedPassword;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return false;
  }
}

export function savePhoto(file: File, username: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(PHOTOS_DIR, fileName);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const buffer = Buffer.from(reader.result as ArrayBuffer);
        fs.writeFileSync(filePath, buffer);
        resolve(`/photos/${fileName}`);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function getPhotos(): { id: string; url: string; username: string }[] {
  try {
    const photos = fs.readdirSync(PHOTOS_DIR);
    return photos.map(fileName => ({
      id: fileName,
      url: `/photos/${fileName}`,
      username: 'demo' // In a real app, store user info with the photo
    }));
  } catch (error) {
    console.error('Error reading photos:', error);
    return [];
  }
}