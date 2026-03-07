# PLAN DE DÉVELOPPEMENT - KEUR AYIB IMMOBILIER

## 📋 Guide Étape par Étape

### ÉTAPE 1 : Configuration Initiale

#### 1.1 Installer Node.js
```bash
# Télécharger et installer Node.js depuis https://nodejs.org
# Vérifier l'installation
node --version
npm --version
```

#### 1.2 Naviguer vers le projet
```bash
cd "/Users/apple/Desktop/Gestion Keur Ayib"
```

#### 1.3 Installer les dépendances
```bash
npm install
```

---

### ÉTAPE 2 : Configuration Firebase

#### 2.1 Créer un projet Firebase
1. Aller sur https://console.firebase.google.com
2. Cliquer sur "Ajouter un projet"
3. Nommer le projet : "keur-ayib-immobilier"
4. Suivre les étapes de configuration

#### 2.2 Activer Authentication
1. Dans la console Firebase, aller dans "Authentication"
2. Cliquer sur "Commencer"
3. Activer "Email/Password" comme méthode de connexion
4. Créer un premier utilisateur admin :
   - Email : admin@keurayib.com
   - Mot de passe : (choisir un mot de passe sécurisé)

#### 2.3 Activer Firestore Database
1. Dans la console Firebase, aller dans "Firestore Database"
2. Cliquer sur "Créer une base de données"
3. Choisir "Démarrer en mode test" (pour le développement)
4. Sélectionner une région proche (ex: europe-west)

#### 2.4 Activer Storage
1. Dans la console Firebase, aller dans "Storage"
2. Cliquer sur "Commencer"
3. Accepter les règles par défaut

