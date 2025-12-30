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
