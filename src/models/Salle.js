const db = require('../database/db');

const Salle = {
    create: (data, callback) => {
        const { nom_salle, examen_id, prof_id, liste_etudiants } = data;
        const sql = `INSERT INTO salle (nom_salle, examen_id, prof_id, liste_etudiants) VALUES (?, ?, ?, ?)`;
        db.run(sql, [nom_salle, examen_id, prof_id, liste_etudiants], function(err) {
            callback(err, this.lastID);
        });
    },

    findByProf: (prof_id, callback) => {
        const sql = `
            SELECT s.*, e.titre as examen_titre 
            FROM salle s 
            JOIN examen e ON s.examen_id = e.id 
            WHERE s.prof_id = ?`;
        db.all(sql, [prof_id], callback);
    },

    // Trouver une salle par son ID
    findById: (id, callback) => {
        const sql = `SELECT * FROM salle WHERE id = ?`;
        db.get(sql, [id], callback);
    },

    // Supprimer une salle
    delete: (id, callback) => {
        const sql = `DELETE FROM salle WHERE id = ?`;
        db.run(sql, [id], function(err) {
            callback(err, this.changes);
        });
    }
};

module.exports = Salle;