// backend/controllers/donorController.js
const asyncHandler = require('express-async-handler');
const Donor = require('../models/donorModel');
const Donation = require('../models/donationModel'); // Import Donation model
const { generateToken, generateResetToken } = require('../utils/passwordUtils'); // Import generateResetToken
const crypto = require('crypto'); // Import crypto for reset password token hashing
const nodemailer = require('nodemailer'); // Import nodemailer
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, NODE_ENV } = require('../config/config'); // Import email config
const validator = require('validator'); // Import validator for email/phone validation


// --- Email Transporter Setup ---
let transporter;
// Flag and variable to handle asynchronous Ethereal setup in development
let testAccountSetupComplete = false;
let testAccountUser = null; // Store the Ethereal user email

if (NODE_ENV === 'production') {
    // Configure for your production email service
    transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
         // Optional: Add TLS options if needed
         // tls: {
            // rejectUnauthorized: false // Only use in development/testing if necessary
         // }
    });
    testAccountSetupComplete = true; // In production, config is ready sync
} else {
    // Use ethereal for development testing
    nodemailer.createTestAccount((err, account) => {
        if (err) {
            console.error('Failed to create a testing account. ' + err.message);
            // Do not process.exit here in case other parts of the server can run
            // The sendEmail function will handle the missing transporter by throwing
            return;
        }
        console.log('Mailosaur/Ethereal Account created: %s', account.user);
        console.log('Mailosaur/Ethereal Password: %s', account.pass);
         // The view email URL is obtained later when sending
        console.log('View emails at: use the "Preview URL" logged on send.');

        transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass,
            },
             // Added for local testing environments that might have self-signed certs
             tls: {
                rejectUnauthorized: false
             }
        });
        testAccountUser = account.user; // Store the Ethereal user
        testAccountSetupComplete = true; // Set flag on success
    });
}

