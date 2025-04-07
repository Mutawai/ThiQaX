// src/redux/reducers/documentReducer.js
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

const initialState = {
  documents: [],
  document: null,
  loading: false,
  error: null,
  success: false,
  expiringDocuments: [],
  actionLoading: false
};

const documentReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_DOCUMENTS_REQUEST:
      return { ...state, loading: true };
      
    case GET_DOCUMENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        documents: action.payload,
        error: null
      };
      
    case GET_DOCUMENTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    case GET_DOCUMENT_REQUEST:
      return { ...state, loading: true };
      
    case GET_DOCUMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        document: action.payload,
        error: null
      };
      
    case GET_DOCUMENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    case UPLOAD_DOCUMENT_REQUEST:
      return { ...state, actionLoading: true, success: false };
      
    case UPLOAD_DOCUMENT_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        documents: [...state.documents, action.payload],
        error: null,
        success: true
      };
      
    case UPLOAD_DOCUMENT_FAILURE:
      return {
        ...state,
        actionLoading: false,
        error: action.payload,
        success: false
      };
      
    case DELETE_DOCUMENT_REQUEST:
      return { ...state, actionLoading: true };
      
    case DELETE_DOCUMENT_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        documents: state.documents.filter(
          (document) => document._id !== action.payload
        ),
        error: null
      };
      
    case DELETE_DOCUMENT_FAILURE:
      return {
        ...state,
        actionLoading: false,
        error: action.payload
      };
      
    case UPDATE_DOCUMENT_STATUS_REQUEST:
      return { ...state, actionLoading: true };
      
    case UPDATE_DOCUMENT_STATUS_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        documents: state.documents.map((document) =>
          document._id === action.payload._id ? action.payload : document
        ),
        document: state.document?._id === action.payload._id ? action.payload : state.document,
        error: null
      };
      
    case UPDATE_DOCUMENT_STATUS_FAILURE:
      return {
        ...state,
        actionLoading: false,
        error: action.payload
      };
      
    case LINK_DOCUMENTS_REQUEST:
      return { ...state, actionLoading: true };
      
    case LINK_DOCUMENTS_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        error: null
      };
      
    case LINK_DOCUMENTS_FAILURE:
      return {
        ...state,
        actionLoading: false,
        error: action.payload
      };
      
    case CHECK_DOCUMENT_EXPIRY_REQUEST:
      return { ...state, actionLoading: true };
      
    case CHECK_DOCUMENT_EXPIRY_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        expiringDocuments: action.payload.expiringDocuments,
        error: null
      };
      
    case CHECK_DOCUMENT_EXPIRY_FAILURE:
      return {
        ...state,
        actionLoading: false,
        error: action.payload
      };
      
    case CLEAR_DOCUMENT_ERRORS:
      return { ...state, error: null };
      
    default:
      return state;
  }
};

export default documentReducer;
