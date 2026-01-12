// db/models/Notification.ts
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'join_request_accepted',
      'join_request_rejected',
      'join_request_sent', // For users when they send a join request
      'game_cancelled',
      'game_updated',
      'new_join_request', // For hosts when someone requests to join
      'player_left',
      'game_reminder',
      'host_assigned', // When a user is assigned as the new host of a game
      'game_attended', // When host marks player as attended
      'game_completed', // When game is marked as completed
      'admin_message', // Admin notifications to users
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For join requests, the user who requested
  read: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

// Indexes for fast queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Delete existing model if it exists to ensure schema updates are applied
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model('Notification', NotificationSchema);

