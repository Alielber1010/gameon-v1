// lib/db/models/AICoachMessage.ts
import mongoose, { Schema, Document } from "mongoose"

export interface IAICoachMessage extends Document {
  userId: mongoose.Types.ObjectId
  role: 'user' | 'assistant'
  message: string
  conversationId?: string // UUID format for Dify compatibility
  characterType?: 'coach' | 'nutritionist' | 'firstaid' // Track which character this conversation belongs to
  createdAt: Date
  updatedAt: Date
}

const AICoachMessageSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 5000 // Allow longer messages for AI responses
  },
  conversationId: {
    type: String,
    index: true
  },
  characterType: {
    type: String,
    enum: ['coach', 'nutritionist', 'firstaid'],
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
}, { timestamps: true })

// Index for efficient querying by user and time
AICoachMessageSchema.index({ userId: 1, createdAt: -1 })
AICoachMessageSchema.index({ conversationId: 1, createdAt: -1 })
// ARCHITECTURE: Each user has exactly ONE conversation per character type
// Index for efficient lookup of user's conversation per character
AICoachMessageSchema.index({ userId: 1, characterType: 1, conversationId: 1 })

export default mongoose.models.AICoachMessage || mongoose.model<IAICoachMessage>('AICoachMessage', AICoachMessageSchema)

