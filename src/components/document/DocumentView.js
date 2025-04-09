import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const DocumentView = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [document, setDocument] = useState(null);
  const [relatedDocuments, setRelatedDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Document categories and types mapping
  const documentCategories = {
    identity: 'Identity Documents',
    education: 'Education Documents',
    professional: 'Professional Documents',
    other: 'Other Documents'
  };
  
  const documentTypes = {
    passport: 'Passport',
    nationalId: 'National ID Card',
    birthCertificate: 'Birth Certificate',
    diploma: 'Diploma/Certificate',
    degree: 'Degree Certificate',
    transcript: 'Academic Transcript',
    resume: 'Resume/CV',
    recommendation: 'Recommendation Letter',
    certificate: 'Professional Certificate',
    medical: 'Medical Certificate',
    police: 'Police Clearance',
    other: 'Other Document'
  };

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [navigate, user]);

  // Fetch document data
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!user || !documentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // This would be actual API calls in production
        // const documentData = await documentService.getDocumentById(documentId);
        // const relatedDocs = await documentService.getRelatedDocuments(documentId);
        // const documentApplications = await applicationService.getApplicationsByDocument(documentId);
        
        // Mock document data
        const mockDocument = {
          id: documentId,
          userId: user.id,
          name: 'Passport',
          type: 'passport',
          category: 'identity',
          status: 'verified',
          verificationDate: '2025-02-15T09:30:00Z',
          fileUrl: 'https://example.com/documents/passport.pdf',
          fileSize: '1.5 MB',
          fileType: 'application/pdf',
          thumbnailUrl: 'https://via.placeholder.com/400x500',
          uploadDate: '2025-02-10T14:20:00Z',
          expiryDate: '2030-02-10T00:00:00Z',
          notes: 'Passport verified successfully.',
          verifiedBy: 'admin1',
          rejectionReason: null,
          metadata: {
            pageCount: 4,
            documentNumber: 'KE9876543',
            issueDate: '2020-02-10T00:00:00Z',
            issuingCountry: 'Kenya'
          }
        };
        
        // Mock related documents
        const mockRelatedDocuments = [
          {
            id: 'doc2',
            name: 'National ID Card',
            type: 'nationalId',
            category: 'identity',
            status: 'pending',
            uploadDate: '2025-03-05T10:15:00Z',
            thumbnailUrl: 'https://via.placeholder.com/100x140'
          },
          {
            id: 'doc3',
            name: 'Resume',
            type: 'resume',
            category: 'professional',
            status: 'verified',
            uploadDate: '2025-02-28T09:45:00Z',
            thumbnailUrl: 'https://via.placeholder.com/100x140'
          }
        ];
        
        // Mock applications using this document
        const mockApplications = [
          {
            id: 'app1',
            jobTitle: 'Domestic Helper',
            companyName: 'Al Faisal Household Services',
            location: 'Dubai, UAE',
            status: 'shortlisted',
            applicationDate: '2025-03-10T15:30:00Z'
          },
          {
            id: 'app2',
            jobTitle: 'Security Guard',
            companyName: 'Emirates Security Services',
            location: 'Abu Dhabi, UAE',
            status: 'pending',
            applicationDate: '2025-03-05T09:15:00Z'
          }
        ];
        
        setDocument(mockDocument);
        setRelatedDocuments(mockRelatedDocuments);
        setApplications(mockApplications);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load document. Please try again.');
        setLoading(false);
      }
    };
    
    fetchDocumentData();
  }, [documentId, user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Get document category name
  const getDocumentCategoryName = (categoryId) => {
    return documentCategories[categoryId] || categoryId;
  };

  // Get document type name
  const getDocumentTypeName = (typeId) => {
    return documentTypes[typeId] || typeId;
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

  // Get application status badge
  const getApplicationStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle document delete
  const handleDeleteDocument = async () => {
    if (!document) return;
    
    try {
      setIsDeleting(true);
      
      // This would be an actual API call in production
      // await documentService.deleteDocument(document.id);
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsDeleting(false);
      setShowDeleteModal(false);
      
      // Navigate back to documents page
      navigate('/documents', {
        state: {
          successMessage: `${document.name} was successfully deleted.`
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to delete document. Please try again.');
      setIsDeleting(false);
    }
  };

  // Handle reupload document
  const handleReuploadDocument = () => {
    navigate(`/documents/reupload/${documentId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700">Loading document details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={() => navigate('/documents')}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Document Not Found!</strong>
          <span className="block sm:inline"> The document you're looking for doesn't exist or has been removed.</span>
          <button
            onClick={() => navigate('/documents')}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            View All Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/documents')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Documents
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{document.name}</h1>
          <p className="text-gray-600">{getDocumentTypeName(document.type)} · {getDocumentCategoryName(document.category)}</p>
        </div>
        
        <div className="mt-4 md:mt-0 space-x-2">
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            View Document
          </a>
          
          <button
            onClick={handleReuploadDocument}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Re-upload
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-800">Document Preview</h2>
                <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(document.status)}`}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-100 p-4 rounded-lg flex justify-center mb-4">
                <img
                  src={document.thumbnailUrl}
                  alt={document.name}
                  className="max-h-96 object-contain"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Document Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <dl className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Document Type:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{getDocumentTypeName(document.type)}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Category:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{getDocumentCategoryName(document.category)}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">File Type:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{document.fileType}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">File Size:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{document.fileSize}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Upload Date:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">{formatDate(document.uploadDate)}</dd>
                      </div>
                      {document.expiryDate && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Expiry Date:</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{formatDate(document.expiryDate)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Verification Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <dl className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Status:</dt>
                        <dd className="text-sm text-gray-900 col-span-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(document.status)}`}>
                            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                          </span>
                        </dd>
                      </div>
                      {document.verificationDate && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Verified On:</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{formatDate(document.verificationDate)}</dd>
                        </div>
                      )}
                      {document.verifiedBy && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Verified By:</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{document.verifiedBy}</dd>
                        </div>
                      )}
                      {document.notes && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Notes:</dt>
                          <dd className="text-sm text-gray-900 col-span-2">{document.notes}</dd>
                        </div>
                      )}
                      {document.rejectionReason && (
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">Rejection Reason:</dt>
                          <dd className="text-sm text-red-600 col-span-2">{document.rejectionReason}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {document.metadata && Object.keys(document.metadata).length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Document Metadata</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <dl className="space-y-2">
                          {Object.entries(document.metadata).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-4">
                              <dt className="text-sm font-medium text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</dt>
                              <dd className="text-sm text-gray-900 col-span-2">
                                {key.toLowerCase().includes('date') ? formatDate(value) : value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Related Documents */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Related Documents</h2>
            </div>
            
            <div className="p-4">
              {relatedDocuments.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No related documents found.</p>
              ) : (
                <div className="space-y-4">
                  {relatedDocuments.map(doc => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
   
