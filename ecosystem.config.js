module.exports = {
  apps: [
    {
      name: "news-portal",
      cwd: "/var/www/news-portal/backend",
      script: "src/bootstrap.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
