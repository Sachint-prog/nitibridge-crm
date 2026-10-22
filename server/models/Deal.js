const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmount: { type: Number, required: true },
    collectedAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Partial', 'Paid'], default: 'Partial' },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
