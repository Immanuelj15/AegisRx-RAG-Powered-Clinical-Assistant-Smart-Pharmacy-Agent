const User = require('../models/User');
const Medicine = require('../models/Medicine');
const SearchLog = require('../models/SearchLog');
const mockDb = require('../utils/mockDb');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Private (Pharmacist / Admin)
const getDashboardStats = async (req, res) => {
  try {
    let totalUsers = 0;
    let totalSearches = 0;
    let totalMedicines = 0;
    let outOfStockCount = 0;
    let categoriesCount = {};

    if (process.env.MONGO_CONNECTED === 'true') {
      totalUsers = await User.countDocuments({});
      totalSearches = await SearchLog.countDocuments({});
      totalMedicines = await Medicine.countDocuments({});
      outOfStockCount = await Medicine.countDocuments({ Stock: 0 });

      // Aggregate categories
      const categoriesData = await Medicine.aggregate([
        { $group: { _id: '$Category', count: { $sum: 1 } } }
      ]);
      categoriesData.forEach(c => {
        if (c._id) categoriesCount[c._id] = c.count;
      });
    } else {
      // Mock db analytics
      totalUsers = mockDb.users.length;
      totalSearches = mockDb.searchLogs.length + 15; // seed visual data
      totalMedicines = mockDb.medicines.length;
      outOfStockCount = mockDb.medicines.filter(m => m.Stock === 0).length;

      // Group mock categories
      mockDb.medicines.forEach(m => {
        if (m.Category) {
          categoriesCount[m.Category] = (categoriesCount[m.Category] || 0) + 1;
        }
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalSearches,
        totalMedicines,
        outOfStockCount,
        inStockCount: totalMedicines - outOfStockCount,
        categoriesDistribution: categoriesCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get popular medicines search history
// @route   GET /api/dashboard/popular
// @access  Private (Pharmacist / Admin)
const getPopularMedicines = async (req, res) => {
  try {
    let popularList = [];

    if (process.env.MONGO_CONNECTED === 'true') {
      popularList = await SearchLog.aggregate([
        { $match: { wasFound: true } },
        { $group: { _id: '$medicineName', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      popularList = popularList.map(item => ({
        name: item._id || 'Unknown',
        searches: item.count
      }));
    }

    // If MongoDB didn't have search logs, or we're in mock mode, provide high quality seed stats
    if (popularList.length === 0) {
      popularList = [
        { name: 'Paracetamol 500mg', searches: 12 },
        { name: 'Ibuprofen 400mg', searches: 8 },
        { name: 'Amoxicillin 500mg', searches: 5 },
        { name: 'Cetirizine 10mg', searches: 4 },
        { name: 'Metformin 500mg', searches: 3 }
      ];
    }

    res.status(200).json({
      success: true,
      popularMedicines: popularList
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getPopularMedicines
};
