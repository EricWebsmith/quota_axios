const redis = require('redis');
const moment = require('moment');
const { v4 } = require('uuid');


const ERR = 2;

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

/** for a moving window of {ttl}, only {quota} times are allowed. */
class Quota {
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
    }


    /**
     * Wait until quota is available.
     */
    async waitForQuota() {
        const redisClient = redis.createClient(6379);
        await redisClient.connect();
        const redis_now = await redisClient.time();
        //console.log('redis_now', redis_now);
        const system_now = moment().valueOf();
        this.offset = redis_now - system_now;
        console.log('offset', this.offset);
        // only remove once per call.
        await redisClient.zRemRangeByScore(this.key, 0, this.now() - this.ttl - ERR);
        let list = await redisClient.zRangeByScoreWithScores(this.key, this.now() - this.ttl - ERR, Infinity);
        while (list && list.length >= this.quota) {
            const index = list.length - this.quota;
            const item = list[index];
            const sleepInterval = item.score + this.ttl - this.now();
            if (sleepInterval > 0) {
                await this.beforeSleep(sleepInterval);
                await sleep(sleepInterval);
            }

            list = await redisClient.zRangeByScoreWithScores(this.key, this.now() - this.ttl - ERR, Infinity);
        }

        await redisClient.zAdd(this.key, { score: this.now(), value: v4() },);
        redisClient.quit();
    }

    now() {
        return moment().valueOf() + this.offset;
    }

    async beforeSleep(sleepMilliseconds) {
        console.log('sleeping...', sleepMilliseconds, '=============================================================');
    }
}


module.exports = Quota;