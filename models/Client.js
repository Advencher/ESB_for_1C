//таблица для клиента
import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema(
  {
    Code1C: { type: String, required: true },
    cards: {type: Array, required: true },
    phone: { type: String, required: true },
    fullName: {type: String, required: true}
  },
  { timestamps: false, strict: false }
);

ClientSchema.options.toJSON = {
  transform: function(doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
  }
};
export default mongoose.model("Client", ClientSchema);
