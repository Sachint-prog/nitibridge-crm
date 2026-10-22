const User = require('../models/User');
const Payment = require('../models/Payment');
const Deal = require('../models/Deal');
const Target = require('../models/Target');

exports.getDashboard = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' });
        const payments = await Payment.find().populate('employeeId', 'name');
        
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const targets = await Target.find({ month: currentMonth, year: currentYear });

        // Calculate totals for current month
        const totalTarget = targets.reduce((acc, t) => acc + t.amount, 0);
        
        // Filter payments for current month
        const currentMonthPayments = payments.filter(p => 
            (p.createdAt.getMonth() + 1) === currentMonth && 
            p.createdAt.getFullYear() === currentYear
        );
        const collection = currentMonthPayments.reduce((acc, pay) => acc + pay.amount, 0);

        // Calculate Target Summary (Every Employee) for Current Month
        const targetSummary = employees.map(emp => {
            const empPayments = currentMonthPayments.filter(p => p.employeeId && p.employeeId._id.toString() === emp._id.toString());
            const empCollection = empPayments.reduce((acc, pay) => acc + pay.amount, 0);
            
            const empTargetDoc = targets.find(t => t.employeeId.toString() === emp._id.toString());
            const empTarget = empTargetDoc ? empTargetDoc.amount : 0;
            
            return {
                _id: emp._id,
                name: emp.name,
                isActive: emp.isActive,
                target: empTarget,
                collection: empCollection,
                remaining: empTarget - empCollection
            };
        });

        // --- Filters ---
        const { startMonth, startYear, endMonth, endYear, viewMode = 'monthly' } = req.query;
        
        let dateFilter = {};
        if (startMonth && startYear && endMonth && endYear) {
            const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
            const end = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        } else {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            dateFilter = { createdAt: { $gte: sixMonthsAgo } };
        }

        // --- Collection Trend Aggregation ---
        let groupStage = {};
        let sortStage = { "_id.year": 1 };

        if (viewMode === 'weekly') {
            groupStage = { week: { $week: "$createdAt" }, year: { $year: "$createdAt" } };
            sortStage["_id.week"] = 1;
        } else if (viewMode === 'yearly') {
            groupStage = { year: { $year: "$createdAt" } };
        } else { // monthly
            groupStage = { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };
            sortStage["_id.month"] = 1;
        }

        const trendData = await Payment.aggregate([
            { $match: dateFilter },
            { $group: {
                _id: groupStage,
                total: { $sum: "$amount" }
            }},
            { $sort: sortStage }
        ]);

        // --- Client Category Distribution ---
        const clientDistribution = await User.aggregate([
            { $match: { role: 'client' } },
            { $group: {
                _id: "$clientType",
                count: { $sum: 1 }
            }}
        ]);

        res.json({
            success: true,
            user: req.user,
            collection,
            totalTarget,
            targetSummary,
            payments,
            trendData,
            clientDistribution,
            filters: {
                startMonth: startMonth || '',
                startYear: startYear || '',
                endMonth: endMonth || '',
                endYear: endYear || '',
                viewMode
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard.' });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const { name, contactNumber, userId, password, target } = req.body;
        
        let existingUser = await User.findOne({ $or: [{ userId }, { contactNumber }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User ID or Contact Number already exists.' });
        }

        const employee = new User({
            role: 'employee',
            name,
            contactNumber,
            userId,
            password,
            target: target || 0
        });

        await employee.save();
        res.json({ success: true, message: 'Employee created successfully.', employee });

    } catch (error) {
        res.status(500).json({ error: 'Error creating employee.' });
    }
};

exports.getEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' });
        res.json({ success: true, employees });
    } catch (error) {
        res.status(500).json({ error: 'Error loading employees.' });
    }
};

exports.editEmployee = async (req, res) => {
    try {
        const { name, contactNumber, password } = req.body;
        let updateData = { name, contactNumber };
        if (password) {
            const salt = await require('bcryptjs').genSalt(10);
            updateData.password = await require('bcryptjs').hash(password, salt);
        }
        await User.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true, message: 'Employee updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating employee.' });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true, message: 'Employee deactivated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error deactivating employee.' });
    }
};


