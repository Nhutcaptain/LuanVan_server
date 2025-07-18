import { Message } from "twilio/lib/twiml/MessagingResponse";
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

export const temp_save = async(req: any, res: any) => {
    try{
        const data = req.body;
        const record = new Examination({
            ...data,
            status: 'waiting_result',
        })
        record.save();
        return res.status(200).json(record);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi ở server'});
    }
}

export const temp_get = async(req: any, res: any) => {
    try {
    const { doctorId, patientId, date } = req.body;

    if (!doctorId || !patientId || !date) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin truy vấn' });
    }

     const inputDate = new Date(date);
    const startOfDay = new Date(inputDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(inputDate);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await Examination.findOne({
      doctorId,
      patientId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: 'waiting_result', // chỉ lấy bản tạm có trạng thái chờ kết quả
    });
    console.log(record);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi' });
    }

    return res.json(record);
  } catch (error) {
    console.error('Lỗi lấy dữ liệu:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

export const updateExamination = async(req: any, res: any) => {
    try{
        const data = req.body;
        const {id} = req.params;
        const result = await Examination.findByIdAndUpdate(id, (data));
        if(!result) return res.status(404).json({Message: 'Không tìm thấy kết quả này'});
        return res.status(200).json(result);
    }catch(error) {
        console.error(error);
        return res.status(500).json({message: 'Lỗi server'});
    }
}