/**
 * OnlyOffice Callback API
 * Handles document save callbacks from OnlyOffice Document Server
 * 
 * Callback statuses:
 * 0 - No document with the key identifier could be found
 * 1 - Document is being edited
 * 2 - Document is ready for saving
 * 3 - Document saving error
 * 4 - Document closed with no changes
 * 6 - Document is being edited, but saving is in progress
 * 7 - Error has occurred while force saving
 */

/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import storageService from '@/services/storageService';

interface OnlyOfficeCallback {
    key: string;
    status: number;
    url?: string;
    users?: string[];
    actions?: Array<{ type: number; userid: string }>;
    changesurl?: string;
    history?: object;
    filetype?: string;
}

// Store document key to file path mapping
// In production, use Redis or database
const documentKeyMap = new Map<string, string>();

export async function POST(request: NextRequest) {
    try {
        const body: OnlyOfficeCallback = await request.json();

        console.debug('OnlyOffice callback received:', JSON.stringify(body, null, 2));

        const { key, status, url } = body;

        switch (status) {
            case 0:
                // Document not found
                console.debug(`Document with key ${key} not found`);
                break;

            case 1:
                // Document is being edited
                console.debug(`Document ${key} is being edited`);
                break;

            case 2:
                // Document is ready for saving
                if (url) {
                    console.debug(`Saving document ${key} from URL: ${url}`);

                    // Get file path from key (stored when editor was opened)
                    const filePath = documentKeyMap.get(key);

                    if (filePath) {
                        try {
                            // SSRF Prevention: Validate URL domain
                            const allowedUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || 'http://localhost:8080';

                            try {
                                const parsedUrl = new URL(url);
                                const parsedAllowed = new URL(allowedUrl);

                                // Normalize hostnames for comparison
                                if (parsedUrl.hostname !== parsedAllowed.hostname) {
                                    console.error(`Blocked SSRF attempt: ${url}`);
                                    return NextResponse.json({ error: 1 });
                                }
                            } catch {
                                console.error('Invalid URL in callback:', url);
                                return NextResponse.json({ error: 1 });
                            }

                            // Download the edited document from OnlyOffice
                            const docResponse = await fetch(url);
                            if (!docResponse.ok) {
                                throw new Error(`Failed to download document: ${docResponse.status}`);
                            }

                            const docBuffer = Buffer.from(await docResponse.arrayBuffer());

                            // Save to storage via WebDAV
                            await storageService.uploadFile(filePath, docBuffer);

                            console.debug(`Document saved to storage: ${filePath}`);

                            // Clean up key mapping
                            documentKeyMap.delete(key);
                        } catch (saveError) {
                            console.error('Error saving document:', saveError);
                            return NextResponse.json({ error: 1 });
                        }
                    } else {
                        console.warn(`No file path found for key: ${key}`);
                    }
                }
                break;

            case 3:
                // Document saving error
                console.error(`Document saving error for key ${key}`);
                break;

            case 4:
                // Document closed without changes
                console.debug(`Document ${key} closed without changes`);
                documentKeyMap.delete(key);
                break;

            case 6:
                // Document being edited, save in progress
                console.debug(`Document ${key} save in progress`);
                break;

            case 7:
                // Force save error
                console.error(`Force save error for document ${key}`);
                break;

            default:
                console.warn(`Unknown callback status: ${status}`);
        }

        // OnlyOffice expects { error: 0 } for success
        return NextResponse.json({ error: 0 });
    } catch (error) {
        console.error('Error processing OnlyOffice callback:', error);
        return NextResponse.json({ error: 1 });
    }
}
