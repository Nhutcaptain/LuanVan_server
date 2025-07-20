import { Medicine } from "../models/medicine.model";

export const createMedicine = async(req: any, res: any) => {
    try{
        const data = req.body;
        if(!data) return res.status(400).json({message: 'Thiếu thông tin'});
        const medicine = await Medicine.create(data);
        if(!medicine) return res.status(404).json({message: 'Lỗi khi tạo thuốc'});

        return res.status(200).json(medicine);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi server'});
    }
}

export const getAll = async(req: any, res: any) => {
    try{
        const medicines = await Medicine.find();
        return res.status(200).json(medicines);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi server'});
    }
}