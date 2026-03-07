import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FiPlus, FiSearch, FiImage, FiEdit2, FiTrash2, FiX, FiMapPin } from 'react-icons/fi';
import { MdOutlineApartment, MdOutlineSquareFoot } from 'react-icons/md';
import { LuBedDouble, LuBath } from 'react-icons/lu';
import { db, storage, auth } from '../services/firebase';
import './properties.css';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    titre: '',
    type: 'appartement',
    statut: 'à louer',
    prix: '',
    localisation: '',
    description: '',
    superficie: '',
    chambres: '',
    sallesDeBain: '',
  });

  const [images, setImages] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      // ✅ RAPIDE : Sans orderBy pour eviter les index
      const querySnapshot = await getDocs(
        query(collection(db, 'properties'), limit(50))
      );
      const propertiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propertiesData);
    } catch (error) {
      console.error('Erreur lors du chargement des biens:', error);
      alert('Erreur lors du chargement des biens');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadStatus('Préparation...');

    try {
      const uploadImageWithTimeout = (file, timeoutMs = 30000) => {
        return new Promise((resolve, reject) => {
          const imageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
          const uploadTask = uploadBytesResumable(imageRef, file, {
            contentType: file.type || 'image/jpeg',
          });

          const timeoutId = setTimeout(() => {
            uploadTask.cancel();
            reject(new Error('upload-timeout'));
          }, timeoutMs);

          uploadTask.on(
            'state_changed',
            () => {},
            (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
            async () => {
              clearTimeout(timeoutId);
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      };

      // Upload des images
      const photoURLs = [...(currentProperty?.photos || [])];

      if (photoUrl.trim()) {
        const normalizedUrl = photoUrl.trim();
        if (!photoURLs.includes(normalizedUrl)) {
          photoURLs.unshift(normalizedUrl);
        }
      }

      if (images.length > 0) {
        try {
          for (let index = 0; index < images.length; index += 1) {
            const image = images[index];
            setUploadStatus(`Upload image ${index + 1}/${images.length}...`);
            const url = await uploadImageWithTimeout(image);
            photoURLs.push(url);
          }
        } catch (uploadError) {
          if ((uploadError.code && uploadError.code.startsWith('storage/')) || uploadError.message === 'upload-timeout') {
            if (photoUrl.trim()) {
              alert('Storage indisponible sur votre plan actuel. Le bien sera créé avec l\'URL image fournie.');
            } else {
              throw uploadError;
            }
          } else {
            throw uploadError;
          }
        }
      }

      const propertyData = {
        ...formData,
        prix: Number(formData.prix),
        superficie: Number(formData.superficie),
        chambres: Number(formData.chambres) || 0,
        sallesDeBain: Number(formData.sallesDeBain) || 0,
        photos: photoURLs,
        createdBy: auth.currentUser?.uid,
        updatedAt: new Date(),
      };

      if (currentProperty) {
        // Mise à jour
        setUploadStatus('Mise à jour du bien...');
        await updateDoc(doc(db, 'properties', currentProperty.id), propertyData);
        alert('Bien mis à jour avec succès');
      } else {
        // Création
        setUploadStatus('Création du bien...');
        propertyData.createdAt = new Date();
        await addDoc(collection(db, 'properties'), propertyData);
        alert('Bien ajouté avec succès');
      }

      fetchProperties();
      closeModal();
    } catch (error) {
      console.error('Erreur:', error);
      if (error.code === 'storage/unauthorized') {
        alert('Upload refusé par Firebase Storage. Vérifiez les règles Storage (lecture/écriture pour utilisateur connecté).');
      } else if (error.code === 'storage/canceled' || error.message === 'upload-timeout') {
        alert('Upload annulé (connexion lente ou timeout). Réessayez avec une image plus légère (< 5MB).');
      } else if (error.code === 'storage/unknown') {
        alert('Erreur Storage inconnue. Vérifiez que Firebase Storage est activé dans la console Firebase.');
      } else {
        alert(`Erreur lors de l'enregistrement du bien: ${error.message || 'Erreur inconnue'}`);
      }
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bien ?')) {
      try {
        await deleteDoc(doc(db, 'properties', id));
        alert('Bien supprimé avec succès');
        fetchProperties();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du bien');
      }
    }
  };

  const openModal = (property = null) => {
    if (property) {
      setCurrentProperty(property);
      setFormData({
        titre: property.titre,
        type: property.type,
        statut: property.statut,
        prix: property.prix,
        localisation: property.localisation,
        description: property.description,
        superficie: property.superficie,
        chambres: property.chambres || '',
        sallesDeBain: property.sallesDeBain || '',
      });
      setPhotoUrl(property.photos?.[0] || '');
    } else {
      setCurrentProperty(null);
      setFormData({
        titre: '',
        type: 'appartement',
        statut: 'à louer',
        prix: '',
        localisation: '',
        description: '',
        superficie: '',
        chambres: '',
        sallesDeBain: '',
      });
      setPhotoUrl('');
    }
    setImages([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentProperty(null);
    setFormData({
      titre: '',
      type: 'appartement',
      statut: 'à louer',
      prix: '',
      localisation: '',
      description: '',
      superficie: '',
      chambres: '',
      sallesDeBain: '',
    });
    setPhotoUrl('');
    setImages([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isImage && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Certaines images ont été ignorées. Formats image uniquement, taille max 5MB par image.');
    }

    setImages(validFiles);
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.localisation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesStatus = filterStatus === 'all' || property.statut === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="properties-page">
      <div className="properties-header">
        <h1>Gestion des Biens Immobiliers</h1>
        <button className="add-btn" onClick={() => openModal()}>
          <FiPlus /> Ajouter un Bien
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="filters-section">
        <div className="search-field">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par titre ou localisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
          <option value="all">Tous les types</option>
          <option value="terrain">Terrain</option>
          <option value="maison">Maison</option>
          <option value="appartement">Appartement</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="à louer">À louer</option>
          <option value="à vendre">À vendre</option>
        </select>
      </div>

      {/* Liste des biens */}
      <div className="properties-grid">
        {filteredProperties.length > 0 ? (
          filteredProperties.map(property => (
            <div key={property.id} className="property-card">
              <div className="property-image">
                {property.photos && property.photos.length > 0 ? (
                  <img src={property.photos[0]} alt={property.titre} loading="lazy" />
                ) : (
                  <div className="no-image"><FiImage /><span>Pas d'image</span></div>
                )}
                <span className={`status-badge ${property.statut === 'à louer' ? 'rent' : 'sale'}`}>
                  {property.statut}
                </span>
              </div>

              <div className="property-content">
                <h3>{property.titre}</h3>
                <p className="property-type"><MdOutlineApartment /> {property.type}</p>
                <p className="property-location"><FiMapPin /> {property.localisation}</p>
                <p className="property-price">{formatCurrency(property.prix)}</p>
                
                <div className="property-details">
                  <span><MdOutlineSquareFoot /> {property.superficie} m²</span>
                  {property.chambres > 0 && <span><LuBedDouble /> {property.chambres} ch</span>}
                  {property.sallesDeBain > 0 && <span><LuBath /> {property.sallesDeBain} sdb</span>}
                </div>

                <div className="property-actions">
                  <button className="edit-btn" onClick={() => openModal(property)}>
                    <FiEdit2 /> Modifier
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(property.id)}>
                    <FiTrash2 /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">Aucun bien trouvé</p>
        )}
      </div>

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentProperty ? 'Modifier le Bien' : 'Ajouter un Bien'}</h2>
              <button className="close-btn" onClick={closeModal}><FiX /></button>
            </div>

            <form onSubmit={handleSubmit} className="property-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData({...formData, titre: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="terrain">Terrain</option>
                    <option value="maison">Maison</option>
                    <option value="appartement">Appartement</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Statut *</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    required
                  >
                    <option value="à louer">À louer</option>
                    <option value="à vendre">À vendre</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prix (XOF) *</label>
                  <input
                    type="number"
                    value={formData.prix}
                    onChange={(e) => setFormData({...formData, prix: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Localisation *</label>
                <input
                  type="text"
                  value={formData.localisation}
                  onChange={(e) => setFormData({...formData, localisation: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Superficie (m²) *</label>
                  <input
                    type="number"
                    value={formData.superficie}
                    onChange={(e) => setFormData({...formData, superficie: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Chambres</label>
                  <input
                    type="number"
                    value={formData.chambres}
                    onChange={(e) => setFormData({...formData, chambres: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Salles de bain</label>
                  <input
                    type="number"
                    value={formData.sallesDeBain}
                    onChange={(e) => setFormData({...formData, sallesDeBain: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>URL image (optionnel, recommandé si Storage non activé)</label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small>Sélectionnez une ou plusieurs images (nécessite Firebase Storage activé).</small>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn" disabled={uploading}>
                  {uploading ? (uploadStatus || 'Enregistrement...') : currentProperty ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
