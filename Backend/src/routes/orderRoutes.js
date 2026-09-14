const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { cloudinary } = require('../config/cloudinary');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { deleteMediaByUrl, extractPublicIdFromUrl, getOptimizedUrl, listMediaFiles } = require('../utils/cloudinaryUtils');

// File validation constants
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Pricing helpers (mirror frontend rules)
const WHOLESALE_STANDARD_PER_SHEET = 1000;
const WHOLESALE_SHINY_PER_SHEET = 1500;
const BASE_PER_SHEET = 3500;
const SHINY_EXTRA_PER_SHEET = 500;
const FULL_LAPTOP_STANDARD = 10000;
const FULL_LAPTOP_SHINY = 11500;
const NAME_PRINT = 1000;
const DIY_DISCOUNT = 1500;

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const STATUS_MAP = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  'in_production': 'In Production',
  'in production': 'In Production',
  completed: 'Completed',
};

function parseArrayField(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function getSheetPrice(finish, mode = 'individual') {
  if (mode === 'wholesale') return finish === 'standard' ? WHOLESALE_STANDARD_PER_SHEET : WHOLESALE_SHINY_PER_SHEET;
  return finish === 'standard' ? 3000 : 3500;
}

function getSurfaceLabel(surface = '') {
  return String(surface)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function getSelectedSurfaces(payload, body) {
  const explicit = body.laptopSelectedSurfaces || payload.laptop?.selectedSurfaces || payload.selectedSurfaces || [];
  const safeExplicit = Array.isArray(explicit) ? explicit : parseArrayField(explicit, []);

  if (safeExplicit.length > 0) {
    return safeExplicit;
  }

  return ['top-lid', 'keyboard-deck', 'bottom-base'];
}

function getLaptopCustomTextMap(payload, body) {
  const customTexts = payload.laptop?.customTexts || body.laptopTexts || payload.laptopTexts || {};

  if (Array.isArray(customTexts)) {
    return customTexts.reduce((acc, item) => {
      if (item && item.surface) {
        acc[item.surface] = item.text || '';
      }
      return acc;
    }, {});
  }

  if (customTexts && typeof customTexts === 'object') {
    return customTexts;
  }

  return {};
}

function getInstallOption(payload, body, category) {
  const categoryPayload = payload[category] || {};
  const explicitOption = categoryPayload.installOption || body[`${category}InstallOption`] || body.installOption || categoryPayload.installRequested || body.installRequested;

  if (explicitOption === 'diy') return 'diy';
  if (explicitOption === 'professional' || explicitOption === true || explicitOption === 'true') return 'professional';
  if (explicitOption === false || explicitOption === 'false') return 'diy';

  return 'professional';
}

function calculateRetailFallbackPricing({ category, payload, body, quantity = 1 }) {
  const lineItems = [];

  if (category === 'laptop') {
    const selectedSurfaces = getSelectedSurfaces(payload, body);
    const laptopFinishes = payload.laptop?.finishes || body.laptopFinishes || {};
    const laptopCustomTextMap = getLaptopCustomTextMap(payload, body);

    selectedSurfaces.forEach((surface) => {
      const finish = laptopFinishes[surface] || 'standard';
      const finishLabel = finish === 'shiny-stones' ? 'Shiny Stones' : 'Classic';
      const price = finish === 'shiny-stones' ? 3500 : 3000;
      lineItems.push({ label: `${getSurfaceLabel(surface)} - ${finishLabel}`, price });
    });

    const textSurfaceCount = selectedSurfaces.filter((surface) => (laptopCustomTextMap[surface] || '').trim()).length;
    if (textSurfaceCount > 0) {
      lineItems.push({
        label: 'Custom text overlay',
        price: textSurfaceCount === 3 ? 1000 : textSurfaceCount * 400,
      });
    }

    const allThreeSelected = selectedSurfaces.length === 3;
    const matchingQuality = allThreeSelected && selectedSurfaces.every((surface) => {
      const finish = laptopFinishes[surface] || 'standard';
      return finish === (laptopFinishes[selectedSurfaces[0]] || 'standard');
    });

    if (matchingQuality) {
      lineItems.push({ label: 'Matching finish discount', price: -500 });
    }

    if (getInstallOption(payload, body, 'laptop') === 'diy') {
      lineItems.push({ label: 'Self-application discount', price: -500 });
    }

    const total = lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0) * quantity;
    return { lineItems, total };
  }

  if (category === 'phone') {
    const customText = (payload.phone?.customText || body.customText || body.phoneCustomText || '').trim();
    const lineItems = [{ label: 'Phone Skin', price: 2000 }];

    if (customText) {
      lineItems.push({ label: 'Custom text', price: 300 });
    }

    if (getInstallOption(payload, body, 'phone') === 'diy') {
      lineItems.push({ label: 'Self-application', price: -500 });
    }

    const total = lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0) * quantity;
    return { lineItems, total };
  }

  if (category === 'controller') {
    const gamerTag = (payload.controller?.gamerTag || body.controllerGamerTag || body.gamerTag || '').trim();
    const lineItems = [{ label: `${payload.controller?.subtype || body.controllerSubtype || 'PS4'} Skin`, price: 2500 }];

    if (gamerTag) {
      lineItems.push({ label: 'Custom GamerTag / text', price: 300 });
    }

    if (getInstallOption(payload, body, 'controller') === 'diy') {
      lineItems.push({ label: 'Self-application', price: -500 });
    }

    const total = lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0) * quantity;
    return { lineItems, total };
  }

  return { lineItems: [], total: 0 };
}

