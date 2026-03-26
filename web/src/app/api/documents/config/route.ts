
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT secret for document editor config signing
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { document, editorConfig } = body;

        if (!document || !editorConfig) {
            return NextResponse.json({ error: 'Missing document or editorConfig' }, { status: 400 });
        }

        const config = {
            document,
            editorConfig,
        };

        // Sign the token
        const token = jwt.sign(config, JWT_SECRET, { expiresIn: '5m' });

        return NextResponse.json({
            ...config,
            token,
        });

    } catch (error) {
        console.error("Config Generation Error:", error);
        return NextResponse.json(
            { error: 'Failed to generate config' },
            { status: 500 }
        );
    }
}
