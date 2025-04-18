import React, { useState, useEffect } from 'react'; // Added useEffect potentially for checking existing login
import { MdEmail, MdLock, MdLanguage } from 'react-icons/md';
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import api from '../../../api'; // <-- Import your api instance (adjust path if needed)
import './SchoolLogin.css';

const SchoolLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const [errors, setErrors] = useState({
        email: '',
        password: '',
        submit: '', // <-- Add state for submission errors
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [language, setLanguage] = useState('english'); // 'english' or 'sinhala'

    const navigate = useNavigate(); // <-- Initialize navigate


    useEffect(() => {
       const schoolInfo = localStorage.getItem('schoolInfo'); // Assuming you store login info here
       if (schoolInfo) {
         navigate('/Dashboard'); // Redirect to dashboard if already logged in
       }
     }, [navigate]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });

        // Clear field-specific error when typing
        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: '',
            }));
        }
        // Clear general submission error on any change
        if (errors.submit) {
             setErrors((prevErrors) => ({
                ...prevErrors,
                submit: '',
            }));
        }
    };

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
         // Clear errors on language change as messages change
        setErrors({ email: '', password: '', submit: '' });
    };

    const handleSubmit = async (e) => { // <-- Make async
        e.preventDefault();
        setErrors((prevErrors) => ({ ...prevErrors, submit: '' })); // Clear previous submit error

        // Frontend Validation
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = language === 'english' ? 'Email address is required' : 'විද්‍යුත් තැපෑල ලිපිනය අවශ්‍යයි';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = language === 'english' ? 'Please enter a valid email address' : 'වලංගු විද්‍යුත් තැපෑල ලිපිනයක් ඇතුළත් කරන්න';
        }

        if (!formData.password) {
            newErrors.password = language === 'english' ? 'Password is required' : 'මුරපදය අවශ්‍යයි';
        }
        // Note: Backend enforces stricter password rules (length 8, complexity)
        // You could add stricter frontend validation later if desired.

        if (Object.keys(newErrors).length > 0) {
            setErrors((prevErrors) => ({ ...prevErrors, ...newErrors }));
            return;
        }

        // --- API Call ---
        setIsSubmitting(true);
        try {
            const payload = {
                schoolEmail: formData.email, // <-- Map frontend 'email' to backend 'schoolEmail'
                password: formData.password,
            };
            console.log('Sending login payload:', payload); // Debug log

            const response = await api.post('/api/schools/login', payload);

            console.log('Login response:', response); // Debug log

            if (response.data && response.data.token) {
                // Login Success
                console.log('Login Successful:', response.data);

                // Store user info and token (e.g., in localStorage)
                // Storing the whole object might be useful, includes name, email, token etc.
                localStorage.setItem('schoolInfo', JSON.stringify(response.data));

                // Navigate to the school dashboard
                navigate('/Dashboard'); // <-- Redirect on success
            } else {
                 // Should not happen if backend is correct, but handle defensively
                 console.error('Login response missing token:', response.data);
                 setErrors((prevErrors) => ({
                    ...prevErrors,
                    submit: language === 'english' ? 'Login failed: Invalid server response.' : 'පිවිසීම අසාර්ථකයි: සේවාදායක දෝෂයක්.'
                 }));
            }

        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = language === 'english' ? 'An unexpected error occurred. Please try again.' : 'අනපේක්ෂිත දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.';

            if (error.response) {
                // Error from backend (e.g., 400, 401, 403, 404)
                console.error('Backend error data:', error.response.data);
                // Use the specific message from the backend
                errorMessage = error.response.data?.message || `Login failed (Status: ${error.response.status})`;

                // Translate common backend errors if needed (optional)
                // Example: Check for specific messages if the backend isn't multi-lingual
                if (error.response.data?.message === 'Invalid credentials') {
                    errorMessage = language === 'english' ? 'Invalid email or password.' : 'වැරදි විද්‍යුත් තැපෑල හෝ මුරපදය.';
                } else if (error.response.data?.message === 'Your school registration is pending approval or has been rejected.') {
                    errorMessage = language === 'english' ? 'Account not approved or rejected. Please wait for verification or contact support.' : 'ගිණුම අනුමත කර නොමැත හෝ ප්‍රතික්ෂේප කර ඇත. කරුණාකර සත්‍යාපනය සඳහා රැඳී සිටින්න.';
                }
                // Add more specific error message translations as needed
            } else if (error.request) {
                // Network error (no response received)
                errorMessage = language === 'english' ? 'Network error. Unable to connect to server.' : 'ජාල දෝෂයකි. සේවාදායකයට සම්බන්ධ විය නොහැක.';
            }

            setErrors((prevErrors) => ({
                ...prevErrors,
                submit: errorMessage, // <-- Set the submission error message
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const translations = {
        title: language === 'english' ? 'School Portal Login' : 'පාසල් ද්වාරයට පිවිසීම', // Updated Title
        subtitle: language === 'english'
            ? 'Login only available for approved school accounts.' // Simplified subtitle
            : 'පිවිසිය හැක්කේ අනුමත පාසල් ගිණුම් සඳහා පමණි.',
        emailLabel: language === 'english' ? 'School Email Address' : 'පාසල් විද්‍යුත් තැපෑල ලිපිනය', // Clarified label
        passwordLabel: language === 'english' ? 'Password' : 'මුරපදය',
        rememberMe: language === 'english' ? 'Remember Me' : 'මතක තබා ගන්න',
        forgotPassword: language === 'english' ? 'Forgot Password?' : 'මුරපදය අමතක වුණාද?',
        signIn: language === 'english' ? 'Sign in' : 'පිවිසෙන්න',
        noAccount: language === 'english' ? 'Don\'t have an Account?' : 'ගිණුමක් නොමැතිද?',
        signUp: language === 'english' ? 'Register Here' : 'මෙහි ලියාපදිංචි වන්න', // Changed Link Text
        emailPlaceholder: language === 'english' ? 'Enter your school email' : 'ඔබගේ පාසල් විද්‍යුත් තැපෑල ඇතුළත් කරන්න', // Clarified placeholder
        passwordPlaceholder: language === 'english' ? 'Enter your password' : 'ඔබගේ මුරපදය ඇතුළත් කරන්න',
        selectLanguage: language === 'english' ? 'Select Language' : 'භාෂාව තෝරන්න',
        signingIn: language === 'english' ? 'Signing in...' : 'පිවිසෙමින්...' // Added signing in text
    };

    return (
        <div className="login-container">
            <div className="login-form-wrapper">
                <div className="language-selector-container">
                    <div className="language-selector">
                        <MdLanguage className="language-icon" />
                        <select value={language} onChange={handleLanguageChange} className="language-select">
                            <option value="english">English</option>
                            <option value="sinhala">සිංහල</option>
                        </select>
                    </div>
                </div>

                <h1 className="login-title">{translations.title}</h1>
                <p className="login-subtitle">{translations.subtitle}</p>

                <form className="login-form" onSubmit={handleSubmit} noValidate> {/* Added noValidate */}

                     {/* Display Submission Error */}
                    {errors.submit && (
                        <p className="error-message submit-error-message">{errors.submit}</p>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email"> {/* Added htmlFor */}
                            <MdEmail className="form-icon" />
                            {translations.emailLabel}
                            <span className="required-mark">*</span>
                        </label>
                        <input
                            type="text" // Changed to text from email to allow flexibility, validation handles format
                            id="email" // Added id
                            name="email"
                            className={`form-input ${errors.email ? 'input-error' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={translations.emailPlaceholder}
                            aria-required="true" // Accessibility
                            aria-invalid={!!errors.email} // Accessibility
                        />
                        {errors.email && <p className="error-message">{errors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password"> {/* Added htmlFor */}
                            <MdLock className="form-icon" />
                            {translations.passwordLabel}
                            <span className="required-mark">*</span>
                        </label>
                        <input
                            type="password"
                            id="password" // Added id
                            name="password"
                            className={`form-input ${errors.password ? 'input-error' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={translations.passwordPlaceholder}
                            aria-required="true" // Accessibility
                            aria-invalid={!!errors.password} // Accessibility
                        />
                        {errors.password && <p className="error-message">{errors.password}</p>}
                    </div>

                    <div className="form-options">
                        <div className="School-login-remember-me">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                name="rememberMe"
                                className="remember-checkbox"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                            />
                            <label htmlFor="rememberMe" className="remember-label">{translations.rememberMe}</label>
                        </div>
                        {/* TODO: Implement Forgot Password functionality */}
                        <a href="#forgot" className="forgot-link">{translations.forgotPassword}</a>
                    </div>

                    <button
                        type="submit"
                        className="signin-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? translations.signingIn : translations.signIn}
                    </button>
                </form>

                <div className="signup-link-container">
                    <p className="signup-text">
                        {translations.noAccount} <a href="/school-register" className="signup-link">{translations.signUp}</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SchoolLogin;