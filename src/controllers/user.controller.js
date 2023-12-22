import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"



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

    if([fullName,userName,email,password].some((field)=> field?.trim() ==="")){
       throw new ApiError(400,"All field are required")
    }

    const existedUser = await User.findOne({
         $or : [{ userName },{email}]
    })
    

    if(existedUser){
        throw new ApiError(400,"User Already Exists");
    }
    
    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    let coverImageLocalPath;
    
    if(req.files && Array.isArray(req.files.coverImage) && req.files.converImage.length > 0){
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
        avatar: avatarURL.url,
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

export {registerUser};