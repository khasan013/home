const express = require('express');
const Meal = require('../models/Meal');
const Home = require('../models/Home'); // ✅ required
const auth = require('../middleware/auth');

const router = express.Router();

// ✅ helper (same logic, just cleaner)
const isAdmin = (home, userId) => {
  return home.members.some(
    (m) => m.user.toString() === userId && m.role === 'admin'
  );
};

// ─────────────────────────────────────────
// CREATE (ALL USERS)
// ─────────────────────────────────────────
router.post('/:homeId', auth, async (req, res) => {
  try {
    const { homeId } = req.params;

    // ✅ FIX: check home exists
    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).json({ message: 'Home not found' });
    }

    // ✅ FIX: check membership
    const isMember = home.members.some(
      (m) => m.user.toString() === req.user.userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this home' });
    }

    // ✅ YOUR ORIGINAL LOGIC (safe)
    const meal = await Meal.create({
      homeId: homeId,
      userId: req.user.userId,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      mealCount: Number(req.body.mealCount) || 0,
      eggsCount: Number(req.body.eggsCount) || 0,
    });

    res.json(meal);

  } catch (err) {
    console.error('CREATE MEAL ERROR:', err); // 🔥 important
    res.status(500).json({
      message: 'Failed to create meal',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────
// GET (WITH USER NAME)
// ─────────────────────────────────────────
router.get('/:homeId', auth, async (req, res) => {
  try {
    const meals = await Meal.find({ homeId: req.params.homeId })
      .populate('userId', 'firstName email') // ✅ IMPORTANT
      .sort({ date: -1 });

    res.json(meals);

  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch meals',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────
// UPDATE (ADMIN ONLY)
// ─────────────────────────────────────────
router.put('/:homeId/:mealId', auth, async (req, res) => {
  try {
    const home = await Home.findById(req.params.homeId);

    if (!home || !isAdmin(home, req.user.userId)) {
      return res.status(403).json({
        message: 'Only admin can edit meals',
      });
    }

    const meal = await Meal.findOneAndUpdate(
      {
        _id: req.params.mealId,
        homeId: req.params.homeId,
      },
      {
        date: req.body.date ? new Date(req.body.date) : undefined,
        mealCount: Number(req.body.mealCount) || 0,
        eggsCount: Number(req.body.eggsCount) || 0,
      },
      { new: true }
    );

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json(meal);

  } catch (err) {
    res.status(500).json({
      message: 'Failed to update meal',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────
// DELETE (ADMIN ONLY)
// ─────────────────────────────────────────
router.delete('/:homeId/:mealId', auth, async (req, res) => {
  try {
    const home = await Home.findById(req.params.homeId);

    if (!home || !isAdmin(home, req.user.userId)) {
      return res.status(403).json({
        message: 'Only admin can delete meals',
      });
    }

    const meal = await Meal.findOneAndDelete({
      _id: req.params.mealId,
      homeId: req.params.homeId,
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json({ message: 'Deleted' });

  } catch (err) {
    res.status(500).json({
      message: 'Failed to delete meal',
      error: err.message,
    });
  }
});

module.exports = router;