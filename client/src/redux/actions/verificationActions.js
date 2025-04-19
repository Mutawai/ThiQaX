// client/src/redux/actions/verificationActions.js
import { api } from '../../services/api';

// Action Types
export const VERIFICATION_TYPES = {
  FETCH_VERIFICATION_REQUEST: 'verification/FETCH_VERIFICATION_REQUEST',
  FETCH_VERIFICATION_SUCCESS: 'verification/FETCH_VERIFICATION_SUCCESS',
  FETCH_VERIFICATION_FAILURE: 'verification/FETCH_VERIFICATION_FAILURE',
  
  FETCH_VERIFICATIONS_REQUEST: 'verification/FETCH_VERIFICATIONS_REQUEST',
  FETCH_VERIFICATIONS_SUCCESS: 'verification/FETCH_VERIFICATIONS_SUCCESS',
  FETCH_VERIFICATIONS_FAILURE: 'verification/FETCH_VERIFICATIONS_FAILURE',
  
  UPDATE_VERIFICATION_REQUEST: 'verification/UPDATE_VERIFICATION_REQUEST',
  UPDATE_VERIFICATION_SUCCESS: 'verification/UPDATE_VERIFICATION_SUCCESS',
  UPDATE_VERIFICATION_FAILURE: 'verification/UPDATE_VERIFICATION_FAILURE',
  
  CLEAR_VERIFICATION_ERROR: 'verification/CLEAR_VERIFICATION_ERROR',
  CLEAR_VERIFICATION_DATA: 'verification/CLEAR_VERIFICATION_DATA'
};

// Action Creators
const fetchVerificationRequest = () => ({
  type: VERIFICATION_TYPES.FETCH_VERIFICATION_REQUEST
});

const fetchVerificationSuccess = (data) => ({
  type: VERIFICATION_TYPES.FETCH_VERIFICATION_SUCCESS,
  payload: data
});

const fetchVerificationFailure = (error) => ({
  type: VERIFICATION_TYPES.FETCH_VERIFICATION_FAILURE,
  payload: error
});

const fetchVerificationsRequest = () => ({
  type: VERIFICATION_TYPES.FETCH_VERIFICATIONS_REQUEST
});

const fetchVerificationsSuccess = (data, pagination) => ({
  type: VERIFICATION_TYPES.FETCH_VERIFICATIONS_SUCCESS,
  payload: { data, pagination }
});

const fetchVerificationsFailure = (error) => ({
  type: VERIFICATION_TYPES.FETCH_VERIFICATIONS_FAILURE,
  payload: error
});

const updateVerificationRequest = () => ({
  type: VERIFICATION_TYPES.UPDATE_VERIFICATION_REQUEST
});

const updateVerificationSuccess = (data) => ({
  type: VERIFICATION_TYPES.UPDATE_VERIFICATION_SUCCESS,
  payload: data
});

const updateVerificationFailure = (error) => ({
  type: VERIFICATION_TYPES.UPDATE_VERIFICATION_FAILURE,
  payload: error
});

export const clearVerificationError = () => ({
  type: VERIFICATION_TYPES.CLEAR_VERIFICATION_ERROR
});

export const clearVerificationData = () => ({
  type: VERIFICATION_TYPES.CLEAR_VERIFICATION_DATA
});

// Thunk Actions
/**
 * Fetch a single verification request by ID
 * @param {string} id - The verification request ID
 * @returns {Function} - Redux thunk function
 */
export const fetchVerificationById = (id) => async (dispatch) => {
  dispatch(fetchVerificationRequest());
  
  try {
    const response = await api.get(`/admin/verifications/${id}`);
    dispatch(fetchVerificationSuccess(response.data.data));
    return response.data.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || 'Failed to fetch verification request';
    dispatch(fetchVerificationFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

/**
 * Fetch a paginated list of verification requests
 * @param {Object} params - Query parameters for pagination and filtering
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.limit - Number of items per page
 * @param {string} params.status - Filter by status (pending, approved, rejected)
 * @param {string} params.search - Search term for user name or document number
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.order - Sort order (asc, desc)
 * @returns {Function} - Redux thunk function
 */
export const fetchVerifications = (params = {}) => async (dispatch) => {
  dispatch(fetchVerificationsRequest());
  
  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 10,
    ...(params.status && { status: params.status }),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.order && { order: params.order })
  }).toString();
  
  try {
    const response = await api.get(`/admin/verifications?${queryParams}`);
    
    const pagination = {
      page: response.data.meta.pagination.page,
      limit: response.data.meta.pagination.limit,
      total: response.data.meta.pagination.total,
      pages: response.data.meta.pagination.pages
    };
    
    dispatch(fetchVerificationsSuccess(response.data.data, pagination));
    return { data: response.data.data, pagination };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || 'Failed to fetch verification requests';
    dispatch(fetchVerificationsFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

/**
 * Update a verification request status
 * @param {string} id - The verification request ID
 * @param {Object} updateData - The data to update
 * @param {string} updateData.status - New status (approved or rejected)
 * @param {string} [updateData.rejectionReason] - Reason for rejection (required if status is rejected)
 * @param {string} [updateData.notes] - Internal notes for the verification
 * @returns {Function} - Redux thunk function
 */
export const verifyDocument = (id, updateData) => async (dispatch) => {
  dispatch(updateVerificationRequest());
  
  try {
    const response = await api.patch(`/admin/verifications/${id}`, updateData);
    dispatch(updateVerificationSuccess(response.data.data));
    
    // Return the data to the component
    return response.data.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || 'Failed to update verification status';
    dispatch(updateVerificationFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

/**
 * Assign a verification request to the current admin
 * @param {string} id - The verification request ID
 * @returns {Function} - Redux thunk function
 */
export const assignVerificationToSelf = (id) => async (dispatch) => {
  dispatch(updateVerificationRequest());
  
  try {
    const response = await api.post(`/admin/verifications/${id}/assign`);
    dispatch(updateVerificationSuccess(response.data.data));
    return response.data.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || 'Failed to assign verification request';
    dispatch(updateVerificationFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

/**
 * Request additional documents from the user
 * @param {string} id - The verification request ID
 * @param {Object} requestData - Data for the additional documents request
 * @param {string} requestData.reason - Reason for requesting additional documents
 * @param {string} requestData.message - Message to the user
 * @param {Array<string>} requestData.documentTypes - Types of documents requested
 * @returns {Function} - Redux thunk function
 */
export const requestAdditionalDocuments = (id, requestData) => async (dispatch) => {
  dispatch(updateVerificationRequest());
  
  try {
    const response = await api.post(`/admin/verifications/${id}/request-documents`, requestData);
    dispatch(updateVerificationSuccess(response.data.data));
    return response.data.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || 'Failed to request additional documents';
    dispatch(updateVerificationFailure(errorMessage));
    throw new Error(errorMessage);
  }
};