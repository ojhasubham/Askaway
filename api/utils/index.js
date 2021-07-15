const geoip = require('geoip-lite');
const requestIp = require('request-ip');

function isValidTimeZone(tz) {
    if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw 'Time zones are not available in this environment';
    }

    try {
        Intl.DateTimeFormat(undefined, {timeZone: tz});
        return true;
    }
    catch (ex) {
        return false;
    }
}

module.exports = {
    getIpToTimezone: (ip) => {
        if(ip) {
            let geoData = geoip.lookup(ip);
            if(geoData && geoData.timezone && isValidTimeZone(geoData.timezone)){
                return geoData.timezone
            } else {
                false;
            }
        }
    },
    getRequestToIp: async (req) => {
        let ip = null;
        try {
          ip =
            (req.headers['x-forwarded-for'] || '').split(',').pop() ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
        ip  = requestIp.getClientIp(req); 
        } catch (ex) {
          console.log(ex);
          ip = null;
        }
        return ip;
    },
    isValidTimeZone: isValidTimeZone
}