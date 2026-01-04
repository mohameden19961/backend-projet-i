const jwt = require('jsonwebtoken');
const SECRET_KEY = "votre_cle_secrete_super_sure";

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: "Accès refusé : Token manquant" });
    }

    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    jwt.verify(bearerToken, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Session expirée ou token invalide" });
        }
        
        req.user = decoded; 
        next(); 
    });
};