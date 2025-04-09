import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const JobListing = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Define job categories
  const jobCategories = [
    { value: 'domestic', label: 'Domestic Work' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'construction', label: 'Construction' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'driving', label: 'Driving/Transportation' },
    { value: 'security', label: 'Security' },
    { value: 'other', label: 'Other' }
  ];

  // Define locations (Middle East countries)
  const locations = [
    { value: 'uae', label: 'United Arab Emirates' },
    { value: 'saudi', label: 'Saudi Arabia' },
    { value: 'qatar', label: 'Qatar' },
    { value: 'kuwait', label: 'Kuwait' },
    { value: 'bahrain', label: 'Bahrain' },
    { value: 'oman', label: 'Oman' },
    { value: 'other', label: 'Other' }
  ];

  // Search form validation schema
  const searchValidationSchema = Yup.object({
    keyword: Yup.string(),
    category: Yup.string(),
    location: Yup.string(),
    salaryMin: Yup.number()
      .nullable()
      .min(0, 'Minimum salary must be at least 0')
      .typeError('Salary must be a number'),
    salaryMax: Yup.number()
      .nullable()
      .min(0, 'Maximum salary must be at least 0')
      .test(
        'salaryMaxGreaterThanMin',
        'Maximum salary must be greater than minimum salary',
        function (value) {
          const { salaryMin } = this.parent;
          return !salaryMin || !value || value >= salaryMin;
        }
      )
      .typeError('Salary must be a number')
  });

  // Formik setup for search
  const searchFormik = useFormik({
    initialValues: {
      keyword: '',
      category: '',
      location: '',
      salaryMin: '',
      salaryMax: ''
    },
    validationSchema: searchValidationSchema,
    onSubmit: (values) => {
      // Convert empty strings to null for numeric fields
      const formattedValues = {
        ...values,
        salaryMin: values.salaryMin === '' ? null : Number(values.salaryMin),
        salaryMax: values.salaryMax === '' ? null : Number(values.salaryMax),
      };
      
      // Reset to page 1 when search criteria change
      setCurrentPage(1);
      fetchJobs(formattedValues, 1);
    }
  });

  // Fetch jobs from API
  const fetchJobs = async (filters = {}, page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters for API call
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', '10'); // Jobs per page
      
      if (filters.keyword) queryParams.append('keyword', filters.keyword);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.salaryMin) queryParams.append('salaryMin', filters.salaryMin.toString());
      if (filters.salaryMax) queryParams.append('salaryMax', filters.salaryMax.toString());
      
      // Call API to get jobs
      // This is a placeholder and should be replaced with actual API call
      // const response = await jobService.getJobs(queryParams);
      
      // Mock response for development
      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Domestic Helper',
            company: 'Al Faisal Household Services',
            location: 'Dubai, UAE',
            category: 'domestic',
            salary: '500-700',
            currency: 'USD',
            contractDuration: '2 years',
            isVerified: true,
            createdAt: '2025-02-15T09:30:00Z'
          },
          {
            id: '2',
            title: 'Construction Worker',
            company: 'Qatar Building Corporation',
            location: 'Doha, Qatar',
            category: 'construction',
            salary: '800-1000',
            currency: 'USD',
            contractDuration: '3 years',
            isVerified: true,
            createdAt: '2025-03-10T11:45:00Z'
          },
          {
            id: '3',
            title: 'Hospital Cleaner',
            company: 'Saudi Medical Services',
            location: 'Riyadh, Saudi Arabia',
            category: 'healthcare',
            salary: '600-800',
            currency: 'USD',
            contractDuration: '2 years',
            isVerified: false,
            createdAt: '2025-03-05T14:20:00Z'
          }
        ],
        pagination: {
          currentPage: page,
          totalPages: 3,
          totalItems: 25
        }
      };
      
      setJobs(mockResponse.data);
      setTotalPages(mockResponse.pagination.totalPages);
      setCurrentPage(mockResponse.pagination.currentPage);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchJobs(searchFormik.values, page);
  };

  // Handle job click
  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Render job card
  const renderJobCard = (job) => {
    return (
      <div 
        key={job.id}
        className="p-4 mb-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleJobClick(job.id)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
            <p className="text-gray-600">{job.company}</p>
          </div>
          {job.isVerified && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              Verified
            </span>
          )}
        </div>
        
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            {job.location}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {job.salary} {job.currency}/month
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            {job.contractDuration}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Posted: {formatDate(job.createdAt)}
          </div>
        </div>
      </div>
    );
  };

  // Render pagination controls
  const renderPagination = () => {
    return (
      <div className="flex justify-center mt-6">
        <nav className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {[...Array(totalPages).keys()].map((page) => (
            <button
              key={page + 1}
              onClick={() => handlePageChange(page + 1)}
              className={`px-3 py-2 border border-gray-300 ${
                currentPage === page + 1
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              } text-sm font-medium`}
            >
              {page + 1}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Find Jobs</h1>
      
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={searchFormik.handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">Keyword</label>
              <input
                id="keyword"
                name="keyword"
                type="text"
                placeholder="Job title or skills"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                {...searchFormik.getFieldProps('keyword')}
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="category"
                name="category"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                {...searchFormik.getFieldProps('category')}
              >
                <option value="">All Categories</option>
                {jobCategories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
              <select
                id="location"
                name="location"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                {...searchFormik.getFieldProps('location')}
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">Minimum Salary (USD)</label>
              <input
                id="salaryMin"
                name="salaryMin"
                type="text"
                placeholder="e.g., 500"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  searchFormik.touched.salaryMin && searchFormik.errors.salaryMin
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                {...searchFormik.getFieldProps('salaryMin')}
              />
              {searchFormik.touched.salaryMin && searchFormik.errors.salaryMin && (
                <p className="mt-1 text-sm text-red-600">{searchFormik.errors.salaryMin}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">Maximum Salary (USD)</label>
              <input
                id="salaryMax"
                name="salaryMax"
                type="text"
                placeholder="e.g., 1500"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  searchFormik.touched.salaryMax && searchFormik.errors.salaryMax
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                {...searchFormik.getFieldProps('salaryMax')}
              />
              {searchFormik.touched.salaryMax && searchFormik.errors.salaryMax && (
                <p className="mt-1 text-sm text-red-600">{searchFormik.errors.salaryMax}</p>
              )}
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Results */}
      <div className="bg-white rounded-lg shadow-md p-4">
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {loading ? 'Loading results...' : `${jobs.length} Jobs Found`}
          </h2>
          
          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-sm text-gray-600">Sort by:</label>
            <select
              id="sort"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              onChange={(e) => {
                // Handle sorting logic here
                console.log('Sort by:', e.target.value);
              }}
            >
              <option value="newest">Newest</option>
              <option value="salary_high">Salary (High to Low)</option>
              <option value="salary_low">Salary (Low to High)</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No jobs found matching your criteria.</p>
            <button
              onClick={() => {
                searchFormik.resetForm();
                fetchJobs({}, 1);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            {jobs.map(job => renderJobCard(job))}
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobListing;
