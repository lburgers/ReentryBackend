const expressJwt = require('express-jwt');
const config = require('../config.json');
const employerService = require('../employer/employer.service')

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            '/employers/create',
            '/employers/authenticate'
        ]
    });
}

async function isRevoked(req, payload, done) {
    const user = await employerService.getById(payload.sub);

    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    done();
};