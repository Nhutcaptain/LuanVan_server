import { Post } from "../models/posts.model";

export const createPost = async(req: any, res: any) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        const newPost = new Post({ content });
        await newPost.save();

        return res.status(201).json(newPost);
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}