import { v2 as webdav } from 'webdav-server';
import { Readable, Writable } from 'stream';

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

export class StrapiFileSystem extends webdav.FileSystem {
    protected user: any;

    constructor(user: any) {
        // @ts-expect-error - Mismatch in VFS constructor
        super(null);
        this.user = user;
    }

    async _fastMove(ctx: webdav.RequestContext, _pathFrom: webdav.Path, _pathTo: webdav.Path, callback: (error?: any) => void): Promise<void> {
        callback(new Error('Not Implemented'));
    }

    // Convert WebDAV path to Strapi storage path (remove /files prefix if present)
    private getStoragePath(_path: webdav.Path): string {
        return _path.toString();
    }

    protected _create(path: webdav.Path, ctx: webdav.CreateInfo, callback: webdav.SimpleCallback): void {
        // const storagePath = this.getStoragePath(path);

        if (ctx.type.isDirectory) {
            // Create folder
            fetch(`${STRAPI_URL}/api/storage-files/folder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.user.jwt}`
                },
                body: JSON.stringify({
                    name: path.fileName(),
                    parentId: null // Need logic to resolve parent ID from path
                })
            })
                .then(res => {
                    if (res.ok) callback();
                    else callback(new Error('Invalid Operation'));
                })
                .catch(() => callback(new Error('Invalid Operation')));
        } else {
            // File creation is handled in openWriteStream usually, but create can also be called
            callback();
        }
    }

    protected _delete(path: webdav.Path, ctx: webdav.DeleteInfo, callback: webdav.SimpleCallback): void {
        callback(new Error('Not Implemented')); // To be implemented with delete API
    }

    protected _openWriteStream(path: webdav.Path, ctx: webdav.OpenWriteStreamInfo, callback: webdav.ReturnCallback<Writable>): void {
        // Implement upload via stream to Strapi or VFS
        // For simple implementation, we might buffer or pipe
        callback(new Error('Not Implemented'));
    }

    protected _openReadStream(path: webdav.Path, ctx: webdav.OpenReadStreamInfo, callback: webdav.ReturnCallback<Readable>): void {
        // Stream file from VFS
        callback(new Error('Not Implemented'));
    }

    protected _size(path: webdav.Path, ctx: webdav.SizeInfo, callback: webdav.ReturnCallback<number>): void {
        // Get file size
        callback(undefined, 0); // Placeholder
    }

    protected _lockManager(path: webdav.Path, ctx: webdav.LockManagerInfo, callback: webdav.ReturnCallback<webdav.ILockManager>): void {
        const lockManager = new webdav.LocalLockManager();
        callback(undefined, lockManager);
    }

    protected _propertyManager(path: webdav.Path, ctx: webdav.PropertyManagerInfo, callback: webdav.ReturnCallback<webdav.IPropertyManager>): void {
        const props = new webdav.LocalPropertyManager();
        callback(undefined, props);
    }

    protected _readDir(path: webdav.Path, ctx: webdav.ReadDirInfo, callback: webdav.ReturnCallback<string[] | webdav.Path[]>): void {
        // List files
        const storagePath = this.getStoragePath(path);

        fetch(`${STRAPI_URL}/api/storage-files/mine?path=${encodeURIComponent(storagePath)}`, {
            headers: { 'Authorization': `Bearer ${this.user.jwt}` }
        })
            .then(res => res.json())
            .then((data: any) => {
                if (data.data) {
                    const names = data.data.map((f: any) => f.name);
                    callback(undefined, names);
                } else {
                    callback(new Error('Resource Not Found'));
                }
            })
            .catch(() => callback(new Error('Resource Not Found')));
    }

    protected _type(path: webdav.Path, ctx: webdav.TypeInfo, callback: webdav.ReturnCallback<webdav.ResourceType>): void {
        // Check if file or folder
        // const storagePath = this.getStoragePath(path);
        // Need an API to get single file/folder info by path
        // For root
        if (path.isRoot()) {
            callback(undefined, webdav.ResourceType.Directory);
            return;
        }

        callback(undefined, webdav.ResourceType.File); // Simplification for now
    }
}
