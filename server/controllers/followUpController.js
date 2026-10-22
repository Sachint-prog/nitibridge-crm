const FollowUp = require('../models/FollowUp');
const User = require('../models/User');

exports.getFollowUps = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'employee') {
            filter.employeeId = req.user._id;
        }

        const now = new Date();
        
        // Auto-update statuses to Overdue if they are Pending and date has passed
        await FollowUp.updateMany(
            { employeeId: req.user._id, status: 'Pending', date: { $lt: now } },
            { status: 'Overdue' }
        );

        const followUpsRaw = await FollowUp.find(filter)
                                        .populate('clientId')
                                        .sort({ date: 1 });

        // Fetch clients for the dropdown (only those belonging to this employee)
        let myClients = [];
        if (req.user.role === 'employee') {
            myClients = await User.find({ role: 'client', addedBy: req.user._id });
        }

        res.json({ success: true, followUps: followUpsRaw, myClients });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load follow-ups.' });
    }
};

exports.addFollowUp = async (req, res) => {
    try {
        const { clientId, date, remarks } = req.body;

        const followup = new FollowUp({
            clientId,
            employeeId: req.user._id,
            date,
            remarks
        });

        await followup.save();
        res.json({ success: true, message: 'Follow-up scheduled.' });
    } catch (error) {
        res.status(500).json({ error: 'Error scheduling follow-up.' });
    }
};

exports.getUpcoming = async (req, res) => {
    try {
        const now = new Date();
        const futureWindow = new Date(now.getTime() + 30 * 60000); // 30-minute window
        
        const upcoming = await FollowUp.find({
            employeeId: req.user._id,
            status: 'Pending',
            date: { $gte: now, $lte: futureWindow }
        }).populate('clientId', 'name contactNumber');

        res.json({ success: true, upcoming });
    } catch (error) {
        res.json({ success: false });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await FollowUp.findByIdAndUpdate(id, { status });
        res.json({ success: true, message: `Follow-up marked as ${status}.` });
    } catch (error) {
        res.status(500).json({ error: 'Error updating status.' });
    }
};
