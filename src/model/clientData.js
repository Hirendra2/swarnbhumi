const mongoose = require("mongoose");
const clientSchema = new mongoose.Schema({

    userUniqueId: {
        type: Number,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    sellerEmail: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: String
    },
    contactMobileNumber: {
        type: String
    },
    whatsAppMobileNumber: {
        type: String
    },
    minimumSellingRate: {
        type: String
    },
    sales: {
        type: String
    },
    clientDetails: {
        address: { type: String, trim: true },
        state: { type: String, trim: true },
        city: { type: String, trim: true },
        pincode: { type: String, trim: true }
    },
    siteDetails: {
        address: { type: String, trim: true },
        state: { type: String, trim: true },
        city: { type: String, trim: true },
        pincode: { type: String, trim: true }
    },
    status: {
        type: String
    },
    description: {
        type: String
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

module.exports = mongoose.model('clientProfile', clientSchema)