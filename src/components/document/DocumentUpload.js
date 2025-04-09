import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Document type categories
  const documentCategories = [
    {
      id: 'identity',
      name: 'Identity Documents',
      types: [
        { id: 'passport', name: 'Passport' },
        { id: 'nationalId', name: 'National ID Card' },
        { id: 'birthCertificate', name: 'Birth Certificate' }
      ]
    },
    {
      id: 'education',
      name: 'Education Documents',
      types: [
        { id: 'diploma', name: 'Diploma/Certificate' },
        { id: 'degree', name: 'Degree Certificate' },
        { id: 'transcript', name: 'Academic Transcript' }
      ]
    },
    {
      id: 'professional',
      name: 'Professional Documents',
      types: [
        { id: 'resume', name: 'Resume/CV' },
        { id: 'recommendation', name: 'Recommendation Letter' },
        { id: 'certificate', name: 'Professional Certificate' }
      ]
    },
    {
      id: 'other',
      name: 'Other Documents',
      types: [
        { id: 'medical', name: 'Medical Certificate' },
        { id: 'police', name: 'Police Clearance' },
        { id: 'other', name: 'Other Document' }
      ]
    }
  ];

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login?returnUrl=/documents');
      return;
    }
  }, [navigate, user]);

  // Fetch user's documents
  useEffect(() => {
    const fetchUserDocuments = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // This would be an actual API call in production
        // const response = await documentService.getUserDocuments(user.id);
        
        // Mock documents data
        const mockDocuments = [
          {
            id: 'doc1',
            userId: user.id,
            name: 'Passport',
            type: 'passport',
            category: 'identity',
            status: 'verified',
            verificationDate: '2025-02-15T09:30:00Z',
            fileUrl: 'https://example.com/documents/passport.pdf',
            thumbnailUrl: 'https://via.placeholder.com/100x140',
            uploadDate: '2025-02-10T14:20:00Z',
            expiryDate: '2030-02-10T00:00:00Z',
            notes: 'Passport verified successfully.'
          },
          {
            id: 'doc2',
            userId: user.id,
            name: 'National ID Card',
            type: 'nationalId',
            category: 'identity',
            status: 'pending',
            verificationDate: null,
            fileUrl: 'https://example.com/documents/nationalid.pdf',
            thumbnailUrl: 'https://via.placeholder.com/100x140',
            uploadDate: '2025-03-05T10:15:00Z',
            expiryDate: null,
            notes: null
          },
          {
            id: 'doc3',
            userId: user.id,
            name: 'Bachelor\'s Degree',
            type: 'degree',
            category: 'education',
            status: 'verified',
            verificationDate: '2025-02-20T11:45:00Z',
            fileUrl: 'https://example.com/documents/degree.pdf',
            thumbnailUrl: 'https://via.placeholder.com/100x140',
            uploadDate: '2025-02-18T13:30:00Z',
            expiryDate: null,
            notes: 'Degree certificate verified.'
          },
          {
            id: 'doc4',
            userId: user.id,
            name: 'Resume',
            type: 'resume',
            category: 'professional',
            status: 'rejected',
            verificationDate: '2025-03-01T16:20:00Z',
            fileUrl: 'https://example.com/documents/resume.pdf',
            thumbnailUrl: 'https://via.placeholder.com/100x140',
            uploadDate: '2025-02-28T09:45:00Z',
            expiryDate: null,
            notes: 'Resume missing required information. Please update and resubmit.'
          }
        ];
        
        setDocuments(mockDocuments);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load documents. Please try again.');
        setLoading(false);
      }
    };
    
    fetchUserDocuments();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Get document category name
  const getDocumentCategoryName = (categoryId) => {
    const category = documentCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Other';
  };

  // Get document type name
  const getDocumentTypeName = (categoryId, typeId) => {
    const category = documentCategories.find(cat => cat.id === categoryId);
    if (!category) return typeId;
    
    const type = category.types.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };

  // Get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle document file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (categoryId, typeId) => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    const docTypeName = getDocumentTypeName(categoryId, typeId);
    
    try {
      setUploadingDoc({ categoryId, typeId });
      setError(null);
      setUploadProgress(0);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.id);
      formData.append('category', categoryId);
      formData.append('type', typeId);
      formData.append('name', docTypeName);
      
      // This would be an actual API call in production with progress tracking
      // const response = await documentService.uploadDocument(formData, progressEvent => {
      //   const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      //   setUploadProgress(progress);
      // });
      
      // Simulate API call with progress updates
      await new Promise(resolve => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, 300);
      });
      
      // Simulate new document creation
      const newDocument = {
        id: `doc${Date.now()}`,
        userId: user.id,
        name: docTypeName,
        type: typeId,
        category: categoryId,
        status: 'pending',
        verificationDate: null,
        fileUrl: URL.createObjectURL(selectedFile),
        thumbnailUrl: 'https://via.placeholder.com/100x140',
        uploadDate: new Date().toISOString(),
        expiryDate: null,
        notes: null
      };
      
      // Update documents list
      setDocuments([...documents, newDocument]);
      
      // Reset form
      setSelectedFile(null);
      setUploadingDoc(null);
      setUploadProgress(0);
      
      // Show success message
      setSuccessMessage(`${docTypeName} uploaded successfully. It will be verified by our team.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Reset file input
      const fileInput = document.getElementById('document-file');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.message || 'Failed to upload document. Please try again.');
      setUploadingDoc(null);
      setUploadProgress(0);
    }
  };

  // Handle document view
  const handleViewDocument = (documentId) => {
    navigate(`/documents/${documentId}`);
  };

  // Handle document delete
  const handleDeleteDocument = async (documentId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    try {
      // This would be an actual API call in production
      // await documentService.deleteDocument(documentId);
      
      // Update documents list
      setDocuments(documents.filter(doc => doc.id !== documentId));
      
      // Show success message
      setSuccessMessage('Document deleted successfully.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError(err.message || 'Failed to delete document. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">
            {documents.filter(doc => doc.status === 'verified').length} of {documents.length} Verified
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${documents.length ? (documents.filter(doc => doc.status === 'verified').length / documents.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}
      
      {/* Document Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload New Document</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="document-category" className="block text-sm font-medium text-gray-700 mb-2">
              1. Select Document Category
            </label>
            <select
              id="document-category"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => {
                const select = document.getElementById('document-type');
                
                if (select) {
                  // Clear previous options
                  select.innerHTML = '<option value="">Select document type</option>';
                  
                  // Get selected category
                  const categoryId = e.target.value;
                  if (!categoryId) return;
                  
                  // Find category
                  const category = documentCategories.find(cat => cat.id === categoryId);
                  if (!category) return;
                  
                  // Add options for each type in the category
                  category.types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.name;
                    select.appendChild(option);
                  });
                }
              }}
            >
              <option value="">Select document category</option>
              {documentCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-2">
              2. Select Document Type
            </label>
            <select
              id="document-type"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select document type</option>
              {/* Options will be populated dynamically */}
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <label htmlFor="document-file" className="block text-sm font-medium text-gray-700 mb-2">
            3. Upload Document File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="document-file"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="document-file"
                    name="document-file"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, DOC, DOCX, JPG or PNG up to 10MB
              </p>
              {selectedFile && (
                <p className="text-sm text-green-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => {
              const categorySelect = document.getElementById('document-category');
              const typeSelect = document.getElementById('document-type');
              
              if (!categorySelect.value) {
                setError('Please select a document category');
                return;
              }
              
              if (!typeSelect.value) {
                setError('Please select a document type');
                return;
              }
              
              if (!selectedFile) {
                setError('Please select a file to upload');
                return;
              }
              
              handleDocumentUpload(categorySelect.value, typeSelect.value);
            }}
            disabled={!!uploadingDoc}
          >
            {uploadingDoc ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading... {uploadProgress}%
              </span>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </div>
      
      {/* Uploaded Documents */}
      {documentCategories.map(category => {
        const categoryDocs = documents.filter(doc => doc.category === category.id);
        
        if (categoryDocs.length === 0) return null;
        
        return (
          <div key={category.id} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{category.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryDocs.map(document => (
                <div
                  key={document.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewDocument(document.id)}
                >
                  <div className="flex p-4">
                    <div className="flex-shrink-0">
                      <img
                        src={document.thumbnailUrl}
                        alt={document.name}
                        className="h-20 w-16 object-cover rounded"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{document.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(document.status)}`}>
                          {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Uploaded: {formatDate(document.uploadDate)}
                      </p>
       
