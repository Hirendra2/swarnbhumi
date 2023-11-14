const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
    
    email: {
        type: String
    },
    uploadedImages: {
        type: Array
    }

}, { timestamps: true });

module.exports = mongoose.model('adminImage', adminSchema)