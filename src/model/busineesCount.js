const mongoose = require("mongoose");
const businessSchema = new mongoose.Schema({
       
    email: {
        type: String,
        required: true
    },
    totalBusinessAmount: {
        type: String,
        required: true
    },
    tds: {
        type: Number,
        required: true
    },
    platformCharges: {
        type: Number,
        required: true
    },
    numberOfProjects: {
        type: Number,
        required: true
    },
    pending: {
        type: Number
    },
    advance: {
        type: Number
    }

}, { timestamps: true });

module.exports = mongoose.model('busineesCount', businessSchema)