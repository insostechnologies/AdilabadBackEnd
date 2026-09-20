const sharp = require('sharp');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// Initialize S3 client if cloud storage environment variables are configured
let s3Client = null;

if (process.env.STORAGE_PROVIDER === 'oracle' || process.env.STORAGE_PROVIDER === 'r2' || process.env.STORAGE_PROVIDER === 's3') {
    const endpoint = process.env.STORAGE_ENDPOINT || 
        (process.env.STORAGE_PROVIDER === 'oracle' 
            ? `https://${process.env.OCI_NAMESPACE}.compat.objectstorage.${process.env.OCI_REGION}.oraclecloud.com` 
            : undefined);

    s3Client = new S3Client({
        region: process.env.STORAGE_REGION || 'auto',
        endpoint: endpoint,
        credentials: {
            accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || process.env.OCI_CUSTOMER_SECRET_KEY_ID,
            secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || process.env.OCI_CUSTOMER_SECRET_KEY,
        },
    });
}

/**
 * Optimizes an image buffer to WebP format and uploads to Object Storage (or saves locally fallback)
 * @param {Buffer} fileBuffer - Input image file buffer
 * @param {string} originalName - Original filename
 * @param {string} folder - Target folder inside bucket (e.g., 'products', 'banners')
 * @returns {Promise<string>} Public URL of the uploaded image
 */
async function processAndUploadImage(fileBuffer, originalName, folder = 'uploads') {
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const key = `${folder}/${filename}`;

    // Optimize image buffer: Max 1200px width/height, 80% WebP quality
    const optimizedBuffer = await sharp(fileBuffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    // If Cloud S3 client is configured, upload to cloud storage
    if (s3Client && process.env.STORAGE_BUCKET_NAME) {
        const command = new PutObjectCommand({
            Bucket: process.env.STORAGE_BUCKET_NAME,
            Key: key,
            Body: optimizedBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
        });

        await s3Client.send(command);

        if (process.env.STORAGE_PUBLIC_DOMAIN) {
            return `${process.env.STORAGE_PUBLIC_DOMAIN}/${key}`;
        }

        if (process.env.STORAGE_PROVIDER === 'oracle') {
            return `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${process.env.OCI_NAMESPACE}/b/${process.env.STORAGE_BUCKET_NAME}/o/${key}`;
        }
    }

    // Fallback: Local filesystem save
    const fs = require('fs');
    const localDir = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
    }

    const localPath = path.join(localDir, filename);
    await fs.promises.writeFile(localPath, optimizedBuffer);

    return `uploads/${folder}/${filename}`;
}

module.exports = {
    processAndUploadImage,
};
