import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ReportsSection.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ReportsSection() {
  const [summary, setSummary] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [borrowingTrends, setBorrowingTrends] = useState([]);
  const [lateFees, setLateFees] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [bookConditionReport, setBookConditionReport] = useState(null);
  const [damagedBooks, setDamagedBooks] = useState([]);
  const [lostBooks, setLostBooks] = useState([]);
  const [studentsWithFees, setStudentsWithFees] = useState([]);
  const [damageAnalysis, setDamageAnalysis] = useState(null);
  const [paymentTransactions, setPaymentTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Filter states
  const [selectedRange, setSelectedRange] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const token = localStorage.getItem("adminToken");

  // ✅ IMPROVED: Unified query builder
  const buildFilterQuery = () => {
    if (selectedRange === "weekly") return "filter=weekly";
    if (selectedRange === "monthly") return "filter=monthly";
    if (selectedRange === "custom" && customStart && customEnd) {
      return `filter=custom&startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`;
    }
    return ""; // all time - no filter
  };

  // ✅ IMPROVED: Cleaner endpoint builder
  const buildEndpoint = (path) => {
    const filterQuery = buildFilterQuery();
    if (!filterQuery) return path;
    
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}${filterQuery}`;
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Build all endpoints with filter query
      const endpoints = [
        buildEndpoint("/api/reports/summary"),
        buildEndpoint("/api/reports/most-borrowed?limit=10"),
        buildEndpoint("/api/reports/overdue"),
        buildEndpoint("/api/reports/top-borrowers?limit=10"),
        buildEndpoint("/api/reports/trends?months=6"),
        buildEndpoint("/api/reports/late-fees"),
        buildEndpoint("/api/reports/financial-summary"),
        buildEndpoint("/api/reports/book-condition"),
        buildEndpoint("/api/reports/damaged-books"),
        buildEndpoint("/api/reports/lost-books"),
        buildEndpoint("/api/reports/students-with-fees"),
        buildEndpoint("/api/reports/damage-analysis"),
        buildEndpoint("/api/reports/payment-transactions"),
      ];

      const responses = await Promise.allSettled(
        endpoints.map((ep) => axios.get(ep, { headers }))
      );

      // ✅ IMPROVED: Better error handling with Promise.allSettled
      const [
        summaryRes,
        mostBorrowedRes,
        overdueRes,
        topBorrowersRes,
        trendsRes,
        lateFeesRes,
        financialRes,
        conditionRes,
        damagedRes,
        lostRes,
        feesRes,
        damageAnalysisRes,
        paymentTransactionsRes,
      ] = responses.map(result => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        console.warn("API request failed:", result.reason);
        return { data: { success: false } };
      });

      // Update states with fallbacks
      setSummary(summaryRes.data?.success ? summaryRes.data.data : null);
      setMostBorrowed(mostBorrowedRes.data?.success ? mostBorrowedRes.data.data : []);
      setOverdueBooks(overdueRes.data?.success ? overdueRes.data.data : []);
      setTopBorrowers(topBorrowersRes.data?.success ? topBorrowersRes.data.data : []);
      setBorrowingTrends(trendsRes.data?.success ? trendsRes.data.data : []);
      setLateFees(lateFeesRes.data?.success ? lateFeesRes.data.data : null);
      setFinancialSummary(financialRes.data?.success ? financialRes.data.data : null);
      setBookConditionReport(conditionRes.data?.success ? conditionRes.data.data : null);
      setDamagedBooks(damagedRes.data?.success ? damagedRes.data.data : []);
      setLostBooks(lostRes.data?.success ? lostRes.data.data : []);
      setStudentsWithFees(feesRes.data?.success ? feesRes.data.data : []);
      setDamageAnalysis(damageAnalysisRes.data?.success ? damageAnalysisRes.data.data : null);
      setPaymentTransactions(paymentTransactionsRes.data?.success ? paymentTransactionsRes.data.data : []);

    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch when switching between all/weekly/monthly
  useEffect(() => {
    if (selectedRange !== "custom") {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRange]);

  // Chart data
  const chartData = {
    labels: borrowingTrends.map((item) => `${item._id.month}/${item._id.year}`),
    datasets: [
      { label: "Total Borrows", data: borrowingTrends.map((i) => i.totalBorrows), backgroundColor: "#4e73df" },
      { label: "Approved", data: borrowingTrends.map((i) => i.approved), backgroundColor: "#1cc88a" },
      { label: "Returned", data: borrowingTrends.map((i) => i.returned), backgroundColor: "#36b9cc" },
      { label: "Denied", data: borrowingTrends.map((i) => i.denied), backgroundColor: "#e74a3b" },
    ],
  };

  // Financial breakdown pie chart
  const financialPieData = financialSummary
    ? {
        labels: ["Late Fees", "Damage Fees", "Lost Book Fees"],
        datasets: [
          {
            data: [
              financialSummary.totalLateFees || 0,
              financialSummary.totalDamageFees || 0,
              financialSummary.totalLostBookFees || 0
            ],
            backgroundColor: ["#f6c23e", "#e74a3b", "#858796"],
          },
        ],
      }
    : null;

  // Damage level breakdown
  const damageBreakdownData = damageAnalysis
    ? {
        labels: ["Minor", "Moderate", "Severe"],
        datasets: [
          {
            label: "Number of Books",
            data: [
              damageAnalysis.minorCount || 0,
              damageAnalysis.moderateCount || 0,
              damageAnalysis.severeCount || 0
            ],
            backgroundColor: ["#1cc88a", "#f6c23e", "#e74a3b"],
          },
        ],
      }
    : null;

  const handlePrint = () => {
    window.print();
  };

  const handleRangeClick = (range) => {
    setSelectedRange(range);
    setError(""); // Clear any previous errors
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) {
      setError("Please select both start and end dates for custom range.");
      return;
    }
    
    // Validate date order
    if (new Date(customStart) > new Date(customEnd)) {
      setError("Start date must be before end date.");
      return;
    }
    
    setError("");
    setSelectedRange("custom");
    fetchReports();
  };

  // ✅ IMPROVED: Better date range display
  const getDateRangeLabel = () => {
    if (selectedRange === "all") return "All Time";
    if (selectedRange === "weekly") return "Last 7 Days";
    if (selectedRange === "monthly") return "Last 30 Days";
    if (selectedRange === "custom" && customStart && customEnd) {
      return `${new Date(customStart).toLocaleDateString()} - ${new Date(customEnd).toLocaleDateString()}`;
    }
    return "Select Range";
  };

  if (loading) {
    return (
      <div className="reports-loading-container">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-section">
      <div className="reports-header">
        <div>
          <h2>Library Reports</h2>
          <p className="reports-date-range">📅 {getDateRangeLabel()}</p>
        </div>
        <button className="reports-print-button" onClick={handlePrint}>
          🖨️ Print Report
        </button>
      </div>

      <div className="reports-print-header">
        <h1>BENEDICTO COLLEGE LIBRARY</h1>
        <p><strong>Report Type:</strong> {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Report</p>
        <p><strong>Report Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Period:</strong> {getDateRangeLabel()}</p>
        <p><strong>Generated By:</strong> Default Librarian</p>
      </div>

      {/* ✅ IMPROVED: Better filter UI */}
      <div className="reports-range-filters">
        <div className="filter-buttons">
          <button
            className={selectedRange === "all" ? "active range-btn" : "range-btn"}
            onClick={() => handleRangeClick("all")}
          >
            📊 All Time
          </button>
          <button
            className={selectedRange === "weekly" ? "active range-btn" : "range-btn"}
            onClick={() => handleRangeClick("weekly")}
          >
            📅 Weekly
          </button>
          <button
            className={selectedRange === "monthly" ? "active range-btn" : "range-btn"}
            onClick={() => handleRangeClick("monthly")}
          >
            📆 Monthly
          </button>
          <button
            className={selectedRange === "custom" ? "active range-btn" : "range-btn"}
            onClick={() => handleRangeClick("custom")}
          >
            🔧 Custom
          </button>
        </div>

        {/* Custom date picker */}
        {selectedRange === "custom" && (
          <div className="custom-date-picker">
            <label>
              From:
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </label>
            <label>
              To:
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </label>
            <button 
              className="apply-custom-btn" 
              onClick={handleApplyCustom}
              disabled={!customStart || !customEnd}
            >
              ✓ Apply
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="reports-error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="reports-tabs">
        <button className={selectedTab === "overview" ? "active" : ""} onClick={() => setSelectedTab("overview")}>
          📊 Overview
        </button>
        <button className={selectedTab === "financial" ? "active" : ""} onClick={() => setSelectedTab("financial")}>
          💰 Financial
        </button>
        <button className={selectedTab === "condition" ? "active" : ""} onClick={() => setSelectedTab("condition")}>
          📖 Book Condition
        </button>
        <button className={selectedTab === "students" ? "active" : ""} onClick={() => setSelectedTab("students")}>
          👥 Students
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {selectedTab === "overview" && (
        <>
          {summary && (
            <div className="reports-summary-cards">
              <div className="card blue">
                <h4>Total Books</h4>
                <p>{summary.totalBooks}</p>
              </div>
              <div className="card orange">
                <h4>Total Students</h4>
                <p>{summary.totalStudents}</p>
              </div>
              <div className="card green">
                <h4>Active Borrows</h4>
                <p>{summary.activeBorrows}</p>
              </div>
              <div className="card purple">
                <h4>Returned</h4>
                <p>{summary.totalReturned}</p>
              </div>
            </div>
          )}

          <div className="reports-table-container">
            <h3>📚 Most Borrowed Books (Top 10)</h3>
            {mostBorrowed.length === 0 ? (
              <p className="no-data">No borrowing data available for this period</p>
            ) : (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Borrow Count</th>
                    <th>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {mostBorrowed.map((item, index) => (
                    <tr key={item.book._id}>
                      <td>{index + 1}</td>
                      <td>{item.book.title}</td>
                      <td>{item.book.author}</td>
                      <td>{item.borrowCount}</td>
                      <td style={{ fontSize: '12px', color: '#666' }}>
                        {getDateRangeLabel()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="reports-table-container">
            <h3>🏆 Top Borrowers (Top 10)</h3>
            {topBorrowers.length === 0 ? (
              <p className="no-data">No borrower data available for this period</p>
            ) : (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Borrow Count</th>
                    <th>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {topBorrowers.map((item, index) => (
                    <tr key={item.student._id}>
                      <td>{index + 1}</td>
                      <td>
                        {item.student.firstName} {item.student.middleName} {item.student.lastName}
                      </td>
                      <td>{item.student.studentId}</td>
                      <td>{item.student.course}</td>
                      <td>{item.borrowCount}</td>
                      <td style={{ fontSize: '12px', color: '#666' }}>
                        {getDateRangeLabel()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="reports-chart-container">
            <h3>📈 Borrowing Trends (Last 6 Months)</h3>
            {borrowingTrends.length === 0 ? (
              <p className="no-data">No trend data available for this period</p>
            ) : (
              <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
            )}
          </div>
        </>
      )}

      {/* FINANCIAL TAB */}
      {selectedTab === "financial" && (
        <>
          {financialSummary && (
            <>
              <div className="reports-summary-cards">
                <div className="card green">
                  <h4>💵 Total Collected</h4>
                  <p>₱{financialSummary.totalCollected || 0}</p>
                </div>
                <div className="card orange">
                  <h4>⏳ Unpaid Fees</h4>
                  <p>₱{financialSummary.totalUnpaid || 0}</p>
                </div>
                <div className="card blue">
                  <h4>📊 Late Fees</h4>
                  <p>₱{financialSummary.totalLateFees || 0}</p>
                </div>
                <div className="card red">
                  <h4>💔 Damage Fees</h4>
                  <p>₱{financialSummary.totalDamageFees || 0}</p>
                </div>
              </div>
            </>
          )}

          <div className="reports-table-container">
            <h3>💰 Payment Transactions History</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Date Paid</th>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Book Title</th>
                  <th>Borrow Date</th>
                  <th>Return Date</th>
                  <th>Late Fee</th>
                  <th>Damage Fee</th>
                  <th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {paymentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      No payment transactions for this period
                    </td>
                  </tr>
                ) : (
                  paymentTransactions.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: '#2563eb' }}>
                        {new Date(item.returnDate).toLocaleDateString()}
                      </td>
                      <td>{item.studentName}</td>
                      <td>{item.studentId}</td>
                      <td>{item.bookTitle}</td>
                      <td style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(item.borrowDate).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(item.returnDate).toLocaleDateString()}
                      </td>
                      <td>{item.lateFee > 0 ? `₱${item.lateFee}` : '-'}</td>
                      <td>{item.damageFee > 0 ? `₱${item.damageFee}` : '-'}</td>
                      <td className="fee">
                        <strong>₱{item.totalPaid}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {financialSummary && (
            <div className="reports-two-column">
                <div className="reports-chart-container">
                  <h3>🥧 Fee Breakdown by Type</h3>
                  {financialPieData && <Pie data={financialPieData} />}
                </div>

                <div className="reports-financial-details">
                  <h3>💰 Financial Details</h3>
                  <div className="financial-item">
                    <span>Late Fees Collected:</span>
                    <strong>₱{financialSummary.collectedLateFees || 0}</strong>
                  </div>
                  <div className="financial-item">
                    <span>Damage Fees Collected:</span>
                    <strong>₱{financialSummary.collectedDamageFees || 0}</strong>
                  </div>
                  <div className="financial-item">
                    <span>Lost Book Fees Collected:</span>
                    <strong>₱{financialSummary.collectedLostBookFees || 0}</strong>
                  </div>
                  <div className="financial-item total">
                    <span>Total Revenue:</span>
                    <strong>₱{financialSummary.totalCollected || 0}</strong>
                  </div>
                  <hr />
                  <div className="financial-item">
                    <span>Outstanding Late Fees:</span>
                    <strong className="unpaid">₱{financialSummary.unpaidLateFees || 0}</strong>
                  </div>
                  <div className="financial-item">
                    <span>Outstanding Damage Fees:</span>
                    <strong className="unpaid">₱{financialSummary.unpaidDamageFees || 0}</strong>
                  </div>
                  <div className="financial-item total">
                    <span>Total Outstanding:</span>
                    <strong className="unpaid">₱{financialSummary.totalUnpaid || 0}</strong>
                  </div>
                </div>
              </div>
            
          )}

          <div className="reports-table-container">
            <h3>⚠️ Current Overdue Books</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student Name</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Current Fee</th>
                </tr>
              </thead>
              <tbody>
                {overdueBooks.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No overdue books! 🎉
                    </td>
                  </tr>
                ) : (
                  overdueBooks.map((item) => (
                    <tr key={item.requestId}>
                      <td>{item.book.title}</td>
                      <td>
                        {item.student.firstName} {item.student.lastName}
                      </td>
                      <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td className="overdue-days">{item.daysOverdue}</td>
                      <td className="fee">₱{item.potentialFee}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="reports-table-container">
            <h3>💳 Students with Outstanding Fees</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Late Fee</th>
                  <th>Damage Fee</th>
                  <th>Total Due</th>
                </tr>
              </thead>
              <tbody>
                {studentsWithFees.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      All fees paid! ✅
                    </td>
                  </tr>
                ) : (
                  studentsWithFees.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.studentName}</td>
                      <td>{item.studentId}</td>
                      <td>₱{item.lateFee || 0}</td>
                      <td>₱{item.damageFee || 0}</td>
                      <td className="fee">
                        <strong>₱{item.totalDue || 0}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* BOOK CONDITION TAB */}
      {selectedTab === "condition" && (
        <>
          {bookConditionReport && (
            <div className="reports-summary-cards">
              <div className="card green">
                <h4>✅ Good Condition</h4>
                <p>{bookConditionReport.goodCount || 0}</p>
                <small>{bookConditionReport.goodPercentage || 0}%</small>
              </div>
              <div className="card orange">
                <h4>⚠️ Damaged</h4>
                <p>{bookConditionReport.damagedCount || 0}</p>
                <small>{bookConditionReport.damagedPercentage || 0}%</small>
              </div>
              <div className="card red">
                <h4>❌ Lost</h4>
                <p>{bookConditionReport.lostCount || 0}</p>
                <small>{bookConditionReport.lostPercentage || 0}%</small>
              </div>
              <div className="card purple">
                <h4>💰 Damage Costs</h4>
                <p>₱{bookConditionReport.totalDamageCost || 0}</p>
              </div>
            </div>
          )}

          {damageAnalysis && (
            <div className="reports-two-column">
              <div className="reports-chart-container">
                <h3>📊 Damage Level Breakdown</h3>
                {damageBreakdownData && <Bar data={damageBreakdownData} />}
              </div>

              <div className="reports-damage-summary">
                <h3>🔍 Damage Analysis</h3>
                <div className="damage-item">
                  <span>🟢 Minor Damages:</span>
                  <strong>
                    {damageAnalysis.minorCount || 0} books (₱{damageAnalysis.minorCost || 0})
                  </strong>
                </div>
                <div className="damage-item">
                  <span>🟡 Moderate Damages:</span>
                  <strong>
                    {damageAnalysis.moderateCount || 0} books (₱{damageAnalysis.moderateCost || 0})
                  </strong>
                </div>
                <div className="damage-item">
                  <span>🔴 Severe Damages:</span>
                  <strong>
                    {damageAnalysis.severeCount || 0} books (₱{damageAnalysis.severeCost || 0})
                  </strong>
                </div>
                <hr />
                <div className="damage-item total">
                  <span>Total Damage Cost:</span>
                  <strong>₱{damageAnalysis.totalCost || 0}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="reports-table-container">
            <h3>📋 Damaged Books History</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student</th>
                  <th>Return Date</th>
                  <th>Damage Level</th>
                  <th>Description</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {damagedBooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No damaged books recorded 🎉
                    </td>
                  </tr>
                ) : (
                  damagedBooks.map((item, index) => (
                    <tr key={index}>
                      <td>{item.bookTitle}</td>
                      <td>{item.studentName}</td>
                      <td>{new Date(item.returnDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`damage-badge ${item.damageLevel}`}>{item.damageLevel}</span>
                      </td>
                      <td style={{ maxWidth: "200px" }}>{item.damageDescription}</td>
                      <td>₱{item.damageFee}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="reports-table-container">
            <h3>❌ Lost Books</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Student</th>
                  <th>Lost Date</th>
                  <th>Replacement Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lostBooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No lost books 🎉
                    </td>
                  </tr>
                ) : (
                  lostBooks.map((item, index) => (
                    <tr key={index}>
                      <td>{item.bookTitle}</td>
                      <td>{item.author}</td>
                      <td>{item.studentName}</td>
                      <td>{new Date(item.lostDate).toLocaleDateString()}</td>
                      <td className="fee">₱{item.replacementCost}</td>
                      <td>
                        <span className={`payment-status ${item.paid ? "paid" : "unpaid"}`}>
                          {item.paid ? "✅ Paid" : "⏳ Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* STUDENTS TAB */}
      {selectedTab === "students" && (
        <>
          <div className="reports-table-container">
            <h3>🏆 Top Borrowers</h3>
            {topBorrowers.length === 0 ? (
              <p className="no-data">No borrower data available for this period</p>
            ) : (
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Total Borrows</th>
                  </tr>
                </thead>
                <tbody>
                  {topBorrowers.map((item, index) => (
                    <tr key={item.student._id}>
                      <td>{index + 1}</td>
                      <td>
                        {item.student.firstName} {item.student.middleName} {item.student.lastName}
                      </td>
                      <td>{item.student.studentId}</td>
                      <td>{item.student.course}</td>
                      <td>{item.borrowCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="reports-table-container">
            <h3>⚠️ Students Requiring Action</h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Outstanding Fees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentsWithFees.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      No students with fees! ✅
                    </td>
                  </tr>
                ) : (
                  studentsWithFees.map((item, index) => (
                    <tr key={index}>
                      <td>{item.studentName}</td>
                      <td>{item.studentId}</td>
                      <td className="fee">₱{item.totalDue || 0}</td>
                      <td>
                        {item.totalDue > 500 ? (
                          <span className="status-badge critical">🔴 Critical</span>
                        ) : item.totalDue > 100 ? (
                          <span className="status-badge warning">🟡 Warning</span>
                        ) : (
                          <span className="status-badge normal">🟢 Normal</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default ReportsSection;