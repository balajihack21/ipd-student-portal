// const admin = require('firebase-admin');
// const fs = require('fs');

// // Path to service account JSON key
// const serviceAccount = require('./serviceAccountKey.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

// async function exportData() {
//   const snapshot = await db.collection('projectTeams').get();
//   const data = [];

//   snapshot.forEach(doc => {
//     data.push(doc.data());
//   });

//   fs.writeFileSync('firebase_export.json', JSON.stringify(data, null, 2));
//   console.log("✅ Exported to firebase_export.json");
// }

// exportData();



const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 🔐 Load service account key (replace with your file path)
const serviceAccount = require('./serviceAccountKey.json');

// 🔧 Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const BATCH_SIZE = 50;
const COLLECTION_NAME = 'projectTeams';
const EXPORT_FOLDER = './exports';

let lastDoc = null;
let page = 1;

// 📁 Ensure export folder exists
if (!fs.existsSync(EXPORT_FOLDER)) {
  fs.mkdirSync(EXPORT_FOLDER);
}

async function exportDataPaged() {
  let query = db.collection(COLLECTION_NAME).orderBy('__name__').limit(BATCH_SIZE);
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();
  if (snapshot.empty) {
    console.log('✅ All data exported.');
    return;
  }

  const data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
    lastDoc = doc; // Save last document for next batch
  });

  const filePath = path.join(EXPORT_FOLDER, `export_page_${page++}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Exported ${data.length} documents to ${filePath}`);

  // Optional: short delay to avoid read quota spikes
  setTimeout(() => {
    exportDataPaged(); // Recursively call for next batch
  }, 300);
}

// 🚀 Start export
exportDataPaged();
