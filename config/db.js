import mongoose from "mongoose";
import { default as mongodb } from "mongodb";
import nconf from "nconf";

let MongoClient = mongodb.MongoClient;

export async function dbConnector(fastify, options, done) {
  const MONGO_USERNAME = nconf.get("mongo:MONGO_USERNAME");
  const MONGO_PASSWORD = nconf.get("mongo:MONGO_PASSWORD");
  const MONGO_HOSTNAME = nconf.get("mongo:MONGO_HOSTNAME");
  const MONGO_PORT = nconf.get("mongo:MONGO_PORT");
  const MONGO_DB = nconf.get("mongo:MONGO_DB");
  const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
  try {
    const db = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database is connected via mangoose");
    fastify.decorate("mongo", db);
  } catch (err) {
    console.log(err);
  }

  try {
    let dbNative = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database is connected via native mongo driver");
	let existingNames = await dbNative.db("rapid_1c_requests").listCollections().toArray();
	let names = ["apies", "users"];
	for (let  collection of  existingNames) {
		if (collection.name === "apies" || collection.name === "users" ) {
			names.splice(names.indexOf(collection.name), 1);
		}
	}
	
	for (let name of names) {
		await dbNative.db("rapid_1c_requests").createCollection(name);
	}
	
 
    fastify.decorate("mongoNative", dbNative);
  } catch (err) {
	  console.log(err);
  }
}
