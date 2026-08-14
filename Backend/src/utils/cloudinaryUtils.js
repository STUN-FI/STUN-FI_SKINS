const { cloudinary } = require('../config/cloudinary');

/**
 * Extract the public ID from a Cloudinary URL
 * Example: https://res.cloudinary.com/cloud-name/image/upload/v123456/stunfi-skins/designs/abc123.jpg
 * Returns: stunfi-skins/designs/abc123
 */
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    // Match Cloudinary URL pattern
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

/**
 * Delete a media file from Cloudinary by public ID
 */
async function deleteFromCloudinary(publicId) {
  if (!publicId) {
    throw new Error('Public ID is required');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
    throw new Error(`Failed to delete media from Cloudinary: ${error.message}`);
  }
}

/**
 * Delete media by URL (extracts public ID automatically)
 */
async function deleteMediaByUrl(url) {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) {
    throw new Error('Could not extract public ID from URL');
  }
  return deleteFromCloudinary(publicId);
}

/**
 * Get optimized Cloudinary URL with transformations
 * Useful for responsive images, format optimization, etc.
 */
function getOptimizedUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url;

  // Already optimized Cloudinary URLs can be further transformed
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    fit = 'scale',
  } = options;

  if (!url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL, return as-is
  }

  let transformedUrl = url;

  // Insert transformation parameters before the last part of URL
  if (width || height || quality !== 'auto' || format !== 'auto') {
    const transforms = [];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (width && height) transforms.push(`c_${fit}`);
    if (quality !== 'auto') transforms.push(`q_${quality}`);
    if (format !== 'auto') transforms.push(`f_${format}`);

    const transformString = transforms.join(',');
    transformedUrl = url.replace('/upload/', `/upload/${transformString}/`);
  }

  return transformedUrl;
}

/**
 * List all media files in the stunfi-skins folder
 */
async function listMediaFiles(folder = 'stunfi-skins') {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500,
    });
    return result.resources || [];
  } catch (error) {
    console.error('Failed to list Cloudinary resources:', error);
    throw new Error(`Failed to list media files: ${error.message}`);
  }
}

/**
 * Get media statistics/info
 */
async function getMediaInfo(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Failed to get resource info:', error);
    throw new Error(`Failed to get media info: ${error.message}`);
  }
}

module.exports = {
  extractPublicIdFromUrl,
  deleteFromCloudinary,
  deleteMediaByUrl,
  getOptimizedUrl,
  listMediaFiles,
  getMediaInfo,
};
