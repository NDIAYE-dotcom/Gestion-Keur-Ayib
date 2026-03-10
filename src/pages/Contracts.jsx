import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, addDoc, query, limit } from 'firebase/firestore';
import { FiFileText, FiRefreshCw, FiSave, FiDownload, FiUser, FiHome, FiCalendar } from 'react-icons/fi';
import jsPDF from 'jspdf';
import { db } from '../services/firebase';
import logoImage from '/KA.png';
import stampImage from '/Cahet KA-01.png';
import './contracts.css';

const ENTRY_MONTHS = 3;
const CONTACT_PHONE = '77 176 25 46 / 77 702 65 65';
const CONTACT_EMAIL = 'keurayibImmo@gmail.com';
const CONTRACTS_CACHE_KEY = 'keurAyib_contracts_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

const Contracts = () => {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractText, setContractText] = useState('');
  const logoDataUrlRef = useRef(null);
  const logoSizeRef = useRef({ width: 0, height: 0 });
  const stampDataUrlRef = useRef(null);
  const stampSizeRef = useRef({ width: 0, height: 0 });

  const [formData, setFormData] = useState({
    propertyId: '',
    clientId: '',
    dateSignature: new Date().toISOString().split('T')[0],
    dateDebut: '',
    dureeMois: '12',
    notes: '',
  });

  const readCache = () => {
    try {
      const cached = localStorage.getItem(CONTRACTS_CACHE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(CONTRACTS_CACHE_KEY);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  };

  const writeCache = (data) => {
    try {
      localStorage.setItem(CONTRACTS_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Cache write failed:', error);
    }
  };

  useEffect(() => {
    fetchData({ preferCache: true });
    getLogoDataUrl().catch((error) => console.warn('Erreur pre-chargement logo contrat:', error));
    getStampDataUrl().catch((error) => console.warn('Erreur pre-chargement cachet contrat:', error));
  }, []);

  const getLogoDataUrl = () => {
    if (logoDataUrlRef.current) {
      return Promise.resolve(logoDataUrlRef.current);
    }

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxSize = 500;
          let width = image.naturalWidth || image.width;
          let height = image.naturalHeight || image.height;

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) {
            resolve(null);
            return;
          }

          context.drawImage(image, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          logoDataUrlRef.current = dataUrl;
          logoSizeRef.current = { width, height };
          resolve(dataUrl);
        } catch (error) {
          console.error('Erreur conversion logo:', error);
          resolve(null);
        }
      };

      image.onerror = () => resolve(null);
      image.src = logoImage;
    });
  };

  const getStampDataUrl = () => {
    if (stampDataUrlRef.current) {
      return Promise.resolve(stampDataUrlRef.current);
    }

    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxSize = 500;
          let width = image.naturalWidth || image.width;
          let height = image.naturalHeight || image.height;

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) {
            resolve(null);
            return;
          }

          context.drawImage(image, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          stampDataUrlRef.current = dataUrl;
          stampSizeRef.current = { width, height };
          resolve(dataUrl);
        } catch (error) {
          console.error('Erreur conversion cachet:', error);
          resolve(null);
        }
      };

      image.onerror = () => resolve(null);
      image.src = stampImage;
    });
  };

  const fetchData = async ({ preferCache = false } = {}) => {
    let usedCache = false;

    if (preferCache) {
      const cached = readCache();
      if (cached) {
        setProperties(cached.properties || []);
        setClients(cached.clients || []);
        setLoading(false);
        usedCache = true;
      }
    }

    try {
      if (!usedCache) {
        setLoading(true);
      }
      const [propertiesSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'properties'), limit(100))),
        getDocs(query(collection(db, 'clients'), limit(100))),
      ]);

      const propertiesData = propertiesSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      const clientsData = clientsSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setProperties(propertiesData);
      setClients(clientsData);
      writeCache({ properties: propertiesData, clients: clientsData });
    } catch (error) {
      console.error('Erreur lors du chargement des contrats:', error);
      if (!usedCache) {
        alert('Erreur lors du chargement des données de contrat');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === formData.propertyId),
    [properties, formData.propertyId]
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === formData.clientId),
    [clients, formData.clientId]
  );

  const monthlyRent = Number(selectedProperty?.prix || 0);
  const entryAdvance = monthlyRent;
  const entryCaution = monthlyRent;
  const entryCommission = monthlyRent;
  const entryTotal = entryAdvance + entryCaution + entryCommission;
  const hasContractPreview = Boolean(contractText);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Formatage safe pour jsPDF (pas de caracteres Unicode speciaux)
  const formatCurrencyPdf = (amount) => {
    const num = Math.round(Number(amount) || 0);
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FCFA`;
  };

  const toLongDate = (dateValue) => {
    if (!dateValue) return '................';
    const dateObj = new Date(dateValue);
    if (Number.isNaN(dateObj.getTime())) return '................';
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const generateContractText = () => {
    if (!selectedProperty || !selectedClient) {
      alert('Veuillez sélectionner un bien et un client.');
      return '';
    }

    if (!formData.dateDebut) {
      alert('Veuillez renseigner la date de début du contrat.');
      return '';
    }

    const contract = `CONTRAT DE LOCATION\n\nRef. contrat : KAI-LOC-${new Date().getFullYear()}-${(selectedClient.id || '0000').slice(0, 4).toUpperCase()}\nDate de signature : ${toLongDate(formData.dateSignature)}\nLieu : Keur Ayib, Sénégal\n\nPARTIES AU CONTRAT\n\nBailleur\n- Keur Ayib Immobilier\n- Adresse : Keur Ayib, Sénégal\n- Téléphone : 77 176 25 46 / 77 702 65 65\n\nLocataire\n- Nom : ${selectedClient.nom || '................'}\n- Téléphone : ${selectedClient.telephone || '................'}\n- Email : ${selectedClient.email || '................'}\n- Adresse : ${selectedClient.adresse || '................'}\n\nOBJET DU CONTRAT\nLe présent contrat porte sur la location du bien \"${selectedProperty.titre || '................'}\" situé à ${selectedProperty.localisation || '................'}.\n\nARTICLE 1 - DUREE\nLa location est conclue pour une durée de ${formData.dureeMois} mois, à compter du ${toLongDate(formData.dateDebut)}.\n\nARTICLE 2 - LOYER MENSUEL\nLe loyer mensuel est fixé à ${formatCurrency(monthlyRent)} payable au plus tard le 05 de chaque mois.\n\nARTICLE 3 - PAIEMENT D'ENTREE OBLIGATOIRE (${ENTRY_MONTHS} MOIS)\nLe locataire verse à la signature une somme totale de ${formatCurrency(entryTotal)}, répartie comme suit :\n- Avance : ${formatCurrency(entryAdvance)}\n- Caution : ${formatCurrency(entryCaution)}\n- Commission : ${formatCurrency(entryCommission)}\n\nARTICLE 4 - OBLIGATIONS DU LOCATAIRE\nLe locataire s'engage à utiliser le bien en bon père de famille, à régler les charges locatives et à respecter le règlement intérieur.\n\nARTICLE 5 - RESILIATION\nToute résiliation anticipée devra être notifiée par écrit selon les délais légaux applicables.\n\nNOTES COMPLEMENTAIRES\n${formData.notes || 'Aucune note complémentaire.'}\n\nFait à Keur Ayib, Sénégal, le ${toLongDate(formData.dateSignature)}\n\nSignature du bailleur\n____________________\n\nSignature du locataire\n____________________\n`;

    setContractText(contract);
    return contract;
  };

  const handleSaveContract = async () => {
    const textToSave = contractText || generateContractText();
    if (!textToSave) {
      return;
    }

    try {
      setSaving(true);
      
      // Enregistrer le contrat
      const contractRef = await addDoc(collection(db, 'contracts'), {
        propertyId: formData.propertyId,
        propertyTitle: selectedProperty?.titre || '',
        clientId: formData.clientId,
        clientName: selectedClient?.nom || '',
        dateSignature: formData.dateSignature ? new Date(formData.dateSignature) : new Date(),
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : null,
        dureeMois: Number(formData.dureeMois),
        loyerMensuel: monthlyRent,
        entreeLocation: {
          avance: entryAdvance,
          caution: entryCaution,
          commission: entryCommission,
          total: entryTotal,
          moisObligatoires: ENTRY_MONTHS,
        },
        notes: formData.notes,
        texteContrat: textToSave,
        createdAt: new Date(),
      });

      // Créer automatiquement le paiement d'entrée correspondant
      const autoEntryNote = `Entree location: Avance ${formatCurrency(entryAdvance)}, Caution ${formatCurrency(entryCaution)}, Commission ${formatCurrency(entryCommission)}. Contrat ref: ${contractRef.id}`;

      await addDoc(collection(db, 'payments'), {
        propertyId: formData.propertyId,
        clientId: formData.clientId,
        montant: entryTotal,
        typePaiement: 'entree-location',
        statut: 'payé',
        methodePaiement: 'espèces',
        detailsPaiement: {
          avance: entryAdvance,
          caution: entryCaution,
          commission: entryCommission,
          total: entryTotal,
        },
        notes: [autoEntryNote, formData.notes].filter(Boolean).join(' - '),
        datePaiement: formData.dateSignature ? new Date(formData.dateSignature) : new Date(),
        contractId: contractRef.id,
      });

      alert('Contrat et paiement d\'entrée enregistrés avec succès.');
    } catch (error) {
      console.error('Erreur enregistrement contrat:', error);
      alert('Erreur lors de l\'enregistrement du contrat.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    const textToExport = contractText || generateContractText();
    if (!textToExport) {
      return;
    }

    generateStyledPdf().catch((error) => {
      console.error('Erreur generation PDF contrat:', error);
      alert('Impossible de generer le PDF pour le moment.');
    });
  };

  const generateStyledPdf = async () => {
    const pdf = new jsPDF();
    const blue = [30, 64, 175];
    const dark = [17, 24, 39];
    const muted = [75, 85, 99];
    const pageHeight = pdf.internal.pageSize.getHeight();

    let y = 20;
    const pageBottom = 282;

    const ensureSpace = (needed = 10) => {
      if (y + needed <= pageBottom) {
        return;
      }
      pdf.addPage();
      y = 18;
    };

    const drawSectionTitle = (title) => {
      ensureSpace(12);
      pdf.setTextColor(blue[0], blue[1], blue[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(title, 20, y);
      y += 2;
      pdf.setDrawColor(191, 219, 254);
      pdf.setLineWidth(0.7);
      pdf.line(20, y, 190, y);
      y += 6;
    };

    const drawParagraph = (text, indent = 20, width = 165) => {
      const lines = pdf.splitTextToSize(text, width);
      lines.forEach((line) => {
        ensureSpace(6);
        pdf.setTextColor(dark[0], dark[1], dark[2]);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        pdf.text(line, indent, y);
        y += 5.5;
      });
      y += 1;
    };

    // Header
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 210, 297, 'F');

    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl && logoDataUrl.startsWith('data:image')) {
      const rawWidth = logoSizeRef.current.width || 1;
      const rawHeight = logoSizeRef.current.height || 1;
      const maxLogoWidth = 36;
      const maxLogoHeight = 20;
      const scale = Math.min(maxLogoWidth / rawWidth, maxLogoHeight / rawHeight);
      const drawWidth = rawWidth * scale;
      const drawHeight = rawHeight * scale;
      pdf.addImage(logoDataUrl, 'PNG', 20, 12, drawWidth, drawHeight);
    }

    pdf.setTextColor(blue[0], blue[1], blue[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(19);
    pdf.text('CONTRAT DE LOCATION', 190, 18, { align: 'right' });

    pdf.setFontSize(10);
    pdf.setTextColor(muted[0], muted[1], muted[2]);
    pdf.text(`Ref: KAI-LOC-${new Date().getFullYear()}-${(selectedClient?.id || '0000').slice(0, 4).toUpperCase()}`, 190, 24, { align: 'right' });
    pdf.text(`Date: ${toLongDate(formData.dateSignature)}`, 190, 29, { align: 'right' });
    pdf.text('Keur Ayib, Senegal', 190, 34, { align: 'right' });

    pdf.setDrawColor(191, 219, 254);
    pdf.setLineWidth(1);
    pdf.line(20, 40, 190, 40);
    y = 48;

    drawSectionTitle('PARTIES AU CONTRAT');
    drawParagraph('Bailleur: Keur Ayib Immobilier');
    drawParagraph('Adresse: Keur Ayib, Senegal');
    drawParagraph(`Telephone: ${CONTACT_PHONE}`);
    drawParagraph(`Email: ${CONTACT_EMAIL}`);
    y += 1;
    drawParagraph(`Locataire: ${selectedClient?.nom || '................'}`);
    drawParagraph(`Telephone: ${selectedClient?.telephone || '................'}`);
    drawParagraph(`Email: ${selectedClient?.email || '................'}`);
    drawParagraph(`Adresse: ${selectedClient?.adresse || '................'}`);

    drawSectionTitle('OBJET DU CONTRAT');
    drawParagraph(`Le present contrat porte sur la location du bien "${selectedProperty?.titre || '................'}" situe a ${selectedProperty?.localisation || '................'}.`);

    drawSectionTitle('ARTICLE 1 - DUREE');
    drawParagraph(`La location est conclue pour une duree de ${formData.dureeMois} mois, a compter du ${toLongDate(formData.dateDebut)}.`);

    drawSectionTitle('ARTICLE 2 - LOYER MENSUEL');
    drawParagraph(`Le loyer mensuel est fixe a ${formatCurrencyPdf(monthlyRent)}.`);
    drawParagraph('Paiement exigible au plus tard le 05 de chaque mois.');

    drawSectionTitle(`ARTICLE 3 - PAIEMENT D'ENTREE OBLIGATOIRE (${ENTRY_MONTHS} MOIS)`);
    ensureSpace(38);
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(20, y, 170, 38, 2, 2, 'F');
    pdf.setDrawColor(191, 219, 254);
    pdf.roundedRect(20, y, 170, 38, 2, 2, 'S');
    y += 7;
    drawParagraph(`Total a verser a la signature: ${formatCurrencyPdf(entryTotal)}`, 25, 155);
    drawParagraph(`- Avance: ${formatCurrencyPdf(entryAdvance)}`, 25, 155);
    drawParagraph(`- Caution: ${formatCurrencyPdf(entryCaution)}`, 25, 155);
    drawParagraph(`- Commission: ${formatCurrencyPdf(entryCommission)}`, 25, 155);

    drawSectionTitle('ARTICLE 4 - OBLIGATIONS DU LOCATAIRE');
    drawParagraph('Le locataire s engage a utiliser le bien en bon pere de famille, a regler les charges locatives et a respecter le reglement interieur.');

    drawSectionTitle('ARTICLE 5 - RESILIATION');
    drawParagraph('Toute resiliation anticipee devra etre notifiee par ecrit selon les delais legaux applicables.');

    drawSectionTitle('NOTES COMPLEMENTAIRES');
    drawParagraph(formData.notes || 'Aucune note complementaire.');

    ensureSpace(32);
    y += 6;
    pdf.setTextColor(dark[0], dark[1], dark[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Fait a Keur Ayib, Senegal, le ${toLongDate(formData.dateSignature)}`, 20, y);
    y += 12;

    pdf.text('Signature du bailleur', 20, y);
    pdf.text('Signature du locataire', 120, y);
    y += 2;
    pdf.setDrawColor(148, 163, 184);
    pdf.line(20, y + 8, 90, y + 8);
    pdf.line(120, y + 8, 190, y + 8);
    y += 18; // juste en dessous des lignes de signature

    const stampDataUrl = await getStampDataUrl();
    if (stampDataUrl && stampDataUrl.startsWith('data:image')) {
      const rawWidth = stampSizeRef.current.width || 1;
      const rawHeight = stampSizeRef.current.height || 1;
      const maxStampWidth = 58;
      const maxStampHeight = 40;
      const scale = Math.min(maxStampWidth / rawWidth, maxStampHeight / rawHeight);
      const drawWidth = rawWidth * scale;
      const drawHeight = rawHeight * scale;

      ensureSpace(drawHeight + 5);
      pdf.addImage(stampDataUrl, 'PNG', 190 - drawWidth, y, drawWidth, drawHeight);
    }

    const fileName = `Contrat_${selectedClient?.nom || 'Client'}_${selectedProperty?.titre || 'Bien'}`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    pdf.save(`${fileName || 'Contrat_location'}.pdf`);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <div>
          <p className="eyebrow">Documents locatifs</p>
          <h1>Contrat de location</h1>
          <p>Génération automatique des clauses d'entrée (Avance + Caution + Commission)</p>
        </div>
        <div className="header-chip">Version pro</div>
      </div>

      <div className="entry-rule-banner">
        <FiFileText />
        <span>
          Règle appliquée automatiquement: <strong>{ENTRY_MONTHS} mois d'entrée</strong> = 1 mois Avance + 1 mois Caution + 1 mois Commission.
        </span>
      </div>

      <div className="contract-layout">
        <div className="contract-form-card">
          <h2>Informations du contrat</h2>

          <div className="form-group">
            <label>Bien immobilier *</label>
            <select
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
            >
              <option value="">Sélectionner un bien</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.titre} - {formatCurrency(Number(property.prix || 0))}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Client *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date de signature *</label>
              <input
                type="date"
                value={formData.dateSignature}
                onChange={(e) => setFormData({ ...formData, dateSignature: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date de début *</label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Durée (mois)</label>
              <input
                type="number"
                min="1"
                value={formData.dureeMois}
                onChange={(e) => setFormData({ ...formData, dureeMois: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Loyer mensuel (auto)</label>
              <input type="text" value={monthlyRent ? formatCurrency(monthlyRent) : 'N/A'} readOnly />
            </div>
          </div>

          <div className="entry-breakdown-box">
            <h3>Montants d'entrée</h3>
            <div className="entry-breakdown-grid">
              <div><span>Avance</span><strong>{formatCurrency(entryAdvance)}</strong></div>
              <div><span>Caution</span><strong>{formatCurrency(entryCaution)}</strong></div>
              <div><span>Commission</span><strong>{formatCurrency(entryCommission)}</strong></div>
              <div className="entry-total"><span>Total d'entrée</span><strong>{formatCurrency(entryTotal)}</strong></div>
            </div>
          </div>

          <div className="form-group">
            <label>Notes complémentaires</label>
            <textarea
              rows="4"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires à inclure dans le contrat"
            />
          </div>

          <div className="actions-row">
            <button type="button" className="secondary-btn" onClick={generateContractText}>
              <FiRefreshCw /> Générer les clauses
            </button>
            <button type="button" className="primary-btn" onClick={handleSaveContract} disabled={saving}>
              <FiSave /> {saving ? 'Enregistrement...' : 'Enregistrer contrat'}
            </button>
            <button type="button" className="download-btn" onClick={handleDownloadPdf}>
              <FiDownload /> Télécharger PDF
            </button>
          </div>
        </div>

        <div className="contract-preview-card">
          <div className="preview-head">
            <h2>Aperçu du contrat</h2>
            <div className="preview-meta">
              <span><FiUser /> {selectedClient?.nom || 'Locataire'}</span>
              <span><FiHome /> {selectedProperty?.titre || 'Bien'}</span>
              <span><FiCalendar /> {toLongDate(formData.dateSignature)}</span>
            </div>
          </div>

          {!hasContractPreview ? (
            <div className="preview-empty-state">
              <FiFileText />
              <p>Le contrat apparaîtra ici après génération.</p>
              <small>Astuce: sélectionne un client + un bien, puis clique sur "Générer les clauses".</small>
            </div>
          ) : (
            <div className="contract-preview">
              <div className="sheet-header">
                <img src="/KA.png" alt="Keur Ayib" className="sheet-logo" />
                <div className="sheet-title-block">
                  <h3>Contrat de location</h3>
                  <p>Ref. KAI-LOC-{new Date().getFullYear()}-{(selectedClient?.id || '0000').slice(0, 4).toUpperCase()}</p>
                  <p>Date: {toLongDate(formData.dateSignature)}</p>
                </div>
              </div>

              <div className="sheet-grid">
                <div className="sheet-card">
                  <h4>Bailleur</h4>
                  <p>Keur Ayib Immobilier</p>
                  <p>Keur Ayib, Senegal</p>
                  <p>{CONTACT_PHONE}</p>
                </div>
                <div className="sheet-card">
                  <h4>Locataire</h4>
                  <p>{selectedClient?.nom || '................'}</p>
                  <p>{selectedClient?.telephone || '................'}</p>
                  <p>{selectedClient?.email || '................'}</p>
                </div>
              </div>

              <div className="sheet-section">
                <h4>Objet du contrat</h4>
                <p>
                  Location du bien <strong>{selectedProperty?.titre || '................'}</strong> situe a{' '}
                  <strong>{selectedProperty?.localisation || '................'}</strong>.
                </p>
              </div>

              <div className="sheet-grid details-grid">
                <div className="sheet-card">
                  <h4>Duree</h4>
                  <p>{formData.dureeMois} mois a partir du {toLongDate(formData.dateDebut)}</p>
                </div>
                <div className="sheet-card">
                  <h4>Loyer mensuel</h4>
                  <p>{formatCurrency(monthlyRent)}</p>
                </div>
              </div>

              <div className="sheet-section highlight">
                <h4>Paiement d'entree ({ENTRY_MONTHS} mois)</h4>
                <div className="sheet-entry-grid">
                  <div><span>Avance</span><strong>{formatCurrency(entryAdvance)}</strong></div>
                  <div><span>Caution</span><strong>{formatCurrency(entryCaution)}</strong></div>
                  <div><span>Commission</span><strong>{formatCurrency(entryCommission)}</strong></div>
                  <div className="total"><span>Total</span><strong>{formatCurrency(entryTotal)}</strong></div>
                </div>
              </div>

              <div className="sheet-section">
                <h4>Notes complementaires</h4>
                <p>{formData.notes || 'Aucune note complementaire.'}</p>
              </div>

              <div className="sheet-signatures">
                <div>
                  <span>Signature du bailleur</span>
                  <div className="line" />
                </div>
                <div>
                  <span>Signature du locataire</span>
                  <div className="line" />
                </div>
              </div>

              <div className="sheet-stamp-wrap">
                <img
                  src={stampImage}
                  alt="Cachet Keur Ayib"
                  className="sheet-stamp"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contracts;
