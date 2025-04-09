import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const AdminVerificationDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [verifyingDocument, setVerifyingDocument] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    verified: 0,
    rejected: 0,
    total: 0,
    todayVerified: 0,
    todayRejected: 0
  });
  
  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
  }, [navigate, user]);

  // Fetch documents for verification
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user || user.role !== 'admin') return;
      
      try {
        setLoading(true);
        setError(null);
        
        // This would be an actual API call in production
        // const response = await adminService.getDocumentsForVerification();
        
        // Mock documents data
        const mockDocuments = [
          {
            id: 'doc1',
            userId: 'user1',
            userName: 'John Doe',
            name: 'Passport',
            type: 'passport',
            category: 'identity',
            status: 'pending',
            priority: 'high',
            fileUrl: 'https://example.com/documents/passport.pdf',
            thumbnailUrl: 'https://via.placeholder.com/150x200',
            uploadDate: '2025-03-05T10:15:00Z',
            verificationDate: null,
            verifiedBy: null,
            notes: null
          },
          {
            id: 'doc2',
            userId: 'user2',
            userName: 'Jane Smith',
            name: 'National ID Card',
            type: 'nationalId',
            category: 'identity',
            status: 'pending',
            priority: 'medium',
            fileUrl: 'https://example.com/documents/nationalid.pdf',
            thumbnailUrl: 'https://via.placeholder.com/150x200',
            uploadDate: '2025-03-04T14:30:00Z',
            verificationDate: null,
            verifiedBy: null,
            notes: null
          },
          {
            id: 'doc3',
            userId: 'user3',
            userName: 'Robert Johnson',
            name: 'Degree Certificate',
            type: 'degree',
            category: 'education',
            status: 'pending',
            priority: 'low',
            fileUrl: 'https://example.com/documents/degree.pdf',
            thumbnailUrl: 'https://via.placeholder.com/150x200',
            uploadDate: '2025-03-03T09:45:00Z',
            verificationDate: null,
            verifiedBy: null,
            notes: null
          },
          {
            id: 'doc4',
            userId: 'user4',
            userName: 'Emily Davis',
            name: 'Resume',
            type: 'resume',
            category: 'professional',
            status: 'verified',
            priority: 'medium',
            fileUrl: 'https://example.com/documents/resume.pdf',
            thumbnailUrl: 'https://via.placeholder.com/150x200',
            uploadDate: '2025-03-02T11:20:00Z',
            verificationDate: '2025-03-02T16:45:00Z',
            verifiedBy: 'admin1',
            notes: 'Resume verified successfully.'
          },
          {
            id: 'doc5',
            userId: 'user5',
            userName: 'Michael Wilson',
            name: 'Police Clearance',
            type: 'police',
            category: 'other',
            status: 'rejected',
            priority: 'high',
            fileUrl: 'https://example.com/documents/police.pdf',
            thumbnailUrl: 'https://via.placeholder.com/150x200',
            uploadDate: '2025-03-01T13:10:00Z',
            verificationDate: '2025-03-01T17:30:00Z',
            verifiedBy: 'admin2',
            notes: 'Document is expired. Please upload a current police clearance certificate.'
          },
          {
            id: 'doc6',
            userId: 'user1',
            userName: 'John Doe',
            name: 'Academic Transcript',
            type: 'transcript',
            category: 'education',
            status: 'pending',
            priority: 'medium',
            fileUrl: 'https://example.com/documents/transcript.pdf',
            thumbnailUrl: 'https://via.placeholder.com/150x200',
            uploadDate: '2025-03-06T08:30:00Z',
            verificationDate: null,
            verifiedBy: null,
            notes: null
          },
          {
            id: 'doc7',
            userId: 'user6',
            userName: 'Alice Brown',
            name: 'Medical Certificate',
            type: 'medical',
            category: 'other',
            status: 'pending',
            priority: 'high',
            fileUrl: 'https://example.com/documents/medical.pdf',
            thumbnailUrl: 'https://via.placeholder.com/150x200',
            uploadDate: '2025-03-07T09:15:00Z',
            verificationDate: null,
            verifiedBy: null,
            notes: null
          }
        ];
        
        setDocuments(mockDocuments);
        
        // Calculate stats
        const stats = {
          pending: mockDocuments.filter(doc => doc.status === 'pending').length,
          verified: mockDocuments.filter(doc => doc.status === 'verified').length,
          rejected: mockDocuments.filter(doc => doc.status === 'rejected').length,
          total: mockDocuments.length,
          todayVerified: mockDocuments.filter(doc => 
            doc.status === 'verified' && 
            new Date(doc.verificationDate).toDateString() === new Date().toDateString()
          ).length,
          todayRejected: mockDocuments.filter(doc => 
            doc.status === 'rejected' && 
            new Date(doc.verificationDate).toDateString() === new Date().toDateString()
          ).length
        };
        
        setStats(stats);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load documents. Please try again.');
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [navigate, user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} year${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} month${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} day${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    }
    
    return `${Math.floor(seconds)} second${Math.floor(seconds) === 1 ? '' : 's'} ago`;
  };

  // Get priority badge styling
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle document selection for verification
  const handleSelectDocument = (document) => {
    setCurrentDocument(document);
  };

  // Handle document verification (approve)
  const handleVerifyDocument = async () => {
    if (!currentDocument) return;
    
    try {
      setVerifyingDocument(true);
      
      // This would be an actual API call in production
      // await adminService.verifyDocument(currentDocument.id, { status: 'verified', verifiedBy: user.id });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update documents state
      const updatedDocuments = documents.map(doc => 
        doc.id === currentDocument.id 
          ? {
              ...doc,
              status: 'verified',
              verificationDate: new Date().toISOString(),
              verifiedBy: user.id,
              notes: 'Document verified successfully.'
            }
          : doc
      );
      
      setDocuments(updatedDocuments);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        verified: prev.verified + 1,
        todayVerified: prev.todayVerified + 1
      }));
      
      // Clear current document
      setCurrentDocument(null);
      setVerifyingDocument(false);
    } catch (err) {
      setError(err.message || 'Failed to verify document. Please try again.');
      setVerifyingDocument(false);
    }
  };

  // Handle document rejection
  const handleRejectDocument = async () => {
    if (!currentDocument || !rejectionReason.trim()) return;
    
    try {
      setVerifyingDocument(true);
      
      // This would be an actual API call in production
      // await adminService.verifyDocument(currentDocument.id, { 
      //   status: 'rejected', 
      //   verifiedBy: user.id,
      //   notes: rejectionReason
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update documents state
      const updatedDocuments = documents.map(doc => 
        doc.id === currentDocument.id 
          ? {
              ...doc,
              status: 'rejected',
              verificationDate: new Date().toISOString(),
              verifiedBy: user.id,
              notes: rejectionReason
            }
          : doc
      );
      
      setDocuments(updatedDocuments);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1,
        todayRejected: prev.todayRejected + 1
      }));
      
      // Clear current document and close modal
      setCurrentDocument(null);
      setRejectionReason('');
      setShowRejectionModal(false);
      setVerifyingDocument(false);
    } catch (err) {
      setError(err.message || 'Failed to reject document. Please try again.');
      setVerifyingDocument(false);
    }
  };

  // Filter documents based on active tab and search term
  const filteredDocuments = documents.filter(doc => {
    const matchesTab = activeTab === 'all' || doc.status === activeTab;
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Sort documents by priority and upload date
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    // First sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by upload date (newest first)
    return new Date(b.uploadDate) - new Date(a.uploadDate);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading verification dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Document Verification Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Pending Documents</h2>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          <div className="mt-1 text-xs text-gray-500">
            Out of {stats.total} total documents
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Verified Documents</h2>
          <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
          <div className="mt-1 text-xs text-gray-500">
            {stats.todayVerified} verified today
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Rejected Documents</h2>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          <div className="mt-1 text-xs text-gray-500">
            {stats.todayRejected} rejected today
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Verification Rate</h2>
          <p className="text-3xl font-bold text-blue-600">
            {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
          </p>
          <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
                
                <div className="relative">
                  <input
                    type="text"
                    className="w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Status Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'pending'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'verified'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('verified')}
                >
                  Verified
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'rejected'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('rejected')}
                >
                  Rejected
                </button>
              </div>
            </div>
            
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              {sortedDocuments.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No documents found.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sortedDocuments.map(document => (
                    <div
                      key={document.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        currentDocument && currentDocument.id === document.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectDocument(document)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <img
                            src={document.thumbnailUrl}
                            alt={document.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">{document.name}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(document.priority)}`}>
                              {document.priority.charAt(0).toUpperCase() + document.prio