#### 2.5 Récupérer les credentials Firebase
1. Dans la console Firebase, aller dans "Paramètres du projet" (icône d'engrenage)
2. Descendre jusqu'à "Vos applications"
3. Cliquer sur l'icône Web (</>)
4. Enregistrer l'application avec le nom "Keur Ayib Web"
5. Copier l'objet `firebaseConfig`

#### 2.6 Configurer firebase.js
1. Ouvrir `src/services/firebase.js`
2. Remplacer les valeurs par celles copiées :
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

---

### ÉTAPE 3 : Configuration des Règles de Sécurité Firestore

Dans la console Firebase > Firestore Database > Règles, copier ces règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fonction pour vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction pour vérifier si l'utilisateur est admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Collection users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update, delete: if isAdmin() || request.auth.uid == userId;
    }
    
    // Collection properties
    match /properties/{propertyId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    // Collection clients
    match /clients/{clientId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    // Collection payments
    match /payments/{paymentId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
    
    // Collection appointments
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated();
    }
  }
}
```

---

### ÉTAPE 4 : Configuration des Règles de Storage

Dans la console Firebase > Storage > Règles, copier ces règles :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /properties/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024 // 5MB max
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

### ÉTAPE 5 : Création du Profil Admin dans Firestore

1. Aller dans Firestore Database
2. Créer une collection "users"
3. Ajouter un document avec l'ID = UID de l'utilisateur admin créé
4. Ajouter les champs :
```javascript
{
  uid: "UID_DE_L_UTILISATEUR_ADMIN",
  email: "admin@keurayib.com",
  nom: "Administrateur",
  role: "admin",
  createdAt: (timestamp actuel)
}
```

Pour trouver l'UID :
- Aller dans Authentication
- Copier l'UID de l'utilisateur admin créé

---

### ÉTAPE 6 : Lancer l'Application

```bash
# Dans le terminal, depuis le dossier du projet
npm run dev
```

L'application sera accessible sur : http://localhost:5173

---

### ÉTAPE 7 : Première Connexion

1. Ouvrir http://localhost:5173
2. Vous serez redirigé vers la page de connexion
3. Entrer les credentials admin :
   - Email : admin@keurayib.com
   - Mot de passe : (celui que vous avez défini)
4. Cliquer sur "Se connecter"

---

## 🗄️ Structure des Collections Firestore

### Collection: `users`
```javascript
{
  uid: string,              // ID Firebase Auth
  email: string,            // Email de l'utilisateur
  nom: string,              // Nom complet
  role: 'admin' | 'agent',  // Rôle
  createdAt: timestamp      // Date de création
}
```

### Collection: `properties`
```javascript
{
  titre: string,                           // Titre du bien
  type: 'terrain' | 'maison' | 'appartement',
  statut: 'à vendre' | 'à louer',
  prix: number,                            // Prix en XOF
  localisation: string,                    // Adresse/Ville
  description: string,                     // Description détaillée
  superficie: number,                      // En m²
  chambres: number,                        // Nombre de chambres (optionnel)
  sallesDeBain: number,                    // Nombre de salles de bain (optionnel)
  photos: [string],                        // URLs Firebase Storage
  createdBy: string,                       // UID de l'agent
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Collection: `clients`
```javascript
{
  nom: string,              // Nom complet
  telephone: string,        // Numéro de téléphone
  email: string,            // Email
  adresse: string,          // Adresse physique
  notes: string,            // Notes supplémentaires (optionnel)
  dateInscription: timestamp
}
```

### Collection: `payments`
```javascript
{
  propertyId: string,                      // ID du bien
  clientId: string,                        // ID du client
  montant: number,                         // Montant en XOF
  datePaiement: timestamp,
  typePaiement: 'loyer' | 'vente' | 'caution' | 'autre',
  statut: 'payé' | 'en attente',
  methodePaiement: 'espèces' | 'virement' | 'chèque',
  notes: string                            // Notes (optionnel)
}
```

### Collection: `appointments`
```javascript
{
  propertyId: string,                      // ID du bien
  clientId: string,                        // ID du client
  agentId: string,                         // UID de l'agent
  dateVisite: timestamp,
  heureVisite: string,                     // Format: "14:30"
  statut: 'planifié' | 'confirmé' | 'annulé' | 'terminé',
  notes: string                            // Notes (optionnel)
}
```

---

## 🚀 Fonctionnalités par Page

### 📊 Dashboard
- ✅ Total des biens immobiliers
- ✅ Nombre de biens à louer
- ✅ Nombre de biens à vendre
- ✅ Total des clients
- ✅ Revenus du mois en cours
- ✅ Paiements en attente
- ✅ Rendez-vous à venir
- ✅ Liste des 5 derniers biens ajoutés
- ✅ Liste des 5 derniers clients inscrits

### 🏢 Gestion des Biens
- ✅ Affichage en grille avec images
- ✅ Filtres : type, statut
- ✅ Recherche par titre/localisation
- ✅ Ajout de bien avec upload multiple d'images
- ✅ Modification de bien
- ✅ Suppression de bien
- ✅ Affichage des détails (superficie, chambres, etc.)

### 👥 Gestion des Clients
- ✅ Tableau avec tous les clients
- ✅ Recherche par nom/téléphone/email
- ✅ Ajout de client
- ✅ Modification de client
- ✅ Suppression de client
- ✅ Affichage de la date d'inscription

### 💰 Gestion des Paiements
- ✅ Statistiques : total revenus, paiements reçus, en attente
- ✅ Filtres : type de paiement, statut
- ✅ Enregistrement de nouveau paiement
- ✅ Lien avec bien et client
- ✅ Historique complet des paiements
- ✅ Suppression de paiement

### 📅 Agenda
- ✅ Affichage en cartes
- ✅ Filtre par statut
- ✅ Planification de visite
- ✅ Modification du statut (confirmer, terminer, annuler)
- ✅ Suppression de rendez-vous
- ✅ Affichage de la date et heure

---

## 🎨 Design & UX

### Couleurs Principales
- Bleu primaire : `#1e3a8a` (sidebar)
- Vert succès : `#10b981` (biens à louer, revenus)
- Orange : `#f59e0b` (biens à vendre)
- Violet : `#8b5cf6` (clients)
- Rouge : `#ef4444` (suppression, annulation)

### Responsivité
- ✅ Desktop (> 1024px) : Affichage complet avec sidebar
- ✅ Tablette (768px - 1024px) : Sidebar rétractable
- ✅ Mobile (< 768px) : Sidebar en overlay

---

## 🔒 Sécurité

### Frontend
- ✅ Routes protégées avec authentification
- ✅ Redirection automatique vers login si non authentifié
- ✅ Vérification de session au chargement

### Backend (Firebase)
- ✅ Règles Firestore pour l'accès aux données
- ✅ Règles Storage pour les uploads d'images
- ✅ Validation des types de fichiers
- ✅ Limite de taille d'images : 5MB

---

## 📝 Commandes Utiles

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview
```

---

## 🐛 Dépannage

### Problème : Firebase n'est pas configuré
**Solution** : Vérifier que `src/services/firebase.js` contient les bons credentials

### Problème : Erreur d'authentification
**Solution** : 
1. Vérifier que Authentication est activé dans Firebase
2. Vérifier que l'utilisateur existe dans Firebase Authentication
3. Vérifier que le profil existe dans Firestore collection "users"

### Problème : Impossible d'uploader des images
**Solution** :
1. Vérifier que Storage est activé dans Firebase
2. Vérifier les règles de Storage
3. Vérifier la taille des images (< 5MB)

### Problème : Erreur de permission Firestore
**Solution** :
1. Vérifier les règles Firestore
2. Vérifier que l'utilisateur est authentifié
3. Vérifier le rôle de l'utilisateur dans la collection "users"

---

## 📚 Ressources

- [Documentation React](https://react.dev)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Vite](https://vitejs.dev)
- [Documentation React Router](https://reactrouter.com)

---

## 🎯 Prochaines Améliorations Possibles

1. **Notifications**
   - Rappels automatiques pour les rendez-vous
   - Alertes pour les paiements en retard

2. **Rapports**
   - Export PDF des rapports mensuels
   - Graphiques de performance

3. **Multi-utilisateurs**
   - Gestion complète des agents
   - Attribution de biens à des agents spécifiques
   - Système de permissions granulaires

4. **Recherche Avancée**
   - Filtres combinés
   - Recherche géographique sur carte

5. **Messagerie**
   - Chat interne entre agents
   - Notifications push

6. **Mobile App**
   - Application mobile native (React Native)

---

© 2026 KEUR AYIB IMMOBILIER - Tous droits réservés
