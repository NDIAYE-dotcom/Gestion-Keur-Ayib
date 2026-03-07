import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { FiRefreshCw, FiSearch, FiPackage, FiHome, FiTag, FiDollarSign } from 'react-icons/fi';
import { db } from '../services/firebase';
import './inventory.css';

const Inventory = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('monthly');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, 'properties'), limit(200)));
      const data = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      setProperties(data);
    } catch (error) {
      console.error('Erreur chargement inventaire:', error);
      alert('Impossible de charger l\'inventaire pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getPropertyDate = (item) => {
    const rawDate = item.createdAt || item.dateAjout || item.dateCreation || item.updatedAt;

    if (!rawDate) {
      return null;
    }

    if (typeof rawDate?.toDate === 'function') {
      return rawDate.toDate();
    }

    if (rawDate instanceof Date) {
      return rawDate;
    }

    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const periodItems = useMemo(() => {
    const monthsByPeriod = {
      monthly: 1,
      threeMonths: 3,
      sixMonths: 6,
      yearly: 12,
    };

    const months = monthsByPeriod[periodFilter] || 1;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return properties.filter((item) => {
      const propertyDate = getPropertyDate(item);

      // Garder l'item visible si date absente pour éviter de masquer les anciennes données.
      if (!propertyDate) {
        return true;
      }

      return propertyDate >= cutoffDate;
    });
  }, [properties, periodFilter]);

  const filteredItems = useMemo(() => {
    return periodItems.filter((item) => {
      const title = (item.titre || '').toLowerCase();
      const location = (item.localisation || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      const needle = searchTerm.toLowerCase();

      const matchesSearch = title.includes(needle) || location.includes(needle) || type.includes(needle);
      const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [periodItems, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalItems = periodItems.length;
    const rentItems = periodItems.filter((item) => item.statut === 'à louer').length;
    const saleItems = periodItems.filter((item) => item.statut === 'à vendre').length;
    const totalValue = periodItems.reduce((sum, item) => sum + Number(item.prix || 0), 0);

    return { totalItems, rentItems, saleItems, totalValue };
  }, [periodItems]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="inventory-loading">
        <div className="spinner"></div>
        <p>Chargement de l'inventaire...</p>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1>Inventaire Immobilier</h1>
        <button className="inventory-refresh-btn" onClick={fetchInventory}>
          <FiRefreshCw /> Actualiser
        </button>
      </div>

      <div className="inventory-stats-grid">
        <div className="inventory-stat-card total">
          <div className="inventory-stat-icon"><FiPackage /></div>
          <div>
            <p className="inventory-stat-label">Total Biens</p>
            <p className="inventory-stat-value">{stats.totalItems}</p>
          </div>
        </div>
        <div className="inventory-stat-card rent">
          <div className="inventory-stat-icon"><FiHome /></div>
          <div>
            <p className="inventory-stat-label">À Louer</p>
            <p className="inventory-stat-value">{stats.rentItems}</p>
          </div>
        </div>
        <div className="inventory-stat-card sale">
          <div className="inventory-stat-icon"><FiTag /></div>
          <div>
            <p className="inventory-stat-label">À Vendre</p>
            <p className="inventory-stat-value">{stats.saleItems}</p>
          </div>
        </div>
        <div className="inventory-stat-card value">
          <div className="inventory-stat-icon"><FiDollarSign /></div>
          <div>
            <p className="inventory-stat-label">Valeur Estimée</p>
            <p className="inventory-stat-value money">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="inventory-filters">
        <div className="inventory-search-field">
          <FiSearch className="inventory-search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un bien (titre, type, localisation)..."
          />
        </div>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="à louer">À louer</option>
          <option value="à vendre">À vendre</option>
        </select>

        <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
          <option value="monthly">Mensuel</option>
          <option value="threeMonths">3 mois</option>
          <option value="sixMonths">6 mois</option>
          <option value="yearly">Annuel</option>
        </select>
      </div>

      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Bien</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Localisation</th>
              <th>Superficie</th>
              <th>Prix</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td data-label="Bien">{item.titre || '-'}</td>
                  <td data-label="Type">{item.type || '-'}</td>
                  <td data-label="Statut">
                    <span className={`inventory-status ${item.statut === 'à louer' ? 'rent' : 'sale'}`}>
                      {item.statut || '-'}
                    </span>
                  </td>
                  <td data-label="Localisation">{item.localisation || '-'}</td>
                  <td data-label="Superficie">{item.superficie ? `${item.superficie} m2` : '-'}</td>
                  <td data-label="Prix">{formatCurrency(Number(item.prix || 0))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="inventory-empty">
                  Aucun bien trouvé avec ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
