import { Request, Response } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export const convertDocxToHtml = (req: any, res: any) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const inputPath = req.file.path;
  const outputDir = path.resolve('converted');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const sofficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`; // đường dẫn tuyệt đối
  const convertCommand = `${sofficePath} --headless --convert-to html:"HTML (StarWriter)" "${inputPath}" --outdir "${outputDir}"`;

  exec(convertCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).send('LibreOffice conversion failed');
    }

    // Tìm file .html mới nhất trong thư mục outputDir
    fs.readdir(outputDir, (err, files) => {
      if (err) return res.status(500).send('Failed to read output directory');

      const htmlFiles = files.filter((file) => file.endsWith('.html'));
      if (htmlFiles.length === 0) return res.status(500).send('No HTML file found');

      // Giả sử chỉ có 1 file HTML được tạo mỗi lần
      const outputPath = path.join(outputDir, htmlFiles[0]);

      fs.readFile(outputPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Failed to read converted HTML');

        // Cleanup
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.send(data);
      });
    });
  });
};
