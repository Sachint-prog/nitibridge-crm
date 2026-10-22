const { Parser } = require('json2csv');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Target = require('../models/Target');
const FollowUp = require('../models/FollowUp');

// Helper to get collection based on type
const getModelByType = (type) => {
    switch (type) {
        case 'employees': return { model: User, filter: { role: 'employee' } };
        case 'clients': return { model: User, filter: { role: 'client' } };
        case 'payments': return { model: Payment, filter: {} };
        case 'targets': return { model: Target, filter: {} };
        case 'followups': return { model: FollowUp, filter: {} };
        default: return null;
    }
};

exports.getDataManagementPage = async (req, res) => {
    res.json({ success: true, message: 'Data Management API Ready' });
};

exports.exportData = async (req, res) => {
    try {
        const { type } = req.params;
        const config = getModelByType(type);
        if (!config) return res.status(400).send('Invalid export type');

        const data = await config.model.find(config.filter).lean();
        
        if (data.length === 0) {
            return res.status(404).json({ error: `No data found for ${type}` });
        }

        // Clean data for CSV
        const cleanedData = data.map(item => {
            const newItem = { ...item };
            delete newItem.password;
            delete newItem.__v;
            // Flatten ObjectIDs
            Object.keys(newItem).forEach(key => {
                if (newItem[key] instanceof Object && newItem[key]._id) {
                    newItem[key] = newItem[key]._id;
                }
            });
            return newItem;
        });

        const json2csvParser = new Parser();
        const csvData = json2csvParser.parse(cleanedData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=nitibridge_${type}_${Date.now()}.csv`);
        res.status(200).send(csvData);

    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Error exporting data' });
    }
};

exports.importData = async (req, res) => {
    try {
        const { type } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a CSV file' });
        }

        const results = [];
        const filePath = req.file.path;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    let successCount = 0;
                    let errorCount = 0;

                    for (const row of results) {
                        try {
                            if (type === 'clients' || type === 'employees') {
                                // Validate required fields
                                if (!row.name || !row.contactNumber) {
                                    errorCount++;
                                    continue;
                                }
                                
                                const role = type === 'clients' ? 'client' : 'employee';
                                
                                // Upsert logic based on contactNumber
                                await User.findOneAndUpdate(
                                    { contactNumber: row.contactNumber },
                                    { ...row, role: role },
                                    { upsert: true, new: true }
                                );
                            } else if (type === 'payments') {
                                if (!row.transactionId || !row.amount) {
                                    errorCount++;
                                    continue;
                                }
                                await Payment.findOneAndUpdate(
                                    { transactionId: row.transactionId },
                                    row,
                                    { upsert: true, new: true }
                                );
                            } else if (type === 'targets') {
                                if (!row.employeeId || !row.month || !row.year) {
                                    errorCount++;
                                    continue;
                                }
                                await Target.findOneAndUpdate(
                                    { employeeId: row.employeeId, month: row.month, year: row.year },
                                    row,
                                    { upsert: true, new: true }
                                );
                            } else if (type === 'followups') {
                                if (!row.clientId || !row.date) {
                                    errorCount++;
                                    continue;
                                }
                                await new FollowUp(row).save();
                            }
                            successCount++;
                        } catch (err) {
                            console.error(`Row import error:`, err);
                            errorCount++;
                        }
                    }

                    fs.unlinkSync(filePath); // Delete temp file
                    res.json({ success: true, message: `Import completed. Success: ${successCount}, Failed: ${errorCount}` });
                } catch (err) {
                    console.error('Import processing error:', err);
                    res.status(500).json({ error: 'Error processing CSV rows' });
                }
            });

    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ error: 'Error importing data' });
    }
};

exports.downloadTemplate = (req, res) => {
    const { type } = req.params;
    let headers = '';

    switch (type) {
        case 'employees': 
            headers = 'name,contactNumber,userId,password,target\n' +
                      'John Doe,9876543210,emp101,pass123,50000\n' +
                      'Jane Smith,9876543211,emp102,pass456,75000\n' +
                      'Michael Brown,9876543212,emp103,pass789,60000'; 
            break;
        case 'clients': 
            headers = 'name,contactNumber,companyName,state,district,email,clientType\n' +
                      'Acme Corp Client,9998887776,Acme Corp,Maharashtra,Mumbai,client@example.com,Hot\n' +
                      'Globex Partner,9998887777,Globex,Delhi,New Delhi,globex@example.com,Warm\n' +
                      'Initech Lead,9998887778,Initech,Karnataka,Bangalore,initech@example.com,Cold'; 
            break;
        case 'payments': 
            headers = 'clientName,companyName,amount,remarks,transactionId\n' +
                      'John Doe,Acme Corp,10000,Service Fee,TXN_A123\n' +
                      'Jane Smith,Globex,15000,Consultation,TXN_B456\n' +
                      'Michael Brown,Initech,20000,Software License,TXN_C789'; 
            break;
        case 'targets': 
            headers = 'employeeId,amount,month,year\n' +
                      '6627b...,50000,4,2026\n' +
                      '6627b...,60000,5,2026\n' +
                      '6627c...,45000,4,2026'; 
            break;
        case 'followups': 
            headers = 'clientId,employeeId,date,remarks,status\n' +
                      '6627b...,6627c...,2026-05-01,Call scheduled,Pending\n' +
                      '6627d...,6627c...,2026-05-02,Email follow up,Completed\n' +
                      '6627e...,6627f...,2026-05-03,Meeting at office,Overdue'; 
            break;
        default: return res.status(400).send('Invalid template type');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_template.csv`);
    res.status(200).send(headers);
};
