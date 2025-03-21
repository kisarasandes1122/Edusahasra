import React, { useState, useRef, useEffect } from 'react';
import { FaCloudUploadAlt, FaSchool, FaMapMarkerAlt, FaUserTie, FaPhone, FaLock, FaTimes } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { BsShieldLock } from 'react-icons/bs';
import './SchoolRegistration.css';
import RegistrationSuccessPopup from './RegistrationSuccessPopup.jsx';

const SchoolRegistration = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolEmail: '',
    password: '',
    confirmPassword: '',
    streetAddress: '',
    city: '',
    district: '',
    province: '',
    postalCode: '',
    additionalRemarks: '',
    principalName: '',
    principalEmail: '',
    phoneNumber: '',
    agreeToTerms: false
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [errors, setErrors] = useState({
    schoolName: '',
    schoolEmail: '',
    password: '',
    confirmPassword: '',
    streetAddress: '',
    city: '',
    district: '',
    province: '',
    postalCode: '',
    principalName: '',
    principalEmail: '',
    phoneNumber: '',
    documents: ''
  });

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const passwordRef = useRef(null);
  const fileInputRef = useRef(null);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const sriLankanDistricts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
    "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
    "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
    "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (passwordRef.current && !passwordRef.current.contains(event.target)) {
        setIsPasswordFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => { updateSubmitButtonState(); }, [formData, errors, uploadedFiles]);

  const validatePassword = (password) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  // Email validation regex pattern
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone number validation for Sri Lanka
  const validatePhoneNumber = (phone) => {
    // Basic validation for Sri Lankan phone numbers
    const phoneRegex = /^(?:\+94|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    // Validate password as user types
    if (name === 'password') {
      validatePassword(value);
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }

    // Validate confirm password as user types
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }

    // Validate email as user types
    if (name === 'schoolEmail' || name === 'principalEmail') {
      if (value && !validateEmail(value)) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Please enter a valid email address'
        }));
      }
    }

    // Validate phone number as user types
    if (name === 'phoneNumber') {
      if (value && !validatePhoneNumber(value)) {
        setErrors(prev => ({
          ...prev,
          phoneNumber: 'Please enter a valid phone number (e.g., +94XXXXXXXXX or 0XXXXXXXXX)'
        }));
      }
    }
  };

  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(Boolean);
  };

  const validateForm = () => {
    let formIsValid = true;
    const newErrors = { ...errors };

    // Required field validation
    const requiredFields = [
      'schoolName', 'schoolEmail', 'password', 'confirmPassword',
      'streetAddress', 'city', 'district', 'province', 'postalCode',
      'principalName', 'principalEmail', 'phoneNumber'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
        formIsValid = false;
      }
    });

    // Email validation
    if (formData.schoolEmail && !validateEmail(formData.schoolEmail)) {
      newErrors.schoolEmail = 'Please enter a valid email address';
      formIsValid = false;
    }

    if (formData.principalEmail && !validateEmail(formData.principalEmail)) {
      newErrors.principalEmail = 'Please enter a valid email address';
      formIsValid = false;
    }

    // Password validation
    if (!isPasswordValid()) {
      newErrors.password = 'Password does not meet all requirements';
      formIsValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      formIsValid = false;
    }

    // Phone number validation
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number (e.g., +94XXXXXXXXX or 0XXXXXXXXX)';
      formIsValid = false;
    }

    // Document upload validation
    if (uploadedFiles.length === 0) {
      newErrors.documents = 'Please upload at least one verification document';
      formIsValid = false;
    }

    setErrors(newErrors);
    return formIsValid;
  };

  const isFormValidForSubmit = () => {
    const requiredFields = [
      'schoolName', 'schoolEmail', 'password', 'confirmPassword',
      'streetAddress', 'city', 'district', 'province', 'postalCode',
      'principalName', 'principalEmail', 'phoneNumber'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        return false;
      }
      if (errors[field]) {
        return false;
      }
    }

    if (!formData.agreeToTerms) {
      return false;
    }

    if (uploadedFiles.length === 0) {
      return false;
    }
    if (errors.documents) {
      return false;
    }

    return !errors.schoolEmail && !errors.principalEmail && !errors.phoneNumber && isPasswordValid() && formData.password === formData.confirmPassword;
  };

  const updateSubmitButtonState = () => {
    setIsSubmitDisabled(!isFormValidForSubmit());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log('Form submitted:', formData);
      console.log('Uploaded files:', uploadedFiles);
      
      // Show success popup instead of submitting to server
      setShowSuccessPopup(true);
      
      // In a real application, you would submit form to server here
      // const formDataToSubmit = new FormData();
      // Object.keys(formData).forEach(key => {
      //   formDataToSubmit.append(key, formData[key]);
      // });
      // uploadedFiles.forEach(file => {
      //   formDataToSubmit.append('documents', file.file);
      // });
      // 
      // fetch('/api/register-school', {
      //   method: 'POST',
      //   body: formDataToSubmit
      // })
      // .then(response => response.json())
      // .then(data => {
      //   setShowSuccessPopup(true);
      // })
      // .catch(error => {
      //   console.error('Error:', error);
      // });
    } else {
      // Scroll to the first error
      const firstError = document.querySelector('.scrf_error_message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  // Format file size into readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = (files) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: formatFileSize(file.size),
      file: file
    }));

    // Check if file size exceeds 5MB
    const validFiles = newFiles.filter(fileInfo => {
      const fileSizeInMB = fileInfo.file.size / (1024 * 1024);
      return fileSizeInMB <= 5;
    });

    if (validFiles.length !== newFiles.length) {
      alert("Some files exceed the 5MB limit and were not added.");
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);

    // Clear document upload error if files are added
    if (validFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        documents: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('scrf_drag_over');
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('scrf_drag_over');
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('scrf_drag_over');
    processFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => {
      const updatedFiles = prev.filter(file => file.id !== fileId);
      // Show error if all files are removed
      if (updatedFiles.length === 0) {
        setErrors(prev => ({
          ...prev,
          documents: 'Please upload at least one verification document'
        }));
      }
      return updatedFiles;
    });
  };

  return (
    <>
      <div className="scrf_container">
        <h1 className="scrf_title">Register Your School | පාසල් පද්ධතී ලියාපදිංචි කරන්න</h1>
        <p className="scrf_subtitle">
          Join our platform to receive essential educational resources for your students. Complete the 
          registration and get verified within 24-72 hours
          <br />
          ඔබගේ සිසුන් සඳහා අත්‍යවශ්‍ය අධ්‍යාපනික සම්පත් ලබා ගැනීමට අපගේ වේදිකාවට සම්බන්ධ වන්න. ලියාපදිංචිය සම්පූර්ණ කර 
          පැය 24-72ක් තුළ සත්‍යාපනය ලබා ගන්න.
        </p>

        <form className="scrf_form" onSubmit={handleSubmit}>
          {/* School Information Section */}
          <div className="scrf_section">
            <h2 className="scrf_section_title">School Information | පාසල් තොරතුරු</h2>

            <div className="scrf_form_group">
              <div className="scrf_input_with_icon">
                <FaSchool className="scrf_icon" />
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className={`scrf_input scrf_input_with_icon_field ${errors.schoolName ? 'scrf_input_error' : ''}`}
                  placeholder="School Name | පාසලේ නම *"
                  required
                />
              </div>
              {errors.schoolName && <div className="scrf_error_message">{errors.schoolName}</div>}
            </div>

            <div className="scrf_form_group">
              <div className="scrf_input_with_icon">
                <MdEmail className="scrf_icon" />
                <input
                  type="email"
                  name="schoolEmail"
                  value={formData.schoolEmail}
                  onChange={handleChange}
                  className={`scrf_input scrf_input_with_icon_field ${errors.schoolEmail ? 'scrf_input_error' : ''}`}
                  placeholder="School Email Address (This will be your login email) | පාසලේ විද්‍යුත් තැපැල් ලිපිනය (මෙය ඔබගේ පිවිසුම් විද්‍යුත් තැපෑල වනු ඇත) *"
                  required
                />
              </div>
              {errors.schoolEmail && <div className="scrf_error_message">{errors.schoolEmail}</div>}
            </div>

            <div className="scrf_form_group" ref={passwordRef}>
              <div className="scrf_input_with_icon">
                <BsShieldLock className="scrf_icon" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setIsPasswordFocused(true)}
                  className={`scrf_input scrf_input_with_icon_field ${errors.password ? 'scrf_input_error' : ''}`}
                  placeholder="Password | මුරපදය *"
                  required
                />
              </div>
              {errors.password && <div className="scrf_error_message">{errors.password}</div>}
              {isPasswordFocused && formData.password && (
                <div className="scrf_password_requirements">
                  <ul>
                    <li className={passwordStrength.hasMinLength ? 'scrf_valid' : ''}>
                      <span className="scrf_check_icon">
                        {passwordStrength.hasMinLength ? '✓' : '•'}
                      </span>
                      At least 8 characters
                    </li>
                    <li className={passwordStrength.hasUpperCase ? 'scrf_valid' : ''}>
                      <span className="scrf_check_icon">
                        {passwordStrength.hasUpperCase ? '✓' : '•'}
                      </span>
                      One uppercase letter
                    </li>
                    <li className={passwordStrength.hasLowerCase ? 'scrf_valid' : ''}>
                      <span className="scrf_check_icon">
                        {passwordStrength.hasLowerCase ? '✓' : '•'}
                      </span>
                      One lowercase letter
                    </li>
                    <li className={passwordStrength.hasNumber ? 'scrf_valid' : ''}>
                      <span className="scrf_check_icon">
                        {passwordStrength.hasNumber ? '✓' : '•'}
                      </span>
                      One number
                    </li>
                    <li className={passwordStrength.hasSpecialChar ? 'scrf_valid' : ''}>
                      <span className="scrf_check_icon">
                        {passwordStrength.hasSpecialChar ? '✓' : '•'}
                      </span>
                      One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="scrf_form_group">
              <div className="scrf_input_with_icon">
                <BsShieldLock className="scrf_icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`scrf_input scrf_input_with_icon_field ${errors.confirmPassword ? 'scrf_input_error' : ''}`}
                  placeholder="Confirm Password | මුරපදය තහවුරු කරන්න *"
                  required
                />
              </div>
              {errors.confirmPassword && (
                <div className="scrf_error_message">{errors.confirmPassword}</div>
              )}
            </div>
          </div>

          {/* School Address Section */}
          <div className="scrf_section">
            <h2 className="scrf_section_title">School Address | පාසල් ලිපිනය</h2>
            <p className="scrf_section_subtitle">Ensure accuracy for logistic & delivery services | ප්‍රවාහන හා බෙදාහැරීමේ සේවා සඳහා නිවැරදි බව තහවුරු කරන්න</p>

            <div className="scrf_form_group">
              <div className="scrf_input_with_icon">
                <FaMapMarkerAlt className="scrf_icon" />
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  className={`scrf_input scrf_input_with_icon_field ${errors.streetAddress ? 'scrf_input_error' : ''}`}
                  placeholder="Street Address | වීථි ලිපිනය *"
                  required
                />
              </div>
              {errors.streetAddress && <div className="scrf_error_message">{errors.streetAddress}</div>}
            </div>

            <div className="scrf_form_row">
              <div className="scrf_form_group scrf_half_width">
                <div className="scrf_input_with_icon">
                  <FaMapMarkerAlt className="scrf_icon" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`scrf_input scrf_input_with_icon_field ${errors.city ? 'scrf_input_error' : ''}`}
                    placeholder="City | නගරය *"
                    required
                  />
                </div>
                {errors.city && <div className="scrf_error_message">{errors.city}</div>}
              </div>
              <div className="scrf_form_group scrf_half_width">
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className={`scrf_select ${errors.district ? 'scrf_input_error' : ''}`}
                  required
                >
                  <option value="">District | දිස්ත්‍රික්කය *</option>
                  {sriLankanDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                {errors.district && <div className="scrf_error_message">{errors.district}</div>}
              </div>
            </div>

            <div className="scrf_form_row">
              <div className="scrf_form_group scrf_half_width">
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className={`scrf_input ${errors.province ? 'scrf_input_error' : ''}`}
                  placeholder="Province | පළාත *"
                  required
                />
                {errors.province && <div className="scrf_error_message">{errors.province}</div>}
              </div>
              <div className="scrf_form_group scrf_half_width">
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={`scrf_input ${errors.postalCode ? 'scrf_input_error' : ''}`}
                  placeholder="Postal Code | තැපැල් කේතය *"
                  required
                />
                {errors.postalCode && <div className="scrf_error_message">{errors.postalCode}</div>}
              </div>
            </div>

            <div className="scrf_form_group">
              <textarea
                name="additionalRemarks"
                value={formData.additionalRemarks}
                onChange={handleChange}
                className="scrf_textarea"
                placeholder="Additional Remarks | අමතර සටහන් (Optional)"
              />
            </div>
          </div>

          {/* Principal Information Section */}
          <div className="scrf_section">
            <h2 className="scrf_section_title">Principal / Contact Person Details | විදුහල්පති / සම්බන්ධතා පුද්ගලයාගේ විස්තර</h2>

            <div className="scrf_form_group">
              <div className="scrf_input_with_icon">
                <FaUserTie className="scrf_icon" />
                <input
                  type="text"
                  name="principalName"
                  value={formData.principalName}
                  onChange={handleChange}
                  className={`scrf_input scrf_input_with_icon_field ${errors.principalName ? 'scrf_input_error' : ''}`}
                  placeholder="Name | නම *"
                  required
                />
              </div>
              {errors.principalName && <div className="scrf_error_message">{errors.principalName}</div>}
            </div>

            <div className="scrf_form_group">
              <div className="scrf_input_with_icon">
                <MdEmail className="scrf_icon" />
                <input
                  type="email"
                  name="principalEmail"
                  value={formData.principalEmail}
                  onChange={handleChange}
                  className={`scrf_input scrf_input_with_icon_field ${errors.principalEmail ? 'scrf_input_error' : ''}`}
                  placeholder="Email | විද්‍යුත් තැපෑල *"
                  required
                />
              </div>
              {errors.principalEmail && <div className="scrf_error_message">{errors.principalEmail}</div>}
            </div>

            <div className="scrf_form_group">
              <div className="scrf_input_with_icon">
                <FaPhone className="scrf_icon" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`scrf_input scrf_input_with_icon_field ${errors.phoneNumber ? 'scrf_input_error' : ''}`}
                  placeholder="Phone Number | දුරකථන අංකය *"
                  required
                />
              </div>
              {errors.phoneNumber && <div className="scrf_error_message">{errors.phoneNumber}</div>}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="scrf_section">
            <h2 className="scrf_section_title">School Verification Documents | පාසල් සත්‍යාපන ලේඛන</h2>

            <div
              className={`scrf_upload_area ${errors.documents ? 'scrf_upload_error' : ''}`}
              onClick={handleFileUploadClick}
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
            >
              <FaCloudUploadAlt className="scrf_upload_icon" />
              <p className="scrf_upload_text">Drop your files here or Browse | ඔබගේ ගොනු මෙහි අතහරින්න හෝ පිරික්සන්න *</p>
              <p className="scrf_upload_formats">Allowed formats: .pdf, .jpg, .png (Max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                className="scrf_file_input"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                multiple
                required
              />
            </div>
            {errors.documents && <div className="scrf_error_message">{errors.documents}</div>}

            {/* File List display */}
            {uploadedFiles.length > 0 && (
              <div className="scrf_uploaded_files">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="scrf_file_item">
                    <div className="scrf_file_info">
                      <span className="scrf_file_name">{file.name}</span>
                      <span className="scrf_file_size">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      className="scrf_file_remove"
                      onClick={() => handleRemoveFile(file.id)}
                      aria-label="Remove file"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agreement Section */}
          <div className="scrf_agreement">
            <label className="scrf_checkbox_container">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
              />
              <span className="scrf_checkbox_text">
                I agree to the Terms & Conditions | මම නියමයන් සහ කොන්දේසි වලට එකඟ වෙමි *
              </span>
            </label>
          </div>

          <p className="scrf_verification_note">
            *Verification takes 24 to 72 hours. You will receive an email once your account is approved. After that you can log into account using email and password | *සත්‍යාපනය පැය 24 සිට 72 දක්වා ගත වේ. ඔබගේ ගිණුම අනුමත වූ පසු ඔබට විද්‍යුත් තැපෑලක් ලැබෙනු ඇත. ඉන් පසුව ඔබට විද්‍යුත් තැපෑල සහ මුරපදය භාවිතයෙන් ගිණුමට පිවිසිය හැක
          </p>

          <button
            type="submit"
            className="scrf_submit_button"
            disabled={isSubmitDisabled}
          >
            Register & Submit for Verification
          </button>
        </form>
      </div>

      {/* Success Popup Component */}
      <RegistrationSuccessPopup isVisible={showSuccessPopup} />
    </>
  );
};

export default SchoolRegistration;