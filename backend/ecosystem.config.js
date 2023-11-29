module.exports = {
    apps : [{
      name   : "backend-app",
      script : "./bin/www",
      env: {
        DEBUG: "backend:*",
        NODE_ENV: "development",
      }
    }]
  };