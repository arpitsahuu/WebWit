const Redis = require('ioredis')
const { model } = require('mongoose')

const redisClient = () =>{
    if(process.env.REDIS_URL){
        console.log("redis connected")
        return process.env.REDIS_URL
    }
    throw new Error('Redis Connection failed')
}

let redis = new Redis(redisClient());

module.exports = redis;