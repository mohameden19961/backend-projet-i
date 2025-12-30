const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'exam_local.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(' Erreur de connexion SQLite:', err.message);
    } else {
        console.log('Base de données connectée : ' + dbPath);
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        inActive BOOLEAN DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS profile (
        id_user INTEGER,
        email TEXT,
        matricule TEXT,
        level TEXT,
        nom TEXT,
        FOREIGN KEY(id_user) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        noms TEXT,
        email TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS examen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sujet_path TEXT,
        description TEXT,
        titre TEXT,
        date_fin TEXT
    )`);

    
    db.run(`CREATE TABLE IF NOT EXISTS works (
        id_etud INTEGER,
        nb_files INTEGER,
        file_paths TEXT, 
        nom TEXT,
        matricule TEXT,
        last_update DATETIME
    )`);
    
    
    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        action TEXT,
        timestamp TEXT
    )`, (err) => {
        if (!err) console.log("Toutes les tables sont prêtes.");
    });
});

module.exports = db;