const http = require('http');
const { Server } = require('socket.io'); 
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const db = require('./src/database/db'); 
const PORT = 3000;
const SECRET_KEY = "votre_cle_secrete_super_sure";
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(cleanToken, SECRET_KEY); 
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error("Authentication error: Invalid token"));
    }
});

io.on('connection', (socket) => {
    console.log(`Connexion sécurisée | Utilisateur: ${socket.user.email} | ID: ${socket.id}`);
    
    if (socket.user.role === 'prof') {
        socket.join('teachers');
    }

    socket.on('ping', (data) => {
        socket.emit('pong', { message: "Serveur opérationnel", user: socket.user.email });
    });

    socket.on('disconnect', (reason) => {
        console.log(` Déconnexion | ID: ${socket.id} | Raison: ${reason}`);
    });
});

app.set('socketio', io);

server.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`BACKEND SÉCURISÉ : http://localhost:${PORT}`);
    console.log(`SOCKET.IO : JWT Authentification activée`);
    console.log(`--------------------------------------------------`);
});