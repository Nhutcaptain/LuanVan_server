import { Service } from "../models/service.model";
import { Specialty } from "../models/specialty.model";

export const createService = async(req: any, res: any) => {
    try{
        const data = req.body;
        if(!data) {
            return res.status(400).json({message: 'Thiêu thông tin'});
        }
        const result = await Service.create(data);
        if(result) {
            return res.status(201).json(result);
        }
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi phía server khi tạo dịch vụ'})
    }
} 

export const getServiceById = async(req: any, res: any) => {
    try{
        const {id} = req.params;
        if(!id) {
            return res.status(400).json({message: 'Thiếu thông tin'});
        }
        const result = await Service.findById(id);
        if(!result) {
            return res.status(404).json({message: 'Không tìm thấy dịch vụ này'});
        }
        return res.status(200).json(result);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi phía server'});
    }
}

export const getAllServices = async(req: any, res: any) => {
    try{
        const result = await Service.find();
        if(!result) {
            return res.status(404).json({message: 'Không tìm thấy dịch vụ nào'});
        }
        return res.status(200).json(result);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi phía server'});
    }
}

export const getBySpecialtyId = async(req: any, res: any) => {
    try{
        const {id} = req.params;
        if(!id) return res.status(400).json({message: 'Thiếu thông tin'});
        const specialty = await Specialty.findById(id).populate('serviceIds');

         if (!specialty) {
        return res.status(404).json({ message: 'Không tìm thấy chuyên khoa' });
        }

        if (!specialty.serviceIds || specialty.serviceIds.length === 0) {
        return res.status(404).json({ message: 'Không có dịch vụ nào' });
        }
        return res.status(200).json(specialty.serviceIds);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi ở server'});
    }
}
