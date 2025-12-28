const db = require('../database/db');

const Profile = {
    create: (data, callback) => {
        const { id_user, email, matricule, level, nom } = data;
        const sql = `INSERT INTO profile (id_user, email, matricule, level, nom) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [id_user, email, matricule, level, nom], callback);
    },

    findByUserId: (userId, callback) => {
        const sql = `SELECT nom, matricule FROM profile WHERE id_user = ?`;
        db.get(sql, [userId], (err, row) => {
            callback(err, row);
        });
    }
};
module.exports = Profile;