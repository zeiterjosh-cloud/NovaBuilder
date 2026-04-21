import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.join(__dirname, '../../storage');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

export async function readDB(collection) {
  const filePath = path.join(STORAGE_DIR, `${collection}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeDB(collection, data) {
  await ensureDir(STORAGE_DIR);
  const filePath = path.join(STORAGE_DIR, `${collection}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function findById(collection, id) {
  const data = await readDB(collection);
  return data.find(item => item.id === id) || null;
}

export async function findByField(collection, field, value) {
  const data = await readDB(collection);
  return data.find(item => item[field] === value) || null;
}

export async function insertOne(collection, item) {
  const data = await readDB(collection);
  data.push(item);
  await writeDB(collection, data);
  return item;
}

export async function updateOne(collection, id, updates) {
  const data = await readDB(collection);
  const index = data.findIndex(item => item.id === id);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates };
  await writeDB(collection, data);
  return data[index];
}

export async function deleteOne(collection, id) {
  const data = await readDB(collection);
  const filtered = data.filter(item => item.id !== id);
  await writeDB(collection, filtered);
}
