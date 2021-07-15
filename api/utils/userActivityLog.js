const { sendEmailAlert } = require('../services/email')

module.exports = {
  add: async (logData) => {
    const { params, path, method, userId, ip } = logData;

    const data = { params, path, method, userId, ip };
    await user_all_activity_log.create(data);
  },
  errorAlert: async (subject, body, error) => {
    sendEmailAlert( subject, body, error)
  }
}
