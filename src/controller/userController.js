const mongoUtil = require("../db/conn.js");
// const mongoUtils = require("../db/util.js");
// const user = require("../model/userModel.js")
const Rsuser = require("../model/regUser.js")
const Ruser = require("../model/registerUser.js")
const clientUser = require("../model/clientData.js")
const bankdetails = require("../model/userBankDetails.js")
const adminImages = require("../model/adminImage.js")
const business = require("../model/busineesCount.js")

const otpDetails = require("../model/otpModel.js")
let validator = require('../controller/validateController')
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const { error } = require("console");
const { reject } = require("bcrypt/promises.js");
const nodemailer = require('nodemailer');
const moment = require('moment');
const mongoose = require('mongoose');
const { resolve } = require("path");
const ObjectId = mongoose.Types.ObjectId;
let axios = require('axios');
const fs = require('fs');
const path = require('path');
const dirPath = path.join(__dirname, "../images");



//////////images portion////////////////////////////////////

const uploadImage = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const { email } = req.body

  console.log("email", email)

  // function validEmail(r) {
  //   return (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(r))
  // }

  // if (!validEmail(email.trim())) {
  //   return res.status(400).send({ status: false, msg: "Please enter a valid email" })
  // }


  const uploadedFiles = req.files.map(file => {
    // originalName: file.originalname,
    filename = `https://api.swarnbhumibuilders.com/images/${file.filename}`;

    return filename;

  });

  // console.log(email)
  const query = {
    $or: [{ email }],
  };

  const isUserFound = await Ruser.findOne(query);

  console.log("isUserFound", isUserFound)

  if (isUserFound) {
    // If the user is found based on email or userUniqueId, update the personal details.
    var updatedData = {
      panCardImage: uploadedFiles[0] || null,
      adharCardFrontImage: uploadedFiles[1] || null,
      adharCardBackImage: uploadedFiles[2] || null,
      profileImage: uploadedFiles[3] || null,
    };

    console.log("adharImg", updatedData)
    // Update the user's personal details in the database
    await Ruser.updateMany(query, updatedData);




    res.json({ msg: "File(s) uploaded successfully", uploadedFiles });
  };
}

const ImagesList = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  try {
    const { email } = req.body;

      // Retrieve the user from the database
      const user = await Ruser.findOne({ email: email });

      if (!user) {
        return res
          .status(404)
          .send({ status: false, msg: 'User not found with the provided email.' });
      }

      const user1 = await adminImages.findOne({ email: email });

      if (!user1) {
        // Create a new user with the provided email and uploaded images
        const newUser = {
          email: email,
          uploadedImages: req.files.map((file, index) => {
            const filename = file.filename; // Adding the index as a unique ID
            return filename;
          }),
        };

        // Insert the new user into the database
        await adminImages.create(newUser);

        return res.status(200).send({ status: true, msg: 'File(s) uploaded successfully for the new user.' });
      }

      // Calculate how many more images the user can upload
      const remainingSlots = 10 - user1.uploadedImages.length;

      // If the user tries to upload more images than the remaining slots, return an error
      if (req.files.length > remainingSlots) {
        return res.status(400).send({
          status: false,
          msg: `You can upload ${remainingSlots} more image(s). Delete some images before uploading more.`,
        });
      }

      const uploadedFiles = req.files.map((file, index) => {
        const filename = file.filename; // Adding the index as a unique ID
        return filename;
      });

      // Add the newly uploaded images to the existing array
      user1.uploadedImages = user1.uploadedImages.concat(uploadedFiles);

      // Update the user's uploaded images in the database
      await adminImages.updateOne(
        { email: email },
        { $set: { uploadedImages: user1.uploadedImages } },
        { upsert: true } // Use upsert: true to insert the document if it doesn't exist
      );

      return res.status(200).send({ status: true, msg: 'File(s) uploaded successfully ' });
    
    
  } catch (err) {
    console.error('Error occurred:', err);
    return res.status(500).send('Internal Server Error');
  }
};

const getAdminImagesList = async function (req, res) {
  try {
    const findUser = await adminImages.find({});

    if (!findUser || findUser.length === 0) {
      return res.status(404).send({ status: false, msg: 'User not found.' });
    }

    const uploadedImages = findUser.map(user => user.uploadedImages).flat();

    // Create URLs for the images by concatenating them with the base URL
    const baseImageUrl = 'https://api.swarnbhumibuilders.com/images/';
    const imageUrls = uploadedImages.map(imageName => `${baseImageUrl}${imageName}`);

    res.status(200).send({ status: true, msg: 'User Profile details', data: imageUrls });
    
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
}

const getImages = (req, res) => {
  fs.readdir(dirPath, (err, images) => {
    if (err) {
      // console.error("Error reading images directory:", err);
      return res.status(500).send("Internal Server Error");
    }
    return res.send(images);
  });
};

const deleteImage = async (email, filename) => {
  try {

      await adminImages.updateOne(
        { email: email },
        { $pull: { uploadedImages: filename } }
      );

    // Remove image from directory
    const imagePath = path.join(dirPath, filename);
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error('Error deleting image:', err);
        throw err;
      }
      console.log('Image deleted successfully from directory:', filename);
    });
  } catch (err) {
    console.error('Error occurred during image deletion:', err);
    throw err;
  }
};

const deleteImageController = async (req, res) => {
  const { email, imageName } = req.body;

  if (!email || !imageName) {
    return res.status(400).send('Missing email or image name in the request body.');
  }

  try {
    // Call the delete image function
    await deleteImage(email, imageName);
    return res.status(200).send({ status: true, msg: 'Image deleted successfully.' });
  } catch (err) {
    console.error('Error occurred during image deletion:', err);
    return res.status(500).send('Internal Server Error');
  }
};

/////////User function/////////////////////////////////////////////

const generatedata = async function (password) {
  return new Promise(async function executor(resolve, reject) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';

    for (let i = 0; i < 7; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      referralCode += characters.charAt(randomIndex);
    }

    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    // console.log("password", password, referralCode);
    let dataas = { password, referralCode };
    resolve(dataas);
  }).catch((err) => {
    // console.log(err);
    return reject(err);
  });
};

function generateOTP() {
  // Generate a 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Return the OTP
  return otp.toString();
}

async function sendOTP(email) {
  return new Promise(async (resolve, reject) => {

    
    // console.log(email)
    const otp = generateOTP();
    const otpGenerated = new Date();//moment().add(1, 'minutes'); // Set OTP expiry to 10 minutes from now
    // let checkUser = db.collection("registerprofiles");
    // let otpdb = db.collection("otp");

    let element = await otpDetails.findOne({
      email: email,
    });
    // console.log("element", element)
    if (element == null) {
      var data = { email: email, otp: otp, otpGenerated: otpGenerated };
      await otpDetails.create(data);
      // resolve("done")
    } else {

      await otpDetails.updateOne(
        { email: email },
        { $set: { otp: otp, otpGenerated: otpGenerated } }
      );

      // console.log(results)

    }

    try {
      // await users.save();
        const isEmailAlreadyUsed = await Ruser.findOne({ email });

      let transporter = nodemailer.createTransport({
        host: "smtppro.zoho.in",
        secure: true,
        port: 465,
        //secure: false, // true for 465, false for other ports
        auth: {
          user: "no-reply@swarnbhumibuilders.com", // generated ethereal user
          pass: "Swarn@@6458", // generated ethereal password
        },
      });
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: 'no-reply@swarnbhumibuilders.com', // sender address
        to: `${email}`, // list of receivers
        subject: "Getting referralCode", // Subject line
        text: `${otp} use This for Login`, // plain text body
         html: `<!DOCTYPE html>
         <html>
         
         <head>
             <meta charset="utf-8">
             <title>Swarn Bhumi</title>
             <style>
                 body {
                     background-color: #faf2e4;
                     margin: 0;
                     font-family: sans-serif;
                     display: flex;
                     justify-content: center;
                     align-items: center;
                     min-height: 100vh;
                 }
         
                 .container {
                     padding: 20px;
                     background-color: white;
                     max-width: 600px;
                     text-align: center;
                     box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
                     position: relative;
                 }
         
                 h1 {
                     font-family: serif;
                     font-weight: normal;
                     text-transform: uppercase;
                     margin-top: 0;
                 }
         
                 h2 {
                     color: #d1633c;
                     font-size: 1em;
                 }
         
                 img {
                     max-width: 90%;
                     height: 70px;
                     display: block;
                     margin: 0 auto; /* Center horizontally */
                 }
         
                 .welcome-message {
                     position: absolute;
                     top: 20px;
                     left: 20px;
                     font-size: 1.5em;
                     text-align: left;
                 }
         
                 .content {
                     margin-top: 20px;
                     text-align: left;
                     font-size: 1em;
                 }
         
                 .otp-box {
                  background-color: #57b1dc;
                  color: white;
                  padding-top: 10px;
                  padding-bottom: 10px;
                  padding-right: 35px;
                  padding-left: 35px;
                  display: inline-block;
                  font-size: 25px;
                  border-radius: 30px;
                  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.3);
                  text-align: center;
              }
         
                 .image-container {
                     text-align: center; /* Center content vertically and horizontally */
                     padding: 20px 0; /* Add some vertical spacing */
                 }
         
                 .contents {
                     margin-top: 20px;
                     text-align: center;
                     font-size: 1em;
                 }
         
                 .name {
                     color: #0066cc;
                     font-weight: bold;
                     font-size: 1.2em;
                 }
             </style>
         </head>
         
         <body>
             <div class="container">
                 <div class="welcome-message">
                 </div>
         
                 <div class="image-container">
                     <img src="https://api.swarnbhumibuilders.com/images/1_1692769736895.jpg" alt="Swarn Bhumi Logo">
                 </div>
                 <div class="content">
                     <p>Hi, <span class="name">${isEmailAlreadyUsed.Name}</span></p>
                     <div class="contents">
                         <p>Thank you for choosing Swarn Bhumi. Use the following OTP to complete your Sign Up procedures.
                             OTP is valid for 10 minutes</p>
                         <div class="otp-box">${otp}</div>
                     </div>
                     <p>Regards,</p>
                     <p>Swarn Bhumi Builders</p>
                 </div>
         
         
             </div>
         </body>
         
         </html>`,
      });
      // console.log("msg sent: %s", info.messageId);
      // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // res.status(200).send({ status: true, msg: `email sent` });

     resolve({ otp: otp });
    } catch (error) {
      if (error.code === 11000) {
        reject(new Error('Failed to send OTP. Please try again.'));
      }
      reject(error);
    }
  });







  // if (email) {
  //   let users = await Ruser.findOne({ email });

  //   if (users) {
  //     const otp = generateOTP();

  //     // console.log(otp);

  //     // Set the OTP and OTP expiry in the database
  //     const otpExpiry = moment().add(1, 'minutes'); // Set OTP expiry to 10 minutes from now
  //     users.otp = otp;
  //     users.otpExpiry = otpExpiry;

  //     try {
  //       await users.save();

  //       let transporter = nodemailer.createTransport({
  //         host: "smtp.ethereal.email",
  //         port: 587,
  //         secure: false, // true for 465, false for other ports
  //         auth: {
  //           user: "abelardo.labadie10@ethereal.email", // generated ethereal user
  //           pass: "Tnyg7kxHM1D7926d8t", // generated ethereal password
  //         },
  //       });
  //       // send mail with defined transport object
  //       let info = await transporter.sendMail({
  //         from: 'saurabh7071468@gmail.com', // sender address
  //         to: 'recipient@example.com', // list of receivers
  //         subject: "Getting referralCode Ã¢Å“â€", // Subject line
  //         text: `${otp} This refferal Code`, // plain text body
  //         // html: `Use This refferal Code`, // html body
  //       });
  //       console.log("msg sent: %s", info.messageId);
  //       console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  //       // res.status(200).send({ status: true, msg: `email sent` });



  //     } catch (error) {
  //       if (error.code === 11000) {
  //         // Handle the duplicate key error
  //         console.error('Duplicate OTP:', error);
  //         res.status(400).send({ status: false, msg: "Failed to send OTP. Please try again." });
  //         return;
  //       }
  //       throw error;
  //     }
  //     res = { otp }
  //     // TODO: Send the OTP to the user's email (using nodemailer or your preferred email sending library)
  //     resolve(res)
  //     //  res.status(200).send({ status: true, msg: "OTP sent successfully" });
  //   } else {
  //     let rej = { status: false, msg: "User not found" }
  //     reject(rej)
  //     //res.status(400).send({ status: false, msg: "User not found" });
  //   }
  // } else {
  //   let res = { status: false, msg: "Email is required" }
  //   resolve(res)
  //   // res.status(400).send({ status: false, msg: "Email is required" });

  // }
  // })
};



