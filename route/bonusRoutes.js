import { BonusController } from '../controller/BonusController.js';
let bonusController = new BonusController();
export const routes = [{
        method: 'GET',
        url: '/api/verify_client',
        handler: bonusController.verifyClient
    },
    {
        method: 'GET',
        url: '/api/post/:id',
        handler: bonusController.fetchAllClients
    }
    /*
    {
        method: 'POST',
        url: '/api/post',
        handler: blogController.addNewPost,
    },
    {
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