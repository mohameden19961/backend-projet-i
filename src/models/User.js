const db = require('../database/db');

const User = {
    
    create: function(userData, callback) {
        const { email, password, role } = userData;
        const sql = `INSERT INTO users (email, password, role, inActive) VALUES (?, ?, ?, 0)`;
        db.run(sql, [email, password, role], function(err) {
            if (err) return callback(err);
            callback(null, this.lastID);
        });
    },

    
    findByEmail: (email, callback) => {
    const sql = `
        SELECT users.*, profile.nom, profile.matricule 
        FROM users 
        LEFT JOIN profile ON users.id = profile.id_user 
        WHERE users.email = ?
    `;
    db.get(sql, [email], (err, row) => {
        if (err) return callback(err, null);
        callback(null, row);
    });
},

    findById: (id, callback) => {
        const sql = `SELECT id, email, role, inActive FROM users WHERE id = ?`;
        db.get(sql, [id], callback);
    },

    findAll: (callback) => {
        const sql = `SELECT id, email, role, inActive FROM users`;
        db.all(sql, [], (err, rows) => {
            callback(err, rows);
        });
    },

    


update: function(id, userData, callback) {
    this.findById(id, (err, currentUser) => {
        if (err || !currentUser) return callback(err);

        const email = userData.email || currentUser.email;
        const role = userData.role || currentUser.role;
        const inActive = (userData.inActive !== undefined) ? userData.inActive : currentUser.inActive;
        const nom = userData.nom; 

        const sqlUser = `UPDATE users SET email = ?, role = ?, inActive = ? WHERE id = ?`;
        db.run(sqlUser, [email, role, inActive, id], (errU) => {
            if (errU) return callback(errU);

            if (role === 'etudiant') {
                db.run(`UPDATE profile SET nom = ?, email = ? WHERE id_user = ?`, [nom, email, id], callback);
            } else if (role === 'prof') {
                db.run(`UPDATE ens SET noms = ?, email = ? WHERE email = ?`, [nom, email, currentUser.email], callback);
            } else {
                callback(null);
            }
        });
    });
},
    
    delete: function(id, callback) {
        const sql = `DELETE FROM users WHERE id = ?`;
        db.run(sql, [id], function(err) {
            callback(err, this.changes); 
        });
    },

    findAllWithProfiles: (callback) => {
        const sql = `
            SELECT users.id, users.email, users.role, profile.nom, profile.matricule, profile.level
            FROM users
            LEFT JOIN profile ON users.id = profile.id_user
        `;
        db.all(sql, [], (err, rows) => {
            callback(err, rows);
        });
    }
};

module.exports = User;