///////////////USER APIS/////////////////////////////////////////////

const registerUser = async function (req, res) {
    try {
      let data = req.body
      // let files = req.files;
      if (!validator.isValidRequestBody(data)) {
        res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
        return
      }
  
      const { isAdmin, Name, childReferralCode, email, password, kycStatus } = req.body
  
  
      if (!validator.isValid(Name)) {
        return res.status(400).send({ status: false, msg: ' Please provide name' })
      }
  
      if (!validator.isValid(childReferralCode)) {
        return res.status(400).send({ status: false, msg: ' Please provide childReferralCode' })
      }
  
      const isEmailAlreadyUsed = await Ruser.findOne({ email });
  
      if (isEmailAlreadyUsed) {
        return res.status(400).send({ status: false, msg: `${email} email address is already registered` })
      }
  
      if (!validator.isValid(password)) {
        return res.status(400).send({ status: false, msg: ' Please provide password' })
      }
      if (!(password.trim().length > 7 && password.trim().length < 16)) {
        return res.status(400).send({ status: false, msg: ' Please provide valid password' })
      }
  
      const userDetails = await Ruser.find().exec();
  
      if (childReferralCode == 0) {
        res.status(404).send({ status: false, msg: `childReferralCode code you have to filled` });
        // const otpExpiryTime = moment().add(1, 'minutes'); // Set the OTP expiry time to 10 minutes from now
        // //const otp = generateOTP();
        // generatedata(password).then(async (gdata) => {
        //   var datas = { userUniqueId: 1,firstName: firstName, lastName: lastName, referralCode: gdata.referralCode, childReferralCode: "0", email: email, password: gdata.password, otp: "0", otpExpiry: otpExpiryTime.toISOString() };
        //   await Ruser.create(datas);
        //   //await fetchUserReportingHierarchy();
        // res.status(200).send({ status: true, msg: `success` });
        // });
      } else {
        let foundUser = false;
  
        for (let index = 0; index < userDetails.length; index++) {
          const element = userDetails[index];
          if (element.referralCode === childReferralCode) {
            foundUser = true;
            // const otpExpiryTime = moment().add(1, 'minutes');
            await generatedata(password).then(async (gdata) => {
              let userIdCount = userDetails.length += 1;
              const reff = await Ruser.findOne({ referralCode: childReferralCode });
              let newLevel =  reff.level + 1;
  
              var datas = { isAdmin: isAdmin, userUniqueId: `SB000${userIdCount}`, Name: Name,level: newLevel, referralCode: gdata.referralCode, childReferralCode, email: email, password: gdata.password, kycStatus: kycStatus };
              // count++;
              await Ruser.create(datas);
            });
            break;
          }
        }
  
        if (foundUser) {
          res.status(200).send({ status: true, msg: `success` });
        } else {
          res.status(404).send({ status: false, msg: `referral code not found` });
        }
      }
  
    } catch (err) {
      // console.log(err);
      res.status(500).send({ status: false, msg: err.msg });
    }
  };

const loginUser = async function (req, res) {
  try {
    const requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, msg: 'value in request body is required' });
      return;
    }

    const { email, password } = requestBody;

    if (email && password) {

      let User = await Ruser.findOne({ email: email })

      if (!User) {
        return res.status(400).send({ status: false, msg: "Email does not exist" });
      }

      // console.log("User", User)
      let userID = new mongoose.Types.ObjectId(User._id)
      const passvalid = await bcrypt.compare(password, User.password)

      // console.log(User.password)
      if (passvalid) {
        // const userIDs = User.email;
        // const Token = jwt.sign({
        //   email: userIDs,
        //   iat: Math.floor(Date.now() / 1000),
        //   exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60 // Token expiration time (10 hours)
        // }, "Group9");
        // res.header('x-api-key', Token)

        await sendOTP(email).then(async (re) => {
          let otps = await re.otp;
          res.status(200).send({ status: true, msg: "User login successfull", data: { userId: userID, OTP: otps } })
        }).catch((err) => {
          res.status(400).send({ status: false, msg: "otp not sent" })
        })


      } else {
        res.status(400).send({ status: false, msg: "write correct password" })
      }
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.msg });
  }
}

const loginwithoutOTP = async function (req, res) {
  try {
    const requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, msg: 'value in request body is required' });
      return;
    }

    const { email, password } = requestBody;

    if (email && password) {

      let User = await Ruser.findOne({ email: email })

      if (!User) {
        return res.status(400).send({ status: false, msg: "Email does not exist" });
      }

      // console.log("User", User)
      let userID = new mongoose.Types.ObjectId(User._id)
      const passvalid = await bcrypt.compare(password, User.password)

      // console.log(User.password)
      if (passvalid) {
        const userIDs = User.email;
        const Token = jwt.sign({
          email: userIDs,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60 // Token expiration time (10 hours)
        }, "Group9");
        res.header('x-api-key', Token)

        // await sendOTP(email).then(async (re) => {
        //   let otps = await re.otp;
        res.status(200).send({ status: true, msg: "User login successfull", data: { userId: userID, Token: Token } })
        // }).catch((err) => {
        //   res.status(400).send({ status: false, msg: "otp not sent" })
        // })


      } else {
        res.status(400).send({ status: false, msg: "write correct password" })
      }
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.msg });
  }
}

