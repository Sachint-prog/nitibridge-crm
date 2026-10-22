const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    role: { 
        type: String, 
        enum: ['admin', 'employee', 'client'], 
        required: true 
    },
    // Used for Admin & Employee (ID)
    userId: { type: String, unique: true, sparse: true },
    password: { type: String }, // Required for Admin & Employee
    
    // Universal fields
    name: { type: String },
    contactNumber: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true }, // For soft deleting employees

    // Employee specific
    target: { type: Number, default: 0 },

    // Client specific
    companyName: { type: String },
    state: { type: String },
    district: { type: String },
    email: { type: String },
    clientType: { type: String, enum: ['Hot', 'Warm', 'Cold'] },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to Employee who added
    settings: {
        theme: { type: String, default: 'light' },
        defaultView: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
        notifications: { type: Boolean, default: true }
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
