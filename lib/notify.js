const Twilio = require('twilio')
const config = require('../config.js')

module.exports = {
    smsNotify
};

function smsNotify({phone_number, message}) {
    const client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        // Create options to send the message
        const options = {
            to: `+1${phone_number}`,
            from: config.TWILIO_PHONE_NUMBER,
            body: message,
        };

        // Send the message!
        client.messages.create(options, function(err, response) {
            if (err) {
                // Just log it for now
                console.error(err);
            } else {
                // Log the last few digits of a phone number
                let masked = phone_number.substr(0, phone_number.length - 5);
                masked += '*****';
                console.log(`Message sent to ${masked}`);
            }
        });
}
