const PathPaymentService = require('./strategy/pathpayments');
const config = require('./config.json');
const logger = require('./services/log');

const instance = new PathPaymentService(config.host, config.loops, config.secret, config.minGap)

let i = 0;
const interval = setInterval(async ()=>{
  i++;
  await instance.run()
  logger.debug(`i = ${i}, fails:${instance.fails.length}, wins:${instance.wins.length}`)
}, config.intervalSeconds * 1000)
