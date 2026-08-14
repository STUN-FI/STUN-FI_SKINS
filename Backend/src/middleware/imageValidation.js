/**
 * Image validation middleware for file uploads
 * Validates file type, size, and dimensions
 */

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
};

// File size constraints (in bytes)
const FILE_SIZE_LIMITS = {
  individual: 10 * 1024 * 1024, // 10MB for individual designs
  wholesale: 15 * 1024 * 1024,  // 15MB for wholesale designs
};

// Image dimension constraints (in pixels)
const DIMENSION_LIMITS = {
  minWidth: 400,
  minHeight: 400,
  maxWidth: 8000,
  maxHeight: 8000,
};

/**
 * Validate a single file
 * @param {Object} file - Multer file object
 * @param {string} type - 'individual' or 'wholesale'
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
function validateFile(file, type = 'individual') {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, GIF`,
    };
  }

  // Check file size
  const sizeLimit = FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.individual;
  if (file.buffer.length > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / 1024 / 1024);
    return {
      isValid: false,
      error: `File too large: ${file.originalname}. Maximum size: ${sizeMB}MB`,
    };
  }

  // File name validation
  if (!file.originalname || file.originalname.trim().length === 0) {
    return {
      isValid: false,
      error: 'Invalid file name',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate multiple files
 * @param {Array} files - Array of Multer file objects
 * @param {string} type - 'individual' or 'wholesale'
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
function validateFiles(files, type = 'individual') {
  if (!files || files.length === 0) {
    return { isValid: true, error: null }; // Files are optional
  }

  if (files.length > 10) {
    return {
      isValid: false,
      error: `Too many files: ${files.length}. Maximum: 10 files per order`,
    };
  }

  for (const file of files) {
    const validation = validateFile(file, type);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true, error: null };
}

/**
 * Multer error handler
 * @param {Object} error - Multer error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function multerErrorHandler(error, req, res, next) {
  if (error) {
    console.error('Multer error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.',
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 10 files per upload.',
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message || 'File upload error',
    });
  }

  next();
}

/**
 * Validation middleware factory
 * Creates middleware that validates uploaded files
 * @param {string} type - 'individual' or 'wholesale'
 * @returns {Function} - Express middleware
 */
function createFileValidationMiddleware(type = 'individual') {
  return (req, res, next) => {
    const validation = validateFiles(req.files, type);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    next();
  };
}

module.exports = {
  validateFile,
  validateFiles,
  multerErrorHandler,
  createFileValidationMiddleware,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  DIMENSION_LIMITS,
};
