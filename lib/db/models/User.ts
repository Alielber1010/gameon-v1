// C:\gameon-v1\lib\db\models\User.ts
import mongoose, { Schema } from "mongoose"
import bcrypt from "bcryptjs"

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  // SECURITY BEST PRACTICE: Set select: false here
  password: { type: String, select: false }, 
  image: { type: String }, 
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  provider: { type: String, default: "credentials" },
  bio: String,
  phoneNumber: String,
  location: String,
  
  // Account status
  isBanned: { type: Boolean, default: false },
  bannedAt: Date,
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  banReason: String,
  
  // AI Coach - Dify Chat App ID (unique per user)
  difyChatAppId: { type: String, unique: true, sparse: true },
  
  // Activity & Ratings
  gamesPlayed: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  
  // Activity history (completed games)
  activityHistory: [{
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    sport: String,
    date: Date,
    attended: { type: Boolean, default: true },
    ratingGiven: { type: Boolean, default: false }, // Whether user has rated others
    playersRated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track which players this user has rated in this game
    ratingsReceived: [{
      fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now },
    }],
  }],
}, { timestamps: true });

UserSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();

  if (!this.password.startsWith("$2b$")) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      return next(error as any); // cast to any to satisfy TS
    }
  }

  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
