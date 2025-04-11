const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const visitorSchema = new mongoose.Schema({
    fullname:{
        type:String,
        required:true,
    },
    email:{
        type:String,
    },
    contact:{
        type:String,
    },
    purpose:{
        type:String,
    },
    hostEmployee:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host' 
    },
    organisation:{
        type:String
    },
    employeeId:{
        type:String
    },
    photo:{
        type:String,
    },
    status: {
        type: String,
        enum: ['Approved', 'Declined', 'Waiting', 'Checked-in', 'Checked-out'], // only these values allowed
        default: 'Waiting'
    },
    checkIn: {
        type: Date,
    },
    checkOut: {
        type: Date,
    },
    expectedCheckInFrom:{
        type: Date,
    },
    expectedCheckInTo:{
        type: Date,
    },
    preApproved:{
        type:Boolean,
        default:false
    },
    badge: {
        qrCode: {
          type: String, // base64 image or URL
        },
        issuedAt: {
          type: Date,
        }
    },
    gateId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gate' 
    }


},{
    timestamps: true
})

  module.exports = mongoose.model('Visitor', visitorSchema);