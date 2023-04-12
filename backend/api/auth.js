const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const User = require('./modelUser');


exports.register = asyncHandler(async (req, res, next) => {
    const {name, email, password, role} = req.body;

    const user = await  User.create({
        name, email, password, role });

 
  const token = user.getSignedJwtToken();

 
  sendTokenResponse(user, 200, res);
  });

  exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
  
    // Validate emil & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }
  
    // Check for user
    const user = await User.findOne({ email }).select('+password');
  
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
  
    // Check if password matches
    const isMatch = await user.matchPassword(password);
  
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
  
   
     sendTokenResponse(user, 200, res);
  });

  exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
  
    res.status(200).json({
      success: true,
      data: {},
    });
  });

  exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };
  
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });
  
    res.status(200).json({
      success: true,
      data: user,
    });
  });

  exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
  
    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Password is incorrect', 401));
    }
  
    user.password = req.body.newPassword;
    await user.save();
  
    sendTokenResponse(user, 200, res);
  });

  exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
  
    if (!user) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }
  
    // Get reset token
    const resetToken = user.getResetPasswordToken();
   
    await user.save({ validateBeforeSave: false });
    console.log(resetToken)
      res.status(200).json({ success: true, data: user , resetToken });
   
    
  });

  exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');
  
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      return next(new ErrorResponse('Invalid token', 400));
    }
  
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  
    sendTokenResponse(user, 200, res);
  });


  exports.confirmEmail = asyncHandler(async (req, res, next) => {
    // grab token from email
    const { token } = req.query;
  
    if (!token) {
      return next(new ErrorResponse('Invalid Token', 400));
    }
  
    const splitToken = token.split('.')[0];
    const confirmEmailToken = crypto
      .createHash('sha256')
      .update(splitToken)
      .digest('hex');
  
    // get user by token
    const user = await User.findOne({
      confirmEmailToken,
      isEmailConfirmed: false,
    });
  
    if (!user) {
      return next(new ErrorResponse('Invalid Token', 400));
    }
  
    // update confirmed to true
    user.confirmEmailToken = undefined;
    user.isEmailConfirmed = true;
  
    // save
    user.save({ validateBeforeSave: false });
  
    // return token
    sendTokenResponse(user, 200, res);
  });
  


  // Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};

exports.getMe = asyncHandler(async (req, res, next) => {
  // user is already available in req due to the protect middleware
  const user = req.user;

  res.status(200).json({
    success: true,
    data: user,
  });
});