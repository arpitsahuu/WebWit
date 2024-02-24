const {catchAsyncErron} = require("../middlewares/catchAsyncError");
const jwt = require("jsonwebtoken");
const redis = require("../models/redis")
const errorHandler = require("../utils/errorHandler");

// Authenticate the User 
const isAuthenticated = catchAsyncErron(async(req,res,next) =>{
    try {
        const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Bearer ", "");
       
        // Ckeck if Token Exit in req or header
        if(!token){
            return next(new errorHandler("Unauthorized request",401))
        }
    
        // decode JWT Token 
        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

    
        // check user in cache
        const user = await redis.get(decoded._id);

        
        if(!user){
            return next(new errorHandler("Invalid Access Token",400))
        }
    
        req.user = await JSON.parse(user);
        next();
    } catch (error) {
        next(new errorHandler(error.message || "Invalid Access Token"));
    }
})

module.exports = isAuthenticated;