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
        NEXT_PUBLIC_GUEST_API_TOKEN: "f6ec111259e3d0f10af32ec3724b82285866aa2af516b0ebdbd2ce4d54d39467",
      },
    },
  ],
};
