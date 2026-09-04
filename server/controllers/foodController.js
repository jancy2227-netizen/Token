const FoodRecord = require('../models/FoodRecord');
const BookingSession = require('../models/BookingSession');

// @desc    Log food preparation, served, and wasted quantities
// @route   POST /api/food
// @access  Private (Warden / Admin)
const createFoodRecord = async (req, res, next) => {
  try {
    const {
      sessionId,
      preparedVeg,
      preparedNonVeg,
      servedVeg,
      servedNonVeg,
      notes
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Please select a session.' });
    }

    const prepV = Number(preparedVeg) || 0;
    const prepNV = Number(preparedNonVeg) || 0;
    const srvV = Number(servedVeg) || 0;
    const srvNV = Number(servedNonVeg) || 0;

    const preparedQuantity = prepV + prepNV;
    const servedQuantity = srvV + srvNV;
    const remainingQuantity = Math.max(0, preparedQuantity - servedQuantity);
    const vegWaste = Math.max(0, prepV - srvV);
    const nonVegWaste = Math.max(0, prepNV - srvNV);
    const wastedQuantity = vegWaste + nonVegWaste;

    const wastePercentage =
      preparedQuantity > 0
        ? Number(((wastedQuantity / preparedQuantity) * 100).toFixed(2))
        : 0;

    const foodRecord = await FoodRecord.create({
      sessionId,
      preparedVeg: prepV,
      preparedNonVeg: prepNV,
      preparedQuantity,
      servedVeg: srvV,
      servedNonVeg: srvNV,
      servedQuantity,
      remainingQuantity,
      vegWaste,
      nonVegWaste,
      wastedQuantity,
      wastePercentage,
      notes,
      recordedBy: req.user.id
    });

    await foodRecord.populate('sessionId');

    res.status(201).json({
      success: true,
      message: 'Food waste and preparation record logged successfully!',
      foodRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all food waste and consumption records
// @route   GET /api/food
// @access  Private (Warden / Admin)
const getFoodRecords = async (req, res, next) => {
  try {
    const records = await FoodRecord.find()
      .populate('sessionId')
      .populate('recordedBy', 'name role')
      .sort({ recordedAt: -1 });

    // Compute aggregated waste statistics
    const totalPrepared = records.reduce((acc, r) => acc + (r.preparedQuantity || 0), 0);
    const totalServed = records.reduce((acc, r) => acc + (r.servedQuantity || 0), 0);
    const totalWasted = records.reduce((acc, r) => acc + (r.wastedQuantity || 0), 0);
    const totalVegWasted = records.reduce((acc, r) => acc + (r.vegWaste || 0), 0);
    const totalNonVegWasted = records.reduce((acc, r) => acc + (r.nonVegWaste || 0), 0);
    const averageWastePercent =
      totalPrepared > 0 ? Number(((totalWasted / totalPrepared) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      count: records.length,
      aggregates: {
        totalPrepared,
        totalServed,
        totalWasted,
        totalVegWasted,
        totalNonVegWasted,
        averageWastePercent
      },
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a food record
// @route   PUT /api/food/:id
// @access  Private (Admin)
const updateFoodRecord = async (req, res, next) => {
  try {
    const record = await FoodRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const {
      preparedVeg,
      preparedNonVeg,
      servedVeg,
      servedNonVeg,
      notes
    } = req.body;

    const prepV = preparedVeg !== undefined ? Number(preparedVeg) : record.preparedVeg;
    const prepNV = preparedNonVeg !== undefined ? Number(preparedNonVeg) : record.preparedNonVeg;
    const srvV = servedVeg !== undefined ? Number(servedVeg) : record.servedVeg;
    const srvNV = servedNonVeg !== undefined ? Number(servedNonVeg) : record.servedNonVeg;

    record.preparedVeg = prepV;
    record.preparedNonVeg = prepNV;
    record.preparedQuantity = prepV + prepNV;
    record.servedVeg = srvV;
    record.servedNonVeg = srvNV;
    record.servedQuantity = srvV + srvNV;
    record.remainingQuantity = Math.max(0, record.preparedQuantity - record.servedQuantity);
    record.vegWaste = Math.max(0, prepV - srvV);
    record.nonVegWaste = Math.max(0, prepNV - srvNV);
    record.wastedQuantity = record.vegWaste + record.nonVegWaste;
    record.wastePercentage =
      record.preparedQuantity > 0
        ? Number(((record.wastedQuantity / record.preparedQuantity) * 100).toFixed(2))
        : 0;

    if (notes !== undefined) record.notes = notes;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Food record updated successfully',
      foodRecord: record
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFoodRecord,
  getFoodRecords,
  updateFoodRecord
};
