// lib/db/models/SportsEvent.ts
import mongoose from 'mongoose'

const SportsEventSchema = new mongoose.Schema({
  // Event details from Dify
  title: { type: String, required: true },
  description: { type: String, required: true },
  city: { type: String, required: true },
  location: { type: String, required: true },
  website: { type: String },
  image: { type: String },
  
  // Metadata
  lastSyncedAt: { type: Date, default: Date.now },
  syncedFrom: { type: String, default: 'dify' }, // Track source
}, { timestamps: true })

// Indexes
SportsEventSchema.index({ city: 1 })
SportsEventSchema.index({ lastSyncedAt: -1 })
SportsEventSchema.index({ createdAt: -1 })

export default mongoose.models.SportsEvent || mongoose.model('SportsEvent', SportsEventSchema)