const login = async function (req, res) {
  try {
    const requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, msg: 'Value in request body is required' });
      return;
    }

    

    const { email, otp } = requestBody;

    if (email && otp) {
      let user = await otpDetails.findOne({ email: email });
      if (!user) {
        return res.status(400).send({ status: false, msg: "Email does not exist" });
      }

      if (user.otp === "0") {
        res.status(400).send({ status: false, msg: "Invalid Credentials" });
      } else if (user.otp === otp) {
        // Check if OTP is still valid (within 5 minutes of generation)
        const otpGeneratedTime = new Date(user.otpGenerated).getTime();
        // console.log("time", otpGeneratedTime);
        const currentTime = Date.now();
        const otpExpiryTime = otpGeneratedTime + 5 * 60 * 1000; // 5 minutes in milliseconds
        // console.log(user.email);
        if (currentTime <= otpExpiryTime) {
          const userID = user.email;
          const Token = jwt.sign({
            email: userID,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60 // Token expiration time (10 hours)
          }, "Group9");

          const otpss = "0";
          await otpDetails.updateOne(
            { email: email },
            { $set: { otp: otpss } }
          );

          res.header('x-api-key', Token);
          res.status(200).send({ status: true, msg: "User login successful", data: { userId: userID, Token: Token } });
        } else {
          res.status(400).send({ status: false, msg: "OTP has expired. Please request a new OTP." });
        }
      } else {
        res.status(400).send({ status: false, msg: "Invalid Credentials" });
      }
    } else {
      res.status(400).send({ status: false, msg: "Email and OTP are required" });
    }
    
  } catch (err) {
    res.status(500).send({ status: false, msg: err.msg });
  }
};
//////////password update
const sendUserOTP = async function (req, res) {
  try {
    const requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, msg: 'value in request body is required' });
      return;
    }

    const { email } = requestBody;

    if (email) {

      let User = await Ruser.findOne({ email: email })
      console.log("User", User)
      if (!User) {
        return res.status(400).send({ status: false, msg: "Email does not exist" });
      }

      // console.log("User", User)
      // let userID = new mongoose.Types.ObjectId(User._id)
      // const passvalid = await bcrypt.compare(password, User.password)

      // console.log(User.password)
      if (User) {
        // const userIDs = User.email;
        // const Token = jwt.sign({
        //   email: userIDs,
        //   iat: Math.floor(Date.now() / 1000),
        //   exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60 // Token expiration time (10 hours)
        // }, "Group9");
        // res.header('x-api-key', Token)

        await sendOTP(email).then(async (re) => {
          let otps = await re.otp;

          console.log(otps)
          res.status(200).send({ status: true, msg: "User login successfull", data: { OTP: otps } })
        }).catch((err) => {
          res.status(400).send({ status: false, msg: "otp not sent" })
        })


      } else {
        res.status(400).send({ status: false, msg: "e_mail is not exist" })
      }
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.msg });
  }
}

const verifyOTP = async (req, res) => {

  

  const { email, otp } = req.body;

  if (email && otp) {
    let user = await otpDetails.findOne({ email: email });
    if (!user) {
      return res.status(400).send({ status: false, msg: "Email does not exist" });
    }

    if (user.otp === "0") {
      res.status(400).send({ status: false, msg: "Invalid Credentials" });
    } else if (user.otp === otp) {
      // Check if OTP is still valid (within 5 minutes of generation)
      const otpGeneratedTime = new Date(user.otpGenerated).getTime();
      // console.log("time", otpGeneratedTime);
      const currentTime = Date.now();
      const otpExpiryTime = otpGeneratedTime + 5 * 60 * 1000; // 5 minutes in milliseconds
      // console.log(user.email);
      if (currentTime <= otpExpiryTime) {
        const userID = user.email;
        // const Token = jwt.sign({
        //   email: userID,
        //   iat: Math.floor(Date.now() / 1000),
        //   exp: Math.floor(Date.now() / 1000) + 10 * 60 // Token expiration time (10 hours)
        // }, "Group9");

        const otpss = "0";
        await otpDetails.updateOne(
          { email: email },
          { $set: { otp: otpss } }
        );

        // res.header('x-api-key', Token);
        res.status(200).send({ status: true, msg: "enter new pasword", data: { userId: userID } });
      } else {
        res.status(400).send({ status: false, msg: "OTP has expired. Please request a new OTP." });
      }
    } else {
      res.status(400).send({ status: false, msg: "Invalid Credentials" });
    }
  } else {
    res.status(400).send({ status: false, msg: "Email and OTP are required" });
  }

  // });

}

const updatePassword = async (req, res) => {

  const userId = req.body.email;
  console.log("_id", userId);
  const requestBody = req.body;

  const UserFound = await Ruser.findOne({ email: userId })


  if (!UserFound) {
    return res.status(404).send({ status: false, msg: `User not found with given email` })
  }

  var { referralCode, email, password } = requestBody

  if (Object.prototype.hasOwnProperty.call(requestBody, 'password')) {
    requestBody.password = requestBody.password.trim();
    if (!(requestBody.password.length > 7 && requestBody.password.length < 16)) {
      res.status(400).send({ status: false, msg: "password should  between 8 and 15 characters" })
      return
    };

    var salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(requestBody.password, salt)
    // console.log(password)
    requestBody.password = password;
  }


  if (Object.prototype.hasOwnProperty.call(requestBody, 'email')) {
    if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
      res.status(400).send({ status: false, msg: `Email should be a valid email address` })
      return
    };


    const isEmailAlreadyUsed = await Ruser.findOne({ email: email });

    if (isEmailAlreadyUsed) {
      requestBody.UpdatedAt = new Date()
      const UpdateData = { $set: { password } }

      const upatedUser = await Ruser.updateOne({ email: email }, UpdateData, { upsert: false })
      res.status(200).send({ status: true, msg: 'Password updated successfully', data: upatedUser });
    } else {
      res.status(400).send({ status: true, msg: 'email not exist' });
    }

  }

}

const kycUpdate = async function (req, res) {
  try {
    let data = req.body

    // console.log("kycUpdate", data);
    // let files = req.files;
    if (!validator.isValidRequestBody(data)) {
      res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
      return
    }

    function telephoneCheck(v) {
      return (/^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(v))
    }


    const { Name, middleName, lastName, dob, panCardNumber, adharCardNumber, contactMobileNumber, whatsAppMobileNumber, amount, address, state, city, pincode, email, kycStatus } = req.body



    const allowedStatusValues = ['pending', 'active', 'reject'];
    if (!allowedStatusValues.includes(kycStatus)) {
      return res.status(400).send({ status: false, msg: 'Invalid KYC status value.' });
    }



    if (!validator.isValid(dob)) {
      return res.status(400).send({ status: false, msg: ' Please provide dob' })
    }

    if (!telephoneCheck(contactMobileNumber.trim())) {
      return res.status(400).send({ status: false, msg: "contactMobileNumber phone no. is not valid" })
    }

    if (!telephoneCheck(whatsAppMobileNumber)) {
      return res.status(400).send({ status: false, msg: "whatsAppMobileNumber phone no. is not valid" })
    }

    if (!validator.isValid(amount)) {
      return res.status(400).send({ status: false, msg: ' Please provide amount' })
    }

    if (!validator.isValid(email)) {
      return res.status(400).send({ status: false, msg: ' Please provide email' })
    }

    // if (!validator.isValid(addressDetails)) {
    //   return res.status(400).send({ status: false, msg: "Address is mandatory" })
    // }

    if (!validator.isValid(address && state && city && pincode)) {
      return res.status(400).send({ status: false, msg: "Some shipping address details or detail are/is missing" })
    }

    const query = {
      $or: [{ email }],
    };

    const isUserFound = await Ruser.findOne(query);

    if (isUserFound) {
      // If the user is found based on email or userUniqueId, update the personal details.
      var updatedData = {
        Name: Name,
        middleName: middleName,
        lastName: lastName,
        dob: dob,
        panCardNumber: panCardNumber,
        adharCardNumber: adharCardNumber,
        contactMobileNumber: contactMobileNumber,
        whatsAppMobileNumber: whatsAppMobileNumber,
        amount: amount,
        address: address,
        state: state,
        city: city,
        pincode: pincode,
        kycStatus: kycStatus
      };
      console.log("kyc", updatedData)
      // Update the user's personal details in the database
      await Ruser.updateMany(query, updatedData);

      res.status(200).send({ status: true, msg: `Kyc updated successfully` });
    } else {
      // If the user is not found based on email or userUniqueId, you can handle this case according to your application's logic.
      res.status(404).send({ status: false, msg: `User not found with provided email or userUniqueId` });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).send({ status: false, msg: err.msg });
  }
};

const getUser = async function (req, res) {

  try {
    // console.log(req.user)
    let email = req.body.email
    // console.log(req.user)
    // if (req.user != email) {
    //   return res.status(401).send({ status: false, msg: "email does not match" })
    // }
    let userId = email
    // console.log(userId)
    let findUserId = await Ruser.findOne({ email: userId })
    // console.log()


    let fetchRefferalCode = findUserId.childReferralCode;

    if (fetchRefferalCode == 0) {
      if (findUserId) {
        res.status(200).send({ status: true, msg: "User Profile details", data: findUserId })
      }
    } else {
      let sponserUser = await Ruser.findOne({ referralCode: fetchRefferalCode });

      if (sponserUser) {
        let sponserFullName = sponserUser.Name;

        if (sponserUser.middleName) {
          sponserFullName += ` ${sponserUser.middleName}`;
        }

        if (sponserUser.lastName) {
          sponserFullName += ` ${sponserUser.lastName}`;
        }


        //let sponserFullName = (`${sponserUser.Name} ${sponserUser.middleName} ${sponserUser.lastName}`)
        if (findUserId) {
          res.status(200).send({ status: true, msg: "User Profile details", data: findUserId, sponserName: sponserFullName })
        }
      }
    }


  } catch (err) {
    res.status(500).send({ status: false, msg: "email does not exist" })
  }

}

