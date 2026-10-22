const express = require('express');
const routerMain = express.Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const employeeRoutes = require('./employee');
const clientRoutes = require('./client');
const followupRoutes = require('./followup');
const dataRoutes = require('./data');

routerMain.get('/', (req, res) => {
    res.redirect('/login');
});

routerMain.use('/', authRoutes);
routerMain.use('/admin', adminRoutes);
routerMain.use('/admin', dataRoutes);
routerMain.use('/employee', employeeRoutes);
routerMain.use('/client', clientRoutes);
routerMain.use('/followup', followupRoutes);

module.exports = routerMain;
