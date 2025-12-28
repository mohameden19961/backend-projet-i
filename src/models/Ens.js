const db = require('../database/db');

const Ens = {
    create: (noms, email, callback) => {
        const sql = `INSERT INTO ens (noms, email) VALUES (?, ?)`;
        db.run(sql, [noms, email], callback);
    },

    findByEmail: (email, callback) => {
        const sql = `SELECT noms FROM ens WHERE email = ?`;
        db.get(sql, [email], (err, row) => {
            callback(err, row);
        });
    }
};

module.exports = Ens;