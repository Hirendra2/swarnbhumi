const mongoose = require("mongoose");
const bankSchema = new mongoose.Schema({
    
    accountHolderName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    account_Number: {
        type: String,
        required: true
    },
    confirmAccount_Number: {
        type: String,
        required: true
    },
    IFSC_Code: {
        type: String,
        required: true
    },
    branchName: {
         type: String,
         required: true
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

}, { timestamps: true });

module.exports = mongoose.model('bankProfile', bankSchema)