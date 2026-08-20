import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  };
}

function getRedirectUri() {
  return process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/api/auth/google/callback`
    : 'http://localhost:5000/api/auth/google/callback';
}
const ROOT_FOLDER_ID = '101NKmietQmzHAH10A4nHlfhsOdxUtdKA';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let oauth2Client = null;
let driveClient = null;

function getOAuth2Client() {
  const config = getConfig();
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      getRedirectUri()
    );
  }
  return oauth2Client;
}

function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

async function setTokens(tokens, dbReadFn, dbWriteFn) {
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  if (tokens.refresh_token) {
    const db = dbReadFn();
    if (!db.googleAuth) db.googleAuth = {};
    db.googleAuth.tokens = tokens;
    dbWriteFn(db);
  }
  client.on('tokens', (newTokens) => {
    const db = dbReadFn();
    if (!db.googleAuth) db.googleAuth = {};
    db.googleAuth.tokens = { ...db.googleAuth.tokens, ...newTokens };
    dbWriteFn(db);
  });
  driveClient = google.drive({ version: 'v3', auth: client });
}

async function loadTokensFromDB(dbReadFn, dbWriteFn) {
  const db = dbReadFn();
  if (db.googleAuth && db.googleAuth.tokens) {
    await setTokens(db.googleAuth.tokens, dbReadFn, dbWriteFn);
    return true;
  }
  return false;
}

async function exchangeCode(code, dbReadFn, dbWriteFn) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  await setTokens(tokens, dbReadFn, dbWriteFn);
  return tokens;
}

function isAuthenticated() {
  return driveClient !== null;
}

const folderCache = {};

async function getOrCreateSubfolder(name, parentId) {
  const cacheKey = `${parentId}_${name}`;
  if (folderCache[cacheKey]) return folderCache[cacheKey];

  const drive = await getDriveClient();
  const escapedName = name.replace(/'/g, "\\'");
  const q = `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
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

async function getDriveClient() {
  if (driveClient) return driveClient;
  throw new Error('Google Drive not authenticated. Please connect Google Drive from admin settings.');
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
  getAuthUrl,
  getRedirectUri,
  exchangeCode,
  loadTokensFromDB,
  setTokens,
  isAuthenticated,
  getConfig,
  ROOT_FOLDER_ID,
};
