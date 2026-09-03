const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const mongoose = require('mongoose');

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, entries: [] });
    }

    const entries = await JournalEntry.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, entries });
  } catch (error) {
    console.error('Journal fetch error', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Journal entries cannot be saved right now.' });
    }

    const { title, body, category } = req.body || {};
    const safeTitle = typeof title === 'string' ? title.trim() : '';
    const safeBody = typeof body === 'string' ? body.trim() : '';
    const safeCategory = ['Operations', 'Client', 'Production', 'Notes'].includes(category) ? category : 'Notes';

    if (!safeTitle && !safeBody) {
      return res.status(400).json({ success: false, error: 'Title or notes are required.' });
    }

    const entry = await JournalEntry.create({
      title: safeTitle || 'Untitled note',
      body: safeBody,
      category: safeCategory,
      createdAt: new Date(),
    });

    return res.status(201).json({ success: true, entry });
  } catch (error) {
    console.error('Journal create error', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Journal entries cannot be updated right now.' });
    }

    const { title, body, category } = req.body || {};
    const updates = {};

    if (typeof title === 'string') updates.title = title.trim() || 'Untitled note';
    if (typeof body === 'string') updates.body = body.trim();
    if (typeof category === 'string' && ['Operations', 'Client', 'Production', 'Notes'].includes(category)) {
      updates.category = category;
    }

    const entry = await JournalEntry.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Journal entry not found.' });
    }

    return res.json({ success: true, entry });
  } catch (error) {
    console.error('Journal update error', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Journal entries cannot be deleted right now.' });
    }

    const deleted = await JournalEntry.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Journal entry not found.' });
    }

    return res.json({ success: true, message: 'Journal entry deleted successfully.' });
  } catch (error) {
    console.error('Journal delete error', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
