import { Post } from "../models/posts.model";

export const createPost = async (req: any, res: any) => {
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
};

export const getPost = async (req: any, res: any) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ message: "Không có slug" });
    }
    const result = await Post.findOne({ slug }).lean();
    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy bài dăngd" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
  }
};

export const getPostById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Thiếu dữ liệu" });

    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    return res.status(200).json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi ở server" });
  }
};

export const updatePost = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Kiểm tra xem bài viết có tồn tại không
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

    // Cập nhật bài viết
    const updatedPost = await Post.findByIdAndUpdate(id, data, {
      new: true, // Trả về dữ liệu sau khi cập nhật
      runValidators: true, // Chạy validate của schema
    });

    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
