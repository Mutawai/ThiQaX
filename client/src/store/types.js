// src/store/types.js
// Add these action types to your existing types file

// Profile
export const FETCH_USER_PROFILE_REQUEST = 'FETCH_USER_PROFILE_REQUEST';
export const FETCH_USER_PROFILE_SUCCESS = 'FETCH_USER_PROFILE_SUCCESS';
export const FETCH_USER_PROFILE_FAILURE = 'FETCH_USER_PROFILE_FAILURE';

// Applications
export const FETCH_APPLICATIONS_REQUEST = 'FETCH_APPLICATIONS_REQUEST';
export const FETCH_APPLICATIONS_SUCCESS = 'FETCH_APPLICATIONS_SUCCESS';
export const FETCH_APPLICATIONS_FAILURE = 'FETCH_APPLICATIONS_FAILURE';

// Documents
export const FETCH_DOCUMENTS_REQUEST = 'FETCH_DOCUMENTS_REQUEST';
export const FETCH_DOCUMENTS_SUCCESS = 'FETCH_DOCUMENTS_SUCCESS';
export const FETCH_DOCUMENTS_FAILURE = 'FETCH_DOCUMENTS_FAILURE';

// Agent Stats
export const FETCH_AGENT_STATS_REQUEST = 'FETCH_AGENT_STATS_REQUEST';
export const FETCH_AGENT_STATS_SUCCESS = 'FETCH_AGENT_STATS_SUCCESS';
export const FETCH_AGENT_STATS_FAILURE = 'FETCH_AGENT_STATS_FAILURE';

// Job Postings
export const FETCH_JOB_POSTINGS_REQUEST = 'FETCH_JOB_POSTINGS_REQUEST';
export const FETCH_JOB_POSTINGS_SUCCESS = 'FETCH_JOB_POSTINGS_SUCCESS';
export const FETCH_JOB_POSTINGS_FAILURE = 'FETCH_JOB_POSTINGS_FAILURE';

// Candidates
export const FETCH_CANDIDATES_REQUEST = 'FETCH_CANDIDATES_REQUEST';
export const FETCH_CANDIDATES_SUCCESS = 'FETCH_CANDIDATES_SUCCESS';
export const FETCH_CANDIDATES_FAILURE = 'FETCH_CANDIDATES_FAILURE';

// System Stats
export const FETCH_SYSTEM_STATS_REQUEST = 'FETCH_SYSTEM_STATS_REQUEST';
export const FETCH_SYSTEM_STATS_SUCCESS = 'FETCH_SYSTEM_STATS_SUCCESS';
export const FETCH_SYSTEM_STATS_FAILURE = 'FETCH_SYSTEM_STATS_FAILURE';

// Pending Verifications
export const FETCH_PENDING_VERIFICATIONS_REQUEST = 'FETCH_PENDING_VERIFICATIONS_REQUEST';
export const FETCH_PENDING_VERIFICATIONS_SUCCESS = 'FETCH_PENDING_VERIFICATIONS_SUCCESS';
export const FETCH_PENDING_VERIFICATIONS_FAILURE = 'FETCH_PENDING_VERIFICATIONS_FAILURE';

// Recent Users
export const FETCH_RECENT_USERS_REQUEST = 'FETCH_RECENT_USERS_REQUEST';
export const FETCH_RECENT_USERS_SUCCESS = 'FETCH_RECENT_USERS_SUCCESS';
export const FETCH_RECENT_USERS_FAILURE = 'FETCH_RECENT_USERS_FAILURE';

// src/store/actions/dashboardActions.js
import { 
  FETCH_USER_PROFILE_REQUEST,
  FETCH_USER_PROFILE_SUCCESS,
  FETCH_USER_PROFILE_FAILURE,
  FETCH_APPLICATIONS_REQUEST,
  FETCH_APPLICATIONS_SUCCESS,
  FETCH_APPLICATIONS_FAILURE,
  FETCH_DOCUMENTS_REQUEST,
  FETCH_DOCUMENTS_SUCCESS,
  FETCH_DOCUMENTS_FAILURE,
  FETCH_AGENT_STATS_REQUEST,
  FETCH_AGENT_STATS_SUCCESS,
  FETCH_AGENT_STATS_FAILURE,
  FETCH_JOB_POSTINGS_REQUEST,
  FETCH_JOB_POSTINGS_SUCCESS,
  FETCH_JOB_POSTINGS_FAILURE,
  FETCH_CANDIDATES_REQUEST,
  FETCH_CANDIDATES_SUCCESS,
  FETCH_CANDIDATES_FAILURE,
  FETCH_SYSTEM_STATS_REQUEST,
  FETCH_SYSTEM_STATS_SUCCESS,
  FETCH_SYSTEM_STATS_FAILURE,
  FETCH_PENDING_VERIFICATIONS_REQUEST,
  FETCH_PENDING_VERIFICATIONS_SUCCESS,
  FETCH_PENDING_VERIFICATIONS_FAILURE,
  FETCH_RECENT_USERS_REQUEST,
  FETCH_RECENT_USERS_SUCCESS,
  FETCH_RECENT_USERS_FAILURE
} from '../types';
import api from '../../services/api';

