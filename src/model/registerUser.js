const mongoose = require("mongoose");
const registerSchema = new mongoose.Schema({

    userUniqueId: {
        type: String,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    middleName: {
        type: String,
        default: "0"
    },
    lastName: {
        type: String,
        default: "0"
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
    level:{
        type: Number,
        default: "0"
    },
    referralCode:{type: String},
    childReferralCode:{
        type: String,
        required: true,
    },
    dob: {
        type: String,
        default: "0"
    },
    contactMobileNumber:{
        type: String,
        default: "0"
    },
    whatsAppMobileNumber:{
        type: String,
        default: "0"
    },
    profileImage:{
        type: String,
        default: "0"
    },
    panCardNumber:{
        type: String,
        default: "0"
    },
    panCardImage:{
        type: String,
        default: "0"
    },
    adharCardNumber:{
        type: String,
        default: "0"
    },
    adharCardFrontImage:{
        type: String,
        default: "0"
    },
    adharCardBackImage:{
        type: String,
        default: "0"
    },
    adharVerified: {
        type: Boolean,
        default: false
    },
    amount: {
        type: Number,
        default: 0
    },
    address: {type: String, trim: true,default: "0"},
    state: {type: String, trim: true,default: "0"},
    city: {type: String, trim: true,default: "0"},
    pincode: {type: String, trim: true,default: "0"},
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
        type: String,
        default: "0"
    },
    isAdmin: { type: Boolean, default: false },
    kycStatus: { type: String, default: 'notApplied', enum: ['notApplied', 'pending', 'active', 'reject'] },

}, { timestamps: true });

module.exports = mongoose.model('registerProfile', registerSchema)