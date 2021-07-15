module.exports = (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (authorization && authorization === process.env.ZOOM_WEBHOOK_TOKEN) {
      next();
    } else {
      res.status(200).json({
        message: "Auth Failed",
      });
    }
  } catch (error) {
    return res.status(200).json({
      message: "zoom webhook Auth Failed",
    });
  }
};
