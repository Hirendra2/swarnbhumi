const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
    
    
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    otpGenerated: {
        type: Date,
        default: Date.now
    },

}, { timestamps: true });

module.exports = mongoose.model('otp', otpSchema)