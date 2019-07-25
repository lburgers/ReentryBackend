const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// stage types
// -1 = employee not yet user
// 0 = employee has not yet accepted
// 1 = employee/employer needs to supply additional information
// 2 = waiting on signature from employee/employer
// 3 = completed

let RequestSchema = new Schema({
    employer_id: { type: String, required: true },
    employee_id: { type: String, required: true },
    stage: { type: Number, required: true },
    '8850': {
        sign_easy_pending_id: { type: Number, required: false },
        sign_easy_completed_id: { type: Number, required: false },
        signed_by: { type: Array, required: false, default: []},
    },
    '9061': {
        sign_easy_pending_id: { type: Number, required: false },
        sign_easy_completed_id: { type: Number, required: false },
        signed_by: { type: Array, required: false, default: []},
    },
    gave_information_date: { type: String, required: false },
    offered_job_date: { type: String, required: false },
    hired_date: { type: String, required: false },
    started_job_date: { type: String, required: false },
    have_worked_before: { type: Boolean, required: false },
    last_employment_date: { type: String, required: false },
    starting_wage: { type: String, required: false },
    position: { type: String, required: false },
    // add lots of specific questions
    createdDate: { type: Date, default: Date.now }
});

// Export the model
module.exports = mongoose.model('Request', RequestSchema);