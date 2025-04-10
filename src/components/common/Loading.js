// src/components/common/Loading.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Loading component for ThiQaX platform
 * Provides consistent loading indicators across the application
 * 
 * @component
 * @example
 * // Basic usage
 * <Loading />
 * 
 * // With custom text
 * <Loading text="Loading jobs..." />
 * 
 * // With overlay (covers parent component)
 * <Loading overlay />
 * 
 * // Different sizes
 * <Loading size="small" />
 * <Loading size="large" />
 * 
 * // Different types
 * <Loading type="spinner" />
 * <Loading type="dots" />
 * <Loading type="skeleton" />
 * 
 * // With progress (for known progress situations)
 * <Loading progress={75} />
 */
const Loading = ({ 
  text = 'Loading...',
  overlay = false,
  size = 'medium',
  type = 'spinner',
  progress = null,
  transparent = false,
  timeout = 0, // Auto-hide after timeout (0 = no timeout)
  onTimeout = null
}) => {
  const [visible, setVisible] = useState(true);
  const [displayText, setDisplayText] = useState(text);
  const [dots, setDots] = useState('');
  
  // Set timeout to hide loader if specified
  useEffect(() => {
    let timer;
    if (timeout > 0) {
      timer = setTimeout(() => {
        setVisible(false);
        if (onTimeout) onTimeout();
      }, timeout);
    }
    
    // Add dots animation if using the dots type
    let dotsInterval;
    if (type === 'dots' && visible) {
      dotsInterval = setInterval(() => {
        setDots(prev => prev.length < 3 ? prev + '.' : '');
      }, 500);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
      if (dotsInterval) clearInterval(dotsInterval);
    };
  }, [timeout, onTimeout, type, visible]);
  
  // Update text when dots change
  useEffect(() => {
    if (type === 'dots') {
      setDisplayText(text.endsWith('...') ? text.slice(0, -3) + dots : text + dots);
    } else {
      setDisplayText(text);
    }
  }, [dots, text, type]);
  
  // If not visible, don't render
  if (!visible) return null;
  
  // Generate classNames based on props
  const containerClassName = `
    loading-container
    ${overlay ? 'loading-overlay' : ''}
    ${transparent ? 'loading-transparent' : ''}
    loading-${size}
  `.trim();
  
  // Render appropriate loading indicator based on type
  const renderLoadingIndicator = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="loading-spinner" data-testid="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
        );
      
      case 'dots':
        return (
          <div className="loading-text" data-testid="loading-dots">
            {displayText}
          </div>
        );
      
      case 'skeleton':
        return (
          <div className="loading-skeleton" data-testid="loading-skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        );
        
      case 'progress':
        return (
          <div className="loading-progress" data-testid="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress || 0}%` }}
              ></div>
            </div>
            <div className="progress-text">{progress || 0}%</div>
          </div>
        );
        
      default:
        return (
          <div className="loading-spinner" data-testid="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
        );
    }
  };
  
  return (
    <div className={containerClassName} data-testid="loading-container">
      {renderLoadingIndicator()}
      {type !== 'dots' && text && (
        <div className="loading-text" data-testid="loading-text">
          {displayText}
        </div>
      )}
    </div>
  );
};

Loading.propTypes = {
  /** Text to display under the loading indicator */
  text: PropTypes.string,
  /** Whether to show as an overlay over parent element */
  overlay: PropTypes.bool,
  /** Size of the loading indicator (small, medium, large) */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Type of loading indicator to display */
  type: PropTypes.oneOf(['spinner', 'dots', 'skeleton', 'progress']),
  /** Progress percentage (0-100) for progress type */
  progress: PropTypes.number,
  /** Whether to have a transparent background */
  transparent: PropTypes.bool,
  /** Timeout in ms after which to hide the loader (0 = no timeout) */
  timeout: PropTypes.number,
  /** Callback function when timeout is reached */
  onTimeout: PropTypes.func
};

export default Loading;

// CSS Module for Loading Component - src/components/common/Loading.module.css
/*
Loading component styles
This file should be imported alongside the Loading component
*/

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}

.loading-transparent {
  background-color: transparent;
}

/* Sizes */
.loading-small .loading-spinner {
  width: 24px;
  height: 24px;
}

.loading-small .loading-text {
  font-size: 0.8rem;
}

.loading-medium .loading-spinner {
  width: 48px;
  height: 48px;
}

.loading-medium .loading-text {
  font-size: 1rem;
}

.loading-large .loading-spinner {
  width: 72px;
  height: 72px;
}

.loading-large .loading-text {
  font-size: 1.2rem;
}

/* Spinner Animation */
.loading-spinner {
  position: relative;
  display: inline-block;
}

.spinner-ring {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid #e0e0e0;
  border-radius: 50%;
  border-top-color: #3a86ff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Text Styling */
.loading-text {
  margin-top: 1rem;
  color: #666;
  text-align: center;
  font-weight: 500;
}

/* Skeleton Loading */
.loading-skeleton {
  width: 100%;
  max-width: 400px;
}

.skeleton-line {
  height: 20px;
  margin-bottom: 8px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-line:nth-child(2) {
  width: 75%;
}

.skeleton-line:nth-child(3) {
  width: 50%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Progress Bar */
.loading-progress {
  width: 100%;
  max-width: 300px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #3a86ff;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.8rem;
  color: #666;
}

// Example Usage
// Here are some examples of how to use the Loading component in different scenarios

// src/components/jobs/JobList.js - Basic usage
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loading from '../common/Loading';
import JobItem from './JobItem';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('/api/jobs');
        setJobs(response.data.jobs);
        setLoading(false);
      } catch (err) {
        setError('Failed to load jobs. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return <Loading text="Loading job listings..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="job-list">
      {jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        jobs.map(job => <JobItem key={job._id} job={job} />)
      )}
    </div>
  );
};

export default JobList;

// src/components/documents/DocumentUpload.js - Progress indicator usage
import React, { useState } from 'react';
import axios from 'axios';
import Loading from '../common/Loading';

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      await axios.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setSuccess(true);
      setUploading(false);
      setFile(null);
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <h3>Upload Document</h3>
      
      <input 
        type="file" 
        onChange={handleFileChange} 
        disabled={uploading} 
        data-testid="document-file-input"
      />
      
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        data-testid="submit-document-button"
      >
        Upload
      </button>
      
      {uploading && (
        <div className="upload-progress">
          <Loading 
            type="progress" 
            progress={uploadProgress} 
            text="Uploading document..." 
          />
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {success && (
        <div className="success-message" data-testid="document-upload-success">
          Document uploaded successfully!
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;

// src/components/auth/Login.js - Overlay usage
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../common/Loading';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-form">
      <h2>Login to ThiQaX</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="email-input"
          />
          {!email && <span className="error-text" data-testid="email-error">Email is required</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="password-input"
          />
          {!password && <span className="error-text" data-testid="password-error">Password is required</span>}
        </div>
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
          data-testid="login-button"
        >
          Login
        </button>
        
        {error && <div className="error-message" data-testid="login-error">{error}</div>}
      </form>
      
      {loading && <Loading overlay text="Logging in..." />}
    </div>
  );
};

export default Login;
