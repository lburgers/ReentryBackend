const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('./employee.model');
const Employer = require('../employer/employer.model');

module.exports = {
    authenticate,
    getById,
    search,
    create,
    update,
    delete: _delete
};

const checkExists = async (dict) => {
    return (await Employee.findOne(dict)) || (await Employer.findOne(dict))
}

const createPrefixes = (user) => {
    const {
        first_name,
        last_name,
        city,
        state,
        zipcode
    } = user
    let prefixes = []
    let tmp
    for (var i = 0; i < first_name.length; i++) {
        tmp = first_name.substr(0, i+1).toUpperCase()
        prefixes.push(tmp)
    }
    for (var i = 0; i < last_name.length; i++) {
        tmp = last_name.substr(0, i+1).toUpperCase()
        prefixes.push(tmp)
        prefixes.push(first_name.toUpperCase() + ' ' + tmp)
    }
    for (var i = 0; i < city.length; i++) {
        tmp = city.substr(0, i+1).toUpperCase()
        prefixes.push(tmp)
    }
    for (var i = 0; i < zipcode.length; i++) {
        tmp = zipcode.substr(0, i+1).toUpperCase()
        prefixes.push(tmp)
    }
    prefixes.push(state)
    return prefixes
}


async function authenticate({ email, phone_number, password }) {
    let employee
    if (!(employee = await Employee.findOne({ email }))) {
        employee = await Employee.findOne({ phone_number });
    }

    if (employee && bcrypt.compareSync(password, employee.hash)) {
        const { hash, prefixes, ...userWithoutHash } = employee.toObject();
        const token = jwt.sign({ sub: employee.id }, config.secret, { expiresIn: '4h' });
        return {
            ...userWithoutHash,
            token
        };
    }
}

async function search(q) {
    try {
        let response = await Employee.find({ $text: { $search: q.toUpperCase() } })
        response = response.map(user => {
            const { prefixes, street_address, ssn, hash, ...userWithoutSensitiveData } = user._doc // remove sensitive data
            return userWithoutSensitiveData
        })
        return response
    } catch (e) { throw e }
}

async function getById(id) {
    const employee = await Employee.findById(id).select('-hash -ssn -prefixes')
    return employee;
}

async function create(userParam) {
    if (await checkExists({ email: userParam.email })) {
        throw ' (email) "' + userParam.email + '" is already taken';
    }
    if (await checkExists({ phone_number: userParam.phone_number })) {
        throw ' (phone_number) "' + userParam.phone_number + '" is already taken';
    }

    const prefixes = createPrefixes(userParam)

    const employee = new Employee({ ...userParam, prefixes });

    // hash password
    if (userParam.password) {
        employee.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save employee
    await employee.save();
}

async function update(id, userParam) {
    const employee = await Employee.findById(id);

    // validate
    if (!employee) throw 'Employee not found';
    if (employee.email !== userParam.email && (await checkExists({ email: userParam.email })) )
    {
        throw 'Employeename "' + userParam.email + '" is already taken';
    }
    if (employee.phone_number !== userParam.phone_number && (await checkExists({ phone_number: userParam.phone_number })) )
    {
        throw 'Employeename "' + userParam.phone_number + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // TODO: change prefixes on update

    // copy userParam properties to employee
    Object.assign(employee, userParam);

    await employee.save();
}

async function _delete(id) {
    await Employee.findByIdAndRemove(id);
}