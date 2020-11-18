import { BonusController } from '../controller/BonusController.js';
import { AuthController } from '../controller/AuthController.js';

let authController = new AuthController();
let bonusController = new BonusController();

export const routes = [{
        method: 'GET',
        url: '/app/verify_client',
        handler: bonusController.verifyClient
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
    }

   /* {
        method: 'PUT',
        url: '/api/post/:id',
        handler: blogController.updatePost
    },
    {
        method: 'DELETE',
        url: '/api/post/:id',
        handler: blogController.deletePost
    }*/
]
//module.exports.routes = routes