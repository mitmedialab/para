var resolve = require("path").resolve;

module.exports = {
    staticPath : resolve(__dirname, "..", "build"),
    logFormat : "dev",
    redisServer : {
        host : "127.0.0.1",
        port : 6379
        // or
        // socket : "/tmp/redis.sock"
    }
};
