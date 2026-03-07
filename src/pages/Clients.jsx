import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, limit } from 'firebase/firestore';
import { FiPlus, FiSearch, FiUser, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { db } from '../services/firebase';
import './clients.css';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // ✅ RAPIDE : Sans orderBy pour eviter les index
      const querySnapshot = await getDocs(
        query(collection(db, 'clients'), limit(50))
      );
      const clientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      alert('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (currentClient) {
        // Mise à jour
        await updateDoc(doc(db, 'clients', currentClient.id), formData);
        alert('Client mis à jour avec succès');
      } else {
        // Création
        await addDoc(collection(db, 'clients'), {
          ...formData,
          dateInscription: new Date(),
        });
        alert('Client ajouté avec succès');
      }

      fetchClients();
      closeModal();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du client');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await deleteDoc(doc(db, 'clients', id));
        alert('Client supprimé avec succès');
        fetchClients();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du client');
      }
    }
  };

  const openModal = (client = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        nom: client.nom,
        telephone: client.telephone,
        email: client.email,
        adresse: client.adresse,
        notes: client.notes || '',
      });
    } else {
      setCurrentClient(null);
      setFormData({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentClient(null);
    setFormData({
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      notes: '',
    });
  };

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="clients-page">
      <div className="clients-header">
        <h1>Gestion des Clients</h1>
        <button className="add-btn" onClick={() => openModal()}>
          <FiPlus /> Ajouter un Client
        </button>
      </div>

      {/* Recherche */}
      <div className="search-section">
        <div className="search-field">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Liste des clients */}
      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Adresse</th>
              <th>Date d'inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <tr key={client.id}>
                  <td data-label="Nom">
                    <div className="client-name">
                      <span className="avatar"><FiUser /></span>
                      {client.nom}
                    </div>
                  </td>
                  <td data-label="Téléphone">{client.telephone}</td>
                  <td data-label="Email" className="email-cell">{client.email}</td>
                  <td data-label="Adresse">{client.adresse}</td>
                  <td data-label="Date d'inscription">{formatDate(client.dateInscription)}</td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => openModal(client)}>
                        <FiEdit2 />
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(client.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-message">
                  Aucun client trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentClient ? 'Modifier le Client' : 'Ajouter un Client'}</h2>
              <button className="close-btn" onClick={closeModal}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit} className="client-form">
              <div className="form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Adresse *</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="4"
                  placeholder="Notes supplémentaires sur le client..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  {currentClient ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
