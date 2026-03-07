import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, limit } from 'firebase/firestore';
import { FiPlus, FiCalendar, FiClock, FiHome, FiUser, FiFileText, FiX, FiTrash2, FiCheck } from 'react-icons/fi';
import { db, auth } from '../services/firebase';
import './agenda.css';

const Agenda = () => {
  const [appointments, setAppointments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    propertyId: '',
    clientId: '',
    dateVisite: '',
    heureVisite: '',
    statut: 'planifié',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // ✅ RAPIDE: Sans orderBy pour eviter les index
      const [appointmentsSnapshot, propertiesSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'appointments'), limit(50))),
        getDocs(query(collection(db, 'properties'), limit(50))),
        getDocs(query(collection(db, 'clients'), limit(50)))
      ]);

      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsData);

      const propertiesData = propertiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propertiesData);

      const clientsData = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'appointments'), {
        ...formData,
        dateVisite: new Date(formData.dateVisite),
        agentId: auth.currentUser?.uid,
      });
      alert('Rendez-vous planifié avec succès');
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la planification du rendez-vous');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        statut: newStatus
      });
      alert('Statut mis à jour avec succès');
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await deleteDoc(doc(db, 'appointments', id));
        alert('Rendez-vous supprimé avec succès');
        fetchData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du rendez-vous');
      }
    }
  };

  const openModal = () => {
    setFormData({
      propertyId: '',
      clientId: '',
      dateVisite: '',
      heureVisite: '',
      statut: 'planifié',
      notes: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      propertyId: '',
      clientId: '',
      dateVisite: '',
      heureVisite: '',
      statut: 'planifié',
      notes: '',
    });
  };

  const getPropertyTitle = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.titre : 'N/A';
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nom : 'N/A';
  };

  const filteredAppointments = appointments.filter(appointment => {
    return filterStatus === 'all' || appointment.statut === filterStatus;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (date) => {
    if (!date) return false;
    const d = date.toDate ? date.toDate() : new Date(date);
    return d >= new Date();
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="agenda-page">
      <div className="agenda-header">
        <h1>Agenda des Visites</h1>
        <button className="add-btn" onClick={openModal}>
          <FiPlus /> Planifier une Visite
        </button>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="planifié">Planifié</option>
          <option value="confirmé">Confirmé</option>
          <option value="annulé">Annulé</option>
          <option value="terminé">Terminé</option>
        </select>
      </div>

      {/* Liste des rendez-vous */}
      <div className="appointments-grid">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(appointment => (
            <div key={appointment.id} className={`appointment-card ${appointment.statut}`}>
              <div className="appointment-header">
                <div className="appointment-date">
                  <span className="date-icon"><FiCalendar /></span>
                  <div>
                    <p className="date">{formatDate(appointment.dateVisite)}</p>
                    <p className="time"><FiClock /> {appointment.heureVisite}</p>
                  </div>
                </div>
                <span className={`status-badge ${appointment.statut}`}>
                  {appointment.statut}
                </span>
              </div>

              <div className="appointment-body">
                <div className="info-row">
                  <span className="icon"><FiHome /></span>
                  <div>
                    <p className="label">Bien</p>
                    <p className="value">{getPropertyTitle(appointment.propertyId)}</p>
                  </div>
                </div>

                <div className="info-row">
                  <span className="icon"><FiUser /></span>
                  <div>
                    <p className="label">Client</p>
                    <p className="value">{getClientName(appointment.clientId)}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="info-row">
                    <span className="icon"><FiFileText /></span>
                    <div>
                      <p className="label">Notes</p>
                      <p className="value">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="appointment-actions">
                {appointment.statut === 'planifié' && (
                  <button 
                    className="confirm-btn"
                    onClick={() => handleStatusUpdate(appointment.id, 'confirmé')}
                  >
                    <FiCheck /> Confirmer
                  </button>
                )}
                {(appointment.statut === 'planifié' || appointment.statut === 'confirmé') && (
                  <button 
                    className="complete-btn"
                    onClick={() => handleStatusUpdate(appointment.id, 'terminé')}
                  >
                    <FiCheck /> Terminer
                  </button>
                )}
                {appointment.statut !== 'annulé' && appointment.statut !== 'terminé' && (
                  <button 
                    className="cancel-btn"
                    onClick={() => handleStatusUpdate(appointment.id, 'annulé')}
                  >
                    <FiX /> Annuler
                  </button>
                )}
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(appointment.id)}
                >
                  <FiTrash2 /> Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">Aucun rendez-vous trouvé</p>
        )}
      </div>

      {/* Modal de planification */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Planifier une Visite</h2>
              <button className="close-btn" onClick={closeModal}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-group">
                <label>Bien *</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                  required
                >
                  <option value="">Sélectionner un bien</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.titre} - {property.localisation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Client *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.nom} - {client.telephone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date de la visite *</label>
                  <input
                    type="date"
                    value={formData.dateVisite}
                    onChange={(e) => setFormData({...formData, dateVisite: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Heure *</label>
                  <input
                    type="time"
                    value={formData.heureVisite}
                    onChange={(e) => setFormData({...formData, heureVisite: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Notes supplémentaires sur le rendez-vous..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn-form" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  Planifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
