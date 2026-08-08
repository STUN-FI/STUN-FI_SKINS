const mongoose = require('mongoose');
const dns = require('dns');
const dnsPromises = dns.promises;
const { URL } = require('url');

const buildFallbackMongoUri = async (srvUri) => {
  const uri = new URL(srvUri);
  if (uri.protocol !== 'mongodb+srv:') {
    return srvUri;
  }

  const host = uri.hostname;
  dns.setServers(['8.8.8.8', '1.1.1.1', '9.9.9.9']);

  const srvRecords = await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
  if (!srvRecords || srvRecords.length === 0) {
    throw new Error(`No SRV records found for ${host}`);
  }

  const hostList = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');
  const auth = uri.username ? `${encodeURIComponent(uri.username)}${uri.password ? `:${encodeURIComponent(uri.password)}` : ''}@` : '';
  const pathname = uri.pathname || '';
  const search = uri.search || '';

  return `mongodb://${auth}${hostList}${pathname}${search}`;
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set in environment. Running without MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      // options are optional with mongoose >=6
    });
    console.log('MongoDB Connected Successfully');
    return;
  } catch (err) {
    const errorMessage = err.message || String(err);
    console.warn('MongoDB connection error:', errorMessage);

    if (typeof uri === 'string' && uri.startsWith('mongodb+srv://') && errorMessage.includes('querySrv')) {
      try {
        console.warn('Retrying MongoDB connection using explicit host list fallback.');
        const fallbackUri = await buildFallbackMongoUri(uri);
        await mongoose.connect(fallbackUri, {
          // options are optional with mongoose >=6
        });
        console.log('MongoDB Connected Successfully using fallback URI');
        return;
      } catch (fallbackErr) {
        console.warn('MongoDB fallback connection error:', fallbackErr.message || fallbackErr);
      }
    }

    console.warn('Continuing without MongoDB. Orders will be created with simulated IDs.');
  }
};

module.exports = connectDB;
