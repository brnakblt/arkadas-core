
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { storage } from '../src/lib/storage';

async function main() {
    console.log("Testing Storage Stats...");
    try {
        const files = await storage.listFiles("/");
        const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
        const fileCount = files.filter(f => f.type === 'file').length;

        console.log("Stats calculated directly via library:");
        console.log(`Used: ${totalSize} bytes`);
        console.log(`Count: ${fileCount} files`);

    } catch (err) {
        console.error("Storage stats test failed:", err);
    }
}

main();
