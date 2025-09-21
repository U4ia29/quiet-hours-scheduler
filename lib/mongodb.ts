// lib/mongodb.ts
import { MongoClient } from "mongodb";

declare global {
/**
 * @ts-expect-error
 * Mongoose's global variable is not typed.
 */  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Add MONGODB_URI to .env");

const client = new MongoClient(uri);
const clientPromise = global._mongoClientPromise || (global._mongoClientPromise = client.connect());

export default clientPromise;
