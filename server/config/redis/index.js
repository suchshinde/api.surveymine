import redis from 'redis';

const redisClient = redis.createClient({ host: process.env.DB_HOST, port: 6379 });
const log = console;
redisClient.on('ready', () => {
    log.log('start redis');
});

redisClient.on('error', (error) => {
    log.error('Error in Redis', error);
});
redisClient.select(1, (err, res) => {
    if(err) {
        log.error(err);
    }
    log.log(res);
});


module.exports = { redisClient };
