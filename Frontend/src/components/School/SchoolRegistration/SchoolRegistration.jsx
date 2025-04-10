import React, { useState, useRef, useEffect } from 'react';
import { FaCloudUploadAlt, FaSchool, FaMapMarkerAlt, FaUserTie, FaPhone, FaLock, FaTimes, FaLanguage, FaMapMarkedAlt } from 'react-icons/fa';
import { MdEmail, MdNavigateNext, MdArrowBack, MdMyLocation } from 'react-icons/md';
import { BsShieldLock } from 'react-icons/bs';
import './SchoolRegistration.css';
import RegistrationSuccessPopup from './RegistrationSuccessPopup.jsx';
import translations from './translation.jsx';

const SchoolRegistration = () => {
  // Add language state
  const [language, setLanguage] = useState('en'); // Default language is English
  
  // Track current step
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // School Information
    schoolName: '',
    schoolEmail: '',
    password: '',
    confirmPassword: '',
    
    // School Address
    streetAddress: '',
    city: '',
    district: '',
    province: '',
    postalCode: '',
    additionalRemarks: '',
    
    // Location Data
    latitude: '',
    longitude: '',
    
    // Principal Information
    principalName: '',
    principalEmail: '',
    phoneNumber: '',
    
    // Agreement
    agreeToTerms: false
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

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

  // Get text based on current language
  const getText = (key) => {
    return translations[language][key] || '';
  };
  
  // Language toggle handler
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

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

  useEffect(() => { 
    updateSubmitButtonState(); 
  }, [formData, errors, uploadedFiles, currentStep]);

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

  const validateStep = (step) => {
    let stepIsValid = true;
    const newErrors = { ...errors };

    // Define required fields for each step
    const requiredFieldsByStep = {
      1: ['schoolName', 'schoolEmail', 'password', 'confirmPassword'],
      2: ['streetAddress', 'city', 'district', 'province', 'postalCode'],
      // Step 3 (location) has no required fields as it's optional
      4: ['principalName', 'principalEmail', 'phoneNumber'],
      5: [] // Document upload is validated separately
    };

    // Validate required fields for the current step
    if (requiredFieldsByStep[step]) {
      requiredFieldsByStep[step].forEach(field => {
        if (!formData[field]) {
          newErrors[field] = 'This field is required';
          stepIsValid = false;
        }
      });
    }

    // Step-specific validations
    if (step === 1) {
      // Email validation
      if (formData.schoolEmail && !validateEmail(formData.schoolEmail)) {
        newErrors.schoolEmail = 'Please enter a valid email address';
        stepIsValid = false;
      }

      // Password validation
      if (formData.password && !isPasswordValid()) {
        newErrors.password = 'Password does not meet all requirements';
        stepIsValid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        stepIsValid = false;
      }
    } 
    else if (step === 4) {
      // Email validation for principal
      if (formData.principalEmail && !validateEmail(formData.principalEmail)) {
        newErrors.principalEmail = 'Please enter a valid email address';
        stepIsValid = false;
      }

      // Phone number validation
      if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number (e.g., +94XXXXXXXXX or 0XXXXXXXXX)';
        stepIsValid = false;
      }
    }
    else if (step === 5) {
      // Document upload validation
      if (uploadedFiles.length === 0) {
        newErrors.documents = 'Please upload at least one verification document';
        stepIsValid = false;
      }
      
      // Terms agreement validation for final step
      if (!formData.agreeToTerms) {
        stepIsValid = false;
      }
    }

    setErrors(newErrors);
    return stepIsValid;
  };

  const validateForm = () => {
    // Validate all steps
    let formIsValid = true;
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step)) {
        formIsValid = false;
      }
    }
    return formIsValid;
  };

  const canProceedToNextStep = () => {
    return validateStep(currentStep);
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Scroll to the first error
      const firstError = document.querySelector('.scrf_error_message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const updateSubmitButtonState = () => {
    // Only check if submit should be disabled on the final step
    if (currentStep === 5) {
      setIsSubmitDisabled(!validateStep(5));
    }
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

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError('Failed to get your location. Please check your device permissions.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
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

  // Render progress bar
  const renderProgressBar = () => {
    return (
      <div className="scrf_progress_bar">
        {[1, 2, 3, 4, 5].map(step => (
          <div 
            key={step} 
            className={`scrf_progress_step ${currentStep >= step ? 'scrf_progress_active' : ''}`}
          >
            <div className="scrf_step_number">{step}</div>
            <div className="scrf_step_label">
              {step === 1 && "School Info"}
              {step === 2 && "Address"}
              {step === 3 && "Location"}
              {step === 4 && "Principal"}
              {step === 5 && "Verification"}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render different form sections based on current step
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return renderSchoolInfoStep();
      case 2:
        return renderAddressStep();
      case 3:
        return renderLocationStep();
      case 4:
        return renderPrincipalStep();
      case 5:
        return renderVerificationStep();
      default:
        return null;
    }
  };

  const renderSchoolInfoStep = () => {
    return (
      <div className="scrf_section">
        <h2 className="scrf_section_title">{getText('schoolInfo')}</h2>

        <div className="scrf_form_group">
          <div className="scrf_input_with_icon">
            <FaSchool className="scrf_icon" />
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              className={`scrf_input scrf_input_with_icon_field ${errors.schoolName ? 'scrf_input_error' : ''}`}
              placeholder={`${getText('schoolName')} *`}
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
              placeholder={`${getText('schoolEmail')} *`}
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
              placeholder={`${getText('password')} *`}
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
              placeholder={`${getText('confirmPassword')} *`}
              required
            />
          </div>
          {errors.confirmPassword && (
            <div className="scrf_error_message">{errors.confirmPassword}</div>
          )}
        </div>
      </div>
    );
  };

  const renderAddressStep = () => {
    return (
      <div className="scrf_section">
        <h2 className="scrf_section_title">{getText('schoolAddress')}</h2>
        <p className="scrf_section_subtitle">{getText('addressSubtitle')}</p>

        <div className="scrf_form_group">
          <div className="scrf_input_with_icon">
            <FaMapMarkerAlt className="scrf_icon" />
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              className={`scrf_input scrf_input_with_icon_field ${errors.streetAddress ? 'scrf_input_error' : ''}`}
              placeholder={`${getText('streetAddress')} *`}
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
                placeholder={`${getText('city')} *`}
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
              <option value="">{getText('district')} *</option>
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
              placeholder={`${getText('province')} *`}
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
              placeholder={`${getText('postalCode')} *`}
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
            placeholder={getText('additionalRemarks')}
          />
        </div>
      </div>
    );
  };

  const renderLocationStep = () => {
    return (
      <div className="scrf_section">
        <h2 className="scrf_section_title">{getText('location')}</h2>
        <p className="scrf_section_subtitle">
          {getText('locationSubtitle')}
        </p>
  
        <div className="scrf_location_section">
          <div className="scrf_location_info">
            <div className="scrf_location_icon_container">
              <FaMapMarkedAlt className="scrf_location_icon" />
            </div>
            <div className="scrf_location_text">
              <h3>{getText('getCoordinates')}</h3>
              <p>{getText('coordinatesInfo')}</p>
              {locationError && <div className="scrf_error_message">{locationError}</div>}
            </div>
          </div>
          
          <button 
            type="button" 
            className="scrf_location_button"
            onClick={handleGetLocation}
            disabled={isLocating}
          >
            <MdMyLocation className="scrf_location_button_icon" />
            {isLocating ? getText('gettingLocation') : getText('getLocation')}
          </button>
  
          {(formData.latitude && formData.longitude) && (
            <div className="scrf_coordinates">
              <div className="scrf_coordinate_item">
                <span className="scrf_coordinate_label">{getText('latitude')}:</span>
                <span className="scrf_coordinate_value">{formData.latitude}</span>
              </div>
              <div className="scrf_coordinate_item">
                <span className="scrf_coordinate_label">{getText('longitude')}:</span>
                <span className="scrf_coordinate_value">{formData.longitude}</span>
              </div>
            </div>
          )}
          
          <div className="scrf_location_note">
            <p>{getText('locationNote')}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPrincipalStep = () => {
    return (
      <div className="scrf_section">
        <h2 className="scrf_section_title">{getText('principalInfo')}</h2>

        <div className="scrf_form_group">
          <div className="scrf_input_with_icon">
            <FaUserTie className="scrf_icon" />
            <input
              type="text"
              name="principalName"
              value={formData.principalName}
              onChange={handleChange}
              className={`scrf_input scrf_input_with_icon_field ${errors.principalName ? 'scrf_input_error' : ''}`}
              placeholder={`${getText('name')} *`}
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
              placeholder={`${getText('email')} *`}
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
              placeholder={`${getText('phoneNumber')} *`}
              required
            />
          </div>
          {errors.phoneNumber && <div className="scrf_error_message">{errors.phoneNumber}</div>}
        </div>
      </div>
    );
  };

  const renderVerificationStep = () => {
    return (
      <div className="scrf_section">
        <h2 className="scrf_section_title">{getText('documentVerification')}</h2>

        <div
          className={`scrf_upload_area ${errors.documents ? 'scrf_upload_error' : ''}`}
          onClick={handleFileUploadClick}
          onDragOver={handleFileDragOver}
          onDragLeave={handleFileDragLeave}
          onDrop={handleFileDrop}
        >
          <FaCloudUploadAlt className="scrf_upload_icon" />
          <p className="scrf_upload_text">{getText('dropFiles')} *</p>
          <p className="scrf_upload_formats">{getText('allowedFormats')}</p>
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
              {getText('termsAgreement')} *
            </span>
          </label>
        </div>

        <p className="scrf_verification_note">
          {getText('verificationNote')}
        </p>
      </div>
    );
  };

  // Render navigation buttons based on current step
  const renderNavButtons = () => {
    return (
      <div className="scrf_nav_buttons">
        {currentStep > 1 && (
          <button 
            type="button" 
            className="scrf_prev_button"
            onClick={handlePrevStep}
          >
            <MdArrowBack className="scrf_button_icon" />
            Previous
          </button>
        )}
        
        {currentStep < 5 && (
          <button 
            type="button" 
            className="scrf_next_button" 
            onClick={handleNextStep}
          >
            Next
            <MdNavigateNext className="scrf_button_icon" />
          </button>
        )}
        
        {currentStep === 5 && (
          <button 
            type="submit" 
            className="scrf_submit_button"
            disabled={isSubmitDisabled}
          >
            {getText('registerButton')}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="scrf_container">
        {/* Language Selector */}
        <div className="scrf_language_selector">
          <div className="scrf_language_selector_wrapper">
            <FaLanguage className="scrf_language_icon" />
            <select
              className="scrf_language_select"
              value={language}
              onChange={handleLanguageChange}
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="si">සිංහල (Sinhala)</option>
            </select>
          </div>
        </div>

        <h1 className="scrf_title">{getText('title')}</h1>
        <p className="scrf_subtitle">{getText('subtitle')}</p>

        {/* Multi-step progress bar */}
        {renderProgressBar()}

        <form className="scrf_form" onSubmit={handleSubmit}>
          {/* Render current step content */}
          {renderFormStep()}
          
          {/* Navigation buttons */}
          {renderNavButtons()}
        </form>
      </div>

      {/* Success Popup Component */}
      <RegistrationSuccessPopup isVisible={showSuccessPopup} />
    </>
  );
};

export default SchoolRegistration;