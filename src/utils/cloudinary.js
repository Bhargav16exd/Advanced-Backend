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
        console.log("File Upload success on Cloudinary",response);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the file from local system as upload on cloud failed
        return null;
    }
}

export default uploadOnCloudinary;