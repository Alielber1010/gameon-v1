// socket-server/models/Message.ts
import mongoose from "mongoose"

const MessageSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true,
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  userImage: { 
    type: String 
  },
  message: { 
    type: String, 
    required: true,
    maxlength: 1000 // Limit message length
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
}, { timestamps: true })

// Index for efficient querying by game and time
MessageSchema.index({ gameId: 1, createdAt: -1 })

export default mongoose.models.Message || mongoose.model('Message', MessageSchema)
