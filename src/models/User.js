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
        const { email, role, inActive } = userData;
        const sql = `UPDATE users SET email = ?, role = ?, inActive = ? WHERE id = ?`;
        
        db.run(sql, [email, role, inActive, id], function(err) {
            callback(err, this.changes); 
            
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