module.exports = {
  apps: [
    {
      name: "cartzii-qa",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
