import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import MobileDocumentCapture from './MobileDocumentCapture';

// Mock the navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn().mockImplementation(() => Promise.resolve({
    getTracks: () => [{
      stop: jest.fn(),
      getCapabilities: () => ({ torch: true }),
      applyConstraints: jest.fn().mockResolvedValue(undefined)
    }]
  }))
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
});

// Mock canvas operations
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  drawImage: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(100).fill(100)
  }),
  putImageData: jest.fn()
});

// Mock toDataURL
HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/jpeg;base64,mockedimage');

// Mock createObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('blob:test');

describe('MobileDocumentCapture Component', () => {
  // Props for testing
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onCapture: jest.fn(),
    documentType: 'ID Card',
    withCropping: true,
    withEnhancements: true,
    loading: false,
    errorMessage: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock element.getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      bottom: 200,
      right: 200
    });
  });

  test('renders camera view by default', () => {
    render(<MobileDocumentCapture {...mockProps} />);
    
    expect(screen.getByText(/Capture ID Card/i)).toBeInTheDocument();
    expect(screen.getByText(/Position ID Card within the frame/i)).toBeInTheDocument();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  test('switches to gallery mode when clicked', () => {
    render(<MobileDocumentCapture {...mockProps} />);
    
    const galleryTab = screen.getByText('Gallery');
    fireEvent.click(galleryTab);
    
    expect(screen.getByText(/Select a ID Card image from your gallery/i)).toBeInTheDocument();
    expect(screen.getByText('Choose Image')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<MobileDocumentCapture {...mockProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('captures image when capture button is clicked', async () => {
    render(<MobileDocumentCapture {...mockProps} />);
    
    const captureButton = document.querySelector('.captureButton');
    fireEvent.click(captureButton);
    
    await waitFor(() => {
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
      expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalled();
    });
  });

  test('displays error message when provided', () => {
    render(<MobileDocumentCapture {...mockProps} errorMessage="Error accessing camera" />);
    
    expect(screen.getByText('Error accessing camera')).toBeInTheDocument();
  });

  test('shows loading state when loading prop is true', () => {
    render(<MobileDocumentCapture {...mockProps} loading={true} />);
    
    // Capture an image first
    const captureButton = document.querySelector('.captureButton');
    fireEvent.click(captureButton);
    
    // Set component to loading state through props
    rerender(<MobileDocumentCapture {...mockProps} loading={true} />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  // Testing image editing functionality requires more complex mocks
  // for the canvas operations. Here's a simplified test:
  
  test('displays edit buttons after capturing image', async () => {
    render(<MobileDocumentCapture {...mockProps} />);
    
    // Capture an image
    const captureButton = document.querySelector('.captureButton');
    fireEvent.click(captureButton);
    
    await waitFor(() => {
      expect(screen.getByText('Retake')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
    
    // Check if edit buttons exist
    expect(document.querySelector('.editButtons')).toBeInTheDocument();
  });

  test('calls onCapture when save button is clicked', async () => {
    render(<MobileDocumentCapture {...mockProps} />);
    
    // Capture an image
    const captureButton = document.querySelector('.captureButton');
    fireEvent.click(captureButton);
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
    
    // Click save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(mockProps.onCapture).toHaveBeenCalledWith('data:image/jpeg;base64,mockedimage');
  });
});