import React, { useState, useRef, useEffect } from 'react';
import { FaCloudUploadAlt, FaSchool, FaMapMarkerAlt, FaUserTie, FaPhone, FaLock, FaTimes, FaLanguage, FaMapMarkedAlt } from 'react-icons/fa';
import { MdEmail, MdNavigateNext, MdArrowBack, MdMyLocation } from 'react-icons/md';
import { BsShieldLock } from 'react-icons/bs';
import './SchoolRegistration.css';
import RegistrationSuccessPopup from './RegistrationSuccessPopup.jsx';
import translations from './translation.jsx';
import api from '../../../api.js';

const SchoolRegistration = () => {
  const [language, setLanguage] = useState('en');
  const [currentStep, setCurrentStep] = useState(1);
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
    latitude: '',
    longitude: '',
    principalName: '',
    principalEmail: '',
    phoneNumber: '',
    agreeToTerms: false
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
    documents: '',
    agreeToTerms: ''
  });

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


  const getText = (key) => {
    return translations[language][key] || key; 
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const validatePassword = (password) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(Boolean);
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(?:\+94|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
    }));

    let specificError = ''; 

    if (name === 'password') {
      const isValid = validatePassword(newValue); 
      if (!isValid && newValue) { 
         specificError = 'Password does not meet all requirements';
      }
      if (formData.confirmPassword && newValue === formData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: '' }));
      } else if (formData.confirmPassword && newValue !== formData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      }
    }
    else if (name === 'confirmPassword') {
      if (newValue !== formData.password) {
        specificError = 'Passwords do not match';
      } else {
          specificError = '';
      }
    }
    else if (name === 'schoolEmail' || name === 'principalEmail') {
      if (newValue && !validateEmail(newValue)) {
        specificError = 'Please enter a valid email address';
      }
    }
    else if (name === 'phoneNumber') {
      if (newValue && !validatePhoneNumber(newValue)) {
        specificError = 'Please enter a valid phone number (e.g., +94XXXXXXXXX or 0XXXXXXXXX)';
      }
    }
    else if (name === 'agreeToTerms') {
      if (!newValue) { 
        specificError = 'You must agree to the terms';
      }
    }
    else {
      if (newValue.trim()) {
          specificError = '';
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: specificError
    }));

    setSubmitError('');
  };

  const validateStep = (step, updateErrorsState = true) => {
    let stepIsValid = true;
    const newErrors = { ...errors }; 

    const requiredFieldsByStep = {
      1: ['schoolName', 'schoolEmail', 'password', 'confirmPassword'],
      2: ['streetAddress', 'city', 'district', 'province', 'postalCode'],
      3: [],
      4: ['principalName', 'principalEmail', 'phoneNumber'],
      5: ['agreeToTerms']
    };

    if (requiredFieldsByStep[step]) {
      requiredFieldsByStep[step].forEach(field => {
        const value = formData[field];
        if ((typeof value === 'string' && !value.trim()) || (field === 'agreeToTerms' && !value)) {
            if (!newErrors[field]) { 
                newErrors[field] = field === 'agreeToTerms' ? 'You must agree to the terms' : 'This field is required';
            }
            stepIsValid = false;
        }
      });
    }

     if (step === 1) {
       if (formData.schoolEmail && !validateEmail(formData.schoolEmail)) {
         newErrors.schoolEmail = 'Please enter a valid email address';
         stepIsValid = false;
       } else if (!formData.schoolEmail){ 
           newErrors.schoolEmail = 'This field is required';
           stepIsValid = false;
       }

       if (formData.password && !isPasswordValid()) {
         newErrors.password = 'Password does not meet all requirements';
         stepIsValid = false;
       } else if (!formData.password) {
           newErrors.password = 'This field is required';
           stepIsValid = false;
       }

       if (formData.password !== formData.confirmPassword) {
         newErrors.confirmPassword = 'Passwords do not match';
         stepIsValid = false;
       } else if (!formData.confirmPassword) {
           newErrors.confirmPassword = 'This field is required';
           stepIsValid = false;
       }
     }
     else if (step === 4) {
       if (formData.principalEmail && !validateEmail(formData.principalEmail)) {
         newErrors.principalEmail = 'Please enter a valid email address';
         stepIsValid = false;
       } else if (!formData.principalEmail) {
            newErrors.principalEmail = 'This field is required';
            stepIsValid = false;
       }

       if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
         newErrors.phoneNumber = 'Please enter a valid phone number (e.g., +94XXXXXXXXX or 0XXXXXXXXX)';
         stepIsValid = false;
       } else if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'This field is required';
            stepIsValid = false;
       }
     }
     else if (step === 5) {
       if (uploadedFiles.length === 0) {
         if (!newErrors.documents) { 
             newErrors.documents = 'Please upload at least one verification document';
         }
         stepIsValid = false;
       }
       if (!formData.agreeToTerms) {
          if (!newErrors.agreeToTerms) { 
             newErrors.agreeToTerms = 'You must agree to the terms';
          }
         stepIsValid = false;
       }
     }

    if (updateErrorsState) {
        setErrors(newErrors);
    }
    return stepIsValid;
  };

  const validateForm = () => {
    let formIsValid = true;
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step, true)) { 
        formIsValid = false;
      }
    }
    return formIsValid;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep, true)) {
      setCurrentStep(currentStep + 1);
      setSubmitError('');
      window.scrollTo(0, 0);
    } else {
      const currentStepSection = document.querySelector(`.scrf_form > .scrf_section:nth-of-type(${currentStep})`);
      if (currentStepSection) {
        const firstError = currentStepSection.querySelector('.scrf_error_message');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else { 
         const firstGenError = document.querySelector('.scrf_error_message');
         if (firstGenError) {
           firstGenError.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
      }
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    setSubmitError('');
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
       const firstError = document.querySelector('.scrf_error_message');
       if (firstError) {
           firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
       return;
    }

    setIsSubmitting(true);
    const formDataToSubmit = new FormData();

    Object.keys(formData).forEach(key => {
      if (key !== 'agreeToTerms') { 
        formDataToSubmit.append(key, formData[key]);
      }
    });

    uploadedFiles.forEach(fileInfo => {
      formDataToSubmit.append('documents', fileInfo.file, fileInfo.name);
    });

    try {
      const response = await api.post('/api/schools/register', formDataToSubmit);

      if (response.status === 201) {
        console.log('Registration successful:', response.data);
        setShowSuccessPopup(true);
      } else {
        setSubmitError(`Unexpected success status: ${response.status}. Please contact support.`);
      }

    } catch (error) {
      console.error('Registration failed:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.'; 
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error (${error.response.status}). Please try again.`;
      } else if (error.request) {
        errorMessage = 'Network error. Could not reach the server. Please check your connection.';
      }
      setSubmitError(errorMessage);
      const errorDisplay = document.getElementById('submit-error-display');
      if (errorDisplay) {
          errorDisplay.scrollIntoView({ behavior: 'smooth', block: 'center'});
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleFileUploadClick = () => {
    if (isSubmitting) return;
    fileInputRef.current.click();
  };

  const processFiles = (files) => {
    if (!files || files.length === 0) return;

    let fileError = '';
    const maxFileSize = 5 * 1024 * 1024; 
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    let newFiles = [];

    for (const file of Array.from(files)) {
        if (!allowedTypes.includes(file.type)) {
            fileError = `Invalid file type: ${file.name}. Only PDF, JPG, JPEG, PNG allowed.`;
            break; 
        }
        if (file.size > maxFileSize) {
            fileError = `File too large: ${file.name}. Maximum size is 5MB.`;
            break; 
        }
        newFiles.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            size: formatFileSize(file.size),
            file: file
        });
    }

    if (fileError) {
        setErrors(prev => ({ ...prev, documents: fileError }));
    } else {
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setErrors(prev => ({ ...prev, documents: '' }));
        setSubmitError(''); 
    }
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    e.target.value = null; 
  };

  const handleFileDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isSubmitting) e.currentTarget.classList.add('scrf_drag_over');
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.classList.remove('scrf_drag_over');
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.classList.remove('scrf_drag_over');
    if (!isSubmitting) processFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId) => {
     if (isSubmitting) return;
    setUploadedFiles(prev => {
      const updatedFiles = prev.filter(file => file.id !== fileId);
      if (currentStep === 5 && updatedFiles.length === 0) {
        setErrors(prev => ({ ...prev, documents: 'Please upload at least one verification document' }));
      } else {
         setErrors(prev => ({...prev, documents: ''}));
      }
      setSubmitError(''); 
      return updatedFiles;
    });
  };


  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError('');
    setSubmitError('');

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
          let message = 'Failed to get location. ';
          switch(error.code) {
              case error.PERMISSION_DENIED: message += "Permission denied."; break;
              case error.POSITION_UNAVAILABLE: message += "Location unavailable."; break;
              case error.TIMEOUT: message += "Request timed out."; break;
              default: message += "Unknown error."; break;
          }
          setLocationError(message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };


  const renderProgressBar = () => {
    const stepLabels = {
        1: getText('step1Label'), 2: getText('step2Label'), 3: getText('step3Label'),
        4: getText('step4Label'), 5: getText('step5Label')
    };
    return (
      <div className="scrf_progress_bar">
        {[1, 2, 3, 4, 5].map(step => (
          <div key={step} className={`scrf_progress_step ${currentStep >= step ? 'scrf_progress_active' : ''}`}>
            <div className="scrf_step_number">{step}</div>
            <div className="scrf_step_label">{stepLabels[step]}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1: return renderSchoolInfoStep();
      case 2: return renderAddressStep();
      case 3: return renderLocationStep();
      case 4: return renderPrincipalStep();
      case 5: return renderVerificationStep();
      default: return null;
    }
  };


  const renderSchoolInfoStep = () => (
    <div className="scrf_section">
      <h2 className="scrf_section_title">{getText('schoolInfo')}</h2>
      <div className="scrf_form_group">
        <div className="scrf_input_with_icon">
          <FaSchool className="scrf_icon" />
          <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange}
                 className={`scrf_input scrf_input_with_icon_field ${errors.schoolName ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('schoolName')} *`} />
        </div>
        {errors.schoolName && <div className="scrf_error_message">{errors.schoolName}</div>}
      </div>
      <div className="scrf_form_group">
        <div className="scrf_input_with_icon">
          <MdEmail className="scrf_icon" />
          <input type="email" name="schoolEmail" value={formData.schoolEmail} onChange={handleChange}
                 className={`scrf_input scrf_input_with_icon_field ${errors.schoolEmail ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('schoolEmail')} *`} />
        </div>
        {errors.schoolEmail && <div className="scrf_error_message">{errors.schoolEmail}</div>}
      </div>
      <div className="scrf_form_group" ref={passwordRef}>
        <div className="scrf_input_with_icon">
          <BsShieldLock className="scrf_icon" />
          <input type="password" name="password" value={formData.password} onChange={handleChange} onFocus={() => setIsPasswordFocused(true)}
                 className={`scrf_input scrf_input_with_icon_field ${errors.password ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('password')} *`} />
        </div>
        {errors.password ? (
             <div className="scrf_error_message">{errors.password}</div>
        ) : (isPasswordFocused && formData.password) ? (
          <div className="scrf_password_requirements">
            <p>{getText('passwordRequirements')}:</p>
            <ul>
              <li className={passwordStrength.hasMinLength ? 'scrf_valid' : ''}><span className="scrf_check_icon">{passwordStrength.hasMinLength ? '✓' : '•'}</span> {getText('min8Chars')}</li>
              <li className={passwordStrength.hasUpperCase ? 'scrf_valid' : ''}><span className="scrf_check_icon">{passwordStrength.hasUpperCase ? '✓' : '•'}</span> {getText('oneUppercase')}</li>
              <li className={passwordStrength.hasLowerCase ? 'scrf_valid' : ''}><span className="scrf_check_icon">{passwordStrength.hasLowerCase ? '✓' : '•'}</span> {getText('oneLowercase')}</li>
              <li className={passwordStrength.hasNumber ? 'scrf_valid' : ''}><span className="scrf_check_icon">{passwordStrength.hasNumber ? '✓' : '•'}</span> {getText('oneNumber')}</li>
              <li className={passwordStrength.hasSpecialChar ? 'scrf_valid' : ''}><span className="scrf_check_icon">{passwordStrength.hasSpecialChar ? '✓' : '•'}</span> {getText('oneSpecialChar')}</li>
            </ul>
          </div>
        ) : null}
      </div>
      <div className="scrf_form_group">
        <div className="scrf_input_with_icon">
          <BsShieldLock className="scrf_icon" />
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                 className={`scrf_input scrf_input_with_icon_field ${errors.confirmPassword ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('confirmPassword')} *`} />
        </div>
        {errors.confirmPassword && <div className="scrf_error_message">{errors.confirmPassword}</div>}
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="scrf_section">
      <h2 className="scrf_section_title">{getText('schoolAddress')}</h2>
      <p className="scrf_section_subtitle">{getText('addressSubtitle')}</p>
      <div className="scrf_form_group">
        <div className="scrf_input_with_icon">
          <FaMapMarkerAlt className="scrf_icon" />
          <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange}
                 className={`scrf_input scrf_input_with_icon_field ${errors.streetAddress ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('streetAddress')} *`} />
        </div>
        {errors.streetAddress && <div className="scrf_error_message">{errors.streetAddress}</div>}
      </div>
      <div className="scrf_form_row">
        <div className="scrf_form_group scrf_half_width">
          <div className="scrf_input_with_icon">
            <FaMapMarkerAlt className="scrf_icon" />
            <input type="text" name="city" value={formData.city} onChange={handleChange}
                   className={`scrf_input scrf_input_with_icon_field ${errors.city ? 'scrf_input_error' : ''}`}
                   placeholder={`${getText('city')} *`} />
          </div>
          {errors.city && <div className="scrf_error_message">{errors.city}</div>}
        </div>
        <div className="scrf_form_group scrf_half_width">
           <div className="scrf_select_wrapper">
              <select name="district" value={formData.district} onChange={handleChange}
                      className={`scrf_select ${errors.district ? 'scrf_input_error' : ''}`}>
                <option value="">{getText('selectDistrict')} *</option>
                {sriLankanDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
           </div>
          {errors.district && <div className="scrf_error_message">{errors.district}</div>}
        </div>
      </div>
      <div className="scrf_form_row">
        <div className="scrf_form_group scrf_half_width">
           <div className="scrf_input_with_icon">
              <FaMapMarkerAlt className="scrf_icon" />
              <input type="text" name="province" value={formData.province} onChange={handleChange}
                     className={`scrf_input scrf_input_with_icon_field ${errors.province ? 'scrf_input_error' : ''}`}
                     placeholder={`${getText('province')} *`} />
           </div>
          {errors.province && <div className="scrf_error_message">{errors.province}</div>}
        </div>
        <div className="scrf_form_group scrf_half_width">
           <div className="scrf_input_with_icon">
              <FaMapMarkerAlt className="scrf_icon" />
              <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange}
                     className={`scrf_input scrf_input_with_icon_field ${errors.postalCode ? 'scrf_input_error' : ''}`}
                     placeholder={`${getText('postalCode')} *`} />
           </div>
          {errors.postalCode && <div className="scrf_error_message">{errors.postalCode}</div>}
        </div>
      </div>
      <div className="scrf_form_group">
        <textarea name="additionalRemarks" value={formData.additionalRemarks} onChange={handleChange}
                  className="scrf_textarea" placeholder={getText('additionalRemarks')} rows="4" />
      </div>
    </div>
  );

 const renderLocationStep = () => (
    <div className="scrf_section">
      <h2 className="scrf_section_title">{getText('location')}</h2>
      <p className="scrf_section_subtitle">{getText('locationSubtitle')}</p>
      <div className="scrf_location_section">
        <div className="scrf_location_info">
          <div className="scrf_location_icon_container"><FaMapMarkedAlt className="scrf_location_icon" /></div>
          <div className="scrf_location_text">
            <h3>{getText('getCoordinates')}</h3>
            <p>{getText('coordinatesInfo')}</p>
            {locationError && <div className="scrf_error_message scrf_location_error">{locationError}</div>}
          </div>
        </div>
        <button type="button" className="scrf_location_button" onClick={handleGetLocation} disabled={isLocating}>
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
        <div className="scrf_location_note"><p>{getText('locationNote')}</p></div>
      </div>
    </div>
  );

  const renderPrincipalStep = () => (
    <div className="scrf_section">
      <h2 className="scrf_section_title">{getText('principalInfo')}</h2>
      <div className="scrf_form_group">
        <div className="scrf_input_with_icon">
          <FaUserTie className="scrf_icon" />
          <input type="text" name="principalName" value={formData.principalName} onChange={handleChange}
                 className={`scrf_input scrf_input_with_icon_field ${errors.principalName ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('name')} *`} />
        </div>
        {errors.principalName && <div className="scrf_error_message">{errors.principalName}</div>}
      </div>
      <div className="scrf_form_group">
        <div className="scrf_input_with_icon">
          <MdEmail className="scrf_icon" />
          <input type="email" name="principalEmail" value={formData.principalEmail} onChange={handleChange}
                 className={`scrf_input scrf_input_with_icon_field ${errors.principalEmail ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('email')} *`} />
        </div>
        {errors.principalEmail && <div className="scrf_error_message">{errors.principalEmail}</div>}
      </div>
      <div className="scrf_form_group">
        <div className="scrf_input_with_icon">
          <FaPhone className="scrf_icon" />
          <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                 className={`scrf_input scrf_input_with_icon_field ${errors.phoneNumber ? 'scrf_input_error' : ''}`}
                 placeholder={`${getText('phoneNumber')} *`} />
        </div>
        {errors.phoneNumber && <div className="scrf_error_message">{errors.phoneNumber}</div>}
      </div>
    </div>
  );

 const renderVerificationStep = () => (
    <div className="scrf_section">
      <h2 className="scrf_section_title">{getText('documentVerification')}</h2>
      <div className={`scrf_upload_area ${errors.documents ? 'scrf_upload_error' : ''} ${isSubmitting ? 'scrf_disabled' : ''}`}
           onClick={handleFileUploadClick} onDragOver={handleFileDragOver} onDragLeave={handleFileDragLeave} onDrop={handleFileDrop}
           aria-disabled={isSubmitting}>
        <input ref={fileInputRef} type="file" className="scrf_file_input" accept=".pdf,.jpg,.jpeg,.png"
               onChange={handleFileChange} multiple disabled={isSubmitting} />
        <FaCloudUploadAlt className="scrf_upload_icon" />
        <p className="scrf_upload_text">{getText('dropFiles')} *</p>
        <p className="scrf_upload_formats">{getText('allowedFormats')}</p>
      </div>
      {errors.documents && <div className="scrf_error_message">{errors.documents}</div>}

      {uploadedFiles.length > 0 && (
        <div className="scrf_uploaded_files">
           <h3 className="scrf_uploaded_files_title">{getText('uploadedFilesTitle')}</h3>
          {uploadedFiles.map(file => (
            <div key={file.id} className="scrf_file_item">
              <div className="scrf_file_info">
                <span className="scrf_file_name">{file.name}</span>
                <span className="scrf_file_size">({file.size})</span>
              </div>
              <button type="button" className="scrf_file_remove" onClick={() => handleRemoveFile(file.id)}
                      aria-label={`Remove file ${file.name}`} disabled={isSubmitting}>
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="scrf_agreement">
        <label className="scrf_checkbox_container">
          <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} disabled={isSubmitting}/>
          <span className="scrf_checkbox_text">{getText('termsAgreement')} *</span>
        </label>
         {errors.agreeToTerms && <div className="scrf_error_message scrf_terms_error">{errors.agreeToTerms}</div>}
      </div>
      <p className="scrf_verification_note">{getText('verificationNote')}</p>
    </div>
  );

  const renderNavButtons = () => {
    const checkStepValidityFromState = (step) => {
      let isValid = true;
      const requiredFieldsByStep = {
          1: ['schoolName', 'schoolEmail', 'password', 'confirmPassword'],
          2: ['streetAddress', 'city', 'district', 'province', 'postalCode'],
          3: [],
          4: ['principalName', 'principalEmail', 'phoneNumber'],
          5: ['agreeToTerms']
      };
      const fieldsToCheck = requiredFieldsByStep[step] || [];

      fieldsToCheck.forEach(field => {
          if (errors[field]) {
              isValid = false;
          }
          const value = formData[field];
          if (typeof value === 'string' && !value.trim()) {
              isValid = false;
          }
           if (field === 'agreeToTerms' && !value) {
              isValid = false;
           }
      });

      if (step === 1) {
           if (!formData.schoolName || !formData.schoolEmail || !formData.password || !formData.confirmPassword ||
               errors.schoolEmail || errors.password || errors.confirmPassword || !isPasswordValid() || formData.password !== formData.confirmPassword ) {
               isValid = false;
           }
      } else if (step === 4) {
           if (!formData.principalName || !formData.principalEmail || !formData.phoneNumber || errors.principalEmail || errors.phoneNumber) {
               isValid = false;
           }
      } else if (step === 5) {
            if (uploadedFiles.length === 0 || errors.documents || !formData.agreeToTerms || errors.agreeToTerms) {
                isValid = false;
            }
       }
      return isValid;
    }

    const isNextEnabled = currentStep < 5 && checkStepValidityFromState(currentStep) && !isSubmitting;
    const isFinalSubmitEnabled = currentStep === 5 && checkStepValidityFromState(5) && !isSubmitting;

    return (
      <div className="scrf_nav_buttons">
        {currentStep > 1 && (
          <button type="button" className="scrf_prev_button" onClick={handlePrevStep} disabled={isSubmitting}>
            <MdArrowBack className="scrf_button_icon" /> {getText('previousButton')}
          </button>
        )}
        {currentStep < 5 && (
          <button type="button" className="scrf_next_button" onClick={handleNextStep} disabled={!isNextEnabled}>
            {getText('nextButton')} <MdNavigateNext className="scrf_button_icon" />
          </button>
        )}
        {currentStep === 5 && (
          <button type="submit" className="scrf_submit_button" disabled={!isFinalSubmitEnabled}>
            {isSubmitting ? getText('submittingButton') : getText('registerButton')}
          </button>
        )}
      </div>
    );
  };


  return (
    <>
      <div className="scrf_container">
        <div className="scrf_language_selector">
          <div className="scrf_language_selector_wrapper">
            <FaLanguage className="scrf_language_icon" />
            <select className="scrf_language_select" value={language} onChange={handleLanguageChange} aria-label="Select language" disabled={isSubmitting}>
              <option value="en">English</option>
              <option value="si">සිංහල (Sinhala)</option>
            </select>
          </div>
        </div>

        <h1 className="scrf_title">{getText('title')}</h1>
        <p className="scrf_subtitle">{getText('subtitle')}</p>

        {renderProgressBar()}

        <form className="scrf_form" onSubmit={handleSubmit} noValidate>
           {submitError && (
             <div id="submit-error-display" className="scrf_error_message scrf_submit_error">
               {submitError}
             </div>
           )}

          {renderFormStep()}
          {renderNavButtons()}
        </form>
      </div>

      <RegistrationSuccessPopup isVisible={showSuccessPopup} />
    </>
  );
};

export default SchoolRegistration;