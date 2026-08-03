const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const Order = require('../models/Order');
const mongoose = require('mongoose');

const inMemoryOrders = [];

// Pricing helpers (mirror frontend rules)
const WHOLESALE_STANDARD_PER_SHEET = 2000;
const WHOLESALE_SHINY_PER_SHEET = 2500;
const BASE_PER_SHEET = 3500;
const SHINY_EXTRA_PER_SHEET = 500;
const FULL_LAPTOP_STANDARD = 10000;
const FULL_LAPTOP_SHINY = 11500;
const NAME_PRINT = 1000;
const DIY_DISCOUNT = 1500;

function getSheetPrice(finish, mode = 'individual') {
  if (mode === 'wholesale') return finish === 'standard' ? WHOLESALE_STANDARD_PER_SHEET : WHOLESALE_SHINY_PER_SHEET;
  return finish === 'standard' ? BASE_PER_SHEET : BASE_PER_SHEET + SHINY_EXTRA_PER_SHEET;
}

router.post('/', upload.any(), async (req, res) => {
  try {
    // Accept both multipart/form-data and JSON bodies
    const body = req.body || {};
    const mode = (body.mode || 'individual').toLowerCase();

    // Customer info
    const customerInfo = {
      storeName: body.storeName || body.store_name || '',
      contactName: body.contactName || body.contact_name || '',
      whatsappNumber: body.whatsappNumber || body.whatsapp_number || '',
      storeAddress: body.storeAddress || body.store_address || '',
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

    // Build order document skeleton
    const orderDoc = {
      mode,
      customerInfo,
      retailDetails: undefined,
      wholesaleDetails: undefined,
      pricing: { totalAmount: 0, currency: 'NGN' },
      status: 'Pending',
    };

    if (mode === 'wholesale') {
      const standardQty = Number(body.standardQty || body.standard_qty || 0);
      const shinyStonesQty = Number(body.shinyStonesQty || body.shiny_stones_qty || 0);
      const technicianRequested = (body.technicianRequested === 'true' || body.technicianRequested === true || body.technician_requested === 'true');
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

      orderDoc.pricing.totalAmount = totalCost;
    } else {
      // Individual / retail
      const device = body.device || 'laptop';
      let coverage = [];
      if (body.coverage) {
        try { coverage = typeof body.coverage === 'string' ? JSON.parse(body.coverage) : body.coverage; } catch (e) { coverage = String(body.coverage).split(',').map(s=>s.trim()); }
      }
      const finish = body.finish || 'standard';
      const customText = body.customText || body.custom_text || '';
      const installRequested = (body.installRequested === 'true' || body.installRequested === true || body.install_requested === 'true');
      const quantity = Number(body.quantity || 1);

      // Surface designs: try parse if provided, else use uploadedUrls
      let surfaceDesigns = [];
      if (body.surfaceDesigns) {
        try { surfaceDesigns = typeof body.surfaceDesigns === 'string' ? JSON.parse(body.surfaceDesigns) : body.surfaceDesigns; } catch (e) { surfaceDesigns = [] }
      }
      // If uploaded files exist and map to surfaces, attach urls
      if (uploadedUrls.length > 0) {
        // If surfaceDesigns provided, attach images in order; else create entries
        if (surfaceDesigns && surfaceDesigns.length > 0) {
          for (let i = 0; i < uploadedUrls.length; i++) {
            surfaceDesigns[i] = { ...(surfaceDesigns[i] || {}), imageUrl: uploadedUrls[i] };
          }
        } else {
          surfaceDesigns = uploadedUrls.map((u, idx) => ({ surface: `upload-${idx+1}`, customText: '', imageUrl: u }));
        }
      }

      // Pricing calculation
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

      orderDoc.pricing.totalAmount = total;
    }

    // Save order if DB connected, otherwise return a simulated order response
    let savedOrder = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const order = new Order(orderDoc);
      await order.save();
      savedOrder = order;
    } else {
      const rand = Math.floor(1000 + Math.random() * 9000);
      savedOrder = { orderId: `SIM-${rand}`, ...orderDoc, createdAt: new Date().toISOString() };
      inMemoryOrders.unshift(savedOrder);
    }

    return res.status(201).json({ success: true, orderId: savedOrder.orderId, order: savedOrder });
  } catch (err) {
    console.error('Order create error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filters = {};
    const { mode, status } = req.query;

    if (mode && typeof mode === 'string') {
      if (['individual', 'wholesale'].includes(mode.toLowerCase())) {
        filters.mode = mode.toLowerCase();
      }
    }

    if (status && typeof status === 'string') {
      filters.status = status;
    }

    const mongoose = require('mongoose');
    let orders = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      orders = await Order.find(filters).sort({ createdAt: -1 }).lean();
    } else {
      console.warn('MongoDB not connected; returning simulated orders list.');
      orders = [...inMemoryOrders].filter((order) => {
        if (filters.mode && order.mode !== filters.mode) return false;
        if (filters.status && order.status !== filters.status) return false;
        return true;
      });
    }

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
    const validStatuses = ['Pending', 'Confirmed', 'In Production', 'Completed'];

    if (!status || typeof status !== 'string' || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status },
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
