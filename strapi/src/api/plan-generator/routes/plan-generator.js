module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/plan-generator/bep',
            handler: 'plan-generator.generateBEP',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/plan-generator/bop',
            handler: 'plan-generator.generateBOP',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
