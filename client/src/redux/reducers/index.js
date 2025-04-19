import { combineReducers } from 'redux';
import documentReducer from './documentReducer';
import verificationReducer from './verificationReducer';
import adminReducer from '../slices/adminSlice';

const rootReducer = combineReducers({
  document: documentReducer,
  verification: verificationReducer,
  admin: adminReducer
});

export default rootReducer;