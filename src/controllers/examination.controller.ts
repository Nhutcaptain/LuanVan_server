import { Examination } from "../models/examination.model";

export const getSummaryExamination = async(req: any, res: any) => {
    try{
        const {patientId} = req.params;
        const examinations = await Examination.find({patientId})
            .select('doctorId date assessment')
            .populate({
                path: 'doctorId',
                select: 'fullName',
            }).sort({date: -1}).lean();
        
        const result = examinations.map((exam: any) => ({
            id: exam._id,
            date: exam.date,
            doctorName: exam.doctorId.fullName || 'N/A',
            assessment: exam.assessment,
        }));

        return res.json(result);


    }catch(error) {
        console.error(error);
    }
}

export const getExaminationDetailById = async(req: any, res: any) => {
    try{
        const {id} = req.params;
        if(!id) {
            return res.status(404).json({message: 'Không có id'});
        }
        const detail = await Examination.findById(id)
        .populate({
            path: 'doctorId',
            select: 'fullName',
        });
        if (!detail) {
            return res.status(404).json({ message: 'Không tìm thấy phiếu khám.' });
        }

        const detailObj = detail.toObject() as any;
        detailObj.doctorName = (detail.doctorId as any)?.fullName || 'N/A';
        return res.json(detailObj);
    }catch(error){
        console.error(error);
    }
}