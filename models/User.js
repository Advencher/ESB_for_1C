
import mongoose from 'mongoose';

var UserSchema = new mongoose.Schema({  
    name: String,
    password: String
  },
{ timestamps: false, strict: false});

export default mongoose.model('User', UserSchema);