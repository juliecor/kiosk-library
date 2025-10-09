import React, { useState, useEffect } from "react";
import axios from "axios";

function BorrowRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [bookCondition, setBookCondition] = useState("Good");

  useEffect(() => {
    fetchRequests();
  }, []);

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
    if (!window.confirm("Are you sure you want to approve this request?"))
      return;
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5000/api/borrow/approve/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert("Request approved successfully!");
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (requestId) => {
    if (!window.confirm("Are you sure you want to deny this request?")) return;
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5000/api/borrow/deny/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert("Request denied");
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to deny request");
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Open the modal before returning book
  const handleReturnClick = (request) => {
    setSelectedRequest(request);
    setBookCondition("Good");
    setShowConditionModal(true);
  };

  // ✅ Confirm the book return with selected condition
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
        alert(`Book marked as returned (${bookCondition})!`);
        fetchRequests();
        setShowConditionModal(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to process return");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayLateFee = async (requestId) => {
    if (!window.confirm("Confirm that the student has paid the late fee?"))
      return;
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.put(
        `http://localhost:5000/api/borrow/pay-fee/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert("Late fee marked as paid!");
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to mark fee as paid");
    } finally {
      setActionLoading(null);
    }
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

      {/* ✅ Modal for selecting book condition */}
      {showConditionModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ fontSize: "20px", marginBottom: "15px" }}>
              Select Book Condition
            </h3>
            <select
              value={bookCondition}
              onChange={(e) => setBookCondition(e.target.value)}
              style={{
                width: "100%",
                height:"50px",
                padding: "10px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                marginBottom: "20px",
              }}
            >
              <option value="Good">Good Condition</option>
              <option value="Damaged">Damaged</option>
              <option value="Lost">Lost</option>
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowConditionModal(false)}
                style={{
                  padding: "8px 14px",
                  background: "#3872e7ff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                style={{
                  padding: "8px 14px",
                  background: "#ee8b35ff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 Styling
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
};

const modalStyle = {
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "12px",
  width: "400px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};

export default BorrowRequestsSection;
