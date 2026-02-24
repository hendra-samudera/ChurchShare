/**
 * ViewerControls Component Tests
 * 
 * Testing priorities:
 * 1. Previous/next buttons call handlers
 * 2. Zoom buttons call handlers
 * 3. Disabled state for prev/next at boundaries
 * 4. Accessibility compliance (aria labels, keyboard navigation)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewerControls, { CompactViewerControls } from './ViewerControls';

describe('ViewerControls Component', () => {
  const defaultProps = {
    currentPage: 5,
    totalPages: 10,
    scale: 1.0,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onResetZoom: jest.fn(),
    canPrevious: true,
    canNext: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    test('should render all navigation buttons', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('should render all zoom buttons', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      expect(screen.getByText('Zoom Out')).toBeInTheDocument();
      expect(screen.getByText('Zoom In')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    test('should render zoom indicator with percentage', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={1.5} />);

      // Then
      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    test('should render zoom indicator at 50% when scale is 0.5', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={0.5} />);

      // Then
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    test('should render zoom indicator at 200% when scale is 2.0', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={2.0} />);

      // Then
      expect(screen.getByText('200%')).toBeInTheDocument();
    });

    test('should have toolbar role', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    test('should have aria-label for toolbar', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      expect(screen.getByRole('toolbar')).toHaveAttribute(
        'aria-label',
        'Document navigation and zoom controls'
      );
    });

    test('should render page navigation group', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const navGroup = screen.getByRole('group', { name: /page navigation/i });
      expect(navGroup).toBeInTheDocument();
    });

    test('should render zoom controls group', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const zoomGroup = screen.getByRole('group', { name: /zoom controls/i });
      expect(zoomGroup).toBeInTheDocument();
    });

    test('should render quick jump buttons for documents with more than 5 pages', () => {
      // When
      render(<ViewerControls {...defaultProps} totalPages={10} />);

      // Then
      expect(screen.getByText('-5')).toBeInTheDocument();
      expect(screen.getByText('+5')).toBeInTheDocument();
    });

    test('should not render quick jump buttons for documents with 5 or fewer pages', () => {
      // When
      render(<ViewerControls {...defaultProps} totalPages={5} />);

      // Then
      expect(screen.queryByText('-5')).not.toBeInTheDocument();
      expect(screen.queryByText('+5')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Button Handler Tests', () => {
    test('should call onPrevious when Previous button is clicked', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      fireEvent.click(screen.getByText('Previous'));

      // Then
      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    test('should call onNext when Next button is clicked', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      fireEvent.click(screen.getByText('Next'));

      // Then
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    test('should call onZoomIn when Zoom In button is clicked', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      fireEvent.click(screen.getByText('Zoom In'));

      // Then
      expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
    });

    test('should call onZoomOut when Zoom Out button is clicked', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      fireEvent.click(screen.getByText('Zoom Out'));

      // Then
      expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
    });

    test('should call onResetZoom when Reset button is clicked', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      fireEvent.click(screen.getByText('Reset'));

      // Then
      expect(defaultProps.onResetZoom).toHaveBeenCalledTimes(1);
    });

    test('should call handlers with click event', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      fireEvent.click(screen.getByText('Next'));

      // Then
      expect(defaultProps.onNext).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'click' })
      );
    });
  });

  describe('Disabled State Tests', () => {
    test('should disable Previous button when canPrevious is false', () => {
      // When
      render(<ViewerControls {...defaultProps} canPrevious={false} />);

      // Then
      expect(screen.getByText('Previous')).toBeDisabled();
    });

    test('should disable Next button when canNext is false', () => {
      // When
      render(<ViewerControls {...defaultProps} canNext={false} />);

      // Then
      expect(screen.getByText('Next')).toBeDisabled();
    });

    test('should disable Zoom Out button when scale is at minimum (0.5)', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={0.5} />);

      // Then
      expect(screen.getByText('Zoom Out')).toBeDisabled();
    });

    test('should enable Zoom Out button when scale is above minimum', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={0.6} />);

      // Then
      expect(screen.getByText('Zoom Out')).not.toBeDisabled();
    });

    test('should disable Zoom In button when scale is at maximum (3.0)', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={3.0} />);

      // Then
      expect(screen.getByText('Zoom In')).toBeDisabled();
    });

    test('should enable Zoom In button when scale is below maximum', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={2.9} />);

      // Then
      expect(screen.getByText('Zoom In')).not.toBeDisabled();
    });

    test('should not disable Previous button when canPrevious is true', () => {
      // When
      render(<ViewerControls {...defaultProps} canPrevious={true} />);

      // Then
      expect(screen.getByText('Previous')).not.toBeDisabled();
    });

    test('should not disable Next button when canNext is true', () => {
      // When
      render(<ViewerControls {...defaultProps} canNext={true} />);

      // Then
      expect(screen.getByText('Next')).not.toBeDisabled();
    });

    test('should disable quick jump back button at first page', () => {
      // When
      render(<ViewerControls {...defaultProps} currentPage={1} canPrevious={false} />);

      // Then
      const back5Button = screen.getByText('-5').closest('button');
      expect(back5Button).toBeDisabled();
    });

    test('should disable quick jump forward button at last page', () => {
      // When
      render(<ViewerControls {...defaultProps} currentPage={10} totalPages={10} canNext={false} />);

      // Then
      const forward5Button = screen.getByText('+5').closest('button');
      expect(forward5Button).toBeDisabled();
    });
  });

  describe('Boundary Condition Tests', () => {
    test('should disable Previous at page 1', () => {
      // When
      render(
        <ViewerControls
          {...defaultProps}
          currentPage={1}
          canPrevious={false}
        />
      );

      // Then
      expect(screen.getByText('Previous')).toBeDisabled();
    });

    test('should disable Next at last page', () => {
      // When
      render(
        <ViewerControls
          {...defaultProps}
          currentPage={10}
          totalPages={10}
          canNext={false}
        />
      );

      // Then
      expect(screen.getByText('Next')).toBeDisabled();
    });

    test('should enable Previous at page 2', () => {
      // When
      render(
        <ViewerControls
          {...defaultProps}
          currentPage={2}
          canPrevious={true}
        />
      );

      // Then
      expect(screen.getByText('Previous')).not.toBeDisabled();
    });

    test('should enable Next when not at last page', () => {
      // When
      render(
        <ViewerControls
          {...defaultProps}
          currentPage={5}
          totalPages={10}
          canNext={true}
        />
      );

      // Then
      expect(screen.getByText('Next')).not.toBeDisabled();
    });
  });

  describe('Accessibility Tests', () => {
    test('should have aria-label on Previous button', () => {
      // When
      render(<ViewerControls {...defaultProps} currentPage={5} />);

      // Then
      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toHaveAttribute('aria-label');
    });

    test('should have aria-label on Next button', () => {
      // When
      render(<ViewerControls {...defaultProps} currentPage={5} />);

      // Then
      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toHaveAttribute('aria-label');
    });

    test('should have aria-label on Zoom In button', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const zoomInButton = screen.getByText('Zoom In').closest('button');
      expect(zoomInButton).toHaveAttribute('aria-label', 'Zoom in');
    });

    test('should have aria-label on Zoom Out button', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const zoomOutButton = screen.getByText('Zoom Out').closest('button');
      expect(zoomOutButton).toHaveAttribute('aria-label', 'Zoom out');
    });

    test('should have aria-label on Reset button', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const resetButton = screen.getByText('Reset').closest('button');
      expect(resetButton).toHaveAttribute('aria-label', 'Reset zoom to fit screen');
    });

    test('should have title attribute on Previous button', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toHaveAttribute('title', 'Previous Page');
    });

    test('should have title attribute on Next button', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toHaveAttribute('title', 'Next Page');
    });

    test('should have aria-live on zoom indicator', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const zoomIndicator = screen.getByText('100%').closest('[aria-live]');
      expect(zoomIndicator).toHaveAttribute('aria-live', 'polite');
    });

    test('should have icons marked as aria-hidden', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      const icons = screen.getAllByAttribute('aria-hidden', 'true');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Zoom Indicator Tests', () => {
    test('should display zoom percentage correctly', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={1.25} />);

      // Then
      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    test('should round zoom percentage', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={1.234} />);

      // Then
      expect(screen.getByText('123%')).toBeInTheDocument();
    });

    test('should show 50% at minimum zoom', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={0.5} />);

      // Then
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    test('should show 300% at maximum zoom', () => {
      // When
      render(<ViewerControls {...defaultProps} scale={3.0} />);

      // Then
      expect(screen.getByText('300%')).toBeInTheDocument();
    });

    test('should have zoom icon', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Tests', () => {
    test('should support Enter key on Previous button', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      const prevButton = screen.getByText('Previous').closest('button');
      fireEvent.keyDown(prevButton, { key: 'Enter', code: 'Enter' });

      // Then
      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    test('should support Space key on Next button', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      const nextButton = screen.getByText('Next').closest('button');
      fireEvent.keyDown(nextButton, { key: ' ', code: 'Space' });

      // Then
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    test('should support Enter key on Zoom In button', () => {
      // Given
      render(<ViewerControls {...defaultProps} />);

      // When
      const zoomInButton = screen.getByText('Zoom In').closest('button');
      fireEvent.keyDown(zoomInButton, { key: 'Enter', code: 'Enter' });

      // Then
      expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Elderly User Accessibility Tests', () => {
    test('should have clear text labels on all buttons', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      // All buttons should have visible text labels
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Zoom In')).toBeInTheDocument();
      expect(screen.getByText('Zoom Out')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    test('should have large tap targets (verified via class names)', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      // Buttons should have control-btn class for styling
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('control-btn');
      });
    });

    test('should have high contrast icons', () => {
      // When
      render(<ViewerControls {...defaultProps} />);

      // Then
      // Icons should have control-btn-icon class
      const icons = screen.getAllByClassName('control-btn-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});

describe('CompactViewerControls Component', () => {
  const compactDefaultProps = {
    currentPage: 5,
    totalPages: 10,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    canPrevious: true,
    canNext: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    test('should render compact controls', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    test('should render page indicator', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    test('should render previous icon button', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      const prevButton = screen.getByLabelText(/previous page/i);
      expect(prevButton).toBeInTheDocument();
      expect(prevButton).toHaveTextContent('←');
    });

    test('should render next icon button', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      const nextButton = screen.getByLabelText(/next page/i);
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).toHaveTextContent('→');
    });

    test('should have compact class', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      expect(screen.getByRole('toolbar')).toHaveClass('viewer-controls-compact');
    });
  });

  describe('Handler Tests', () => {
    test('should call onPrevious when previous button is clicked', () => {
      // Given
      render(<CompactViewerControls {...compactDefaultProps} />);

      // When
      fireEvent.click(screen.getByLabelText(/previous page/i));

      // Then
      expect(compactDefaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    test('should call onNext when next button is clicked', () => {
      // Given
      render(<CompactViewerControls {...compactDefaultProps} />);

      // When
      fireEvent.click(screen.getByLabelText(/next page/i));

      // Then
      expect(compactDefaultProps.onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State Tests', () => {
    test('should disable previous button when canPrevious is false', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} canPrevious={false} />);

      // Then
      expect(screen.getByLabelText(/previous page/i)).toBeDisabled();
    });

    test('should disable next button when canNext is false', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} canNext={false} />);

      // Then
      expect(screen.getByLabelText(/next page/i)).toBeDisabled();
    });

    test('should enable previous button when canPrevious is true', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} canPrevious={true} />);

      // Then
      expect(screen.getByLabelText(/previous page/i)).not.toBeDisabled();
    });

    test('should enable next button when canNext is true', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} canNext={true} />);

      // Then
      expect(screen.getByLabelText(/next page/i)).not.toBeDisabled();
    });
  });

  describe('Accessibility Tests', () => {
    test('should have aria-label on previous button', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      const prevButton = screen.getByLabelText(/previous page/i);
      expect(prevButton).toHaveAttribute('aria-label');
    });

    test('should have aria-label on next button', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      const nextButton = screen.getByLabelText(/next page/i);
      expect(nextButton).toHaveAttribute('aria-label');
    });

    test('should have visually-hidden text for icon buttons', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      expect(screen.getByText('Previous')).toHaveClass('visually-hidden');
      expect(screen.getByText('Next')).toHaveClass('visually-hidden');
    });

    test('should have toolbar role', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
  });

  describe('Page Indicator Tests', () => {
    test('should display current page', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} currentPage={3} />);

      // Then
      const indicator = screen.getByClassName('compact-page-indicator');
      expect(indicator).toHaveTextContent('3');
    });

    test('should display total pages', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} totalPages={15} />);

      // Then
      const indicator = screen.getByClassName('compact-page-indicator');
      expect(indicator).toHaveTextContent('15');
    });

    test('should display separator', () => {
      // When
      render(<CompactViewerControls {...compactDefaultProps} />);

      // Then
      expect(screen.getByClassName('separator')).toHaveTextContent('/');
    });
  });
});
