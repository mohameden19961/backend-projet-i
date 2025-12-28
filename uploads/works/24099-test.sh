#!/bin/bash

echo "🚀 Démarrage de l'installation automatique de EXAMEN-SYSTEM..."

# 1. Nettoyage et Création du dossier
rm -rf EXAMEN-SYSTEM
mkdir EXAMEN-SYSTEM
cd EXAMEN-SYSTEM

# 2. Initialisation et Installation
echo "📦 Installation des dépendances..."
npm init -y > /dev/null
npm install express sqlite3 socket.io multer cors bcrypt jsonwebtoken dotenv > /dev/null

# 3. Création de la structure
echo "📂 Création de l'arborescence..."
mkdir -p src/config
mkdir -p src/controllers
mkdir -p src/routes
mkdir -p src/uploads
mkdir -p public/css
mkdir -p public/js

# ==========================================
# 4. GÉNÉRATION DES FICHIERS BACKEND
# ==========================================

# --- DB.JS (Ton code exact) ---
cat << 'EOF' > src/config/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../exam_system.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the "Exam System" database successfully.');
    }
});

db.run("PRAGMA foreign_keys = ON");

db.serialize(() => {
    // Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'student',
        is_active BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Profiles
    db.run(`CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        matricule TEXT UNIQUE,
        full_name TEXT,
        level TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Exams
    db.run(`CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        subject_file_path TEXT,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        created_by INTEGER,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Submissions
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER,
        student_id INTEGER,
        files_paths TEXT, 
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
    )`);

    console.log("All 4 tables (users, profiles, exams, submissions) checked/created.");
});

module.exports = db;
EOF

# --- AUTH CONTROLLER ---
cat << 'EOF' > src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const SECRET = 'secret_key_simple';

exports.register = (req, res) => {
    const { email, password, full_name, matricule, level } = req.body;
    // Par défaut tout le monde est 'student'. 
    // ASTUCE : Si l'email contient 'admin', on le met prof pour tester.
    const role = email.includes('admin') ? 'admin' : 'student';

    bcrypt.hash(password, 10, (err, hash) => {
        if(err) return res.status(500).json({error: err.message});
        
        db.run(`INSERT INTO users (email, password, role, is_active) VALUES (?, ?, ?, 1)`, 
        [email, hash, role], function(err) {
            if (err) return res.status(400).json({ error: "Email déjà utilisé" });
            
            const userId = this.lastID;
            db.run(`INSERT INTO profiles (user_id, matricule, full_name, level) VALUES (?, ?, ?, ?)`,
            [userId, matricule, full_name, level], (err) => {
                res.status(201).json({ message: "Inscrit !", role: role });
            });
        });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (!user) return res.status(404).json({ error: "Utilisateur inconnu" });
        
        bcrypt.compare(password, user.password, (err, match) => {
            if (!match) return res.status(401).json({ error: "Mauvais mot de passe" });
            
            const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
            res.json({ message: "Connecté", token, user: { email: user.email, role: user.role, id: user.id } });
        });
    });
};
EOF

# --- EXAM CONTROLLER ---
cat << 'EOF' > src/controllers/examController.js
const db = require('../config/db');

exports.createExam = (req, res) => {
    const { title, description, created_by } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Fichier manquant" });

    const sql = `INSERT INTO exams (title, description, subject_file_path, created_by) VALUES (?, ?, ?, ?)`;
    db.run(sql, [title, description, file.path, created_by], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Examen créé" });
    });
};

exports.getAllExams = (req, res) => {
    db.all("SELECT * FROM exams ORDER BY id DESC", [], (err, rows) => {
        res.json(rows);
    });
};
EOF

# --- ROUTES ---
cat << 'EOF' > src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
module.exports = router;
EOF

cat << 'EOF' > src/routes/examRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/examController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'src/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.post('/create', upload.single('subjectFile'), ctrl.createExam);
router.get('/', ctrl.getAllExams);
module.exports = router;
EOF

# --- SERVER.JS ---
cat << 'EOF' > server.js
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const db = require('./src/config/db');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// Rendre les uploads accessibles (pour télécharger les sujets)
app.use('/src/uploads', express.static(path.join(__dirname, 'src/uploads')));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/exams', require('./src/routes/examRoutes'));

io.on('connection', (socket) => {
    console.log('Client connecté Socket:', socket.id);
});

server.listen(3000, () => {
    console.log('✅ Serveur prêt : http://localhost:3000');
});
EOF

# ==========================================
# 5. GÉNÉRATION DU FRONTEND
# ==========================================

# --- STYLE CSS ---
cat << 'EOF' > public/css/style.css
body { font-family: sans-serif; background: #f4f4f4; display: flex; justify-content: center; height: 100vh; align-items: center; margin: 0; }
.container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); width: 300px; }
input, button { width: 100%; margin: 5px 0; padding: 10px; box-sizing: border-box; }
button { background: #007bff; color: white; border: none; cursor: pointer; }
button:hover { background: #0056b3; }
.hidden { display: none; }
EOF

# --- JS COMMUN ---
cat << 'EOF' > public/js/main.js
// Fonctions partagées si besoin
EOF

# --- INDEX.HTML (LOGIN) ---
cat << 'EOF' > public/index.html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Connexion</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h2 id="title">Connexion</h2>
        <form id="authForm">
            <input type="text" id="fullname" placeholder="Nom complet" class="hidden">
            <input type="text" id="matricule" placeholder="Matricule" class="hidden">
            <input type="email" id="email" placeholder="Email (mettez 'admin' pour être prof)" required>
            <input type="password" id="password" placeholder="Mot de passe" required>
            <button type="submit" id="btnAction">Se connecter</button>
        </form>
        <p id="toggle" style="cursor:pointer; color:blue; text-align:center;">Créer un compte</p>
        <p id="msg" style="color:red; text-align:center;"></p>
    </div>
    <script>
        let isLogin = true;
        document.getElementById('toggle').onclick = () => {
            isLogin = !isLogin;
            document.getElementById('title').innerText = isLogin ? 'Connexion' : 'Inscription';
            document.getElementById('btnAction').innerText = isLogin ? 'Se connecter' : "S'inscrire";
            document.getElementById('fullname').classList.toggle('hidden');
            document.getElementById('matricule').classList.toggle('hidden');
        };

        document.getElementById('authForm').onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const url = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = { email, password };

            if (!isLogin) {
                body.full_name = document.getElementById('fullname').value;
                body.matricule = document.getElementById('matricule').value;
                body.level = 'L1'; 
            }

            const res = await fetch(url, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (res.ok) {
                if(isLogin) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    if(data.user.role === 'admin') location.href = 'professor.html';
                    else location.href = 'dashboard.html';
                } else {
                    alert('Compte créé ! Connectez-vous.');
                    location.reload();
                }
            } else {
                document.getElementById('msg').innerText = data.error;
            }
        };
    </script>
</body>
</html>
EOF

# --- DASHBOARD.HTML (STUDENT) ---
cat << 'EOF' > public/dashboard.html
<!DOCTYPE html>
<html>
<head><title>Étudiant</title><link rel="stylesheet" href="css/style.css"></head>
<body>
    <div class="container" style="width:500px">
        <h2>Espace Étudiant</h2>
        <div id="exams">Chargement...</div>
        <button onclick="localStorage.clear(); location.href='/'" style="background:red; margin-top:20px">Déconnexion</button>
    </div>
    <script>
        fetch('/api/exams').then(r => r.json()).then(exams => {
            const div = document.getElementById('exams');
            if(!exams.length) div.innerHTML = 'Aucun examen.';
            else div.innerHTML = exams.map(e => `
                <div style="border:1px solid #ddd; padding:10px; margin:5px;">
                    <h3>${e.title}</h3>
                    <p>${e.description}</p>
                    <a href="/${e.subject_file_path}" target="_blank">Télécharger Sujet</a>
                </div>
            `).join('');
        });
    </script>
</body>
</html>
EOF

# --- PROFESSOR.HTML ---
cat << 'EOF' > public/professor.html
<!DOCTYPE html>
<html>
<head><title>Professeur</title><link rel="stylesheet" href="css/style.css"></head>
<body>
    <div class="container" style="width:500px">
        <h2>Espace Professeur</h2>
        <form id="examForm">
            <input type="text" id="title" placeholder="Titre" required>
            <input type="text" id="desc" placeholder="Description" required>
            <input type="file" id="file" required>
            <button type="submit">Publier Examen</button>
        </form>
        <p id="msg"></p>
        <button onclick="localStorage.clear(); location.href='/'" style="background:red; margin-top:20px">Déconnexion</button>
    </div>
    <script>
        document.getElementById('examForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('description', document.getElementById('desc').value);
            formData.append('subjectFile', document.getElementById('file').files[0]);
            
            const user = JSON.parse(localStorage.getItem('user'));
            formData.append('created_by', user.id);

            const res = await fetch('/api/exams/create', { method: 'POST', body: formData });
            if(res.ok) { alert('Examen créé !'); }
        };
    </script>
</body>
</html>
EOF

echo "✅ PROJET GÉNÉRÉ AVEC SUCCÈS !"
echo "👉 Pour lancer : cd EXAMEN-SYSTEM && node server.js"