// --- Helper function to send email ---
const sendEmail = async (options) => {
     // In development, wait briefly for Ethereal account setup if not ready
     if (NODE_ENV !== 'production' && !transporter && !testAccountSetupComplete) {
          console.warn("Email transporter not yet configured (Ethereal). Waiting...");
          // A simple short wait; robust retries might be needed in complex apps
          await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
     }

    if (!transporter) {
        console.error("Email transporter is not configured or failed to initialize.");
        throw new Error("Email service not available. Check backend logs.");
    }

    // Determine the sender address based on the environment
    // In development, use the Ethereal account user because the SMTP server
    // typically only allows sending from the authenticated address.
    // In production, use the configured EMAIL_USER.
    const senderEmail = NODE_ENV === 'production' ? EMAIL_USER : testAccountUser;

    if (!senderEmail) {
         console.error("Sender email address is not defined. Check transporter setup or EMAIL_USER config.");
         throw new Error("Email service not properly configured.");
    }


    const mailOptions = {
        from: `"EduSahasra" <${senderEmail}>`, // Use the determined sender email
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html,                  // HTML body (optional)
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        if (NODE_ENV !== 'production') {
             // Log the preview URL for development testing
             console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('Error sending email:', error);
         // Re-throw the error with a specific message for the controller
        throw new Error('Failed to send email.');
    }
};


// @desc    Register a new donor
// @route   POST /api/donors/register
// @access  Public
const registerDonor = asyncHandler(async (req, res) => {
  const { fullName, email, password, confirmPassword, phoneNumber, address, agreeToTerms, latitude, longitude } = req.body;

  // Validate input
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

  // Basic password complexity check
   if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
       res.status(400);
       throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character.');
   }

    // Email format validation
    if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error('Please provide a valid email address.');
    }

    // Phone number format validation
     if (phoneNumber !== '' && !/^(?:\+94|0)[0-9]{9}$/.test(phoneNumber)) {
         res.status(400);
         throw new Error('Invalid phone number format.');
     }


  // Check if donor exists
  const donorExists = await Donor.findOne({ email });

  if (donorExists) {
    res.status(400);
    throw new Error('Donor already exists with this email');
  }

    // Prepare location data
    let locationData = undefined;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Check if latitude/longitude were provided and are valid numbers
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
         locationData = { type: 'Point', coordinates: [lon, lat] };
    } else if (latitude !== undefined || longitude !== undefined) { // If provided but maybe empty/invalid
         // If they are provided but are empty strings or not valid numbers,
         // and were not explicitly null (which frontend should send to clear),
         // we might consider it invalid input if location is meant to be provided.
         // For registration, allow empty strings for lat/lon if not providing location yet.
         if (latitude !== '' || longitude !== '') { // If non-empty values were sent but weren't valid numbers
             console.warn(`Received invalid non-empty location during registration: Lat=${latitude}, Lon=${longitude}`);
             // Decide if this should be a hard error. For now, we'll just skip adding location if invalid.
         }
    }


  // Create donor
  const donor = await Donor.create({
    fullName,
    email,
    password, // Password hashing is handled by the pre-save hook in the model
    phoneNumber,
    address,
    agreeToTerms,
    location: locationData, // Only add if valid coordinates were provided
     // Default notification preferences are set in the model
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

  // Check for donor email and SELECT password for comparison
  const donor = await Donor.findOne({ email }).select('+password'); // <-- SELECT password

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
  // req.donor is attached by the protect middleware
  const donor = await Donor.findById(req.donor._id).select('-password'); // Exclude password hash

  if (donor) {
     // --- Implement fetching donation count ---
     const donationsCount = await Donation.countDocuments({ donor: req.donor._id });
     // --- End implementation ---

    const profileData = {
        _id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        phoneNumber: donor.phoneNumber,
        address: donor.address,
        // Extract latitude/longitude from GeoJSON, default to null if location is missing
        latitude: donor.location?.coordinates?.[1] ?? null,
        longitude: donor.location?.coordinates?.[0] ?? null,
         // Include notification preferences, default object if missing
        notificationPreferences: donor.notificationPreferences || { email: true, donationUpdates: true, impactReports: true },
        createdAt: donor.createdAt,
        // Include the fetched donation count
        donationsCount: donationsCount,
        // Extract member since year, default to null if creation date is missing
        memberSince: donor.createdAt ? new Date(donor.createdAt).getFullYear().toString() : null // Ensure it's a string if frontend expects it
    };

    res.json(profileData);

  } else {
    res.status(404);
    throw new Error('Donor profile not found'); // Should not happen with protect middleware if token is valid
  }
});

