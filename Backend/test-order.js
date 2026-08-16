const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function createTestOrder() {
  try {
    const form = new FormData();

    // Add client information
    form.append('clientName', 'Test Customer Full');
    form.append('whatsappNumber', '08012345678');
    form.append('deviceModel', 'MacBook Pro 16');
    form.append('category', 'laptop');
    form.append('orderId', `STN-${Math.floor(Math.random() * 9000 + 1000)}`);

    // Create placeholder artwork files (simple 1x1 pixel PNGs)
    const placeholderPNG = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x4B, 0x6E, 0x2E, 0xCE, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Add artwork files for each surface
    form.append('artwork_top-lid', placeholderPNG, 'top-lid.png');
    form.append('artwork_keyboard-deck', placeholderPNG, 'keyboard-deck.png');
    form.append('artwork_bottom-base', placeholderPNG, 'bottom-base.png');

    // Add surfaces data
    const surfaces = [
      { name: 'Top Lid', imageUrl: '', monogramText: '' },
      { name: 'Keyboard Deck', imageUrl: '', monogramText: '' },
      { name: 'Bottom Base', imageUrl: '', monogramText: '' }
    ];
    form.append('surfaces', JSON.stringify(surfaces));

    // Add items and pricing
    form.append('items', JSON.stringify([
      { label: 'Top Lid (Premium)', price: 4000 },
      { label: 'Keyboard Deck (Premium)', price: 4000 },
      { label: 'Bottom Base (Premium)', price: 3500 }
    ]));
    form.append('totalAmount', '11500');

    console.log('Submitting test order to http://localhost:3000/api/orders...');
    const response = await axios.post('http://localhost:3000/api/orders', form, {
      headers: form.getHeaders()
    });

    console.log('\n✅ Order created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    if (response.data.orderId) {
      console.log(`\nOrder ID: ${response.data.orderId}`);
      console.log('Now open http://localhost:3001/admin to view the order with artworks.');
    }
  } catch (error) {
    console.error('\n❌ Error creating order:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

createTestOrder();
