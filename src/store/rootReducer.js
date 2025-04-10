import { combineReducers } from 'redux';
import documentReducer from './reducers/documentReducer';

/**
 * Root reducer that combines all reducers in the application
 */
const rootReducer = combineReducers({
  document: documentReducer,
  // Add other reducers here as the application grows
});

export default rootReducer;
