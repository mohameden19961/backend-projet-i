const db = require('../database/db');

const Examen = {
    create: (data, callback) => {
        const { sujet_path, description, titre, date_fin } = data;
        const sql = `INSERT INTO examen (sujet_path, description, titre, date_fin) VALUES (?, ?, ?, ?)`;
        db.run(sql, [sujet_path, description, titre, date_fin], function(err) {
            callback(err, this.lastID);
        });
    },
    
    findAll: (callback) => {
        const sql = `SELECT * FROM examen ORDER BY id DESC`;
        db.all(sql, [], callback);
    },

    update: (id, data, callback) => {
        const { sujet_path, description, titre, date_fin } = data;
        const sql = `UPDATE examen SET sujet_path = ?, description = ?, titre = ?, date_fin = ? WHERE id = ?`;
        db.run(sql, [sujet_path, description, titre, date_fin, id], function(err) {
            callback(err, this.changes); 
        });
    },

    delete: (id, callback) => {
        const sql = `DELETE FROM examen WHERE id = ?`;
        db.run(sql, [id], function(err) {
            callback(err, this.changes); 
        });
    }
};

module.exports = Examen;