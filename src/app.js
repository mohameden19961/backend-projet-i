const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const workRoutes = require('./routes/work');
const logRoutes = require('./routes/logRoutes');
const examRoutes = require('./routes/exam');
const salleRoutes = require('./routes/salle'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
    const io = req.app.get('socketio');
    const originalJson = res.json;
    res.json = function (data) {
        if (req.path === '/api/auth/register' && res.statusCode === 201) {
            io.emit('notification', { type: 'USER_REGISTERED', user: data.user?.email });
        }
        if (req.path === '/api/works/submit' && res.statusCode === 200) {
            io.emit('notification', { type: 'FILE_UPLOADED', message: 'Nouveau travail reçu' });
        }
        return originalJson.call(this, data);
    };
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/works', workRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/salles', salleRoutes); 

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

module.exports = app;