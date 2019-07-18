const Request = require('./request.model');
const Employer = require('../employer/employer.model');
const Employee = require('../employee/employee.model');
const { buildFormData, buildPDFform } = require('../lib/form-filler')

module.exports = {
    getById,
    generateForm,
    getAll,
    create,
    update,
    delete: _delete
};

// todo: more validation

const checkPermissions = (request, user_id) => {
    if (request.employer_id == user_id || request.employee_id == user_id) {
        return true
    } else {
        return false
    }
}

async function generateForm(id, type, user_id) {
    var sourcePDF = type == '8850' ? "./assets/8850_form.pdf" : './assets/9061_form.pdf'

    const request = await getById(id, user_id)
    if (!request) throw 'No request found'
    if (request.stage < 1) throw 'Employee has not yet accepted'

    const employer = await Employer.findById(request.employer_id)
    const employee = await Employee.findById(request.employee_id)
    if (!employer || ! employee) throw 'request missing employer or employee'

    var data = buildFormData(employer, employee, request, type)
    const pdf = await buildPDFform(sourcePDF, data)
    return pdf
}

async function getById(id, user_id) {

    const request = await Request.findById(id)
    if (checkPermissions(request, user_id)) {
        const employer = await Employer.findById(request.employer_id)
        const employee = await Employee.findById(request.employee_id)
        const response = {
            ...request._doc,
            employer_name: employer.employer_name,
            employee_name: `${employee.first_name} ${employee.last_name}`,
        }
        return response
    } else {
        throw 'Unauthorized'
    }
}

async function getAll(userQuery) {
    let requests
    if (!!userQuery.employee_id) {
        requests = await Request.find({ employee_id: userQuery.employee_id })
    } else if (!!userQuery.employer_id) {
        requests = await Request.find({ employer_id: userQuery.employer_id })
    } else {
        throw 'Need to supply employer_id or employee_id'
    }

    requests = requests.map(async (request) => {
        const employer = await Employer.findById(request.employer_id)
        const employee = await Employee.findById(request.employee_id)
        const response = {
            ...request._doc,
            employer_name: employer.employer_name,
            employee_name: `${employee.first_name} ${employee.last_name}`,
        }
        return response
    })
    return await Promise.all(requests)
}

async function create(userParam) {
    // TODO: calculate stage
    // TODO: notify employee of request
    if (await Request.findOne({ employer_id: userParam.employer_id }) && await Request.findOne({ employee_id: userParam.employee_id }))  {
        throw ' this request already exists ';
    }
    try {
        if (!(await Employer.findById(userParam.employer_id)) || !(await Employee.findById(userParam.employee_id))) {
            throw 'Employer or employee does not exist'
        }
    } catch (e) {
        throw 'Employer or employee does not exist'
    }

    const request = new Request(userParam);

    // save request
    await request.save();
}

async function update(id, userParam, user_id) {
    // TODO: calculate stage
    const request = await Request.findById(id);
    // validate
    if (!request) throw 'Request not found';
    if (!checkPermissions(request, user_id)) throw 'Unauthorized'
    if ((!!userParam.employee_id || !!userParam.employer_id) &&
        (request.employee_id !== userParam.employee_id || request.employer_id !== userParam.employer_id )) {
        throw 'Cannot update employee or employer';
    }

    // copy userParam properties to employer
    Object.assign(request, userParam);

    await request.save();
}

async function _delete(id, user_id) {
    const request = await Request.findById(id);
    if (!checkPermissions(request, user_id)) throw 'Unauthorized'
    await Request.findByIdAndRemove(id);
}