const fetchUserReportingHierarchy = async function (req, res) {
    try {
      const userId = req.body.userId;
  
      // Define common pipeline stages for user lookup
      const userLookupPipeline = [
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) }
        }
      ];
  
      // Fetch user details
      const [userDetail] = await Ruser.aggregate(userLookupPipeline);
  
      if (!userDetail) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Define pipeline stages for reporting hierarchy
      const reportingHierarchyPipeline = [
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) } // Match the provided user ID
        },
        {
          $graphLookup: {
            from: 'registerprofiles',
            startWith: '$referralCode',
            connectFromField: 'referralCode',
            connectToField: 'childReferralCode',
            as: 'reportingHierarchy',
            maxDepth: 13
          }
        },
        {
          $project: {
            reportingHierarchyDetails: '$reportingHierarchy'
          }
        },
        {
          $lookup: {
            from: 'registerprofiles',
            localField: 'reportingHierarchyDetails._id',
            foreignField: '_id',
            as: 'reportingHierarchyDetails'
          }
        },
        {
          $project: {
            _id: 0,
            reportingHierarchyDetails: 1
          }
        },
        {
          $unwind: '$reportingHierarchyDetails'
        },
        {
          $sort: { 'reportingHierarchyDetails.level': 1 } // Sort by level in ascending order
        }
      ];
  
      // Define pipeline stages for direct affiliates count
      // const directAffiliatesPipeline = [
      //         {
      //           $lookup: {
      //             from: 'registerprofiles',
      //             localField: '_id',
      //             foreignField: '_id',
      //             as: 'userDetails'
      //           }
      //         },
      //         {
      //           $unwind: '$userDetails'
      //         },
      //         {
      //           $match: { _id: new mongoose.Types.ObjectId(userId) }
      //         },
      //         {
      //           $graphLookup: {
      //             from: 'registerprofiles',
      //             startWith: '$userDetails.referralCode', // Use the user's referralCode here
      //             connectFromField: 'userDetails.referralCode', // Use the user's referralCode here
      //             connectToField: 'childReferralCode',
      //             as: 'reportingHierarchy'
      //           }
      //         },
      //         {
      //           $project: {
      //             reportingHierarchyDetails: '$reportingHierarchy',
      //             userDetails: 1 // Include the user details
      //           }
      //         },
      //         {
      //           $lookup: {
      //             from: 'registerprofiles',
      //             localField: 'reportingHierarchyDetails._id',
      //             foreignField: '_id',
      //             as: 'reportingHierarchyDetails'
      //           }
      //         },
      //         {
      //           $unwind: '$reportingHierarchyDetails'
      //         },
      //         {
      //           $sort: { 'reportingHierarchyDetails.level': 1 }
      //         },
      //         {
      //           $project: {
      //             _id: 0,
      //             reportingHierarchyDetails: 1
      //           }
      //         },
      //         {
      //           $group: {
      //             _id: new mongoose.Types.ObjectId(userId),
      //             directAffilates: { $sum: 1 }
      //           }
      //         }
      //       ];
  
      // Define pipeline stages for total affiliates count
      // const totalAffiliatesPipeline = [
      //         {
      //           $match: { _id: new mongoose.Types.ObjectId(userId) }
      //         },
      //         {
      //           $graphLookup: {
      //             from: 'registerprofiles',
      //             startWith: '$referralCode',
      //             connectFromField: 'referralCode',
      //             connectToField: 'childReferralCode',
      //             as: 'reportingHierarchy'
      //           }
      //         },
      //         {
      //           $project: {
      //             reportingHierarchyDetails: '$reportingHierarchy'
      //           }
      //         },
      //         {
      //           $lookup: {
      //             from: 'registerprofiles',
      //             localField: 'reportingHierarchyDetails._id',
      //             foreignField: '_id',
      //             as: 'reportingHierarchyDetails'
      //           }
      //         },
      //         {
      //           $unwind: '$reportingHierarchyDetails'
      //         },
      //         {
      //           $sort: { 'reportingHierarchyDetails.level': 1 } // Sort by level in ascending order
      //         },
      //         {
      //           $group: {
      //             _id: '$reportingHierarchyDetails.level', // Group by level
      //             reportingHierarchyDetails: { $first: '$reportingHierarchyDetails' }, // Keep the first document with the same level
      //             count: { $sum: 1 } // Count the occurrences of the same level
      //           }
      //         },
      //         {
      //           $group: {
      //             _id: new mongoose.Types.ObjectId(userId),
      //             totalAffilates: { $sum: '$count' } // Calculate the total count
      //           }
      //         },
      //         {
      //           $project: {
      //             _id: 1,
      //             totalAffilates: 1 // Include the total count in the output
      //           }
      //         }
      //       ];
  
      // Fetch results concurrently using Promise.all
      const [result] = await Promise.all([
        Ruser.aggregate(reportingHierarchyPipeline)
        // Ruser.aggregate(directAffiliatesPipeline),
        // Ruser.aggregate(totalAffiliatesPipeline)
      ]);
  
  //     const directAffiliatesCount = result1.length > 0 ? result1[0].directAffilates : 0;
  // const totalAffiliatesCount = result2.length > 0 ? result2[0].totalAffilates : 0;
  
  res.status(200).json({
    userDetail,
    result: result
    // directAffiliatesCount,
    // totalAffiliatesCount
  }); // Return the filtered result as the response
    } catch (error) {
      // console.error('Error:', error);
      res.status(500).json({ error: error.msg });
    }
  };



const adminReportingHierarchy = async function (req, res) {
  try {

    const pipeline = [
      {
        $graphLookup: {
          from: 'registerprofiles',
          startWith: '$referralCode',
          connectFromField: 'referralCode',
          connectToField: 'childReferralCode',
          as: 'reportingHierarchy'
        }
      },
      {
        $project: {
          reportingHierarchyDetails: '$reportingHierarchy'
        }
      },
      {
        $lookup: {
          from: 'registerprofiles',
          localField: 'reportingHierarchyDetails._id',
          foreignField: '_id',
          as: 'reportingHierarchyDetails'
        }
      }
    ];

    const result = await Ruser.aggregate(pipeline);

    res.status(200).json(result); // Return the filtered result as the response
  } catch (error) {
    // console.error('Error:', error);
    res.status(500).json({ error: error.msg });
  }
}




//////get all details og client by user if admin can give access to get   ajiit
const getDetailsBySells = async function (req, res) {

  try {

    const { email } = req.body;

    const user = await Ruser.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }

    // Check if the user is an admin before allowing KYC status update
    // if (!user.isAdmin) {
    //   return res.status(403).send({ status: false, msg: 'You are not authorized to access Admin Portal.' });
    // }

    const userDetails = await clientUser.find({ sellerEmail: email }).exec();
    // console.log()

    if (userDetails) {
      res.status(200).send({ status: true, msg: "User Profile details", data: userDetails })
    } else {
      res.status(400).send({ status: true, msg: "client details not found" })
    }
  } catch (err) {
    res.staus(500).send({ status: false, msg: err.msg })
  }

} 
///////get all client names by accessed user
const getAllDetailsBySells = async function (req, res) {

  try {

    const { email } = req.body;

    const user = await Ruser.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }

    // Check if the user is an admin before allowing KYC status update
    // if (!user.isAdmin) {
    //   return res.status(403).send({ status: false, msg: 'You are not authorized to access Admin Portal.' });
    // }

    const userDetails = await clientUser.find({ clientEmail: email }).exec();

    const userNames = [];
    userDetails.forEach(element => {
      userNames.push(element.Name);
    });

    if (userDetails) {
      res.status(200).send({ status: true, msg: "User Profile details", data: userNames })
    } else {
      res.status(400).send({ status: true, msg: "client details not found" })
    }
  } catch (err) {
    res.staus(500).send({ status: false, msg: err.msg })
  }

}
/////// user can update client status and discription
const updateClientDetails = async function (req, res) {
  try {
    let data = req.body

    if (!validator.isValidRequestBody(data)) {
      res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
      return
    }

    const { status, description, userUniqueId } = req.body


    const user = await Ruser.findOne({ userUniqueId: userUniqueId });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided userUniqueId.' });
    }

    if (!validator.isValid(status)) {
      return res.status(400).send({ status: false, msg: "status is not valid" })
    }

    if (!validator.isValid(description)) {
      return res.status(400).send({ status: false, msg: "description is not valid" })
    }

    const query = {
      $or: [{ userUniqueId }],
    };

    const isUserFound = await clientUser.findOne(query);

    console.log(isUserFound)

    if (isUserFound) {
      // If the user is found based on email or userUniqueId, update the personal details.
      var updatedData = {
        status: status,
        description: description
      };

      // Update the user's personal details in the database
      await clientUser.updateMany(query, updatedData);

      res.status(200).send({ status: true, msg: `Personal details updated successfully` });
    } else {
      // If the user is not found based on email or userUniqueId, you can handle this case according to your application's logic.
      res.status(404).send({ status: false, msg: `User not found with provided email or userUniqueId` });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).send({ status: false, msg: err.msg });
  }
};

// const getadminbusinessCount = async function (req, res) {

//   try {

//       let email = req.body.email

//       // if (req.user != email) {
//       //   return res.status(401).send({ status: false, msg: "email does not match" })
//       // }

//       let userId = email

//       let findUser = await business.find({ email: userId }).exec();

//       if (findUser) {
//         res.status(200).send({ status: true, msg: "User Profile details", data: findUser })
//       }else{
//         res.status(400).send({ status: false, msg: "data not exist" })
//       }

//   } catch (err) {
//     res.staus(500).send({ status: false, msg: err.msg })
//   }

// }


