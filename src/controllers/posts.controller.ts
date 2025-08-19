import { Post } from "../models/posts.model";

export const createPost = async (req: any, res: any) => {
  try {
    const postData = req.body;
    console.log("Received post data:", postData);

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

export const getAllPosts = async (req: any, res: any) => {
  try {
    let {
      page = 1,
      limit = 15,
      search = '',
      date = '',
      sortField = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter: any = {};

    // Tìm kiếm theo title hoặc content
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Lọc theo ngày (giả sử date là 'YYYY-MM-DD')
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: start, $lte: end };
    }

    // Sắp xếp
    const sort: any = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Lấy dữ liệu phân trang
    const posts = await Post.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      totalPages
    });
  } catch (error) {
    console.error(' Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

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

export const deletePost = async(req: any, res: any) => {
  try{
    const {id} = req.params;
    if(!id) return res.status(400).json({message: "Thiếu dữ liệu"});
    const post = await Post.findByIdAndDelete(id);
    if(!post) return res.status(404).json({message: "Không tìm thấy bài đăng"});
    return res.status(200).json({message: "Xóa bài đăng thành công"});
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: "Lỗi ở server"});
  }
}

export const getLatestPosts = async (req: any, res: any) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })   // sắp xếp mới nhất trước
      .limit(6)                  // giới hạn 6 bài

    res.status(200).json(posts);
  } catch (err) {
    console.error('Lỗi khi lấy bài viết:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy bài viết' });
  }
};

export const getPostList = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = (req.query.search as string) || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      posts,
      currentPage: page,
      totalPages,
      totalPosts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};
