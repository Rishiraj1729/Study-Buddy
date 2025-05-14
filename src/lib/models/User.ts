import { Schema, model, models, Model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    image: String,
    emailVerified: Date,
  },
  { 
    timestamps: true 
  }
);

// This is a safer approach to handle model creation in Next.js environment
// Mongoose models are cached, so this prevents "model overwrite" errors
export const User = (models?.User || model<IUser>('User', UserSchema)) as Model<IUser>;

export default User; 