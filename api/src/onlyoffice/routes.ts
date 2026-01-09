import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Endpoint for OnlyOffice to call back with document status
router.post('/callback', (req, res) => {
    const { status, url } = req.body;

    if (status === 2 || status === 6) { // 2 = Ready for saving, 6 = Force save
        console.log(`Document ready for saving: ${url}`);
        // Logic to download file from 'url' and save it to storage (e.g. SFTPGo) goes here
    }

    res.json({ error: 0 });
});

// Endpoint to generate config/token for frontend to use OnlyOffice
router.post('/config', (req, res) => {
    const { document, editorConfig } = req.body;
    const secret = process.env.JWT_SECRET || 'secret';

    const payload = { ...document, ...editorConfig };
    const token = jwt.sign(payload, secret);

    res.json({ token });
});

export default router;
