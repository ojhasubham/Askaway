module.exports.accountVerifyText = (link) => {
    let msg = `Thanks for signing up! pleaser click on below link to verify account ${link}`
    return msg;
}

module.exports.sendPassVerifyText = (link) => {
    let msg = `Not to worry, we got you! Let’s get you a new password. pleaser click on below link to generate new password ${link}`
    return msg;
}

module.exports.sendProScheduledMeetText = (topic, start_time, confirmLink, cancelLink) => {
    let msg = `A meeting schedule for you with ${topic}, that start at ${start_time}. pleaser click on below link to confirm meeting ${confirmLink} or cancel meeting ${cancelLink}`
    return msg;
}

module.exports.sendStudScheduledMeetText = (topic, start_time, joinLink) => {
    let msg = `A meeting schedule for you with ${topic}, that start at ${start_time}. pleaser click on below link to join meeting ${joinLink}`
    return msg;
}

module.exports.sendProRescheduledMeetText = (topic, start_time, confirmLink, cancelLink) => {
    let msg = `A meeting reschedule for you with ${topic}, that start at ${start_time}. pleaser click on below link to confirm meeting ${confirmLink} or cancel meeting ${cancelLink}`
    return msg;
}

module.exports.sendStudRescheduledMeetText = (topic, start_time, joinLink) => {
    let msg = `A meeting schedule for you with ${topic}, that start at ${start_time}. pleaser click on below link to join meeting ${joinLink}`
    return msg;
}

module.exports.sendProDeletedMeetText = (topic, start_time) => {
    let msg = `A ${topic} meeting was scheduled at ${start_time} is cancelled now.`
    return msg;
}

module.exports.sendStudDeletedMeetText = (topic, start_time) => {
    let msg = `A ${topic} meeting was scheduled at ${start_time} is cancelled now.`
    return msg;
}

module.exports.sendStudConfirmedMeetText = (topic, start_time) => {
    let msg = `A ${topic} meeting was scheduled at ${start_time} is Confirmed now.`
    return msg;
}

module.exports.sendProConfirmMeetText = (topic, start_time, confirm_url) => {
    let msg = `Please confirm your scheduled ${topic} meeting at ${start_time} by clicking below link ${confirm_url} You are the host of this meeting`
    return msg;
}

module.exports.sendUpcomingMeetText = (time_count, time_type) => {
    let msg = `Your Meeting will be in ${time_count} ${time_type}.Thank you for using our service`
    return msg;
}