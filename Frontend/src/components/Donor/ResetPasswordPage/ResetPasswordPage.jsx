import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError("No password reset token provided in the URL.");
        }
         setIsInitialLoad(false);
    }, [location.search]);

    useEffect(() => {
        if (message || error) {
            const timer = setTimeout(() => {
                setMessage('');
                setError('');
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [message, error]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        if (!token) {
             setError("Password reset token is missing.");
             setIsLoading(false);
             return;
        }

         if (!newPassword || !confirmPassword) {
             setError("Please fill in both new password fields.");
             setIsLoading(false);
             return;
         }

         if (newPassword !== confirmPassword) {
             setError("New password and confirm password do not match.");
             setIsLoading(false);
             return;
         }

         const password = newPassword;
         if (password.length < 8) { setError('Password must be at least 8 characters long.'); setIsLoading(false); return; }
         if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); setIsLoading(false); return; }
         if (!/[0-9]/.test(password)) { setError('Password must contain at least one number.'); setIsLoading(false); return; }
         if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) { setError('Password must contain at least one special character.'); setIsLoading(false); return; }


        try {
            const response = await api.put(`/api/donors/reset-password/${token}`, {
                newPassword,
                confirmPassword,
            });
            setMessage(response.data.message);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                navigate('/donor-login');
            }, 3000);
        } catch (err) {
            console.error('Reset password error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to reset password. Token invalid or expired.');
        } finally {
            setIsLoading(false);
        }
    };

     if (isInitialLoad) {
         return <div className="reset-password-container"><p>Loading...</p></div>;
     }

     if (!token || error) {
          return (
               <div className="reset-password-container">
                   <div className="reset-password-box">
                       <h2>Password Reset</h2>
                       {error && <div className="error-message">{error}</div>}
                       {message && <div className="success-message">{message}</div>}
                       <div className="back-to-login" style={{ marginTop: '20px' }}>
                            <p><Link to="/donor-login">Back to Login</Link></p>
                       </div>
                   </div>
               </div>
          );
     }


    return (
        <div className="reset-password-container">
             <div className="reset-password-box">
                <h2>Reset Password</h2>
                 {message && <div className="success-message">{message}</div>}
                 {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={isLoading}
                             autoComplete="new-password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                             autoComplete="new-password"
                        />
                    </div>

                     <div className="password-requirements">
                        <h4>Password Requirements:</h4>
                        <ul>
                            <li>At least 8 characters long</li>
                            <li>Include at least one uppercase letter</li>
                            <li>Include at least one number</li>
                            <li>Include at least one special character</li>
                        </ul>
                    </div>


                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                 <div className="back-to-login" style={{ marginTop: '20px' }}>
                     <p><Link to="/donor-login">Back to Login</Link></p>
                 </div>
             </div>
        </div>
    );
};

export default ResetPasswordPage;