/**
 * slotService.js
 * Slot management service for ChurchShare admin
 * Handles CRUD operations and file uploads
 */

import api, { adminSlotsAPI } from '../config/api';

/**
 * Get all slots for the current admin
 * @returns {Promise<Array>} List of slots
 */
export const getAllSlots = async () => {
  const response = await adminSlotsAPI.getAll();
  return response.data;
};

/**
 * Get a single slot by ID
 * @param {string} id - Slot ID
 * @returns {Promise<Object>} Slot data
 */
export const getSlotById = async (id) => {
  const response = await adminSlotsAPI.getById(id);
  return response.data;
};

/**
 * Get a single slot by slug
 * @param {string} slug - Slot slug
 * @returns {Promise<Object>} Slot data
 */
export const getSlotBySlug = async (slug) => {
  const response = await adminSlotsAPI.getBySlug(slug);
  return response.data;
};

/**
 * Create a new slot
 * @param {Object} slotData - Slot data (displayName, slug, description)
 * @returns {Promise<Object>} Created slot
 */
export const createSlot = async (slotData) => {
  const response = await adminSlotsAPI.create(slotData);
  return response.data;
};

/**
 * Update a slot
 * @param {string} id - Slot ID
 * @param {Object} slotData - Updated slot data
 * @returns {Promise<Object>} Updated slot
 */
export const updateSlot = async (id, slotData) => {
  const response = await adminSlotsAPI.update(id, slotData);
  return response.data;
};

/**
 * Delete a slot
 * @param {string} id - Slot ID
 * @returns {Promise<void>}
 */
export const deleteSlot = async (id) => {
  await adminSlotsAPI.delete(id);
};

/**
 * Toggle slot active/inactive status
 * @param {string} id - Slot ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} Updated slot
 */
export const toggleSlotStatus = async (id, isActive) => {
  const response = await adminSlotsAPI.toggleStatus(id, isActive);
  return response.data;
};

/**
 * Upload a file to a slot
 * Uses XMLHttpRequest for progress tracking
 * @param {string} slug - Slot slug
 * @param {File} file - PDF file to upload
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Upload result
 */
export const uploadFile = (slug, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    // Handle successful upload
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve({ success: true });
        }
      } else {
        let errorMessage = 'Upload failed';
        try {
          const errorData = JSON.parse(xhr.responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Use default message
        }
        reject({
          status: xhr.status,
          message: errorMessage,
        });
      }
    };

    // Handle network errors
    xhr.onerror = () => {
      reject({
        status: 0,
        message: 'Network error. Please check your connection.',
      });
    };

    // Handle abort
    xhr.onabort = () => {
      reject({
        status: 0,
        message: 'Upload cancelled',
      });
    };

    // Open and send request
    xhr.open('POST', `${api.defaults.baseURL}/admin/slots/${slug}/file`, true);
    
    // Include credentials (cookies)
    xhr.withCredentials = true;
    
    xhr.send(formData);
  });
};

/**
 * Validate a file before upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateFile = (file) => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return {
      valid: false,
      error: 'Please select a PDF file. Other file types are not supported.',
    };
  }

  // Check file size (20MB max)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `This file is too large (${sizeMB}MB). Please use a PDF under 20MB.`,
    };
  }

  // Check file name
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return {
      valid: false,
      error: 'Please select a file with a .pdf extension.',
    };
  }

  return { valid: true };
};

/**
 * Check if a slug is available
 * @param {string} slug - Slug to check
 * @returns {Promise<boolean>} True if available
 */
export const checkSlugAvailability = async (slug) => {
  try {
    await adminSlotsAPI.checkSlug(slug);
    return true;
  } catch (error) {
    if (error?.response?.status === 409) {
      return false; // Slug already exists
    }
    throw error;
  }
};

/**
 * Generate a valid slug from a display name
 * @param {string} name - Display name
 * @returns {string} Valid slug
 */
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length
};

export default {
  getAllSlots,
  getSlotById,
  getSlotBySlug,
  createSlot,
  updateSlot,
  deleteSlot,
  toggleSlotStatus,
  uploadFile,
  validateFile,
  checkSlugAvailability,
  generateSlug,
};
