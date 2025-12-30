// db/models/Game.ts
import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  age: Number,
  skillLevel: String,
  image: String,
  whatsApp: String,
  joinedAt: { type: Date, default: Date.now },
});

const JoinRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  age: Number,
  skillLevel: String,
  image: String,
  whatsApp: String,
  requestedAt: { type: Date, default: Date.now },
});

const GameSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  sport: {
    type: String,
    required: true,
    enum: ['basketball', 'football', 'tennis', 'volleyball', 'badminton', 'pingpong', 'cricket'], // add your full list
  },
  description: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    city: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  date: { type: Date, required: true }, // Use full Date, frontend formats to string
  startTime: { type: String, required: true }, // e.g., "18:00"
  endTime: { type: String, required: true },
  maxPlayers: { type: Number, required: true, min: 2 },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all'],
    default: 'all',
  },
  minSkillLevel: String, // optional stricter filter
  image: { type: String, default: '/default-game.jpg' },

  // Players who are confirmed
  registeredPlayers: [PlayerSchema],

  // Optional team split (for team sports)
  teamBlue: [PlayerSchema],
  teamRed: [PlayerSchema],

  // Pending join requests (host approves/rejects)
  joinRequests: [JoinRequestSchema],

  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },

  hostWhatsApp: String, // can pull from host later, or store explicitly
}, { timestamps: true });

// Indexes for fast queries
GameSchema.index({ sport: 1, date: -1, status: 1 });
GameSchema.index({ location: '2dsphere' }); // if using geo queries later
GameSchema.index({ hostId: 1 });

export default mongoose.models.Game || mongoose.model('Game', GameSchema);