import mongoose from 'mongoose';

// User Schema for authentication
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: 'Anonymous',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Post Schema
const PostSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  threadId: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    default: null,
  },
  imageFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  videoFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  authorId: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Thread Schema
const ThreadSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  opPostId: {
    type: String,
    required: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  replyCount: {
    type: Number,
    default: 0,
  },
  imageCount: {
    type: Number,
    default: 0,
  },
  videoCount: {
    type: Number,
    default: 0,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// File metadata schema (for GridFS files)
const FileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for cleanup queries
  },
  uploadedBy: {
    type: String,
    required: true,
  },
  gridFSFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// User Profile Schema - stores user profile information linked to wallet address
const UserProfileSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    default: null,
    maxlength: 50,
  },
  location: {
    type: String,
    default: null,
    maxlength: 100,
  },
  socialLinks: {
    x: {
      type: String,
      default: null,
    },
    youtube: {
      type: String,
      default: null,
    },
  },
  bio: {
    type: String,
    default: null,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Mod Schema - stores wallet addresses that are mods
const ModSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  addedBy: {
    type: String, // Admin wallet address
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Export models (use existing if already compiled)
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Thread = mongoose.models.Thread || mongoose.model('Thread', ThreadSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export const File = mongoose.models.File || mongoose.model('File', FileSchema);
export const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);
export const Mod = mongoose.models.Mod || mongoose.model('Mod', ModSchema);