exports.getTargets = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee', isActive: true });
        
        const now = new Date();
        const selectedMonth = parseInt(req.query.month) || now.getMonth() + 1;
        const selectedYear = parseInt(req.query.year) || now.getFullYear();

        // Get targets for the selected month
        const targets = await Target.find({ month: selectedMonth, year: selectedYear });
        
        res.json({ 
            success: true, 
            employees, 
            targets, 
            currentMonth: selectedMonth,
            currentYear: selectedYear 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error loading targets.' });
    }
};

exports.updateTarget = async (req, res) => {
    try {
        const { target, month, year } = req.body;
        const m = parseInt(month);
        const y = parseInt(year);
        
        let existingTarget = await Target.findOne({ employeeId: req.params.id, month: m, year: y });
        if (existingTarget) {
            existingTarget.amount = target;
            await existingTarget.save();
        } else {
            await new Target({
                employeeId: req.params.id,
                amount: target,
                month: m,
                year: y
            }).save();
        }

        res.json({ success: true, message: `Target updated successfully for Month ${m}, ${y}.` });
    } catch (error) {
        res.status(500).json({ error: 'Error updating target.' });
    }
};

exports.getClients = async (req, res) => {
    try {
        const clients = await User.find({ role: 'client' }).populate('addedBy');
        res.json({ success: true, clients });
    } catch (error) {
        res.status(500).json({ error: 'Error loading clients.' });
    }
};

exports.updateClientType = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { clientType: req.body.clientType });
        res.json({ success: true, message: 'Client type updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating client type.' });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('employeeId', 'name userId')
            .populate('clientId', 'name userId contactNumber companyName')
            .populate('dealId')
            .sort({ createdAt: -1 });
        res.json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ error: 'Error loading payments.' });
    }
};
exports.editPayment = async (req, res) => {
    try {
        const { amount, remarks, transactionId } = req.body;
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ error: 'Payment not found.' });

        const oldAmount = payment.amount;
        const newAmount = amount !== undefined ? Number(amount) : oldAmount;

        // Recompute 50/50 split
        const cutoffAmount = Math.floor(newAmount * 0.5);
        const normalAmount = newAmount - cutoffAmount;

        // If this payment has a deal, adjust the deal's collectedAmount
        if (payment.dealId && amount !== undefined) {
            const deal = await Deal.findById(payment.dealId);
            if (deal) {
                deal.collectedAmount = deal.collectedAmount - oldAmount + newAmount;
                deal.status = deal.collectedAmount >= deal.totalAmount ? 'Paid' : 'Partial';
                await deal.save();
            }
        }

        const updateData = { normalAmount, cutoffAmount };
        if (amount !== undefined) updateData.amount = newAmount;
        if (remarks !== undefined) updateData.remarks = remarks;
        if (transactionId !== undefined) updateData.transactionId = transactionId;

        const updated = await Payment.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('employeeId', 'name userId')
            .populate('clientId', 'name userId contactNumber companyName')
            .populate('dealId');

        res.json({ success: true, message: 'Payment updated successfully.', payment: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating payment.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        // Find user (req.user is already populated by authMiddleware)
        const user = await User.findById(req.user._id);
        
        // Verify old password
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password.' });
        }

        // Update password (pre-save hook will handle hashing)
        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating password.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, contactNumber } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { name, contactNumber }, { new: true });
        res.json({ success: true, message: 'Profile updated successfully.', user });
    } catch (error) {
        res.status(500).json({ error: 'Error updating profile.' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { theme, defaultView, notifications } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { $set: { "settings.theme": theme, "settings.defaultView": defaultView, "settings.notifications": notifications } }, 
            { new: true }
        );
        res.json({ success: true, message: 'Settings updated successfully.', user });
    } catch (error) {
        res.status(500).json({ error: 'Error updating settings.' });
    }
};

exports.getTopPerformers = async (req, res) => {
    try {
        const { period } = req.query; // monthly, 6months, yearly
        const now = new Date();
        let startDate;

        if (period === '6months') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 6);
        } else if (period === 'yearly') {
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
        } else { // monthly default
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const topPerformers = await Payment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: "$employeeId", totalCollected: { $sum: "$amount" } } },
            { $sort: { totalCollected: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
            { $unwind: "$employee" },
            { $project: { _id: 1, totalCollected: 1, "employee.name": 1, "employee.userId": 1 } }
        ]);

        res.json({ success: true, topPerformers });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch top performers.' });
    }
};
