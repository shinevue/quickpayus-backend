module.exports = {
  apps: [
    {
      name: "Quickpayus API",
      script: "index.js",
      ignore_watch: [
        // List files/directories to ignore for watching
        "node_modules/",
        ".git/",
        "public/", // You can add other directories as needed
      ],
      time: true,
      env_production: {
        // Optional: Environment variables for production
        NODE_ENV: "production",
        instances: 4, // number of workers you want to run
        exec_mode: "cluster", // to turn on cluster mode; defaults to 'fork' mode
      },
      env_development: {
        watch: true, // Enable watcher mode
        // Optional: Environment variables for development
        NODE_ENV: "development",
        PORT: 3001
      },
    },
  ],
};
