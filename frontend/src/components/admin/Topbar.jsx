import React from 'react';

function Topbar({ activeSection, navItems, adminData, handleLogout }) {
  return (
    <header className="admin-topbar-container">
      <div className="admin-topbar-content">
        <h1 className="admin-page-title">
          {activeSection === 'dashboard' ? 'Dashboard Overview' : 
           navItems.find(item => item.id === activeSection)?.label}
        </h1>
        
        <div className="admin-user-section">
          <div className="admin-user-info">
            <p className="admin-user-welcome">Welcome back,</p>
            <p className="admin-user-name">{adminData?.fullName}</p>
          </div>
          <div className="admin-user-avatar">
            {adminData?.fullName?.charAt(0) || 'A'}
          </div>
          <button
            onClick={handleLogout}
            className="admin-logout-button"
            title="Logout"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;