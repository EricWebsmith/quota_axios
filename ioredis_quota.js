const Redis = require('ioredis');
const moment = require('moment');
const { v4 } = require('uuid');

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

/** for a moving window of {ttl}, only {quota} times are allowed. */
class IoredisQuota {
    #offset = 0;

    /**
     * for a moving window of {ttl}, only {quota} times are allowed.
     * @param {string} key 
     * @param {number} quota limitation of doing something.
     * @param {number} ttl in milliseconds.
     */
    constructor(key, quota, ttl) {
        this.key = key;
        this.quota = quota;
        this.ttl = ttl;
        // use should not modify this.
        this.#offset = 0;
        // 2 milliseconds buffer
        this.buffer = 5;
    }

    /**
     * Wait until quota is available.
     */
    async waitForQuota() {
        const redis = new Redis();

        // time sync
        const redis_now_arr = await redis.time();
        const system_now = moment().valueOf();
        const redis_now = +redis_now_arr[0] * 1000 + Math.floor(+redis_now_arr[1] / 1000);
        this.#offset = redis_now - system_now;
        // remove onece percall.
        await redis.zremrangebyscore(this.key, 0, this.now() - this.ttl - this.buffer);

        let list = await redis.zrangebyscore(this.key, this.now() - this.ttl - this.buffer, Infinity);
        while (list && list.length >= this.quota) {
            const index = list.length - this.quota;
            const item = list[index];

            const sleepInterval = item.score + this.ttl - this.now();
            if (sleepInterval > 0) {
                await this.beforeSleep(sleepInterval);
                await sleep(sleepInterval);
            }

            list = await redis.zrangebyscore(this.key, this.now() - this.ttl - this.buffer, Infinity);
        }

        await redis.zadd(this.key, this.now(), v4() );
        await redis.quit();
    }

    now() {
        return moment().valueOf() + this.#offset;
    }


    async beforeSleep(sleepMilliseconds) {
        console.log('sleeping...', sleepMilliseconds, '=============================================================');
    }
}


module.exports = IoredisQuota;