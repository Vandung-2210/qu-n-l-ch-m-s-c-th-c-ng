import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, './data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getCollectionData(collectionName, isObject = false) {
  try {
    const filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(filePath)) {
      return isObject ? {} : []; 
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading collection ${collectionName}:`, err);
    return isObject ? {} : [];
  }
}

export function saveCollectionData(collectionName, data) {
  try {
    const filePath = path.join(DATA_DIR, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error saving collection ${collectionName}:`, err);
    return false;
  }
}
