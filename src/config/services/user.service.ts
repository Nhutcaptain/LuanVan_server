import { User } from '../../models/user.model';

export async function fetchAllUsers() {
  return await User.find();
}