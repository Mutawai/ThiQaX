// src/store/actions/documentActions.js

import axios from 'axios';
import {
  DOCUMENT_UPLOAD_REQUEST,
  DOCUMENT_UPLOAD_SUCCESS,
  DOCUMENT_UPLOAD_FAIL,
  DOCUMENT_LIST_REQUEST,
  DOCUMENT_LIST_SUCCESS,
  DOCUMENT_LIST_FAIL,
  DOCUMENT_DELETE_REQUEST,
  DOCUMENT_DELETE_SUCCESS,
  DOCUMENT_DELETE_FAIL,
  DOCUMENT_CLEAR_ERRORS
} from '../constants/documentConstants';
import { API_URL } from '../../config';

/**
 * Upload a document
 * @param {FormData} formData - Form data containing file and metadata
 */
export const uploadDocument = (formData) => async (dispatch, getState) => {
  try {
    dispatch({ type: DOCUMENT_UPLOAD_REQUEST });

    const {
      auth: { userInfo }
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userInfo.token}`
      }
    };

    const { data } = await axios.post(`${API_URL}/api/v1/documents`, formData, config);

    dispatch({
      type: DOCUMENT_UPLOAD_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: DOCUMENT_UPLOAD_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
  }
};

/**
 * Get all user documents
 */
export const getDocuments = () => async (dispatch, getState) => {
  try {
    dispatch({ type: DOCUMENT_LIST_REQUEST });

    const {
      auth: { userInfo }
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    };

    const { data } = await axios.get(`${API_URL}/api/v1/documents`, config);

    dispatch({
      type: DOCUMENT_LIST_SUCCESS,
      payload: data.data
    });
  } catch (error) {
    dispatch({
      type: DOCUMENT_LIST_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
  }
};

/**
 * Remove a document
 * @param {string} documentId - ID of document to remove
 */
export const removeDocument = (documentId) => async (dispatch, getState) => {
  try {
    dispatch({ type: DOCUMENT_DELETE_REQUEST });

    const {
      auth: { userInfo }
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    };

    await axios.delete(`${API_URL}/api/v1/documents/${documentId}`, config);

    dispatch({
      type: DOCUMENT_DELETE_SUCCESS,
      payload: documentId
    });
  } catch (error) {
    dispatch({
      type: DOCUMENT_DELETE_FAIL,
      payload: error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    });
  }
};

/**
 * Clear document errors
 */
export const clearErrors = () => async (dispatch) => {
  dispatch({ type: DOCUMENT_CLEAR_ERRORS });
};
