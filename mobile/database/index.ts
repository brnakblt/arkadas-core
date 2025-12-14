import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import StorageFile from './models/StorageFile';
import migrations from './migrations'; // We will create a dummy migrations file if needed

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
    schema: mySchema,
    // (You might want to comment out the following line if you have existing data and no migrations)
    // migrations, 
    // (recommended option, should work flawlessly out of the box on iOS. On Android,
    // additional installation steps have to be taken - see docs)
    jsi: true, /* Platform.OS === 'ios' */
    onSetUpError: error => {
        // Database failed to load -- offer the user to reload the app or log out
        console.error('Database setup error:', error);
    }
});

// Then, make a Watermelon database from it!
const database = new Database({
    adapter,
    modelClasses: [
        StorageFile,
    ],
});

export default database;
