
const INSTANCE_TYPE_PATHPAYMENT = 1
const INSTANCE_TYPE_GRID = 2

/**
 * arbitrage instance
 */
const Instance = {
  name: "Instance",
  columns: {
      id: {
          primary: true,
          type: "int",
          generated: true
      },
      name: {
          type: "varchar"
      },
      // instance type: 1 pathpayment, 2 grid
      insttype:{ type: 'int' },
      // 运行实例的配置信息
      config:{type: 'text'},
      // 0 running, -1 stopped
      status: { type:'int'},
      // started time 运行启动时间
      started: {type: 'int', nullable: true},
      // ended time 停止时间
      ended: {type: 'int', nullable: true},
      // win 盈利
      win: {type: 'numeric', nullable: true},
      // chance number 机会次数
      chance: {type: 'int', nullable: true },
      // failed number, 失败次数
      failed: {type: 'int', nullable: true}
    }
}

/**
 * 
 */
const Details = {
  name: "Details",
  columns: {
      id: {
          primary: true,
          type: "int",
          generated: true
      },
      // transaction hash
      hash: {
        type: 'varchar'
      },
      created:{
        type: 'varchar'
      },
      // is transaction successed 
      successed:{
        type: 'boolean', default: false, nullable: true
      },
      baseAssetType: { type: 'varchar'},
      baseAssetCode: { type: 'varchar',  nullable: true},
      baseAssetIssuer: { type: 'varchar',  nullable: true},
      counterAssetType: { type: 'varchar' },
      counterAssetCode: { type: 'varchar',  nullable: true},
      counterAssetIssuer: { type: 'varchar',  nullable: true},
      
      baseAmount: { type: 'varchar' },
      counterAmount: { type: 'varchar'},
      offerid: { type: 'varchar',  nullable: true},
      // 0 sell, 1 buy
      side: { type: 'int',  nullable: true},
      // win
      win: {type: 'numeric' , nullable: true}

    },
    relations: {
      instid: {
        target: 'Instance',
        type: 'many-to-one',
        joinTable: true,
        cascade: true
      }
    }
}


// 余额
const Balances = {
  name: "Balances",
  columns: {
      id: {
          primary: true,
          type: "int",
          generated: true
      },
      // 余额，采用json 数组格式保存的
      balances:{type: 'varchar', nullable: true},
      //更新时间 
      updated: {type: 'int'},
    }
}


module.exports = {
  Instance,
  Details,
  Balances,

  INSTANCE_TYPE_GRID,
  INSTANCE_TYPE_PATHPAYMENT
}