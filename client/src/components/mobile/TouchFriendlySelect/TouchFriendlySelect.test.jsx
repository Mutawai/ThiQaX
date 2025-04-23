// client/src/components/mobile/TouchFriendlySelect/TouchFriendlySelect.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TouchFriendlySelect from './TouchFriendlySelect';

describe('TouchFriendlySelect Component', () => {
  // Mock options
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
    { value: '4', label: 'Another option' }
  ];
  
  // Mock onChange function
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    mockOnChange.mockReset();
  });
  
  test('renders select with label and placeholder', () => {
    render(
      <TouchFriendlySelect
        options={options}
        label="Test Label"
        placeholder="Select something"
      />
    );
    
    // Label should be visible
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    
    // Placeholder should be visible when no value is selected
    expect(screen.getByText('Select something')).toBeInTheDocument();
  });
  
  test('opens dropdown when clicked', () => {
    render(
      <TouchFriendlySelect
        options={options}
        label="Test Label"
      />
    );
    
    // Dropdown should be closed initially
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Options should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });
  
  test('selects an option when clicked', async () => {
    render(
      <TouchFriendlySelect
        options={options}
        onChange={mockOnChange}
        label="Test Label"
      />
    );
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Click on Option 2
    fireEvent.click(screen.getByText('Option 2'));
    
    // onChange should be called with the selected value
    expect(mockOnChange).toHaveBeenCalledWith('2');
    
    // Dropdown should be closed after selection
    await waitFor(() => {
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });
  
  test('displays selected value', () => {
    render(
      <TouchFriendlySelect
        options={options}
        value="3"
        label="Test Label"
      />
    );
    
    // Selected option label should be visible
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });
  
  test('shows error state correctly', () => {
    render(
      <TouchFriendlySelect
        options={options}
        error={true}
        helperText="This field is required"
        label="Test Label"
      />
    );
    
    // Error helper text should be visible
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    
    // Select should have error class
    const select = document.querySelector('.select');
    expect(select).toHaveClass('error');
  });
  
  test('disables the select when disabled prop is true', () => {
    render(
      <TouchFriendlySelect
        options={options}
        disabled={true}
        label="Test Label"
      />
    );
    
    // Select should have disabled class
    const select = document.querySelector('.select');
    expect(select).toHaveClass('disabled');
    
    // Select should have aria-disabled attribute
    expect(select).toHaveAttribute('aria-disabled', 'true');
    
    // Click should not open dropdown when disabled
    fireEvent.click(select);
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
  
  test('filters options when searching', async () => {
    render(
      <TouchFriendlySelect
        options={options}
        searchable={true}
        label="Test Label"
      />
    );
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Search input should be visible
    const searchInput = document.querySelector('.searchInput');
    expect(searchInput).toBeInTheDocument();
    
    // Type in search box
    fireEvent.change(searchInput, { target: { value: 'another' } });
    
    // Only matching option should be visible
    expect(screen.getByText('Another option')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
    
    // Clear search
    const clearButton = document.querySelector('.clearButton');
    fireEvent.click(clearButton);
    
    // All options should be visible again
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    expect(screen.getByText('Another option')).toBeInTheDocument();
  });
  
  test('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <TouchFriendlySelect
          options={options}
          label="Test Label"
        />
        <div data-testid="outside">Outside Element</div>
      </div>
    );
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Options should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    
    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });
  
  test('shows required indicator', () => {
    render(
      <TouchFriendlySelect
        options={options}
        label="Test Label"
        required={true}
      />
    );
    
    // Required star should be visible
    expect(document.querySelector('.requiredStar')).toBeInTheDocument();
  });
  
  test('applies fullWidth style', () => {
    render(
      <TouchFriendlySelect
        options={options}
        label="Test Label"
        fullWidth={true}
      />
    );
    
    // Container should have fullWidth class
    const container = document.querySelector('.container');
    expect(container).toHaveClass('fullWidth');
  });
  
  test('shows "No options found" when search has no results', () => {
    render(
      <TouchFriendlySelect
        options={options}
        searchable={true}
        label="Test Label"
      />
    );
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button'));
    
    // Search for something that doesn't exist
    const searchInput = document.querySelector('.searchInput');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // "No options found" message should be visible
    expect(screen.getByText('No options found')).toBeInTheDocument();
  });
});