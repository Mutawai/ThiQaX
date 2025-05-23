// client/src/components/mobile/MobileFilterMenu/MobileFilterMenu.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MobileFilterMenu from './MobileFilterMenu';

// Create a test theme
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('MobileFilterMenu Component', () => {
// Mock filter groups
  const mockFilterGroups = [
    {
      id: 'category',
      title: 'Category',
      expanded: true,
      filters: [
        {
          id: 'job_type',
          type: 'checkbox',
          label: 'Job Type',
          options: [
            { value: 'full-time', label: 'Full Time', count: 120 },
            { value: 'part-time', label: 'Part Time', count: 45 },
            { value: 'contract', label: 'Contract', count: 30 }
          ]
        },
        {
          id: 'experience',
          type: 'radio',
          label: 'Experience Level',
          options: [
            { value: 'entry', label: 'Entry Level' },
            { value: 'mid', label: 'Mid Level' },
            { value: 'senior', label: 'Senior Level' }
          ]
        }
      ]
    },
    {
      id: 'location',
      title: 'Location & Salary',
      expanded: false,
      filters: [
        {
          id: 'salary_range',
          type: 'range',
          label: 'Salary Range',
          min: 0,
          max: 200000,
          step: 5000,
          prefix: '$',
          defaultValue: [50000, 150000]
        },
        {
          id: 'remote_work',
          type: 'switch',
          label: 'Remote Work Available',
          defaultValue: false
        }
      ]
    },
    {
      id: 'skills',
      title: 'Skills',
      filters: [
        {
          id: 'required_skills',
          type: 'multi-select',
          label: 'Required Skills',
          placeholder: 'Select skills...',
          options: [
            { value: 'react', label: 'React' },
            { value: 'node', label: 'Node.js' },
            { value: 'python', label: 'Python' },
            { value: 'javascript', label: 'JavaScript' }
          ]
        }
      ]
    }
  ];
  
  // Mock callbacks
  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();
  const mockOnSearch = jest.fn();
  const mockOnReset = jest.fn();
  
  // Mock selected filters
  const mockSelectedFilters = {
    job_type: ['full-time'],
    experience: 'mid',
    salary_range: [60000, 120000],
    remote_work: true,
    required_skills: ['react', 'javascript']
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
test('renders filter menu when open', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    // Title should be visible
    expect(screen.getByText('Filters')).toBeInTheDocument();
    
    // Close button should be visible
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    
    // Filter groups should be visible
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Location & Salary')).toBeInTheDocument();
  });
  
  test('does not render when closed', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={false}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    // Filter menu should not be visible
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
  });
  
  test('calls onClose when close button is clicked', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    // Should call onClose
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('renders checkbox filters correctly', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    // Checkbox options should be visible
    expect(screen.getByText('Full Time')).toBeInTheDocument();
    expect(screen.getByText('Part Time')).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
    
    // Count badges should be visible
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });
  
  test('renders radio filters correctly', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    // Radio options should be visible
    expect(screen.getByText('Entry Level')).toBeInTheDocument();
    expect(screen.getByText('Mid Level')).toBeInTheDocument();
    expect(screen.getByText('Senior Level')).toBeInTheDocument();
  });
test('handles checkbox filter selection', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    // Click on Full Time checkbox
    const fullTimeCheckbox = screen.getByRole('checkbox', { name: /full time/i });
    await user.click(fullTimeCheckbox);
    
    // Checkbox should be checked
    expect(fullTimeCheckbox).toBeChecked();
    
    // Click Apply button
    await user.click(screen.getByText('Apply Filters'));
    
    // Should call onApply with selected filters
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        job_type: ['full-time']
      })
    );
  });
  
  test('handles radio filter selection', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    // Click on Mid Level radio
    const midLevelRadio = screen.getByRole('radio', { name: /mid level/i });
    await user.click(midLevelRadio);
    
    // Radio should be selected
    expect(midLevelRadio).toBeChecked();
    
    // Click Apply button
    await user.click(screen.getByText('Apply Filters'));
    
    // Should call onApply with selected filters
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        experience: 'mid'
      })
    );
  });
  
  test('handles switch filter interaction', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          filterGroups={mockFilterGroups}
          groupsCollapsible={false}
        />
      </TestWrapper>
    );
    
    // Find switch for remote work
    const remoteSwitch = screen.getByRole('checkbox', { name: /remote work available/i });
    
    // Switch should be unchecked initially
    expect(remoteSwitch).not.toBeChecked();
    
    // Click switch
    await user.click(remoteSwitch);
    
    // Switch should be checked
    expect(remoteSwitch).toBeChecked();
    
    // Apply filters
    await user.click(screen.getByText('Apply Filters'));
    
    // Should call onApply with switch value
    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        remote_work: true
      })
    );
  });
  
  test('handles range filter interaction', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          groupsCollapsible={false}
        />
      </TestWrapper>
    );
    
    // Salary Range filter should be visible
    expect(screen.getByText('Salary Range')).toBeInTheDocument();
    
    // Range slider should be present
    expect(document.querySelector('.rangeSlider')).toBeInTheDocument();
    
    // Range values should be displayed
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$200000')).toBeInTheDocument();
  });
  
  test('handles multi-select filter interaction', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          groupsCollapsible={false}
        />
      </TestWrapper>
    );
    
    // Multi-select filter should be visible
    expect(screen.getByText('Required Skills')).toBeInTheDocument();
    
    // Autocomplete input should be present
    expect(screen.getByPlaceholderText('Select skills...')).toBeInTheDocument();
  });
