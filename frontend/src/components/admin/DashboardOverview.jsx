import React from 'react';

function DashboardOverview({ statsCards, recentActivity, setActiveSection }) {
  return (
    <div className="admin-dashboard-content">
      {/* Stats Cards */}
      <div className="admin-stats-grid">
        {statsCards.map((card, index) => (
          <div key={index} className={`admin-stat-card ${card.colorClass}`}>
            <div className="admin-stat-content">
              <div className="admin-stat-info">
                <p className="admin-stat-title">{card.title}</p>
                <p className="admin-stat-value">{card.value}</p>
                <p className="admin-stat-change">
                  <span className="admin-stat-trend">📈</span>
                  {card.change}
                </p>
              </div>
              <div className="admin-stat-icon">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="admin-sections-grid">
        {/* Quick Actions */}
        <div className="admin-quick-actions-section">
          <h3 className="admin-section-title">Quick Actions</h3>
          <div className="admin-quick-actions-grid">
            <button 
              className="admin-quick-action-btn admin-action-blue"
              onClick={() => setActiveSection('books')}
            >
              <span className="admin-action-icon">📚</span>
              <span className="admin-action-text">Add New Book</span>
            </button>
            <button 
              className="admin-quick-action-btn admin-action-orange"
              onClick={() => setActiveSection('students')}
            >
              <span className="admin-action-icon">👥</span>
              <span className="admin-action-text">Register Student</span>
            </button>
            <button className="admin-quick-action-btn admin-action-yellow"
             onClick={() => setActiveSection('requests')}>
              <span className="admin-action-icon" >📖</span>
              <span className="admin-action-text">Process Request</span>
            </button>
            <button className="admin-quick-action-btn admin-action-blue-dark"
             onClick={() => setActiveSection('reports')}>
              <span className="admin-action-icon">📊</span>
              <span className="admin-action-text">View Reports</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-recent-activity-section">
          <div className="admin-activity-header">
            <h3 className="admin-section-title">Recent Activity</h3>
           
          </div>
          <div className="admin-activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="admin-activity-item">
                <div className={`admin-activity-dot ${index % 2 === 0 ? 'admin-dot-green' : 'admin-dot-blue'}`}></div>
                <div className="admin-activity-content">
                  <p className="admin-activity-action">{activity.action}</p>
                  <p className="admin-activity-item-name">{activity.item}</p>
                </div>
                <p className="admin-activity-time">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;