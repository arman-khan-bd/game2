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
    enum: ['raffle', 'slot_raffle'],
    default: 'raffle',
  },
  total_tickets: {
    type: Number,
    default: 100,
  },
  ticket_price: {
    type: Number,
    default: 1,
  },
  auto_play_hours: {
    type: Number,
    default: 24,
  },
  next_winner_minutes: {
    type: Number,
    default: 10,
  },
  winners_count: {
    type: Number,
    default: 1,
  },
  prizes: [{
    rank: Number,
    percentage: Number,
  }],
  manual_winners: {
    type: Map,
    of: String,
    default: {},
  },
  is_bot_play: {
    type: Boolean,
    default: false,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  photo_url: {
    type: String,
    default: '',
  },
  instructions: {
    type: String,
    default: "Welcome to the game. Place your bets and wait for the system to finalize the sequence.",
  },
  draw_date: {
    type: Date,
  },
  draw_started_at: {
    type: Date,
  },
  current_winners: {
    type: Array,
    default: [],
  },
  current_winning_numbers: {
    type: Array,
    default: [],
  },
  current_step: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
  strict: false
});

export default mongoose.models.Game || mongoose.model('Game', GameSchema);
