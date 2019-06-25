# stellar-trade-bot

Stellar trade bot is a bot for SDEX, including get profees from pathpayment and grid strategy.
This project is experimental and on developing.
Take all the risks by yourself.

## Run

- clone
```
git clone https://github.com/imloama/stellar-trade-bot
```

- install
```
npm install or yarn
```

- copy sample.json to config.json

- modify config.json
```
{
  // horizon url
  "horizon": "https://horizon.stellar.org",
  // your accout secret
  "secret": "SCVXJ4BCNEWWNZ6NT3NDXXBGLMD4WAYVUQ7YBLYEKZXTNPR43H3NJAMS",
  // min value to win
  "minGap":0.0001,
  // the trade pairs that bot will watch
  "loops":[
    [
      { "code": "XLM" },
      { "code": "FIDR", "issuer": "GBZQNUAGO4DZFWOHJ3PVXZKZ2LTSOVAMCTVM46OEMWNWTED4DFS3NAYH"},
      { "code": "DRA", "issuer": "GCJKSAQECBGSLPQWAU7ME4LVQVZ6IDCNUA5NVTPPCUWZWBN5UBFMXZ53"},
      { "code": "XLM" }
    ],
    [
      { "code": "XLM" },
      { "code": "XFF", "issuer": "GAZEX2USUBMMWFRZFS77VDJYXUFLXI4ZGFPWX6TBNZCSTEQWNLFZMXFF"},
      { "code": "XCN", "issuer": "GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY"},
      { "code": "XLM" }
    ]
  ],
  // interval seconds
  "intervalSeconds": 5
}
```

- run
```
npm run dev
```

## Roadmap
1. grid strategy
2. web ui
3. dashboard