const errorHandler = require("../utils/errorHandler");
const { catchAsyncErron } = require("./catchAsyncError");
const redis = require("../models/redis")
const generateTokens = require("../utils/generateTokens")

const updateAccesToken = catchAsyncErron( async (req, res, next) =>{
    const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!token){
        return next(new errorHandler("Unauthorized request",401))
    }

    // check user in cache
    const session = await redis.get(decoded._id); 
    if(!session){
       return next(new errorHandler("Could Not Refresh Token",400))
    }

    const user = JSON.parse(session);
    
})