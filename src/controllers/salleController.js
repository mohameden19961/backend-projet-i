const Salle = require('../models/Salle');
const db = require('../database/db'); 

exports.creerSalle = (req, res) => {
    const { nom_salle, examen_id, liste_etudiants } = req.body;
    const prof_id = req.user.id;
    const sql = `INSERT INTO salle (nom_salle, examen_id, prof_id, liste_etudiants, status) 
                 VALUES (?, ?, ?, ?, 'active')`;

    db.run(sql, [nom_salle, examen_id, prof_id, liste_etudiants], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(403).json({ 
                    message: `Refusé : La '${nom_salle}' est déjà utilisée. Veuillez choisir une autre salle.` 
                });
            }
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ 
            message: "Salle réservée avec succès.", 
            salleId: this.lastID 
        });
    });
};

exports.mesSalles = (req, res) => {
    const prof_id = req.user.id;

    Salle.findByProf(prof_id, (err, salles) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la récupération des salles", error: err.message });
        }
        res.json(salles);
    });
};

exports.fermerSalle = (req, res) => {
    const { salle_id } = req.body;
    const prof_id = req.user.id;

    const sql = "UPDATE salle SET status = 'termine' WHERE id = ? AND prof_id = ?";

    db.run(sql, [salle_id, prof_id], function(err) {
        if (this.changes === 0) {
            return res.status(404).json({ message: "Salle non trouvée ou déjà fermée." });
        }
        res.json({ message: "Examen terminé. La salle est libérée pour le prochain professeur." });
    });
};