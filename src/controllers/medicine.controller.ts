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

export const updateMedicine = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (!id || !data) {
            return res.status(400).json({ message: 'Thiếu thông tin' });
        }

        const medicine = await Medicine.findById(id);
        if (!medicine) {
            return res.status(404).json({ message: 'Không tìm thấy thuốc này' });
        }

        // Nếu có cập nhật stock thì cộng thêm số lượng mới vào stock hiện tại
        if (data.stock !== undefined && typeof data.stock === 'number') {
            data.stock = medicine.stock + data.stock;
        }

        const updatedMedicine = await Medicine.findByIdAndUpdate(id, data, {
            new: true
        });

        return res.status(200).json(updatedMedicine);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi server' });
    }
}