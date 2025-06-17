import express from "express";
import { createPost } from "../controllers/posts.controller";
const router = express.Router();

router.post('/post', createPost);

export default router;