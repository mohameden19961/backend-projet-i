const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/works/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
    const identifier = req.user.matricule || req.user.id;
    
    const originalName = path.parse(file.originalname).name;
    
    const extension = path.extname(file.originalname);

    cb(null, `${identifier}-${originalName}${extension}`);
}
});

const upload = multer({ storage: storage });
module.exports = upload;