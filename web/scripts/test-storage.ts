/* eslint-disable no-console */
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Load from root
import { storage } from '../src/lib/storage';

async function main() {
    console.log("Testing Storage Connection...");
    try {
        const files = await storage.listFiles("/");
        console.log("Files listed successfully:", files.length);
        files.forEach(f => console.log(`- ${f.basename} (${f.type})`));
    } catch (err) {
        console.error("Storage test failed:", err);
        process.exit(1);
    }
}

main();
