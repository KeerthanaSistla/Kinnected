import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  profilePicture?: string;

  privacySettings?: {
    profileVisibility: 'public' | 'private' | 'connections';
    hideFromGlobalSearch: boolean;
    blockList: string[]; // Array of User IDs
  };

  familyTreePreferences?: {
    defaultCenterNode: 'self' | 'lastViewed';
    showPlaceholderNodes: boolean;
    animationSpeed: number;
    enableAnimations: boolean;
    nodeSize: number;
    layoutStyle: 'standard' | 'compact';
  };

  notificationSettings?: {
    inAppNotifications: boolean;
    connectionRequestAlerts: boolean;
    nicknameEditAlerts: boolean;
  };

  dataControls?: Record<string, unknown>;

  relationManagementSettings?: {
    manageSuggestedRelations: boolean;
    allowOthersToSuggestRelations: boolean;
    customRelationshipLabels: { key: string; label: string }[];
  };

  appPreferences?: {
    theme: 'light' | 'dark' | 'custom';
    fontSize: number;
    defaultLandingPage: 'home' | 'profile' | 'tree';
  };

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  location: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String
  },

  // New settings fields
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'private', 'connections'], default: 'public' },
    hideFromGlobalSearch: { type: Boolean, default: false },
    blockList: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  familyTreePreferences: {
    defaultCenterNode: { type: String, enum: ['self', 'lastViewed'], default: 'self' },
    showPlaceholderNodes: { type: Boolean, default: true },
    animationSpeed: { type: Number, default: 1 }, // 1x speed
    enableAnimations: { type: Boolean, default: true },
    nodeSize: { type: Number, default: 100 }, // example size
    layoutStyle: { type: String, enum: ['standard', 'compact'], default: 'standard' }
  },
  notificationSettings: {
    inAppNotifications: { type: Boolean, default: true },
    connectionRequestAlerts: { type: Boolean, default: true },
    nicknameEditAlerts: { type: Boolean, default: true }
  },
  dataControls: {
    // No direct fields needed, handled via API
  },
  relationManagementSettings: {
    manageSuggestedRelations: { type: Boolean, default: true },
    allowOthersToSuggestRelations: { type: Boolean, default: true },
    customRelationshipLabels: [{ key: String, label: String }]
  },
  appPreferences: {
    theme: { type: String, enum: ['light', 'dark', 'custom'], default: 'light' },
    fontSize: { type: Number, default: 14 },
    defaultLandingPage: { type: String, enum: ['home', 'profile', 'tree'], default: 'home' }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;