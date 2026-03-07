# KEUR AYIB IMMOBILIER - Système de Gestion

Application web professionnelle de gestion immobilière développée avec React.js et Firebase.

## 🚀 Technologies Utilisées

- **Frontend**: React.js avec Vite
- **Styling**: CSS classique (chaque composant a son propre fichier CSS)
- **Backend**: Firebase
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Storage

## 📁 Structure du Projet

```
src/
├── components/
│   ├── Sidebar.jsx
│   ├── sidebar.css
│   ├── Navbar.jsx
│   └── navbar.css
├── pages/
│   ├── Dashboard.jsx
│   ├── dashboard.css
│   ├── Properties.jsx
│   ├── properties.css
│   ├── Clients.jsx
│   ├── clients.css
│   ├── Payments.jsx
│   ├── payments.css
│   ├── Agenda.jsx
│   ├── agenda.css
│   ├── Login.jsx
│   └── login.css
├── services/
│   └── firebase.js
├── App.jsx
├── App.css
└── main.jsx
```

## 🗄️ Collections Firestore

### 1. **users**
```javascript
{
  uid: string,
  email: string,
  nom: string,
  role: 'admin' | 'agent',
  createdAt: timestamp
}
```

### 2. **properties**
```javascript
{
  id: string,
  titre: string,
  type: 'terrain' | 'maison' | 'appartement',
  statut: 'à vendre' | 'à louer',
  prix: number,
  localisation: string,
  description: string,
  photos: [string], // URLs Firebase Storage
  superficie: number,
  chambres: number (optionnel),
  sallesDeBain: number (optionnel),
  createdBy: string, // uid de l'agent
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. **clients**
```javascript
{
  id: string,
  nom: string,
  telephone: string,
  email: string,
  adresse: string,
  dateInscription: timestamp,
  notes: string (optionnel)
}
```

### 4. **payments**
```javascript
{
  id: string,
  propertyId: string,
  clientId: string,
  montant: number,
  datePaiement: timestamp,
  typePaiement: 'loyer' | 'vente' | 'caution' | 'autre',
  statut: 'payé' | 'en attente',
  methodePaiement: 'espèces' | 'virement' | 'chèque',
  notes: string (optionnel)
}
```

### 5. **appointments**
```javascript
{
  id: string,
  propertyId: string,
  clientId: string,
  agentId: string,
  dateVisite: timestamp,
  heureVisite: string,
  statut: 'planifié' | 'confirmé' | 'annulé' | 'terminé',
  notes: string (optionnel)
}
```

## ⚙️ Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configuration Firebase

Créez un projet Firebase sur [https://console.firebase.google.com](https://console.firebase.google.com)

Activez les services suivants :
- **Authentication** (Email/Password)
- **Cloud Firestore**
- **Storage**

### 3. Configurer les variables Firebase

Modifiez le fichier `src/services/firebase.js` avec vos credentials Firebase :

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

### 4. Lancer l'application
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📋 Plan de Développement

### Phase 1 : Configuration de base ✅
- [x] Structure du projet React
- [x] Configuration Firebase
- [x] Composants de base (Sidebar, Navbar)

### Phase 2 : Authentification
- [x] Page de connexion
- [x] Gestion des rôles (admin/agent)
- [x] Protection des routes

### Phase 3 : Dashboard
- [x] Statistiques en temps réel
- [x] Cartes de résumé
- [x] Graphiques

### Phase 4 : Gestion des Biens
- [x] Liste des biens
- [x] Ajout de bien (avec upload photos)
- [x] Modification de bien
- [x] Suppression de bien
- [x] Filtres et recherche

### Phase 5 : Gestion des Clients
- [x] Liste des clients
- [x] Ajout de client
- [x] Modification de client
- [x] Suppression de client

### Phase 6 : Gestion des Paiements
- [x] Enregistrement de paiement
- [x] Historique des paiements
- [x] Filtres par date/type

### Phase 7 : Agenda
- [x] Planification de visites
- [x] Calendrier des rendez-vous
- [x] Système de rappels

### Phase 8 : Optimisations
- [ ] Design responsive
- [ ] Optimisation des performances
- [ ] Tests et débogage

## 🎨 Fonctionnalités

### ✅ Authentification
- Connexion sécurisée
- Gestion des rôles (Admin/Agent)
- Déconnexion

### ✅ Dashboard
- Total des biens immobiliers
- Biens en location
- Biens en vente
- Total des clients
- Revenus mensuels

### ✅ Gestion des Biens
- CRUD complet
- Upload de photos multiples
- Filtres avancés

### ✅ Gestion des Clients
- CRUD complet
- Historique des transactions

### ✅ Gestion des Paiements
- Enregistrement des paiements
- Historique complet
- Statistiques

### ✅ Agenda
- Planification des visites
- Rappels automatiques
- Gestion des rendez-vous

## 👥 Rôles et Permissions

### Admin
- Accès complet à toutes les fonctionnalités
- Gestion des utilisateurs
- Accès aux statistiques globales

### Agent
- Gestion des biens
- Gestion des clients
- Gestion des visites
- Accès limité aux paiements

## 🔒 Sécurité

- Authentification Firebase
- Règles Firestore pour la sécurité
- Protection des routes côté client
- Validation des données

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à tous les types d'écrans :
- Desktop
- Tablette
- Mobile

## 📄 Licence

Propriété de KEUR AYIB IMMOBILIER - Tous droits réservés © 2026
