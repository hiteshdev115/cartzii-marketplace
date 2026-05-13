module.exports = {
  apps: [
    {
      name: "cartzii-qa",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
        HOSTNAME: "0.0.0.0",
        NEXT_PUBLIC_API_URL: "https://staging-api.cartzii.com",
        NEXT_PUBLIC_GUEST_API_TOKEN: "guest_cartzii_staging_secure_d9f2c7a4e8b1d5f3c6a2e4b7d9f1c8a3",
      },
    },
  ],
};
