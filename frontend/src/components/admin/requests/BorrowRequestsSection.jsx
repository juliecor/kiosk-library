import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

function BorrowRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [bookCondition, setBookCondition] = useState("good"); // ✅ Changed from "Good"
  
  // Toast notification state
  const [toasts, setToasts] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Toast notification function
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  // Confirmation dialog function
  const showConfirm = (message, onConfirm) => {
    setConfirmAction({ message, onConfirm });
    setShowConfirmDialog(true);
  };

  const handleConfirmDialogYes = () => {
    if (confirmAction?.onConfirm) {
      confirmAction.onConfirm();
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/borrow/requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    showConfirm("Are you sure you want to approve this request?", async () => {
      setActionLoading(requestId);
      try {
        const token = localStorage.getItem("adminToken");
        const response = await axios.put(
          `http://localhost:5000/api/borrow/approve/${requestId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          showToast("Request approved successfully!", "success");
          fetchRequests();
        }
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to approve request", "error");
      } finally {
        setActionLoading(null);
      }
    });
  };

  const handleDeny = async (requestId) => {
    showConfirm("Are you sure you want to deny this request?", async () => {
      setActionLoading(requestId);
      try {
        const token = localStorage.getItem("adminToken");
        const response = await axios.put(
          `http://localhost:5000/api/borrow/deny/${requestId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          showToast("Request denied", "info");
          fetchRequests();
        }
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to deny request", "error");
      } finally {
        setActionLoading(null);
      }
    });
  };

  const handleReturnClick = (request) => {
    setSelectedRequest(request);
    setBookCondition("good"); // ✅ Changed from "Good"
    setShowConditionModal(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedRequest) return;
    setActionLoading(selectedRequest._id);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5000/api/borrow/return/${selectedRequest._id}`,
        { bookCondition },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast(`Book marked as returned (${bookCondition})!`, "success");
        fetchRequests();
        setShowConditionModal(false);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to process return", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayLateFee = async (requestId) => {
    showConfirm("Confirm that the student has paid the late fee?", async () => {
      setActionLoading(requestId);
      try {
        const token = localStorage.getItem("adminToken");
        const response = await axios.put(
          `http://localhost:5000/api/borrow/pay-fee/${requestId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          showToast("Late fee marked as paid!", "success");
          fetchRequests();
        }
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to mark fee as paid", "error");
      } finally {
        setActionLoading(null);
      }
    });
  };

  const calculateOverdue = (dueDate, returnedAt, status) => {
    if (!dueDate) return { overdueDays: 0, penalty: 0 };
    const now = new Date();
    const compareDate = returnedAt ? new Date(returnedAt) : now;
    const due = new Date(dueDate);

    if (compareDate <= due) return { overdueDays: 0, penalty: 0 };

    const diffTime = Math.ceil((compareDate - due) / (1000 * 60 * 60 * 24));
    const penalty = diffTime * 5;
    return { overdueDays: diffTime, penalty };
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "#fef3c7", color: "#92400e", text: "Pending" },
      approved: { bg: "#d1fae5", color: "#065f46", text: "Approved" },
      denied: { bg: "#fee2e2", color: "#991b1b", text: "Denied" },
      returned: { bg: "#dbeafe", color: "#1e40af", text: "Returned" },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        style={{
          padding: "4px 12px",
          backgroundColor: style.bg,
          color: style.color,
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        {style.text}
      </span>
    );
  };

  return (
    <div className="admin-dashboard-content">
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{ fontSize: "24px", fontWeight: "600", color: "#1f2937" }}
          >
            Borrow Requests
          </h2>

          <div
            style={{
              display: "flex",
              gap: "8px",
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            {["all", "pending", "approved", "denied", "returned"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    background:
                      filter === status ? "#3b82f6" : "#f3f4f6",
                    color: filter === status ? "white" : "#6b7280",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    textTransform: "capitalize",
                  }}
                >
                  {status} (
                  {
                    requests.filter((r) =>
                      status === "all" ? true : r.status === status
                    ).length
                  }
                  )
                </button>
              )
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "#6b7280" }}>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ fontSize: "18px", color: "#6b7280" }}>
              No {filter !== "all" ? filter : ""} requests found
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f9fafb",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  <th style={thStyle}>Student</th>
                  <th style={thStyle}>Student ID</th>
                  <th style={thStyle}>Book</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Request Date</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Overdue</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => {
                  const { overdueDays, penalty } = calculateOverdue(
                    request.dueDate,
                    request.returnedAt,
                    request.status
                  );

                  return (
                    <tr
                      key={request._id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor:
                          index % 2 === 0 ? "white" : "#f9fafb",
                      }}
                    >
                      <td style={tdStyle}>
                        {request.student?.firstName}{" "}
                        {request.student?.lastName}
                      </td>
                      <td style={tdStyle}>
                        {request.student?.studentId}
                      </td>
                      <td style={tdStyle}>
                        <p style={{ margin: 0, fontWeight: "500" }}>
                          {request.book?.title}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          by {request.book?.author}
                        </p>
                      </td>
                      <td style={tdStyle}>
                        {getStatusBadge(request.status)}
                      </td>
                      <td style={tdStyle}>
                        {new Date(
                          request.createdAt
                        ).toLocaleDateString()}
                      </td>
                      <td style={tdStyle}>
                        {request.dueDate
                          ? new Date(request.dueDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td style={tdStyle}>
                        {overdueDays > 0
                          ? `₱${penalty} (${overdueDays} day${
                              overdueDays > 1 ? "s" : ""
                            })`
                          : "None"}
                      </td>
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApprove(request._id)
                                }
                                disabled={actionLoading === request._id}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeny(request._id)}
                                disabled={actionLoading === request._id}
                              >
                                Deny
                              </button>
                            </>
                          )}
                          {request.status === "approved" && (
                            <button
                              onClick={() => handleReturnClick(request)}
                              disabled={actionLoading === request._id}
                            >
                              Mark Returned
                            </button>
                          )}
                          {request.status === "returned" &&
                            request.lateFee > 0 &&
                            !request.paid && (
                              <button
                                onClick={() =>
                                  handlePayLateFee(request._id)
                                }
                                disabled={actionLoading === request._id}
                                style={{
                                  backgroundColor: "#10b981",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                }}
                              >
                                Mark as Paid
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enhanced Modal with Student Name */}
      {showConditionModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", margin: 0, fontWeight: "600" }}>
                Return Book
              </h3>
              <button
                onClick={() => setShowConditionModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            {/* Student Info */}
            <div style={{
              backgroundColor: "#f9fafb",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #e5e7eb"
            }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                Student
              </p>
              <p style={{ margin: 0, fontSize: "16px", color: "#1f2937", fontWeight: "600" }}>
                {selectedRequest?.student?.firstName} {selectedRequest?.student?.lastName}
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
                ID: {selectedRequest?.student?.studentId}
              </p>
            </div>

            {/* Book Info */}
            <div style={{
              backgroundColor: "#f9fafb",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #e5e7eb"
            }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                Book
              </p>
              <p style={{ margin: 0, fontSize: "16px", color: "#1f2937", fontWeight: "600" }}>
                {selectedRequest?.book?.title}
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
                by {selectedRequest?.book?.author}
              </p>
            </div>

            {/* Condition Selector */}
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
              Book Condition
            </label>
            <select
              value={bookCondition}
              onChange={(e) => setBookCondition(e.target.value)}
              style={{
                width: "100%",
                height: "50px",
                padding: "10px",
                color:"#232324ff",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                marginBottom: "24px",
                cursor: "pointer",
                backgroundColor: "white",
              }}
            >
              <option value="good">Good Condition</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowConditionModal(false)}
                style={{
                  padding: "10px 20px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={actionLoading === selectedRequest?._id}
                style={{
                  padding: "10px 20px",
                  background: actionLoading === selectedRequest?._id ? "#9ca3af" : "#ee8b35ff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: actionLoading === selectedRequest?._id ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {actionLoading === selectedRequest?._id ? "Processing..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={modalOverlayStyle}>
          <div style={{...modalStyle, width: "400px"}}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <AlertCircle size={48} color="#f59e0b" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "18px", margin: "0 0 8px 0", fontWeight: "600" }}>
                Confirm Action
              </h3>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                {confirmAction?.message}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: "10px 24px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDialogYes}
                style={{
                  padding: "10px 24px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </div>
  );
}

// Toast Component
function Toast({ message, type, onClose }) {
  const styles = {
    success: { bg: "#10b981", icon: <CheckCircle size={20} /> },
    error: { bg: "#ef4444", icon: <XCircle size={20} /> },
    info: { bg: "#3b82f6", icon: <AlertCircle size={20} /> },
  };

  const style = styles[type] || styles.success;

  return (
    <div
      style={{
        backgroundColor: style.bg,
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "300px",
        maxWidth: "400px",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      {style.icon}
      <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={16} />
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Styling
const thStyle = {
  padding: "12px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151",
};

const tdStyle = {
  padding: "12px",
  fontSize: "14px",
  color: "#1f2937",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  animation: "fadeIn 0.2s ease-out",
};

const modalStyle = {
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "12px",
  width: "480px",
  maxWidth: "90%",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  animation: "scaleIn 0.2s ease-out",
};

export default BorrowRequestsSection;