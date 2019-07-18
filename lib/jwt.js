const expressJwt = require('express-jwt');
const config = require('../config.json');
const employerService = require('../employer/employer.service')
const employeeService = require('../employee/employee.service')

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            '/employers/create',
            '/employers/authenticate',
            '/employees/create',
            '/employees/authenticate',
            '/requests/viewForm',
        ]
    });
}

async function isRevoked(req, payload, done) {
    const employer = await employerService.getById(payload.sub);
    const employee = await employeeService.getById(payload.sub);

    // revoke token if user no longer exists
    if (!employer && !employee) {
        return done(null, true);
    }

    done();
};