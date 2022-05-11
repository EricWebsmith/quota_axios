const axios = require('axios');
const redis = require('redis');
const moment = require('moment');
const { v4 } = require('uuid');

const redisClient = redis.createClient(6379);

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const quota = 5;
const quotaTime = 20 * 1000;

async function wait() {
    if(!redisClient.isOpen){
        await redisClient.connect();
    }
    
    console.log( moment().valueOf() - quotaTime)
    const deleted = await redisClient.zRemRangeByScore('axios_quota', 0, moment().valueOf() - quotaTime);
    console.log('deleted:', deleted);
    let list = await redisClient.zRangeByScoreWithScores('axios_quota', moment().valueOf() - quotaTime, Infinity);
    const listLength = list.length;
    console.log('list length:', list.length);
    while(list && list.length >= quota) {
        const index = list.length - quota;
        const item = list[index];
        const sleepInterval = item.score + quotaTime - moment().valueOf();
        console.log('sleeping...', sleepInterval);
        await sleep(sleepInterval);
        await redisClient.zRemRangeByScore('axios_quota', 0, moment().valueOf() - quotaTime);
        list = await redisClient.zRangeByScoreWithScores('axios_quota', moment().valueOf() - quotaTime, Infinity);
    }

    await redisClient.zAdd('axios_quota', { score: moment().valueOf(), value: v4() } ,  );
}

async function get(...args) {
    await wait();
    const now = moment();
    console.log(now, args);
    const response = await axios.get(...args);
}

module.exports = {
    get
}