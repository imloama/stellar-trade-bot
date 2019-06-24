/**
 * 数据库部分，采用内存记录的方式
 */
var typeorm = require("typeorm");
var EntitySchema = typeorm.EntitySchema;
const entities = require('./model');
const path = require('path');
const dayjs = require('dayjs');
const logger = require('./log');


const dbconfig = {
  type: "sqlite",
  database: path.resolve(__dirname, `../../${name}.db`),
  synchronize: true,
  // logging: config.debug ? 'all': true,
  entities: [
      new EntitySchema(entities.Instance),
      new EntitySchema(entities.Details),
      new EntitySchema(entities.Balances)
  ]
}


async function connection(){
  if(conn)return await Promise.resolve(conn)
  conn = await typeorm.createConnection(dbconfig)
  return conn
}

/**
 * 设置启动时间
 */
async function startInstance(name, insttype, config) {
  const conn = await connection()
  const repo = conn.getRepository("Instance");
  let id = new Date().getTime()
  let started = new Date().getTime()
  const data = { id, name, insttype,
      config: JSON.stringify(config),  
      status: 0,
      started,
      win: 0,
      chance: 0,
      failed: 0
    }
  let result = await repo.save(data)
  logger.debug(`保存instance结果：${JSON.stringify(result)}`)
}

async function stopInstance(id) {
  const conn = await connection()
  const repo = conn.getRepository("Instance");
  let ended = new Date().getTime()
  let status = -1
  return await repo.update(id, {ended, status})
}

async function setBalance(balances) {
  //inMemoryData.balances.start = balances
  const conn = await connection()
  const repo = conn.getRepository("Balances");
  const data = {
    balances: balances ? JSON.stringify(balances): null,
    updated: new Date().getTime()
  }
  return await repo.save(data)
}

async function onDetail(instid, detail) {
  // inMemoryData.deals.push(deal)
  const conn = await connection()
  const repo = conn.getRepository(entities.Details.name);
  return await repo.save(Object.assign({...detail}, {instid, created: new Date().getTime()}))
}


async function getBalances(){
  const conn = await connection()
  const repo = conn.getRepository("Balances")
  return repo.find({order: { updated: 'DESC' }})
}



module.exports = {
  
  startInstance,
  stopInstance,
  setBalance,
  onDetail,
  getBalances,

}
