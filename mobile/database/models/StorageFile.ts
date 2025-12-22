import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class StorageFile extends Model {
    static table = 'storage_files';

    @field('remote_id') remoteId!: string;
    @field('name') name!: string;
    @field('path') path!: string;
    @field('mime_type') mimeType?: string;
    @field('size') size!: number;
    @field('is_directory') isDirectory!: boolean;
    @field('parent_id') parentId?: string;
    @field('local_uri') localUri?: string;
    @field('sync_status') syncStatus!: string;

    @readonly @date('created_at') createdAt!: Date;
    @readonly @date('updated_at') updatedAt!: Date;
}
