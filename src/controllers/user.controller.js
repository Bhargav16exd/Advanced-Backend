import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js";
import {uploadOnCloudinary , deleteResource} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) =>{

    try {
        
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave:false })
      return { accessToken , refreshToken };

    } catch (error) {

        throw new ApiError(500,"Something went wrong while generating access and refresh token");

    }

}
const registerUser = asyncHandler(async(req,res)=>{
   
    // Get user data from body
    //Verify if each field is present or not
    // if yes -> check if same user exist in system if yes -> Sent Error response  
    //                                              if no -> Save them into dB
    // if no -> Sent Error Response Enter Every field
    // create user oject - create entry in db
    // remove password and refresh token form field
    // check for user creation
    
    const {fullName , userName, email, password} = req.body;
   
    if(!fullName || !userName || !email || !password){
       throw new ApiError(400,"All field are required")
    }
    
   
    const existedUser = await User.findOne({
         $or : [{ userName },{email}]
    })
    

    if(existedUser){
        throw new ApiError(400,"User Already Exists");
    }
    
    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    let coverImageLocalPath;
    
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
         coverImageLocalPath = req.files?.coverImage[0].path;
    }
    
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar Is Required")
    }

    const avatarURL = await uploadOnCloudinary(avatarLocalPath);
    const coverImageURL = await uploadOnCloudinary(coverImageLocalPath);
    
    if(!avatarURL){
       throw new ApiError(400,"Avatar is Required"); 
    }

    const user = await User.create({
        fullName,
        email,
        userName : userName.toLowerCase(),
        password,
        coverImage:coverImageURL?.url || "",
        coverImageId:coverImageURL?.public_id || "",
        avatar: avatarURL.url,
        avatarId:avatarURL.public_id,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while creating User");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registerd Success")
    )

})

// user login

const loginUser = asyncHandler(async(req,res)=>{

    //collect email and passowrd from body 
    // check if each of them is present
    // if not then throw error
    // if yes then check for email entry in db if yes then bring password with it 
    // if not present in db throw error user dont exist 
    // generate refresh and accesss token 
    // send them in cookies

    const {email,password , userName} = req.body;
    
    if(!email && !userName){
        throw new ApiError(400,"username or email is required");
    }

    const user = await User.findOne({
        $or:[{email},{userName}]  
    })

    if(!user){
        throw new ApiError(400,"Given User not found");
    }

    const isPasswordCorrect = await user.isPasswordValid(password);


    if(!isPasswordCorrect){
        throw new ApiError(400,"Incorrect Password");
    }
    
    const { accessToken ,refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-refresToken -password");
     
    const options = {
        httpOnly:true,
        secure:true
    }

    return res.
    status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken", refreshToken , options)
    .json(
        new ApiResponse(200 ,{
            user: loggedInUser , accessToken , refreshToken 
        },
        "User Login Success"
        )
    )

})

const logoutUser = asyncHandler(async (req,res)=>{
   
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.
    status(200)
    .clearCookie("refrshToken",options)
    .clearCookie("accessToken",options)
    .json(
        new ApiResponse(200,{},"User Logged Out")
    )

})

const refreshTokenEndPoint = asyncHandler( async (req,res)=>{

   try {
     const refreshToken = req.cookies.refreshToken || req.body.refreshToken
     
     if(!refreshToken){
         throw new ApiError(400,"Unauthorized Request");
     }
     
     const incomingRefreshToken = jwt.verify(
         refreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
     console.log(incomingRefreshToken);
     const user = await User.findById(incomingRefreshToken?._id).select(" -password ")
     console.log(user);
     if(!user){
         throw new ApiError(400,"Unauthorized Request");
     }
     
     if( refreshToken != user?.refreshToken){
         throw new ApiError(400,"Refresh Token expired or used");
     }
 
     const options ={
         httpOnly:true,
         secured:true
     }
 
     // generating new tokens
 
     const newTokens = await generateAccessAndRefreshTokens(user._id);
     const newAccessToken = newTokens.accessToken;
     const newRefreshToken = newTokens.refreshToken;

     return res.
     status(200)
     .cookie("accessToken" , newAccessToken , options)
     .cookie("refreshToken", newRefreshToken , options)
     .json(
         new ApiResponse(200 ,{
             user:user , newAccessToken , newRefreshToken 
         },
         "User Login Success"
         )
     )
 
   } catch (error) {
    throw new ApiError(401,error);
   }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
   
    // get current pass and new pass 
    // check whether current pass is true 
    // then take new pass and confirm pass 
    // get user id with cookies 
    // update current user password 

    const {oldPassword , newPassword} = req.body;

    if(!oldPassword || !newPassword){
        throw new ApiError(400,"Every Field is Required")
    }

    const user = await User.findById(req.user._id);

    const passwordValidator = await user.isPasswordValid(oldPassword);

    if(!passwordValidator){
        throw new ApiError(400,"Invalid Password");
    }
    
    user.password = newPassword 
    await user.save({validateBeforeSave:false})
 
    return res
    .status(200)
    .json(
        new ApiResponse(200 , {} , "Password change success")
    )
})

const getCurrentUser = asyncHandler(async(req,res)=>{

    const user = req.user;

    if(!user){
        new ApiError(500,"Internal Sever Error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 , user, "User Fetch Success")
    )
})

const updateAccountDetails = asyncHandler(async(req,res)=>{

    const {fullName , email } = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
       
        $set:{
           fullName,
           email 
        }

    },
    {new:true}).select("-password")

    if(!user){
        throw new ApiError(500, "Internal Server Error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"User Update Success")
    )
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
     

    const oldAvatarId = await User.findById(req.user._id).select("avatarId")
    const avatarLocalPath = req.file?.path
     
    if(!avatarLocalPath){
        throw new ApiError(400,"Kindly Upload Avatar")
    }

    const avatarURL  = await uploadOnCloudinary(avatarLocalPath)
   
    if(!avatarURL){
        throw new ApiError(500,"Internal Server Error")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatarURL.url,
                avatarId:avatarURL.public_id
            }
        },
        {new:true}
    ).select("-password")
    
    if(!user){
        throw new ApiError(500, "Internal Server Error")
    }

    
    await deleteResource(oldAvatarId)
     return res
     
    .status(200)
    .json(
        new ApiResponse(200,user,"User Avatar Update Success")
    )

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{

     const oldCoverImageId = await User.findOne(req.user?._id)

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Kindly Upload Cover Image")
    }

    const coverImageURL  = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImageURL){
        throw new ApiError(500,"Internal Server Error")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImageURL.url,
                coverImageId:coverImageURL.public_id
            }
        },
        {new:true}
    ).select("-password")
    
    if(!user){
        throw new ApiError(500, "Internal Server Error")
    }

    await deleteResource(oldCoverImageId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"User Cover Update Success")
    )

})

const  getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {userName} = req.params

    if(!userName){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:
            {  userName:userName?.toLowerCase()}
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subcribers",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                     $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                       if:{$in:[req.user?._id,"$subscribers.subscriber"]} ,
                       then:true,
                       else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1
            }
        }
    ])

     if(!channel){
        throw new ApiError(404,"Channel Does not exist")
     }

     return res
     .status(200)
     .json(
        new ApiResponse(200, channel[0], " User channel fetch success")
     )

})
export {
    registerUser , 
    loginUser , 
    logoutUser,
    refreshTokenEndPoint , 
    changeCurrentPassword , 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}