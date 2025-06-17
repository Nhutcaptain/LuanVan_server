import { Request, Response } from 'express';
import { User } from '../models/user.model';

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await User.find();
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const newUser = new User(req.body);
  await newUser.save();
  res.status(201).json(newUser);
};

export const updateUser = async (req: any, res: Response) => {
  const userId = req.user.userId;
  const profileData = req.body;
  try{
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { $set: profileData },
      { new: true, runValidators: true, context: 'query' }//mew: true để trả về bản ghi đã cập nhật
    ).select('-password -__v'); // Loại bỏ password và __v khỏi kết quả trả về
    if(!updateUser) {
      return res.status(404).json({message: 'Không tìm thấy người dùng.'});
    }
    return res.status(200).json({message: 'Cập nhật thông tin người dùng thành công.', user: updateUser});
  }catch(error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Lỗi khi cập nhật thông tin người dùng.' });
  }
}