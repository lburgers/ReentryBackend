const pdfFiller =  require('pdffiller-stream')

const build8850 = (employer, employee, request) => {
	return { 
		applicant_street_address: employee.street_address,
		applicant_name: `${employee.first_name} ${employee.last_name}`,
		multi_check: employee.ex_felon ? 'On' : '',
		// veteran_unemployed: '',
		// veteran_disabled: '',
		// veteran_unemployed_disabled: '',
		// tanf: '',
		// on_unemployment: '',
		// swa_certified: '',
		applicant_phone_number: employee.phone_number,
		applicant_county: employee.county,
		applicant_ssn: employee.ssn,
		applicant_city_state_and_zip: `${employee.city}, ${employee.state} ${employee.zipcode}`,
		applicant_dob: employee.dob ? employee.dob : '',
		employer_phone_number: employer.phone_number,
		employer_ein: employer.ein,
		employer_street_address: employer.street_address,
		employer_city_state_and_zip: `${employer.city}, ${employer.state} ${employer.zipcode}`,
		contact_name: '',
		contact_phone: '',
		contact_street_address: '',
		contact_city_state_zip: '',
		group_number: '',
		gave_information_date: request.gave_information_date,
		offered_job_date: request.offered_job_date,
		hired_date: request.hired_date,
		started_job_date: request.started_job_date,
		employer_name: employer.employer_name, 
	}
}

const build9061 = (employer, employee, request) => {
	return {
		employer_name: employer.employer_name,
		employer_address_and_phone: `${employer.street_address}\n${employer.city}, ${employer.state} ${employer.zipcode}\n${employer.phone_number}`,
		employer_ein: employer.ein,
		applicant_first_MI_last: `${employee.first_name} ${employee.middle_initial ? employee.middle_initial : ''} ${employee.last_name}`,
		applicant_ssn: employee.ssn,
		// last_date_of_employement: '',
		employment_start_date: request.started_job_date,
		starting_wage: request.starting_wage,
		position: request.position ? request.position : '',
		// have_you_worked_before_no: request.have_worked_before ? '' : 'Yes',
		// applicant_dob: employee.dob ? employee.dob : '',
		// have_you_worked_before_yes: request.have_worked_before ? 'Yes' : '',
		// over16_under40_no: employee.dob ? '' : 'Yes',
		// over16_under40_yes: employee.dob ? 'Yes' : '',
		// veteran_no: '',
		// veteran_yes: '',
		// snap_for3months_inpast15months_no: '',
		// snap_for3months_inpast15months_yes: '',
		// veteran_disability_compensation_no: '',
		// veteran_disability_compensation_yes: '',
		// veteran_discharged_within_year_no: '',
		// veteran_discharged_within_year_yes: '',
		// snap_6months_before_hired_no: '',
		// snap_6months_before_hired_yes: '',
		// snap_3monthsperiod_but_done_no: '',
		// snap_primary_recipient: '',
		// snap_city_and_state: '',
		// snap_3monthsperiod_but_done_yes: '',
		// VRA_referal_yes: '',
		// VRA_referal_no: '',
		// TWA_referal_yes: '',
		// TWA_referal_no: '',
		// VA_referal_no: '',
		// VA_referal_yes: '',
		// TANF_any_18_months_no: '',
		// TANF_last_18_months_yes: '',
		// TANF_last_18_months_no: '',
		// TANF_any_18_months_yes: '',
		// TANF_max_limit_no: '',
		// TANF_max_limit_yes: '',
		// TANF_any9months_inlast_18months_no: '',
		// TANF_primary_recipient: '',
		// TANF_city_and_state: '',
		// TANF_any9months_inlast_18months_yes: '',
		// ex_felon_last_year_no: employee.ex_felon ? '' : 'Yes',
		// date_of_conviction: '',
		// date_of_release: '',
		// ex_felon_last_year_yes: employee.ex_felon ? 'Yes' : '',
		// ex_felon_state: '',
		// ex_felon_federal: '',
		// empoyerment_zone_RRC_no: '',
		// signature: '',
		// signature_date: '',
		// signed_by_consultant: '',
		// signed_by_SWA: '',
		// signed_by_participating_agency: '',
		// signed_by_parent: '',
		// signed_by_employer: '',
		// signed_by_applicant: '',
		// empoyerment_zone_RRC_yes: '',
		// empoyerment_zone_16_to_18_no: '',
		// empoyerment_zone_16_to_18_yes: '',
		// ssi_within_60_days_no: '',
		// ssi_within_60_days_yes: '',
		// veteran_unemployed_6months_yes: '',
		// veteran_unemployed_6months_no: '',
		// veteran_unemployed_4weeks_no: '',
		// veteran_unemployed_4weeks_yes: '',
		// unemployment_27weeks_yes: '',
		// unemployment_27weeks_no: '',
		// unemployment_state: '',
		// documentation_sources: '',
	}
}

const buildFormData = (employer, employee, request, type) => {
	// TODO: validation and factor in stage
	return type == '8850' ? build8850(employer,employee,request) : build9061(employer,employee,request)
}

const buildPDFform = async (sourcePDF, data) => {
    const shouldFlatten = false;
    var buffer = new Buffer(0) 
    var outputStream = await pdfFiller.fillFormWithFlatten( sourcePDF, data, shouldFlatten)
    outputStream.on('readable', () => {
        let chunk;
        while (null !== (chunk = outputStream.read())) {
            buffer = Buffer.concat([buffer, chunk])
        }
    });
    const end = new Promise((resolve, reject) => outputStream.on('end', resolve))
    await end
    return buffer
}

const signEasyID = (type) => {
	return type == '8850' ? 3966912 : 3968486
}

module.exports = {
	buildFormData,
	buildPDFform,
	signEasyID,
}