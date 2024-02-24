const redis = require("../models/redis");

const generateTokens = (user) =>{
    let accesToken = user.generateAccesToken(user);
    let refreshToken = user.generateRefreashToken(user)

    //upload session to redis
    redis.set(user._id,JSON.stringify(user));
    
    return {accesToken,refreshToken} ;
}

module.exports = generateTokens;