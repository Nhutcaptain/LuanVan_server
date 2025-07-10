import { Examination } from '../models/examination.model';
import  { HealthStatus } from '../models/heathstatus.model';
import { Patient } from '../models/patient.model';
import { User } from '../models/user.model';

export const createHealthStatus = async(req: any, res: any) => {
    try {
        const statusData = req.body;
        const newStatus = new HealthStatus(statusData);
        await newStatus.save();

        return res.status(201).json(newStatus);

    }catch(error) {
        console.error('Lỗi khi tạo tình trạng sức khoẻ', error);
        return res.status(500).json({message: 'Lỗi từ server khi tạo tình trạng sức khoẻ'});
    }
}

export const getHealthStatus = async(req: any, res: any) => {
    try{
        const {id} = req.params;

        if(!id) {
            return res.status(400).json({message: 'Thiêu userId'});
        }
        const status = await HealthStatus.findOne({userId: id}).sort({createdAt: -1});

        if(!status){
            return res.status(404).json({message: 'Không tìm thấy tình trạng sức khoẻ'});
        }
        res.status(200).json(status);
    }catch(error) {
        console.error("Không tìm thấy các chỉ số", error);
        return res.status(500).json({message: 'Lỗi khi lấy thông tin sức khoẻ từ server'});
    }
}

export const getHealthStatusForAI = async(id: string) => {
    try{
        
        if(!id) {
            return ;
        }
        const status = await HealthStatus.findOne({userId: id}).sort({createdAt: -1});

        if(!status){
            return null;
        }
        return status;
    }catch(error) {
        console.error("Không tìm thấy các chỉ số", error);
        return null;
    }
}

export const getPatientWithName = async(req: any, res: any) => {
    try {
        const {fullName, phone} = req.body;
        if (!fullName || !phone) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp đầy đủ họ tên và số điện thoại.'
            });
        }
        const user = await User.findOne({
            fullName,
            phone,
            role: 'patient'
        });

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy bệnh nhân.' });
        }

        const patient = await Patient.findOne({ userId: user._id }).populate('userId');

        return res.status(200).json(patient);

    }catch(error) {
        console.error('Lỗi khi lấy bệnh nhân', error);
        return res.status(500).json({message: 'Lỗi từ phía server', error});
    }
}

export const createExamination = async(req: any, res: any) => {
    try{
        const examinationData = req.body;
        if(!examinationData.patientId) {
            return res.status(400).json({message: 'Không có thông tin bệnh nhân'});
        }

        const result = await Examination.create(examinationData);

        return res.status(201).json(result);
    }catch(error) {
        console.error("Lỗi khi tạo bệnh án", error)
        return res.status(500).json({message: 'Lỗi server khi tạo bệnh án', error});
    }
}

