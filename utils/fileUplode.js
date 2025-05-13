const fs = require('fs').promises;
const writeFileAsync = fs.writeFile;
const path = require('path');
const sharp = require('sharp');

const generateUniqueFileName = () => {
    const timestamp = Date.now();
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${timestamp}-${randomNumber}.png`;
};

const saveBase64File = async (base64Data, uploadPath) => {
    try {
        if (!base64Data || typeof base64Data !== 'string') {
            throw new Error('Invalid base64 data');
        }

        // Decode the base64-encoded file data
        const base64Image = base64Data.split(';base64,').pop();
        const fileBuffer = Buffer.from(base64Image, 'base64');

        // Ensure the uploadPath directory exists
        try {
            await fs.access(uploadPath);
        } catch (err) {
            // Directory does not exist, create it
            await fs.mkdir(uploadPath, { recursive: true });
        }

        // Compress the image using sharp without resizing
        const compressedImageBuffer = await sharp(fileBuffer)
            .resize({ width: 800 })  // maxwidth 800px
            .png({ quality: 70 })    // Compress the image to 50% quality 
            .toBuffer();

        // Generate a unique filename with the .png extension
        const fileName = generateUniqueFileName();
        const filePath = path.join(uploadPath, fileName);
        await writeFileAsync(filePath, compressedImageBuffer);

        return filePath;
    } catch (error) {
        console.error(`>>>>>>>>>>>>>>>   Error saving file: ${error.message}`);
        throw new Error(`Error saving file: ${error.message}`);
    }
};


const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
        // console.log(`>>>>>>>>>>>>>>> File ${filePath} deleted successfully`);
    } catch (err) {
        console.error(`>>>>>>>>>>>>>>>   Error deleting file: ${err.message}`);
    }
};


module.exports = {
    saveBase64File,
    deleteFile
};