// src/redux/actions/documentActions.js
import axios from 'axios';
import {
  GET_DOCUMENTS_REQUEST,
  GET_DOCUMENTS_SUCCESS,
  GET_DOCUMENTS_FAILURE,
  UPLOAD_DOCUMENT_REQUEST,
  UPLOAD_DOCUMENT_SUCCESS,
  UPLOAD_DOCUMENT_FAILURE,
  DELETE_DOCUMENT_REQUEST,
  DELETE_DOCUMENT_SUCCESS,
  DELETE_DOCUMENT_FAILURE,
  GET_DOCUMENT_REQUEST,
  GET_DOCUMENT_SUCCESS,
  GET_DOCUMENT_FAILURE,
  UPDATE_DOCUMENT_STATUS_REQUEST,
  UPDATE_DOCUMENT_STATUS_SUCCESS,
  UPDATE_DOCUMENT_STATUS_FAILURE,
  LINK_DOCUMENTS_REQUEST,
  LINK_DOCUMENTS_SUCCESS,
  LINK_DOCUMENTS_FAILURE,
  CHECK_DOCUMENT_EXPIRY_REQUEST,
  CHECK_DOCUMENT_EXPIRY_SUCCESS,
  CHECK_DOCUMENT_EXPIRY_FAILURE,
  CLEAR_DOCUMENT_ERRORS
} from '../constants/documentConstants';
import { API_BASE_URL } from '../../config';

// Get all documents for the current user
export const getDocuments = () => async (dispatch, getState) => {
  try {
    dispatch({ type: GET_DOCUMENTS_REQUEST });
    
    const { auth: { token } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const { data } = await axios.get(`${API_BASE_URL}/documents`, config);
    
    dispatch({
      type: GET_DOCUMENTS_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: GET_DOCUMENTS_FAILURE,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
  }
};

// Get a single document by ID
export const getDocument = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: GET_DOCUMENT_REQUEST });
    
    const { auth: { token } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const { data } = await axios.get(`${API_BASE_URL}/documents/${id}`, config);
    
    dispatch({
      type: GET_DOCUMENT_SUCCESS,
      payload: data.data
    });
    
    return data.data;
  } catch (error) {
    dispatch({
      type: GET_DOCUMENT_FAILURE,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
    throw error;
  }
};

// Upload a new document
export const uploadDocument = (formData) => async (dispatch, getState) => {
  try {
    dispatch({ type: UPLOAD_DOCUMENT_REQUEST });
    
    const { auth: { token } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    };
    
    const { data } = await axios.post(`${API_BASE_URL}/documents`, formData, config);
    
    dispatch({
      type: UPLOAD_DOCUMENT_SUCCESS,
      payload: data.data
    });
    
    return data.data;
  } catch (error) {
    dispatch({
      type: UPLOAD_DOCUMENT_FAILURE,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
    throw error;
  }
};

// Delete a document
export const deleteDocument = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: DELETE_DOCUMENT_REQUEST });
    
    const { auth: { token } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    await axios.delete(`${API_BASE_URL}/documents/${id}`, config);
    
    dispatch({
      type: DELETE_DOCUMENT_SUCCESS,
      payload: id
    });
  } catch (error) {
    dispatch({
      type: DELETE_DOCUMENT_FAILURE,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
  }
};

// Update document verification status
export const updateDocumentStatus = (id, statusData) => async (dispatch, getState) => {
  try {
    dispatch({ type: UPDATE_DOCUMENT_STATUS_REQUEST });
    
    const { auth: { token } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };
    
    const { data } = await axios.put(
      `${API_BASE_URL}/integrations/documents/${id}/verify`, 
      statusData, 
      config
    );
    
    dispatch({
      type: UPDATE_DOCUMENT_STATUS_SUCCESS,
      payload: data.data
    });
    
    return data.data;
  } catch (error) {
    dispatch({
      type: UPDATE_DOCUMENT_STATUS_FAILURE,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
    throw error;
  }
};

// Link documents to an application
export const linkDocumentsToApplication = (applicationId, documentIds) => async (dispatch, getState) => {
  try {
    dispatch({ type: LINK_DOCUMENTS_REQUEST });
    
    const { auth: { token } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };
    
    const { data } = await axios.post(
      `${API_BASE_URL}/integrations/documents/link`,
      { applicationId, documentIds },
      config
    );
    
    dispatch({
      type: LINK_DOCUMENTS_SUCCESS,
      payload: data.data
    });
    
    return data.data;
  } catch (error) {
    dispatch({
      type: LINK_DOCUMENTS_FAILURE,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
    throw error;
  }
};

// Check for documents expiring soon
export const checkDocumentExpiry = () => async (dispatch, getState) => {
  try {
    dispatch({ type: CHECK_DOCUMENT_EXPIRY_REQUEST });
    
    const { auth: { token } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    const { data } = await axios.get(
      `${API_BASE_URL}/integrations/documents/check-expiration`,
      config
    );
    
    dispatch({
      type: CHECK_DOCUMENT_EXPIRY_SUCCESS,
      payload: data.data
    });
    
    return data.data;
  } catch (error) {
    dispatch({
      type: CHECK_DOCUMENT_EXPIRY_FAILURE,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
    throw error;
  }
};

// Clear document errors
export const clearDocumentErrors = () => (dispatch) => {
  dispatch({ type: CLEAR_DOCUMENT_ERRORS });
};
