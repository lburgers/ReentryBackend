const axios = require('axios')
const Request = require('./request.model');
const Employer = require('../employer/employer.model');
const Employee = require('../employee/employee.model');
const { buildFormData, buildPDFform, signEasyID } = require('../lib/form-filler')
const { smsNotify } = require('../lib/notify')
const config = require('../config')

module.exports = {
    getById,
    generateForm,
    sign,
    signEasyWebhook,
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

async function signEasyWebhook(body) {
    console.log(body)
    const file_type = body.data.name.split('-')[1].split('.')[0]
    const request_id = body.data.name.split('-')[0]
    const request = await Request.findById(request_id);
    if (!request) throw 'Request not found';

    console.log(body.metadata.event_type, file_type, request_id)

    if (body.metadata.event_type === 'rs.completed') {
        // if the request is waiting on signatures bump the stage to 3 (completed)
        if (request.stage == 1) {
            Object.assign(request, { [file_type]: { ...request[file_type], sign_easy_completed_id: body.data.signed_file_id} }); 
            console.log(request)
            await request.save();           
        }
    } else if (body.metadata.event_type === 'rs.signed') {

        request[file_type].signed_by.push(body.metadata.event_user)
        console.log(request)
        await request.save();           
    }
}

async function sign(id, type, user_id) {
    const request = await getById(id, user_id)
    if (request.stage < 1) throw 'request not ready for signatures'

    const employer = await Employer.findById(request.employer_id)
    const employee = await Employee.findById(request.employee_id)
    const formData = buildFormData(employer, employee, request, type)

    let merge_fields = Object.keys(formData).filter(key => {
        return (key !== 'multi_check') ? true : false
    }).map((key) => {
        return { label: key, value: formData[key], font_size: 11 }
    })

    let sign_easy_pending_id = request[type].sign_easy_pending_id
    const user_type = (user_id == employee._id) ? 'employee' : 'employer'

    try { 
        if (!sign_easy_pending_id) {

            const upload_response = await axios.post('https://api-ext.getsigneasy.com/v1/files/pending/template/',
            {
                template_file_id: signEasyID(type),
                recipients: [{email: `${employee.email}`, first_name: `${employee.first_name}`, last_name: `${employee.last_name}`, role_id: 2},
                             {email: `${employer.email}`, first_name: `${employer.employer_name}`, last_name: '', role_id: 1}],
                is_ordered: false,
                name: `${request._id}-${type}`,
                embedded_signing: true,
                merge_fields: merge_fields,
            },
            { 
                headers: {
                'Authorization': `Bearer ${config.SIGNEASY_API_KEY}`,
                "Content-Type": 'application/json',
            }})
            sign_easy_pending_id = upload_response.data.pending_file_id
            await update(id, {[type]: {...request[type], sign_easy_pending_id}}, user_id)
        }

        const embedded_response = await axios.post(`https://api-ext.getsigneasy.com/v1/files/pending/${sign_easy_pending_id}/signing/url/`,
        {
            recipient_email: user_type == 'employee' ? employee.email : employer.email,
            redirect_url: `${config.client_url}/app`,
            allow_decline: false,
        },
        { 
            headers: {
            'Authorization': `Bearer ${config.SIGNEASY_API_KEY}`,
            "Content-Type": 'application/json',
        }})

        return embedded_response.data.url
    } catch (e) { return e }
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
    return {pdf, request}
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
            employee_name: `${request.employee_name}`,
        }
        return response
    })
    return await Promise.all(requests)
}

async function create(userParam) {

    // TODO: notify employee of request over email
    let employee
    let employer
    if (await Request.findOne({ employer_id: userParam.employer_id }) && 
        await Request.findOne({ 'employee.phone_number': userParam.phone_number }))  {

        throw 'this request already exists ';
    }
    try {
        employer = await Employer.findById(userParam.employer_id)
        if (!employer) {
            throw 'Employer does not exist'
        }
    } catch (e) {
        throw 'Employer does not exist'
    }

    userParam.stage = 0
    userParam.employee_email = userParam.email
    userParam.employee_phone_number = userParam.phone_number

    const request = new Request(userParam);

    smsNotify({
        phone_number: userParam.phone_number,
        message: `${employer.employer_name} has requested that you fill out a Work Opportunity form. Go to ${config.client_url}/signup?type=employee to respond.`
    })

    // save request
    await request.save();
}

async function update(id, userParam, user_id) {

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