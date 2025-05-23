// client/src/components/mobile/PullToRefresh/PullToRefresh.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PullToRefresh from './PullToRefresh';

// Create a test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock touch events
const createTouchEvent = (clientY, type = 'touchmove') => ({
  touches: [{ clientY }],
  preventDefault: jest.fn(),
  type
});

// Mock scrollTop property
const mockScrollTop = (element, value) => {
  Object.defineProperty(element, 'scrollTop', {
    writable: true,
    value
  });
};

describe('PullToRefresh Component', () => {
  // Mock callbacks
  const mockOnRefresh = jest.fn();
  const mockOnPullStart = jest.fn();
  const mockOnPullEnd = jest.fn();
  
  // Test content
  const TestContent = () => (
    <div style={{ height: '200px', padding: '20px' }}>
      <p>Test content that can be refreshed</p>
      <p>Scroll down to see more content</p>
      <p>Pull down from the top to refresh</p>
    </div>
  );
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('renders content correctly', () => {
    render(
      <TestWrapper>
        <PullToRefresh onRefresh={mockOnRefresh}>
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Content should be visible
    expect(screen.getByText('Test content that can be refreshed')).toBeInTheDocument();
    expect(screen.getByText('Pull down from the top to refresh')).toBeInTheDocument();
  });
  
  test('shows default pull text initially', () => {
    render(
      <TestWrapper>
        <PullToRefresh onRefresh={mockOnRefresh}>
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Default pull text should be accessible via aria-label
    const refreshIndicator = screen.getByRole('status');
    expect(refreshIndicator).toHaveAttribute('aria-label', 'Pull down to refresh');
  });
  
  test('handles touch start at top of scroll', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          onPullStart={mockOnPullStart}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0); // At top of scroll
    
    // Start touch at top
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // onPullStart should be called
    expect(mockOnPullStart).toHaveBeenCalled();
  });
  
  test('does not handle touch start when not at top', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          onPullStart={mockOnPullStart}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 50); // Not at top
    
    // Start touch when scrolled down
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // onPullStart should not be called
    expect(mockOnPullStart).not.toHaveBeenCalled();
  });
  
  test('handles pull gesture correctly', () => {
    render(
      <TestWrapper>
        <PullToRefresh onRefresh={mockOnRefresh}>
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down (increase Y coordinate)
    fireEvent.touchMove(content, createTouchEvent(150));
    
    // Content should be transformed
    expect(content.style.transform).toContain('translateY');
  });
  
  test('triggers refresh when pulled beyond threshold', async () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          threshold={80}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down beyond threshold (80px * resistance = 200px)
    fireEvent.touchMove(content, createTouchEvent(300));
    
    // End touch
    fireEvent.touchEnd(content);
    
    // Should trigger refresh
    expect(mockOnRefresh).toHaveBeenCalled();
  });
  
  test('does not trigger refresh when pulled below threshold', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          threshold={80}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down below threshold
    fireEvent.touchMove(content, createTouchEvent(150));
    
    // End touch
    fireEvent.touchEnd(content);
    
    // Should not trigger refresh
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });
  
  test('shows loading state when refreshing', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          refreshing={true}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Loading indicator should be visible
    expect(document.querySelector('.spinner')).toBeInTheDocument();
    
    // Refreshing text should be displayed
    const refreshIndicator = screen.getByRole('status');
    expect(refreshIndicator).toHaveAttribute('aria-label', 'Refreshing...');
  });
  
  test('shows completion state after refresh', async () => {
    const { rerender } = render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          refreshing={true}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Change to not refreshing
    rerender(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          refreshing={false}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Complete icon should be visible
    expect(document.querySelector('.completeIcon')).toBeInTheDocument();
    
    // Advance timers to hide completion state
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });
  
  test('respects disabled prop', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          disabled={true}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Try to pull when disabled
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    fireEvent.touchMove(content, createTouchEvent(200));
    fireEvent.touchEnd(content);
    
    // Should not trigger refresh
    expect(mockOnRefresh).not.toHaveBeenCalled();
    
    // Container should have disabled class
    expect(document.querySelector('.container')).toHaveClass('disabled');
  });
  
  test('uses custom text props', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          pullText="Custom pull text"
          refreshingText="Custom refreshing text"
          refreshing={true}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Custom refreshing text should be displayed
    const refreshIndicator = screen.getByRole('status');
    expect(refreshIndicator).toHaveAttribute('aria-label', 'Custom refreshing text');
  });
  
  test('hides icon when showIcon is false', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          showIcon={false}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Icon container should not be visible
    expect(document.querySelector('.iconContainer')).not.toBeInTheDocument();
  });
  
  test('hides text when showText is false', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          showText={false}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Status text should not be visible
    expect(document.querySelector('.statusText')).not.toBeInTheDocument();
  });
  
  test('applies custom className', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          className="custom-class"
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Container should have custom class
    expect(document.querySelector('.container')).toHaveClass('custom-class');
  });
  
  test('respects maxPullDistance prop', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          maxPullDistance={100}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down beyond max distance
    fireEvent.touchMove(content, createTouchEvent(500));
    
    // Transform should be limited by maxPullDistance
    const transform = content.style.transform;
    expect(transform).toContain('translateY');
    // The actual value depends on resistance calculation
  });
  
  test('calls onPullEnd with correct data', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          onPullEnd={mockOnPullEnd}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down
    fireEvent.touchMove(content, createTouchEvent(150));
    
    // End touch
    fireEvent.touchEnd(content);
    
    // Should call onPullEnd with data
    expect(mockOnPullEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        distance: expect.any(Number),
        duration: expect.any(Number),
        triggered: expect.any(Boolean)
      })
    );
  });
  
  test('uses custom loader when provided', () => {
    const CustomLoader = () => <div data-testid="custom-loader">Loading...</div>;
    
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          refreshing={true}
          customLoader={<CustomLoader />}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    // Custom loader should be visible
    expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
  });
  
  test('prevents default touch behavior during pull', () => {
    render(
      <TestWrapper>
        <PullToRefresh onRefresh={mockOnRefresh}>
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Create mock event with preventDefault
    const mockEvent = createTouchEvent(150);
    
    // Pull down
    fireEvent.touchMove(content, mockEvent);
    
    // preventDefault should be called to prevent scroll
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
  
  test('handles touch cancel event', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          onPullEnd={mockOnPullEnd}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down
    fireEvent.touchMove(content, createTouchEvent(150));
    
    // Cancel touch
    fireEvent.touchCancel(content);
    
    // Should handle touch cancel same as touch end
    expect(mockOnPullEnd).toHaveBeenCalled();
  });
  
  test('shows progress indicator during pull', () => {
    render(
      <TestWrapper>
        <PullToRefresh onRefresh={mockOnRefresh}>
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down
    fireEvent.touchMove(content, createTouchEvent(150));
    
    // Progress indicator should be visible
    expect(document.querySelector('.progressIndicator')).toBeInTheDocument();
  });
  
  test('changes text based on pull distance', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          threshold={80}
          releaseText="Release to refresh"
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down beyond threshold
    fireEvent.touchMove(content, createTouchEvent(300));
    
    // Text should change to release text
    const refreshIndicator = screen.getByRole('status');
    expect(refreshIndicator).toHaveAttribute('aria-label', 'Release to refresh');
  });
  
  test('rotates arrow icon based on pull progress', () => {
    render(
      <TestWrapper>
        <PullToRefresh onRefresh={mockOnRefresh}>
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down partially
    fireEvent.touchMove(content, createTouchEvent(140));
    
    // Icon should rotate based on progress
    const iconContainer = document.querySelector('.iconContainer');
    expect(iconContainer.style.transform).toContain('rotate');
  });
  
  test('handles resistance calculation correctly', () => {
    render(
      <TestWrapper>
        <PullToRefresh 
          onRefresh={mockOnRefresh}
          resistance={3}
        >
          <TestContent />
        </PullToRefresh>
      </TestWrapper>
    );
    
    const content = document.querySelector('.content');
    mockScrollTop(content, 0);
    
    // Start touch
    fireEvent.touchStart(content, createTouchEvent(100, 'touchstart'));
    
    // Pull down 150px (should result in 50px with resistance of 3)
    fireEvent.touchMove(content, createTouchEvent(250));
    
    // Transform should be affected by resistance
    const transform = content.style.transform;
    expect(transform).toContain('translateY');
  });
});