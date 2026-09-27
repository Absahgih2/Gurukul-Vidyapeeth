import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
console.log('====================================================');
console.log('       MongoDB Atlas Diagnostics & Data Sync        ');
console.log('====================================================\n');

// 1. Check .env file existence
if (!fs.existsSync(envPath)) {
  console.error(`❌ .env file NOT found at: ${envPath}`);
  console.log('Please create .env file with your MONGODB_URI in admin-panel/.env');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const parsed = dotenv.parse(envContent);

const uriKey = ['MONGODB_URI', 'MONGODB_URL', 'MONGO_URL', 'MONGO_URI', 'DATABASE_URL'].find(
  k => parsed[k] && parsed[k].trim() !== ''
);

if (!uriKey) {
  console.error('❌ No MongoDB connection string found in .env!');
  console.log('Found the following variables in .env:', Object.keys(parsed));
  console.log('\nPlease add this line to your admin-panel/.env:');
  console.log('MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority');
  process.exit(1);
}

let uri = parsed[uriKey].trim();
if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
  uri = uri.slice(1, -1).trim();
}

console.log(`✅ Found variable: ${uriKey}`);

// Mask password for display
const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
console.log(`📡 URI: ${maskedUri}\n`);

// Check for placeholder text
const placeholders = ['<username>', '<db_username>', '<password>', '<db_password>', '<PASSWORD>', '<cluster>'];
const foundPlaceholders = placeholders.filter(p => uri.includes(p));
if (foundPlaceholders.length > 0) {
  console.error(`⚠️  WARNING: Your connection string contains placeholder text: ${foundPlaceholders.join(', ')}`);
  console.error('You need to edit admin-panel/.env and replace them with your actual MongoDB Atlas username and password (without angle brackets < and >).\n');
  process.exit(1);
}

// Check scheme
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  console.error(`❌ Invalid scheme: URI must start with "mongodb://" or "mongodb+srv://"`);
  console.error(`Found: ${uri.slice(0, 20)}...`);
  process.exit(1);
}

// Connect to MongoDB Atlas
console.log('⏳ Connecting to MongoDB Atlas cloud database...');
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas!\n');

    // List databases
    const adminDb = client.db().admin();
    let dbs = { databases: [] };
    try {
      dbs = await adminDb.listDatabases();
      console.log('Available databases on cluster:', dbs.databases.map(d => d.name).join(', '));
    } catch (e) {
      console.log('Listing databases skipped (requires admin role):', e.message);
    }

    // Check possible databases
    const dbNamesToCheck = ['gurukul', client.db().databaseName, 'test'].filter(Boolean);
    let targetDoc = null;
    let foundInDb = null;

    for (const dbName of [...new Set(dbNamesToCheck)]) {
      try {
        const db = client.db(dbName);
        const col = db.collection('state');
        const doc = await col.findOne({ _id: 'main_db' });
        if (doc && (doc.students || doc.staff)) {
          targetDoc = doc;
          foundInDb = dbName;
          break;
        }
      } catch (err) {}
    }

    if (!targetDoc) {
      console.log('\n⚠️  Could not find document with _id: "main_db" in state collection of [gurukul, test].');
      console.log('Checking all collections across available databases...');
      for (const d of dbs.databases || []) {
        if (['admin', 'local', 'config'].includes(d.name)) continue;
        try {
          const currentDb = client.db(d.name);
          const collections = await currentDb.listCollections().toArray();
          for (const c of collections) {
            const count = await currentDb.collection(c.name).countDocuments();
            console.log(` - Database: "${d.name}", Collection: "${c.name}" (${count} documents)`);
          }
        } catch (e) {}
      }
    } else {
      const cloudStudents = (targetDoc.students || []).length;
      const cloudStaff = (targetDoc.staff || []).length;
      const cloudStaffStudents = (targetDoc.staffStudents || []).length;
      const cloudCourses = (targetDoc.courses || []).length;

      console.log(`\n🎉 Found Gurukul database in Atlas (Database: "${foundInDb}"):`);
      console.log(`   - Students: ${cloudStudents}`);
      console.log(`   - Staff: ${cloudStaff}`);
      console.log(`   - Staff Students: ${cloudStaffStudents}`);
      console.log(`   - Courses: ${cloudCourses}`);

      // Check local database
      const dataDir = path.join(__dirname, 'data');
      const dbPath = path.join(dataDir, 'db.json');
      const restorePath = path.join(dataDir, 'db_restore.json');

      let localStudents = 0, localStaff = 0;
      let existingTokens = null;

      if (fs.existsSync(dbPath)) {
        try {
          const local = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          localStudents = (local.students || []).length;
          localStaff = (local.staff || []).length;
          if (local.googleAuth && local.googleAuth.tokens) {
            existingTokens = local.googleAuth;
          }
        } catch (e) {}
      }

      console.log(`\nLocal data/db.json currently has:`);
      console.log(`   - Students: ${localStudents}`);
      console.log(`   - Staff: ${localStaff}`);

      // Auto-restore / update local database
      const { _id, ...cleanData } = targetDoc;
      if (existingTokens) {
        cleanData.googleAuth = existingTokens;
      }

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Backup existing local file just in case
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, path.join(dataDir, `db_backup_${Date.now()}.json`));
      }

      fs.writeFileSync(dbPath, JSON.stringify(cleanData, null, 2), 'utf8');
      fs.writeFileSync(restorePath, JSON.stringify(cleanData, null, 2), 'utf8');

      console.log(`\n✅ SUCCESS! All student and staff data has been synchronized into:`);
      console.log(`   ${dbPath}`);
      console.log(`   ${restorePath}`);
      console.log(`\nNow restart the PM2 backend process to pick up the updated database and environment:`);
      console.log(`   pm2 restart gvu-backend --update-env`);
      console.log(`\nRefresh the admin panel in your browser, and all ${cloudStudents} students and ${cloudStaff} staff will be live!`);
    }

  } catch (err) {
    console.error('\n❌ MongoDB Connection Error:', err.message);
    if (err.message.includes('querySrv ENOTFOUND') || err.message.includes('ESERVFAIL')) {
      console.error('\n💡 DNS Resolution Error:');
      console.error('Your ISP/Airtel router DNS failed to resolve the MongoDB Atlas SRV record.');
      console.error('Quick fix on Kali Linux:');
      console.error("   sudo sh -c 'echo \"nameserver 8.8.8.8\" > /etc/resolv.conf'");
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('\n💡 Authentication Failed:');
      console.error('The username or password in MONGODB_URI is incorrect.');
      console.error('Check your MongoDB Atlas -> Database Access -> Database Users.');
    } else if (err.message.includes('Could not connect to any servers') || err.message.includes('whitelist')) {
      console.error('\n💡 Network Access / IP Whitelist Error:');
      console.error('Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).');
    }
  } finally {
    try {
      await client.close();
    } catch (e) {}
    process.exit(0);
  }
}

run();
