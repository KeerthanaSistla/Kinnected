import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

export interface IUserRelation extends Document {
  fromUser: Types.ObjectId | IUser;
  toUser?: Types.ObjectId | IUser;
  relationType: 'mother' | 'father' | 'sibling' | 'spouse' | 'child' | string;
  status: 'pending' | 'accepted' | 'rejected';
  isPlaceholder: boolean;
  nickname?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  placeholderId?: string;
}

// Move the validation logic outside the schema
function isToUserRequired(this: any): boolean {
  return !this.isPlaceholder;
}

function generatePlaceholderId(this: any): string | undefined {
  return this.isPlaceholder ? new Types.ObjectId().toString() : undefined;
}

const userRelationSchema = new Schema<IUserRelation>(
  {
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'From user is required'],
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: isToUserRequired,
    },
    relationType: {
      type: String,
      enum: ['mother', 'father', 'sibling', 'spouse', 'child'],
      required: [true, 'Relation type is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    isPlaceholder: {
      type: Boolean,
      default: false,
    },
    nickname: String,
    description: String,
    placeholderId: {
      type: String,
      default: generatePlaceholderId,
    },
  },
  {
    timestamps: true,
  }
);

// Drop existing indexes before creating new ones
userRelationSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // For placeholder relations, ensure we have a unique placeholderId
      if (this.isPlaceholder && !this.placeholderId) {
        this.placeholderId = new Types.ObjectId().toString();
      }
    } catch (error) {
      console.error('Error in pre-save hook:', error);
    }
  }
  next();
});

// Index for real user relations
userRelationSchema.index(
  { fromUser: 1, toUser: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isPlaceholder: false,
      toUser: { $exists: true },
    },
  }
);

// Additional index for placeholder relations using placeholderId
userRelationSchema.index(
  { fromUser: 1, placeholderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isPlaceholder: true,
      placeholderId: { $exists: true },
    },
  }
);

export default mongoose.model<IUserRelation>('UserRelation', userRelationSchema);
