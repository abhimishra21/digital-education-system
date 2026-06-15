import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import LoginSuccessAnimation from './LoginSuccessAnimation';

const LoginPanel: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(loginData.email, loginData.password);
    if (!success) {
      setError('Invalid email or password');
      setIsLoading(false);
    } else {
      // Get user name for animation
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === loginData.email);
      setLoggedInUser(user?.name || 'User');
      
      // Show success animation
      setShowSuccessAnimation(true);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const success = await register(registerData);
    if (!success) {
      setError('Email already exists or registration failed');
    } else {
      // Switch to login after successful registration
      setIsLogin(true);
      setLoginData({ email: registerData.email, password: '' });
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, isLoginForm: boolean) => {
    const { name, value } = e.target;
    if (isLoginForm) {
      setLoginData(prev => ({ ...prev, [name]: value }));
    } else {
      setRegisterData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    setIsLoading(false);
  };

  return (
    <>
      {/* Login Success Animation */}
      <LoginSuccessAnimation
        isVisible={showSuccessAnimation}
        onComplete={handleAnimationComplete}
        userName={loggedInUser}
      />

      <div className="login-container">
        <div className="login-background">
          <div className="login-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="login-particle" />
            ))}
          </div>
        </div>

        <motion.div 
          className="login-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="login-header">
            <motion.div 
              className="login-logo"
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Lock size={48} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {isLogin 
                ? 'Sign in to access the University Admission Portal' 
                : 'Register to get started with the portal'
              }
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                onSubmit={handleLogin}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5 }}
                className="login-form"
              >
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={(e) => handleInputChange(e, true)}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={16} />
                    Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={(e) => handleInputChange(e, true)}
                      className="form-input"
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  className="btn login-btn"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <LoadingSpinner size={16} text="Signing in..." />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>

                <div className="login-footer">
                  <p>Don't have an account?</p>
                  <motion.button
                    type="button"
                    className="link-btn"
                    onClick={() => setIsLogin(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Account
                  </motion.button>
                </div>

                <div className="demo-credentials">
                  <h4>Demo Credentials:</h4>
                  <p><strong>Admin:</strong> admin@university.edu / admin123</p>
                  <p><strong>User:</strong> Any registered email / user123</p>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                onSubmit={handleRegister}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="login-form"
              >
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={(e) => handleInputChange(e, false)}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={(e) => handleInputChange(e, false)}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={16} />
                    Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={registerData.password}
                      onChange={(e) => handleInputChange(e, false)}
                      className="form-input"
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={16} />
                    Confirm Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={(e) => handleInputChange(e, false)}
                      className="form-input"
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  className="btn login-btn"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <LoadingSpinner size={16} text="Creating account..." />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>

                <div className="login-footer">
                  <p>Already have an account?</p>
                  <motion.button
                    type="button"
                    className="link-btn"
                    onClick={() => setIsLogin(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign In
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPanel; 