test('expands and collapses filter groups', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          groupsCollapsible={true}
        />
      </TestWrapper>
    );
    
    // Location & Salary group should be collapsed initially
    expect(screen.queryByText('Salary Range')).not.toBeInTheDocument();
    
    // Click to expand Location & Salary group
    await user.click(screen.getByText('Location & Salary'));
    
    // Salary Range filter should now be visible
    await waitFor(() => {
      expect(screen.getByText('Salary Range')).toBeInTheDocument();
    });
    
    // Click again to collapse
    await user.click(screen.getByText('Location & Salary'));
    
    // Salary Range should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('Salary Range')).not.toBeInTheDocument();
    });
  });
  
  test('handles search functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          showSearch={true}
          onSearch={mockOnSearch}
        />
      </TestWrapper>
    );
    
    // Find search input
    const searchInput = screen.getByPlaceholderText('Search filters...');
    
    // Type in search box
    await user.type(searchInput, 'job');
    
    // Should call onSearch
    expect(mockOnSearch).toHaveBeenCalledWith('job');
    
    // Should filter visible filters
    await waitFor(() => {
      expect(screen.getByText('Job Type')).toBeInTheDocument();
      expect(screen.queryByText('Experience Level')).not.toBeInTheDocument();
    });
  });
  
  test('clears search when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          showSearch={true}
        />
      </TestWrapper>
    );
    
    const searchInput = screen.getByPlaceholderText('Search filters...');
    
    // Type in search box
    await user.type(searchInput, 'test');
    
    // Clear button should appear
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);
    
    // Search input should be empty
    expect(searchInput.value).toBe('');
  });
  
  test('shows no results message when search has no matches', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          showSearch={true}
        />
      </TestWrapper>
    );
    
    const searchInput = screen.getByPlaceholderText('Search filters...');
    
    // Search for something that doesn't exist
    await user.type(searchInput, 'nonexistent');
    
    // No results message should be shown
    await waitFor(() => {
      expect(screen.getByText(/No filters found matching "nonexistent"/)).toBeInTheDocument();
    });
  });
test('displays selected filters correctly', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          selectedFilters={mockSelectedFilters}
          showActiveCount={true}
        />
      </TestWrapper>
    );
    
    // Active filter count should be displayed
    // job_type: 1, experience: 1, salary_range: 1, remote_work: 1, required_skills: 2 = 6 total
    expect(screen.getByText('6')).toBeInTheDocument();
  });
  
  test('resets all filters when clear all is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          onReset={mockOnReset}
          filterGroups={mockFilterGroups}
          selectedFilters={mockSelectedFilters}
          showClearAll={true}
        />
      </TestWrapper>
    );
    
    // Click Clear All button
    await user.click(screen.getByText('Clear All'));
    
    // Should call onReset
    expect(mockOnReset).toHaveBeenCalled();
  });
  
  test('updates active filter count correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          showActiveCount={true}
        />
      </TestWrapper>
    );
    
    // Initially no active filters
    expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
    
    // Select a checkbox option
    const fullTimeCheckbox = screen.getByRole('checkbox', { name: /full time/i });
    await user.click(fullTimeCheckbox);
    
    // Active count should update (note: this might be shown in the apply button)
    await waitFor(() => {
      expect(screen.getByText(/Apply Filters \(1\)/)).toBeInTheDocument();
    });
  });
  
  test('hides search when showSearch is false', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          showSearch={false}
        />
      </TestWrapper>
    );
    
    // Search input should not be visible
    expect(screen.queryByPlaceholderText('Search filters...')).not.toBeInTheDocument();
  });
  
  test('hides clear all button when showClearAll is false', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          showClearAll={false}
        />
      </TestWrapper>
    );
    
    // Clear All button should not be visible
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });
  
  test('hides apply button when showApplyButton is false', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          showApplyButton={false}
        />
      </TestWrapper>
    );
    
    // Apply button should not be visible
    expect(screen.queryByText('Apply Filters')).not.toBeInTheDocument();
  });
test('applies correct ARIA attributes', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
          variant="modal"
        />
      </TestWrapper>
    );
    
    // Modal should have proper ARIA attributes
    const modal = document.querySelector('[role="dialog"]');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });
  
  test('handles touch events for mobile interaction', () => {
    render(
      <TestWrapper>
        <MobileFilterMenu
          open={true}
          onClose={mockOnClose}
          filterGroups={mockFilterGroups}
        />
      </TestWrapper>
    );
    
    const fullTimeCheckbox = screen.getByRole('checkbox', { name: /full time/i });
    
    // Simulate touch events
    fireEvent.touchStart(fullTimeCheckbox);
    fireEvent.touchEnd(fullTimeCheckbox);
    fireEvent.click(fullTimeCheckbox);
    
    // Should handle touch interaction
    expect(fullTimeCheckbox).toBeChecked();
  });
});