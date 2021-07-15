const jwt = require("jsonwebtoken");
const userActivityLog = require("../utils/userActivityLog");

module.exports = (req, res, next) => {
  try {
    // add user activity log
    userActivityLog.add({ params: req.allParams(), path: req.path, method: req.method, ip: req.ip });

    next();
  } catch (error) {
    return res.send({
      status: false,
      message: 'Error!!',
    });
  }
};
