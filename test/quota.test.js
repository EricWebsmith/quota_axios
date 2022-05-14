
const Quota = require('../quota');
const moment = require('moment');
const { expect } = require('chai');


describe('quota tests', () => {

    it('test 1', async () => {

        const quota = new Quota('quota1', 5, 100);
        const timeList = [];
        for (let i = 0; i < 20; i++) {
            console.log(i);
            await quota.waitForQuota();
            timeList.push(moment().valueOf());
        }

        for (let i = 0; i < 15; i++) {
            const diff = timeList[i + quota.quota] - timeList[i];
            expect(diff).to.be.greaterThanOrEqual(quota.ttl - 5);
        }

        console.log('done');
    });

});

describe('quota tests 2', () => {

    it('test 2', async () => {
        // await redisClient.connect();
        // console.log(redisClient.isOpen);
        // await redisClient.quit();
    });

});