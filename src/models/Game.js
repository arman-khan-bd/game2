import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  game_type: {
    type: String,
    enum: ['slots', 'raffle', 'crash', 'roulette', 'slot_raffle'],
    default: 'slots',
  },
  instructions: {
    type: String,
    default: '',
  },
  photo_url: {
    type: String,
    default: '',
  },
  min_bet: {
    type: Number,
    default: 1,
  },
  max_bet: {
    type: Number,
    default: 1000,
  },
  preset_bets: {
    type: [Number],
    default: [],
  },
  auto_play_seconds: {
    type: Number,
    default: 5,
  },
  payout_multiplier: {
    type: Number,
    default: 1.0,
  },
  min_players: {
    type: Number,
    default: 1,
  },
  max_players: {
    type: Number,
    default: 100,
  },
  is_active: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

export default mongoose.models.Game || mongoose.model('Game', GameSchema);
