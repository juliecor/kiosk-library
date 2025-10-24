import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import DashboardOverview from "../components/admin/DashboardOverview";
import StudentSection from "../components/admin/students/StudentSection";
import BookSection from "../components/admin/books/BookSection";
import BorrowRequestsSection from "../components/admin/requests/BorrowRequestsSection";
import ReportsSection from "../components/admin/reports/ReportsSection";
import InventorySection from '../components/admin/inventory/InventorySection';

function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [studentTab, setStudentTab] = useState('register');
  const [bookTab, setBookTab] = useState('add');
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [viewingStudent, setViewingStudent] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  
  // 🆕 NEW STATE for status management
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);

  const handleViewHistory = (studentId) => {
    setViewingHistory(studentId);
  };

  const handleCloseHistory = () => {
    setViewingHistory(null);
  };

  // NEW: State for dynamic statistics
  const [stats, setStats] = useState(null);
  const [recentActivityData, setRecentActivityData] = useState([]);

  const handleViewStudent = (student) => {
    setViewingStudent(student);
  };

  const handleCloseStudentView = () => {
    setViewingStudent(null);
  };

  // 🆕 NEW FUNCTION: Toggle student status
  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    
    try {
      setStatusUpdateLoading(student.studentId);
      
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `http://localhost:5000/api/students/${student.studentId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update the student in the local state
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.studentId === student.studentId
              ? { ...s, status: newStatus }
              : s
          )
        );

        // Update viewingStudent if it's the same student
        if (viewingStudent && viewingStudent.studentId === student.studentId) {
          setViewingStudent({ ...viewingStudent, status: newStatus });
        }

        // Show success message
        alert(`Student ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert(error.response?.data?.message || 'Failed to update student status');
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    educationLevel: '',
    course: '',
    yearLevel: '',
    studentId: '',
    contactNumber: '',
    email: ''
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [formLoading, setFormLoading] = useState(false);

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    ISBN: '',
    category: '',
    volume: '',
    publisher: '',
    publicationYear: '',
    shelfLocation: '',
    editions: '',
    totalCopies: 1,
    availableCopies: 1,
    description:'',
    image: null
  });

  const [editingBook, setEditingBook] = useState(null);
  const [editBookForm, setEditBookForm] = useState({
    title: '',
    author: '',
    ISBN: '',
    category: '',
    volume: '',
    publisher: '',
    publicationYear: '',
    shelfLocation: '',
    editions: '',
    totalCopies: 1,
    availableCopies: 1,
    image: null
  });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [bookMessage, setBookMessage] = useState({ type: '', text: '' });
  const [bookLoading, setBookLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const educationLevels = {
    'Junior High School': {
      levels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
      courseField: 'Junior High School'
    },
    'Senior High School': {
      levels: ['Grade 11', 'Grade 12'],
      courses: ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL']
    },
    'College': {
      levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      courses: ['BSIT', 'BMMA', 'BSED', 'BSCS','BSCA','BSTM','BSOA','BEED']
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const verifyAdmin = async () => {
      try {
        const res = await axios.get("/api/admin/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setAdminData(res.data.admin);
        } else {
          localStorage.removeItem("adminToken");
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.removeItem("adminToken");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardStats();
    }
  }, [activeSection]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const statsResponse = await axios.get('http://localhost:5000/api/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const activityResponse = await axios.get('http://localhost:5000/api/stats/recent-activity', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      if (activityResponse.data.success) {
        setRecentActivityData(activityResponse.data.activity);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    if (activeSection === 'students' && studentTab === 'view') {
      fetchStudents();
    }
  }, [activeSection, studentTab]);

  useEffect(() => {
    if (activeSection === 'books' && bookTab === 'view') {
      fetchBooks();
    }
  }, [activeSection, bookTab]);

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Fetch students error:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/books');
      
      if (response.data.success) {
        setBooks(response.data.books);
      }
    } catch (error) {
      console.error('Fetch books error:', error);
    } finally {
      setBooksLoading(false);
    }
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setEditBookForm({
      title: book.title,
      author: book.author,
      ISBN: book.ISBN || '',
      category: book.category || '',
      volume: book.volume || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || '',
      description:book.description || '',
      shelfLocation: book.shelfLocation || '',
      editions: book.editions ? book.editions.join(', ') : '',
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      image: null
    });
    setEditImagePreview(book.coverImage ? `http://localhost:5000${book.coverImage}` : null);
    setBookTab('edit');
  };

  const handleEditBookFormChange = (e) => {
    const { name, value } = e.target;
    setEditBookForm({
      ...editBookForm,
      [name]: value
    });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditBookForm({
        ...editBookForm,
        image: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    setBookLoading(true);
    setBookMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setBookMessage({ type: 'error', text: 'Please login first' });
        setBookLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', editBookForm.title);
      formData.append('author', editBookForm.author);
      formData.append('ISBN', editBookForm.ISBN);
      formData.append('category', editBookForm.category);
      formData.append('volume', editBookForm.volume);
      formData.append('publisher', editBookForm.publisher);
      formData.append('publicationYear', editBookForm.publicationYear);
      formData.append('shelfLocation', editBookForm.shelfLocation);
      formData.append('editions', editBookForm.editions);
      formData.append('totalCopies', editBookForm.totalCopies);
      formData.append('availableCopies', editBookForm.availableCopies);
      formData.append("description", editBookForm.description);
      
      if (editBookForm.image) {
        formData.append('image', editBookForm.image);
      }

      const response = await axios.put(
        `http://localhost:5000/api/books/${editingBook._id}`, 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setBookMessage({ type: 'success', text: 'Book updated successfully!' });
        setEditingBook(null);
        setBookTab('view');
        fetchBooks();
      } else {
        setBookMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setBookMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update book.' 
      });
      console.error('Error:', error);
    } finally {
      setBookLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBook(null);
    setEditImagePreview(null);
    setBookTab('view');
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(`http://localhost:5000/api/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Book deleted successfully');
        fetchBooks();
      }
    } catch (error) {
      console.error('Delete book error:', error);
      alert('Failed to delete book');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'educationLevel') {
      setStudentForm({
        ...studentForm,
        educationLevel: value,
        course: '',
        yearLevel: ''
      });
    } else {
      setStudentForm({
        ...studentForm,
        [name]: value
      });
    }
  };

  const handleBookFormChange = (e) => {
    const { name, value } = e.target;
    setBookForm({
      ...bookForm,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBookForm({
        ...bookForm,
        image: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookLoading(true);
    setBookMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setBookMessage({ type: 'error', text: 'Please login first' });
        setBookLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('title', bookForm.title);
      formData.append('author', bookForm.author);
      formData.append('ISBN', bookForm.ISBN);
      formData.append('category', bookForm.category);
      formData.append('volume', bookForm.volume);
      formData.append('publisher', bookForm.publisher);
      formData.append('publicationYear', bookForm.publicationYear);
      formData.append('shelfLocation', bookForm.shelfLocation);
      formData.append('editions', bookForm.editions);
      formData.append('totalCopies', bookForm.totalCopies);
      formData.append('availableCopies', bookForm.availableCopies);
      formData.append("description", bookForm.description);
      
      if (bookForm.image) {
        formData.append('image', bookForm.image);
      }

      const response = await axios.post('http://localhost:5000/api/books', 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setBookMessage({ type: 'success', text: response.data.message || 'Book added successfully!' });
        setBookForm({
          title: '',
          author: '',
          ISBN: '',
          category: '',
          volume: '',
          publisher: '',
          publicationYear: '',
          shelfLocation: '',
          editions: '',
          totalCopies: 1,
          availableCopies: 1,
          description:'',
          image: null
        });
        setImagePreview(null);
        if (bookTab === 'view') {
          fetchBooks();
        }
      } else {
        setBookMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setBookMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add book. Please try again.' 
      });
      console.error('Error:', error);
    } finally {
      setBookLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setFormMessage({ type: 'error', text: 'Please login first' });
        setFormLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:5000/api/students/register', 
        studentForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setFormMessage({ type: 'success', text: response.data.message });
        setStudentForm({
          firstName: '',
          middleName: '',
          lastName: '',
          educationLevel: '',
          course: '',
          yearLevel: '',
          studentId: '',
          contactNumber: '',
          email: ''
        });
        if (studentTab === 'view') {
          fetchStudents();
        }
      } else {
        setFormMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      setFormMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to register student. Please try again.' 
      });
      console.error('Error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'books', label: 'Books', icon: '📚' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'requests', label: 'Borrow Requests', icon: '📖' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ];

  const statsCards = [
    { 
      title: 'Total Books', 
      value: stats?.totalBooks || 0, 
      change: `${stats?.totalCopies || 0} total copies`,
      icon: '📚',
      colorClass: 'admin-card-blue'
    },
    { 
      title: 'Active Students', 
      value: stats?.totalStudents || 0, 
      change: `${stats?.activeBorrows || 0} currently borrowing`,
      icon: '👥',
      colorClass: 'admin-card-orange'
    },
    { 
      title: 'Pending Requests',  
      value: stats?.pendingRequests || 0, 
      change: `${stats?.overdueCount || 0} overdue books`,
      icon: '⏱️',
      colorClass: 'admin-card-yellow'
    },
    { 
      title: 'Books Borrowed', 
      value: stats?.borrowedCopies || 0, 
      change: `${stats?.availableCopies || 0} available`,
      icon: '✅',
      colorClass: 'admin-card-blue-dark'
    },
  ];

  const getActivityText = (activity) => {
    switch (activity.status) {
      case 'pending':
        return { action: 'New borrow request', item: activity.book?.title || 'Unknown Book' };
      case 'approved':
        return { action: 'Request approved', item: activity.book?.title || 'Unknown Book' };
      case 'denied':
        return { action: 'Request denied', item: activity.book?.title || 'Unknown Book' };
      case 'returned':
        return { action: 'Book returned', item: activity.book?.title || 'Unknown Book' };
      default:
        return { action: 'Activity', item: activity.book?.title || 'Unknown Book' };
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const updatedAt = new Date(date);
    const diffMs = now - updatedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const recentActivity = recentActivityData.map(activity => {
    const { action, item } = getActivityText(activity);
    return {
      action,
      item,
      time: getTimeAgo(activity.updatedAt)
    };
  });

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-loading-content">
          <div className="admin-loading-spinner"></div>
          <p className="admin-loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrapper">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        navItems={navItems}
      />
      
      <main className="admin-main-container">
        <Topbar 
          activeSection={activeSection}
          navItems={navItems}
          adminData={adminData}
          handleLogout={handleLogout}
        />

        <div className="admin-content-container">
          {activeSection === 'dashboard' && (
            <DashboardOverview 
              statsCards={statsCards}
              recentActivity={recentActivity}
              setActiveSection={setActiveSection}
            />
          )}

          {activeSection === 'students' && (
            <StudentSection
              studentTab={studentTab}
              setStudentTab={setStudentTab}
              studentForm={studentForm}
              formMessage={formMessage}
              formLoading={formLoading}
              handleStudentFormChange={handleStudentFormChange}
              handleStudentSubmit={handleStudentSubmit}
              educationLevels={educationLevels}
              students={students}
              studentsLoading={studentsLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              viewingStudent={viewingStudent}              
              handleViewStudent={handleViewStudent}        
              handleCloseStudentView={handleCloseStudentView}
              viewingHistory={viewingHistory}
              handleViewHistory={handleViewHistory}
              handleCloseHistory={handleCloseHistory}
              // 🆕 NEW PROPS for status management
              handleToggleStatus={handleToggleStatus}
              statusUpdateLoading={statusUpdateLoading}
            />
          )}

          {activeSection === 'books' && (
            <BookSection
              bookTab={bookTab}
              setBookTab={setBookTab}
              bookForm={bookForm}
              bookMessage={bookMessage}
              bookLoading={bookLoading}
              handleBookFormChange={handleBookFormChange}
              handleBookSubmit={handleBookSubmit}
              imagePreview={imagePreview}
              handleImageChange={handleImageChange}
              books={books}
              booksLoading={booksLoading}
              bookSearchTerm={bookSearchTerm}
              setBookSearchTerm={setBookSearchTerm}
              handleEditBook={handleEditBook}
              handleDeleteBook={handleDeleteBook}
              editingBook={editingBook}
              editBookForm={editBookForm}
              editImagePreview={editImagePreview}
              handleEditBookFormChange={handleEditBookFormChange}
              handleEditImageChange={handleEditImageChange}
              handleUpdateBook={handleUpdateBook}
              handleCancelEdit={handleCancelEdit}
            />
          )}

          {activeSection === 'requests' && (
            <BorrowRequestsSection />
          )}
           {activeSection === 'books' && (
            < BookSection/>
          )}
          {activeSection === 'reports' && (
            <ReportsSection />
          )}
          
          {activeSection === 'inventory' && <InventorySection />}

          {activeSection !== 'dashboard' && activeSection !== 'students' && activeSection !== 'books' && activeSection !== 'requests' && activeSection !== 'reports' && activeSection !== 'inventory' && (
            <div className="admin-placeholder-section">
              <div className="admin-placeholder-icon">
                {navItems.find(item => item.id === activeSection)?.icon}
              </div>
              <h3 className="admin-placeholder-title">
                {navItems.find(item => item.id === activeSection)?.label} Section
              </h3>
              <p className="admin-placeholder-text">
                This section will contain your {activeSection} management interface.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;