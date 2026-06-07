import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  referenceId?: Types.ObjectId;
  referenceType?: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'connection_request', 'connection_accepted', 'new_friend_request',
        'new_message', 'message_mention',
        'application_status', 'job_application', 'job_shortlisted', 'job_rejected',
        'listing_approved', 'listing_rejected', 'listing_cancelled',
        'new_job_posted', 'job_recommendation',
        'new_event_posted', 'event_registration', 'event_reminder', 'event_update', 'event_summary',
        'new_training_posted', 'training_registration',
        'new_follower', 'event_engagement',
        'weekly_summary', 'profile_trending', 'profile_views_stat', 'top_orgs_viewing',
        'org_verification', 'profile_incomplete', 'security_alert',
        'system_announcement', 'inquiry_received'
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceType: String,
    isRead: { type: Boolean, default: false, index: true },
    link: String,
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
