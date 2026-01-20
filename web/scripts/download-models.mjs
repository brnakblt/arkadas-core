
import fs from 'fs';
import path from 'path';
import https from 'https';

const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const TARGET_DIR = './public/models';

const FILES = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

const downloadFile = (filename) => {
    const fileUrl = `${MODELS_URL}/${filename}`;
    const filePath = path.join(TARGET_DIR, filename);
    const file = fs.createWriteStream(filePath);

    console.log(`Downloading ${filename}...`);

    https.get(fileUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(filePath, () => { }); // Delete the file async. (But we don't check result)
        console.error(`Error downloading ${filename}: ${err.message}`);
    });
};

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

FILES.forEach(downloadFile);
