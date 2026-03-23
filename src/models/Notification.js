import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['game_start', 'win', 'system', 'deposit'],
    default: 'system',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  }
}, {
  timestamps: true
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
