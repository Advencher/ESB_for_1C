import fastifyPlugin from 'fastify-plugin';
import mongoose from 'mongoose';

export async function dbConnector(fastify, options) {
  try {
    const url = "mongodb://localhost:27017/rapid_1c_requests";
    const db = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Database is connected");
    fastify.decorate("mongo", db);
  } catch (err) {
    console.log(err);
  }
}

