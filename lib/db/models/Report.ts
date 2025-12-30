// db/models/Report.ts
import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: {
    type: String,
    enum: ['inappropriate', 'spam', 'sexual'],
    required: true,
  },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  action: { type: String, enum: ['delete', 'keep'] },
  actionReason: String,
  actionDate: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);