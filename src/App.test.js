import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the router to prevent errors
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  useLocation: () => ({
    pathname: '/',
  }),
}));

// Mock the components to simplify testing
jest.mock('./pages/LandingPage', () => () => <div>Landing Page Mock</div>);
jest.mock('./components/layout/Header', () => () => <div>Header Mock</div>);

test('renders app without crashing', () => {
  render(<App />);
  
  expect(screen.getByText('Header Mock')).toBeInTheDocument();
  expect(screen.getByText('Landing Page Mock')).toBeInTheDocument();
});
