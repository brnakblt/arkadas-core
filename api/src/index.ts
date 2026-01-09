import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import onlyOfficeRoutes from './onlyoffice/routes';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/onlyoffice', onlyOfficeRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'arkadas-api-service' });
});

app.listen(port, () => {
    console.log(`API Service running on port ${port}`);
});
