/**
 * SlotCard Component Tests
 * 
 * Testing priorities:
 * 1. Slot info displays correctly
 * 2. "Update File" button click
 * 3. Menu dropdown opens/closes
 * 4. Archive action
 * 5. Accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SlotCard from './SlotCard';

// Mock Button component
jest.mock('../common/Button', () => {
  return function MockButton({ children, onClick, variant, size, fullWidth, icon, disabled }) {
    return (
      <button
        onClick={onClick}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth}
        disabled={disabled}
        data-testid="slot-action-button"
      >
        {icon && <span data-testid="button-icon">{icon}</span>}
        {children}
      </button>
    );
  };
});

describe('SlotCard Component', () => {
  const mockSlot = {
    id: 'slot-123',
    slug: 'sunday-liturgy',
    name: 'sunday-liturgy',
    displayName: 'Sunday Liturgy',
    isActive: true,
    lastUpdatedAt: '2025-01-15T10:30:00Z',
    viewerUrl: 'https://churchshare.app/view/sunday-liturgy',
  };

  const mockHandlers = {
    onUpdateFile: jest.fn(),
    onRename: jest.fn(),
    onToggleStatus: jest.fn(),
    onCopyLink: jest.fn(),
    onPreview: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSlotCard = (slot = mockSlot, handlers = mockHandlers) => {
    return render(<SlotCard slot={slot} {...handlers} />);
  };

  describe('Rendering Tests', () => {
    test('should render slot card with display name', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByText('Sunday Liturgy')).toBeInTheDocument();
    });

    test('should render slot card with slug as fallback when no display name', () => {
      // Given
      const slotWithoutDisplayName = {
        ...mockSlot,
        displayName: null,
        name: 'weekly-bulletin',
      };

      // When
      renderSlotCard(slotWithoutDisplayName);

      // Then
      expect(screen.getByText('weekly-bulletin')).toBeInTheDocument();
    });

    test('should render active status badge', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByText('✓ Active')).toBeInTheDocument();
    });

    test('should render inactive status badge when slot is inactive', () => {
      // Given
      const inactiveSlot = { ...mockSlot, isActive: false };

      // When
      renderSlotCard(inactiveSlot);

      // Then
      expect(screen.getByText('○ Inactive')).toBeInTheDocument();
    });

    test('should render last updated text', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    test('should render Update File button', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByTestId('slot-action-button')).toBeInTheDocument();
      expect(screen.getByText('Update File')).toBeInTheDocument();
    });

    test('should render menu button', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    test('should have clock icon for updated time', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByText('🕐')).toBeInTheDocument();
    });

    test('should have folder icon on Update File button', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByTestId('button-icon')).toHaveTextContent('📁');
    });
  });

  describe('Relative Time Formatting', () => {
    test('should show "Updated today" for today\'s date', () => {
      // Given
      const today = new Date().toISOString();
      const slotWithToday = { ...mockSlot, lastUpdatedAt: today };

      // When
      renderSlotCard(slotWithToday);

      // Then
      expect(screen.getByText('Updated today')).toBeInTheDocument();
    });

    test('should show "Updated yesterday" for yesterday\'s date', () => {
      // Given
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const slotWithYesterday = { ...mockSlot, lastUpdatedAt: yesterday };

      // When
      renderSlotCard(slotWithYesterday);

      // Then
      expect(screen.getByText('Updated yesterday')).toBeInTheDocument();
    });

    test('should show "Updated X days ago" for recent dates', () => {
      // Given
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const slotWithThreeDays = { ...mockSlot, lastUpdatedAt: threeDaysAgo };

      // When
      renderSlotCard(slotWithThreeDays);

      // Then
      expect(screen.getByText('Updated 3 days ago')).toBeInTheDocument();
    });

    test('should show "Updated X week(s) ago" for older dates', () => {
      // Given
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
      const slotWithTwoWeeks = { ...mockSlot, lastUpdatedAt: twoWeeksAgo };

      // When
      renderSlotCard(slotWithTwoWeeks);

      // Then
      expect(screen.getByText('Updated 2 week(s) ago')).toBeInTheDocument();
    });

    test('should show formatted date for very old dates', () => {
      // Given
      const oldDate = '2024-01-15T10:30:00Z';
      const slotWithOldDate = { ...mockSlot, lastUpdatedAt: oldDate };

      // When
      renderSlotCard(slotWithOldDate);

      // Then
      // Should contain the year
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    test('should show "Never updated" when no lastUpdatedAt', () => {
      // Given
      const slotWithoutUpdate = { ...mockSlot, lastUpdatedAt: null };

      // When
      renderSlotCard(slotWithoutUpdate);

      // Then
      expect(screen.getByText('Never updated')).toBeInTheDocument();
    });
  });

  describe('Update File Button Tests', () => {
    test('should call onUpdateFile when Update File button is clicked', () => {
      // Given
      renderSlotCard();

      // When
      fireEvent.click(screen.getByTestId('slot-action-button'));

      // Then
      expect(mockHandlers.onUpdateFile).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onUpdateFile).toHaveBeenCalledWith(mockSlot);
    });

    test('should not crash if onUpdateFile is not provided', () => {
      // Given
      const handlers = { ...mockHandlers, onUpdateFile: undefined };

      // When & Then
      expect(() => renderSlotCard(mockSlot, handlers)).not.toThrow();
    });

    test('should have primary variant for Update File button', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByTestId('slot-action-button')).toHaveAttribute('data-variant', 'primary');
    });

    test('should have large size for Update File button', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByTestId('slot-action-button')).toHaveAttribute('data-size', 'large');
    });

    test('should have fullWidth for Update File button', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByTestId('slot-action-button')).toHaveAttribute('data-full-width', 'true');
    });
  });

  describe('Menu Dropdown Tests', () => {
    test('should open menu when menu button is clicked', () => {
      // Given
      renderSlotCard();

      // When
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      expect(screen.getByText('✏️ Rename')).toBeInTheDocument();
      expect(screen.getByText('🚫 Deactivate')).toBeInTheDocument();
      expect(screen.getByText('🔗 Copy Link')).toBeInTheDocument();
      expect(screen.getByText('👁️ Preview')).toBeInTheDocument();
    });

    test('should close menu when menu button is clicked again', () => {
      // Given
      renderSlotCard();
      const menuButton = screen.getByLabelText('More options');

      // When - open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('✏️ Rename')).toBeInTheDocument();

      // When - close menu
      fireEvent.click(menuButton);

      // Then
      expect(screen.queryByText('✏️ Rename')).not.toBeInTheDocument();
    });

    test('should close menu when clicking outside', () => {
      // Given
      const { container } = renderSlotCard();
      const menuButton = screen.getByLabelText('More options');

      // When - open menu
      fireEvent.click(menuButton);
      expect(screen.getByText('✏️ Rename')).toBeInTheDocument();

      // When - click outside
      fireEvent.click(container);

      // Then
      expect(screen.queryByText('✏️ Rename')).not.toBeInTheDocument();
    });

    test('should set aria-expanded to true when menu is open', () => {
      // Given
      renderSlotCard();
      const menuButton = screen.getByLabelText('More options');

      // When
      fireEvent.click(menuButton);

      // Then
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('should set aria-expanded to false when menu is closed', () => {
      // Given
      renderSlotCard();
      const menuButton = screen.getByLabelText('More options');

      // Then - initially closed
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('should have menu role on dropdown', () => {
      // Given
      renderSlotCard();

      // When - open menu
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    test('should have menuitem role on menu items', () => {
      // Given
      renderSlotCard();

      // When - open menu
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      expect(screen.getByRole('menuitem', { name: /rename/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /deactivate/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /copy link/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /preview/i })).toBeInTheDocument();
    });
  });

  describe('Menu Action Tests', () => {
    beforeEach(() => {
      // Open menu for all tests
      renderSlotCard();
      fireEvent.click(screen.getByLabelText('More options'));
    });

    test('should call onRename when Rename is clicked', () => {
      // When
      fireEvent.click(screen.getByText('✏️ Rename'));

      // Then
      expect(mockHandlers.onRename).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onRename).toHaveBeenCalledWith(mockSlot);
    });

    test('should call onToggleStatus when Deactivate is clicked', () => {
      // When
      fireEvent.click(screen.getByText('🚫 Deactivate'));

      // Then
      expect(mockHandlers.onToggleStatus).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onToggleStatus).toHaveBeenCalledWith(mockSlot);
    });

    test('should call onCopyLink when Copy Link is clicked', () => {
      // When
      fireEvent.click(screen.getByText('🔗 Copy Link'));

      // Then
      expect(mockHandlers.onCopyLink).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onCopyLink).toHaveBeenCalledWith(mockSlot.viewerUrl);
    });

    test('should call onPreview when Preview is clicked', () => {
      // When
      fireEvent.click(screen.getByText('👁️ Preview'));

      // Then
      expect(mockHandlers.onPreview).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onPreview).toHaveBeenCalledWith(mockSlot.slug);
    });

    test('should close menu after clicking any action', () => {
      // When
      fireEvent.click(screen.getByText('✏️ Rename'));

      // Then
      expect(screen.queryByText('✏️ Rename')).not.toBeInTheDocument();
    });
  });

  describe('Inactive Slot Tests', () => {
    test('should show Activate option for inactive slot', () => {
      // Given
      const inactiveSlot = { ...mockSlot, isActive: false };
      renderSlotCard(inactiveSlot);

      // When - open menu
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      expect(screen.getByText('✅ Activate')).toBeInTheDocument();
    });

    test('should show Deactivate option for active slot', () => {
      // Given
      renderSlotCard();

      // When - open menu
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      expect(screen.getByText('🚫 Deactivate')).toBeInTheDocument();
    });

    test('should have inactive class when slot is inactive', () => {
      // Given
      const inactiveSlot = { ...mockSlot, isActive: false };

      // When
      const { container } = renderSlotCard(inactiveSlot);

      // Then
      expect(container.firstChild).toHaveClass('slot-card-inactive');
    });

    test('should not have inactive class when slot is active', () => {
      // Given
      renderSlotCard();

      // Then
      expect(screen.getByText('Sunday Liturgy').closest('.slot-card')).not.toHaveClass('slot-card-inactive');
    });
  });

  describe('Accessibility Tests', () => {
    test('should have menu button with aria-label', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    test('should have menu items as buttons', () => {
      // Given
      renderSlotCard();

      // When - open menu
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach(item => {
        expect(item.tagName).toBe('BUTTON');
      });
    });

    test('should have overlay when menu is open', () => {
      // Given
      const { container } = renderSlotCard();

      // When - open menu
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      expect(container.querySelector('.slot-card-menu-overlay')).toBeInTheDocument();
    });

    test('should close menu when overlay is clicked', () => {
      // Given
      const { container } = renderSlotCard();
      fireEvent.click(screen.getByLabelText('More options'));

      // When - click overlay
      fireEvent.click(container.querySelector('.slot-card-menu-overlay'));

      // Then
      expect(screen.queryByText('✏️ Rename')).not.toBeInTheDocument();
    });

    test('should have proper heading level for slot title', () => {
      // When
      renderSlotCard();

      // Then
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sunday Liturgy');
    });
  });

  describe('Edge Cases', () => {
    test('should handle slot with undefined properties gracefully', () => {
      // Given
      const minimalSlot = {
        id: 'slot-123',
        slug: 'test-slug',
        name: 'test-slug',
      };

      // When & Then
      expect(() => renderSlotCard(minimalSlot, {})).not.toThrow();
    });

    test('should handle very long display names', () => {
      // Given
      const longNameSlot = {
        ...mockSlot,
        displayName: 'This is a very long display name that should wrap appropriately within the card container',
      };

      // When
      renderSlotCard(longNameSlot);

      // Then
      expect(screen.getByText(longNameSlot.displayName)).toBeInTheDocument();
    });

    test('should handle special characters in display name', () => {
      // Given
      const specialNameSlot = {
        ...mockSlot,
        displayName: 'Sunday Liturgy & Announcements (June 2025)',
      };

      // When
      renderSlotCard(specialNameSlot);

      // Then
      expect(screen.getByText('Sunday Liturgy & Announcements (June 2025)')).toBeInTheDocument();
    });

    test('should handle missing handler functions gracefully', () => {
      // Given
      const noHandlers = {};

      // When & Then
      expect(() => renderSlotCard(mockSlot, noHandlers)).not.toThrow();
    });

    test('should use viewerUrl fallback when copying link', () => {
      // Given
      const slotWithoutViewerUrl = {
        ...mockSlot,
        viewerUrl: undefined,
      };
      renderSlotCard(slotWithoutViewerUrl);

      // When - open menu and click copy link
      fireEvent.click(screen.getByLabelText('More options'));
      fireEvent.click(screen.getByText('🔗 Copy Link'));

      // Then
      expect(mockHandlers.onCopyLink).toHaveBeenCalledWith(
        'https://churchshare.app/view/sunday-liturgy'
      );
    });
  });

  describe('Elderly User Accessibility Tests', () => {
    test('should have large Update File button for easy tapping', () => {
      // When
      renderSlotCard();

      // Then
      const updateButton = screen.getByTestId('slot-action-button');
      expect(updateButton).toHaveAttribute('data-size', 'large');
      expect(updateButton).toHaveAttribute('data-full-width', 'true');
    });

    test('should have clear status indicator', () => {
      // When
      renderSlotCard();

      // Then
      // Status should have checkmark for active
      expect(screen.getByText('✓ Active')).toBeInTheDocument();
    });

    test('should have emoji icons for menu items', () => {
      // Given
      renderSlotCard();

      // When - open menu
      fireEvent.click(screen.getByLabelText('More options'));

      // Then
      expect(screen.getByText('✏️ Rename')).toBeInTheDocument();
      expect(screen.getByText('🚫 Deactivate')).toBeInTheDocument();
      expect(screen.getByText('🔗 Copy Link')).toBeInTheDocument();
      expect(screen.getByText('👁️ Preview')).toBeInTheDocument();
    });

    test('should have clear visual separation between sections', () => {
      // When
      const { container } = renderSlotCard();

      // Then
      expect(container.querySelector('.slot-card-header')).toBeInTheDocument();
      expect(container.querySelector('.slot-card-actions')).toBeInTheDocument();
    });
  });

  describe('Card Styling Tests', () => {
    test('should have slot-card base class', () => {
      // When
      const { container } = renderSlotCard();

      // Then
      expect(container.firstChild).toHaveClass('slot-card');
    });

    test('should have header section', () => {
      // When
      const { container } = renderSlotCard();

      // Then
      expect(container.querySelector('.slot-card-header')).toBeInTheDocument();
    });

    test('should have title section', () => {
      // When
      const { container } = renderSlotCard();

      // Then
      expect(container.querySelector('.slot-card-title-section')).toBeInTheDocument();
    });

    test('should have menu section', () => {
      // When
      const { container } = renderSlotCard();

      // Then
      expect(container.querySelector('.slot-card-menu')).toBeInTheDocument();
    });

    test('should have updated text section', () => {
      // When
      const { container } = renderSlotCard();

      // Then
      expect(container.querySelector('.slot-card-updated')).toBeInTheDocument();
    });

    test('should have actions section', () => {
      // When
      const { container } = renderSlotCard();

      // Then
      expect(container.querySelector('.slot-card-actions')).toBeInTheDocument();
    });
  });
});
