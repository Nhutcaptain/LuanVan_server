import express from "express";
const postController = require('../controllers/posts.controller')
const router = express.Router();

router.post('/post', postController.createPost);
router.get('/get/:slug',postController.getPost);
router.get('/getById/:id', postController.getPostById);
router.put('/update/:id', postController.updatePost);

export default router;