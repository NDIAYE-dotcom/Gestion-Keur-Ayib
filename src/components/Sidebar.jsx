import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiHome, FiUsers, FiDollarSign, FiCalendar, FiMenu, FiX } from 'react-icons/fi';
import './sidebar.css';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: <FiBarChart2 />, label: 'Dashboard' },
    { path: '/properties', icon: <FiHome />, label: 'Biens Immobiliers' },
    { path: '/clients', icon: <FiUsers />, label: 'Clients' },
    { path: '/payments', icon: <FiDollarSign />, label: 'Paiements' },
    { path: '/agenda', icon: <FiCalendar />, label: 'Agenda' },
  ];

  const handleItemClick = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(false);
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'active' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <picture>
            <source srcSet="/logo-keur-ayib.png" type="image/png" />
            <img
              src="/KA.png"
              alt="Keur Ayib Immobilier"
              className={`logo-icon ${collapsed ? 'small' : ''}`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </picture>
        </div>
        <button 
          className="toggle-btn" 
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <FiMenu /> : <FiX />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={handleItemClick}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
