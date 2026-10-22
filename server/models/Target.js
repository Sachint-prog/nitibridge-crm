const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true }
}, { timestamps: true });

// Ensure one target per employee per month/year
targetSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Target', targetSchema);