// @desc    Update donor profile (Personal Info and Notifications)
// @route   PUT /api/donors/profile
// @access  Private
const updateDonorProfile = asyncHandler(async (req, res) => {
  // req.donor is attached by the protect middleware
  const donor = await Donor.findById(req.donor._id); // Fetch without selecting password initially

  if (!donor) {
    res.status(404);
    throw new Error('Donor not found'); // Should not happen with protect middleware if token is valid
  }

  // Update fields if they are provided in the request body (check specifically for `undefined`)
  if (req.body.fullName !== undefined) donor.fullName = req.body.fullName;

  // Handle email update carefully
  if (req.body.email !== undefined && req.body.email !== donor.email) {
       if (!validator.isEmail(req.body.email)) {
           res.status(400);
           throw new Error('Please provide a valid email address.');
       }
      // Optional: Add validation if new email is already in use by another donor
      const emailExists = await Donor.findOne({ email: req.body.email, _id: { $ne: donor._id } });
      if(emailExists) {
          res.status(400);
          throw new Error('Email address is already in use.');
      }
      donor.email = req.body.email;
  }

  // Handle phone number update
  if (req.body.phoneNumber !== undefined) {
       // Allow clearing phone number by sending empty string, but validate format if non-empty
       if (req.body.phoneNumber !== '' && !/^(?:\+94|0)[0-9]{9}$/.test(req.body.phoneNumber)) {
           res.status(400);
           throw new Error('Invalid phone number format.');
       }
      donor.phoneNumber = req.body.phoneNumber;
  }

  if (req.body.address !== undefined) donor.address = req.body.address;

  // Update Location if provided
  const lat = parseFloat(req.body.latitude);
  const lon = parseFloat(req.body.longitude);

  // Check if latitude/longitude were provided and are valid numbers
  if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
       // Update location if valid coordinates are provided
       donor.location = { type: 'Point', coordinates: [lon, lat] };
  } else if (req.body.latitude === null && req.body.longitude === null) {
       // Allow clearing location if explicitly sent as null
       donor.location = undefined; // Or null, depending on schema
  } else if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
       // If either was provided but not valid numbers AND not null, throw error
       if (req.body.latitude !== '' || req.body.longitude !== '') { // Only if they tried to send non-empty invalid values
            res.status(400);
            throw new Error('Invalid latitude or longitude provided for location.');
       }
       // If they were sent as empty strings, treat as no change or clear if already empty
       // The check `req.body.latitude !== undefined` means we processed the key
       // If they were sent as empty strings and location was previously set, we might want to clear it.
       // A safer approach is to require explicit null to clear location.
       // Let's stick to: valid numbers update, nulls clear, anything else leaves as is UNLESS invalid non-empty sent.
  }
   // If req.body.latitude and req.body.longitude are both undefined, location remains unchanged.


  // Update Notification Preferences if provided and is an object
  if (req.body.notificationPreferences !== undefined && typeof req.body.notificationPreferences === 'object') {
       // Get current preferences or default, then merge incoming valid keys
       const currentPrefs = donor.notificationPreferences || {};
       const newPrefs = req.body.notificationPreferences;

       // Update individual preferences only if the key exists in the incoming data and is boolean
       if (newPrefs.email !== undefined && typeof newPrefs.email === 'boolean') currentPrefs.email = newPrefs.email;
       if (newPrefs.donationUpdates !== undefined && typeof newPrefs.donationUpdates === 'boolean') currentPrefs.donationUpdates = newPrefs.donationUpdates;
       if (newPrefs.impactReports !== undefined && typeof newPrefs.impactReports === 'boolean') currentPrefs.impactReports = newPrefs.impactReports;

       // Apply the potentially updated preferences object
       donor.notificationPreferences = currentPrefs;
  }


  // Save the updated donor document
  const updatedDonor = await donor.save();

   // Re-fetch donation count after potential profile update (though it doesn't change count)
   // Or just return the old count as it's not affected by profile updates
   const donationsCount = await Donation.countDocuments({ donor: req.donor._id });


  // Respond with the updated profile data (excluding password)
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
    donationsCount: donationsCount, // Return updated count
    memberSince: updatedDonor.createdAt ? new Date(updatedDonor.createdAt).getFullYear().toString() : null
  });
});


