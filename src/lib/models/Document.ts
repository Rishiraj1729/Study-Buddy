import { Schema, model, models, Model, Document as MongoDocument, Types } from 'mongoose';

export interface IDocument extends MongoDocument {
  userId: Types.ObjectId;
  title: string;
  content: string;
  originalText?: string;
  summary?: string;
  fileType: 'pdf' | 'text' | 'image' | 'handwritten';
  fileUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    originalText: String,
    summary: String,
    fileType: {
      type: String,
      enum: ['pdf', 'text', 'image', 'handwritten'],
      required: true,
    },
    fileUrl: String,
    tags: [String],
  },
  { 
    timestamps: true 
  }
);

// Add text index for search functionality
DocumentSchema.index({ title: 'text', content: 'text', tags: 'text' });
// Add index for user queries
DocumentSchema.index({ userId: 1, createdAt: -1 });

export const Document = (models.Document as Model<IDocument>) || model<IDocument>('Document', DocumentSchema);

export default Document; 