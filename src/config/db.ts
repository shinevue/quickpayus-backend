import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quickpayus');

    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', (error as Error).message);
    process.exit(1); // Exit with failure
  }
};

export default connectDB;
