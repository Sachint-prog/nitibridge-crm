const User = require('../models/User');
const Payment = require('../models/Payment');
const Target = require('../models/Target');
const FollowUp = require('../models/FollowUp');
const Deal = require('../models/Deal');

exports.getDashboard = async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const allPayments = await Payment.find({ employeeId: req.user._id });
        
        // Filter payments for current month only
        const currentMonthPayments = allPayments.filter(p => 
            (p.createdAt.getMonth() + 1) === currentMonth && 
            p.createdAt.getFullYear() === currentYear
        );
        
        const collection = currentMonthPayments.reduce((acc, pay) => acc + pay.amount, 0);
        
        // Fetch specific monthly target
        const empTargetDoc = await Target.findOne({ 
            employeeId: req.user._id, 
            month: currentMonth, 
            year: currentYear 
        });
        
        // Fallback to User.target if no monthly target set
        const monthlyTarget = empTargetDoc ? empTargetDoc.amount : (req.user.target || 0);
        const remaining = monthlyTarget - collection;

        // Fetch only clients belonging to this employee
        const clients = await User.find({ role: 'client', addedBy: req.user._id });

        res.json({
            success: true,
            user: { ...req.user.toObject(), monthlyTarget },
            collection,
            remaining,
            payments: allPayments,
            clients,
            filters: {
                startMonth: req.query.startMonth || '',
                startYear: req.query.startYear || '',
                endMonth: req.query.endMonth || '',
                endYear: req.query.endYear || '',
                viewMode: req.query.viewMode || 'monthly'
            },
            trendData: await (async () => {
                const { startMonth, startYear, endMonth, endYear, viewMode = 'monthly' } = req.query;
                let dateFilter = { employeeId: new (require('mongoose')).Types.ObjectId(req.user._id) };
                if (startMonth && startYear && endMonth && endYear) {
                    const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
                    const end = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59);
                    dateFilter.createdAt = { $gte: start, $lte: end };
                } else {
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
                    sixMonthsAgo.setDate(1);
                    dateFilter.createdAt = { $gte: sixMonthsAgo };
                }

                let groupStage = {};
                let sortStage = { "_id.year": 1 };
                if (viewMode === 'weekly') {
                    groupStage = { week: { $week: "$createdAt" }, year: { $year: "$createdAt" } };
                    sortStage["_id.week"] = 1;
                } else if (viewMode === 'yearly') {
                    groupStage = { year: { $year: "$createdAt" } };
                } else {
                    groupStage = { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } };
                    sortStage["_id.month"] = 1;
                }

                return await Payment.aggregate([
                    { $match: dateFilter },
                    { $group: { _id: groupStage, total: { $sum: "$amount" } } },
                    { $sort: sortStage }
                ]);
            })(),
            clientDist: await User.aggregate([
                { $match: { addedBy: new (require('mongoose')).Types.ObjectId(req.user._id), role: 'client' } },
                { $group: { _id: "$clientType", count: { $sum: 1 } } }
            ]),
            followUpStats: await FollowUp.aggregate([
                { $match: { employeeId: new (require('mongoose')).Types.ObjectId(req.user._id) } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard.' });
    }
};

exports.createClient = async (req, res) => {
    try {
        const { name, contactNumber, companyName, state, district, email, clientType, followUpDate, followUpRemarks } = req.body;
        
        let existingUser = await User.findOne({ contactNumber });
        if (existingUser) {
            return res.status(400).json({ error: 'Contact Number already exists.' });
        }

        // Generate auto unique ID
        const count = await User.countDocuments({ role: 'client' });
        const userId = `CLI-${1000 + count + 1}`;

        const client = new User({
            role: 'client',
            userId, // Auto ID
            contactNumber, // for login
            name,
            companyName,
            state,
            district,
            email,
            clientType,
            addedBy: req.user._id
        });

        await client.save();

        // Create follow-up if date is provided
        if (followUpDate) {
            const followUp = new FollowUp({
                clientId: client._id,
                employeeId: req.user._id,
                date: new Date(followUpDate),
                remarks: followUpRemarks || 'Initial follow-up scheduled during client creation',
                status: 'Pending'
            });
            await followUp.save();
        }

        res.json({ success: true, message: `Client ${name} created successfully with ID: ${userId}${followUpDate ? ' and follow-up scheduled' : ''}`, client });

    } catch (error) {
        res.status(500).json({ error: 'Error creating client.' });
    }
};

exports.addPayment = async (req, res) => {
    try {
        const { clientContact, amount, remarks, transactionId, dealId, totalAmount, isNewDeal } = req.body;
        const paymentSS = req.file ? '/uploads/' + req.file.filename : '';

        // Find client
        const client = await User.findOne({ contactNumber: clientContact, role: 'client' });
        if (!client) {
            return res.status(400).json({ error: 'Client with this contact number not found.' });
        }

        // Check unique transaction ID
        const existingTx = await Payment.findOne({ transactionId });
        if (existingTx) {
             return res.status(400).json({ error: 'Transaction ID already exists.' });
        }

        let currentDealId = dealId;

        // Handle New Deal creation
        if (isNewDeal === 'true' || isNewDeal === true) {
            const newDeal = new Deal({
                clientId: client._id,
                employeeId: req.user._id,
                totalAmount: Number(totalAmount),
                collectedAmount: Number(amount),
                status: Number(amount) >= Number(totalAmount) ? 'Paid' : 'Partial',
                remarks: remarks
            });
            const savedDeal = await newDeal.save();
            currentDealId = savedDeal._id;
        } else if (dealId) {
            // Update existing deal
            const deal = await Deal.findById(dealId);
            if (deal) {
                deal.collectedAmount += Number(amount);
                if (deal.collectedAmount >= deal.totalAmount) {
                    deal.status = 'Paid';
                }
                await deal.save();
            }
        }

        const totalAmt = Number(amount);
        const cutoffAmount = Math.floor(totalAmt * 0.5);
        const normalAmount = totalAmt - cutoffAmount;

        const payment = new Payment({
            clientName: client.name,
            companyName: client.companyName || '',
            amount: totalAmt,
            normalAmount,
            cutoffAmount,
            remarks,
            transactionId,
            paymentSS,
            employeeId: req.user._id,
            clientId: client._id,
            dealId: currentDealId
        });

        await payment.save();
        res.json({ success: true, message: 'Payment recorded successfully.', payment });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding payment.' });
    }
};

exports.getDeals = async (req, res) => {
    try {
        const { contactNumber } = req.params;
        const client = await User.findOne({ contactNumber, role: 'client' });
        if (!client) return res.status(404).json({ error: 'Client not found' });

        const deals = await Deal.find({ clientId: client._id, status: 'Partial' });
        res.json({ success: true, deals });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching deals.' });
    }
};
