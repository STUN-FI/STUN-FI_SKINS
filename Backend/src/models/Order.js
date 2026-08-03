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

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
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

// Auto-generate a simple orderId like STN-1234
OrderSchema.pre('save', function (next) {
  if (!this.orderId) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.orderId = `STN-${rand}`;
  }
  next();
});

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
