const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employer = require('./employer.model');

module.exports = {
    authenticate,
    getById,
    create,
    update,
    delete: _delete
};

// TODO: add better auth rules to all endpoints

async function authenticate({ email, password }) {
    const employer = await Employer.findOne({ email });
    if (employer && bcrypt.compareSync(password, employer.hash)) {
        const { hash, ...userWithoutHash } = employer.toObject();
        const token = jwt.sign({ sub: employer.id }, config.secret); // todo: add expiration
        return {
            ...userWithoutHash,
            token
        };
    }
}

async function getById(id) {
    return await Employer.findById(id).select('-hash');
}

async function create(userParam) {
    // TODO: add tighter rules/validaters
    // validate
    if (await Employer.findOne({ email: userParam.email })) {
        throw 'username (email) "' + userParam.email + '" is already taken';
    }

    const employer = new Employer(userParam);

    // hash password
    if (userParam.password) {
        employer.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save employer
    await employer.save();
}

async function update(id, userParam) {
    // TODO: add tighter rules/validaters
    const employer = await Employer.findById(id);

    // validate
    if (!employer) throw 'Employer not found';
    if (employer.username !== userParam.username && await Employer.findOne({ email: userParam.email })) {
        throw 'Employername "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to employer
    Object.assign(employer, userParam);

    await employer.save();
}

async function _delete(id) {
    await Employer.findByIdAndRemove(id);
}