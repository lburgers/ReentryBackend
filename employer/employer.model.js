const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let EmployerSchema = new Schema({
    employer_name: { type: String, required: true, max: 40 },
    phone_number: { type: String, required: true, max: 11 },
    ein: { type: String, required: true, max: 10 },
    street_address: { type: String, required: true, max: 50 },
    city: { type: String, required: true, max: 50 },
    state: { type: String, required: true, max: 3 },
    zipcode: { type: String, required: true, max: 5 },
    email: { type: String, required: true, max: 60 },
    hash: { type: String, required: true },
    createdDate: { type: Date, default: Date.now }
});

// Export the model
module.exports = mongoose.model('Employer', EmployerSchema);