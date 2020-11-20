import { BonusController } from '../controller/BonusController.js';
import { AuthController } from '../controller/AuthController.js';


export function makeRoutes (fastify, options) {

    let authController = new AuthController();
    let bonusController = new BonusController(fastify.mongo);

    const routes = [{
        method: 'GET',
        url: '/app/verify_client',
        preHandler: authController.verifyToken,
        handler: bonusController.verifyClient
    },
    
    {
        method: 'GET',
        url: '/app/query_data',
        preHandler: authController.verifyToken,
        handler: bonusController.queryData
    },
    {
        method: 'GET',
        url: '/api/post/:id',
        handler: bonusController.fetchAllClients
    },
    {
        method: 'POST',
        url: '/app/sync_data',
        preHandler: authController.verifyToken,
        handler: bonusController.chageTableProperties
    },
    
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
