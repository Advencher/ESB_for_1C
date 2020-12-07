import fastify from 'fastify';
import {makeRoutes} from './route/bonusRoutes.js';
import fastifyPlugin from 'fastify-plugin';
import fastifyFormbody from 'fastify-formbody';
import middie from 'middie';
import {dbConnector} from './config/db.js';
import nconf from "nconf";

nconf.argv().env();

nconf.file({ file: './config/server_config.json' });

nconf.defaults({
    'http': {
      'serverAddress': 'localhost',
      'serverPort': 3000
    }
});


let app = fastify();
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

async function build () {
  await app.register(middie)
  await app.register(fastifyFormbody)
  await app.register(fastifyPlugin(dbConnector))
  return app
}



build()
  .then(app => makeRoutes(app))
  .then(app => {app.listen(nconf.get('http:serverPort'), nconf.get('http:serverAddress'))})
  .catch(error => {console.log(error)} )
