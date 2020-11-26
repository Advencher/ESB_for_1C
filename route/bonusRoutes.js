import { BonusController } from '../controller/BonusController.js';
import { AuthController } from '../controller/AuthController.js';
import { MongoController } from '../controller/MongoController.js';

export function makeRoutes (fastify, options) {

    let authController = new AuthController();
    let bonusController = new BonusController(fastify.mongo);
    let mongoController = new MongoController(fastify.mongoNative);

    const routes = [
        
    //1C api mimic    
    {
        method: 'GET',
        url: '/app/verify_client',
        preHandler: authController.verifyToken,
        handler: bonusController.verifyClient
    },

    //mongodb database methods
    {
        method: 'GET',
        url: '/app/query_data',
        preHandler: authController.verifyToken,
        handler: mongoController.queryData
    },
    {
        method: 'POST',
        url: '/app/sync_data',
        preHandler: authController.verifyToken,
        handler: mongoController.chageTableProperties
    },
    {
        method: 'POST',
        url: '/app/crud',
        preHandler: authController.verifyToken,
        handler: mongoController.updateCollection
    },
    //Auth methods
    {
        method: 'POST',
        url: '/auth/register',
        preHandler: [authController.verifyCodeword, authController.checkDuplecateUserName],
        handler: authController.signUp
    },
    {
        method: 'POST',
        url: '/auth/login',
        handler: authController.signIn
    },
    {
        method: 'GET',
        url: '/auth/me',
        preHandler: authController.verifyToken,
        handler: authController.currentUserInfo
    }]

    routes.forEach((route, index) => {
        fastify.route(route)})


    return fastify;
}
