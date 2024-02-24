const env = require("dotenv");
env.config({ path: "./.env" });
const {catchAsyncErron} = require("../middlewares/catchAsyncError");
const errorHandler = require("../utils/errorHandler");
const User = require("../models/userModel")
const sendmail = require("../utils/sendmail")
const activationToken= require("../utils/activationToken")
const jwt = require("jsonwebtoken");
const generateTokens = require("../utils/generateTokens");
const redis  = require("../models/redis");
const cloudinary = require("cloudinary").v2

exports.homepage = catchAsyncErron( (req,res,next) =>{
    
})

exports.userRegistration = catchAsyncErron( async (req,res,next) =>{
    const {name,email,password,contact} = req.body;

    if(!name || !email || !password || !contact) return next(new errorHandler(`fill all deatils`));

    const isEmailExit = await User.findOne({email:email});
    if(isEmailExit) return next(new errorHandler('User With This Email Address Already Exits'));

    const ActivationCode = Math.floor(1000 + Math.random() * 9000);

    const user = {
        name,
        email,
        contact,
        password
    }

    const data = {name:name,activationCode:ActivationCode}
    
    try {
        await sendmail(res,next,email,"Verification code","activationMail.ejs",data)
        console.log("extracted");
        let token = await activationToken(user,ActivationCode);
        let options = {
            httpOnly:true,
            secure:true
        }
        res.status(200).cookie("token",token,options).json({
            succcess: true,
            message:"successfully send mail pleas check your Mail",
        })
    } 
    catch (error) {
        return next(new errorHandler(error.message,400));
    }

})

exports.userActivation = catchAsyncErron( async (req,res,next) =>{
    let {activationCode} = req.body;
    if(!activationCode) return next(new errorHandler("Provide Activation Code"));

    const { token } = req.cookies;
    const {user,ActivationCode} = await jwt.verify(token,process.env.REFRESH_TOKEN_SECRET);

    const isEmailExit = await User.findOne({email:user.email});
    if(isEmailExit) return next(new errorHandler('User With This Email Address Already Exits'));

    if(activationCode != ActivationCode) return next(new errorHandler("Wrong Activation Code"))

    let {name,email,password,contact} = user;

    const newUser = await User.create({
        name,
        email,
        password,
        contact,
        isVerified:true,
    });
    await newUser.save();

    res.status(201).json({
        succcess: true,
        message:"successfully register",
    })

})

exports.userLogin = catchAsyncErron( async (req,res,next) =>{
    const {email,password} = req.body;
    if(!email || !password) return next(new errorHandler("Pleas fill all details"));

    const user = await User.findOne({email:email}).select("+password").exec();
    if(!user) return next( new errorHandler("User Not Found",404))

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new errorHandler("Wrong Credientials", 500));

    const {accesToken,refreshToken} = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();
    user.password = "";

    await redis.set(user._id, JSON.stringify(user));

    const options = {
        httpOnly:true,
        secure:true
    }

    res.status(200).
    cookie("accesToken",accesToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json({
        succcess: true,
        message:"successfully login",
        user:user,
        accesToken:accesToken,
        refreshToken:refreshToken
    })
})


exports.userLongOut = catchAsyncErron(async (req,res,next) =>{
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        });

    await redis.del(req.user._id);
    const options = {
        httpOnly:true,
        secure:true
    }    
    res.clearCookie("accesToken",options)
    .clearCookie("refreshToken",options)
    .json({
        succcess: true,
        message:"successfully logout",
    })
    
})


exports.refresh = catchAsyncErron( async(req, res, next) =>{


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

exports.userInfo = catchAsyncErron(async (req, res, next)=>{
    const user = redis.get(req.user._id);
    if(!user){
        const user = await User.findById(req.user._id);
        await redis.set(user._id,user);
        res.status(200).json({
            succcess: true,
            user:user
        })
    } 
    res.status(200).json({
        succcess: true,
        user:user
    })

})

exports.socialAuth = catchAsyncErron(async (req, res, next)=>{
    try {
        const {email, name, avatar} = req.body;
        const user = await User.findOne({email:email});

        if(!user){
            const newuser = await User.create({email, name, avatar});
            const {accesToken,refreshToken} = generateTokens(newuser);
            const options = {
                httpOnly:true,
                secure:true
            }
            res.status(200)
            .cookie("accesToken",accesToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json({
              succcess: true,
              message:"successfully login",
              user:newuser,
              accesToken:accesToken,
              refreshToken:refreshToken
            })
        } else{
            const {accesToken,refreshToken} = generateTokens(user);
            const options = {
                httpOnly:true,
                secure:true
            }
            res.status(200)
            .cookie("accesToken",accesToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json({
              succcess: true,
              message:"successfully login",
              user:user,
              accesToken:accesToken,
              refreshToken:refreshToken
            })
        }
    } catch (error) {
        return next(new errorHandler(error.message,400))
    }
})

exports.updateUserInfo = catchAsyncErron(async (req, res, next)=>{
    const {email, name, contact} = req.body;
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if(email && user){
        const isEmailExit = await User.findOne({email:email});
        if(isEmailExit){
            return next(new errorHandler("User With This Email Addres already Exit") )
        }
        user.email = email
    }

    if(name && user){
        user.name = name
    }

    if(contact && user){
        user.contact = contact;
    }

    const {accesToken,refreshToken} = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    await redis.set(user._id,JSON.stringify(user));
    const options = {
        httpOnly:true,
        secure:true
    }
    res.status(200)
    .cookie("accesToken",accesToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json({
        succcess: true,
        message:"successfully Updata",
        user:user,
        accesToken:accesToken,
        refreshToken:refreshToken
    })
})

exports.updateUserPassword = catchAsyncErron(async (req, res, next)=>{
    const {password,oldPassword} = req.body;

    if(!password || oldPassword){
        return next(new errorHandler("Missing password",400))
    }
    const user = await User.findById(req.user._id).select("+password");
    
    const isPasswordMatch = user.comparePassword(oldPassword);
    if(!isPasswordMatch){
        return next(new errorHandler("Wrong Credientials", 500))
    }
    user.password = password;
    await user.save();
    await redis.set(user._id,JSON.stringify(user));

    res.status(200)
    .json({
        succcess: true,
        message:"successfully Change Password",
    })
})

exports.userAvatar = catchAsyncErron(async (req, res, next)=>{
    const avatar = req.body.avater;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if(user.avatar.public_id){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    }
    const myavatar = await cloudinary.v2.uploader.upload(avatar,{
        folder: "avaters"
    })
    user.avatar.public_id = myavatar.public_id;
    user.avatar.url = myavatar.secure_url;
    await user.save()
    await redis.set(user._id,JSON.stringify(user));
    res.status(200)
    .json({
        succcess: true,
        message:"successfully upload Avatar`",
        user:user
    })
})