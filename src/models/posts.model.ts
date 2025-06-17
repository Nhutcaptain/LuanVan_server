import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
   content: {
        type: Object,
        required: true
   }
}, { timestamps: true });
export const Post = mongoose.model("Post", postSchema);