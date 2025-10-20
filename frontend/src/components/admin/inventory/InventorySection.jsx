import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Package, TrendingUp, TrendingDown, AlertTriangle, Search, Download, 
  ArrowUpDown, X, Eye, Clock, CheckCircle, XCircle, AlertCircle as AlertCircleIcon,
  Plus, Minus, Wrench, Settings
} from "lucide-react";

function InventorySection() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(50);

  // Stock adjustment states
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: "add", // add or remove
    quantity: 1,
    reason: "correction", // correction, damaged, lost, repair, other
    notes: ""
  });

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalCopies: 0,
    availableCopies: 0,
    borrowedCopies: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    damagedCount: 0,
    recentLostCount: 0,
  });

  useEffect(() => {
    fetchBooks();
  }, [currentPage, filter, searchQuery]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      
      let query = `?page=${currentPage}&limit=${pageSize}`;
      if (filter === "low-stock") query += "&status=low-stock";
      if (filter === "out-of-stock") query += "&status=out-of-stock";
      if (searchQuery) query += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await axios.get(`http://localhost:5000/api/books${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBooks(response.data.books);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages);
        }
        await calculateStats(response.data.books);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      showNotification("Failed to fetch books", "error");
    } finally {
      setLoading(false);
    }
  };

  // Replace the calculateStats function in InventorySection.js with this:

const calculateStats = async (booksData) => {
  const totalBooks = booksData.length;
  const totalCopies = booksData.reduce((sum, book) => sum + book.totalCopies, 0);
  const availableCopies = booksData.reduce((sum, book) => sum + book.availableCopies, 0);
  
  // FIXED: Count actual approved borrows instead of calculating from inventory
  let borrowedCopies = 0;
  try {
    const token = localStorage.getItem("adminToken");
    const response = await axios.get("http://localhost:5000/api/borrow/requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.data.success) {
      borrowedCopies = response.data.requests.filter(
        (req) => req.status === "approved"
      ).length;
    }
  } catch (error) {
    console.error("Error fetching borrowed requests:", error);
    // Fallback to calculation if API fails
    borrowedCopies = totalCopies - availableCopies;
  }
  
  const lowStockCount = booksData.filter(
    (book) => book.availableCopies > 0 && book.availableCopies <= 3
  ).length;
  const outOfStockCount = booksData.filter((book) => book.availableCopies === 0).length;

  let recentLostCount = 0;
  try {
    const token = localStorage.getItem("adminToken");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const response = await axios.get("http://localhost:5000/api/borrow/requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.data.success) {
      recentLostCount = response.data.requests.filter(
        (req) => req.bookCondition === "lost" && 
                 req.returnDate && 
                 new Date(req.returnDate) >= sevenDaysAgo
      ).length;
    }
  } catch (error) {
    console.error("Error fetching lost books:", error);
  }

  setStats({
    totalBooks,
    totalCopies,
    availableCopies,
    borrowedCopies,  // Now counts actual approved requests
    lowStockCount,
    outOfStockCount,
    damagedCount: 0,
    recentLostCount,
  });
};

  const handleBookClick = async (book) => {
    setSelectedBook(book);
    setShowModal(true);
    await fetchBookHistory(book._id);
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      const token = localStorage.getItem("adminToken");
      const adjustment = parseInt(adjustmentForm.quantity);
      
      let newAvailable = selectedBook.availableCopies;
      let newTotal = selectedBook.totalCopies;

      if (adjustmentForm.type === "add") {
        if (adjustmentForm.reason === "repair") {
          // Repair: Only increase available copies (repairing damaged copies)
          newAvailable += adjustment;
        } else {
          // New stock: Increase both total and available
          newTotal += adjustment;
          newAvailable += adjustment;
        }
      } else {
        // Remove stock
        if (adjustmentForm.reason === "damaged" || adjustmentForm.reason === "lost") {
          // Remove from total inventory (permanently lost/damaged)
          newTotal -= adjustment;
          newAvailable = Math.max(0, newAvailable - adjustment);
        } else {
          // Other removals (correction, etc.) - only reduce available
          newAvailable -= adjustment;
        }
      }

      // Validation
      if (newAvailable < 0) {
        showNotification("Cannot have negative available copies", "error");
        return;
      }
      if (newAvailable > newTotal) {
        showNotification("Available copies cannot exceed total copies", "error");
        return;
      }
      if (newTotal < 0) {
        showNotification("Cannot have negative total copies", "error");
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/books/${selectedBook._id}`,
        {
          availableCopies: newAvailable,
          totalCopies: newTotal,
          description: `${selectedBook.description || ""}\n[Stock Adjustment - ${new Date().toLocaleDateString()}] ${adjustmentForm.type === "add" ? "Added" : "Removed"} ${adjustment} copies - Reason: ${adjustmentForm.reason} - ${adjustmentForm.notes}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showNotification(`Stock adjusted successfully`, "success");
        setShowAdjustModal(false);
        setAdjustmentForm({ type: "add", quantity: 1, reason: "correction", notes: "" });
        fetchBooks();
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      showNotification("Failed to adjust stock", "error");
    }
  };

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStockStatus = (available, total) => {
    if (available === 0) {
      return { text: "Out of Stock", color: "#ef4444", bg: "#fee2e2" };
    }
    if (available <= 3) {
      return { text: "Low Stock", color: "#f59e0b", bg: "#fef3c7" };
    }
    return { text: "In Stock", color: "#10b981", bg: "#d1fae5" };
  };

  const getConditionIcon = (condition) => {
    if (condition === "good") return <CheckCircle size={16} color="#10b981" />;
    if (condition === "damaged") return <AlertCircleIcon size={16} color="#f59e0b" />;
    if (condition === "lost") return <XCircle size={16} color="#ef4444" />;
    return null;
  };

  const getConditionStats = () => {
    const returned = borrowHistory.filter((req) => req.status === "returned");
    const good = returned.filter((req) => req.bookCondition === "good").length;
    const damaged = returned.filter((req) => req.bookCondition === "damaged").length;
    const lost = returned.filter((req) => req.bookCondition === "lost").length;
    return { good, damaged, lost, total: returned.length };
  };

  const getFilteredBooks = () => {
    let filtered = [...books];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.ISBN?.toLowerCase().includes(query) ||
        book.category?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filter === "low-stock") {
      filtered = filtered.filter(book => book.availableCopies > 0 && book.availableCopies <= 3);
    } else if (filter === "out-of-stock") {
      filtered = filtered.filter(book => book.availableCopies === 0);
    }

    return filtered;
  };

  const filteredAndSearchedBooks = getFilteredBooks().sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case "title":
        compareValue = a.title.localeCompare(b.title);
        break;
      case "author":
        compareValue = a.author.localeCompare(b.author);
        break;
      case "available":
        compareValue = a.availableCopies - b.availableCopies;
        break;
      case "total":
        compareValue = a.totalCopies - b.totalCopies;
        break;
      case "borrowed":
        const borrowedA = a.totalCopies - a.availableCopies;
        const borrowedB = b.totalCopies - b.availableCopies;
        compareValue = borrowedA - borrowedB;
        break;
      default:
        compareValue = 0;
    }
    
    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  const exportToCSV = () => {
    const headers = ["Title", "Author", "ISBN", "Category", "Total Copies", "Available", "Borrowed", "Status"];
    
    const rows = filteredAndSearchedBooks.map((book) => {
      const borrowed = book.totalCopies - book.availableCopies;
      const status = getStockStatus(book.availableCopies, book.totalCopies);
      
      return [
        `"${book.title}"`,
        `"${book.author}"`,
        book.ISBN || "N/A",
        book.category || "N/A",
        book.totalCopies,
        book.availableCopies,
        borrowed,
        status.text,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasAlerts = stats.outOfStockCount > 0 || stats.lowStockCount > 0 || stats.recentLostCount > 0;

  return (
    <div className="admin-dashboard-content">
      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "16px 24px",
            backgroundColor: notification.type === "success" ? "#10b981" : notification.type === "error" ? "#ef4444" : "#3b82f6",
            color: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 2000,
            animation: "slideIn 0.3s ease-in"
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Alerts Banner */}
      {hasAlerts && (
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <AlertTriangle size={24} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#92400e" }}>
              Inventory Alerts
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "14px", color: "#78350f" }}>
              {stats.outOfStockCount > 0 && (
                <button
                  onClick={() => {
                    setFilter("out-of-stock");
                    setCurrentPage(1);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: "600",
                    padding: 0,
                  }}
                >
                  {stats.outOfStockCount} book{stats.outOfStockCount !== 1 ? "s" : ""} OUT OF STOCK
                </button>
              )}
              {stats.lowStockCount > 0 && (
                <button
                  onClick={() => {
                    setFilter("low-stock");
                    setCurrentPage(1);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f59e0b",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: "600",
                    padding: 0,
                  }}
                >
                  {stats.lowStockCount} book{stats.lowStockCount !== 1 ? "s" : ""} LOW STOCK (≤3 copies)
                </button>
              )}
              {stats.recentLostCount > 0 && (
                <span style={{ color: "#78350f" }}>
                  {stats.recentLostCount} book{stats.recentLostCount !== 1 ? "s" : ""} lost in last 7 days
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard title="Total Books" value={stats.totalBooks} icon={<Package size={24} />} color="#3b82f6" bgColor="#dbeafe" />
        <SummaryCard title="Total Copies" value={stats.totalCopies} icon={<Package size={24} />} color="#8b5cf6" bgColor="#ede9fe" />
        <SummaryCard title="Available" value={stats.availableCopies} icon={<TrendingUp size={24} />} color="#10b981" bgColor="#d1fae5" />
        <SummaryCard title="Borrowed" value={stats.borrowedCopies} icon={<TrendingDown size={24} />} color="#f59e0b" bgColor="#fef3c7" />
        <SummaryCard title="Low Stock" value={stats.lowStockCount} icon={<AlertTriangle size={24} />} color="#f59e0b" bgColor="#fef3c7" />
        <SummaryCard title="Out of Stock" value={stats.outOfStockCount} icon={<AlertTriangle size={24} />} color="#ef4444" bgColor="#fee2e2" />
      </div>

      {/* Main Content */}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#1f2937", margin: 0 }}>
              Books Inventory
            </h2>
            
            <button
              onClick={exportToCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Download size={18} />
              Export to CSV
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: "16px", position: "relative" }}>
            <Search
              size={20}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, or category..."
              value={searchQuery}
              onChange={handleSearch}
              style={{
                width: "100%",
                padding: "12px 12px 12px 44px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          {/* Filter Buttons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "8px",
            }}
          >
            <button
              onClick={() => {
                setFilter("all");
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 16px",
                border: "none",
                background: filter === "all" ? "#3b82f6" : "#f3f4f6",
                color: filter === "all" ? "white" : "#6b7280",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              All Books ({stats.totalBooks})
            </button>
            <button
              onClick={() => {
                setFilter("low-stock");
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 16px",
                border: "none",
                background: filter === "low-stock" ? "#f59e0b" : "#f3f4f6",
                color: filter === "low-stock" ? "white" : "#6b7280",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Low Stock ({stats.lowStockCount})
            </button>
            <button
              onClick={() => {
                setFilter("out-of-stock");
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 16px",
                border: "none",
                background: filter === "out-of-stock" ? "#ef4444" : "#f3f4f6",
                color: filter === "out-of-stock" ? "white" : "#6b7280",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Out of Stock ({stats.outOfStockCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "#6b7280" }}>Loading inventory...</p>
          </div>
        ) : filteredAndSearchedBooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ fontSize: "18px", color: "#6b7280" }}>
              {searchQuery ? "No books match your search" : "No books found in this category"}
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
                  <th style={thStyle} onClick={() => handleSort("title")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      Book Title
                      <ArrowUpDown size={14} color={sortBy === "title" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th style={thStyle} onClick={() => handleSort("author")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      Author
                      <ArrowUpDown size={14} color={sortBy === "author" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle} onClick={() => handleSort("total")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      Total
                      <ArrowUpDown size={14} color={sortBy === "total" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th style={thStyle} onClick={() => handleSort("available")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      Available
                      <ArrowUpDown size={14} color={sortBy === "available" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th style={thStyle}>Availability</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSearchedBooks.map((book, index) => {
                  const borrowed = book.totalCopies - book.availableCopies;
                  const status = getStockStatus(book.availableCopies, book.totalCopies);
                  const availabilityPercent = book.totalCopies > 0 
                    ? (book.availableCopies / book.totalCopies) * 100 
                    : 0;

                  return (
                    <tr
                      key={book._id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                      }}
                    >
                      <td style={tdStyle}>
                        <p style={{ margin: 0, fontWeight: "500" }}>{book.title}</p>
                      </td>
                      <td style={tdStyle}>{book.author}</td>
                      <td style={tdStyle}>{book.category || "N/A"}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: "600" }}>{book.totalCopies}</span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontWeight: "600",
                            color: status.color,
                            fontSize: "16px",
                          }}
                        >
                          {book.availableCopies}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ width: "100px" }}>
                          <div
                            style={{
                              height: "8px",
                              backgroundColor: "#e5e7eb",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${availabilityPercent}%`,
                                backgroundColor: status.color,
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px", display: "block" }}>
                            {availabilityPercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "4px 12px",
                            backgroundColor: status.bg,
                            color: status.color,
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            display: "inline-block",
                          }}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleBookClick(book)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 10px",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBook(book);
                              setShowAdjustModal(true);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 10px",
                              backgroundColor: "#8b5cf6",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            <Settings size={14} />
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                backgroundColor: currentPage === 1 ? "#e5e7eb" : "#3b82f6",
                color: currentPage === 1 ? "#9ca3af" : "white",
                border: "none",
                borderRadius: "6px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              Previous
            </button>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                backgroundColor: currentPage === totalPages ? "#e5e7eb" : "#3b82f6",
                color: currentPage === totalPages ? "#9ca3af" : "white",
                border: "none",
                borderRadius: "6px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              Next
            </button>
          </div>
        )}
        
        {!loading && (
          <div style={{ marginTop: "16px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
            Showing {filteredAndSearchedBooks.length} books on page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {showModal && selectedBook && (
        <div
          style={{
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1f2937" }}>
                Book Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {/* Book Info */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "8px" }}>
                  {selectedBook.title}
                </h3>
                <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "16px" }}>
                  by {selectedBook.author}
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "16px" }}>
                  <InfoItem label="ISBN" value={selectedBook.ISBN || "N/A"} />
                  <InfoItem label="Category" value={selectedBook.category || "N/A"} />
                  <InfoItem label="Publisher" value={selectedBook.publisher || "N/A"} />
                  <InfoItem label="Publication Year" value={selectedBook.publicationYear || "N/A"} />
                </div>
              </div>

              {/* Stock Info */}
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                }}
              >
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                  Stock Information
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Total Copies</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
                      {selectedBook.totalCopies}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Available</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700", color: "#10b981" }}>
                      {selectedBook.availableCopies}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Borrowed</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700", color: "#f59e0b" }}>
                      {selectedBook.totalCopies - selectedBook.availableCopies}
                    </p>
                  </div>
                </div>
              </div>

              {/* Condition Breakdown */}
              {borrowHistory.filter(req => req.status === "returned").length > 0 && (
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                    Return Condition Summary
                  </h4>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle size={16} color="#10b981" />
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>
                        Good: <strong>{getConditionStats().good}</strong>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertCircleIcon size={16} color="#f59e0b" />
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>
                        Damaged: <strong>{getConditionStats().damaged}</strong>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <XCircle size={16} color="#ef4444" />
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>
                        Lost: <strong>{getConditionStats().lost}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Currently Borrowed */}
              {borrowHistory.filter(req => req.status === "approved").length > 0 && (
                <div
                  style={{
                    backgroundColor: "#fef3c7",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    border: "1px solid #fbbf24",
                  }}
                >
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#92400e" }}>
                    Currently Borrowed By
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {borrowHistory
                      .filter(req => req.status === "approved")
                      .slice(0, 5)
                      .map((req) => (
                        <div
                          key={req._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "14px",
                            color: "#78350f",
                          }}
                        >
                          <span style={{ fontWeight: "500" }}>
                            {req.student?.firstName} {req.student?.lastName}
                          </span>
                          <span style={{ fontSize: "12px", color: "#92400e" }}>
                            Due: {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Borrow History */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1f2937" }}>
                  Borrow History (Last 10)
                </h4>
                
                {historyLoading ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                    Loading history...
                  </div>
                ) : borrowHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                    No borrow history for this book yet
                  </div>
                ) : (
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {borrowHistory.slice(0, 10).map((req) => (
                      <div
                        key={req._id}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #e5e7eb",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                            {req.student?.firstName} {req.student?.lastName}
                          </p>
                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                            {req.status === "returned" 
                              ? `Returned: ${new Date(req.returnDate).toLocaleDateString()}`
                              : req.status === "approved"
                              ? `Borrowed: ${new Date(req.borrowDate).toLocaleDateString()}`
                              : `Requested: ${new Date(req.createdAt).toLocaleDateString()}`
                            }
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {req.status === "returned" && req.bookCondition && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              {getConditionIcon(req.bookCondition)}
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color:
                                    req.bookCondition === "good"
                                      ? "#10b981"
                                      : req.bookCondition === "damaged"
                                      ? "#f59e0b"
                                      : "#ef4444",
                                  textTransform: "capitalize",
                                }}
                              >
                                {req.bookCondition}
                              </span>
                            </div>
                          )}
                          {req.totalFee > 0 && (
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#ef4444" }}>
                              Fee: ₱{req.totalFee}
                            </span>
                          )}
                          <span
                            style={{
                              padding: "4px 8px",
                              backgroundColor:
                                req.status === "returned"
                                  ? "#dbeafe"
                                  : req.status === "approved"
                                  ? "#d1fae5"
                                  : req.status === "pending"
                                  ? "#fef3c7"
                                  : "#fee2e2",
                              color:
                                req.status === "returned"
                                  ? "#1e40af"
                                  : req.status === "approved"
                                  ? "#065f46"
                                  : req.status === "pending"
                                  ? "#92400e"
                                  : "#991b1b",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              textTransform: "capitalize",
                            }}
                          >
                            {req.status}
                          </span>
                          {req.isLate && (
                            <Clock size={14} color="#ef4444" title="Late return" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedBook && (
        <div
          style={{
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
          }}
          onClick={() => setShowAdjustModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>
                Adjust Stock: {selectedBook.title}
              </h2>
              <button
                onClick={() => setShowAdjustModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAdjustStock} style={{ padding: "24px" }}>
              {/* Current Stock */}
              <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f0fdf4", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#6b7280" }}>Current Stock</p>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Available:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700", color: "#10b981" }}>
                      {selectedBook.availableCopies}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Total:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
                      {selectedBook.totalCopies}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Type */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", display: "block", marginBottom: "8px" }}>
                  Action
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setAdjustmentForm({ ...adjustmentForm, type: "add" })}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: adjustmentForm.type === "add" ? "#10b981" : "#f3f4f6",
                      color: adjustmentForm.type === "add" ? "white" : "#6b7280",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={16} />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentForm({ ...adjustmentForm, type: "remove" })}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: adjustmentForm.type === "remove" ? "#ef4444" : "#f3f4f6",
                      color: adjustmentForm.type === "remove" ? "white" : "#6b7280",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Minus size={16} />
                    Remove
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", display: "block", marginBottom: "8px" }}>
                  Reason
                </label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  {adjustmentForm.type === "add" ? (
                    <>
                      <option value="correction">Stock Correction</option>
                      <option value="repair">Repair Complete</option>
                      <option value="new-purchase">New Purchase</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="correction">Stock Correction</option>
                      <option value="damaged">Damaged (Beyond Repair)</option>
                      <option value="lost">Lost</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", display: "block", marginBottom: "8px" }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={adjustmentForm.quantity}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: parseInt(e.target.value) || 1 })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", display: "block", marginBottom: "8px" }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    minHeight: "80px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

function InfoItem({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
        {label}
      </p>
      <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>
        {value}
      </p>
    </div>
  );
}

function SummaryCard({ title, value, icon, color, bgColor }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "12px",
          backgroundColor: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#6b7280",
            fontWeight: "500",
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "28px",
            fontWeight: "700",
            color: "#1f2937",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

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

export default InventorySection;