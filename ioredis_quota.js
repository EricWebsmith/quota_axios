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
        // user should not modify this.
        this.#offset = 0;
        // 2 milliseconds buffer
        this.buffer = 20;
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
        //console.log('offset', this.#offset);
        // remove onece percall.

        const results = await redis.pipeline()
            .zremrangebyscore(this.key, 0, this.now() - this.buffer)
            .zrangebyscore(this.key, this.now() - this.buffer, Infinity, "WITHSCORES")
            .exec();
        let error = results[1][0];
        if (error) {
            console.log('err................');
            throw error;
        }
        let list = results[1][1];

        // let list = await redis.zrangebyscore(this.key, this.now() - this.buffer, Infinity, "WITHSCORES");
        while (list && list.length >= this.quota * 2) {
            const index = list.length - this.quota * 2;
            const item = list[index + 1];

            const sleepInterval = +item + this.buffer - this.now();
            if (sleepInterval > 0) {
                await this.beforeSleep(sleepInterval);
                await sleep(sleepInterval);
            }

            list = await redis.zrangebyscore(this.key, this.now() - this.buffer, Infinity);
        }

        await redis.zadd(this.key, this.now() + this.ttl, v4());
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
