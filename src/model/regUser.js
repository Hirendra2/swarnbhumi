const mongoose = require("mongoose");
const regSchema = new mongoose.Schema({

    userUniqueId: {
        type: Number,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    middleName: {
        type: String
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true

    },
    // otp:{
    //     type: String
    // },
    // otpExpiry: {
    //     type: Date
    // },
    referralCode:{type: String},
    childReferralCode:{
        type: String,
        required: true,
    },
    dob: {
        type: String
    },
    contactMobileNumber:{
        type: String
    },
    whatsAppMobileNumber:{
        type: String
    },
    profileImage:{
        type: String
    },
    panCardNumber:{
        type: String
    },
    panCardImage:{
        type: String
    },
    adharCardNumber:{
        type: String
    },
    adharCardFrontImage:{
        type: String
    },
    adharCardBackImage:{
        type: String
    },
    amount: {
        type: Number
    },
    addressDetails: {
          address: {type: String, trim: true},
          state: {type: String, trim: true},
          city: {type: String, trim: true},
          pincode: {type: String, trim: true}
        },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: null
    },
    deletedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    designation: {
        type: String
    },
    isAdmin: { type: Boolean, default: false },
    kycStatus: { type: String, default: 'notApplied', enum: ['notApplied', 'pending', 'active', 'reject'] },

}, { timestamps: true });

module.exports = mongoose.model('regProf', regSchema)