const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hostSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    department:{
        type:String
    },
    employeeId:{
        type:String
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    contact:{
        type:String
    },
    visits: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor' 
    }],
    preApproved:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor' 
    }],
    preApprovalLimit: {
        type: Number,
        default: 10,
        required: true
    },
    visitRequestQueue:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor' 
    }]
})

hostSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // Skip if not modified
    try {
      const salt = await bcrypt.genSalt(10); //?
      this.password = await bcrypt.hash(this.password, salt);//?
      next();
    } catch (err) {
      next(err);
    }
});

// Compare password method
hostSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  
  module.exports = mongoose.model('Host', hostSchema);