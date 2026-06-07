import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  sentAt: Date;
  deletedBy: Types.ObjectId[];
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: Date,
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    attachmentUrl: String,
    attachmentName: String,
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: false }
);

MessageSchema.index({ conversationId: 1, sentAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);
