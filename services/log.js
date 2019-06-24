const log4js = require('log4js');

log4js.configure({
    appenders: { console: { type: 'console' }, 
	  bot: { type: 'dateFile', filename: 'bot.log'  } 
  },
  categories: { default: { appenders: ['bot', 'console'], level: 'debug' } }
})

module.exports =  log4js.getLogger('bot')
