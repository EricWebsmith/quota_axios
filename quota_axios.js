const axios = require('axios');
const moment = require('moment');
const IoredisQuota = require('./ioredis_quota');

const quota = new IoredisQuota('axios_quota', 5, 60 * 1000);

quota.beforeSleep = async function(milliseconds) {
    const second = Math.floor(milliseconds / 1000);
    
    console.log(`Sleeping for ${this.key} ${milliseconds} ${'='.repeat(second)}`);
};

async function get(...args) {
    await quota.waitForQuota();
    const now = moment();
    console.log(now, args);
    return await axios.get(...args);
}

async function post(...args) {
    await quota.waitForQuota();
    const now = moment();
    console.log(now, args);
    return await axios.post(...args);
}

module.exports = {
    get,
    post
}