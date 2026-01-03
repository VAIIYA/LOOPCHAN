import { MongoClient, GridFSBucket, Db } from 'mongodb';

const uri: string = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let gridFSBucket: GridFSBucket | null = null;
let db: Db | null = null;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Get database instance
export async function getDatabase(): Promise<Db> {
  if (!db) {
    const client = await clientPromise;
    db = client.db();
  }
  return db;
}

// Get GridFS bucket for file storage
export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (!gridFSBucket) {
    const database = await getDatabase();
    gridFSBucket = new GridFSBucket(database, { bucketName: 'files' });
  }
  return gridFSBucket;
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

