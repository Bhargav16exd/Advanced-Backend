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
    avatarId:{
        type:String,
        required:true,
        unique:true
    },
    coverImage:{
        type:String ,
    },
    coverImageId:{
        type:String,
        unique:true
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
    
    if(!this.isModified("password")) return next(); 
     console.log("flag");
    this.password = await bcrypt.hash(this.password,10)

    next()
})

userSchema.methods.isPasswordValid = async function (password){
    return await bcrypt.compare( password , this.password)
}

userSchema.methods.generateAccessToken = function (){
    
   return  jwt.sign({
        _id:this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET , {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}


userSchema.methods.generateRefreshToken = function (){
    return  jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET , {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User", userSchema);