// Job Seeker Dashboard Actions
export const fetchUserProfile = (userId) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_USER_PROFILE_REQUEST });
    const response = await api.get(`/api/v1/profiles/${userId}`);
    dispatch({
      type: FETCH_USER_PROFILE_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_USER_PROFILE_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch profile'
    });
  }
};

export const fetchApplications = (params) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_APPLICATIONS_REQUEST });
    const response = await api.get('/api/v1/applications', { params });
    dispatch({
      type: FETCH_APPLICATIONS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_APPLICATIONS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch applications'
    });
  }
};

export const fetchDocuments = (params) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_DOCUMENTS_REQUEST });
    const response = await api.get('/api/v1/documents', { params });
    dispatch({
      type: FETCH_DOCUMENTS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_DOCUMENTS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch documents'
    });
  }
};

// Agent Dashboard Actions
export const fetchAgentStats = (agentId) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_AGENT_STATS_REQUEST });
    const response = await api.get(`/api/v1/agents/${agentId}/stats`);
    dispatch({
      type: FETCH_AGENT_STATS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_AGENT_STATS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch agent stats'
    });
  }
};

export const fetchJobPostings = (params) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_JOB_POSTINGS_REQUEST });
    const response = await api.get('/api/v1/jobs', { params });
    dispatch({
      type: FETCH_JOB_POSTINGS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_JOB_POSTINGS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch job postings'
    });
  }
};

export const fetchCandidates = (params) => async (dispatch) => {
  try {
    dispatch({ type: FETCH_CANDIDATES_REQUEST });
    const response = await api.get('/api/v1/agents/candidates', { params });
    dispatch({
      type: FETCH_CANDIDATES_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_CANDIDATES_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch candidates'
    });
  }
};

// Admin Dashboard Actions
export const fetchSystemStats = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_SYSTEM_STATS_REQUEST });
    const response = await api.get('/api/v1/admin/system-stats');
    dispatch({
      type: FETCH_SYSTEM_STATS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_SYSTEM_STATS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch system stats'
    });
  }
};

export const fetchPendingVerifications = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_PENDING_VERIFICATIONS_REQUEST });
    const response = await api.get('/api/v1/admin/pending-verifications');
    dispatch({
      type: FETCH_PENDING_VERIFICATIONS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_PENDING_VERIFICATIONS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch pending verifications'
    });
  }
};

export const fetchRecentUsers = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_RECENT_USERS_REQUEST });
    const response = await api.get('/api/v1/admin/recent-users');
    dispatch({
      type: FETCH_RECENT_USERS_SUCCESS,
      payload: response.data.data
    });
  } catch (error) {
    dispatch({
      type: FETCH_RECENT_USERS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch recent users'
    });
  }
};

// src/store/reducers/dashboardReducers.js
import {
  FETCH_USER_PROFILE_REQUEST,
  FETCH_USER_PROFILE_SUCCESS,
  FETCH_USER_PROFILE_FAILURE,
  FETCH_APPLICATIONS_REQUEST,
  FETCH_APPLICATIONS_SUCCESS,
  FETCH_APPLICATIONS_FAILURE,
  FETCH_DOCUMENTS_REQUEST,
  FETCH_DOCUMENTS_SUCCESS,
  FETCH_DOCUMENTS_FAILURE,
  FETCH_AGENT_STATS_REQUEST,
  FETCH_AGENT_STATS_SUCCESS,
  FETCH_AGENT_STATS_FAILURE,
  FETCH_JOB_POSTINGS_REQUEST,
  FETCH_JOB_POSTINGS_SUCCESS,
  FETCH_JOB_POSTINGS_FAILURE,
  FETCH_CANDIDATES_REQUEST,
  FETCH_CANDIDATES_SUCCESS,
  FETCH_CANDIDATES_FAILURE,
  FETCH_SYSTEM_STATS_REQUEST,
  FETCH_SYSTEM_STATS_SUCCESS,
  FETCH_SYSTEM_STATS_FAILURE,
  FETCH_PENDING_VERIFICATIONS_REQUEST,
  FETCH_PENDING_VERIFICATIONS_SUCCESS,
  FETCH_PENDING_VERIFICATIONS_FAILURE,
  FETCH_RECENT_USERS_REQUEST,
  FETCH_RECENT_USERS_SUCCESS,
  FETCH_RECENT_USERS_FAILURE
} from '../types';

