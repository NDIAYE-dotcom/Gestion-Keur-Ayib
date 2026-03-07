# 🚀 Code d'Optimisation Prêt à Utiliser

## OPÇÃO RÁPIDA : Copier-Coller les Changements

### 1️⃣ Commençons par `Dashboard.jsx`

Ouvrez : `/src/pages/Dashboard.jsx`

**ÉTAPE 1 : Ajouter les imports en haut**

Trouvez la ligne :
```javascript
import { getDocs, collection, doc, getDoc, query } from 'firebase/firestore';
```

Remplacez par :
```javascript
import { getDocs, collection, doc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
```

---

**ÉTAPE 2 : Mettre à jour `fetchDashboardData`**

Trouvez cette fonction (environ ligne 20-100), remplacez-la :

```javascript
const fetchDashboardData = async () => {
  try {
    setLoading(true);

    // ✅ Récents biens à vendre (limité à 5)
    const propertiesSnapshot = await getDocs(
      query(
        collection(db, 'properties'),
        where('statut', '==', 'à vendre'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
    );
    const recentProperties = propertiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // ✅ Total immeubles
    const allPropertiesSnapshot = await getDocs(collection(db, 'properties'));
    const totalProperties = allPropertiesSnapshot.size;

    // Compter par type
    let rentalCount = 0;
    let saleCount = 0;
    allPropertiesSnapshot.forEach(doc => {
      if (doc.data().type === 'location') rentalCount++;
      if (doc.data().type === 'vente') saleCount++;
    });

    // ✅ Clients (limité)
    const clientsSnapshot = await getDocs(
      query(
        collection(db, 'clients'),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    );
    const totalClients = clientsSnapshot.size;

    // ✅ Paiements du mois
    const paymentsSnapshot = await getDocs(
      query(
        collection(db, 'payments'),
        orderBy('date', 'desc'),
        limit(20)
      )
    );

    let monthlyRevenue = 0;
    let pendingPayments = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    paymentsSnapshot.forEach(doc => {
      const data = doc.data();
      const paymentDate = data.date?.toDate?.() || new Date(data.date);
      
      if (paymentDate.getMonth() === currentMonth && 
          paymentDate.getFullYear() === currentYear) {
        monthlyRevenue += data.montant || 0;
      }
      
      if (data.statut === 'en attente') {
        pendingPayments += data.montant || 0;
      }
    });

    // ✅ Rendez-vous
    const appointmentsSnapshot = await getDocs(
      query(
        collection(db, 'appointments'),
        where('statut', '!=', 'terminé'),
        orderBy('date', 'asc'),
        limit(10)
      )
    );
    const upcomingAppointments = appointmentsSnapshot.size;

    // Mettre à jour l'état
    setStats({
      totalProperties,
      rentalProperties: rentalCount,
      saleProperties: saleCount,
      totalClients,
      monthlyRevenue,
      pendingPayments,
      upcomingAppointments,
      recentProperties
    });

    setLoading(false);
  } catch (error) {
    console.error('Erreur lors du chargement du dashboard:', error);
    setError('Erreur lors du chargement des données');
    setLoading(false);
  }
};
```

---

### 2️⃣ Optimiser `Properties.jsx`

Ouvrez : `/src/pages/Properties.jsx`

**Ajouter les imports :**
```javascript
import { query, orderBy, limit, where, startAfter } from 'firebase/firestore';
```

**Trouver et remplacer `fetchProperties`** :

```javascript
const fetchProperties = async () => {
  try {
    setLoading(true);

    // ✅ Charger par pages (30 à la fois)
    const propertiesSnapshot = await getDocs(
      query(
        collection(db, 'properties'),
        orderBy('createdAt', 'desc'),
        limit(30)
      )
    );

    const propsData = propertiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setProperties(propsData);
    setLoading(false);
  } catch (error) {
    console.error('Erreur:', error);
    setError('Erreur lors du chargement');
    setLoading(false);
  }
};
```

**Ajouter le lazy loading aux images :**

Trouvez la section d'affichage des images :
```javascript
{property.photos && property.photos.length > 0 ? (
  <img 
    src={property.photos[0]} 
    alt={property.titre}
    loading="lazy"  // ✅ AJOUTER CECI
    style={{ maxWidth: '100%', height: 'auto' }}
  />
) : (
  <div className="no-image">📷 Sans image</div>
)}
```

