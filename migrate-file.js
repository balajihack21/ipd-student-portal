import TeamUpload from "./models/TeamUpload.js";

async function migrateFileUrls() {
  const uploads = await TeamUpload.findAll();

  for (const upload of uploads) {
    if (upload.file_url && !upload.file_key) {
      try {
        // Remove query params
        const urlWithoutParams = upload.file_url.split("?")[0];

        // Extract file key after bucket name
        const parts = urlWithoutParams.split("/IPDUploads/");
        if (parts.length < 2) {
          console.warn(`Skipping ${upload.id}: unexpected URL format`);
          continue;
        }

        const fileKey = decodeURIComponent(parts[1]);

        // Save into new column
        upload.file_key = fileKey;
        await upload.save();

        console.log(`✅ Migrated: ${upload.id} → ${fileKey}`);
      } catch (err) {
        console.error(`❌ Error migrating upload ${upload.id}:`, err.message);
      }
    }
  }
}

migrateFileUrls().then(() => {
  console.log("🎉 Migration complete");
  process.exit();
});
