const express = require('express');
const cors = require('cors');
const path = require('path'); 
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam'); 

const app = express();

app.use(cors());
app.use(express.json()); 

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes); 
app.use('/api/works', require('./routes/work'));
app.use('/api/logs', require('./routes/logRoutes'));

app.use((req, res) => {
    res.status(404).json({ message: "Route non trouvée" });
});

module.exports = app;