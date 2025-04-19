// client/src/redux/reducers/verificationReducer.js
import { VERIFICATION_TYPES } from '../actions/verificationActions';

const initialState = {
  // Single verification request data
  currentVerification: null,
  
  // List of verification requests
  verifications: [],
  
  // Pagination for verification list
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  
  // Loading states
  loading: false,
  loadingList: false,
  submitting: false,
  
  // Error states
  error: null,
  listError: null,
  submitError: null
};

const verificationReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch single verification
    case VERIFICATION_TYPES.FETCH_VERIFICATION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case VERIFICATION_TYPES.FETCH_VERIFICATION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentVerification: action.payload,
        error: null
      };
    
    case VERIFICATION_TYPES.FETCH_VERIFICATION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    // Fetch verification list
    case VERIFICATION_TYPES.FETCH_VERIFICATIONS_REQUEST:
      return {
        ...state,
        loadingList: true,
        listError: null
      };
    
    case VERIFICATION_TYPES.FETCH_VERIFICATIONS_SUCCESS:
      return {
        ...state,
        loadingList: false,
        verifications: action.payload.data,
        pagination: action.payload.pagination,
        listError: null
      };
    
    case VERIFICATION_TYPES.FETCH_VERIFICATIONS_FAILURE:
      return {
        ...state,
        loadingList: false,
        listError: action.payload
      };
    
    // Update verification
    case VERIFICATION_TYPES.UPDATE_VERIFICATION_REQUEST:
      return {
        ...state,
        submitting: true,
        submitError: null
      };
    
    case VERIFICATION_TYPES.UPDATE_VERIFICATION_SUCCESS:
      return {
        ...state,
        submitting: false,
        currentVerification: action.payload,
        // If the updated verification is in the list, update it there too
        verifications: state.verifications.map(v => 
          v.id === action.payload.id ? action.payload : v
        ),
        submitError: null
      };
    
    case VERIFICATION_TYPES.UPDATE_VERIFICATION_FAILURE:
      return {
        ...state,
        submitting: false,
        submitError: action.payload
      };
    
    // Clear error states
    case VERIFICATION_TYPES.CLEAR_VERIFICATION_ERROR:
      return {
        ...state,
        error: null,
        listError: null,
        submitError: null
      };
    
    // Clear verification data
    case VERIFICATION_TYPES.CLEAR_VERIFICATION_DATA:
      return {
        ...state,
        currentVerification: null
      };
    
    default:
      return state;
  }
};

export default verificationReducer;