const quota_axios = require('./quota_axios');



async function call100() {
    for (let i = 0; i < 20; i++) {
        console.log(i);
        await quota_axios.get('https://www.bing.com/');
    }
}


call100().then(value => {
    console.log(value); // Success!
    return;
  }, reason => {
    console.error(reason); // Error!
    return;
  });
