const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true },
    remarks: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Overdue'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('FollowUp', followUpSchema);
