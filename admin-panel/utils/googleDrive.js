import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_FOLDER_ID = '101NKmietQmzHAH10A4nHlfhsOdxUtdKA';

let driveClient = null;

async function getDriveClient() {
  if (driveClient) return driveClient;
  const credsPath = path.join(__dirname, '..', 'credentials', 'service-account.json');
  const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

const folderCache = {};

async function getOrCreateSubfolder(name, parentId) {
  const cacheKey = `${parentId}_${name}`;
  if (folderCache[cacheKey]) return folderCache[cacheKey];

  const drive = await getDriveClient();
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const res = await drive.files.list({ q, fields: 'files(id, name)', spaces: 'drive' });

  if (res.data.files.length > 0) {
    folderCache[cacheKey] = res.data.files[0].id;
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    resource: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  });
  folderCache[cacheKey] = folder.data.id;
  return folder.data.id;
}

async function uploadFileToDrive(filePath, fileName, parentId) {
  const drive = await getDriveClient();
  const fileStream = fs.createReadStream(filePath);
  const mimeType = getMimeType(fileName);

  const file = await drive.files.create({
    resource: { name: fileName, parents: [parentId] },
    media: { mimeType, body: fileStream },
    fields: 'id, webViewLink, webContentLink',
  });

  await drive.permissions.create({
    fileId: file.data.id,
    resource: { role: 'reader', type: 'anyone' },
  });

  return {
    id: file.data.id,
    name: fileName,
    webViewLink: file.data.webViewLink,
    downloadUrl: `https://drive.google.com/uc?id=${file.data.id}&export=download`,
    viewUrl: `https://drive.google.com/uc?id=${file.data.id}&export=view`,
  };
}

async function deleteFileFromDrive(fileId) {
  if (!fileId) return;
  try {
    const drive = await getDriveClient();
    await drive.files.delete({ fileId });
  } catch (err) {
    console.error(`Failed to delete file ${fileId} from Drive:`, err.message);
  }
}

async function deleteFilesFromDrive(fileIds) {
  if (!fileIds || fileIds.length === 0) return;
  await Promise.all(fileIds.map(id => deleteFileFromDrive(id)));
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain', '.csv': 'text/csv',
    '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export {
  getDriveClient,
  getOrCreateSubfolder,
  uploadFileToDrive,
  deleteFileFromDrive,
  deleteFilesFromDrive,
  ROOT_FOLDER_ID,
};
