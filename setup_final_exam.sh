#!/bin/bash

# Nom du dossier
DIR="frontend_final"

echo "🧹 Nettoyage et création du dossier..."
rm -rf $DIR
npm create vite@latest $DIR -- --template react

cd $DIR

echo "📦 Installation des dépendances (Axios, Tailwind, Framer Motion, Lucide)..."
npm install axios react-router-dom lucide-react framer-motion clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer

# Création manuelle des configs pour éviter l'erreur npx
cat <<EOF > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        exam: { 50: '#f8fafc', 600: '#2563eb', 950: '#020617' }
      }
    },
  },
  plugins: [],
}
EOF

cat <<EOF > postcss.config.js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
EOF

# Configuration du CSS Global
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { @apply bg-slate-50 text-slate-900 antialiased; }
.glass { @apply bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl; }
EOF

# Création des dossiers
mkdir -p src/services src/components src/pages

# Service API
cat <<EOF > src/services/api.js
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:3000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});
export default api;
EOF

# Le code complet de l'application (App.jsx)
cat <<EOF > src/App.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, GraduationCap, ShieldCheck, LogOut, Activity, FileText, Download, Upload, CheckCircle } from 'lucide-react';
import api from './services/api';

// --- VUE ENSEIGNANT ---
const TeacherView = () => {
  const [data, setData] = useState({ logs: [], works: [] });
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [l, w] = await Promise.all([api.get('/logs'), api.get('/works/all')]);
        setData({ logs: l.data, works: w.data });
      } catch (err) { console.error(err); }
    };
    fetchAll();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 glass p-8 rounded-[2.5rem]">
        <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><FileText className="text-blue-600"/> Travaux des Étudiants</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {data.works.map(w => (
            <div key={w.id} className="p-5 bg-white rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-blue-500 transition-all">
              <div><p className="font-bold text-slate-800">{w.nom}</p><p className="text-[10px] text-slate-400 font-mono italic">{w.last_update}</p></div>
              <a href={\`http://localhost:3000/\${w.file_paths}\`} target="_blank" className="p-3 bg-slate-100 rounded-2xl text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Download size={20}/></a>
            </div>
          ))}
        </div>
      </div>
      <div className="glass p-8 rounded-[2.5rem]">
        <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Activity className="text-rose-500"/> Logs Sécurité</h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {data.logs.map(log => (
            <div key={log.id} className="text-xs p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-700">{log.email}</p>
              <p className="text-slate-500 italic mt-1">{log.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- VUE ÉTUDIANT ---
const StudentView = () => {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('examen_id', '10');
    formData.append('reponse', file);
    try {
      const res = await api.post('/works/submit', formData);
      setMsg({ type: 'success', text: res.data.message });
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur' }); }
  };

  return (
    <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="max-w-2xl mx-auto mt-20 p-10 glass rounded-[3rem] text-center">
      <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600"><Upload size={32}/></div>
      <h2 className="text-3xl font-black mb-2 tracking-tight">Rendu d'Examen</h2>
      <p className="text-slate-400 mb-8 italic">Veuillez sélectionner votre fichier final (HTML, TXT, PDF)</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-dashed border-slate-200 p-10 rounded-[2rem] hover:border-blue-400 transition-all cursor-pointer bg-slate-50/30">
          <input type="file" className="hidden" id="f" onChange={e => setFile(e.target.files[0])} />
          <label htmlFor="f" className="cursor-pointer font-bold text-slate-600 italic">
            {file ? file.name : "Cliquez pour parcourir vos fichiers"}
          </label>
        </div>
        <button className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50" disabled={!file}>Envoyer ma copie</button>
      </form>
      {msg && <div className={\`mt-6 p-4 rounded-2xl font-bold \${msg.type==='success'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}\`}>{msg.text}</div>}
    </motion.div>
  );
};

// --- PAGE AUTH ---
const AuthPage = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email:'', password:'', nom:'', role:'etudiant' });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const path = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(path, form);
      onAuth(data.token, data.user);
    } catch (err) { alert(err.response?.data?.message || "Erreur d'accès"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white p-12 rounded-[3rem] w-full max-w-md shadow-2xl">
        <h2 className="text-4xl font-black mb-8 text-center tracking-tighter italic text-slate-900">{isLogin?'Connexion':'Inscription'}</h2>
        <form onSubmit={submit} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Nom Complet" className="w-full p-4 bg-slate-100 rounded-2xl border-none focus:ring-2 ring-blue-500" onChange={e=>setForm({...form, nom:e.target.value})} />}
          <input type="email" placeholder="Email" className="w-full p-4 bg-slate-100 rounded-2xl border-none focus:ring-2 ring-blue-500" onChange={e=>setForm({...form, email:e.target.value})} />
          <input type="password" placeholder="Mot de passe" className="w-full p-4 bg-slate-100 rounded-2xl border-none focus:ring-2 ring-blue-500" onChange={e=>setForm({...form, password:e.target.value})} />
          <div className="flex gap-2">
            <button type="button" onClick={()=>setForm({...form, role:'etudiant'})} className={\`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all \${form.role==='etudiant'?'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold':'bg-white text-slate-400'}\`}><GraduationCap size={18}/>Étudiant</button>
            <button type="button" onClick={()=>setForm({...form, role:'enseignant'})} className={\`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all \${form.role==='enseignant'?'bg-slate-900 text-white shadow-lg shadow-slate-300 font-bold':'bg-white text-slate-400'}\`}><ShieldCheck size={18}/>Prof</button>
          </div>
          <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all">Continuer</button>
        </form>
        <button onClick={()=>setIsLogin(!isLogin)} className="w-full mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest">{isLogin?"Créer un compte":"Déjà inscrit ?"}</button>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [auth, setAuth] = useState({ token: localStorage.getItem('token'), user: JSON.parse(localStorage.getItem('user')) });
  const onAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth({ token, user });
  };
  const logout = () => { localStorage.clear(); setAuth({ token:null, user:null }); };

  if (!auth.token) return <AuthPage onAuth={onAuth} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="p-6 glass sticky top-0 z-50 flex justify-between items-center px-10 border-b-0 m-4 rounded-[2rem]">
        <h1 className="font-black text-2xl tracking-tighter italic">EduGate<span className="text-blue-600">.</span></h1>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block"><p className="text-xs font-black uppercase text-blue-600 tracking-widest">{auth.user?.role}</p><p className="font-bold text-slate-800">{auth.user?.nom}</p></div>
          <button onClick={logout} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><LogOut size={22}/></button>
        </div>
      </nav>
      {auth.user?.role === 'enseignant' ? <TeacherView /> : <StudentView />}
    </div>
  );
}
EOF

echo "✨ Terminé ! Pour lancer :"
echo "cd $DIR"
echo "npm run dev"
