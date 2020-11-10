//таблица для клиента
import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema(
  {
    code1C: { type: String, required: true },
    pair: { type: Object, required: true },
  },
  { timestamps: false }
);
mongoose.model("Client", ClientSchema);
//module.exports = mongoose.model("Client", ClientSchema);
