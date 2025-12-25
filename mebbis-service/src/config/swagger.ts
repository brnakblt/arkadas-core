import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Arkadaş MEBBIS Service API',
            version: '1.0.0',
            description: 'API documentation for the MEBBIS automation service',
            contact: {
                name: 'Arkadaş Özel Eğitim',
                email: 'info@arkadas.com.tr',
            },
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Local Development Server',
            },
            {
                url: 'http://mebbis-service:4000',
                description: 'Docker Internal',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/api/*.ts', './src/types/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
