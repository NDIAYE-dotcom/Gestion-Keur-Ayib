# Règles de Sécurité Firebase

## Firestore Security Rules

Copiez ces règles dans Firebase Console > Firestore Database > Règles

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
    
    // Fonction pour vérifier si l'utilisateur est l'auteur
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Collection users - Profils des utilisateurs
    match /users/{userId} {
      // Tous les utilisateurs authentifiés peuvent lire
      allow read: if isAuthenticated();
      
      // Seuls les admins peuvent créer de nouveaux utilisateurs
      allow create: if isAdmin();
      
      // Les admins ou l'utilisateur lui-même peuvent modifier
      allow update: if isAdmin() || isOwner(userId);
      
      // Seuls les admins peuvent supprimer
      allow delete: if isAdmin();
    }
    
    // Collection properties - Biens immobiliers
    match /properties/{propertyId} {
      // Tous les utilisateurs authentifiés peuvent lire
      allow read: if isAuthenticated();
      
      // Tous les utilisateurs authentifiés peuvent créer des biens
      allow create: if isAuthenticated();
      
      // Modification : admin ou créateur du bien
      allow update: if isAuthenticated();
      
      // Suppression : admin ou créateur du bien
      allow delete: if isAuthenticated();
    }
    
    // Collection clients - Clients
    match /clients/{clientId} {
      // Tous les utilisateurs authentifiés peuvent lire
      allow read: if isAuthenticated();
      
      // Tous les utilisateurs authentifiés peuvent créer
      allow create: if isAuthenticated();
      
      // Tous les utilisateurs authentifiés peuvent modifier
      allow update: if isAuthenticated();
      
      // Tous les utilisateurs authentifiés peuvent supprimer
      allow delete: if isAuthenticated();
    }
    
    // Collection payments - Paiements
    match /payments/{paymentId} {
      // Tous les utilisateurs authentifiés peuvent lire
      allow read: if isAuthenticated();
      
      // Tous les utilisateurs authentifiés peuvent créer
      allow create: if isAuthenticated();
      
      // Seuls les admins peuvent modifier les paiements
      allow update: if isAdmin();
      
      // Seuls les admins peuvent supprimer les paiements
      allow delete: if isAuthenticated();
    }
    
    // Collection appointments - Rendez-vous
    match /appointments/{appointmentId} {
      // Tous les utilisateurs authentifiés peuvent lire
      allow read: if isAuthenticated();
      
      // Tous les utilisateurs authentifiés peuvent créer
      allow create: if isAuthenticated();
      
      // Modification par l'agent assigné ou admin
      allow update: if isAuthenticated();
      
      // Suppression par l'agent assigné ou admin
      allow delete: if isAuthenticated();
    }
  }
}
```

## Storage Security Rules

Copiez ces règles dans Firebase Console > Storage > Règles

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Dossier des photos de biens immobiliers
    match /properties/{allPaths=**} {
      // Lecture : tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Écriture : utilisateurs authentifiés avec restrictions
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Seulement images
      
      // Suppression : utilisateurs authentifiés
      allow delete: if request.auth != null;
    }
    
    // Dossier des photos de profil (si ajouté plus tard)
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024  // Max 2MB
                   && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Notes de Sécurité

### 🔒 Authentification
- Seuls les utilisateurs authentifiés peuvent accéder aux données
- La vérification se fait via `request.auth != null`

### 👤 Rôles
- **Admin** : Accès complet à toutes les fonctionnalités
- **Agent** : Peut gérer les biens, clients, visites
- Le rôle est stocké dans Firestore collection `users`

### 📁 Storage
- Limite de taille : 5MB pour les photos de biens
- Types acceptés : images uniquement (JPEG, PNG, etc.)
- Utilisateurs authentifiés uniquement

### ⚠️ Recommandations

1. **Mode Production**
   - Toujours utiliser ces règles en production
   - Ne jamais utiliser "mode test" en production

2. **Validation des Données**
   - Ajouter des validations côté client
   - Valider les types de données avant l'envoi

3. **Audit**
   - Surveiller les logs Firebase pour détecter des accès suspects
   - Revoir régulièrement les règles de sécurité

4. **Backup**
   - Exporter régulièrement les données Firestore
   - Utiliser Firebase Backup si disponible

### 🔄 Mise à Jour des Règles

Pour modifier les règles :
1. Aller dans Firebase Console
2. Sélectionner Firestore Database ou Storage
3. Cliquer sur "Règles"
4. Copier-coller les nouvelles règles
5. Cliquer sur "Publier"

### ⚡ Test des Règles

Firebase propose un simulateur pour tester les règles :
1. Dans l'onglet "Règles"
2. Cliquer sur "Simulateur de règles"
3. Tester différents scénarios d'accès

---

**Important** : Ces règles sont conçues pour un environnement de production. Adaptez-les selon vos besoins spécifiques.
