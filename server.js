const http = require('http');
const app = require('./src/app');
const db = require('./src/database/db'); 

const PORT = 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(` Serveur prêt sur http://localhost:${PORT}`);
    console.log(` Testez l'inscription sur http://localhost:${PORT}/api/auth/register`);
});