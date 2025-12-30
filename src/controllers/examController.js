const Examen = require('../models/Examen');
const Log = require('../models/Log'); 

exports.createExam = (req, res) => {
    const { titre, description, date_fin} = req.body;
    const sujet_path = req.file ? req.file.path : null;

    if (!sujet_path) {
        return res.status(400).json({ error: "Le champ sujet_path est obligatoire" });
    }

    Examen.create({ sujet_path, description, titre, date_fin }, (err, examId) => {
        if (err) return res.status(500).json({ error: "Erreur base de données" });
        
        const actionLog = `Création de l'examen : ${titre} (ID: ${examId})`;
        Log.add(req.user.email, actionLog, (logErr) => {
            if (logErr) console.error("Erreur Log:", logErr);

            res.status(201).json({ 
                message: "Examen créé et journalisé avec succès !", 
                examId,
                donnees: { titre, sujet_path }
            });
        });
    });
};

exports.getAllExams = (req, res) => {
    // Utilisation du modèle au lieu de 'db' directement
    Examen.findAll((err, rows) => {
        if (err) {
            console.error("Erreur SQL:", err.message);
            return res.status(500).json({ error: "Erreur lors de la récupération des examens" });
        }

        // Transformation des chemins en URLs cliquables
        const examsWithUrls = rows.map(exam => ({
            ...exam,
            sujet_url: `${req.protocol}://${req.get('host')}/${exam.sujet_path}`
        }));

        res.json(examsWithUrls);
    });
};

exports.updateExam = (req, res) => {
    const id = req.params.id;
    const { titre, description, date_fin, sujet_path } = req.body;

    Examen.update(id, { titre, description, date_fin, sujet_path }, (err, changes) => {
        if (err) return res.status(500).json({ error: "Erreur lors de la mise à jour" });
        
        if (changes === 0) return res.status(404).json({ message: "Examen non trouvé" });
        
        Log.add(req.user.email, `Modification de l'examen ID ${id}`);
        res.json({ message: "Examen mis à jour avec succès" });
    });
};

exports.deleteExam = (req, res) => {
    const id = req.params.id; 
    Examen.delete(id, (err, changes) => {
        if (err) return res.status(500).json({ error: "Erreur BDD" });
        
        if (changes === 0) return res.status(404).json({ message: "Examen non trouvé" });
        
        Log.add(req.user.email, `Suppression de l'examen ID ${id}`);
        res.json({ message: "Examen supprimé avec succès" });
    });
};

