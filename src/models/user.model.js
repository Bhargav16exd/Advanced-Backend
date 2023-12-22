import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
    },
    avatar:{
        type:String ,
        required:true
    },
    coverImage:{
        type:String ,
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String
    }


},{timestamps:true})

userSchema.pre("save", async function (next){

    if(!this.isModified(this.password)) return next();

    this.password = await bcrypt.hash(this.password,10)
    next();
})

userSchema.methods.isPasswordValid = async function (password){
    return bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function (){

   return  jwt.sign({
        id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET , {ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = function (){
    return  jwt.sign({
        id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET , {REFRESH_TOKEN_EXPIRY})
}

export const User = mongoose.model("Usere", userSchema);