---

### 3️⃣ Optimiser `Clients.jsx`

Ouvrez : `/src/pages/Clients.jsx`

**Ajouter l'import :**
```javascript
import { query, orderBy, limit } from 'firebase/firestore';
```

**Remplacer `fetchClients` :**

```javascript
const fetchClients = async () => {
  try {
    setLoading(true);

    const clientsSnapshot = await getDocs(
      query(
        collection(db, 'clients'),
        orderBy('createdAt', 'desc'),
        limit(50)  // Limiter à 50 clients
      )
    );

    const clientsData = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setClients(clientsData);
    setLoading(false);
  } catch (error) {
    console.error('Erreur:', error);
    setError('Erreur lors du chargement');
    setLoading(false);
  }
};
```

---

### 4️⃣ Optimiser `Payments.jsx`

Ouvrez : `/src/pages/Payments.jsx`

**Ajouter l'import :**
```javascript
import { query, orderBy, limit } from 'firebase/firestore';
```

**Remplacer `fetchPayments` :**

```javascript
const fetchPayments = async () => {
  try {
    setLoading(true);

    const paymentsSnapshot = await getDocs(
      query(
        collection(db, 'payments'),
        orderBy('date', 'desc'),
        limit(100)  // Limiter à 100 paiements
      )
    );

    const paymentsData = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setPayments(paymentsData);
    setLoading(false);
  } catch (error) {
    console.error('Erreur:', error);
    setError('Erreur lors du chargement');
    setLoading(false);
  }
};
```

---

### 5️⃣ Optimiser `Agenda.jsx`

Ouvrez : `/src/pages/Agenda.jsx`

**Ajouter l'import :**
```javascript
import { query, orderBy, limit, where } from 'firebase/firestore';
```

**Remplacer `fetchAppointments` :**

```javascript
const fetchAppointments = async () => {
  try {
    setLoading(true);

    const appointmentsSnapshot = await getDocs(
      query(
        collection(db, 'appointments'),
        where('statut', '!=', 'annulé'),
        orderBy('date', 'asc'),
        limit(50)  // Limiter à 50 rendez-vous
      )
    );

    const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setAppointments(appointmentsData);
    setLoading(false);
  } catch (error) {
    console.error('Erreur:', error);
    setError('Erreur lors du chargement');
    setLoading(false);
  }
};
```

---

## ⚡ Résumé des Changements

| Page | Avant | Après |
|------|-------|-------|
| Dashboard | Charge TOUT | Charge top 5-10 |
| Properties | Charge tout | Charge 30 |
| Clients | Charge tout | Charge 50 |
| Payments | Charge tout | Charge 100 |
| Agenda | Charge tout | Charge 50 |

---

## 🧪 Tester

1. Fermez le serveur : **Ctrl+C** dans le terminal
2. Relancez : `npm run dev`
3. Ouvrez **F12 > Network**
4. Mesurer le temps de chargement

**Vous devriez voir une différence immédiate ! ⚡**

---

## ❓ Questions Fréquentes

### Q: Pourquoi les nombres (5, 30, 50...) ?
**R:** C'est un équilibre :
- Assez pour voir les données importantes
- Pas trop pour que ce soit lent
- Vous pouvez les ajuster selon vos besoins

### Q: Les anciennes données disparaissent ?
**R:** Non ! Les `limit()` vous montrent juste les plus récentes. Les anciennes restent dans Firestore.

### Q: Comment charger les anciennes données ?
**R:** Ajouter un bouton "Charger plus" avec pagination (voir guide avancé).

### Q: Les images toujours lentes ?
**R:** Compressez-les avant upload ! (voir OPTIMISATION_VITESSE.md)

---

## 🎯 Prochaine Étape

Si c'est toujours lent après ces changements, probablement :
1. **Images trop grosses** → Compressez (< 200 KB par image)
2. **Trop de rendez-vous/paiements** → Diminuez les `limit()` numbers
3. **Firebase loin** → Utiliser Cloud CDN (avancé)

**Testez les changements et envoyez-moi une capture ! 📸**