// @desc    Update donor password (while logged in)
// @route   PUT /api/donors/profile/password
// @access  Private
const updateDonorPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const donorId = req.donor._id; // Get ID from protected route

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Please provide current password, new password, and confirm password.');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match.');
    }

    // Password complexity validation (basic example)
     if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long and include uppercase, number, and special character.');
    }


    // Fetch donor, including the password hash for comparison
    const donor = await Donor.findById(donorId).select('+password'); // <-- SELECT password

    if (!donor) {
        res.status(404);
        throw new Error('Donor not found.'); // Should not happen with protect middleware
    }

    // Verify current password
    const isMatch = await donor.matchPassword(currentPassword);
    if (!isMatch) {
        res.status(401); // Unauthorized
        throw new Error('Incorrect current password.');
    }

    // Update password field (pre-save hook will hash it)
    donor.password = newPassword;

    // Save the updated donor document
    await donor.save(); // Password hashing happens here

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

    // Email format validation
    if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error('Please provide a valid email address.');
    }


    const donor = await Donor.findOne({ email });

    if (!donor) {
        // Respond without revealing if the email exists for security
        return res.status(200).json({ message: 'If a donor with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token and expiry
    const { resetToken, resetPasswordToken, resetPasswordExpire } = generateResetToken();

    // Save the hashed token and expiry to the donor record
    donor.resetPasswordToken = resetPasswordToken;
    donor.resetPasswordExpire = resetPasswordExpire;
    await donor.save({ validateBeforeSave: false }); // Skip validation as we are only updating token fields

    // --- Send Email ---
    // Construct the reset URL for the frontend reset page
    // We replace the backend port (5000) with the likely frontend port (3000)
    const frontendPort = 5173; // Assuming frontend runs on 3000
    const backendHost = req.get('host'); // e.g., 'localhost:5000' or 'yourdomain.com:5000'
    const frontendHost = backendHost.includes(':') ? backendHost.split(':')[0] + ':' + frontendPort : backendHost; // Replace port if present

    const resetUrl = `${req.protocol}://${frontendHost}/reset-password?token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) have requested the reset of a password for your EduSahasra account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nThis link is valid for 1 hour.`;

    try {
        await sendEmail({
            email: donor.email,
            subject: 'EduSahasra Password Reset Request',
            message: message,
        });

        res.status(200).json({ message: 'If a donor with that email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('Error sending password reset email:', error);
        // Clear token fields if email sending fails to prevent a stale token
        donor.resetPasswordToken = undefined;
        donor.resetPasswordExpire = undefined;
        await donor.save({ validateBeforeSave: false });

        // Re-throw error for asyncHandler to handle
        // The sendEmail function already throws an Error with the message 'Failed to send email.'
        throw error; // Re-throw the caught error from sendEmail
    }
});

// @desc    Reset password using token
// @route   PUT /api/donors/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const resetToken = req.params.token; // Token from URL param
    const { newPassword, confirmPassword } = req.body;

    // Basic input validation
    if (!resetToken || resetToken.trim() === '') {
        res.status(400);
        throw new Error('Password reset token is missing.');
    }
    if (!newPassword || !confirmPassword) {
         res.status(400);
         throw new Error('Please provide new password and confirm password.');
    }

    // Hash the incoming token to compare with the one stored in the DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Find the donor by the hashed token and check if the token is still valid
    const donor = await Donor.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() } // Token must be greater than current time
    }).select('+password'); // Select password to update it

    if (!donor) {
        res.status(400);
        throw new Error('Invalid or expired password reset token.');
    }

    // Validate new password input matches confirmation
    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match.');
    }

     // Password complexity validation (basic example)
     if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        res.status(400);
        throw new Error('New password must be at least 8 characters long and include uppercase, number, and special character.');
    }

    // Update password and clear reset token fields
    donor.password = newPassword; // Mongoose pre-save hook will hash it
    donor.resetPasswordToken = undefined; // Clear the token fields after use
    donor.resetPasswordExpire = undefined;

    // Save the donor document
    await donor.save();

    res.status(200).json({ message: 'Password has been successfully reset. You can now login.' });
});


// @desc    Get public details of a single donor (e.g., for request views - Optional)
// @route   GET /api/donors/:id
// @access  Public (Be cautious with what is returned)
/*
const getDonorById = asyncHandler(async (req, res) => {
    const donorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(donorId)) {
        res.status(400);
        throw new Error('Invalid Donor ID format.');
    }
    // Select only non-sensitive public info like ID and maybe full name, city/district from location
    const donor = await Donor.findById(donorId).select('_id fullName location');
    if (!donor) {
        res.status(404);
        throw new Error('Donor not found.');
    }

    // You might need to reverse geocode the location coordinates to get city/district
    // if you want to display it publicly without storing address directly.
    // For simplicity, returning just ID, name, and raw coordinates here.

    res.json({
        _id: donor._id,
        fullName: donor.fullName,
        latitude: donor.location?.coordinates?.[1] ?? null,
        longitude: donor.location?.coordinates?.[0] ?? null,
        // Add city/district if you implement reverse geocoding here
    });
});
*/


module.exports = {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorProfile,
  updateDonorPassword, // Export logged-in password update
  forgotPassword,      // Export forgot password request
  resetPassword,        // Export reset password with token
  // getDonorById // Optional export
};