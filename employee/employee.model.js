const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let EmployeeSchema = new Schema({
    first_name: { type: String, required: true, max: 40 },
    middle_initial: { type: String, required: false, max: 40 },
    last_name: { type: String, required: true, max: 40 },
    phone_number: { type: String, required: true, max: 11 },
    street_address: { type: String, required: true, max: 50 },
    city: { type: String, required: true, max: 50 },
    county: { type: String, required: true, max: 50 },
    state: { type: String, required: true, max: 3 },
    zipcode: { type: String, required: true, max: 5 },
    ssn: { type: String, required: true, max: 15 },
    dob: { type: String, required: false, max: 10 }, // TODO: store dob as Date object
    email: { type: String, required: false, max: 60 },
    prefixes: { type: Array, required: false, },
    hash: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },

    ex_felon: {type: Boolean, default: false, required: false},
});

EmployeeSchema.index({
    prefixes: 'text',
});

// Export the model
module.exports = mongoose.model('Employee', EmployeeSchema);