import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'customer', // customer or provider
        phone: '',
        agreeToTerms: false
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const data = await apiCall('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        password: formData.password,
                        phone: formData.phone,
                        userType: formData.userType
                    }),
                });

                // Use auth context to login
                login(data.user, data.token);

                alert(`Registration successful! Welcome ${data.user.firstName}!`);

                // Redirect to dashboard
                navigate('/dashboard');
            } catch (error) {
                console.error('Registration error:', error);
                setErrors({ submit: error.message || 'Network error. Please try again.' });
            }
        }
    };

    const handleGoogleSignup = () => {
        alert('Google signup clicked');
    };

    const handleMicrosoftSignup = () => {
        alert('Microsoft signup clicked');
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-dominant px-4 py-8">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-secondary mb-2">Join LocalNest</h2>
                    <p className="text-secondary/70">Create your account to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Type Selection */}
                    <div>
                        <label className="block text-secondary font-semibold mb-2">I want to:</label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="userType"
                                    value="customer"
                                    checked={formData.userType === 'customer'}
                                    onChange={handleInputChange}
                                    className="mr-2 text-accent focus:ring-accent"
                                />
                                <span className="text-secondary">Find services</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="userType"
                                    value="provider"
                                    checked={formData.userType === 'provider'}
                                    onChange={handleInputChange}
                                    className="mr-2 text-accent focus:ring-accent"
                                />
                                <span className="text-secondary">Offer services</span>
                            </label>
                        </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-secondary font-semibold mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${errors.firstName ? 'border-red-500' : 'border-secondary'
                                    }`}
                                placeholder="Name"
                            />
                            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-secondary font-semibold mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${errors.lastName ? 'border-red-500' : 'border-secondary'
                                    }`}
                                placeholder="Surname"
                            />
                            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-secondary font-semibold mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${errors.email ? 'border-red-500' : 'border-secondary'
                                }`}
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* Phone (optional for customers, required for providers) */}
                    <div>
                        <label htmlFor="phone" className="block text-secondary font-semibold mb-1">
                            Phone Number {formData.userType === 'provider' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required={formData.userType === 'provider'}
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-secondary rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-secondary font-semibold mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${errors.password ? 'border-red-500' : 'border-secondary'
                                }`}
                            placeholder="At least 6 characters"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-secondary font-semibold mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${errors.confirmPassword ? 'border-red-500' : 'border-secondary'
                                }`}
                            placeholder="Repeat your password"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            id="agreeToTerms"
                            name="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={handleInputChange}
                            className="mt-1 mr-3 text-accent focus:ring-accent"
                        />
                        <label htmlFor="agreeToTerms" className="text-sm text-secondary">
                            I agree to the{' '}
                            <Link to="/terms" className="text-accent hover:underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-accent hover:underline">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>
                    {errors.agreeToTerms && <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>}

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                            {errors.submit}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-accent text-secondary font-semibold rounded-lg py-3 hover:bg-accent/90 transition mt-6"
                    >
                        Create Account
                    </button>
                </form>

                {/* Social signup buttons */}
                <div className="mt-6">
                    <p className="text-center text-secondary font-semibold mb-4">Or sign up with</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleGoogleSignup}
                            className="flex items-center justify-center gap-3 border border-secondary rounded-lg py-3 font-semibold text-secondary hover:bg-accent/10 transition"
                        >
                            <img
                                src="https://www.google.com/images/branding/googleg/2x/googleg_standard_color_92dp.png"
                                alt="Google logo"
                                className="w-5 h-5"
                            />
                            Continue with Google
                        </button>

                        <button
                            onClick={handleMicrosoftSignup}
                            className="flex items-center justify-center gap-3 border border-secondary rounded-lg py-3 font-semibold text-secondary hover:bg-accent/10 transition"
                        >
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                                alt="Microsoft logo"
                                className="w-5 h-5"
                            />
                            Continue with Microsoft
                        </button>
                    </div>
                </div>

                {/* Sign in link */}
                <div className="mt-6 text-center">
                    <p className="text-secondary">
                        Already have an account?{' '}
                        <Link to="/signin" className="text-accent hover:underline font-semibold">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}