const getadminbusinessCount = async function (req, res) {
  try {
    const email = req.body.email;
    const fromDateString = req.body.from;
    const toDateString = req.body.to;

    let findUser;

    if (fromDateString && toDateString) {
      const fromDate = new Date(fromDateString);
      const toDate = new Date(toDateString);
      toDate.setDate(toDate.getDate() + 1);
      
      findUser = await business.find({
        email: email,
        createdAt: { $gte: fromDate, $lt: toDate },
      }).exec();
    } else {
      findUser = await business.find({
        email: email,
      }).exec();
    }

    if (findUser.length > 0) {
      let totalBusinessAmount = findUser.reduce(
        (total, item) => total + parseFloat(item.totalBusinessAmount),
        0
      );

      // Calculate total pending and total advance amounts
      let totalPendingAmount = findUser.reduce(
        (total, item) => total + parseFloat(item.pending),
        0
      );

      let totalAdvanceAmount = findUser.reduce(
        (total, item) => total + parseFloat(item.advance),
        0
      );

      res.status(200).send({
        status: true,
        msg: "User Profile details",
        data: {
          user: email,
          fetchedData: findUser,
          finalBusinessAmount: totalBusinessAmount,
          finalPendingAmount: totalPendingAmount,
          finalAdvanceAmount: totalAdvanceAmount,
        },
      });
    } else {
      res.status(404).send({
        status: false,
        msg: "No data found for the given criteria.",
      });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};


/////// user can update the amount percentage of users   //changed
const updateUserAmount = async (req, res) => {
  try {
    let data = req.body
    // let files = req.files;
    if (!validator.isValidRequestBody(data)) {
      res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
      return
    }

    const {amount, email } = req.body;

    const user = await Ruser.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }

    // Check if the user is an admin before allowing KYC status update
    // if (!user.isAdmin) {
    //   return res.status(403).send({ status: false, msg: 'You are not authorized to update KYC status.' });
    // }

    if (!validator.isValid(amount)) {
      return res.status(400).send({ status: false, msg: ' Please provide amount' })
    }

    // if (!validator.isValid(adminEmail)) {
    //   return res.status(400).send({ status: false, msg: ' Please provide adminEmail' })
    // }

    if (!validator.isValid(email)) {
      return res.status(400).send({ status: false, msg: ' Please provide email' })
    }

    const query = {
      $or: [{ email }],
    };

    const isUserFound = await Ruser.findOne(query);

    if (isUserFound) {
      // If the user is found based on email or userUniqueId, update the personal details.
      var updatedData = {
        amount: amount
      };

      // Update the user's personal details in the database
      await Ruser.updateMany(query, updatedData);

      res.status(200).send({ status: true, msg: `Personal details updated successfully` });
    } else {
      // If the user is not found based on email or userUniqueId, you can handle this case according to your application's logic.
      res.status(404).send({ status: false, msg: `User not found with provided email or userUniqueId` });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).send({ status: false, msg: err.msg });
  }

}

// const getSelfReport = async (req, res) =>{
//   try {

//     const { email } = req.body;

//     const user = await Ruser.findOne({ email: email });
//     if (!user) {
//       return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
//     }

//     const userDetails = await reports.find({ email: email }).exec();
//     // console.log()
//     if (userDetails) {
//       res.status(200).send({ status: true, msg: "User reporrt details", data: userDetails })
//     } else {
//       res.status(400).send({ status: true, msg: "client details not found" })
//     }
//   } catch (err) {
//     res.staus(500).send({ status: false, msg: err.msg })
//   }
// }


/////////////////ADMIN APIs PORTION ////////////////////////////////////////////

const registerAdmin = async function (req, res) {
  try {
    let data = req.body
    // let files = req.files;
    if (!validator.isValidRequestBody(data)) {
      res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
      return
    }

    // function validEmail(r) {
    //   return (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(r))
    // }


    const { isAdmin, Name, childReferralCode, email, password, kycStatus } = req.body


    if (!validator.isValid(Name)) {
      return res.status(400).send({ status: false, msg: ' Please provide name' })
    }

    if (!validator.isValid(childReferralCode)) {
      return res.status(400).send({ status: false, msg: ' Please provide childReferralCode' })
    }

    const isEmailAlreadyUsed = await Ruser.findOne({ email });

    if (isEmailAlreadyUsed) {
      return res.status(400).send({ status: false, msg: `${email} email address is already registered` })
    }

    if (!validator.isValid(password)) {
      return res.status(400).send({ status: false, msg: ' Please provide password' })
    }
    if (!(password.trim().length > 7 && password.trim().length < 16)) {
      return res.status(400).send({ status: false, msg: ' Please provide valid password' })
    }

    const userDetails = await Ruser.find().exec();

    if (childReferralCode == 0) {

      await generatedata(password).then(async (gdata) => {
        let userIdCount = userDetails.length += 1;

        var datas = { isAdmin: isAdmin, userUniqueId: userIdCount, Name: Name, referralCode: gdata.referralCode, childReferralCode, email: email, password: gdata.password, kycStatus: kycStatus };//, otp: "0", otpExpiry: otpExpiryTime.toISOString() };
        // count++;
        await Ruser.create(datas);
      });
      res.status(200).send({ status: true, msg: `admin registered` });

    } else {

      res.status(404).send({ status: false, msg: `only admin can register` });
      // let foundUser = false;

      // for (let index = 0; index < userDetails.length; index++) {
      //   const element = userDetails[index];
      //   if (element.referralCode === childReferralCode) {
      //     foundUser = true;
      //     // const otpExpiryTime = moment().add(1, 'minutes');
      //     await generatedata(password).then(async (gdata) => {
      //       let userIdCount = userDetails.length += 1;

      //       var datas = { isAdmin: isAdmin, userUniqueId: userIdCount, Name: Name, referralCode: gdata.referralCode, childReferralCode, email: email, password: gdata.password, kycStatus: kycStatus };//, otp: "0", otpExpiry: otpExpiryTime.toISOString() };
      //       // count++;
      //       await Ruser.create(datas);
      //     });
      //     break;
      //   }
      // }

      // if (foundUser) {
      //   res.status(200).send({ status: true, msg: `success` });
      // } else {
      //   res.status(404).send({ status: false, msg: `referral code not found` });
      // }
    }

  } catch (err) {
    // console.log(err);
    res.status(500).send({ status: false, msg: err.msg });
  }
};
////// admin can approve the user kyc status    changed//
const AdminUpdate = async function (req, res) {
  try {
    const { adminEmail, email, kycStatus } = req.body;

    if (req.user != adminEmail) {
      return res.status(401).send({ status: false, msg: "adminEmail does not match" })
    }

    // Validate that the provided kycStatus is one of the allowed values (optional)
    const allowedStatusValues = ['active', 'reject'];
    if (!allowedStatusValues.includes(kycStatus)) {
      return res.status(400).send({ status: false, msg: 'Invalid KYC status value.' });
    }

    // Find the user by their userId
    const user = await Ruser.findOne({ email: adminEmail });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided adminEmail.' });
    }       

    // Check if the user is an admin before allowing KYC status update
    if (!user.isAdmin) {
      return res.status(403).send({ status: false, msg: 'You are not authorized to update KYC status.' });
    }


    const user1 = await Ruser.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }

    // Update the KYC status for the user
    user1.kycStatus = kycStatus;
    await user1.save();

    return res.status(200).send({ status: true, msg: 'KYC status updated successfully.' });
  } catch (err) {
    res.status(500).send({ status: false, msg: err.msg });
  }
};
/////// admin can update the amount percentage of users   //changed
const UpdateUser = async (req, res) => {
  try {
    let data = req.body
    // let files = req.files;
    if (!validator.isValidRequestBody(data)) {
      res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
      return
    }

    const { designation, amount, adminEmail, email } = req.body;

    if (req.user != adminEmail) {
      return res.status(401).send({ status: false, msg: "email does not match" })
    }


    const user = await Ruser.findOne({ email: adminEmail });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }

    // Check if the user is an admin before allowing KYC status update
    if (!user.isAdmin) {
      return res.status(403).send({ status: false, msg: 'You are not authorized to update KYC status.' });
    }
    if (!validator.isValid(designation)) {
      return res.status(400).send({ status: false, msg: ' Please provide designation' })
    }

    if (!validator.isValid(amount)) {
      return res.status(400).send({ status: false, msg: ' Please provide lname' })
    }

    if (!validator.isValid(adminEmail)) {
      return res.status(400).send({ status: false, msg: ' Please provide adminEmail' })
    }

    if (!validator.isValid(email)) {
      return res.status(400).send({ status: false, msg: ' Please provide email' })
    }

    const query = {
      $or: [{ email }],
    };

    const isUserFound = await Ruser.findOne(query);

    if (isUserFound) {
      // If the user is found based on email or userUniqueId, update the personal details.
      var updatedData = {
        designation: designation,
        amount: amount
      };

      // Update the user's personal details in the database
      await Ruser.updateMany(query, updatedData);

      res.status(200).send({ status: true, msg: `Personal details updated successfully` });
    } else {
      // If the user is not found based on email or userUniqueId, you can handle this case according to your application's logic.
      res.status(404).send({ status: false, msg: `User not found with provided email or userUniqueId` });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).send({ status: false, msg: err.msg });
  }

}
//////admin can get all details of users

const getDetailsByAdmin = async function (req, res) {
  try {
    const { email, page = 1, limit = 10 } = req.body;

    if (req.user != email) {
      return res.status(401).send({ status: false, msg: "email does not match" });
    }

    const user = await Ruser.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with the provided email.' });
    }

    // Check if the user is an admin before allowing KYC status update
    if (!user.isAdmin) {
      return res.status(403).send({ status: false, msg: 'You are not authorized to access the Admin Portal.' });
    }

    const skip = (page - 1) * limit;

    const userDetails = await Ruser.find({ email: { $ne: email } })
      .sort({ userUniqueId: 1 }) // Sort in ascending order based on userUniqueId
      .skip(skip)
      .limit(limit)
      .exec();

    const data = await Ruser.find({ email: { $ne: email } });
    const dataCount = data.length;

    res.status(200).send({
      status: true,
      msg: "User Profile details",
      data: userDetails,
      dataCount: dataCount,
      currentPage: parseInt(page),
    });
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};

