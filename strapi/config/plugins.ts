export default ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        service: 'gmail',
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('SMTP_USERNAME'),
        defaultReplyTo: env('SMTP_USERNAME'),
      },
    },
  },
  upload: {
    config: {
      provider: 'local',
      sizeLimit: 104857600,
      providerOptions: {},
      security: {
        actions: {
          coopPolicy: 'same-origin',
        },
      },
    },
  },
});
