require('dotenv').config();
const mongoose = require('mongoose');
const { cloudinary } = require('./src/config/cloudinary');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

function log(status, message) {
  const icon = status === 'success' ? '✓' : status === 'error' ? '✗' : 'ℹ';
  const color = status === 'success' ? GREEN : status === 'error' ? RED : YELLOW;
  console.log(`${color}${icon}${RESET} ${message}`);
}

async function testConnections() {
  console.log(`\n${BLUE}=== STUN-FI Connection Test ===${RESET}\n`);

  let allPassed = true;

  // Test 1: Environment Variables
  console.log(`${BLUE}1. Checking Environment Variables...${RESET}`);
  const requiredVars = ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'PORT'];
  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    log('error', `Missing environment variables: ${missingVars.join(', ')}`);
    allPassed = false;
  } else {
    log('success', 'All required environment variables present');
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI.substring(0, 50)}...`);
  }

  // Test 2: Cloudinary Configuration
  console.log(`\n${BLUE}2. Testing Cloudinary Connection...${RESET}`);
  try {
    const result = await cloudinary.api.resources({ max_results: 1 });
    log('success', 'Cloudinary connected successfully');
    console.log(`   Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   Resources accessible: Yes`);
  } catch (error) {
    log('error', `Cloudinary connection failed: ${error.message}`);
    allPassed = false;
  }

  // Test 3: MongoDB Connection
  console.log(`\n${BLUE}3. Testing MongoDB Connection...${RESET}`);
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      log('error', 'MONGODB_URI is not set');
      allPassed = false;
    } else {
      await mongoose.connect(mongoUri);
      log('success', 'MongoDB connected successfully');

      // Check connection state
      const state = mongoose.connection.readyState;
      const stateText = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      }[state];

      console.log(`   Connection State: ${stateText} (${state})`);
      console.log(`   Database: ${mongoose.connection.name}`);

      // Try a simple operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`   Collections: ${collections.map((c) => c.name).join(', ') || 'None'}`);

      await mongoose.disconnect();
      log('success', 'MongoDB disconnected cleanly');
    }
  } catch (error) {
    log('error', `MongoDB connection failed: ${error.message}`);
    allPassed = false;
  }

  // Test 4: File Upload Simulation
  console.log(`\n${BLUE}4. Testing Cloudinary File Upload...${RESET}`);
  try {
    // Create a small test image (1x1 pixel white PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const dataUri = `data:image/png;base64,${testImageBase64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'stunfi-skins/test',
      tags: 'test-connection',
    });

    log('success', 'Test file uploaded to Cloudinary');
    console.log(`   Public ID: ${result.public_id}`);
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Size: ${result.bytes} bytes`);

    // Clean up test file
    try {
      await cloudinary.uploader.destroy(result.public_id);
      log('success', 'Test file cleaned up');
    } catch (cleanupError) {
      log('error', `Failed to clean up test file: ${cleanupError.message}`);
    }
  } catch (error) {
    log('error', `File upload test failed: ${error.message}`);
    allPassed = false;
  }

  // Summary
  console.log(`\n${BLUE}=== Summary ===${RESET}`);
  if (allPassed) {
    log('success', 'All connections are working! Ready for production.');
    console.log(`\n✓ MongoDB: Connected`);
    console.log(`✓ Cloudinary: Connected`);
    console.log(`✓ Environment: Valid`);
    process.exit(0);
  } else {
    log('error', 'Some connections failed. Check the errors above.');
    process.exit(1);
  }
}

testConnections().catch((error) => {
  log('error', `Unexpected error: ${error.message}`);
  process.exit(1);
});
