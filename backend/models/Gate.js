const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gateSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    loginId:{
        type:String,
        required:true,
        unique:true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
})

gateSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // Skip if not modified
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
});

// Compare password method
gateSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  
  module.exports = mongoose.model('Gate', gateSchema);