const express = require("express");
const router = express.Router();
const { userRegistration,
     userActivation, 
     userLogin, 
     userLongOut, 
     updateUserInfo
    } = require("../controllers/userController");
const isAuthenticated = require("../middlewares/auth");

router.get("/",(req,res)=>{
    res.send("welcomeuser")
})

router.post("/registration",userRegistration);

router.post("/activate/user",userActivation);

router.post("/login",userLogin);

router.get("/logout",isAuthenticated, userLongOut);

router.put("/user",isAuthenticated,updateUserInfo)



module.exports = router;