import fastify from 'fastify';
import {routes} from './route/bonusRoutes.js';
import {dbConnector} from './config/db.js'; 
import fastifyPlugin from 'fastify-plugin';
import fastifyFormbody from 'fastify-formbody';
import middie from 'middie';

const PORT = process.env.PORT || 3000;

const app = fastify();
app.get("/", async () => {
    return {
      Message: "Welcome to 1С API middleware"
    }
});


app.addContentTypeParser('application/jsoff', function (request, payload, done) {
  jsoffParser(payload, function (err, body) {
    done(err, body)
  })
})


routes.forEach((route, index) => {
  app.route(route)})

async function build () {
  await app.register(middie)
  await app.register(fastifyFormbody)
  await app.register(fastifyPlugin(dbConnector))
  return app
}

build()
  .then(app => app.listen(3000))
  .catch(console.log)
