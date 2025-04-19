import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import rootReducer from './reducers';

// Redux Persist Configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist the auth reducer state
  blacklist: ['admin'] // Don't persist admin state (frequent changes, sensitive data)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store with middleware
const middleware = [thunk];
const enhancer = composeWithDevTools(applyMiddleware(...middleware));

// Initialize store with persisted reducer
export const store = createStore(persistedReducer, enhancer);
export const persistor = persistStore(store);

// Enable hot reloading in development
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./reducers', () => {
    const nextRootReducer = require('./reducers').default;
    store.replaceReducer(persistReducer(persistConfig, nextRootReducer));
  });
}

export default { store, persistor };