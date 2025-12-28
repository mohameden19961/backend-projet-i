const db = require('../database/db');

const Log = {
    
    add: (matricule, action, callback) => {
        const sql = `INSERT INTO logs (matricule, action, timestamp) VALUES (?, ?, ?)`;
        const now = new Date().toLocaleString('fr-FR'); // Format de date lisible
        db.run(sql, [matricule, action, now], callback);
    },


    findAll: (callback) => {
        const sql = `SELECT * FROM logs ORDER BY id DESC`;
        db.all(sql, [], callback);
    }
};

module.exports = Log;