const express = require('express');
const multer = require('multer');
// const uploadController = require('../controllers/uploadController');

const router = express.Router();


const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, "../images");

const usercontroller = require("../controller/userController")
const Middleware = require("../middleware/Autentication")
let count = 1;
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, __dirname + '/../images');
  },
  filename: function (req, file, callback) {
    callback(null, `${count++}_${Date.now()}.${file.originalname.split(".")[1]}`);
  }
});
const upload = multer({
  storage: storage,
  limits: {
    // Limit the number of files uploaded to 10
    files: 10
  }
});

function checkImageLimit(req, res, next) {
  // const dirPath = __dirname + '/../images';

  fs.readdir(dirPath, (err, images) => {
    if (err) {
      console.error('Error reading images directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Filter only image files (you can adjust the image file extensions as needed)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const imageFiles = images.filter((file) =>
      imageExtensions.includes(path.extname(file).toLowerCase())
    );

    if (imageFiles.length >= 10) {
      return res.status(400).send({
        status: false,
        message: 'You have already uploaded the maximum allowed number of images.',
      });
    }

    next();
  });
}

router.post("/upload", upload.array("file"), usercontroller.uploadImage);

// Your route for uploading images
router.post("/Adminupload", Middleware.Auth, upload.array("file"), (req, res, next) => {
  // Continue with the ImagesList controller
  usercontroller.ImagesList(req, res);
});
router.get("/", Middleware.Auth, usercontroller.getImages);
router.get("/getAdminImagesList", usercontroller.getAdminImagesList);
router.delete("/deleteImage", Middleware.Auth, usercontroller.deleteImageController);    
router.get('/tokenStatus', Middleware.Auth, Middleware.tokenStatus)

//USER API
router.post('/registerAdmin', usercontroller.registerAdmin)
router.post('/register', usercontroller.registerUser)
router.post('/kycOldUpdate', Middleware.Auth, usercontroller.kycOldUpdate)
router.post('/kycUpdate', Middleware.Auth, usercontroller.kycUpdate)
router.post('/AdminUpdate', Middleware.Auth, usercontroller.AdminUpdate)
router.post('/insertBank', Middleware.Auth,  usercontroller.insertBankDetails)
router.post('/getBankDetails', Middleware.Auth, usercontroller.getBankDetails) //
router.delete('/deleteAccountNo', Middleware.Auth, usercontroller.deleteBankDetailsByAccountNo) //
router.post('/adminGetBankDetails', Middleware.Auth, usercontroller.adminGetBankDetails)     //
router.post('/getDetailsByAdmin', Middleware.Auth, usercontroller.getDetailsByAdmin)  //
router.post('/adminBusinees', Middleware.Auth,  usercontroller.adminBusinees)
router.post('/getadminbusinessCount', Middleware.Auth,  usercontroller.getadminbusinessCount)
router.post('/adminGetbusinessCount', Middleware.Auth, usercontroller.adminGetbusinessCount)
router.delete('/DeleteReport', Middleware.Auth, usercontroller.adminDeleteBusinessReport)
router.post('/loginUser', usercontroller.loginUser)
router.post('/loginWithoutOTP', usercontroller.loginwithoutOTP)
router.post('/login',  usercontroller.login)
router.post('/sendUserOTP', usercontroller.sendUserOTP)
router.post('/verifyOTP', usercontroller.verifyOTP)
router.put('/updatePassword', usercontroller.updatePassword)
router.get('/logout', Middleware.Auth, Middleware.logout)
router.post('/adharvarification', Middleware.Auth, usercontroller.adharvarification)
router.post('/validateaadhaarotp', Middleware.Auth, usercontroller.validateaadhaarotp)
router.post('/panverification', Middleware.Auth, usercontroller.panNumberrverification)
router.post('/fetchList', Middleware.Auth, usercontroller.fetchUserReportingHierarchy) //
router.get('/AdminfetchList',  Middleware.Auth, usercontroller.adminReportingHierarchy ) //
router.post('/sendEmail', usercontroller.sendEmail)
// router.get('/getOTP',usercontroller.sendOTP)    
router.post('/user', Middleware.Auth, usercontroller.getUser) //
router.put('/updateAmount', Middleware.Auth, usercontroller.UpdateUser)
router.put('/updateUserAmount', Middleware.Auth, usercontroller.updateUserAmount)
router.delete("/user/:userId", usercontroller.deleteUser)



//client
router.post('/clientRegister', Middleware.Auth, usercontroller.clientDetails)
router.post('/getDetailsBySells', Middleware.Auth, usercontroller.getDetailsBySells)
router.get('/getAllSells', Middleware.Auth, usercontroller.getAllDetailsBySells)
router.put('/updateClientDetails', Middleware.Auth, usercontroller.updateClientDetails)

module.exports = router;          