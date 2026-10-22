const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    companyName: { type: String },
    amount: { type: Number, required: true },
    normalAmount: { type: Number, default: 0 },   // 50% of amount
    cutoffAmount: { type: Number, default: 0 },   // 50% of amount (cut-off portion)
    remarks: { type: String },
    transactionId: { type: String, required: true, unique: true },
    paymentSS: { type: String }, // Path to screenshot uploaded
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
