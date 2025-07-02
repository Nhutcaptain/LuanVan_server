import express from "express";
const postController = require('../controllers/posts.controller')
const router = express.Router();

router.post('/post', postController.createPost);
router.get('/get/:slug',postController.getPost);

export default router;