/**
 * NewSlotPage.jsx - Create New Slot
 * Form to create a new document slot
 *
 * Accessibility Requirements:
 * - Labels above input fields
 * - Clear error messages below fields
 * - Live slug preview with validation
 * - One primary action per screen
 * - Large tap targets (56px minimum)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { FormError } from '../components/common/ErrorMessage';
import { createSlot, generateSlug, checkSlugAvailability } from '../services/slotService';
import './NewSlotPage.css';

const NewSlotPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [slugAvailable, setSlugAvailable] = useState(true);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      displayName: '',
      slug: '',
      description: '',
    },
  });

  // Watch display name for slug generation
  const displayName = watch('displayName');

  /**
   * Auto-generate slug from display name
   */
  useEffect(() => {
    if (displayName) {
      const slug = generateSlug(displayName);
      setGeneratedSlug(slug);
      
      // Only auto-update slug if user hasn't manually edited it
      const currentSlug = watch('slug');
      if (!currentSlug || currentSlug === generateSlug(watch('displayName')?.slice(0, -1) || '')) {
        setValue('slug', slug);
      }
    } else {
      setGeneratedSlug('');
    }
  }, [displayName, setValue, watch]);

  /**
   * Check slug availability with debounce
   */
  const checkSlug = useCallback(async (slug) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(true);
      return;
    }

    setCheckingSlug(true);
    try {
      const available = await checkSlugAvailability(slug);
      setSlugAvailable(available);
    } catch (err) {
      setSlugAvailable(false);
    } finally {
      setCheckingSlug(false);
    }
  }, []);

  // Debounced slug check
  useEffect(() => {
    const slug = watch('slug');
    const timer = setTimeout(() => {
      if (slug) {
        checkSlug(slug);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watch('slug'), checkSlug]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const newSlot = await createSlot({
        displayName: data.displayName,
        slug: data.slug,
        description: data.description,
      });

      // Redirect to upload page for this new slot
      navigate(`/admin/slots/${newSlot.slug}/upload`, {
        state: { isNewSlot: true },
      });
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 
                       err?.message || 
                       'Failed to create slot. Please try again.';
      
      if (err?.response?.status === 409) {
        setSlugAvailable(false);
      }
      
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Validate slug format
   */
  const validateSlug = (value) => {
    if (!value) return 'Please enter a link ID';
    if (value.length < 3) return 'Link ID must be at least 3 characters';
    if (value.length > 60) return 'Link ID must be 60 characters or less';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
      return 'Only lowercase letters, numbers, and hyphens allowed';
    }
    if (!slugAvailable) return 'This link ID is already taken';
    return true;
  };

  return (
    <div className="new-slot-page">
      <PageHeader
        title="Create New Slot"
        subtitle="Set up a new document sharing slot"
        showBack={true}
        backTo="/admin/dashboard"
      />

      <div className="form-container">
        <form onSubmit={handleSubmit(onSubmit)} className="slot-form" noValidate>
          {/* Display Name */}
          <div className="form-group">
            <label htmlFor="displayName" className="form-label">
              Slot Name <span className="required">(required)</span>
            </label>
            <input
              id="displayName"
              type="text"
              className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
              placeholder="e.g., Sunday Liturgy"
              disabled={isSubmitting}
              {...register('displayName', {
                required: 'Please enter a slot name',
                minLength: {
                  value: 3,
                  message: 'Name must be at least 3 characters',
                },
              })}
            />
            {errors.displayName && <FormError message={errors.displayName.message} />}
            <p className="form-help">
              This is the display name people will see (e.g., "Sunday Liturgy").
            </p>
          </div>

          {/* Slug / Link ID */}
          <div className="form-group">
            <label htmlFor="slug" className="form-label">
              Link ID <span className="required">(required)</span>
            </label>
            <div className="slug-input-wrapper">
              <span className="slug-prefix">churchshare.app/view/</span>
              <input
                id="slug"
                type="text"
                className={`form-control slug-input ${errors.slug ? 'is-invalid' : ''} ${!slugAvailable ? 'slug-taken' : ''}`}
                placeholder="sunday-liturgy"
                disabled={isSubmitting || checkingSlug}
                {...register('slug', {
                  required: 'Please enter a link ID',
                  validate: validateSlug,
                })}
              />
              {checkingSlug && (
                <span className="slug-checking-indicator" aria-label="Checking availability">
                  ⏳
                </span>
              )}
              {slugAvailable && watch('slug')?.length >= 3 && !checkingSlug && (
                <span className="slug-available-indicator" aria-label="Available">
                  ✓
                </span>
              )}
            </div>
            
            {/* Slug validation messages */}
            {errors.slug && <FormError message={errors.slug.message} />}
            {!errors.slug && !slugAvailable && watch('slug') && (
              <FormError message="This link ID is already taken. Please choose another." />
            )}
            
            {/* URL Preview */}
            {watch('slug') && (
              <div className="url-preview">
                <span className="url-preview-label">Your link will be:</span>
                <code className="url-preview-value">
                  churchshare.app/view/{watch('slug')}
                </code>
              </div>
            )}
            
            <p className="form-help">
              Simple web address for sharing. Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {/* Description (Optional) */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="optional">(optional)</span>
            </label>
            <textarea
              id="description"
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              placeholder="Briefly describe what documents will be shared here (for your reference)"
              rows={3}
              disabled={isSubmitting}
              {...register('description')}
            />
            {errors.description && <FormError message={errors.description.message} />}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="submit-error">
              <FormError message={submitError} />
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={isSubmitting}
              fullWidth
              icon={isSubmitting ? null : '✨'}
              disabled={!slugAvailable || checkingSlug}
            >
              {isSubmitting ? 'Creating...' : 'Create Slot'}
            </Button>
          </div>

          {/* Cancel Link */}
          <div className="form-cancel">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/admin/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSlotPage;
