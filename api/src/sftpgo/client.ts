import axios from 'axios';

class SFTPGoClient {
    private baseUrl: string;
    private apiKey: string;

    constructor(baseUrl: string, apiKey: string) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    async getUsers() {
        const response = await axios.get(`${this.baseUrl}/api/v2/users`, {
            headers: { 'X-SFTPGO-API-KEY': this.apiKey }
        });
        return response.data;
    }

    // Add more methods as needed
}

export default SFTPGoClient;
