const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://keerthanasistla10:kinnected01@kinnected.umu6b5j.mongodb.net/?retryWrites=true&w=majority&appName=Kinnected')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define UserRelation model
const userRelationSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relationType: {
    type: String,
    enum: ['mother', 'father', 'sibling', 'spouse', 'child'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  isPlaceholder: {
    type: Boolean,
    default: false
  },
  fullName: String,
  nickname: String,
  description: String,
  placeholderId: String
}, {
  timestamps: true
});

const UserRelation = mongoose.model('UserRelation', userRelationSchema);

// Function to fix placeholder relations
async function fixPlaceholderRelations() {
  try {
    // Find all placeholder relations
    const placeholderRelations = await UserRelation.find({ isPlaceholder: true });
    console.log(`Found ${placeholderRelations.length} placeholder relations`);

    // Group by fromUser and relationType to identify duplicates
    const groupedRelations = {};
    placeholderRelations.forEach(relation => {
      const key = `${relation.fromUser}_${relation.relationType}`;
      if (!groupedRelations[key]) {
        groupedRelations[key] = [];
      }
      groupedRelations[key].push(relation);
    });

    // Fix duplicates
    let fixedCount = 0;
    for (const key in groupedRelations) {
      const relations = groupedRelations[key];
      if (relations.length > 1) {
        console.log(`Found ${relations.length} duplicate relations for key: ${key}`);
        
        // Keep the first one, delete the rest
        for (let i = 1; i < relations.length; i++) {
          await UserRelation.findByIdAndDelete(relations[i]._id);
          fixedCount++;
        }
      }
    }

    console.log(`Fixed ${fixedCount} duplicate placeholder relations`);
    
    // Ensure all placeholder relations have a placeholderId
    const relationsWithoutId = await UserRelation.find({ 
      isPlaceholder: true, 
      placeholderId: { $exists: false } 
    });
    
    for (const relation of relationsWithoutId) {
      relation.placeholderId = new mongoose.Types.ObjectId().toString();
      await relation.save();
    }
    
    console.log(`Added placeholderId to ${relationsWithoutId.length} relations`);
    
    // Drop and recreate indexes
    await UserRelation.collection.dropIndexes();
    console.log('Dropped all indexes');
    
    // Recreate indexes
    await UserRelation.collection.createIndex(
      { fromUser: 1, toUser: 1 },
      { 
        unique: true, 
        partialFilterExpression: { 
          isPlaceholder: false,
          toUser: { $exists: true }
        } 
      }
    );
    
    await UserRelation.collection.createIndex(
      { fromUser: 1, fullName: 1, relationType: 1 },
      { 
        unique: true, 
        partialFilterExpression: { 
          isPlaceholder: true
        } 
      }
    );
    
    console.log('Recreated indexes');
    
    console.log('Fix completed successfully');
  } catch (error) {
    console.error('Error fixing placeholder relations:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the fix
fixPlaceholderRelations(); 