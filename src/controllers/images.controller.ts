import cloudinary from '../config/cloudinary';

export const deleteImageFromCloudinary = async (req: any, res: any) => {
    const {publicId} = req.body;
    console.log(publicId);

     if (!publicId) return res.status(400).json({ message: 'Thiếu publicId' });

     try {
        const result = await cloudinary.uploader.destroy(publicId);
        if(result.result == 'ok') {
            res.status(200).json({message: 'xoá thành công'});
        }else {
            console.log(result.result)
            res.status(500).json({message: 'xoá thất bại'})
        }
     }catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error });
    }
}