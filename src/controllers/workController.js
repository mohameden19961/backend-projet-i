const Work = require('../models/Work');
const Log = require('../models/Log'); 
const path = require('path');

exports.submitWork = (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Non autorisé" });

    const workData = {
        id_etud: req.user.id,
        nb_files: 1,
        file_paths: req.file ? req.file.path : "uploads/default.pdf",
        nom: req.user.nom,       
        matricule: req.user.matricule 
    };

    Work.create(workData, (err) => {
        if (err) return res.status(500).json({ error: "Erreur BDD", details: err.message });

        
const identite = req.user.nom || req.user.email;
const actionLog = `${identite} a rendu son travail`;

        
        Log.add(req.user.email, actionLog, (logErr) => {
            if (logErr) {
                console.error("Erreur lors de l'enregistrement du log :", logErr);
            }
            
            res.status(201).json({ 
                message: "Travail soumis avec succès !", 
                file: req.file ? req.file.filename : "default" 
            });
        });
    });
};

exports.getAllWorks = (req, res) => {
    if (req.user.role !== 'prof') {
        return res.status(403).json({ error: "Accès refusé. Réservé aux enseignants." });
    }

    Work.findAll((err, works) => {
        if (err) return res.status(500).json({ error: "Erreur lors de la récupération" });
        res.status(200).json(works);
    });
};


exports.downloadWork = (req, res) => {
    if (req.user.role !== 'prof') {
        return res.status(403).json({ error: "Accès interdit" });
    }

    const fileName = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/works', fileName);

    res.download(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: "Fichier non trouvé sur le serveur" });
        }
    });
};