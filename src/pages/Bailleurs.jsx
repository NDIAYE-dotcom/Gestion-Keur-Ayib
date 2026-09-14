import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, updateDoc } from 'firebase/firestore';
import { FiEdit2, FiFileText, FiPlus, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import { db } from '../services/firebase';
import './bailleurs.css';

const initialForm = { nom: '', telephone: '', email: '', adresse: '', notes: '' };
const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (month) => {
  const date = new Date(`${month}-01T12:00:00`);
  return Number.isNaN(date.getTime()) ? month : date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

const dateToMonth = (date) => {
  const value = date?.toDate ? date.toDate() : new Date(date);
  return Number.isNaN(value?.getTime()) ? currentMonth() : `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
};

const addMonths = (month, amount) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getPropertyAssignments = (property) => {
  if (property?.bailleurs?.length) return property.bailleurs;
  if (property?.bailleurId) {
    return [{ bailleurId: property.bailleurId, quotePart: 100, commissionPourcentage: property.commissionPourcentage || 0 }];
  }
  return [];
};

const Bailleurs = () => {
  const [bailleurs, setBailleurs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth());
  const [selectedBailleur, setSelectedBailleur] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBailleur, setEditingBailleur] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bailleursSnapshot, propertiesSnapshot, clientsSnapshot, paymentsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'bailleurs'), limit(500))),
        getDocs(query(collection(db, 'properties'), limit(500))),
        getDocs(query(collection(db, 'clients'), limit(500))),
        getDocs(query(collection(db, 'payments'), limit(500))),
      ]);
      setBailleurs(bailleursSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setProperties(propertiesSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setClients(clientsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setPayments(paymentsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (error) {
      console.error('Erreur chargement bailleurs:', error);
      alert('Impossible de charger les bailleurs et leurs états.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const statements = useMemo(() => {
    const result = new Map(bailleurs.map((owner) => [owner.id, {
      bailleur: owner,
      encaissementBrut: 0,
      commission: 0,
      netAVerser: 0,
      lines: [],
    }]));

    payments
      .filter((payment) => payment.statut === 'payé' && payment.typePaiement === 'loyer')
      .forEach((payment) => {
        const rent = payment.detailsPaiement?.loyer || payment.detailsPaiement;
        const monthsCovered = Math.max(1, Number(rent?.moisCouverts || 1));
        const referenceMonth = rent?.moisReference || dateToMonth(payment.datePaiement);
        const monthlyAmount = Number(rent?.loyerMensuel || Number(payment.montant || 0) / monthsCovered);
        const property = properties.find((item) => item.id === payment.propertyId);
        const assignments = getPropertyAssignments(property);
        if (!assignments.length) return;

        Array.from({ length: monthsCovered }, (_, index) => addMonths(referenceMonth, index))
          .filter((coveredMonth) => coveredMonth === month)
          .forEach(() => {
            assignments.forEach((assignment) => {
              const statement = result.get(assignment.bailleurId);
              if (!statement) return;
              const gross = monthlyAmount * (Number(assignment.quotePart || 0) / 100);
              const commission = gross * (Number(assignment.commissionPourcentage || 0) / 100);
              statement.encaissementBrut += gross;
              statement.commission += commission;
              statement.netAVerser += gross - commission;
              statement.lines.push({
                clientName: clients.find((client) => client.id === payment.clientId)?.nom || 'Locataire non renseigné',
                paymentDate: payment.datePaiement,
                paymentMethod: payment.methodePaiement || 'Méthode non renseignée',
                propertyTitle: property.titre || 'Bien sans titre',
                quotePart: Number(assignment.quotePart || 0),
                commissionRate: Number(assignment.commissionPourcentage || 0),
                gross,
                commission,
                net: gross - commission,
              });
            });
          });
      });
    return Array.from(result.values()).filter((statement) => selectedBailleur === 'all' || statement.bailleur.id === selectedBailleur);
  }, [bailleurs, clients, month, payments, properties, selectedBailleur]);

  const unassignedPaidRentCount = useMemo(() => payments.filter((payment) => {
    if (payment.statut !== 'payé' || payment.typePaiement !== 'loyer') return false;
    const property = properties.find((item) => item.id === payment.propertyId);
    return !getPropertyAssignments(property).length;
  }).length, [payments, properties]);

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount || 0);
  const formatPaymentDate = (date) => {
    const value = date?.toDate ? date.toDate() : new Date(date);
    return Number.isNaN(value.getTime()) ? 'Date non renseignée' : value.toLocaleDateString('fr-FR');
  };

  const openModal = (bailleur = null) => {
    setEditingBailleur(bailleur);
    setFormData(bailleur ? {
      nom: bailleur.nom || '', telephone: bailleur.telephone || '', email: bailleur.email || '', adresse: bailleur.adresse || '', notes: bailleur.notes || '',
    } : initialForm);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingBailleur(null); setFormData(initialForm); };

  const saveBailleur = async (event) => {
    event.preventDefault();
    try {
      if (editingBailleur) await updateDoc(doc(db, 'bailleurs', editingBailleur.id), formData);
      else await addDoc(collection(db, 'bailleurs'), { ...formData, createdAt: new Date() });
      closeModal();
      loadData();
    } catch (error) {
      console.error('Erreur enregistrement bailleur:', error);
      alert("Impossible d'enregistrer ce bailleur.");
    }
  };

  const removeBailleur = async (bailleur) => {
    if (!window.confirm(`Supprimer ${bailleur.nom} ? Les biens existants conserveront son ancienne affectation.`)) return;
    try { await deleteDoc(doc(db, 'bailleurs', bailleur.id)); loadData(); }
    catch (error) { console.error(error); alert('Impossible de supprimer ce bailleur.'); }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="bailleurs-page">
      <div className="bailleurs-header">
        <div><h1>Bailleurs & états mensuels</h1><p>Chaque bailleur dispose de son état, de sa commission et de son net à verser.</p></div>
        <button className="add-btn" onClick={() => openModal()}><FiPlus /> Ajouter un bailleur</button>
      </div>

      <section className="owners-list-card">
        <h2>Répertoire des bailleurs</h2>
        {bailleurs.length ? <div className="owners-list">
          {bailleurs.map((owner) => <div className="owner-card" key={owner.id}>
            <div className="owner-avatar"><FiUser /></div>
            <div className="owner-info"><strong>{owner.nom}</strong><span>{owner.telephone || 'Téléphone non renseigné'}</span><span>{owner.email || 'Email non renseigné'}</span></div>
            <div className="owner-actions"><button onClick={() => openModal(owner)} title="Modifier"><FiEdit2 /></button><button className="danger" onClick={() => removeBailleur(owner)} title="Supprimer"><FiTrash2 /></button></div>
          </div>)}
        </div> : <p className="empty-message">Aucun bailleur. Ajoutez-les ici, puis associez-les à chaque bien.</p>}
      </section>

      <section className="monthly-section">
        <div className="monthly-heading"><div><h2>État séparé par bailleur</h2><p>Calculé uniquement sur les loyers payés du mois sélectionné.</p></div><div className="statement-filters"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /><select value={selectedBailleur} onChange={(event) => setSelectedBailleur(event.target.value)}><option value="all">Tous les bailleurs</option>{bailleurs.map((owner) => <option key={owner.id} value={owner.id}>{owner.nom}</option>)}</select></div></div>
        {unassignedPaidRentCount > 0 && <p className="assignment-warning">{unassignedPaidRentCount} paiement{unassignedPaidRentCount > 1 ? 's' : ''} payé{unassignedPaidRentCount > 1 ? 's' : ''} ne peut{unassignedPaidRentCount > 1 ? 'vent' : ''} pas apparaître ici : le bien concerné n'a aucun bailleur associé. Ouvrez le bien dans « Biens », ajoutez son bailleur et indiquez sa quote-part.</p>}
        <p className="month-title">État de {monthLabel(month)}</p>
        <div className="statements-grid">
          {statements.map((statement) => <article className="statement-card" key={statement.bailleur.id}>
            <header><div><FiFileText /><h3>{statement.bailleur.nom}</h3></div><span>{statement.lines.length} ligne{statement.lines.length > 1 ? 's' : ''}</span></header>
            {statement.lines.length ? <div className="statement-lines">{statement.lines.map((line, index) => <div className="statement-line" key={`${line.propertyTitle}-${line.clientName}-${index}`}><div><strong>{line.clientName}</strong><span>{line.propertyTitle}</span><small>Paiement du {formatPaymentDate(line.paymentDate)} · {line.paymentMethod}</small><small>Part {line.quotePart} % · Commission {line.commissionRate} %</small></div><strong>{formatCurrency(line.net)}</strong></div>)}</div> : <p className="no-statement">Aucun loyer payé pour ce mois.</p>}
            <footer><div><span>Encaissement brut</span><strong>{formatCurrency(statement.encaissementBrut)}</strong></div><div><span>Commission agence</span><strong className="commission-value">-{formatCurrency(statement.commission)}</strong></div><div className="net-total"><span>Net à verser</span><strong>{formatCurrency(statement.netAVerser)}</strong></div></footer>
          </article>)}
        </div>
      </section>

      {showModal && <div className="modal-overlay" onClick={closeModal}><div className="modal-content" onClick={(event) => event.stopPropagation()}><div className="modal-header"><h2>{editingBailleur ? 'Modifier le bailleur' : 'Ajouter un bailleur'}</h2><button className="close-btn" onClick={closeModal}><FiX /></button></div><form className="bailleur-form" onSubmit={saveBailleur}><div className="form-group"><label>Nom complet *</label><input required value={formData.nom} onChange={(event) => setFormData({ ...formData, nom: event.target.value })} /></div><div className="form-row"><div className="form-group"><label>Téléphone</label><input type="tel" value={formData.telephone} onChange={(event) => setFormData({ ...formData, telephone: event.target.value })} /></div><div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></div></div><div className="form-group"><label>Adresse</label><input value={formData.adresse} onChange={(event) => setFormData({ ...formData, adresse: event.target.value })} /></div><div className="form-group"><label>Notes</label><textarea rows="3" value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} /></div><div className="form-actions"><button type="button" className="cancel-btn" onClick={closeModal}>Annuler</button><button className="submit-btn">Enregistrer</button></div></form></div></div>}
    </div>
  );
};

export default Bailleurs;
