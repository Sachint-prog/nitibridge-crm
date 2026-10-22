const Payment = require('../models/Payment');
const Deal = require('../models/Deal');

exports.getDashboard = async (req, res) => {
    try {
        const payments = await Payment.find({ clientId: req.user._id }).populate('dealId').sort({ createdAt: -1 });
        const deals = await Deal.find({ clientId: req.user._id }).sort({ createdAt: -1 });

        res.json({ success: true, user: req.user, payments, deals });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard.' });
    }
};
