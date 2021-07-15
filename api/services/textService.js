var client = require('twilio')(process.env.twilioAccountSid, process.env.twilioAccessToken, { 
    lazyLoading: true 
});


module.exports.sendSignUpText = async(messageText, toNumber) =>{
    client.messages.create({
        body: messageText,
        to: toNumber,  // Text this number
        from: process.env.twilioFromNumber // From a valid Twilio number
    })
    .then((message) => console.log(message.sid));
}


module.exports.sendTextTODO = async(country, massageText, toNumber) => {
    console.log('Sending text message: ' + messageText + ' to number: ' + toNumber)
    const fromCountryData = await from_number.find({contryName: country}).limit(1);
    if(fromCountryData && fromCountryData[0] && toNumber && massageText){
        client.messages.create({
            body: massageText,
            to: toNumber,  // Text this number
            from: fromCountryData[0].phoneNumber // From a valid Twilio number
        })
        .then((message) => console.log('message sid', message.sid))
        .catch(err => {
            console.log('sms send error', err)
        })
    }
}

module.exports.sendText = async( massageText, toNumber, country) => {
        client.messages.create({
            body: massageText,
            to: toNumber,  // Text this number
            from: process.env.twilioFromNumber // From a valid Twilio number
        })
        .then((message) => console.log('message :  ', messageText + 'to :' + toNumber))
        .catch(err => {
            console.log('sms send error', err)
        })
}