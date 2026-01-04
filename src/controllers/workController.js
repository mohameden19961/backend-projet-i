const db = require('../database/db');
const path = require('path');

exports.submitWork = (req, res) => {
    const etudiant_matricule = req.user.matricule; 
    const etudiant_id = req.user.id;
    const { examen_id } = req.body;
    const io = req.app.get('socketio'); 

    const sqlCheckRoom = `SELECT liste_etudiants, status FROM salle WHERE examen_id = ?`;
    
    db.all(sqlCheckRoom, [examen_id], (err, salles) => {
        if (err) return res.status(500).json({ message: "Erreur serveur SQL" });

        if (!salles || salles.length === 0) {
            return res.status(404).json({ message: "Aucune salle trouvée pour cet examen" });
        }

        const estAutorise = salles.some(salle => {
            if (!salle.liste_etudiants) return false;
            const liste = salle.liste_etudiants.split(',').map(m => m.trim());
            return liste.includes(etudiant_matricule);
        });

        if (!estAutorise) {
            const sqlLogRefuse = `INSERT INTO logs (email, action, timestamp) VALUES (?, ?, datetime('now'))`;
            const actionRefus = `REFUS_ACCES_EXAM_${examen_id}_MATRICULE_${etudiant_matricule}`;
            db.run(sqlLogRefuse, [req.user.email, actionRefus]);

            io.to('teachers').emit('security_alert', {
                type: 'UNAUTHORIZED_ACCESS',
                user: req.user.email,
                matricule: etudiant_matricule,
                exam_id: examen_id,
                time: new Date()
            });

            return res.status(403).json({ message: "Accès refusé : Salle non autorisée" });
        }

        if (!req.file) return res.status(400).json({ message: "Aucun fichier détecté." });

        
        const sqlInsert = `INSERT INTO works (id_etud, file_paths, nom, matricule, last_update) VALUES (?, ?, ?, ?, datetime('now'))`;
        db.run(sqlInsert, [etudiant_id, req.file.path, req.user.nom, etudiant_matricule || 'N/A'], function(err) {
            if (err) return res.status(500).json({ message: "Erreur lors de l'enregistrement", error: err.message });

            const sqlLog = `INSERT INTO logs (email, action, timestamp) VALUES (?, ?, datetime('now'))`;
            const actionNom = `RENDU_SUCCES_EXAM_${examen_id}`;
            db.run(sqlLog, [req.user.email, actionNom]);

            io.emit('notification', { 
                type: 'FILE_UPLOADED', 
                message: `Nouveau rendu de ${req.user.nom} (Examen ${examen_id})` 
            });

            res.status(200).json({ message: "Travail soumis et consigné !", id: this.lastID });
        });
    });
};

exports.getAllWorks = (req, res) => {
    const prof_id = req.user.id; 

    
    const sql = `
        SELECT DISTINCT w.* FROM works w
        JOIN salle s ON s.liste_etudiants LIKE '%' || w.matricule || '%'
        WHERE s.prof_id = ?
        ORDER BY w.last_update DESC
    `;

    db.all(sql, [prof_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const sqlLog = `INSERT INTO logs (email, action, timestamp) VALUES (?, 'CONSULTATION_TRAVAUX_PROPRES', datetime('now'))`;
        db.run(sqlLog, [req.user.email]);
        
        res.json(rows); 
    });
};

exports.downloadWork = (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/works', filename);

    const sqlLog = `INSERT INTO logs (email, action, timestamp) VALUES (?, ?, datetime('now'))`;
    db.run(sqlLog, [req.user.email, `TELECHARGEMENT_${filename}`]);
    res.download(filePath);
};