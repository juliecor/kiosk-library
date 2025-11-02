import React from 'react';

function Sidebar({ activeSection, setActiveSection, navItems }) {
  return (
    <aside className="admin-sidebar-container">
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-logo">
          
          <div className="admin-logo-text">
            <h2 className="admin-logo-title">BENEDICTO COLLEGE</h2>
            <p className="admin-logo-subtitle">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="admin-sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`admin-nav-button ${activeSection === item.id ? 'admin-nav-button-active' : ''}`}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;