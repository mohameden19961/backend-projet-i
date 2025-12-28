const User = require('../models/User');
const Profile = require('../models/Profile'); 
const Ens = require('../models/Ens');         
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Log = require('../models/Log');

const SECRET_KEY = "votre_cle_secrete_super_sure";

exports.register = async (req, res) => {
    const { email, password, role, matricule, level, nom } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        User.create({ email, password: hashedPassword, role }, (err, userId) => {
            if (err) {
                return res.status(500).json({ error: "Email déjà utilisé ou erreur base de données" });
            }

            
            const token = jwt.sign({ id: userId, email, role }, SECRET_KEY, { expiresIn: '24h' });

            if (role === 'etudiant') {
                Profile.create({ id_user: userId, email, matricule, level, nom }, (errProfile) => {
                    if (errProfile) return res.status(500).json({ error: "Erreur création profil étudiant" });
                    return res.status(201).json({ message: "Étudiant inscrit avec succès", token, userId });
                });
            } else if (role === 'prof') {
                Ens.create(nom, email, (errEns) => {
                    if (errEns) return res.status(500).json({ error: "Erreur profil enseignant" });
                    return res.status(201).json({ message: "Enseignant inscrit avec succès", token, userId });
                });
            } else {
                return res.status(201).json({ message: "Utilisateur créé", token, userId });
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du hachage" });
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, async (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Utilisateur non trouvé" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect" });

        Log.add(email, "Connexion réussie");
        if (user.role === 'etudiant') {
            Profile.findByUserId(user.id, (errProfile, profile) => {
                const token = jwt.sign({ 
                    id: user.id, 
                    email: user.email, 
                    role: user.role,
                    nom: profile ? profile.nom : "Étudiant", 
                    matricule: profile ? profile.matricule : null 
                }, SECRET_KEY, { expiresIn: '24h' });
                
                return res.status(200).json({ 
                    message: "Bienvenue", 
                    token, 
                    user: { id: user.id, email: user.email, role: user.role, nom: profile?.nom, matricule: profile?.matricule } 
                });
            });
        } 
        else if (user.role === 'prof') {
            Ens.findByEmail(user.email, (errEns, ens) => {
                const token = jwt.sign({ 
                    id: user.id, 
                    email: user.email, 
                    role: user.role,
                    nom: ens ? ens.noms : "Enseignant", 
                    matricule: null 
                }, SECRET_KEY, { expiresIn: '24h' });

                return res.status(200).json({ 
                    message: "Bienvenue", 
                    token, 
                    user: { id: user.id, email: user.email, role: user.role, nom: ens?.noms, matricule: null } 
                });
            });
        }
        else {
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token, user });
        }
    });
};


exports.getAllUsers = (req, res) => {
    User.findAll((err, users) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
        }
        res.status(200).json(users);
    });
};

exports.getAllProfiles = (req, res) => {
    User.findAllWithProfiles((err, data) => {
        if (err) return res.status(500).json({ error: "Erreur de jointure" });
        res.status(200).json(data);
    });
};

exports.updateUser = (req, res) => {
    const { id } = req.params;
    User.update(id, req.body, (err) => {
        if (err) return res.status(500).json({ error: "Erreur modification" });
        Log.add(req.user.email, `A modifié l'utilisateur ID ${id}`);
        res.json({ message: "Utilisateur mis à jour" });
    });
};

exports.deleteUser = (req, res) => {
    const { id } = req.params;
    User.delete(id, (err) => {
        if (err) return res.status(500).json({ error: "Erreur suppression" });
        Log.add(req.user.email, `A supprimé l'utilisateur ID ${id}`);
        res.json({ message: "Utilisateur supprimé" });
    });
};


exports.logout = (req, res) => {
    const email = req.user.email; 

    Log.add(email, "Déconnexion réussie");

    res.status(200).json({ message: "Déconnexion réussie et log enregistrée" });
};