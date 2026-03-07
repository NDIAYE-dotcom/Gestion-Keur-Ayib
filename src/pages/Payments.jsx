import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, limit } from 'firebase/firestore';
import { FiPlus, FiTrash2, FiX, FiFileText, FiDownload } from 'react-icons/fi';
import { db } from '../services/firebase';
import jsPDF from 'jspdf';
import './payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [previewPayment, setPreviewPayment] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const logoDataUrlRef = useRef(null);

  const [formData, setFormData] = useState({
    propertyId: '',
    clientId: '',
    montant: '',
    typePaiement: 'loyer',
    statut: 'payé',
    methodePaiement: 'espèces',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // ✅ RAPIDE: Sans orderBy pour eviter les index
      const [paymentsSnapshot, propertiesSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'payments'), limit(100))),
        getDocs(query(collection(db, 'properties'), limit(50))),
        getDocs(query(collection(db, 'clients'), limit(50)))
      ]);

      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);

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
      await addDoc(collection(db, 'payments'), {
        ...formData,
        montant: Number(formData.montant),
        datePaiement: new Date(),
      });
      alert('Paiement enregistré avec succès');
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await deleteDoc(doc(db, 'payments', id));
        alert('Paiement supprimé avec succès');
        fetchData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du paiement');
      }
    }
  };

  const getLogoDataUrl = () => {
    if (logoDataUrlRef.current) {
      return Promise.resolve(logoDataUrlRef.current);
    }

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');

          if (!context) {
            console.warn('Canvas context non disponible');
            resolve(null);
            return;
          }

          context.drawImage(image, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          logoDataUrlRef.current = dataUrl;
          resolve(dataUrl);
        } catch (error) {
          console.error('Erreur conversion logo:', error);
          resolve(null);
        }
      };
      image.onerror = (error) => {
        console.error('Erreur chargement logo:', error);
        resolve(null);
      };
      // Charger depuis le dossier public
      image.src = '/KA.png';
    });
  };

  const buildInvoicePdf = async (payment) => {
    try {
      const pdf = new jsPDF();
      const property = properties.find(p => p.id === payment.propertyId);
      const client = clients.find(c => c.id === payment.clientId);
      const invoiceNumber = getInvoiceNumber(payment.id);
      const dateObj = getInvoiceDateObj(payment.datePaiement);
      const amount = Number(payment.montant || 0);
      const formattedAmount = formatInvoiceAmount(amount);

      // Fond blanc
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 210, 297, 'F');

      // Logo
      try {
        const logoDataUrl = await getLogoDataUrl();
        if (logoDataUrl && logoDataUrl.startsWith('data:image')) {
          pdf.addImage(logoDataUrl, 'PNG', 20, 15, 20, 20);
        }
      } catch (logoError) {
        console.warn('Logo non chargé dans le PDF:', logoError);
      }

      // En-tête gauche
      pdf.setTextColor(37, 99, 235);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('Keur Ayib', 42, 26);

      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Immobilier', 42, 33);
      pdf.text('Dakar, Sénégal', 42, 39);
      pdf.text('Tél: +221 33 XXX XX XX', 42, 45);

      // En-tête droite - FACTURE
      pdf.setTextColor(30, 58, 138);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.text('FACTURE', 190, 28, { align: 'right' });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text(`N°: ${invoiceNumber}`, 190, 37, { align: 'right' });
      pdf.text(`Date: ${dateObj.toLocaleDateString('fr-FR')}`, 190, 44, { align: 'right' });
      pdf.text(`Heure: ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 190, 51, { align: 'right' });

      // Ligne séparatrice
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(1);
      pdf.line(20, 65, 190, 65);

      // Client - en haut
      if (client?.nom) {
        pdf.setTextColor(55, 65, 81);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('FACTURÉ À:', 20, 56);
        pdf.setFont('helvetica', 'normal');
        pdf.text(client.nom, 20, 62);
      }

      // Tableau - fond
      pdf.setFillColor(249, 250, 251);
      pdf.rect(20, 75, 170, 40, 'F');
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(20, 75, 170, 40);

      // Tableau - en-têtes
      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('DÉSIGNATION', 28, 84);
      pdf.text('QUANTITÉ', 87, 84);
      pdf.text('PRIX UNITAIRE', 122, 84);
      pdf.text('TOTAL', 188, 84, { align: 'right' });

      // Tableau - ligne
      pdf.setDrawColor(209, 213, 219);
      pdf.line(28, 88, 188, 88);

      // Tableau - données
      pdf.setTextColor(17, 24, 39);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(property?.titre || 'Paiement immobilier', 28, 99);

      pdf.setFont('helvetica', 'normal');
      pdf.text('1', 90, 99, { align: 'center' });
      pdf.text(formattedAmount, 122, 99);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formattedAmount, 188, 99, { align: 'right' });

      // Totaux - fond
      pdf.setFillColor(249, 250, 251);
      pdf.rect(70, 130, 120, 44, 'F');

      // Totaux - lignes
      pdf.setTextColor(75, 85, 99);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sous-total:', 78, 142);
      pdf.text('TVA (0%):', 78, 152);

      pdf.setTextColor(8, 145, 178);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formattedAmount, 188, 142, { align: 'right' });
      pdf.text(formatInvoiceAmount(0), 188, 152, { align: 'right' });

      // Ligne avant total
      pdf.setDrawColor(209, 213, 219);
      pdf.line(78, 158, 188, 158);

      // Total à payer
      pdf.setTextColor(30, 64, 175);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('TOTAL À PAYER:', 78, 168);
      pdf.setTextColor(22, 163, 74);
      pdf.text(formattedAmount, 188, 168, { align: 'right' });

      // Séparateur
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.6);
      pdf.line(20, 192, 190, 192);

      // Pied de page
      pdf.setTextColor(30, 64, 175);
      pdf.setFontSize(18);
      pdf.text('Merci pour votre confiance !', 105, 205, { align: 'center' });

      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Cette facture est générée électroniquement et ne nécessite pas de signature.', 105, 216, { align: 'center' });
      pdf.text('En cas de besoin, contactez-nous au +221 33 XXX XX XX', 105, 224, { align: 'center' });

      // Notes
      if (payment.notes) {
        const splitNotes = pdf.splitTextToSize(`Notes: ${payment.notes}`, 165);
        pdf.setTextColor(75, 85, 99);
        pdf.setFontSize(9);
        pdf.text(splitNotes, 20, 250);
      }

      const fileName = `Facture_${invoiceNumber}_${client?.nom || 'Client'}.pdf`;
      return { pdf, fileName };
    } catch (error) {
      console.error('Erreur dans buildInvoicePdf:', error);
      throw error;
    }
  };

  const openInvoicePreview = (payment) => {
    setPreviewPayment(payment);
  };

  const closeInvoicePreview = () => {
    setPreviewPayment(null);
  };

  const downloadInvoice = async (payment) => {
    try {
      const { pdf, fileName } = await buildInvoicePdf(payment);
      pdf.save(fileName);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération de la facture. Veuillez réessayer.');
    }
  };

  const openModal = () => {
    setFormData({
      propertyId: '',
      clientId: '',
      montant: '',
      typePaiement: 'loyer',
      statut: 'payé',
      methodePaiement: 'espèces',
      notes: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      propertyId: '',
      clientId: '',
      montant: '',
      typePaiement: 'loyer',
      statut: 'payé',
      methodePaiement: 'espèces',
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

  const getInvoiceDateObj = (date) => {
    if (!date) return new Date();
    return date.toDate ? date.toDate() : new Date(date);
  };

  const getInvoiceNumber = (paymentId) => {
    return `INV-${paymentId.substring(0, 6).toUpperCase()}-${new Date().getFullYear().toString().slice(-2)}`;
  };

  const formatInvoiceAmount = (amount) => {
    const value = Number(amount || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ');
    return `${value} FCFA`;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesType = filterType === 'all' || payment.typePaiement === filterType;
    const matchesStatus = filterStatus === 'all' || payment.statut === filterStatus;
    return matchesType && matchesStatus;
  });

  const totalRevenue = filteredPayments
    .filter(p => p.statut === 'payé')
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="payments-page">
      <div className="payments-header">
        <h1>Gestion des Paiements</h1>
        <button className="add-btn" onClick={openModal}>
          <FiPlus /> Nouveau Paiement
        </button>
      </div>

      {/* Statistiques */}
      <div className="payments-stats">
        <div className="stat-card">
          <h3>Total Revenus</h3>
          <p className="stat-value">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <h3>Paiements Reçus</h3>
          <p className="stat-value">{filteredPayments.filter(p => p.statut === 'payé').length}</p>
        </div>
        <div className="stat-card">
          <h3>En Attente</h3>
          <p className="stat-value">{filteredPayments.filter(p => p.statut === 'en attente').length}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
          <option value="all">Tous les types</option>
          <option value="loyer">Loyer</option>
          <option value="vente">Vente</option>
          <option value="caution">Caution</option>
          <option value="autre">Autre</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="payé">Payé</option>
          <option value="en attente">En attente</option>
        </select>
      </div>

      {/* Table des paiements */}
      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Bien</th>
              <th>Client</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map(payment => (
                <tr key={payment.id}>
                  <td data-label="Date">{formatDate(payment.datePaiement)}</td>
                  <td data-label="Bien">{getPropertyTitle(payment.propertyId)}</td>
                  <td data-label="Client">{getClientName(payment.clientId)}</td>
                  <td data-label="Type">
                    <span className={`type-badge ${payment.typePaiement}`}>
                      {payment.typePaiement}
                    </span>
                  </td>
                  <td data-label="Montant" className="amount">{formatCurrency(payment.montant)}</td>
                  <td data-label="Méthode">{payment.methodePaiement}</td>
                  <td data-label="Statut">
                    <span className={`status-badge ${payment.statut === 'payé' ? 'paid' : 'pending'}`}>
                      {payment.statut}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button 
                        className="invoice-btn" 
                        onClick={() => openInvoicePreview(payment)}
                        title="Aperçu facture PDF"
                      >
                        <FiFileText />
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(payment.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-message">
                  Aucun paiement enregistré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enregistrer un Paiement</h2>
              <button className="close-btn" onClick={closeModal}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit} className="payment-form">
              <div className="form-row">
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
                        {property.titre}
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
                        {client.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Montant (XOF) *</label>
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({...formData, montant: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Type de paiement *</label>
                  <select
                    value={formData.typePaiement}
                    onChange={(e) => setFormData({...formData, typePaiement: e.target.value})}
                    required
                  >
                    <option value="loyer">Loyer</option>
                    <option value="vente">Vente</option>
                    <option value="caution">Caution</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Méthode de paiement *</label>
                  <select
                    value={formData.methodePaiement}
                    onChange={(e) => setFormData({...formData, methodePaiement: e.target.value})}
                    required
                  >
                    <option value="espèces">Espèces</option>
                    <option value="virement">Virement</option>
                    <option value="chèque">Chèque</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Statut *</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    required
                  >
                    <option value="payé">Payé</option>
                    <option value="en attente">En attente</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Notes supplémentaires..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewPayment && (
        <div className="invoice-preview-overlay" onClick={closeInvoicePreview}>
          <div className="invoice-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-preview-actions">
              <button
                className="download-pdf-btn"
                onClick={async () => {
                  await downloadInvoice(previewPayment);
                }}
              >
                <FiDownload /> Télécharger PDF
              </button>
              <button className="invoice-close-btn" onClick={closeInvoicePreview}>
                <FiX />
              </button>
            </div>

            <div className="invoice-paper">
              <div className="invoice-head">
                <div className="invoice-brand-block">
                  <img 
                    src="/KA.png" 
                    alt="Logo Keur Ayib" 
                    className="invoice-logo"
                    onError={(e) => {
                      console.error('Erreur chargement logo aperçu');
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                  <h2>Keur Ayib</h2>
                  <p>Immobilier</p>
                  <p>Dakar, Sénégal</p>
                  <p>Tél: +221 33 XXX XX XX</p>
                  </div>
                </div>
                <div className="invoice-title-block">
                  <h3>FACTURE</h3>
                  <p>N°: {getInvoiceNumber(previewPayment.id)}</p>
                  <p>Date: {formatDate(previewPayment.datePaiement)}</p>
                  <p>Heure: {getInvoiceDateObj(previewPayment.datePaiement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="invoice-separator" />

              <div className="invoice-table-card">
                <div className="invoice-table-head">
                  <span>DÉSIGNATION</span>
                  <span>QUANTITÉ</span>
                  <span>PRIX UNITAIRE</span>
                  <span>TOTAL</span>
                </div>
                <div className="invoice-table-row">
                  <span>{getPropertyTitle(previewPayment.propertyId)}</span>
                  <span>1</span>
                  <span>{formatInvoiceAmount(previewPayment.montant)}</span>
                  <strong>{formatInvoiceAmount(previewPayment.montant)}</strong>
                </div>
              </div>

              <div className="invoice-totals-box">
                <div><span>Sous-total:</span><strong>{formatInvoiceAmount(previewPayment.montant)}</strong></div>
                <div><span>TVA (0%):</span><strong>{formatInvoiceAmount(0)}</strong></div>
                <div className="invoice-total-line"><span>TOTAL À PAYER:</span><strong>{formatInvoiceAmount(previewPayment.montant)}</strong></div>
              </div>

              <div className="invoice-footer-separator" />

              <div className="invoice-thanks">Merci pour votre confiance !</div>
              <p className="invoice-note">Cette facture est générée électroniquement et ne nécessite pas de signature.</p>
              <p className="invoice-note">En cas de besoin, contactez-nous au +221 33 XXX XX XX</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
