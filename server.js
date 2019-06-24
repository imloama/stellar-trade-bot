const koa = require('koa');
const staticservice = require('koa-static');
const render = require('koa-ejs');
const logger = require('./services/log');
const router = require('koa-router')()
const expertapi = require('./api/expert')
const StellarSdk = require('stellar-sdk');

const app = new koa()

app.use(staticservice('public'))

render(app, {
  root: 'templates',
  layout: 'layout',
  viewExt: 'html',
  cache: false,
  debug: true
})


router.get('/', async ctx => {
  await ctx.render('index')

})

router.get('/assets', async ctx => {
  const horizon = ctx.request.query.horizon || `https://horizon.stellar.org`
  const search = ctx.request.query.search
  const server = new StellarSdk.Server(horizon)
  const result = await server.assets().forCode(search).call()
  const data = result.records.map(item => {
    return {
      id: item.asset_type === 'native' ? 'XLM' : (item.asset_code+'-'+item.asset_issuer),
      text: item.asset_code+'-...'+item.asset_issuer.substring(item.asset_issuer.length-6),
      ...item
    }
  })
  let xlm = []
  if(search === null || typeof search === 'undefined' || search.startsWith('x') || search.startsWith('X')){
    xlm.push({id: 'XLM', text: 'XLM', asset_type: 'native'})
  }
  let results = [...xlm, ...data]

  ctx.body = {
    results
  }
})

app.use(router.routes());   /*启动路由*/
app.use(router.allowedMethods());



const port = process.env.PORT || 9000
app.listen(port)
logger.debug(`server running on port : ${port}`)
