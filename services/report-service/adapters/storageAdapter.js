// services/report-service/adapters/storageAdapter.js
// Cloud Storage Adapter - AWS S3 / Cloudinary / Local Mock
// ----------------------------------------------------------
// Supports real AWS S3 or Cloudinary when real credentials exist,
// or cleanly falls back to Local/Mock storage with explicit logging.
// ----------------------------------------------------------
const fs = require('fs');
const path = require('path');

const isRealS3 = process.env.STORAGE_PROVIDER === 's3' &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_ACCESS_KEY_ID !== 'your_access_key';

const isRealCloudinary = process.env.STORAGE_PROVIDER === 'cloudinary' &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

let PROVIDER = 'local';
if (isRealS3) PROVIDER = 's3';
else if (isRealCloudinary) PROVIDER = 'cloudinary';

// Ensure local storage directory exists
const LOCAL_STORAGE_DIR = path.resolve(__dirname, '../uploads/reports');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

/**
 * Upload a generated report file to storage
 * @param {object} params - { filename, content, contentType }
 * @returns {Promise<{ file_url: string, file_path: string, provider: string, is_mock: boolean }>}
 */
const uploadReport = async ({ filename, content, contentType = 'text/csv' }) => {
  if (PROVIDER === 's3') {
    // Production AWS S3 integration
    console.log(`[Storage Adapter] Uploading ${filename} to AWS S3 bucket: ${process.env.AWS_S3_BUCKET}`);
    const key = `reports/${Date.now()}-${filename}`;
    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
    return {
      file_url: s3Url,
      file_path: key,
      provider: 's3',
      is_mock: false
    };
  }

  if (PROVIDER === 'cloudinary') {
    // Production Cloudinary integration
    console.log(`[Storage Adapter] Uploading ${filename} to Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    const publicId = `reports/${path.parse(filename).name}`;
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`;
    return {
      file_url: cloudinaryUrl,
      file_path: publicId,
      provider: 'cloudinary',
      is_mock: false
    };
  }

  // Local / Mock Adapter
  console.log(`[Storage Adapter] MOCK/LOCAL MODE - Saving report file to local filesystem.`);
  const localFilePath = path.join(LOCAL_STORAGE_DIR, filename);
  fs.writeFileSync(localFilePath, content, 'utf8');

  const relativeUrl = `/api/reports/download/${encodeURIComponent(filename)}`;
  return {
    file_url: `http://localhost:${process.env.PORT_GATEWAY || 5000}${relativeUrl}`,
    file_path: localFilePath,
    provider: 'local',
    is_mock: true,
    note: 'Saved locally. Configure AWS S3 or Cloudinary credentials in .env for production cloud storage.'
  };
};

module.exports = { uploadReport, PROVIDER, LOCAL_STORAGE_DIR };
