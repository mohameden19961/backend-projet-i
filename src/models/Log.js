const db = require('../database/db');

const Log = {
    add: (email, action, callback) => {
        const sql = `INSERT INTO logs (email, action, timestamp) VALUES (?, ?, datetime('now', 'localtime'))`;
        db.run(sql, [email, action], function(err) {
            if (callback) callback(err);
        });
    },

    findAll: (callback) => {
        const sql = `SELECT * FROM logs ORDER BY id DESC`;
        db.all(sql, [], (err, rows) => {
            if (callback) callback(err, rows);
        });
    }
};

module.exports = Log;