const jwt = require('jsonwebtoken');

module.exports.generateAccessToken = async (data, expiresIn) => {
  const access_token = jwt.sign(
    data,
    process.env.JWT_SECRET_KEY,
    { expiresIn }
  );

  return access_token;
}
