//import fastifyPlugin from 'fastify-plugin'
import mongoose from 'mongoose';
import { default as mongodb } from 'mongodb';
let MongoClient = mongodb.MongoClient;

const MONGO_USERNAME = 'mongoadmin';
const MONGO_PASSWORD = 'whereismyboner';
const MONGO_HOSTNAME = 'localhost';
const MONGO_PORT = '27017';
const MONGO_DB = 'rapid_1c_requests';

export async function dbConnector(fastify, options, done) {

  const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
  try {
    //const url = "mongodb://localhost:27017/rapid_1c_requests";
    const db = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Database is connected via mangoose");
    fastify.decorate("mongo", db);

  } catch (err) {
    console.log(err);
  }

  try {
    //const url = "mongodb://localhost:27017/rapid_1c_requests";
    const dbNative = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Database is connected via native mongo driver");
    fastify.decorate("mongoNative", dbNative);

  } catch (err) {
    console.log(err);
  }

}
