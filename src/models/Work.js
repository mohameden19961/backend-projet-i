const db = require('../database/db');

const Work = {
    create: (data, callback) => {
        const { id_etud, file_paths, nom, matricule } = data;
        const sql = `INSERT INTO works (id_etud, file_paths, nom, matricule, last_update) 
                     VALUES (?, ?, ?, ?, datetime('now'))`;
        
        db.run(sql, [id_etud, file_paths, nom, matricule], function(err) {
            callback(err, this.lastID);
        });
    },

    findAll: (callback) => {
        const sql = `SELECT * FROM works ORDER BY last_update DESC`;
        db.all(sql, [], callback);
    }
};

module.exports = Work;