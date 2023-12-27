import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
      
cloudinary.config({ 
  cloud_name: process.env.CLOUDNAME, 
  api_key: process.env.CLOUDINARYAPIKEY, 
  api_secret: process.env.CLOUDINARYAPISECRETKEY  
});


const uploadOnCloudinary = async (localFilePath)=>{

    try {
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        fs.unlinkSync(localFilePath) // removing file once uploaded on Cloud 
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the file from local system as upload on cloud failed
        return null;
    }
}

const deleteResource = async (publicId)=>{
    try {
        
        if(!imageURL) return null ;
        await cloudinary.uploader.destroy(publicId)

    } catch (error) {
        return null
    }
}

export  {uploadOnCloudinary,deleteResource};