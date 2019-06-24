const request = require('request');

const ASSETS_URL = `https://api.stellar.expert/explorer/public/asset/?sort=rating&limit=200`

function assets(){
  return new Promise((resolve,reject) => {
    request(ASSETS_URL, (err, response, body) => {
      if(err){
        reject(err)
      }else{
        resolve(body)
      }
    })
  })
}


module.exports = {
  assets
}