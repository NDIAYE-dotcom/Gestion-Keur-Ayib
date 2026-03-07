import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { FiRefreshCw, FiHome, FiUsers, FiDollarSign, FiClock, FiCalendar } from 'react-icons/fi';
import { MdOutlineApartment } from 'react-icons/md';
import { db } from '../services/firebase';
import './dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    propertiesForRent: 0,
    propertiesForSale: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    upcomingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentClients, setRecentClients] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Timeout de 10 secondes
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );

    try {
      setLoading(true);

      // ✅ ULTRA RAPIDE : Requêtes sans orderBy (pas besoin d'index)
      const dataPromise = Promise.all([
        getDocs(query(collection(db, 'properties'), limit(50))),
        getDocs(query(collection(db, 'clients'), limit(50))),
        getDocs(query(collection(db, 'payments'), limit(100))),
        getDocs(query(collection(db, 'appointments'), limit(50)))
      ]);

      const [propertiesSnapshot, clientsSnapshot, paymentsSnapshot, appointmentsSnapshot] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]);

      // Traiter les données
      const properties = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const forRent = properties.filter(p => p.statut === 'à louer').length;
      const forSale = properties.filter(p => p.statut === 'à vendre').length;

      // Calculer les paiements du mois
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyPayments = payments.filter(p => {
        const paymentDate = p.datePaiement?.toDate();
        return paymentDate >= firstDayOfMonth && p.statut === 'payé';
      });
      
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.montant || 0), 0);
      const pendingPayments = payments.filter(p => p.statut === 'en attente').length;

      // Compter les rendez-vous à venir
      const upcomingAppointments = appointments.filter(a => {
        const appointmentDate = a.dateVisite?.toDate();
        return appointmentDate >= new Date() && a.statut === 'planifié';
      }).length;

      setStats({
        totalProperties: properties.length,
        propertiesForRent: forRent,
        propertiesForSale: forSale,
        totalClients: clients.length,
        monthlyRevenue: monthlyRevenue,
        pendingPayments: pendingPayments,
        upcomingAppointments: upcomingAppointments,
      });

      // Récupérer les 5 derniers biens
      const sortedProperties = properties.sort((a, b) => 
        (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)
      ).slice(0, 5);
      setRecentProperties(sortedProperties);

      // Récupérer les 5 derniers clients
      const sortedClients = clients.sort((a, b) => 
        (b.dateInscription?.toDate() || 0) - (a.dateInscription?.toDate() || 0)
      ).slice(0, 5);
      setRecentClients(sortedClients);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      if (error.message === 'Timeout') {
        alert('⚠️ Connexion lente détectée. Votre base de données Firestore est peut-être vide ou les collections n\'existent pas encore.\n\nL\'application va s\'afficher avec des données vides.');
      }
      // Initialiser avec des données vides pour que l'interface s'affiche
      setStats({
        totalProperties: 0,
        propertiesForRent: 0,
        propertiesForSale: 0,
        totalClients: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        upcomingAppointments: 0,
      });
      setRecentProperties([]);
      setRecentClients([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de Bord</h1>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          <FiRefreshCw /> Actualiser
        </button>
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><MdOutlineApartment /></div>
          <div className="stat-content">
            <h3>Total Biens</h3>
            <p className="stat-number">{stats.totalProperties}</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon"><FiHome /></div>
          <div className="stat-content">
            <h3>À Louer</h3>
            <p className="stat-number">{stats.propertiesForRent}</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon"><MdOutlineApartment /></div>
          <div className="stat-content">
            <h3>À Vendre</h3>
            <p className="stat-number">{stats.propertiesForSale}</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon"><FiUsers /></div>
          <div className="stat-content">
            <h3>Total Clients</h3>
            <p className="stat-number">{stats.totalClients}</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon"><FiDollarSign /></div>
          <div className="stat-content">
            <h3>Revenus du Mois</h3>
            <p className="stat-number">{formatCurrency(stats.monthlyRevenue)}</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon"><FiClock /></div>
          <div className="stat-content">
            <h3>Paiements en Attente</h3>
            <p className="stat-number">{stats.pendingPayments}</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon"><FiCalendar /></div>
          <div className="stat-content">
            <h3>Rendez-vous à Venir</h3>
            <p className="stat-number">{stats.upcomingAppointments}</p>
          </div>
        </div>
      </div>

      {/* Section des activités récentes */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Biens Récents</h2>
          <div className="list-container">
            {recentProperties.length > 0 ? (
              recentProperties.map(property => (
                <div key={property.id} className="list-item">
                  <div className="list-item-icon"><MdOutlineApartment /></div>
                  <div className="list-item-content">
                    <h4>{property.titre}</h4>
                    <p>{property.type} • {property.statut}</p>
                    <p className="price">{formatCurrency(property.prix)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">Aucun bien enregistré</p>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Clients Récents</h2>
          <div className="list-container">
            {recentClients.length > 0 ? (
              recentClients.map(client => (
                <div key={client.id} className="list-item">
                  <div className="list-item-icon"><FiUsers /></div>
                  <div className="list-item-content">
                    <h4>{client.nom}</h4>
                    <p>{client.telephone}</p>
                    <p className="email">{client.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">Aucun client enregistré</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
