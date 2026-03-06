import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',  // Docker 默认
});

client.on('error', err => console.error('Redis Client Error', err));

// 连接测试
(async () => {
    await client.connect();
    console.log('Redis 连接成功！');
})();

export default client;