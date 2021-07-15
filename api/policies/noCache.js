

module.exports = (req, res, next) => {
  try {
    // add user activity log
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache'); 
    next();
  } catch (error) {
    return res.send({
      status: false,
      message: 'Error!!',
    });
  }
};