// Profile Reducer
const initialProfileState = {
  profile: null,
  loading: false,
  error: null
};

export const profileReducer = (state = initialProfileState, action) => {
  switch (action.type) {
    case FETCH_USER_PROFILE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_USER_PROFILE_SUCCESS:
      return {
        ...state,
        profile: action.payload,
        loading: false
      };
    case FETCH_USER_PROFILE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Applications Reducer
const initialApplicationsState = {
  applications: [],
  loading: false,
  error: null
};

export const applicationsReducer = (state = initialApplicationsState, action) => {
  switch (action.type) {
    case FETCH_APPLICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_APPLICATIONS_SUCCESS:
      return {
        ...state,
        applications: action.payload,
        loading: false
      };
    case FETCH_APPLICATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Documents Reducer
const initialDocumentsState = {
  documents: [],
  loading: false,
  error: null
};

export const documentsReducer = (state = initialDocumentsState, action) => {
  switch (action.type) {
    case FETCH_DOCUMENTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_DOCUMENTS_SUCCESS:
      return {
        ...state,
        documents: action.payload,
        loading: false
      };
    case FETCH_DOCUMENTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Agent Stats Reducer
const initialAgentStatsState = {
  stats: null,
  loading: false,
  error: null
};

export const agentStatsReducer = (state = initialAgentStatsState, action) => {
  switch (action.type) {
    case FETCH_AGENT_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_AGENT_STATS_SUCCESS:
      return {
        ...state,
        stats: action.payload,
        loading: false
      };
    case FETCH_AGENT_STATS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Job Postings Reducer
const initialJobPostingsState = {
  jobPostings: [],
  loading: false,
  error: null
};

export const jobPostingsReducer = (state = initialJobPostingsState, action) => {
  switch (action.type) {
    case FETCH_JOB_POSTINGS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_JOB_POSTINGS_SUCCESS:
      return {
        ...state,
        jobPostings: action.payload,
        loading: false
      };
    case FETCH_JOB_POSTINGS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Candidates Reducer
const initialCandidatesState = {
  candidates: [],
  loading: false,
  error: null
};

export const candidatesReducer = (state = initialCandidatesState, action) => {
  switch (action.type) {
    case FETCH_CANDIDATES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_CANDIDATES_SUCCESS:
      return {
        ...state,
        candidates: action.payload,
        loading: false
      };
    case FETCH_CANDIDATES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// System Stats Reducer
const initialSystemStatsState = {
  systemStats: null,
  loading: false,
  error: null
};

export const systemStatsReducer = (state = initialSystemStatsState, action) => {
  switch (action.type) {
    case FETCH_SYSTEM_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_SYSTEM_STATS_SUCCESS:
      return {
        ...state,
        systemStats: action.payload,
        loading: false
      };
    case FETCH_SYSTEM_STATS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Pending Verifications Reducer
const initialPendingVerificationsState = {
  pendingVerifications: [],
  loading: false,
  error: null
};

export const pendingVerificationsReducer = (state = initialPendingVerificationsState, action) => {
  switch (action.type) {
    case FETCH_PENDING_VERIFICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_PENDING_VERIFICATIONS_SUCCESS:
      return {
        ...state,
        pendingVerifications: action.payload,
        loading: false
      };
    case FETCH_PENDING_VERIFICATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// Recent Users Reducer
const initialRecentUsersState = {
  recentUsers: [],
  loading: false,
  error: null
};

export const recentUsersReducer = (state = initialRecentUsersState, action) => {
  switch (action.type) {
    case FETCH_RECENT_USERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_RECENT_USERS_SUCCESS:
      return {
        ...state,
        recentUsers: action.payload,
        loading: false
      };
    case FETCH_RECENT_USERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// src/store/reducers/index.js
// Add these to your existing rootReducer
import { combineReducers } from 'redux';
// Import your existing reducers
// import authReducer from './authReducer';

// Import the new dashboard reducers
import {
  profileReducer,
  applicationsReducer,
  documentsReducer,
  agentStatsReducer,
  jobPostingsReducer,
  candidatesReducer,
  systemStatsReducer,
  pendingVerificationsReducer,
  recentUsersReducer
} from './dashboardReducers';

const rootReducer = combineReducers({
  // Include your existing reducers
  // auth: authReducer,
  
  // Add the new dashboard reducers
  profile: profileReducer,
  applications: applicationsReducer,
  documents: documentsReducer,
  agentStats: agentStatsReducer,
  jobPostings: jobPostingsReducer,
  candidates: candidatesReducer,
  systemStats: systemStatsReducer,
  pendingVerifications: pendingVerificationsReducer,
  users: recentUsersReducer
});

export default rootReducer;
