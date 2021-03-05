import fastify from "fastify";
import fastifyPlugin from "fastify-plugin";
import fastifyFormbody from "fastify-formbody";
import middie from "middie";
import nconf from "nconf";
import helmet from "fastify-helmet";
import { dbConnector } from "./config/db.js";
import { makeRoutes } from "./route/bonusRoutes.js";

class ApplicationESB {
  constructor(input, flags) {
    this.flags = flags;
    this.input = input;
  }

  startServer() {

    nconf.argv().env();
    nconf.file({ file: "./config/server_config.json" });
    nconf.defaults({
      http: {
        serverAddress: "localhost",
        serverPort: 3000,
      },
    });

    let app = fastify();
    app.get("/", async () => {
      return {
        Message: "Welcome to 1С ESB",
      };
    });

    app.addContentTypeParser(
      "application/jsoff",
      function (request, payload, done) {
        jsoffParser(payload, function (err, body) {
          done(err, body);
        });
      }
    );

    async function build() {
      await app.register(middie);
      await app.register(fastifyPlugin(dbConnector));
      await app.register(helmet, { contentSecurityPolicy: false });
      await app.register(fastifyFormbody);
      return app;
    }

    build()
      .then((app) => makeRoutes(app))
      .then((app) => {
        app.listen(
          nconf.get("http:serverPort"),
          nconf.get("http:serverAddress")
        );
      })
      .catch((error) => {
        console.log(error);
      });
  }

}

const runApp = new ApplicationESB();
runApp.startServer();
