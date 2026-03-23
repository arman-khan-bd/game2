import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  ticketNumbers: {
    type: [String],
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'winning', 'expired'],
    default: 'active',
  },
  rank: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
