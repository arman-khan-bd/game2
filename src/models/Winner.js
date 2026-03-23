import mongoose from 'mongoose';

const WinnerSchema = new mongoose.Schema({
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
  username: {
    type: String,
    required: true,
  },
  ticketNumber: {
    type: String,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
  },
  prizeAmount: {
    type: Number,
    required: true,
  },
  isSettled: {
    type: Boolean,
    default: false,
  },
  drawDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

export default mongoose.models.Winner || mongoose.model('Winner', WinnerSchema);
