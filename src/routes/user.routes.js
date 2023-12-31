import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js  ";
import {upload} from "../middlewares/multer.middleware.js"
import { changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, logoutUser, 
    refreshTokenEndPoint, 
    updateAccountDetails, 
    updateUserAvatar,
    updateUserCoverImage } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)
    
router.route("/login").post(loginUser);
router.route("/refreshTokenAPI").post(refreshTokenEndPoint);


// secured Routes

router.route("/logout").post(verifyJWT,logoutUser);
router.route("/changepassAPI").post(verifyJWT,changeCurrentPassword);
router.route("/getuser").post(verifyJWT,getCurrentUser);
router.route("/updateUserAPI").post(verifyJWT,updateAccountDetails);
router.route("/updateUserAvatarAPI").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar);

router.route("/updateUserCoverImageAPI").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage);

router.route("/c/:userName",verifyJWT,getUserChannelProfile);
router.route("/history",verifyJWT,getWatchHistory)    
    
  


export default router;