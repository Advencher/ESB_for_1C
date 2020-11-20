
import mongoose from 'mongoose';

var UserSchema = new mongoose.Schema({  
    name: String,
    password: String
  },
{ timestamps: false });



export default mongoose.model('User', UserSchema);