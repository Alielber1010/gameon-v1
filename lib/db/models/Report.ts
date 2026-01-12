// db/models/Report.ts
import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  // Report can be about a game OR a user (at least one must be present)
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Reported user
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate', 'fake_scam', 'violence', 'other'],
    required: true,
  },
  description: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs (1-3 images)
  status: { 
    type: String, 
    enum: ['pending', 'resolved', 'dismissed'], 
    default: 'pending' 
  },
  action: { type: String, enum: ['delete', 'keep', 'dismiss'] },
  actionReason: String,
  actionDate: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { 
  timestamps: true,
  strictPopulate: false // Allow populating fields that might not exist in all documents
});

// Validation: At least one of gameId or userId must be present
ReportSchema.pre('validate', function(next) {
  if (!this.gameId && !this.userId) {
    next(new Error('Report must have either a gameId or userId'));
  } else {
    next();
  }
});

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ gameId: 1 });
ReportSchema.index({ userId: 1 });
ReportSchema.index({ reportedBy: 1 });

// Delete existing model if it exists to ensure schema updates are applied
if (mongoose.models.Report) {
  delete mongoose.models.Report;
}

export default mongoose.model('Report', ReportSchema);