import { BonusController } from "../controller/BonusController.js";
import { AuthController } from "../controller/AuthController.js";
import { MongoController } from "../controller/MongoController.js";

export function makeRoutes(fastify, options) {
  let authController = new AuthController();
  let bonusController = new BonusController(fastify.mongoNative);
  let mongoController = new MongoController(fastify.mongoNative);

  const routes = [
    //api methods
    {
      method: "GET",
      url: "/app/verify_client",
      preHandler: authController.verifyToken,
      handler: bonusController.verifyClient
    },
    {
      method: "POST",
      url: "/app/api_factory",
      preHandler: authController.verifyToken,
      handler: bonusController.factoryAPI
    },
    {
      method: "POST",
      url: "/app/api_client",
      preHandler: authController.verifyToken,
      handler: bonusController.apiClient
    },
    {
      method: "POST",
      url: "/app/api_insert",
      preHandler: authController.verifyToken,
      handler: bonusController.insertApi
    },

    {
      method: "GET",
      url: "/app/query_data",
      preHandler: authController.verifyToken,
      handler: mongoController.queryData
    },
    {
      method: "POST",
      url: "/app/table_factory",
      preHandler: authController.verifyToken,
      handler: mongoController.chageTableProperties
    },
    {
      method: "POST",
      url: "/app/crud",
      preHandler: authController.verifyToken,
      handler: mongoController.updateCollection
    },
    {
      method: "POST",
      url: "/app/delete_table",
      preHandler: authController.verifyToken,
      handler: mongoController.deleteTable
    },
    //Auth methods
    {
      method: "POST",
      url: "/auth/reg",
      preHandler: authController.registerChecks,
      handler: authController.registerNewUser
    },
    {
      method: "POST",
      url: "/auth/login",
      handler: authController.signIn
    },
    {
      method: "GET",
      url: "/auth/me",
      preHandler: authController.verifyToken,
      handler: authController.currentUserInfo
    }
  ];

  routes.forEach((route, index) => {
    fastify.route(route);
  });

  return fastify;
}
