import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserRelation extends Document {
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  relationType: 'parent' | 'child' | 'sibling' | 'spouse' | 'mother' | 'father';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const userRelationSchema = new Schema<IUserRelation>({
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'From user is required']
  },
  toUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'To user is required']
  },
  relationType: {
    type: String,
    enum: ['parent', 'child', 'sibling', 'spouse', 'mother', 'father'],
    required: [true, 'Relation type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate relations
userRelationSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

// Static method to get all relations for a user
userRelationSchema.statics.getUserRelations = async function(userId: Types.ObjectId) {
  return this.find({
    $or: [{ fromUser: userId }, { toUser: userId }],
    status: 'accepted'
  }).populate('fromUser toUser', 'username fullName profilePicture');
};

// Static method to get pending requests
userRelationSchema.statics.getPendingRequests = async function(userId: Types.ObjectId) {
  return this.find({
    toUser: userId,
    status: 'pending'
  }).populate('fromUser', 'username fullName profilePicture');
};

// Method to accept relation
userRelationSchema.methods.acceptRelation = async function() {
  this.status = 'accepted';
  await this.save();
};

// Method to reject relation
userRelationSchema.methods.rejectRelation = async function() {
  this.status = 'rejected';
  await this.save();
};

export default mongoose.model<IUserRelation>('UserRelation', userRelationSchema);