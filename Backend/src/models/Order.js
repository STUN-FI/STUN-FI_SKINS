const mongoose = require('mongoose');

const SurfaceDesignSchema = new mongoose.Schema(
  {
    surface: { type: String },
    customText: { type: String },
    imageUrl: { type: String }, // Cloudinary or public URL
  },
  { _id: false }
);

const RetailDetailsSchema = new mongoose.Schema(
  {
    device: { type: String },
    coverage: [{ type: String }],
    finish: { type: String },
    customText: { type: String },
    surfaceDesigns: [SurfaceDesignSchema],
  },
  { _id: false }
);

const WholesaleDetailsSchema = new mongoose.Schema(
  {
    standardQty: { type: Number, default: 0 },
    shinyStonesQty: { type: Number, default: 0 },
    totalPaidUnits: { type: Number, default: 0 },
    freeBonusUnits: { type: Number, default: 0 },
    totalReceivedUnits: { type: Number, default: 0 },
    technicianRequested: { type: Boolean, default: false },
  },
  { _id: false }
);

const CustomerInfoSchema = new mongoose.Schema(
  {
    storeName: { type: String },
    contactName: { type: String },
    whatsappNumber: { type: String },
    storeAddress: { type: String },
  },
  { _id: false }
);

const SurfaceSchema = new mongoose.Schema(
  {
    name: { type: String },
    imageUrl: { type: String },
    monogramText: { type: String },
  },
  { _id: false }
);

const LineItemSchema = new mongoose.Schema(
  {
    label: { type: String },
    price: { type: Number },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    clientName: { type: String },
    whatsappNumber: { type: String },
    deviceModel: { type: String },
    category: { type: String },
    surfaces: [SurfaceSchema],
    items: [LineItemSchema],
    totalAmount: { type: Number, default: 0 },
    mode: { type: String, enum: ['individual', 'wholesale'], default: 'individual', required: true },
    customerInfo: CustomerInfoSchema,
    retailDetails: RetailDetailsSchema,
    wholesaleDetails: WholesaleDetailsSchema,
    pricing: {
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: 'NGN' },
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'In Production', 'Completed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
