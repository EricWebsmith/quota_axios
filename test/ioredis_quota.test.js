
const moment = require('moment');
const { expect } = require('chai');
const IoredisQuota = require('../ioredis_quota');

describe('ioredis quota tests', () => {

    it('test 1', async () => {

        const quota = new IoredisQuota('quota1', 5, 100);
        quota.buffer = 5;
        const timeList = [];
        for (let i = 0; i < 20; i++) {
            await quota.waitForQuota();
            timeList.push(moment().valueOf());
        }

        for (let i = 0; i < 15; i++) {
            const diff = timeList[i + quota.quota] - timeList[i];
            expect(diff).to.be.greaterThanOrEqual(quota.ttl);
        }

    });

    it('test 2', async () => {

        const quota = new IoredisQuota('quota2', 5, 40);
        quota.buffer = 5;
        const timeList = [];
        for (let i = 0; i < 20; i++) {
            await quota.waitForQuota();
            timeList.push(moment().valueOf());
        }

        for (let i = 0; i < 15; i++) {
            const diff = timeList[i + quota.quota] - timeList[i];
            expect(diff).to.be.greaterThanOrEqual(quota.ttl);
        }

    });

    it('test 2', async () => {
        const startTime = moment().unix();
        const quota = new IoredisQuota('quota3', 40, 1000);
        quota.buffer = 5;
        const timeList = [];
        for (let i = 0; i < 40; i++) {
            await quota.waitForQuota();
            timeList.push(moment().valueOf());
        }
        const endTime = moment().unix();
        expect(endTime-startTime).to.be.lessThanOrEqual(100);
    });

});
