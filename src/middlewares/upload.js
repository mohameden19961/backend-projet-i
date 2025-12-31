const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isExam = req.originalUrl.toLowerCase().includes('exam');
        const dir = isExam ? 'uploads/exams/' : 'uploads/works/';
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const isExam = req.originalUrl.toLowerCase().includes('exam');
        const extension = path.extname(file.originalname);
        
        if (isExam) {
           
            const matiere = req.body.titre ? req.body.titre.replace(/\s+/g, '-').toLowerCase() : 'examen';
            
            cb(null, `${matiere}-${Date.now()}${extension}`);
        } else {
            const identifier = req.user.matricule || req.user.id;
            const originalName = path.parse(file.originalname).name;
            cb(null, `${identifier}-${originalName}${extension}`);
        }
    }
});

const upload = multer({ storage: storage });
module.exports = upload;