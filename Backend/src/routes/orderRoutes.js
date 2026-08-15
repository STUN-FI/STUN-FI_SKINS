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
const WHOLESALE_STANDARD_PER_SHEET = 2000;
const WHOLESALE_SHINY_PER_SHEET = 2500;
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

function getSheetPrice(finish, mode = 'individual') {
  if (mode === 'wholesale') return finish === 'standard' ? WHOLESALE_STANDARD_PER_SHEET : WHOLESALE_SHINY_PER_SHEET;
  return finish === 'standard' ? BASE_PER_SHEET : BASE_PER_SHEET + SHINY_EXTRA_PER_SHEET;
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
    let surfaces = payload.surfaces || (body.surfaces ? JSON.parse(body.surfaces) : []) || [];
    const items = payload.items || (body.items ? JSON.parse(body.items) : []) || [];
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
    const uploadedUrls = [];
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

      // Upload all files to Cloudinary
      for (const file of req.files) {
        try {
          const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'stunfi-skins/designs',
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          });
          uploadedUrls.push(result.secure_url || result.url);
        } catch (uploadError) {
          console.error('Cloudinary upload failed:', uploadError);
          return res.status(500).json({
            success: false,
            error: `Failed to upload file: ${file.originalname}. ${uploadError.message}`,
          });
        }
      }
    }

    if (uploadedUrls.length > 0 && Array.isArray(surfaces)) {
      surfaces = surfaces.map((surface, index) => ({
        ...surface,
        imageUrl:
          surface?.imageUrl && typeof surface.imageUrl === 'string' && !surface.imageUrl.startsWith('blob:')
            ? surface.imageUrl
            : uploadedUrls[index] || '',
      }));
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
      const technicianRequested =
        body.technicianRequested === 'true' || body.technicianRequested === true || body.technician_requested === 'true' ||
        payload.wholesale?.technicianRequested === true || payload.wholesale?.technicianRequested === 'true' ||
        payload.wholesale?.technician_requested === 'true';
      const totalPaidUnits = standardQty + shinyStonesQty;
      const freeBonusUnits = Math.floor(totalPaidUnits / 12);
      const totalReceivedUnits = totalPaidUnits + freeBonusUnits;
      const technicianFee = technicianRequested ? totalPaidUnits * 500 : 0;
      const totalCost = standardQty * WHOLESALE_STANDARD_PER_SHEET + shinyStonesQty * WHOLESALE_SHINY_PER_SHEET + technicianFee;

      orderDoc.wholesaleDetails = {
        standardQty,
        shinyStonesQty,
        totalPaidUnits,
        freeBonusUnits,
        totalReceivedUnits,
        technicianRequested,
      };
      orderDoc.items = items.length > 0 ? items : [{ label: 'Wholesale order total', price: totalCost }];
      orderDoc.pricing.totalAmount = totalCost;
      orderDoc.totalAmount = totalAmount || totalCost;
    } else {
      // Individual / retail
      const device = body.device || payload.laptop?.model || payload.phone?.model || payload.controller?.subtype || 'laptop';
      let coverage = [];
      if (body.coverage) {
        try {
          coverage = typeof body.coverage === 'string' ? JSON.parse(body.coverage) : body.coverage;
        } catch (e) {
          coverage = String(body.coverage).split(',').map((s) => s.trim());
        }
      } else if (payload.phone?.coverage) {
        coverage = Array.isArray(payload.phone.coverage) ? payload.phone.coverage : [payload.phone.coverage];
      }
      const finish = body.finish || payload.laptop?.finish || payload.phone?.finish || payload.controller?.finish || 'standard';
      const customText =
        body.customText || body.custom_text ||
        payload.laptop?.customText || payload.phone?.customText || payload.controller?.gamerTag || payload.others?.instructions || '';
      const installRequested =
        body.installRequested === 'true' || body.installRequested === true || body.install_requested === 'true' ||
        payload.laptop?.installRequested === true || payload.laptop?.installRequested === 'true' ||
        payload.phone?.installRequested === true || payload.phone?.installRequested === 'true' ||
        payload.controller?.installRequested === true || payload.controller?.installRequested === 'true';
      const quantity = Number(body.quantity ?? payload.quantity ?? 1);

      let surfaceDesigns = [];
      if (body.surfaceDesigns) {
        try {
          surfaceDesigns = typeof body.surfaceDesigns === 'string' ? JSON.parse(body.surfaceDesigns) : body.surfaceDesigns;
        } catch (e) {
          surfaceDesigns = [];
        }
      } else if (payload.laptop?.selectedSurfaces) {
        surfaceDesigns = payload.laptop.selectedSurfaces.map((surface, idx) => ({
          surface,
          customText:
            Array.isArray(payload.laptop.customTexts)
              ? payload.laptop.customTexts.find((item) => item.surface === surface)?.text || ''
              : payload.laptop.customTexts?.find?.((item) => item.surface === surface)?.text || '' || '',
          imageUrl: '',
        }));
      } else if (Array.isArray(payload.surfaces) && payload.surfaces.length > 0) {
        surfaceDesigns = payload.surfaces.map((surface) => ({
          surface: surface.name || surface.surface,
          customText: surface.monogramText || surface.customText || '',
          imageUrl: surface.imageUrl || '',
        }));
      }

      if (uploadedUrls.length > 0) {
        if (surfaceDesigns && surfaceDesigns.length > 0) {
          for (let i = 0; i < uploadedUrls.length; i++) {
            surfaceDesigns[i] = { ...(surfaceDesigns[i] || {}), imageUrl: uploadedUrls[i] };
          }
        } else {
          surfaceDesigns = uploadedUrls.map((u, idx) => ({ surface: `upload-${idx + 1}`, customText: '', imageUrl: u }));
        }
      }

      let lineItems = [];
      const sheetPrice = getSheetPrice(finish, 'individual');
      const selectedCount = coverage.length;
      if (selectedCount > 0) {
        if (selectedCount === 3) {
          const packagePrice = finish === 'standard' ? FULL_LAPTOP_STANDARD : FULL_LAPTOP_SHINY;
          lineItems.push({ label: 'Full 3-piece laptop wrap', price: packagePrice });
        } else {
          coverage.forEach((item) => lineItems.push({ label: item, price: sheetPrice }));
        }
      }
      if (customText && customText.trim()) lineItems.push({ label: 'Custom name / monogram', price: NAME_PRINT });
      if (selectedCount === 3 && !installRequested) lineItems.push({ label: 'Self-application', price: -DIY_DISCOUNT });

      const total = lineItems.reduce((s, it) => s + (it.price || 0), 0) * quantity;

      orderDoc.retailDetails = {
        device,
        coverage,
        finish,
        customText,
        surfaceDesigns,
      };
      orderDoc.surfaces = surfaces.length > 0 ? surfaces : surfaceDesigns;
      orderDoc.items = items.length > 0 ? items : lineItems;
      orderDoc.pricing.totalAmount = totalAmount || total;
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
      return res.status(500).json({
        success: false,
        error: 'MongoDB connection unavailable. Unable to fetch orders.',
      });
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
