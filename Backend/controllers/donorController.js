// backend/controllers/donorController.js
const asyncHandler = require('express-async-handler');
const Donor = require('../models/donorModel');
const Donation = require('../models/donationModel');
const { generateToken, generateResetToken } = require('../utils/passwordUtils');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// No longer need EMAIL_HOST, EMAIL_PORT here if using service: 'gmail'
const { EMAIL_USER, EMAIL_PASS, NODE_ENV } = require('../config/config'); 
const validator = require('validator');


// --- Email Transporter Setup ---
let transporter;

try {
    transporter = nodemailer.createTransport({
        service: 'gmail', // Specify the service name
        auth: {
            user: EMAIL_USER, // Your Gmail address
            pass: EMAIL_PASS, // Your App Password
        },
        // The 'secure' and 'tls' options are typically handled automatically by the 'service' option
        // You can remove them when using service: 'gmail'
    });

    if (NODE_ENV !== 'production') {
         transporter.verify(function (error, success) {
           if (error) {
             console.error("Transporter verification failed:", error);
           } else {
             console.log("Server is ready to take our messages (Transporter verified)");
           }
         });
     }

} catch (error) {
    console.error("Failed to create email transporter:", error);
}


// --- Helper function to send email ---
const sendEmail = async (options) => {
    if (!transporter) {
        console.error("Email transporter is not configured or failed to initialize.");
        throw new Error("Email service not available. Check backend logs.");
    }

    const senderEmail = EMAIL_USER;

    if (!senderEmail) {
         console.error("Sender email address is not defined in configuration (EMAIL_USER).");
         throw new Error("Email service not properly configured.");
    }

    const mailOptions = {
        from: `"EduSahasra" <${senderEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log(`Email sent successfully to ${options.email}`);

    } catch (error) {
        console.error('Error sending email:', error);
        // Do NOT throw a specific error message about credentials back to the client for security
        throw new Error(`Failed to send email.`); // Generic error
    }
};


// @desc    Register a new donor
// @route   POST /api/donors/register
// @access  Public
const registerDonor = asyncHandler(async (req, res) => {
  const { fullName, email, password, confirmPassword, phoneNumber, address, agreeToTerms, latitude, longitude } = req.body;

  if (!fullName || !email || !password || !phoneNumber || !address || agreeToTerms === undefined) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

   if (!agreeToTerms) {
       res.status(400);
       throw new Error('You must agree to the terms and conditions.');
   }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

   if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
       res.status(400);
       throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character.');
   }

    if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error('Please provide a valid email address.');
    }

     if (phoneNumber !== '' && !/^(?:\+94|0)[0-9]{9}$/.test(phoneNumber)) {
         res.status(400);
         throw new Error('Invalid phone number format.');
     }


  const donorExists = await Donor.findOne({ email });

  if (donorExists) {
    res.status(400);
    throw new Error('Donor already exists with this email');
  }

    let locationData = undefined;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
         locationData = { type: 'Point', coordinates: [lon, lat] };
    } else if (latitude !== undefined || longitude !== undefined) {
         if (latitude !== '' || longitude !== '') {
             console.warn(`Received invalid non-empty location during registration: Lat=${latitude}, Lon=${longitude}`);
         }
    }

  const donor = await Donor.create({
    fullName,
    email,
    password,
    phoneNumber,
    address,
    agreeToTerms,
    location: locationData,
  });

  if (donor) {
    res.status(201).json({
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      phoneNumber: donor.phoneNumber,
      address: donor.address,
      location: donor.location,
       notificationPreferences: donor.notificationPreferences,
      token: generateToken(donor._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid donor data received');
  }
});

// @desc    Login donor
// @route   POST /api/donors/login
// @access  Public
const loginDonor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const donor = await Donor.findOne({ email }).select('+password');

  if (donor && (await donor.matchPassword(password))) {
    res.json({
      _id: donor._id,
      fullName: donor.fullName,
      email: donor.email,
      phoneNumber: donor.phoneNumber,
      address: donor.address,
      location: donor.location,
      notificationPreferences: donor.notificationPreferences,
      token: generateToken(donor._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get donor profile
// @route   GET /api/donors/profile
// @access  Private
const getDonorProfile = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.donor._id).select('-password');

  if (donor) {
     const donationsCount = await Donation.countDocuments({ donor: req.donor._id });

    const profileData = {
        _id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        phoneNumber: donor.phoneNumber,
        address: donor.address,
        latitude: donor.location?.coordinates?.[1] ?? null,
        longitude: donor.location?.coordinates?.[0] ?? null,
        notificationPreferences: donor.notificationPreferences || { email: true, donationUpdates: true, impactReports: true },
        createdAt: donor.createdAt,
        donationsCount: donationsCount,
        memberSince: donor.createdAt ? new Date(donor.createdAt).getFullYear().toString() : null
    };

    res.json(profileData);

  } else {
    res.status(404);
    throw new Error('Donor profile not found');
  }
});

// @desc    Update donor profile (Personal Info and Notifications)
// @route   PUT /api/donors/profile
// @access  Private
const updateDonorProfile = asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.donor._id);

  if (!donor) {
    res.status(404);
    throw new Error('Donor not found');
  }

  if (req.body.fullName !== undefined) donor.fullName = req.body.fullName;

  if (req.body.email !== undefined && req.body.email !== donor.email) {
       if (!validator.isEmail(req.body.email)) {
           res.status(400);
           throw new Error('Please provide a valid email address.');
       }
      const emailExists = await Donor.findOne({ email: req.body.email, _id: { $ne: donor._id } });
      if(emailExists) {
          res.status(400);
          throw new Error('Email address is already in use.');
      }
      donor.email = req.body.email;
  }

  if (req.body.phoneNumber !== undefined) {
       if (req.body.phoneNumber !== '' && !/^(?:\+94|0)[0-9]{9}$/.test(req.body.phoneNumber)) {
           res.status(400);
           throw new Error('Invalid phone number format.');
       }
      donor.phoneNumber = req.body.phoneNumber;
  }

  if (req.body.address !== undefined) donor.address = req.body.address;

  const lat = parseFloat(req.body.latitude);
  const lon = parseFloat(req.body.longitude);

  if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    if (!donor.location || !donor.location.coordinates || donor.location.coordinates[0] !== lon || donor.location.coordinates[1] !== lat) {
        donor.location = { type: 'Point', coordinates: [lon, lat] };
    }
  } else if (req.body.latitude === null && req.body.longitude === null) {
       donor.location = undefined;
  } else if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
       if (req.body.latitude !== '' || req.body.longitude !== '') {
            res.status(400);
            throw new Error('Invalid latitude or longitude provided for location.');
       }
  }

  if (req.body.notificationPreferences !== undefined && typeof req.body.notificationPreferences === 'object') {
       const currentPrefs = donor.notificationPreferences || {};
       const newPrefs = req.body.notificationPreferences;

       if (newPrefs.email !== undefined && typeof newPrefs.email === 'boolean') currentPrefs.email = newPrefs.email;
       if (newPrefs.donationUpdates !== undefined && typeof newPrefs.donationUpdates === 'boolean') currentPrefs.donationUpdates = newPrefs.donationUpdates;
       if (newPrefs.impactReports !== undefined && typeof newPrefs.impactReports === 'boolean') currentPrefs.impactReports = newPrefs.impactReports;

       donor.notificationPreferences = currentPrefs;
  }

  const updatedDonor = await donor.save();

   const donationsCount = await Donation.countDocuments({ donor: req.donor._id });


  res.json({
    _id: updatedDonor._id,
    fullName: updatedDonor.fullName,
    email: updatedDonor.email,
    phoneNumber: updatedDonor.phoneNumber,
    address: updatedDonor.address,
    latitude: updatedDonor.location?.coordinates?.[1] ?? null,
    longitude: updatedDonor.location?.coordinates?.[0] ?? null,
    notificationPreferences: updatedDonor.notificationPreferences,
    createdAt: updatedDonor.createdAt,
    donationsCount: donationsCount,
    memberSince: updatedDonor.createdAt ? new Date(updatedDonor.createdAt).getFullYear().toString() : null
  });
});


// @desc    Update donor password (while logged in)
// @route   PUT /api/donors/profile/password
// @access  Private
const updateDonorPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const donorId = req.donor._id;

    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Please provide current password, new password, and confirm password.');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match.');
    }

     if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character.');
    }

    const donor = await Donor.findById(donorId).select('+password');

    if (!donor) {
        res.status(404);
        throw new Error('Donor not found.');
    }

    const isMatch = await donor.matchPassword(currentPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('Incorrect current password.');
    }

    donor.password = newPassword;
    await donor.save();

    res.json({ message: 'Password updated successfully.' });
});


// @desc    Request password reset token (Forgot Password)
// @route   POST /api/donors/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || email.trim() === '') {
        res.status(400);
        throw new Error('Please provide an email address.');
    }

    if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error('Please provide a valid email address.');
    }

    const donor = await Donor.findOne({ email });

    // Respond with the same message whether the user exists or not for security reasons.
    const genericSuccessMessage = 'If a donor with that email exists, a password reset link has been sent.';
    res.status(200).json({ message: genericSuccessMessage }); // Send the response immediately

    // If donor exists, proceed to send email (this happens AFTER the response is sent)
    if (donor) {
       try {
          const { resetToken, resetPasswordToken, resetPasswordExpire } = generateResetToken();
          donor.resetPasswordToken = resetPasswordToken;
          donor.resetPasswordExpire = resetPasswordExpire;
          // Save token details without blocking the response
          donor.save({ validateBeforeSave: false })
               .then(() => {
                   console.log(`Reset token saved for ${donor.email}`);
                   // Attempt to send email after saving the token
                   const backendHost = req.get('host');
                   const frontendPort = (NODE_ENV === 'production' || NODE_ENV === 'staging') ? 80 : 5173; // Assuming frontend on 5173 in dev
                   const frontendHost = backendHost.includes(':')
                       ? backendHost.split(':')[0] + (frontendPort ? ':' + frontendPort : '')
                       : backendHost;

                   const resetUrl = `${req.protocol}://${frontendHost}/reset-password?token=${resetToken}`;
                   const message = `You are receiving this email because you (or someone else) have requested the reset of a password for your EduSahasra account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nThis link is valid for 1 hour.`;

                   sendEmail({
                       email: donor.email,
                       subject: 'EduSahasra Password Reset Request',
                       message: message,
                   })
                   .then(() => console.log(`Password reset email successfully sent to ${donor.email}`))
                   .catch((emailError) => {
                       console.error(`Failed to send password reset email to ${donor.email}:`, emailError);
                       // Optional: Clear token if email sending fails - decision depends on security policy
                       // Clearing prevents token replay if email fails, but makes debugging harder
                       // donor.resetPasswordToken = undefined;
                       // donor.resetPasswordExpire = undefined;
                       // donor.save({ validateBeforeSave: false }).catch(saveErr => console.error("Error clearing token on email failure:", saveErr));
                   });
               })
               .catch((saveErr) => {
                   console.error(`Error saving reset token for ${donor.email}:`, saveErr);
                   // The generic success message has already been sent.
               });

       } catch (error) {
            // This catch block would only catch errors during token generation/initial save attempt.
            // Log it.
           console.error(`An error occurred during the password reset process for ${email}:`, error);
           // The generic success message has already been sent.
       }
    }
    // Function exits here after sending the initial 200 response.
});


// @desc    Reset password using token
// @route   PUT /api/donors/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const resetToken = req.params.token;
    const { newPassword, confirmPassword } = req.body;

    if (!resetToken || resetToken.trim() === '') {
        res.status(400);
        throw new Error('Password reset token is missing.');
    }
    if (!newPassword || !confirmPassword) {
         res.status(400);
         throw new Error('Please provide new password and confirm password.');
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const donor = await Donor.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!donor) {
        res.status(400);
        throw new Error('Invalid or expired password reset token.');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match.');
    }

     if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long and include uppercase, number, and special character.');
    }

    donor.password = newPassword;
    donor.resetPasswordToken = undefined;
    donor.resetPasswordExpire = undefined;

    await donor.save();

    res.status(200).json({ message: 'Password has been successfully reset. You can now login.' });
});


module.exports = {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile,
  updateDonorPassword,
  forgotPassword,
  resetPassword,
};