import { v2 as webdav } from 'webdav-server';
import { StrapiFileSystem } from './vfs-adapter';

const port = process.env.WEBDAV_PORT ? parseInt(process.env.WEBDAV_PORT) : 1900;
const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

const server = new webdav.WebDAVServer({
    port,
    // @ts-ignore
    httpAuthentication: new webdav.HTTPBasicAuthentication(async (ctx: any, username: string, password: string, callback: any) => {
        try {
            const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: username, password }),
            });

            if (res.ok) {
                const data = await res.json();
                (ctx as any).user = { id: data.user.id, jwt: data.jwt, username };
                callback(undefined, true);
            } else {
                callback(undefined, false);
            }
        } catch (error) {
            callback(undefined, false);
        }
    }),
});

server.setFileSystem('/', new StrapiFileSystem({}), (success: any) => {
    // console.log('File system mounted');
});

// Actually, webdav-server v2 supports per-request FS resolution but it's tricky.
// Better approach: subclass the Server or Resource manager?
// For now, let's just start the server skeleton.

export function startWebDAVServer() {
    server.start((httpServer) => {
        console.log(`WebDAV server running on port ${port}`);
    });
}
