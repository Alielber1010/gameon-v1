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
    // Removed enum restriction to allow all sports/activities
    // Validation happens at API level using SPORTS constant
  },
  description: { type: String, required: true },
  location: {
    address: { type: String, required: true }, // Google Maps link
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    // NOTE: Removed geoJSON field since we're not using geospatial queries
    // If you need geospatial queries in the future, add this back:
    // geoJSON: {
    //   type: { type: String, enum: ['Point'] },
    //   coordinates: { type: [Number] }, // [lng, lat] format
    // },
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

  // Attendance tracking
  attendance: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attended: { type: Boolean, default: false },
    markedAt: Date,
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Host who marked attendance
  }],

  // Game completion
  completedAt: Date,
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Host who completed the game
}, { timestamps: true });

// Indexes for fast queries
GameSchema.index({ sport: 1, date: -1, status: 1 });
GameSchema.index({ hostId: 1 });
GameSchema.index({ 'location.city': 1 }); // Index for city searches

// NOTE: Removed 2dsphere index since we're not using geospatial queries
// If you need geospatial queries in the future, uncomment and ensure geoJSON is always created:
// GameSchema.index({ 'location.geoJSON': '2dsphere' }, { 
//   sparse: true,
//   name: 'location_geoJSON_2dsphere'
// });

export default mongoose.models.Game || mongoose.model('Game', GameSchema);