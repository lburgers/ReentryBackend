const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employer = require('./employer.model');
const Employee = require('../employee/employee.model');


module.exports = {
    authenticate,
    getById,
    create,
    update,
    delete: _delete
};

const checkExists = async (dict) => {
    return (await Employee.findOne(dict)) || (await Employer.findOne(dict))
}

async function authenticate({ email, phone_number, password }) {
    let employer
    if (!(employer = await Employer.findOne({ email }))) {
        employer = await Employer.findOne({ phone_number });
    }

    if (employer && bcrypt.compareSync(password, employer.hash)) {
        const { hash, ...userWithoutHash } = employer.toObject();
        const token = jwt.sign({ sub: employer.id }, config.secret, { expiresIn: '4h' });
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
    if (await checkExists({ email: userParam.email })) {
        throw ' (email) "' + userParam.email + '" is already taken';
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
    const employer = await Employer.findById(id);

    // validate
    if (!employer) throw 'Employer not found';
    if (employer.email !== userParam.email && (await checkExists({ email: userParam.email })) ) {
        throw 'Employername "' + userParam.email + '" is already taken';
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