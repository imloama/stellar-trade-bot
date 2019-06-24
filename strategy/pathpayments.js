const logger = require('./log');
var StellarSdk = require('stellar-sdk');
const Big = require('big.js');

const BIG_DOWN = 0


module.exports = class StellarAPI {
  constructor(host, loops, secret) {
    this.host = host
    // turn to trade pairs
    this.loops = loops
    this.generatePairs()
    this.seed = seed
    if (this.host.indexOf('testnet') > 0) {
      StellarSdk.Network.useTestNetwork()
    } else {
      StellarSdk.Network.usePublicNetwork()
    }
    this.server = new StellarSdk.Server(host)
    this.keypair = StellarSdk.Keypair.fromSecret(secret)
    this.accountid = this.keypair.publicKey()
    this.balances = {}
    this.wins = []
    this.fails = []
  }

  generatePairs() {
    let pairs = []
    for (let i = 0, n = this.loops.length; i < n; i++) {
      for (let j = 1, m = this.loops[i].length; j < m; j++) {
        const p = [this.loops[i][j - 1], this.loops[i][j]]
        pairs.push(p)
      }
    }
    this.pairs = pairs
  }

  asset(code, issuer) {
    if (code === 'XLM') return new StellarSdk.Asset.native()
    return new StellarSdk.Asset(code, issuer);
  }



  obfn(base, counter) {
    const sasset = asset(base.code, base.issuer)
    const basset = asset(counter.code, counter.issuer)
    return this.server.orderbook(sasset, basset).call()
  }

  orderbooks() {
    const fns = this.pairs.map(item => obfn(item[0], item[1]))
    return Promise.all(fns)
  }

  async getBalaces() {
    this.account = await this.server.loadAccount(this.accountid)
    const bb = this.account.balances
    for (let i = 0, n = bb.length; i < n; i++) {
      const code = bb[i].asset_type === 'native' ? 'XLM' : bb[i].asset_code
      this.balances[code] = new Big(bb[i].balance).minus(bb[i].buying_liabilities).minus(bb[i].selling_liabilities).round(7, BIG_DOWN)
    }
  }

  async run() {
    await this.getBalaces()

    // 执行orderbook,组成对象-根据交易对
    const obdata = await this.orderbooks()
    for (let i = 0, n = this.pairs.length; i < n; i++) {
      const key = this.pairs[i].map(item => item.key).join('-')
      this.obs[key] = obdata[i]
    }
    // 按定义好的顺序，计算可能的套利空间
    for (let i = 0, n = this.loops.length; i < n; i++) {
      const keys = this.loops[i].map(item => item.key)
      const profee = this.hasProfee(keys)
      logger.debug(`---loop:${loops[i]}, profee:${profee}`)
      if (profee === null || profee === undefined || typeof profee === 'undefined' || profee.length === 0) continue
      //TODO 有套利空间
      logger.debug(`有套利空间：${JSON.stringify(profee)}`)
      // 获取到套利空间，执行pathpayment
      await this.pathPay(keys, profee[0], profee[profee.length - 1])
    }

  }

  hasProfee(keys) {
    //组装相应的买1卖1价格\数量
    const ob1s = []
    for (let i = 1, n = keys.length; i < n; i++) {
      // code[i-1]是卖，code[i]是买
      let key = `${keys[i - 1]}-${keys[i]}`
      let ddd = this.obs[key]
      if (ddd) {//同向，则取买1，因为我要卖，买1的amount表示我花多少钱买
        if (ddd.bids.length === 0) break;
        let d = ddd.bids[0]
        logger.debug(`-------key:${key}--bids[0]:${JSON.stringify(d)}`)
        // bids中的amount是code[i]的数量 amount/price或amount*price_r.d/price_r.n为code[i-1]的数量
        const bids0 = {
          price_r: { n: d.price_r.d, d: d.price_r.n },
          price: new Big(d.price_r.d).div(d.price_r.n).round(7, BIG_DOWN),
          cost: d.amount, //code[i-1]的数量
          amount: new Big(d.amount).times(d.price_r.d).div(d.price_r.n).round(7, BIG_DOWN), // code[i]的数量
          base: keys[i - 1], counter: keys[i]
        }
        logger.debug(`-----bids0:${JSON.stringify(bids0)}--`)
        ob1s.push(bids0)
      } else {
        key = `${keys[i]}-${keys[i - 1]}`
        ddd = this.obs[key]
        if (ddd.asks.length === 0) break;
        let d = ddd.asks[0] //把它反过来
        logger.debug(`-------key:${key}--asks[0]:${JSON.stringify(d)}`)
        const ask0 = {
          price: d.price,
          amount: new Big(d.amount).times(d.price_r.n).div(d.price_r.d).round(7, BIG_DOWN),
          cost: d.amount, //code[i-1]的数量
          price_r: d.price_r,
          base: keys[i - 1], counter: keys[i]
        }
        logger.debug(`-----ask0:${JSON.stringify(ask0)}--`)
        ob1s.push(ask0);
      }
    }
    // console.log(ob1s)
    // console.log(codes)
    if (ob1s.length < keys.length - 1) return;
    //根据汇率计算是否有利可图
    let canWin = ob1s.map(item => Number(item.price)).reduce((a, b) => Number(new Big(a).times(b).toString()))
    logger.debug(`codes:${codes.join('-')}, 汇率：${canWin}`)
    if (canWin >= 1) return;
    //存在套利机会，计算要支出多少才可以拿到

    //取第2位的最小值，重新计算
    let mins = []
    for (let i = 1, n = keys.length - 1; i < n; i++) {
      //取两者最小的
      logger.debug(`code: ${keys[i]}, 前一单：${JSON.stringify(ob1s[i - 1])}，后一单：${JSON.stringify(ob1s[i])}-`)
      const min = Number(ob1s[i - 1].cost) > Number(ob1s[i].amount) ? Number(ob1s[i].amount) : Number(ob1s[i - 1].cost)
      logger.debug(`min:${min}, cost: ${ob1s[i - 1].cost}, amount:${ob1s[i].amount}, cost>amount:${ob1s[i - 1].cost > ob1s[i].amount}`)
      mins.push(min)
    }

    logger.debug(`--最小中间数量：${JSON.stringify(mins)}--`)
    for (let i = 1, n = mins.length; i < n; i++) {
      if (mins[i - 1] / ob1s[i].price > mins[i]) {
        // 向前
        for (let j = i - 1; j >= 0; j--) {
          mins[j] = new Big(mins[j + 1]).times(ob1s[j + 1].price_r.n).div(ob1s[j + 1].price_r.d).round(7, BIG_DOWN)
        }
      } else {
        //向后
        mins[i] = new Big(mins[i - 1]).times(ob1s[i].price_r.d).div(ob1s[i].price_r.n).round(7, BIG_DOWN)
      }
    }
    logger.debug(`--重新计算后的：最小中间数量：${JSON.stringify(mins)}--`)

    //第1位的数量
    const start = Number(this.balances[ob1s[0].base])
    const calc = Number(new Big(mins[0]).times(ob1s[0].price_r.n).div(ob1s[0].price_r.d).round(7, BIG_DOWN))
    if (start >= calc) {
      const target = Number(new Big(mins[mins.length - 1])
        .times(ob1s[ob1s.length - 1].price_r.d).div(ob1s[ob1s.length - 1].price_r.n).round(7, BIG_DOWN))
      logger.debug(`--start:${start}--calc:${calc}--target:${target}`)
      if (target - calc > 0.00001) {
        return [calc, ...mins, target]
      }
      logger.debug(`target - calc 小于0.00001，没有套利空间`)
      return
    } else {
      // 重新根据start计算
      let target = new Big(mins[mins.length - 1])
        .times(ob1s[ob1s.length - 1].price_r.d).div(ob1s[ob1s.length - 1].price_r.n).round(7, BIG_DOWN)
      target = Number(new Big(start).times(target).div(calc).round(7, BIG_DOWN))
      const result = [calc, ...mins, target] //TODO 中间数据不正确
      logger.debug(`---re: result: ${JSON.stringify(result)}`)
      if ((target - start) > 0.00001) {
        return result
      }
      return
    }

  }



  async pathPay(keys, start, target) {
    const allpath = keys.map(key => {
      let data = key.split('-')
      return asset(data[0], data[1])
    })
    const path = []
    for (let i = 1, n = allpath - 1; i < n; i++) {
      path.push(allpath[i])
    }
    const opt = StellarSdk.Operation.pathPayment({
      sendAsset: allpath[0],
      sendMax: start.toFixed(7),
      destination: this.accountid,
      destAsset: allpath[allpath.length - 1],
      destAmount: new Big(target).round(7, 0).toString(),
      path: path,
      source: this.accountid
    });
    const builder = new StellarSdk.TransactionBuilder(this.account, { fee: 100 }).addOperation(opt)
    const tx = builder.setTimeout(60).build()
    tx.sign(StellarSdk.Keypair.fromSecret(secret));
    logger.debug(`---套利tx: ${tx.toXDR()}`)
    const result = await this.server.submitTransaction(tx);
    logger.debug(`执行结果：`)
    logger.debug(result)
    if (result.hash) {
      logger.debug(`----套利成功！---`)
      wins.push(profee)
    } else {
      logger.debug(`------套利失败！--`)
      fails.push(profee)
    }
    await getBalaces()
  }



}