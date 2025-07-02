import { Post } from "../models/posts.model";

export const createPost = async(req: any, res: any) => {
    try {
        const postData = req.body;

        if (!postData) {
            return res.status(400).json({ message: "Content is required" });
        }

        const newPost = new Post(postData);
        await newPost.save();

        return res.status(201).json(newPost);
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getPost = async(req: any, res: any) => {
    try{
        const {slug} = req.params;
        if(!slug) {
            return res.status(400).json({message: 'Không có slug'});
        }
        const result = await Post.findOne({slug}).lean();
        if(!result) {
            return res.status(404).json({message: 'Không tìm thấy bài dăngd'});
        }

        return res.status(200).json(result);
    }catch(error) {
        console.error(error);
    }
}