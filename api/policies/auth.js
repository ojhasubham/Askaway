const jwt = require("jsonwebtoken");
const userActivityLog = require("../utils/userActivityLog");

module.exports = (req, res, next) => {
  try {
    let { access_token } = req.allParams();
    const token = access_token && access_token.split(" ")[1] || req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userData = decode;

    // add user activity log
    userActivityLog.add({ params: req.allParams(), path: req.path, method: req.method, userId: decode.id, ip: req.ip });

    next(null, req.userData);
  } catch (error) {
    return res.status(401).json({
      message: "Auth Failed",
    });
  }
};
