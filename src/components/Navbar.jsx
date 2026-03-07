import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { FiMenu, FiUser, FiLogOut } from 'react-icons/fi';
import { auth } from '../services/firebase';
import './navbar.css';

const Navbar = ({ user, onMenuToggle }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={onMenuToggle}>
          <FiMenu />
        </button>
        <h2 className="page-title">Système de Gestion Immobilière</h2>
      </div>

      <div className="navbar-right">
        <div className="user-info">
          <span className="user-icon"><FiUser /></span>
          <div className="user-details">
            <span className="user-name">{user?.email || 'Utilisateur'}</span>
            <span className="user-role">{user?.role || 'Agent'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span><FiLogOut /></span>
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Navbar;
