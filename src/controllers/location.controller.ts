import {Location} from '../models/location.model';
export const createLocation = async(req: any, res: any) => {
    try{
        const data = req.body;
        const result = await Location.create(data);
        if(!result) {
            return res.status(400).json({message: 'Tạo vị trí thất bại'});
        }

        return res.status(201).json(result);
    }catch(error) {
        console.error(error);
        return res.status(500).json(error);
    }
}

export const getAllLocation = async (req: any, res: any) => {
    try{
        const result = await Location.find();
        return res.status(201).json(result);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi từ server'});
    }
}
