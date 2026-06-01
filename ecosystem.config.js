module.exports = {
  apps: [
    {
      name: "deriv-aviator-server",
      cwd: "./server",
      script: "index.js",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "4501",
        DERIV_SYMBOL: "R_10",
        PRICE_CHANGE_THRESHOLD: "0.2413",
      },
    },
    {
      name: "deriv-aviator-client",
      cwd: "./client",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 4502",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "4502",
        NEXT_PUBLIC_API_URL: "https://deriv-aviator.privatedns.org",
      },
    },
  ],
};
