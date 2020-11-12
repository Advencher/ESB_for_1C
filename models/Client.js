//таблица для клиента
import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema(
  {
    code1C: { type: String, required: true },
    cards: {type: Array, required: true },
    phone: { type: String, required: true },
    fullName: {type: String, required: true}
  },
  { timestamps: false }
);
export default mongoose.model("Client", ClientSchema);
//module.exports = mongoose.model("Client", ClientSchema);
