const User     = require('../models/User');
const FarmCrop = require('../models/FarmCrop');
const Product  = require('../models/Product');

/**
 * GET /api/users/admin/full-report
 * Aggregates all data needed for the admin printable report:
 *   1. Platform Overview  (user counts, districts)
 *   2. Geographical Distribution (farmers by district)
 *   3. Crop Performance & Analytics (CPS by season → cropName)
 *   4. Market Analytics – Top Rated Products
 */
exports.getAdminReport = async (req, res) => {
  try {
    // ── 1. Platform Overview ──────────────────────────────────────────────────
    const farmers        = await User.countDocuments({ role: 'User' });
    const agriOfficers   = await User.countDocuments({ role: 'Expert', status: { $nin: ['Pending', 'Rejected'] } });
    const pendingExperts = await User.countDocuments({ role: 'Expert', status: 'Pending' });
    const totalUsers     = farmers + agriOfficers + pendingExperts;

    const distinctDistricts = await User.distinct('district', { role: 'User', district: { $ne: null, $ne: '' } });

    // ── 2. Geographical Distribution ─────────────────────────────────────────
    const geographicStats = await User.aggregate([
      { $match: { role: 'User', district: { $ne: null } } },
      { $group: { _id: '$district', farmerCount: { $sum: 1 } } },
      { $sort: { farmerCount: -1 } },
    ]);

    // ── 3. Crop Performance & Analytics (CPS per season / crop) ─────────────
    // CPS = (Income / Acres) × (Yield / Acres)  [simplified: income × yield / acres²]
    const cropPerformance = await FarmCrop.aggregate([
      {
        $group: {
          _id: { season: '$season', cropName: '$cropName' },
          totalAcres:  { $sum: '$fieldSize'    },
          totalYield:  { $sum: '$yieldAmount'  },
          totalIncome: { $sum: '$incomeAmount' },
        },
      },
      {
        $project: {
          _id: 0,
          season:      '$_id.season',
          cropName:    '$_id.cropName',
          totalAcres:  { $round: ['$totalAcres',  2] },
          totalYield:  { $round: ['$totalYield',  2] },
          totalIncome: { $round: ['$totalIncome', 2] },
          cpsScore: {
            $cond: [
              { $gt: ['$totalAcres', 0] },
              {
                $round: [{
                  $divide: [
                    { $multiply: ['$totalIncome', '$totalYield'] },
                    { $multiply: ['$totalAcres',  '$totalAcres'] },
                  ],
                }, 2],
              },
              0,
            ],
          },
        },
      },
      { $sort: { season: 1, cpsScore: -1 } },
    ]);

    // Group by season for easy rendering
    const cropsBySeason = {};
    for (const row of cropPerformance) {
      const s = row.season || 'Unknown';
      if (!cropsBySeason[s]) cropsBySeason[s] = [];
      cropsBySeason[s].push(row);
    }

    // ── 4. Market Analytics – Top Rated Products ──────────────────────────────
    const topProducts = await Product.find({ approvalStatus: 'approved', numRatings: { $gt: 0 } })
      .sort({ avgRating: -1, numRatings: -1 })
      .limit(10)
      .populate('seller', 'name')
      .select('name category price avgRating numRatings seller location status');

    // ── Response ──────────────────────────────────────────────────────────────
    res.status(200).json({
      status: 'success',
      generatedAt: new Date().toISOString(),
      data: {
        platformOverview: {
          totalUsers,
          farmers,
          agriOfficers,
          pendingExperts,
          districtsInvolved: distinctDistricts.length,
        },
        geographicStats: geographicStats.map(g => ({
          district:    g._id || 'Unknown',
          farmerCount: g.farmerCount,
        })),
        cropsBySeason,
        topProducts: topProducts.map(p => ({
          name:       p.name,
          category:   p.category,
          price:      p.price,
          avgRating:  Math.round(p.avgRating * 10) / 10,
          numRatings: p.numRatings,
          seller:     p.seller?.name || 'Unknown',
          location:   p.location || '—',
          status:     p.status,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

/**
 * GET /api/users/admin/crop-performance
 * Returns CPS scores grouped by season for the dashboard chart.
 * CPS = (Total Income / Total Acres) × (Total Yield / Total Acres)
 */
exports.getCropPerformance = async (req, res) => {
  try {
    const rows = await FarmCrop.aggregate([
      {
        $group: {
          _id: { season: '$season', cropName: '$cropName' },
          totalAcres:  { $sum: '$fieldSize'   },
          totalYield:  { $sum: '$yieldAmount' },
          totalIncome: { $sum: '$incomeAmount'},
        },
      },
      {
        $project: {
          _id: 0,
          season:   '$_id.season',
          cropName: '$_id.cropName',
          totalAcres:  { $round: ['$totalAcres',  2] },
          totalYield:  { $round: ['$totalYield',  2] },
          totalIncome: { $round: ['$totalIncome', 2] },
          cpsScore: {
            $cond: [
              { $gt: ['$totalAcres', 0] },
              {
                $round: [{
                  $divide: [
                    { $multiply: ['$totalIncome', '$totalYield'] },
                    { $multiply: ['$totalAcres',  '$totalAcres'] },
                  ],
                }, 2],
              },
              0,
            ],
          },
        },
      },
      { $sort: { season: 1, cpsScore: -1 } },
    ]);

    // Group by season
    const cropsBySeason = {};
    for (const row of rows) {
      const s = row.season || 'Unknown';
      if (!cropsBySeason[s]) cropsBySeason[s] = [];
      cropsBySeason[s].push(row);
    }

    res.status(200).json({ status: 'success', data: { cropsBySeason } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};
