// frontend/src/components/Donor/ForgotPasswordPage/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import api from '../../../api';
import './ForgotPasswordPage.css'; // Create this CSS file

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        // Basic email format validation
         if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
             setError("Please enter a valid email address.");
             setIsLoading(false);
             return;
         }

        try {
            // Note: Backend is designed *not* to throw an error if email not found,
            // to prevent revealing user existence. It will always return 200 with a message.
            const response = await api.post('/api/donors/forgot-password', { email });
            setMessage(response.data.message);
            setEmail(''); // Clear email field on success
        } catch (err) {
            console.error('Forgot password error:', err.response?.data || err.message);
            // Display specific error message from backend if available
            setError(err.response?.data?.message || 'Failed to request password reset. Please try again.');
        } finally {
            setIsLoading(false);
             // Clear messages after a delay
             setTimeout(() => { setMessage(''); setError(''); }, 10000); // Clear after 10s
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-box">
                 <h2>Forgot Password</h2>
                 <p>Enter your email address and we'll send you a link to reset your password.</p>

                 {message && <div className="success-message">{message}</div>} {/* Add success styling */}
                 {error && <div className="error-message">{error}</div>} {/* Add error styling */}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="email" // Suggest email address
                        />
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                 <div className="back-to-login">
                     <p><Link to="/donor-login">Back to Login</Link></p> {/* Use React Router Link */}
                 </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;