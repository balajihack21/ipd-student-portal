// import multer from 'multer';
// import { v4 as uuidv4 } from 'uuid';
// import path from 'path';
// import { supabase } from '../config/cloudinary.js';

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// export const uploadToSupabase = async (fileBuffer, fileName, mimeType) => {
//   const uniqueName = `${uuidv4()}-${fileName}`;
//   const filePath = `teamuploads/${uniqueName}`;

//   const { data, error } = await supabase.storage
//     .from('teamuploads') // this is the bucket name
//     .upload(filePath, fileBuffer, {
//       contentType: mimeType,
//       upsert: true,
//     });

//   if (error) throw error;

//   // Make public URL
//   const { publicUrl } = supabase.storage
//     .from('teamuploads')
//     .getPublicUrl(filePath).data;

//   return publicUrl;
// };

// export { upload };



// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { v4 as uuidv4 } from "uuid";
import { supabase } from "../config/cloudinary.js";

// export const uploadToBackblaze = async (fileBuffer, fileName, mimeType) => {
//   const uniqueName = `${uuidv4()}-${fileName}`;
//   const filePath = `teamuploads/${uniqueName}`;

//   // Upload file to private bucket
//   await supabase.send(
//     new PutObjectCommand({
//       Bucket: process.env.B2_BUCKET_NAME,
//       Key: filePath,
//       Body: fileBuffer,
//       ContentType: mimeType,
//     })
//   );

//   // Create signed URL (valid for 7 days)
//   const url = await getSignedUrl(
//     supabase,
//     new PutObjectCommand({
//       Bucket: process.env.B2_BUCKET_NAME,
//       Key: filePath,
//     }),
//     { expiresIn: 7 * 24 * 60 * 60 } // 7 days
//   );

//   return url;
// };

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Create Backblaze B2 S3 API client
const b2 = new S3Client({
  endpoint: "https://s3.us-east-005.backblazeb2.com", // ✅ Your bucket's S3 endpoint
  region: "us-east-005", // must match your Backblaze region
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

export const uploadToBackblaze = async (fileBuffer, fileName, mimeType) => {
  const uniqueName = `${uuidv4()}-${fileName}`;
  const filePath = `teamuploads/${uniqueName}`;

  // Upload file
  await b2.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filePath,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  // Generate signed download URL (valid for 7 days)
  const url = await getSignedUrl(
    b2,
    new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filePath,
    }),
    { expiresIn: 7 * 24 * 60 * 60 }
  );

  return url;
};