/////client details filled by Admin   //changed
const clientDetails = async function (req, res) {
  try {
    const data = req.body;

    if (!validator.isValidRequestBody(data)) {
      return res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' });
    }

    function telephoneCheck(v) {
      return (/^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(v));
    }

    const { adminEmail, Name, sellerEmail, dob, contactMobileNumber, whatsAppMobileNumber, minimumSellingRate, sales, clientDetails, siteDetails } = data;

    if (req.user != adminEmail) {
      return res.status(401).send({ status: false, msg: "Email does not match" });
    }

    const user = await Ruser.findOne({ email: sellerEmail });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }

    if (!validator.isValid(Name)) {
      return res.status(400).send({ status: false, msg: 'Please provide a name' });
    }

    if (!validator.isValid(dob)) {
      return res.status(400).send({ status: false, msg: 'Please provide date of birth' });
    }

    if (!telephoneCheck(contactMobileNumber.trim())) {
      return res.status(400).send({ status: false, msg: "Contact mobile number is not valid" });
    }

    if (!telephoneCheck(whatsAppMobileNumber)) {
      return res.status(400).send({ status: false, msg: "WhatsApp mobile number is not valid" });
    }

    if (!validator.isValid(minimumSellingRate)) {
      return res.status(400).send({ status: false, msg: 'Please provide minimum selling rate' });
    }

    if (!validator.isValid(sales)) {
      return res.status(400).send({ status: false, msg: 'Please provide sales' });
    }

    if (!validator.isValid(clientDetails)) {
      return res.status(400).send({ status: false, msg: "Address is mandatory" });
    }

    if (!validator.isValid(clientDetails.address && clientDetails.state && clientDetails.city && clientDetails.pincode)) {
      return res.status(400).send({ status: false, msg: "Some shipping address details are missing" });
    }

    if (!validator.isValid(siteDetails)) {
      return res.status(400).send({ status: false, msg: "Address is mandatory" });
    }

    if (!validator.isValid(siteDetails.address && siteDetails.state && siteDetails.city && siteDetails.pincode)) {
      return res.status(400).send({ status: false, msg: "Some site address details are missing" });
    }

    const userDetails = await clientUser.find().exec();
    let userIdCount = userDetails.length + 1;

    const newData = {
      userUniqueId: userIdCount,
      Name,
      sellerEmail,
      dob,
      contactMobileNumber,
      whatsAppMobileNumber,
      minimumSellingRate,
      sales,
      clientDetails,
      siteDetails
    };

    await clientUser.create(newData);

    res.status(200).send({ status: true, msg: `Client inserted` });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: false, msg: "Something went wrong" });
  }
};



const adminBusinees = async function (req, res) { 
  try {
    const requestBody = req.body;
    
    if (!validator.isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, msg: 'Value in request body is required' });
    }

    const { adminEmail, email, totalBusinessAmount, numberOfProjects, advance } = requestBody;

    // Fetch the admin user
    const adminUser = await Ruser.findOne({ email: adminEmail });
    
    if (!adminUser) {
      return res.status(404).send({ status: false, msg: 'Admin not found with provided email.' });
    }

    // Check if the user is an admin before allowing business data update
    if (!adminUser.isAdmin) {
      return res.status(403).send({ status: false, msg: 'You are not authorized to update business data.' });
    }

    // Check if all required fields are valid
    if (!validator.isValid(adminEmail) || !validator.isValid(email) || !validator.isValid(totalBusinessAmount) || !validator.isValid(numberOfProjects) || !validator.isValid(advance)) {
      return res.status(400).send({ status: false, msg: 'Please provide all required fields' });
    }

    // Fetch user details from the business collection
    const targetUser = await Ruser.findOne({ email });
    
    if (!targetUser) {
      return res.status(400).send({ status: false, msg: "User with the provided email does not exist" });
    }

    // Fetch business details for the user
    //let userBusiness = await business.findOne({ email });
    const ppending = totalBusinessAmount - advance;
    
    // if (userBusiness === null) {
      const tds = totalBusinessAmount * 0.05;
      const platformCharges = totalBusinessAmount * 0.05;
      const pending1=  ppending - tds - platformCharges;

      const data = {
        email,
        totalBusinessAmount,
        tds,
        platformCharges,
        numberOfProjects,
        pending: pending1,
        advance
      };

      await business.create(data);
      return res.status(200).send({ status: true, msg: "Total business count inserted" });
    //} else {
      // const tdss = totalBusinessAmount * 0.05;
      // const platformChargess = totalBusinessAmount * 0.05;
      // const pending2=  ppending - tdss - platformChargess;
      // await business.updateOne(
      //   { email },
      //   {
      //     $set: {
      //       email,
      //       totalBusinessAmount,
      //       tds: tdss,
      //       platformCharges: platformChargess,
      //       numberOfProjects,
      //       tax,
      //       pending: pending2,
      //       advance,
      //       GeneratedTime: new Date()
      //     }
      //   }
      // );

      // return res.status(200).send({ status: true, msg: "Total business count updated" });
    //}
  } catch (err) {
    console.error(err);
    return res.status(500).send({ status: false, msg: "Something went wrong" });
  }
};

const adminGetbusinessCount = async function (req, res) {
  try {
    const adminEmail = req.body.adminEmail; // Admin's email
    const fromDateString = req.body.from; // Convert the provided from date to a string
    const toDateString = req.body.to; // Convert the provided to date to a string

    // if (req.user !== adminEmail) {
    //   return res.status(401).send({ status: false, msg: "You are not authorized to access this data." });
    // }

    const adminUser = await Ruser.findOne({ email: adminEmail });
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).send({ status: false, msg: "You are not authorized as an admin." });
    }

    let userData;

    if (fromDateString && toDateString) {
      // If both from and to dates are provided, filter by date range
      const fromDate = new Date(fromDateString);
      const toDate = new Date(toDateString);
      toDate.setDate(toDate.getDate() + 1); // Include the end date in the range
      
      userData = await business.find({
        createdAt: { $gte: fromDate, $lt: toDate },
      }).exec();
    } else {
      // If no date filters are provided, fetch all data
      userData = await business.find({}).exec();
    }

    if (userData.length > 0) {
      let totalBusinessAmount = userData.reduce(
        (total, item) => total + parseFloat(item.totalBusinessAmount),
        0
      );

      // Calculate total pending and total advance amounts
      let totalPendingAmount = userData.reduce(
        (total, item) => total + parseFloat(item.pending),
        0
      );

      let totalAdvanceAmount = userData.reduce(
        (total, item) => total + parseFloat(item.advance),
        0
      );

      res.status(200).send({
        status: true,
        msg: "User Profile details",
        data: {
          fetchedData: userData,
          finalBusinessAmount: totalBusinessAmount,
          finalPendingAmount: totalPendingAmount,
          finalAdvanceAmount: totalAdvanceAmount,
        },
      });
    } else {
      res.status(404).send({
        status: false,
        msg: "No data found for the given criteria.",
      });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};


const adminDeleteBusinessReport = async function (req, res) {
  try {
    const adminEmail = req.body.adminEmail; // Admin's email

    // if (req.user !== adminEmail) {
    //   return res.status(401).send({ status: false, msg: "You are not authorized to access this data." });
    // }

    const adminUser = await Ruser.findOne({ email: adminEmail });
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).send({ status: false, msg: "You are not authorized as an admin." });
    }

    const reportIdToDelete = req.body.reportId; // Extract the _id to delete
    if (!reportIdToDelete) {
      return res.status(400).send({ status: false, msg: "Please provide the reportId to delete." });
    }

    const deletedReport = await business.findByIdAndDelete(reportIdToDelete).exec();
    if (deletedReport) {
      res.status(200).send({
        status: true,
        msg: "Report deleted successfully.",
        deletedData: deletedReport,
      });
    } else {
      res.status(404).send({
        status: false,
        msg: "No report found with the given reportId.",
      });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};



//////////////bank varification///////////////////////////////////

const insertBankDetails = async function (req, res) {
  try {
    let data = req.body
    // let files = req.files;
    if (!validator.isValidRequestBody(data)) {
      res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
      return
    }


    const { bankName, account_Number, confirmAccount_Number, IFSC_Code, branchName, email } = req.body

    const user = await Ruser.findOne({ email: email });

    if (req.user != email) {
      return res.status(401).send({ status: false, msg: "email does not match" })
    }

    // console.log(user)
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }


    if (!validator.isValid(bankName)) {
      return res.status(400).send({ status: false, msg: ' Please provide bankName' })
    }
    if (!validator.isValid(account_Number)) {
      return res.status(400).send({ status: false, msg: ' Please provide account_Number' })
    }


    // if(account_Number === confirmAccount_Number)

    if (!validator.isValid(confirmAccount_Number)) {
      return res.status(400).send({ status: false, msg: ' Please provide confirmAccount_Number' })
    }

    if (!validator.isValid(IFSC_Code)) {
      return res.status(400).send({ status: false, msg: ' Please provide IFSC_Code' })
    }

    if (!validator.isValid(branchName)) {
      return res.status(400).send({ status: false, msg: ' Please provide branchName' })
    }

    const existingUserWithBank = await bankdetails.findOne({ account_Number: account_Number });

    if (existingUserWithBank) {
      return res.status(409).send({ status: false, msg: 'bank account number already exists in the database.' });
    }

    if(account_Number === confirmAccount_Number){
    await Bankrverification(account_Number, IFSC_Code).then(async (re) => {

      if (re.success) {
        let userName = re.data.full_name;

        var datas = { email: email, bankName: bankName, account_Number: account_Number, confirmAccount_Number: confirmAccount_Number, IFSC_Code: IFSC_Code, accountHolderName: userName, branchName: branchName };//, otp: "0", otpExpiry: otpExpiryTime.toISOString() };

        await bankdetails.create(datas);

        res.status(200).send({ status: true, msg: `Bank details Updated successfully` });
      }

    })

  }else{
    res.status(500).send({ status: false, msg: "Confirm account number is not same" });
  }

  } catch (err) {
    // console.log(err);
    res.status(500).send({ status: false, msg: " enter correct bank details" });
  }

}

