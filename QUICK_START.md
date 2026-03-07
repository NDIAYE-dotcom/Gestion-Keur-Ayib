# 🚀 Guide de Démarrage Rapide

## Installation et Configuration en 5 Étapes

### ÉTAPE 1 : Installation
```bash
cd "/Users/apple/Desktop/Gestion Keur Ayib"
npm install
```

### ÉTAPE 2 : Configuration Firebase

**🆕 NOUVEAU : Guides détaillés disponibles !**

- 📖 **Débutant ?** → Lisez [GUIDE_VISUEL_SIMPLE.md](GUIDE_VISUEL_SIMPLE.md)
- 📚 **Version complète** → Lisez [GUIDE_FIREBASE_DETAILLE.md](GUIDE_FIREBASE_DETAILLE.md)

**Résumé rapide :**

1. **Créer un projet Firebase**
   - Aller sur https://console.firebase.google.com
   - Créer un nouveau projet "keur-ayib-immobilier"

2. **Activer les services**
   - ✅ Authentication (Email/Password)
   - ✅ Firestore Database
   - ✅ Storage

3. **Récupérer les credentials**
   - Paramètres du projet > Ajouter une application Web
   - Copier l'objet `firebaseConfig`

4. **Configurer le projet**
   - Ouvrir `src/services/firebase.js`
   - Remplacer les credentials :
   ```javascript
   const firebaseConfig = {
     apiKey: "VOTRE_API_KEY",
     authDomain: "VOTRE_AUTH_DOMAIN",
     projectId: "VOTRE_PROJECT_ID",
     storageBucket: "VOTRE_STORAGE_BUCKET",
     messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
     appId: "VOTRE_APP_ID"
   };
   ```

**💡 Besoin d'aide ? Les guides détaillés expliquent chaque clic !**

### ÉTAPE 3 : Créer un Utilisateur Admin

**🆕 NOUVEAU : Guides détaillés disponibles !**

- 📖 **Débutant ?** → Lisez [GUIDE_VISUEL_SIMPLE.md](GUIDE_VISUEL_SIMPLE.md) (Section "ÉTAPE 3")
- 📚 **Version complète** → Lisez [GUIDE_FIREBASE_DETAILLE.md](GUIDE_FIREBASE_DETAILLE.md) (Sections 8 et 9)

**Résumé rapide :**

1. **Dans Firebase Authentication**
   - Créer un utilisateur avec email/password
   - Exemple : admin@keurayib.com
   - **IMPORTANT : Copier l'UID généré !**

2. **Dans Firestore Database**
   - Créer une collection "users"
   - Ajouter un document avec l'UID de l'utilisateur
   - Structure :
   ```javascript
   {
     uid: "UID_DE_L_UTILISATEUR",          // ⚠️ Même UID que Authentication !
     email: "admin@keurayib.com",
     nom: "Administrateur",
     role: "admin",
     createdAt: (timestamp actuel)
   }
   ```

**💡 L'UID doit être identique dans Authentication ET Firestore !**

### ÉTAPE 4 : Configurer les Règles de Sécurité

Voir le fichier `FIREBASE_SECURITY_RULES.md` pour les règles complètes.

**Firestore Rules** (Firestore > Règles)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules** (Storage > Règles)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### ÉTAPE 5 : Lancer l'Application

```bash
npm run dev
```

Ouvrir http://localhost:5173

---

## 📁 Structure du Projet

```
Gestion Keur Ayib/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── sidebar.css
│   │   ├── Navbar.jsx
│   │   └── navbar.css
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── dashboard.css
│   │   ├── Properties.jsx
│   │   ├── properties.css
│   │   ├── Clients.jsx
│   │   ├── clients.css
│   │   ├── Payments.jsx
│   │   ├── payments.css
│   │   ├── Agenda.jsx
│   │   ├── agenda.css
│   │   ├── Login.jsx
│   │   └── login.css
│   ├── services/
│   │   └── firebase.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── PLAN_DEVELOPPEMENT.md
└── FIREBASE_SECURITY_RULES.md
```

---

## 🎯 Fonctionnalités Disponibles

### ✅ Authentification
- Connexion sécurisée
- Gestion des rôles (Admin/Agent)

### ✅ Dashboard
- Statistiques en temps réel
- Biens récents
- Clients récents

### ✅ Gestion des Biens
- CRUD complet
- Upload de photos
- Filtres et recherche

### ✅ Gestion des Clients
- CRUD complet
- Recherche avancée

### ✅ Gestion des Paiements
- Enregistrement des paiements
- Historique complet
- Statistiques

### ✅ Agenda
- Planification de visites
- Gestion des rendez-vous
- Mise à jour des statuts

---

## 🔑 Identifiants par Défaut

**Compte Admin**
- Email : admin@keurayib.com
- Mot de passe : (défini lors de la création dans Firebase)

---

## 📝 Commandes Utiles

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run preview
```

---

## 🐛 Résolution de Problèmes Courants

### "Firebase not configured"
➜ Vérifier `src/services/firebase.js`

### "Permission denied"
➜ Vérifier les règles Firestore/Storage

### "User not found"
➜ Créer l'utilisateur dans Firebase Authentication

### "Module not found"
➜ Exécuter `npm install`

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `README.md` - Vue d'ensemble du projet
- `PLAN_DEVELOPPEMENT.md` - Guide détaillé étape par étape
- `FIREBASE_SECURITY_RULES.md` - Configuration sécurité

---

## 💡 Conseils

1. **Sauvegardez vos credentials Firebase** dans un endroit sûr
2. **Testez d'abord en mode développement** avant le déploiement
3. **Créez des backups réguliers** de Firestore
4. **Utilisez des mots de passe forts** pour les comptes admin

---

## 🎨 Personnalisation

### Changer les Couleurs
Modifier les fichiers CSS dans chaque composant/page

### Ajouter des Fonctionnalités
Suivre la structure existante pour maintenir la cohérence

### Modifier le Logo
Remplacer l'emoji 🏠 dans `Sidebar.jsx` et `Login.jsx`

---

## 📞 Support

Pour toute question ou problème :
1. Consulter la documentation complète
2. Vérifier les messages d'erreur dans la console
3. Vérifier les logs Firebase

---

**Bon développement ! 🚀**

© 2026 KEUR AYIB IMMOBILIER
