import mongoose from "mongoose";
import { DB_NAME } from "../const.js";

const connectDB = async () => {
    try {
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`DB Connected to : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Mongo DB connection Failed",error);
        process.exit(1);  
    }
}

export default connectDB;