const Bankrverification = async (account_Number, IFSC_Code) => {
  let response;
  return new Promise(async (reslove, reject) => {

    var data = JSON.stringify({
      "id_number": account_Number,
      "ifsc": IFSC_Code
    });
    var config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://kyc-api.aadhaarkyc.io/api/v1/bank-verification/',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4MDg3NDIwMCwianRpIjoiNGQ5ZGUzNTEtNDE4Ny00YzkxLWFhY2UtNGNhODA3YWQ3YTgyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmR1cmdhcGRAc3VyZXBhc3MuaW8iLCJuYmYiOjE2ODA4NzQyMDAsImV4cCI6MTk5NjIzNDIwMCwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.rp9yzY4_x5XYB76_ddtD30gRskvTag6YckKsadA-nbo'
      },
      data: data
    };
    await axios(config).then(function (response) {
      // console.log(JSON.stringify(response.data));
      return reslove(response.data);
    }).catch(function (error) {
      //console.log("error", error);
      return reject(error);
    })
  });
}

const getBankDetails = async function (req, res) {
  try {
    // Extract the email from the request body
    let email = req.body.email;

    // if (req.user != email) {
    //   return res.status(401).send({ status: false, msg: "email does not match" })
    // }

    // Use the email to find all matching user profile details in the database
    let userId = email;
    let matchingUserProfiles = await bankdetails.find({ email: userId });

    // Check if any user profiles were found
    if (matchingUserProfiles.length > 0) {
      // Send a successful response with an array of user profile details
      res.status(200).send({ status: true, msg: "User Profile details", data: matchingUserProfiles });
    } else {
      // Send a response if no matching user profiles were found
      res.status(404).send({ status: false, msg: "bank details not avilable" });
    }
  } catch (err) {
    // Handle errors by sending an error response
    res.status(500).send({ status: false, msg: err.message });
  }
}

const deleteBankDetailsByAccountNo = async function (req, res) {
  try {
    // Extract email and account number from the request body


    let email = req.body.email;
    let accountNo = req.body.accountNo;

    if (req.user != email) {
      return res.status(401).send({ status: false, msg: "email does not match" })
    }

    let getBankDetail = await bankdetails.findOne({ email: email, account_Number: accountNo });
    if(!getBankDetail){
      return res.json({"status": false, msg: "Bank details not exist"})
    }

    // Delete the bank details document based on email and account number
    let deletedBankDetail = await bankdetails.deleteOne({ email: email, account_Number: accountNo });



    // Check if any bank details were deleted
    if (deletedBankDetail) {
      res.status(200).send({ status: true, msg: "Bank details deleted successfully" });
    } else {
      res.status(404).send({ status: false, msg: "No matching bank details found for the provided email and account number" });
    }
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
}

const adminGetBankDetails = async function (req, res) {

  try {
    // console.log(req.user)
    let email = req.body.email
    // console.log(req.user)
    if (req.user != email) {
      return res.status(401).send({ status: false, msg: "email does not match" })
    }

    const user = await Ruser.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
    }

    // Check if the user is an admin before allowing KYC status update
    if (!user.isAdmin) {
      return res.status(403).send({ status: false, msg: 'You are not authorized to access Admin Portal.' });
    }

    // let userId = email
    // console.log(userId)
    const bankDetails = await bankdetails.find().exec();
    // console.log()
    // let fetchRefferalCode = findUserId.childReferralCode;
    // let sponserUser = await Ruser.findOne({ referralCode: fetchRefferalCode });
    // let sponserFullName = (`${sponserUser.Name} ${sponserUser.middleName} ${sponserUser.lastName}`)

    res.status(200).send({ status: true, msg: "User Profile details", data: bankDetails })


  } catch (err) {
    res.staus(500).send({ status: false, msg: err.msg })
  }

}


/////////adhar and pan varification/////////////////////////////////////////////

async function aadhaarNumberrverification(adh_nu) {
  return new Promise(async (resolve, reject) => {
    // console.log("aadhaarNumberrverification", adh_nu)
    try {
      let data = JSON.stringify({
        "id_number": adh_nu.toString() // Replace this with a valid Aadhaar number
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://kyc-api.surepass.io/api/v1/aadhaar-validation/aadhaar-validation',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4MDg3NDIwMCwianRpIjoiNGQ5ZGUzNTEtNDE4Ny00YzkxLWFhY2UtNGNhODA3YWQ3YTgyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmR1cmdhcGRAc3VyZXBhc3MuaW8iLCJuYmYiOjE2ODA4NzQyMDAsImV4cCI6MTk5NjIzNDIwMCwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.rp9yzY4_x5XYB76_ddtD30gRskvTag6YckKsadA-nbo'
        },
        data: data
      };


      const response = await axios(config);

      const message_code = response.data['message_code'];
      const client_id = response.data.data['client_id'];
      const result = { message_code, client_id };

      resolve(result);
    } catch (error) {
      if (error.response && error.response.status === 422) {
        reject("Invalid Aadhaar number");
      } else {
        console.error("Error verifying Aadhaar number:", error.msg);
        reject("Aadhaar number verification failed");
      }
    }
  });
}

async function generateAadharOtp(adh_nu) {
  return new Promise(async (resolve, reject) => {
    try {

      await axios.post(
        "https://kyc-api.aadhaarkyc.io/api/v1/aadhaar-v2/generate-otp",
        {
          id_number: adh_nu,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4MDg3NDIwMCwianRpIjoiNGQ5ZGUzNTEtNDE4Ny00YzkxLWFhY2UtNGNhODA3YWQ3YTgyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmR1cmdhcGRAc3VyZXBhc3MuaW8iLCJuYmYiOjE2ODA4NzQyMDAsImV4cCI6MTk5NjIzNDIwMCwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.rp9yzY4_x5XYB76_ddtD30gRskvTag6YckKsadA-nbo",
          },
        }
      ).then(async (rrr) => {
        let message_code = rrr.data['message_code'];
        let client_id = rrr.data.data['client_id']
        let ree = { message_code, client_id }
        // console.log("fgrfghhrfhrfh", ree)
        return resolve(ree);

      })

      // await axios(response).then(async (re) => {
      //  return resolve(response);
      // })
      // return resolve(config.data);
    } catch (error) {
      // console.log("Error generating OTP:", error.msg);
      let rej = { status: false, msg: "Failed to send OTP" };
      reject(rej);
    }
  });
}

const adharvarification = async function (req, res) {
  try {

    let email = req.body.email;

    let adh_nu = req.body.adh_nu;

    console.log(email);
    const adharAlreadyVerified = await Ruser.findOne({ adharCardNumber: adh_nu });

    console.log("addd", adharAlreadyVerified)

    if (adharAlreadyVerified && adharAlreadyVerified.adharVerified) {
      return res.status(403).send({ status: false, msg: 'This Aadhar is verified and unable to verify again.' });
    }

    const existingUserWithAadhar = await Ruser.findOne({ adharCardNumber: adh_nu });

    if (existingUserWithAadhar) {
      return res.status(409).send({ status: false, msg: 'Aadhar number already exists in the database.' });
    }

    if (!adharAlreadyVerified) {
      await aadhaarNumberrverification(adh_nu)
        .then(async (re) => {
          if (re.message_code === "success") {
            await generateAadharOtp(adh_nu)
              .then(async (AadharOtp) => {
                res.status(200).send({ status: true, msg: "OTP sent", client_Id: AadharOtp.client_id });
              })
              .catch(error => {
                //console.error("Error generating Aadhar OTP:", error);
                res.status(500).send({ status: false, msg: "Failed to generate Aadhar OTP" });
              });
          } else {
            res.status(400).send({ status: false, msg: "Aadhaar number verification failed" });
          }
        })
        .catch(error => {
          //console.error("Error verifying Aadhaar number:", error);
          res.status(500).send({ status: false, msg: "Aadhaar number verification failed" });
        });

    }

  } catch (error) {
    console.error("Error in adharvarification:", error);
    res.status(500).send({ status: false, msg: "Internal server error" });
  }
};

const validateaadhaarotp = async (req, res, next) => {
  let response;
  let email = req.body.email;
  let aadhotp = req.body.otp;
  let client_id = req.body.client_id;
  // console.log("LLLLLLLLLLLLLL", req.body);
  // if (!isValid(aadhotp)) {
  //   response = { status: false, msg: "OTP  is required" };
  //   res.json(response);
  //   return;
  // }
  var axios = require("axios");
  var data = JSON.stringify({
    client_id: client_id,
    otp: aadhotp,
  });
  var config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://kyc-api.aadhaarkyc.io/api/v1/aadhaar-v2/submit-otp",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4MDg3NDIwMCwianRpIjoiNGQ5ZGUzNTEtNDE4Ny00YzkxLWFhY2UtNGNhODA3YWQ3YTgyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmR1cmdhcGRAc3VyZXBhc3MuaW8iLCJuYmYiOjE2ODA4NzQyMDAsImV4cCI6MTk5NjIzNDIwMCwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.rp9yzY4_x5XYB76_ddtD30gRskvTag6YckKsadA-nbo",
    },
    data: data,
  };
  await axios(config)
    .then(async function (re) {
      const adharVerifiedCheck = await Ruser.findOne({ email });

      if (adharVerifiedCheck && adharVerifiedCheck.adharVerified !== true) {
        const query = { email };
        var updatedData = { adharVerified: true };

        // Update the user's adharVerified status in the database
        await Ruser.updateMany(query, updatedData);
      } else {
        return res.status(403).send({ status: false, msg: 'This Aadhar is already verified and unable to verify again.' });
      }

      res.status(200).send({ status: true, msg: "Successful validation", Data: re.data });
    })
    .catch(function (error) {
      // console.log("API Error:", error);
      res.status(400).send({ status: false, msg: "validation failed", Data: error });
    });
};

