import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BorrowRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, denied, returned
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/borrow/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;
    
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `http://localhost:5000/api/borrow/approve/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Request approved successfully!');
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (requestId) => {
    if (!window.confirm('Are you sure you want to deny this request?')) return;
    
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `http://localhost:5000/api/borrow/deny/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Request denied');
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to deny request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (requestId) => {
    if (!window.confirm('Mark this book as returned?')) return;
    
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `http://localhost:5000/api/borrow/return/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(response.data.message);
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process return');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', text: 'Pending' },
      approved: { bg: '#d1fae5', color: '#065f46', text: 'Approved' },
      denied: { bg: '#fee2e2', color: '#991b1b', text: 'Denied' },
      returned: { bg: '#dbeafe', color: '#1e40af', text: 'Returned' }
    };
    
    const style = styles[status] || styles.pending;
    
    return (
      <span style={{
        padding: '4px 12px',
        backgroundColor: style.bg,
        color: style.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    );
  };

  return (
    <div className="admin-dashboard-content">
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '24px', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
            Borrow Requests
          </h2>
          
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
            {['all', 'pending', 'approved', 'denied', 'returned'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: filter === status ? '#3b82f6' : '#f3f4f6',
                  color: filter === status ? 'white' : '#6b7280',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}
              >
                {status} ({requests.filter(r => status === 'all' ? true : r.status === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#6b7280' }}>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>No {filter !== 'all' ? filter : ''} requests found</p>
          </div>
        ) : (
          /* Requests Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Student</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Student ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Book</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Request Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr 
                    key={request._id}
                    style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                    }}
                  >
                    <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                      {request.student?.firstName} {request.student?.lastName}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                      {request.student?.studentId}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#1f2937' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '500' }}>{request.book?.title}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>by {request.book?.author}</p>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(request.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request._id)}
                              disabled={actionLoading === request._id}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                border: '1px solid #10b981',
                                borderRadius: '6px',
                                cursor: actionLoading === request._id ? 'not-allowed' : 'pointer',
                                opacity: actionLoading === request._id ? 0.6 : 1
                              }}
                            >
                              {actionLoading === request._id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleDeny(request._id)}
                              disabled={actionLoading === request._id}
                              style={{
                                padding: '6px 12px',
                                fontSize: '13px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #dc2626',
                                borderRadius: '6px',
                                cursor: actionLoading === request._id ? 'not-allowed' : 'pointer',
                                opacity: actionLoading === request._id ? 0.6 : 1
                              }}
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <button
                            onClick={() => handleReturn(request._id)}
                            disabled={actionLoading === request._id}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              border: '1px solid #3b82f6',
                              borderRadius: '6px',
                              cursor: actionLoading === request._id ? 'not-allowed' : 'pointer',
                              opacity: actionLoading === request._id ? 0.6 : 1
                            }}
                          >
                            {actionLoading === request._id ? 'Processing...' : 'Mark Returned'}
                          </button>
                        )}
                        {request.status === 'returned' && request.lateFee > 0 && (
                          <span style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fbbf24',
                            borderRadius: '6px'
                          }}>
                            Late Fee: ₱{request.lateFee}
                          </span>
                        )}
                        {(request.status === 'denied' || (request.status === 'returned' && !request.lateFee)) && (
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BorrowRequestsSection;