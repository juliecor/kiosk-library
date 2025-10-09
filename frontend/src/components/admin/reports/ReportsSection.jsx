import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ReportsSection.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ReportsSection() {
  const [summary, setSummary] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [borrowingTrends, setBorrowingTrends] = useState([]);
  const [lateFees, setLateFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [
          summaryRes,
          mostBorrowedRes,
          overdueRes,
          topBorrowersRes,
          trendsRes,
          lateFeesRes,
        ] = await Promise.all([
          axios.get("/api/reports/summary", { headers }),
          axios.get("/api/reports/most-borrowed?limit=10", { headers }),
          axios.get("/api/reports/overdue", { headers }),
          axios.get("/api/reports/top-borrowers?limit=10", { headers }),
          axios.get("/api/reports/trends?months=6", { headers }),
          axios.get("/api/reports/late-fees", { headers }),
        ]);

        if (summaryRes.data.success) setSummary(summaryRes.data.data);
        if (mostBorrowedRes.data.success) setMostBorrowed(mostBorrowedRes.data.data);
        if (overdueRes.data.success) setOverdueBooks(overdueRes.data.data);
        if (topBorrowersRes.data.success) setTopBorrowers(topBorrowersRes.data.data);
        if (trendsRes.data.success) setBorrowingTrends(trendsRes.data.data);
        if (lateFeesRes.data.success) setLateFees(lateFeesRes.data.data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to load reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token]);

  // Prepare borrowing trends chart data
  const chartData = {
    labels: borrowingTrends.map(item => `${item._id.month}/${item._id.year}`),
    datasets: [
      { label: "Total Borrows", data: borrowingTrends.map(i => i.totalBorrows), backgroundColor: "#4e73df" },
      { label: "Approved", data: borrowingTrends.map(i => i.approved), backgroundColor: "#1cc88a" },
      { label: "Returned", data: borrowingTrends.map(i => i.returned), backgroundColor: "#36b9cc" },
      { label: "Denied", data: borrowingTrends.map(i => i.denied), backgroundColor: "#e74a3b" },
    ],
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p className="reports-loading">Loading reports...</p>;
  if (error) return <p className="reports-error">{error}</p>;

  return (
    <div className="reports-section">
      <button className="reports-print-button" onClick={handlePrint}>Print Report</button>

      <div className="reports-print-header">
        <h1>BENEDICTO COLLEGE LIBRARY</h1>
        <p>Report Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary Cards */}
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

      {/* Most Borrowed Books Table */}
      <div className="reports-table-container">
        <h3>Most Borrowed Books (Top 10)</h3>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Borrow Count</th>
            </tr>
          </thead>
          <tbody>
            {mostBorrowed.map(item => (
              <tr key={item.book._id}>
                <td>{item.book.title}</td>
                <td>{item.book.author}</td>
                <td>{item.borrowCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Borrowers Table */}
      <div className="reports-table-container">
        <h3>Top Borrowers (Top 10)</h3>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Course</th>
              <th>Borrow Count</th>
            </tr>
          </thead>
          <tbody>
            {topBorrowers.map(item => (
              <tr key={item.student._id}>
                <td>{item.student.firstName} {item.student.middleName} {item.student.lastName}</td>
                <td>{item.student.studentId}</td>
                <td>{item.student.course}</td>
                <td>{item.borrowCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Overdue Books Table */}
      <div className="reports-table-container">
        <h3>Overdue Books</h3>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Student Name</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Days Overdue</th>
              <th>Potential Fee</th>
            </tr>
          </thead>
          <tbody>
            {overdueBooks.map(item => (
              <tr key={item.requestId}>
                <td>{item.book.title}</td>
                <td>{item.student.firstName} {item.student.middleName} {item.student.lastName}</td>
                <td>{new Date(item.borrowDate).toLocaleDateString()}</td>
                <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                <td>{item.daysOverdue}</td>
                <td>₱{item.potentialFee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Borrowing Trends Chart */}
      <div className="reports-chart-container">
        <h3>Borrowing Trends (Last 6 Months)</h3>
        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
      </div>

      {/* Late Fees Summary */}
      {lateFees && (
        <div className="reports-latefees-summary">
          <h3>Late Fees Summary</h3>
          <p>Total Fees Collected: ₱{lateFees.paidFees}</p>
          <p>Total Unpaid Fees: ₱{lateFees.unpaidFees}</p>
          <p>Total Transactions: ₱{lateFees.totalTransactions}</p>
        </div>
      )}
    </div>
  );
}

export default ReportsSection;
