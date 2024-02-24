const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const userModel = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"First name is required"],
        minLenght:[3,"Name should be atleast 3 character long"]
    },
    email:{
        type:String,
        unique:true,
        require:[true,"Email is required"],
    },
    contact:{
        type:String,
        required:[true,"Contact is required"],
        minLenght:[10,"Contact should be atleast 10 character long"],
        maxLenght:[10,"Contact must not exceed 10 character"]

    },
    avatar:{
        type:Object,
        default:{
            public_id:'',
            url:"https://plus.unsplash.com/premium_photo-1683584405772-ae58712b4172?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
        },
    },
    gender:{
        type:String,
        emum:["Male","Female","Others"],
    },
    password:{
        type:String,
        select:false,
    },
    courses:[
        {
            courseId:String
        }
    ],
    refreshToken:{
        type:String,
        default:"0",
        select:false
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    role:{
        type:String,
        emum:["user","admin"],
        default:'user'
    }

} ,{timestamps:true});

userModel.pre("save",async function(next){
    if(!this.isModified('password')){
        next();
    }
    this.password = await bcrypt.hash(this.password,10)
    next();
})

userModel.methods.comparePassword = async function (password){
    let match = await bcrypt.compare(password, this.password);
    return match
}

userModel.methods.generateAccesToken = function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn:process.env.ACCESS_TOKEN_EXPIRY});
}


userModel.methods.generateRefreashToken =  function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        contant:this.contact  
    },process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY});
}


const user = mongoose.model("user",userModel)

module.exports = user;