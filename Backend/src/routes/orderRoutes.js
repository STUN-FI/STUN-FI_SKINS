const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const Order = require('../models/Order');
const mongoose = require('mongoose');

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

    const orderId = body.orderId || payload.orderId || undefined;
    const clientName = body.clientName || payload.clientName || '';
    const whatsappNumber = body.whatsappNumber || payload.whatsappNumber || '';
    const deviceModel = body.deviceModel || payload.deviceModel || '';
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

    // Handle file uploads to Cloudinary if present and configured
    const uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured) {
        console.warn('Cloudinary upload skipped because configuration is missing.');
      } else {
        for (const file of req.files) {
          const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'stunfi-skins/designs',
          });
          uploadedUrls.push(result.secure_url || result.url);
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
      if (selectedCount === 3 && !installRequested) lineItems.push({ label: 'DIY discount', price: -DIY_DISCOUNT });

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

module.exports = router;