function normalizeSurfaceKey(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getSurfaceAliases(surface = {}) {
  const names = [surface.name, surface.surface, surface.label, surface.slug, surface.key];
  const normalized = new Set();

  for (const value of names) {
    if (!value) continue;
    const key = normalizeSurfaceKey(value);
    if (key) normalized.add(key);

    const aliases = [
      key,
      key.replace(/-artwork$/, ''),
      key.replace(/-photo$/, ''),
      key.replace(/-reference$/, ''),
      key.replace(/-design$/, ''),
      key.replace(/-surface$/, ''),
      key.replace(/-wrap$/, ''),
      key.replace(/^reference-/, ''),
      key.replace(/^artwork-/, ''),
      key.replace(/^photo-/, ''),
      key.replace(/^design-/, ''),
      key.replace(/^(?:reference|artwork|photo|design)-?/, ''),
    ];

    aliases.forEach((alias) => {
      if (alias) normalized.add(alias);
    });
  }

  return [...normalized];
}

function resolveUploadedSurfaceUrls(surfaces, uploadedUrlsByField = {}) {
  if (!Array.isArray(surfaces) || Object.keys(uploadedUrlsByField).length === 0) {
    return surfaces;
  }

  const surfaceUrlMap = new Map();

  Object.entries(uploadedUrlsByField).forEach(([fieldName, url]) => {
    const candidates = [
      normalizeSurfaceKey(fieldName),
      normalizeSurfaceKey(fieldName.replace(/^artwork_/, '')),
      normalizeSurfaceKey(fieldName.replace(/^reference_/, '')),
      normalizeSurfaceKey(fieldName.replace(/^artwork-/, '')),
      normalizeSurfaceKey(fieldName.replace(/^reference-/, '')),
      normalizeSurfaceKey(fieldName.replace(/^artwork/, '').replace(/^reference/, '')),
    ];

    candidates.forEach((candidate) => {
      if (candidate) surfaceUrlMap.set(candidate, url);
    });
  });

  return surfaces.map((surface) => {
    const aliases = getSurfaceAliases(surface);
    const match = aliases.find((alias) => surfaceUrlMap.has(alias));
    const matchedUrl = match ? surfaceUrlMap.get(match) : '';

    if (matchedUrl) {
      return {
        ...surface,
        imageUrl: matchedUrl,
      };
    }

    return {
      ...surface,
      imageUrl:
        surface?.imageUrl && typeof surface.imageUrl === 'string' && !surface.imageUrl.startsWith('blob:')
          ? surface.imageUrl
          : '',
    };
  });
}

router.post('/', upload.any(), async (req, res) => {
  try {
    // Accept both multipart/form-data and JSON bodies
    const body = req.body || {};
    let payload = {};
    if (body.orderPayload) {
      try {
        payload = typeof body.orderPayload === 'string' ? JSON.parse(body.orderPayload) : body.orderPayload;
      } catch (parseError) {
        payload = {};
      }
    }

    const mode = (body.mode || payload.mode || 'individual').toString().toLowerCase();

    const orderId = body.orderId || payload.orderId || `STN-${Math.floor(1000 + Math.random() * 9000)}`;
    const clientName = (body.clientName || payload.clientName || '').trim();
    const whatsappNumber = (body.whatsappNumber || payload.whatsappNumber || '').trim();
    const deviceModel = body.deviceModel || payload.deviceModel || '';
    const sanitizedPhone = whatsappNumber.replace(/\D/g, '');

    if (!clientName || !whatsappNumber || sanitizedPhone.length < 10 || sanitizedPhone.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and a valid phone number are required before submitting an order.',
      });
    }
    const category = body.category || payload.category || '';
    let surfaces = payload.surfaces || parseArrayField(body.surfaces);
    const items = payload.items || parseArrayField(body.items);
    const totalAmount = Number(body.totalAmount ?? payload.totalAmount ?? 0);
    const payloadLaptop = payload.laptop || {};
    const payloadPhone = payload.phone || {};
    const payloadController = payload.controller || {};
    const payloadOthers = payload.others || {};

    // Customer info
    const customerInfo = {
      storeName: body.storeName || body.store_name || payload.storeName || payload.store_name || '',
      contactName: body.clientName || payload.clientName || body.contactName || body.contact_name || '',
      whatsappNumber,
      storeAddress: body.storeAddress || body.store_address || payload.storeAddress || payload.store_address || '',
    };

    // Handle file uploads to Cloudinary (required)
    const uploadedUrlsByField = {};

    if (req.body && typeof req.body === 'object') {
      for (const [fieldName, value] of Object.entries(req.body)) {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        const isArtworkField = fieldName.startsWith('artwork_') || fieldName.startsWith('reference_') || fieldName.startsWith('photo_') || fieldName.startsWith('design_');

        if (isArtworkField && trimmed && /^(https?:\/\/|data:)/i.test(trimmed)) {
          uploadedUrlsByField[fieldName] = trimmed;
        }
      }
    }

    if (req.files && req.files.length > 0) {
      // Validate all files before uploading
      for (const file of req.files) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: `Invalid file type: ${file.originalname}. Allowed types: JPEG, PNG, WebP, GIF`,
          });
        }
        if (file.buffer.length > MAX_FILE_SIZE) {
          return res.status(400).json({
            success: false,
            error: `File too large: ${file.originalname}. Maximum size: 10MB`,
          });
        }
      }

      // Upload all files to Cloudinary and preserve the original field name so the correct surface gets the image
      for (const file of req.files) {
        try {
          const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'stunfi-skins/designs',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          });
          uploadedUrlsByField[file.fieldname] = result.secure_url || result.url;
        } catch (uploadError) {
          console.error('Cloudinary upload failed:', uploadError);
          return res.status(500).json({
            success: false,
            error: `Failed to upload file: ${file.originalname}. ${uploadError.message}`,
          });
        }
      }
    }

    if (Object.keys(uploadedUrlsByField).length > 0 && Array.isArray(surfaces)) {
      surfaces = resolveUploadedSurfaceUrls(surfaces, uploadedUrlsByField);
    }

    const orderDoc = {
      orderId,
      clientName,
      whatsappNumber,
      deviceModel,
      category,
      surfaces,
      items,
      totalAmount,
      mode,
      customerInfo,
      retailDetails: undefined,
      wholesaleDetails: undefined,
      pricing: { totalAmount: totalAmount || 0, currency: 'NGN' },
      status: 'Pending',
    };

    if (mode === 'wholesale') {
      const standardQty = Number(body.standardQty || body.standard_qty || payload.wholesale?.standardQty || payload.wholesale?.standard_qty || 0);
      const shinyStonesQty = Number(body.shinyStonesQty || body.shiny_stones_qty || payload.wholesale?.shinyStonesQty || payload.wholesale?.shiny_stones_qty || 0);
      const totalPaidUnits = standardQty + shinyStonesQty;
      const freeBonusUnits = Math.floor(totalPaidUnits / 12);
      const totalReceivedUnits = totalPaidUnits + freeBonusUnits;
      const totalCost = standardQty * WHOLESALE_STANDARD_PER_SHEET + shinyStonesQty * WHOLESALE_SHINY_PER_SHEET;

      orderDoc.wholesaleDetails = {
        standardQty,
        shinyStonesQty,
        totalPaidUnits,
        freeBonusUnits,
        totalReceivedUnits,
      };
      orderDoc.items = items.length > 0 ? items : [{ label: 'Wholesale order total', price: totalCost }];
      orderDoc.pricing.totalAmount = totalCost;
      orderDoc.totalAmount = totalAmount || totalCost;
    } else {
      // Individual / retail
      const device = body.device || payload.device || payload.laptop?.model || payload.phone?.model || payload.controller?.subtype || 'laptop';
      let coverage = [];
      if (body.coverage) {
        coverage = parseArrayField(body.coverage);
      } else if (payload.phone?.coverage) {
        coverage = Array.isArray(payload.phone.coverage) ? payload.phone.coverage : [payload.phone.coverage];
      }
      const finish = body.finish || payload.laptop?.finish || payload.phone?.finish || payload.controller?.finish || 'standard';
      const customText =
        body.customText || body.custom_text ||
        payload.laptop?.customText || payload.phone?.customText || payload.controller?.gamerTag || payload.others?.instructions || '';
      const quantity = Number(body.quantity ?? payload.quantity ?? 1);

      let surfaceDesigns = [];
      if (body.surfaceDesigns) {
        try {
          surfaceDesigns = typeof body.surfaceDesigns === 'string' ? JSON.parse(body.surfaceDesigns) : body.surfaceDesigns;
        } catch (e) {
          surfaceDesigns = [];
        }
      } else if (payload.laptop?.selectedSurfaces) {
        surfaceDesigns = payload.laptop.selectedSurfaces.map((surface) => ({
          surface,
          customText:
            Array.isArray(payload.laptop.customTexts)
              ? payload.laptop.customTexts.find((item) => item.surface === surface)?.text || ''
              : payload.laptop.customTexts?.find?.((item) => item.surface === surface)?.text || '',
          imageUrl: '',
        }));
      } else if (Array.isArray(surfaces) && surfaces.length > 0) {
        surfaceDesigns = surfaces.map((surface) => ({
          surface: surface.name || surface.surface,
          customText: surface.monogramText || surface.customText || '',
          imageUrl: surface.imageUrl || '',
        }));
      }

      if (Object.keys(uploadedUrlsByField).length > 0) {
        if (Array.isArray(surfaceDesigns) && surfaceDesigns.length > 0) {
          surfaceDesigns = resolveUploadedSurfaceUrls(surfaceDesigns, uploadedUrlsByField);
        } else {
          surfaceDesigns = Object.values(uploadedUrlsByField).map((u, idx) => ({ surface: `upload-${idx + 1}`, customText: '', imageUrl: u }));
        }
      }

      const categoryForPricing = category || (payload.laptop?.selectedSurfaces ? 'laptop' : payload.phone ? 'phone' : payload.controller ? 'controller' : 'others');
      const fallbackPricing = calculateRetailFallbackPricing({
        category: categoryForPricing,
        payload,
        body,
        quantity,
      });

      let lineItems = items.length > 0 ? items : fallbackPricing.lineItems;
      const computedTotal = items.length > 0
        ? lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
        : fallbackPricing.total;
      const resolvedTotal = totalAmount > 0 ? totalAmount : computedTotal;

      orderDoc.retailDetails = {
        device,
        coverage,
        finish,
        customText,
        surfaceDesigns,
      };
      orderDoc.surfaces = surfaces.length > 0 ? surfaces : surfaceDesigns;
      orderDoc.items = lineItems;
      orderDoc.pricing.totalAmount = resolvedTotal;
      orderDoc.totalAmount = orderDoc.pricing.totalAmount;
    }

    if (!isDbConnected()) {
      return res.status(500).json({
        success: false,
        error: 'MongoDB connection unavailable. Order persistence requires a working database.',
      });
    }

    const order = new Order(orderDoc);
    await order.save();

    return res.status(201).json({ success: true, orderId: order.orderId, order });
  } catch (err) {
    console.error('Order create error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      console.warn('MongoDB connection unavailable. Returning empty order list for admin view.');
      return res.json({ success: true, count: 0, orders: [] });
    }

    const filters = {};
    const { mode, status } = req.query;

    if (mode && typeof mode === 'string') {
      if (['individual', 'wholesale'].includes(mode.toLowerCase())) {
        filters.mode = mode.toLowerCase();
      }
    }

    if (status && typeof status === 'string') {
      const normalizedStatus = STATUS_MAP[status.toLowerCase().trim().replace(/\s+/g, ' ')] || STATUS_MAP[status.toLowerCase().trim()];
      if (normalizedStatus) {
        filters.status = normalizedStatus;
      }
    }

    const orders = await Order.find(filters).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('Orders fetch error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/customer/:identifier', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(500).json({
        success: false,
        error: 'MongoDB connection unavailable. Unable to fetch orders.',
      });
    }

    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, error: 'Customer identifier (phone number or name) is required' });
    }

    const filters = {
      $or: [
        { whatsappNumber: identifier },
        { clientName: { $regex: identifier, $options: 'i' } },
      ],
    };

    const orders = await Order.find(filters).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('Customer orders fetch error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const normalizedStatus = typeof status === 'string'
      ? STATUS_MAP[status.toLowerCase().trim().replace(/\s+/g, ' ')] || STATUS_MAP[status.toLowerCase().trim()]
      : undefined;

    if (!normalizedStatus) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${Object.values(STATUS_MAP).join(', ')}`,
      });
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status: normalizedStatus },
      { new: true, runValidators: true },
    ).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, order });
  } catch (err) {
    console.error('Order status update error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, order });
  } catch (err) {
    console.error('Order fetch error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOneAndDelete({ orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, message: 'Order deleted successfully', orderId });
  } catch (err) {
    console.error('Order delete error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// MEDIA MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * DELETE /media/:mediaId
 * Delete a specific media file from Cloudinary by its public ID
 */
router.delete('/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    if (!mediaId) {
      return res.status(400).json({
        success: false,
        error: 'Media ID (public ID) is required',
      });
    }

    // Decode the mediaId if it's URL-encoded
    const decodedMediaId = decodeURIComponent(mediaId);

    await cloudinary.uploader.destroy(decodedMediaId);

    return res.json({
      success: true,
      message: 'Media deleted successfully from Cloudinary',
      mediaId: decodedMediaId,
    });
  } catch (err) {
    console.error('Media delete error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /media/url/:encodedUrl
 * Delete a media file by passing its Cloudinary URL (URL needs to be encoded)
 */
router.delete('/media/url/:encodedUrl', async (req, res) => {
  try {
    const { encodedUrl } = req.params;
    const url = decodeURIComponent(encodedUrl);

    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract public ID from the provided URL',
      });
    }

    await cloudinary.uploader.destroy(publicId);

    return res.json({
      success: true,
      message: 'Media deleted successfully from Cloudinary',
      publicId,
    });
  } catch (err) {
    console.error('Media delete by URL error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /media/list
 * List all media files in the stunfi-skins folder from Cloudinary
 */
router.get('/media/list', async (req, res) => {
  try {
    const mediaFiles = await listMediaFiles('stunfi-skins');

    return res.json({
      success: true,
      count: mediaFiles.length,
      media: mediaFiles.map(file => ({
        publicId: file.public_id,
        url: file.secure_url || file.url,
        format: file.format,
        width: file.width,
        height: file.height,
        bytes: file.bytes,
        createdAt: file.created_at,
      })),
    });
  } catch (err) {
    console.error('Media list error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /media/optimize
 * Get an optimized URL for a media file with custom transformations
 * Body: { url, width, height, quality, format, fit }
 */
router.post('/media/optimize', (req, res) => {
  try {
    const { url, width, height, quality, format, fit } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    const optimizedUrl = getOptimizedUrl(url, {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      quality: quality || 'auto',
      format: format || 'auto',
      fit: fit || 'scale',
    });

    return res.json({
      success: true,
      originalUrl: url,
      optimizedUrl,
    });
  } catch (err) {
    console.error('Media optimize error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
