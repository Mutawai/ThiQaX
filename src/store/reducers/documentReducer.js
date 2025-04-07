// src/store/reducers/documentReducer.js

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

const initialState = {
  documents: [],
  loading: false,
  error: null,
  success: false
};

/**
 * Document reducer for handling document-related state
 */
export default function documentReducer(state = initialState, action) {
  switch (action.type) {
    case DOCUMENT_UPLOAD_REQUEST:
      return {
        ...state,
        loading: true
      };
    case DOCUMENT_UPLOAD_SUCCESS:
      return {
        ...state,
        loading: false,
        documents: [...state.documents, action.payload],
        success: true
      };
    case DOCUMENT_UPLOAD_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case DOCUMENT_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case DOCUMENT_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        documents: action.payload
      };
    case DOCUMENT_LIST_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case DOCUMENT_DELETE_REQUEST:
      return {
        ...state,
        loading: true
      };
    case DOCUMENT_DELETE_SUCCESS:
      return {
        ...state,
        loading: false,
        documents: state.documents.filter(doc => doc._id !== action.payload),
        success: true
      };
    case DOCUMENT_DELETE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case DOCUMENT_CLEAR_ERRORS:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}
