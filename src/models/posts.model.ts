import mongoose from "mongoose";
import slugify from "slugify";

const postSchema = new mongoose.Schema({
   content: {
        type: Object,
        required: true
   },
   title: {
      type: String,
      required: true,
   },
   thumbnailUrl: {
      type: String,
   },
   slug: String,
   summary: String,
   author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
   },

}, { timestamps: true });

postSchema.pre('save', async function (next) {
   const doc = this as any
   if(!doc.isModified('title')) return next();

   doc.slug = slugify(doc.title, {
    lower: true,
    strict: true,
    locale: 'vi',
  });

  next();
})
export const Post = mongoose.model("Post", postSchema);