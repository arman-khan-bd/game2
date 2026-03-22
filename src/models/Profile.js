import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  full_name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    default: '',
  },
  photo_url: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    default: 'managed_by_firebase'
  },
  agent_id: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  ip_address: {
    type: String,
    default: '',
  },
  balance: {
    type: Number,
    default: 1000,
  },
  role: {
    type: String,
    default: 'user',
  },
  status: {
    type: String,
    default: 'active',
  },
  total_wagered: {
    type: Number,
    default: 0,
  },
  total_won: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true // Gives createdAt and updatedAt automatically
});

// Since Next.js reloads heavily in dev, prevent model recompilation error
export default mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
