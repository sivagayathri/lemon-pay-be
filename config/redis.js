const { createClient } = require('redis');

const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.on('connect', () => {
    console.log('Redis connected successfully');
});

redisClient.on('error', (error) => {
    console.error('Redis connection error:', error.message);
});

(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;
