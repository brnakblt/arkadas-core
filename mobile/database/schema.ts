import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'storage_files',
            columns: [
                { name: 'remote_id', type: 'string', isIndexed: true }, // Strapi ID
                { name: 'name', type: 'string' },
                { name: 'path', type: 'string', isIndexed: true },
                { name: 'mime_type', type: 'string', isOptional: true },
                { name: 'size', type: 'number' },
                { name: 'is_directory', type: 'boolean' },
                { name: 'parent_id', type: 'string', isOptional: true },
                { name: 'local_uri', type: 'string', isOptional: true },
                { name: 'sync_status', type: 'string' }, // synced, pending, conflict
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
    ],
});
