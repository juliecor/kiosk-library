import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Package, TrendingUp, TrendingDown, AlertTriangle, Search, Download, 
  ArrowUpDown, X, Eye, Clock, CheckCircle, XCircle, AlertCircle as AlertCircleIcon,
  Plus, Minus, Wrench, Settings, History, BookOpen
} from "lucide-react";
import "./InventorySection.css";

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
  const [activeTab, setActiveTab] = useState("inventory");
  const [stockHistory, setStockHistory] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [lostBooks, setLostBooks] = useState([]);
  const [damagedBooks, setDamagedBooks] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(50);
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: "add",
    quantity: 1,
    reason: "correction",
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
    recentRepairs: 0,
  });

  useEffect(() => {
    fetchBooks();
    fetchStockHistory();
  }, [currentPage, filter, searchQuery]);

  // Fetch data when tabs change
  useEffect(() => {
    if (activeTab === "repairs") {
      fetchRepairs();
    } else if (activeTab === "lost") {
      fetchLostBooks();
    } else if (activeTab === "history") {
      fetchStockHistory();
    }
  }, [activeTab]);

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

  const fetchStockHistory = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5000/api/inventory/stock-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setStockHistory(response.data.history);
      }
    } catch (error) {
      console.error("Error fetching stock history:", error);
      setStockHistory([]);
    }
  };

  const fetchRepairs = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5000/api/inventory/repairs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setRepairs(response.data.repairs);
      }
    } catch (error) {
      console.error("Error fetching repairs:", error);
      setRepairs([]);
    }
  };

  const fetchLostBooks = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5000/api/inventory/lost-books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setLostBooks(response.data.lostBooks);
      }
    } catch (error) {
      console.error("Error fetching lost books:", error);
      setLostBooks([]);
    }
  };

  const fetchDamagedBooks = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5000/api/inventory/damaged-books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        setDamagedBooks(response.data.damagedBooks);
      }
    } catch (error) {
      console.error("Error fetching damaged books:", error);
      setDamagedBooks([]);
    }
  };

  const fetchBookHistory = async (bookId) => {
    setHistoryLoading(true);
    setBorrowHistory([]);
    
    try {
      const token = localStorage.getItem("adminToken");
      
      const response = await axios.get("http://localhost:5000/api/borrow/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success && response.data.requests) {
        const bookRequests = response.data.requests.filter(req => {
          if (!req.book) return false;
          const reqBookId = typeof req.book === 'string' ? req.book : req.book._id;
          return reqBookId === bookId;
        });
        
        bookRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBorrowHistory(bookRequests);
        
        if (bookRequests.length === 0) {
          console.log("No borrow history found for this book");
        }
      } else {
        showNotification("No borrow history available", "info");
      }
    } catch (error) {
      console.error("Error fetching book history:", error);
      showNotification("Could not load book history", "error");
      setBorrowHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const calculateStats = async (booksData) => {
    const totalBooks = booksData.length;
    const totalCopies = booksData.reduce((sum, book) => sum + book.totalCopies, 0);
    const availableCopies = booksData.reduce((sum, book) => sum + book.availableCopies, 0);
    
    let borrowedCopies = 0;
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5000/api/borrow/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        borrowedCopies = response.data.requests.filter((req) => req.status === "approved").length;
      }
    } catch (error) {
      console.error("Error fetching borrowed requests:", error);
      borrowedCopies = totalCopies - availableCopies;
    }
    
    const lowStockCount = booksData.filter((book) => book.availableCopies > 0 && book.availableCopies <= 3).length;
    const outOfStockCount = booksData.filter((book) => book.availableCopies === 0).length;

    let recentLostCount = 0;
    let recentRepairs = 0;
    try {
      const token = localStorage.getItem("adminToken");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const response = await axios.get("http://localhost:5000/api/borrow/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        recentLostCount = response.data.requests.filter(
          (req) => req.bookCondition === "lost" && req.returnDate && new Date(req.returnDate) >= sevenDaysAgo
        ).length;
      }

      recentRepairs = stockHistory.filter((h) => h.reason === "repair" && new Date(h.date) >= sevenDaysAgo).length;
    } catch (error) {
      console.error("Error calculating stats:", error);
    }

    setStats({
      totalBooks, totalCopies, availableCopies, borrowedCopies,
      lowStockCount, outOfStockCount, damagedCount: 0, recentLostCount, recentRepairs,
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
          newAvailable += adjustment;
        } else {
          newTotal += adjustment;
          newAvailable += adjustment;
        }
      } else {
        if (adjustmentForm.reason === "damaged" || adjustmentForm.reason === "lost") {
          newTotal -= adjustment;
          newAvailable = Math.max(0, newAvailable - adjustment);
        } else {
          newAvailable -= adjustment;
        }
      }

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
          status: newAvailable === 0 ? "borrowed" : "available"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Log stock movement to backend
      try {
        await axios.post(
          "http://localhost:5000/api/inventory/stock-history",
          {
            bookId: selectedBook._id,
            bookTitle: selectedBook.title,
            author: selectedBook.author,
            action: adjustmentForm.type,
            quantity: adjustment,
            reason: adjustmentForm.reason,
            notes: adjustmentForm.notes,
            previousAvailable: selectedBook.availableCopies,
            previousTotal: selectedBook.totalCopies,
            newAvailable: newAvailable,
            newTotal: newTotal,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (historyError) {
        console.log("Stock history logging failed:", historyError);
      }

      if (response.data.success) {
        showNotification(`Stock adjusted successfully`, "success");
        setShowAdjustModal(false);
        setAdjustmentForm({ type: "add", quantity: 1, reason: "correction", notes: "" });
        fetchBooks();
        fetchStockHistory();
        
        // Refresh current tab data
        if (activeTab === "repairs") {
          fetchRepairs();
        } else if (activeTab === "lost") {
          fetchLostBooks();
        }
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
    if (available === 0) return { text: "Out of Stock", color: "#ef4444", bg: "#fee2e2" };
    if (available <= 3) return { text: "Low Stock", color: "#f59e0b", bg: "#fef3c7" };
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.ISBN?.toLowerCase().includes(query) ||
        book.category?.toLowerCase().includes(query)
      );
    }
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
      case "title": compareValue = a.title.localeCompare(b.title); break;
      case "author": compareValue = a.author.localeCompare(b.author); break;
      case "available": compareValue = a.availableCopies - b.availableCopies; break;
      case "total": compareValue = a.totalCopies - b.totalCopies; break;
      case "borrowed": compareValue = (a.totalCopies - a.availableCopies) - (b.totalCopies - b.availableCopies); break;
      default: compareValue = 0;
    }
    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  const getFilteredHistory = () => {
    let filtered = [...stockHistory];
    if (historyFilter === "repairs") filtered = filtered.filter(h => h.reason === "repair");
    else if (historyFilter === "lost") filtered = filtered.filter(h => h.reason === "lost");
    else if (historyFilter === "additions") filtered = filtered.filter(h => h.action === "add");
    else if (historyFilter === "removals") filtered = filtered.filter(h => h.action === "remove");
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const exportToCSV = () => {
    const booksByCategory = {};
    filteredAndSearchedBooks.forEach((book) => {
      const category = book.category || "Uncategorized";
      if (!booksByCategory[category]) booksByCategory[category] = [];
      booksByCategory[category].push(book);
    });
    
    let csvContent = "BENEDICTO COLLEGE LIBRARY - INVENTORY REPORT\n";
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    Object.keys(booksByCategory).sort().forEach((category) => {
      csvContent += `\nCATEGORY: ${category}\n`;
      csvContent += "Title,Author,ISBN,Total Copies,Available,Borrowed,Status\n";
      
      booksByCategory[category].forEach((book) => {
        const borrowed = book.totalCopies - book.availableCopies;
        const status = getStockStatus(book.availableCopies, book.totalCopies);
        csvContent += `"${book.title}","${book.author}","${book.ISBN || "N/A"}",${book.totalCopies},${book.availableCopies},${borrowed},"${status.text}"\n`;
      });
      
      const categoryTotal = booksByCategory[category].reduce((sum, b) => sum + b.totalCopies, 0);
      const categoryAvailable = booksByCategory[category].reduce((sum, b) => sum + b.availableCopies, 0);
      csvContent += `SUBTOTAL,${booksByCategory[category].length} books,,,${categoryTotal},${categoryAvailable},${categoryTotal - categoryAvailable},\n`;
    });
    
    csvContent += `\nGRAND TOTAL,${filteredAndSearchedBooks.length} books,,,${stats.totalCopies},${stats.availableCopies},${stats.borrowedCopies},\n`;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_by_category_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportHistoryToCSV = () => {
    const headers = ["Date", "Book Title", "Action", "Quantity", "Reason", "Notes", "Previous", "New", "Admin"];
    const rows = getFilteredHistory().map((h) => [
      new Date(h.date).toLocaleString(),
      `"${h.bookTitle}"`,
      h.action,
      h.quantity,
      h.reason,
      `"${h.notes || ""}"`,
      h.previousAvailable,
      h.newAvailable,
      h.adminName || "System"
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {hasAlerts && (
        <div className="alert-banner">
          <AlertTriangle size={24} color="#f59e0b" />
          <div className="alert-banner-content">
            <h3>Inventory Alerts</h3>
            <div className="alert-banner-items">
              {stats.outOfStockCount > 0 && (
                <button
                  className="alert-link out-of-stock"
                  onClick={() => { setFilter("out-of-stock"); setCurrentPage(1); setActiveTab("inventory"); }}
                >
                  {stats.outOfStockCount} book{stats.outOfStockCount !== 1 ? "s" : ""} OUT OF STOCK
                </button>
              )}
              {stats.lowStockCount > 0 && (
                <button
                  className="alert-link low-stock"
                  onClick={() => { setFilter("low-stock"); setCurrentPage(1); setActiveTab("inventory"); }}
                >
                  {stats.lowStockCount} book{stats.lowStockCount !== 1 ? "s" : ""} LOW STOCK (≤3 copies)
                </button>
              )}
              {stats.recentLostCount > 0 && (
                <button
                  className="alert-link lost"
                  onClick={() => setActiveTab("lost")}
                >
                  {stats.recentLostCount} book{stats.recentLostCount !== 1 ? "s" : ""} lost in last 7 days
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="summary-cards-grid">
        <SummaryCard title="Total Books" value={stats.totalBooks} icon={<Package size={24} />} color="#3b82f6" bgColor="#dbeafe" />
        <SummaryCard title="Total Copies" value={stats.totalCopies} icon={<Package size={24} />} color="#8b5cf6" bgColor="#ede9fe" />
        <SummaryCard title="Available" value={stats.availableCopies} icon={<TrendingUp size={24} />} color="#10b981" bgColor="#d1fae5" />
        <SummaryCard title="Borrowed" value={stats.borrowedCopies} icon={<TrendingDown size={24} />} color="#f59e0b" bgColor="#fef3c7" />
        <SummaryCard title="Low Stock" value={stats.lowStockCount} icon={<AlertTriangle size={24} />} color="#f59e0b" bgColor="#fef3c7" />
        <SummaryCard 
          title="Recent Repairs" 
          value={stats.recentRepairs} 
          icon={<Wrench size={24} />} 
          color="#10b981" 
          bgColor="#d1fae5"
          onClick={() => setActiveTab("repairs")}
          clickable={true}
        />
      </div>

      <div className="inventory-tabs">
        <div className="inventory-tabs-list">
          <button className={`tab-button ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
            <BookOpen size={18} /> Inventory
          </button>
          <button className={`tab-button ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
            <History size={18} /> Stock History ({stockHistory.length})
          </button>
          <button className={`tab-button ${activeTab === "repairs" ? "active" : ""}`} onClick={() => setActiveTab("repairs")}>
            <Wrench size={18} /> Repairs ({repairs.length})
          </button>
          <button className={`tab-button ${activeTab === "lost" ? "active" : ""}`} onClick={() => setActiveTab("lost")}>
            <XCircle size={18} /> Lost Books ({lostBooks.length})
          </button>
        </div>
      </div>

      {activeTab === "inventory" && (
        <InventoryTab
          loading={loading}
          filteredAndSearchedBooks={filteredAndSearchedBooks}
          filter={filter}
          setFilter={setFilter}
          setCurrentPage={setCurrentPage}
          stats={stats}
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          sortBy={sortBy}
          handleSort={handleSort}
          sortOrder={sortOrder}
          getStockStatus={getStockStatus}
          handleBookClick={handleBookClick}
          setSelectedBook={setSelectedBook}
          setShowAdjustModal={setShowAdjustModal}
          exportToCSV={exportToCSV}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      {activeTab === "history" && (
        <StockHistoryTab
          stockHistory={getFilteredHistory()}
          historyFilter={historyFilter}
          setHistoryFilter={setHistoryFilter}
          exportHistoryToCSV={exportHistoryToCSV}
        />
      )}

      {activeTab === "repairs" && <RepairsTab repairs={repairs} />}

      {activeTab === "lost" && <LostBooksTab lostBooks={lostBooks} />}

      {showModal && selectedBook && (
        <BookDetailModal
          selectedBook={selectedBook}
          setShowModal={setShowModal}
          borrowHistory={borrowHistory}
          historyLoading={historyLoading}
          getConditionStats={getConditionStats}
          getConditionIcon={getConditionIcon}
        />
      )}

      {showAdjustModal && selectedBook && (
        <StockAdjustmentModal
          selectedBook={selectedBook}
          setShowAdjustModal={setShowAdjustModal}
          adjustmentForm={adjustmentForm}
          setAdjustmentForm={setAdjustmentForm}
          handleAdjustStock={handleAdjustStock}
        />
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon, color, bgColor, onClick, clickable }) {
  return (
    <div 
      className={`summary-card ${clickable ? 'clickable' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="summary-card-icon" style={{ backgroundColor: bgColor, color: color }}>
        {icon}
      </div>
      <div className="summary-card-content">
        <p>{title}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}

// Inventory Tab Component
function InventoryTab({ 
  loading, filteredAndSearchedBooks, filter, setFilter, setCurrentPage, stats,
  searchQuery, handleSearch, sortBy, handleSort, sortOrder, getStockStatus,
  handleBookClick, setSelectedBook, setShowAdjustModal, exportToCSV,
  currentPage, totalPages
}) {
  return (
    <div className="inventory-content">
      <div className="inventory-header">
        <h2>Books Inventory</h2>
        <button className="export-button" onClick={exportToCSV}>
          <Download size={18} />
          Export by Category
        </button>
      </div>

      <div className="search-container">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by title, author, ISBN, or category..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === "all" ? "active all" : ""}`}
          onClick={() => { setFilter("all"); setCurrentPage(1); }}
        >
          All Books ({stats.totalBooks})
        </button>
        <button
          className={`filter-btn ${filter === "low-stock" ? "active low-stock" : ""}`}
          onClick={() => { setFilter("low-stock"); setCurrentPage(1); }}
        >
          Low Stock ({stats.lowStockCount})
        </button>
        <button
          className={`filter-btn ${filter === "out-of-stock" ? "active out-of-stock" : ""}`}
          onClick={() => { setFilter("out-of-stock"); setCurrentPage(1); }}
        >
          Out of Stock ({stats.outOfStockCount})
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading inventory...</p>
        </div>
      ) : filteredAndSearchedBooks.length === 0 ? (
        <div className="empty-container">
          <p>{searchQuery ? "No books match your search" : "No books found in this category"}</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("title")}>
                    <div className="sortable-header">
                      Book Title
                      <ArrowUpDown size={14} color={sortBy === "title" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("author")}>
                    <div className="sortable-header">
                      Author
                      <ArrowUpDown size={14} color={sortBy === "author" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th>Category</th>
                  <th onClick={() => handleSort("total")}>
                    <div className="sortable-header">
                      Total
                      <ArrowUpDown size={14} color={sortBy === "total" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th onClick={() => handleSort("available")}>
                    <div className="sortable-header">
                      Available
                      <ArrowUpDown size={14} color={sortBy === "available" ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSearchedBooks.map((book) => {
                  const status = getStockStatus(book.availableCopies, book.totalCopies);
                  const availabilityPercent = book.totalCopies > 0 
                    ? (book.availableCopies / book.totalCopies) * 100 
                    : 0;

                  return (
                    <tr key={book._id}>
                      <td><strong>{book.title}</strong></td>
                      <td>{book.author}</td>
                      <td>{book.category || "N/A"}</td>
                      <td><strong>{book.totalCopies}</strong></td>
                      <td>
                        <span style={{ fontWeight: "600", color: status.color, fontSize: "16px" }}>
                          {book.availableCopies}
                        </span>
                      </td>
                      <td>
                        <div className="availability-bar-container">
                          <div className="availability-bar">
                            <div
                              className="availability-fill"
                              style={{ width: `${availabilityPercent}%`, backgroundColor: status.color }}
                            />
                          </div>
                          <span className="availability-percentage">{availabilityPercent.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: status.bg, color: status.color }}>
                          {status.text}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view" onClick={() => handleBookClick(book)}>
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            className="action-btn adjust"
                            onClick={() => { setSelectedBook(book); setShowAdjustModal(true); }}
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

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Stock History Tab Component
function StockHistoryTab({ stockHistory, historyFilter, setHistoryFilter, exportHistoryToCSV }) {
  return (
    <div className="inventory-content">
      <div className="inventory-header">
        <h2>Stock Movement History</h2>
        <button className="export-button" onClick={exportHistoryToCSV}>
          <Download size={18} />
          Export History
        </button>
      </div>

      <div className="filter-buttons">
        {["all", "repairs", "lost", "additions", "removals"].map((f) => (
          <button
            key={f}
            className={`filter-btn ${historyFilter === f ? `active ${f}` : ""}`}
            onClick={() => setHistoryFilter(f)}
          >
            {f === "all" ? "All" : f === "repairs" ? "Repairs Only" : 
             f === "lost" ? "Lost Books" : f === "additions" ? "Additions" : "Removals"}
          </button>
        ))}
      </div>

      {stockHistory.length === 0 ? (
        <div className="empty-container">
          <p>No stock history available</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Book Title</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Previous → New</th>
                <th>Notes</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {stockHistory.map((history, index) => (
                <tr key={index}>
                  <td>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                      {new Date(history.date).toLocaleString()}
                    </span>
                  </td>
                  <td><strong>{history.bookTitle}</strong></td>
                  <td>
                    <span className={`action-badge ${history.action}`}>
                      {history.action === "add" ? <Plus size={12} /> : <Minus size={12} />}
                      {history.action === "add" ? "Added" : "Removed"}
                    </span>
                  </td>
                  <td><strong style={{ fontSize: "16px" }}>{history.quantity}</strong></td>
                  <td>
                    <span className={`reason-badge ${history.reason}`}>
                      {history.reason}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                      {history.previousAvailable} → <strong style={{ color: "#1f2937" }}>{history.newAvailable}</strong>
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{history.notes || "-"}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{history.adminName || "System"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Repairs Tab Component
function RepairsTab({ repairs }) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentRepairs = repairs.filter(r => new Date(r.date) >= sevenDaysAgo).length;
  const totalRepaired = repairs.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="inventory-content">
      <h2>🔧 Repair History</h2>

      {repairs.length === 0 ? (
        <div className="empty-container">
          <Wrench size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
          <p>No repair records yet</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginBottom: "20px" }}>
            <table className="inventory-table">
              <thead>
                <tr style={{ backgroundColor: "#d1fae5" }}>
                  <th>Repair Date</th>
                  <th>Book Title</th>
                  <th>Quantity Repaired</th>
                  <th>Previous Available</th>
                  <th>New Available</th>
                  <th>Notes</th>
                  <th>Repaired By</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((repair, index) => (
                  <tr key={index}>
                    <td>
                      <span style={{ fontSize: "14px", fontWeight: "500", color: "#10b981" }}>
                        {new Date(repair.date).toLocaleDateString()}
                      </span>
                      <br />
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {new Date(repair.date).toLocaleTimeString()}
                      </span>
                    </td>
                    <td><strong>{repair.bookTitle}</strong></td>
                    <td>
                      <span style={{
                        padding: "6px 12px", backgroundColor: "#d1fae5", color: "#065f46",
                        borderRadius: "20px", fontSize: "16px", fontWeight: "700"
                      }}>
                        +{repair.quantity}
                      </span>
                    </td>
                    <td>{repair.previousAvailable}</td>
                    <td><strong style={{ color: "#10b981" }}>{repair.newAvailable}</strong></td>
                    <td><span style={{ fontSize: "13px", color: "#6b7280" }}>{repair.notes || "No notes"}</span></td>
                    <td><span style={{ fontSize: "13px", color: "#6b7280" }}>{repair.adminName || "System"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-box repair">
            <h3>Summary</h3>
            <div className="summary-stats">
              <div className="summary-stat">
                <p>Total Repairs</p>
                <p>{repairs.length}</p>
              </div>
              <div className="summary-stat">
                <p>Books Repaired</p>
                <p>{totalRepaired}</p>
              </div>
              <div className="summary-stat">
                <p>Last 7 Days</p>
                <p>{recentRepairs}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Lost Books Tab Component
function LostBooksTab({ lostBooks }) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentLost = lostBooks.filter(l => new Date(l.date) >= sevenDaysAgo).length;
  const totalLost = lostBooks.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="inventory-content">
      <h2>❌ Lost Books History</h2>

      {lostBooks.length === 0 ? (
        <div className="empty-container">
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: "16px" }} />
          <p>No lost books recorded! 🎉</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginBottom: "20px" }}>
            <table className="inventory-table">
              <thead>
                <tr style={{ backgroundColor: "#fee2e2" }}>
                  <th>Lost Date</th>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Quantity Lost</th>
                  <th>Previous Total</th>
                  <th>New Total</th>
                  <th>Notes</th>
                  <th>Recorded By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lostBooks.map((lost, index) => (
                  <tr key={index}>
                    <td>
                      <span style={{ fontSize: "14px", fontWeight: "500", color: "#ef4444" }}>
                        {new Date(lost.date).toLocaleDateString()}
                      </span>
                      <br />
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {new Date(lost.date).toLocaleTimeString()}
                      </span>
                    </td>
                    <td><strong>{lost.bookTitle}</strong></td>
                    <td>{lost.author}</td>
                    <td>
                      <span style={{
                        padding: "6px 12px", backgroundColor: "#fee2e2", color: "#991b1b",
                        borderRadius: "20px", fontSize: "16px", fontWeight: "700"
                      }}>
                        -{lost.quantity}
                      </span>
                    </td>
                    <td>{lost.previousTotal}</td>
                    <td><strong style={{ color: "#ef4444" }}>{lost.newTotal}</strong></td>
                    <td><span style={{ fontSize: "13px", color: "#6b7280" }}>{lost.notes || "No notes"}</span></td>
                    <td><span style={{ fontSize: "13px", color: "#6b7280" }}>{lost.adminName || "System"}</span></td>
                    <td>
                      <span className={`payment-status ${lost.paid ? "paid" : "unpaid"}`}>
                        {lost.paid ? "✅ Paid" : "⏳ Unpaid"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-box lost">
            <h3>Summary</h3>
            <div className="summary-stats">
              <div className="summary-stat">
                <p>Total Incidents</p>
                <p>{lostBooks.length}</p>
              </div>
              <div className="summary-stat">
                <p>Total Books Lost</p>
                <p>{totalLost}</p>
              </div>
              <div className="summary-stat">
                <p>Last 7 Days</p>
                <p>{recentLost}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Book Detail Modal Component
function BookDetailModal({ selectedBook, setShowModal, borrowHistory, historyLoading, getConditionStats, getConditionIcon }) {
  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book Details</h2>
          <button className="modal-close" onClick={() => setShowModal(false)}>
            <X size={24} color="#6b7280" />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>
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

          <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>Stock Information</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Total Copies</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "700" }}>{selectedBook.totalCopies}</p>
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

          {borrowHistory.filter(req => req.status === "returned").length > 0 && (
            <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>Return Condition Summary</h4>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ fontSize: "14px" }}>Good: <strong>{getConditionStats().good}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircleIcon size={16} color="#f59e0b" />
                  <span style={{ fontSize: "14px" }}>Damaged: <strong>{getConditionStats().damaged}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <XCircle size={16} color="#ef4444" />
                  <span style={{ fontSize: "14px" }}>Lost: <strong>{getConditionStats().lost}</strong></span>
                </div>
              </div>
            </div>
          )}

          {borrowHistory.filter(req => req.status === "approved").length > 0 && (
            <div style={{ backgroundColor: "#fef3c7", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #fbbf24" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#92400e" }}>
                Currently Borrowed By
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {borrowHistory
                  .filter(req => req.status === "approved")
                  .slice(0, 5)
                  .map((req) => (
                    <div key={req._id} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#78350f" }}>
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

          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
              Borrow History (Last 10)
            </h4>
            
            {historyLoading ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>Loading history...</div>
            ) : borrowHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                No borrow history for this book yet
              </div>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {borrowHistory.slice(0, 10).map((req) => (
                  <div key={req._id} style={{ padding: "12px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>
                        {req.student?.firstName} {req.student?.lastName}
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6b7280" }}>
                        {req.status === "returned" 
                          ? `Returned: ${new Date(req.returnDate).toLocaleDateString()}`
                          : req.status === "approved"
                          ? `Borrowed: ${new Date(req.borrowDate || req.createdAt).toLocaleDateString()}`
                          : `Requested: ${new Date(req.createdAt).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {req.status === "returned" && req.bookCondition && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {getConditionIcon(req.bookCondition)}
                        </div>
                      )}
                      {req.totalFee > 0 && (
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#ef4444" }}>
                          ₱{req.totalFee}
                        </span>
                      )}
                      {req.isLate && <Clock size={14} color="#ef4444" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stock Adjustment Modal Component
function StockAdjustmentModal({ selectedBook, setShowAdjustModal, adjustmentForm, setAdjustmentForm, handleAdjustStock }) {
  return (
    <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
      <div className="modal-content" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adjust Stock: {selectedBook.title}</h2>
          <button className="modal-close" onClick={() => setShowAdjustModal(false)}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <form onSubmit={handleAdjustStock} className="modal-body">
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

          <div className="form-group">
            <label className="form-label">Action</label>
            <div className="adjustment-type-buttons">
              <button
                type="button"
                className={`adjustment-type-btn ${adjustmentForm.type === "add" ? "active add" : ""}`}
                onClick={() => setAdjustmentForm({ ...adjustmentForm, type: "add" })}
              >
                <Plus size={16} />
                Add
              </button>
              <button
                type="button"
                className={`adjustment-type-btn ${adjustmentForm.type === "remove" ? "active remove" : ""}`}
                onClick={() => setAdjustmentForm({ ...adjustmentForm, type: "remove" })}
              >
                <Minus size={16} />
                Remove
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <select
              className="form-select"
              value={adjustmentForm.reason}
              onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
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

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-input"
              min="1"
              max="999"
              value={adjustmentForm.quantity}
              onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              value={adjustmentForm.notes}
              onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="form-buttons">
            <button type="button" className="form-btn cancel" onClick={() => setShowAdjustModal(false)}>
              Cancel
            </button>
            <button type="submit" className="form-btn submit">
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Info Item Component
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

export default InventorySection;