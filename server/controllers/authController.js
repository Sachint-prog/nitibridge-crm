const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.getLogin = async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            const user = await User.findById(decoded.id);
            if (user) {
                return res.json({ isLoggedIn: true, user: { id: user._id, _id: user._id, name: user.name, role: user.role, isActive: user.isActive, userId: user.userId, contactNumber: user.contactNumber } });
            }
        } catch (e) {
    res.clearCookie('token', { sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production' });
    return res.status(401).json({ isLoggedIn: false });
        }
    }
    res.status(401).json({ isLoggedIn: false });
};

exports.postLogin = async (req, res) => {
    try {
        const { userId, password } = req.body;
        // User ID could be Employee ID / Admin ID or Client Contact Number
        const user = await User.findOne({ 
            $or: [{ userId }, { contactNumber: userId }] 
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.role === 'employee' && !user.isActive) {
            return res.status(403).json({ error: 'This account has been deactivated.' });
        }

        if (user.role === 'client') {
            if (password && user.password) {
                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
            } else if (!password && !user.password) {
                // If it's pure contact number login
                // We're good
            } else {
                 return res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        const isProduction = process.env.NODE_ENV === 'production';
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
        res.cookie('token', token, { 
            httpOnly: true, 
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: isProduction ? 'none' : 'lax',
            secure: isProduction
        });
        
        return res.json({ success: true, user: { id: user._id, _id: user._id, name: user.name, role: user.role, userId: user.userId, contactNumber: user.contactNumber } });

    } catch (err) {
        res.status(500).json({ error: 'An error occurred during login' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token', { sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true, message: 'Logged out successfully' });
};
