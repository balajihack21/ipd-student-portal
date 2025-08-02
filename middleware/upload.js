import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { supabase } from '../config/cloudinary.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadToSupabase = async (fileBuffer, fileName, mimeType) => {
  const uniqueName = `${uuidv4()}-${fileName}`;
  const filePath = `teamuploads/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from('teamuploads') // this is the bucket name
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  // Make public URL
  const { publicUrl } = supabase.storage
    .from('teamuploads')
    .getPublicUrl(filePath).data;

  return publicUrl;
};

export { upload };
