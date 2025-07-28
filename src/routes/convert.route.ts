// routes/convertRoute.ts
import express from 'express';
import multer from 'multer';
import { convertDocxToHtml } from '../controllers/convertController';

const router = express.Router();

// Lưu file upload tạm thời vào thư mục 'uploads'
const upload = multer({ dest: 'uploads/' });

// POST /api/convert-to-html
router.post('/convert-to-html', upload.single('file'), convertDocxToHtml);

export default router;
