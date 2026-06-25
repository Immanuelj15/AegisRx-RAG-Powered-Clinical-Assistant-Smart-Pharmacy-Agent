const { prisma } = require('../config/db');
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

    if (process.env.DB_CONNECTED === 'true') {
      totalUsers = await prisma.user.count();
      totalSearches = await prisma.searchLog.count();
      totalMedicines = await prisma.medicine.count();
      outOfStockCount = await prisma.medicine.count({ where: { Stock: 0 } });

      const categoriesData = await prisma.medicine.groupBy({
        by: ['Category'],
        _count: { Category: true }
      });
      categoriesData.forEach(c => {
        if (c.Category) categoriesCount[c.Category] = c._count.Category;
      });
    } else {
      totalUsers = mockDb.users.length;
      totalSearches = mockDb.searchLogs.length + 15;
      totalMedicines = mockDb.medicines.length;
      outOfStockCount = mockDb.medicines.filter(m => m.Stock === 0).length;

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

    if (process.env.DB_CONNECTED === 'true') {
      const grouped = await prisma.searchLog.groupBy({
        by: ['medicineName'],
        where: { wasFound: true, medicineName: { not: null } },
        _count: { medicineName: true },
        orderBy: { _count: { medicineName: 'desc' } },
        take: 5
      });
      
      popularList = grouped.map(item => ({
        name: item.medicineName,
        searches: item._count.medicineName
      }));
    }

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
