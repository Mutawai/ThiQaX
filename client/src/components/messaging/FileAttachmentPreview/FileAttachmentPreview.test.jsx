// client/src/components/messaging/FileAttachmentPreview/FileAttachmentPreview.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileAttachmentPreview from './FileAttachmentPreview';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');

describe('FileAttachmentPreview Component', () => {
  // Sample file objects for testing
  const imageFile = {
    name: 'sample-image.jpg',
    size: 1024000, // 1000 KB
    type: 'image/jpeg'
  };
  
  const pdfFile = {
    name: 'document.pdf',
    size: 2048000, // 2000 KB
    type: 'application/pdf'
  };
  
  const docFile = {
    name: 'report.docx',
    size: 512000, // 500 KB
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  // Mock callback functions
  const mockRemove = jest.fn();
  const mockDownload = jest.fn();
  const mockPreview = jest.fn();
  
  test('renders an image file correctly', () => {
    render(
      <FileAttachmentPreview 
        file={imageFile}
        showRemove={true}
        onRemove={mockRemove}
        onDownload={mockDownload}
        onPreview={mockPreview}
      />
    );
    
    // Image should be rendered
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'sample-image.jpg');
    
    // File name and size should be displayed
    expect(screen.getByText('sample-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('1000 KB')).toBeInTheDocument();
    
    // Zoom button should be visible for images
    const zoomButton = document.querySelector('.zoomButton');
    expect(zoomButton).toBeInTheDocument();
  });
  
  test('renders a PDF file correctly', () => {
    render(
      <FileAttachmentPreview 
        file={pdfFile}
        showRemove={true}
        onRemove={mockRemove}
        onDownload={mockDownload}
      />
    );
    
    // File icon should be rendered
    const fileIcon = document.querySelector('.fileIcon');
    expect(fileIcon).toBeInTheDocument();
    
    // File name and size should be displayed
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
  });
  
  test('renders a DOC file correctly', () => {
    render(
      <FileAttachmentPreview 
        file={docFile}
        showRemove={true}
        onRemove={mockRemove}
        onDownload={mockDownload}
      />
    );
    
    // File icon should be rendered
    const fileIcon = document.querySelector('.fileIcon');
    expect(fileIcon).toBeInTheDocument();
    
    // File name and size should be displayed
    expect(screen.getByText('report.docx')).toBeInTheDocument();
    expect(screen.getByText('500 KB')).toBeInTheDocument();
  });
  
  test('shows progress bar when uploading', () => {
    render(
      <FileAttachmentPreview 
        file={imageFile}
        uploading={true}
        progress={65}
      />
    );
    
    // Progress bar should be visible
    const progressBar = document.querySelector('.progressBar');
    expect(progressBar).toBeInTheDocument();
    
    // Circular progress indicator should be visible
    const uploadingIndicator = document.querySelector('.uploadingIndicator');
    expect(uploadingIndicator).toBeInTheDocument();
  });
  
  test('calls onRemove when remove button is clicked', () => {
    render(
      <FileAttachmentPreview 
        file={imageFile}
        showRemove={true}
        onRemove={mockRemove}
      />
    );
    
    // Find and click the remove button
    const removeButton = screen.getByLabelText('Remove file');
    fireEvent.click(removeButton);
    
    // Check if the onRemove callback was called
    expect(mockRemove).toHaveBeenCalledWith(imageFile);
  });
  
  test('calls onDownload when download button is clicked', () => {
    render(
      <FileAttachmentPreview 
        file={pdfFile}
        onDownload={mockDownload}
      />
    );
    
    // Find and click the download button
    const downloadButton = screen.getByLabelText('Download file');
    fireEvent.click(downloadButton);
    
    // Check if the onDownload callback was called
    expect(mockDownload).toHaveBeenCalledWith(pdfFile);
  });
  
  test('calls onPreview when zoom button is clicked for images', () => {
    render(
      <FileAttachmentPreview 
        file={imageFile}
        onPreview={mockPreview}
      />
    );
    
    // Find and click the zoom button
    const zoomButton = screen.getByLabelText('Preview image');
    fireEvent.click(zoomButton);
    
    // Check if the onPreview callback was called
    expect(mockPreview).toHaveBeenCalledWith(imageFile);
  });
  
  test('handles image loading errors', () => {
    render(
      <FileAttachmentPreview 
        file={imageFile}
      />
    );
    
    // Find image and trigger error
    const img = document.querySelector('img');
    fireEvent.error(img);
    
    // After error, file icon should be displayed instead of image
    const fileIcon = document.querySelector('.fileIcon');
    expect(fileIcon).toBeInTheDocument();
  });
});