const panNumberrverification = async (req, res, next) => {
  let response;
  // return new Promise(async (reslove, reject) => {
  let pan_no = req.body.pan_no;


  const adharAlreadyVerified = await Ruser.findOne({ panCardNumber: { $regex: new RegExp(pan_no, 'i')} });

  console.log("adyd", adharAlreadyVerified)

  if (adharAlreadyVerified) {
    return res.status(403).send({ status: false, msg: 'This pancard is verified and unable to verify again.' });
  }

  if (!adharAlreadyVerified) {
    let data = JSON.stringify({
      "id_number": pan_no
    });
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://kyc-api.surepass.io/api/v1/pan/pan',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY4MDg3NDIwMCwianRpIjoiNGQ5ZGUzNTEtNDE4Ny00YzkxLWFhY2UtNGNhODA3YWQ3YTgyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmR1cmdhcGRAc3VyZXBhc3MuaW8iLCJuYmYiOjE2ODA4NzQyMDAsImV4cCI6MTk5NjIzNDIwMCwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.rp9yzY4_x5XYB76_ddtD30gRskvTag6YckKsadA-nbo'
      },
      data: data
    };
    await axios(config)
      .then(function (re) {
        // console.log("API Response:", re.data);
        res.status(200).send({ status: true, msg: " successfull validation", Data: re.data });
      })
      .catch(function (error) {
        // console.log("API Error:", error);
        res.status(400).send({ status: false, msg: "validation failed", Data: error });
      });

  };
}




////////////// not in use////////////////////////////////////////////////////////////////////////////////

const kycOldUpdate = async function (req, res) {
  try {
    let data = req.body

    console.log("kycUpdate", data);
    // let files = req.files;
    if (!validator.isValidRequestBody(data)) {
      res.status(400).send({ status: false, msg: 'Invalid request parameters. Please provide user details' })
      return
    }

    function telephoneCheck(v) {
      return (/^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(v))
    }


    const { Name, middleName, lastName, dob, panCardNumber, adharCardNumber, contactMobileNumber, whatsAppMobileNumber, amount, addressDetails, email, kycStatus } = req.body



    const allowedStatusValues = ['pending', 'active', 'reject'];
    if (!allowedStatusValues.includes(kycStatus)) {
      return res.status(400).send({ status: false, msg: 'Invalid KYC status value.' });
    }



    if (!validator.isValid(dob)) {
      return res.status(400).send({ status: false, msg: ' Please provide dob' })
    }

    if (!telephoneCheck(contactMobileNumber.trim())) {
      return res.status(400).send({ status: false, msg: "contactMobileNumber phone no. is not valid" })
    }

    if (!telephoneCheck(whatsAppMobileNumber)) {
      return res.status(400).send({ status: false, msg: "whatsAppMobileNumber phone no. is not valid" })
    }

    if (!validator.isValid(amount)) {
      return res.status(400).send({ status: false, msg: ' Please provide lname' })
    }

    if (!validator.isValid(email)) {
      return res.status(400).send({ status: false, msg: ' Please provide email' })
    }

    if (!validator.isValid(addressDetails)) {
      return res.status(400).send({ status: false, msg: "Address is mandatory" })
    }

    if (!validator.isValid(addressDetails.address && addressDetails.state && addressDetails.city && addressDetails.pincode)) {
      return res.status(400).send({ status: false, msg: "Some shipping address details or detail are/is missing" })
    }

    const query = {
      $or: [{ email }],
    };

    const isUserFound = await Rsuser.findOne(query);

    if (isUserFound) {
      // If the user is found based on email or userUniqueId, update the personal details.
      var updatedData = {
        Name: Name,
        middleName: middleName,
        lastName: lastName,
        dob: dob,
        panCardNumber: panCardNumber,
        adharCardNumber: adharCardNumber,
        contactMobileNumber: contactMobileNumber,
        whatsAppMobileNumber: whatsAppMobileNumber,
        amount: amount,
        addressDetails: addressDetails,
        kycStatus: kycStatus
      };

      // Update the user's personal details in the database
      await Rsuser.updateMany(query, updatedData);

      res.status(200).send({ status: true, msg: `Personal details updated successfully` });
    } else {
      // If the user is not found based on email or userUniqueId, you can handle this case according to your application's logic.
      res.status(404).send({ status: false, msg: `User not found with provided email or userUniqueId` });
    }
  } catch (err) {
    // console.log(err);
    res.status(500).send({ status: false, msg: err.msg });
  }
};

const fetchReferrals = async function (req, res) {

  var referralCodes = req.body.referralCodes;

  const fetchUsersByReferralCode = async function () {
    return new Promise(async function executor(resolve, reject) {
      // mongoUtil.connectToServer(async function (err, client) {
      //     db = mongoUtil.getDb();
      //     const user = db.collection('userprofiles');

      const users = await user.find({ childReferralCode: referralCodes }).toArray();
      const userIds = users.map(user => user._id.toString());
      const reffIds = users.map(user => user.referralCode.toString());

      // console.log("reffIds", reffIds)
      const PreffIds = users.map(user => user.childReferralCode.toString());

      const reffIdss = { userIds, reffIds, PreffIds }
      resolve(reffIdss);
      // });
    }).catch((err) => {
      // console.log(err);
      return reject(err);
    });
  };

  //   const referralCode = "your-referral-code";
  fetchUsersByReferralCode(referralCodes)
    .then(async (reffIdss) => {
      // console.log("res", gdata.referralCode);
      var datas = { userId: reffIdss.userIds, refferal: reffIdss.reffIds, Prefferal: reffIdss.PreffIds };
      res.status(200).send({ status: true, msg: `USERID:  ${datas.userId}, REFFERALCODE:  ${datas.refferal}, childRefferal:   ${datas.Prefferal}` });
    })

    .catch(error => {
      // console.error("Error fetching user IDs:", error);
    });

}

const deleteUser = async function (req, res) {
  try {

    const userId = req.params.userId
    if (userId == ':userId') return res.status(400).send({ status: false, msg: "Please Enter User Id" })
    let obj = { _id: userId, isDeleted: false }

    if (!(validator.isValid(userId))) {
      return res.status(400).send({ status: false, msg: `this userId is not valid` })
    }


    let deletedUser = await userModel.findOneAndUpdate(obj, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
    if (!deletedUser) {
      return res.status(404).send({ status: false, msg: 'User Not Found !!!' })
    }

    return res.status(200).send({ status: true, msg: "successfully deleted" })

  } catch (err) {

    res.status(500).send({ msg: "Error", error: err.msg })
  }
};

// const getAllDetailsBySells = async function (req, res) {

//   try {

//     // const { email } = req.body;

//     // const user = await Ruser.findOne({ email: email });
//     // if (!user) {
//     //   return res.status(404).send({ status: false, msg: 'User not found with provided email.' });
//     // }

//     // Check if the user is an admin before allowing KYC status update
//     // if (!user.isAdmin) {
//     //   return res.status(403).send({ status: false, msg: 'You are not authorized to access Admin Portal.' });
//     // }

//     const userDetails = await clientUser.find().exec();


//     const uniqueEmails = new Set();

//     userDetails.forEach(element => {
//       uniqueEmails.add(element.clientEmail);
//     });

//     // Now, `uniqueEmails` will contain unique clientEmail values
//     const uniqueEmailArray = [...uniqueEmails];

//     // Loop through the unique email array and fetch details for each email
//     for (const email of uniqueEmailArray) {

//       const userDetails1 = await Ruser.find().exec();
//       // Find the user details based on the current email
//       const users = userDetails1.filter(user => user.email === email);

//       // Do something with the details for this email (here, we're just logging the results)
//       console.log(`Details for email '${email}':`);
//       console.log(users);
//     }
//     // console.log()

//     if (userDetails) {
//       res.status(200).send({ status: true, msg: "User Profile details", data: userDetails })
//     }else{
//       res.status(400).send({ status: true, msg: "client details not found" })   
//     }
//   } catch (err) {
//     res.staus(500).send({ status: false, msg: err.msg })
//   }

// }

const sendEmail = async function (req, res) {
  try {
    // sending mail to subscribers
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "abelardo.labadie10@ethereal.email", // generated ethereal user
        pass: "Tnyg7kxHM1D7926d8t", // generated ethereal password
      },
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: 'saurabh7071468@gmail.com', // sender address
      to: 'recipient@example.com', // list of receivers
      subject: "Getting referralCode âœ”", // Subject line
      text: `Use This refferal Code`, // plain text body
      // html: `Use This refferal Code`, // html body
    });
    // console.log("msg sent: %s", info.messageId);
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    res.status(200).send({ status: true, msg: `email sent` });
  } catch (err) {
    // console.log(err)
    res.status(500).send({ status: false, msg: err.msg })
  }
}



module.exports = { ImagesList, deleteImageController, getAdminImagesList, registerAdmin, registerUser, clientDetails, getDetailsBySells, getAllDetailsBySells, updateClientDetails, kycOldUpdate, kycUpdate, AdminUpdate,updateUserAmount, insertBankDetails, getBankDetails, deleteBankDetailsByAccountNo, adminGetBankDetails, getDetailsByAdmin, uploadImage, getImages, loginUser, loginwithoutOTP, login, sendUserOTP, verifyOTP, updatePassword, getUser, UpdateUser, deleteUser, fetchReferrals, sendEmail, fetchUserReportingHierarchy,adminReportingHierarchy , adharvarification, validateaadhaarotp, panNumberrverification, adminBusinees, getadminbusinessCount, adminGetbusinessCount, adminDeleteBusinessReport }