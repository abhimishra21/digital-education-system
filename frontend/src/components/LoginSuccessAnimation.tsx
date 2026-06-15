import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, GraduationCap, Shield, Zap, Sparkles } from 'lucide-react';

interface LoginSuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  userName: string;
}

const LoginSuccessAnimation: React.FC<LoginSuccessAnimationProps> = ({ 
  isVisible, 
  onComplete, 
  userName 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 500);

      const timer2 = setTimeout(() => {
        setCurrentStep(2);
      }, 1500);

      const timer3 = setTimeout(() => {
        setCurrentStep(3);
      }, 2500);

      const timer4 = setTimeout(() => {
        setCurrentStep(4);
      }, 3500);

      const timer5 = setTimeout(() => {
        onComplete();
      }, 4500);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="login-success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="success-animation-container">
            {/* Background particles */}
            <div className="success-particles">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="success-particle"
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              ))}
            </div>

            {/* Main success content */}
            <motion.div
              className="success-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Success icon */}
              <motion.div
                className="success-icon-container"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeOut",
                  delay: 0.2 
                }}
              >
                <CheckCircle size={80} className="success-icon" />
                <motion.div
                  className="success-ripple"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ 
                    duration: 1.5, 
                    ease: "easeOut",
                    delay: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              </motion.div>

              {/* Welcome message */}
              <motion.h1
                className="success-title"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Welcome Back!
              </motion.h1>

              <motion.p
                className="success-subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                {userName}
              </motion.p>

              {/* Loading steps */}
              <div className="loading-steps">
                <motion.div
                  className={`step ${currentStep >= 1 ? 'active' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: currentStep >= 1 ? 1 : 0.5, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Shield size={20} />
                  <span>Authenticating...</span>
                </motion.div>

                <motion.div
                  className={`step ${currentStep >= 2 ? 'active' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: currentStep >= 2 ? 1 : 0.5, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <GraduationCap size={20} />
                  <span>Loading Portal...</span>
                </motion.div>

                <motion.div
                  className={`step ${currentStep >= 3 ? 'active' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: currentStep >= 3 ? 1 : 0.5, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Zap size={20} />
                  <span>Initializing Data...</span>
                </motion.div>

                <motion.div
                  className={`step ${currentStep >= 4 ? 'active' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: currentStep >= 4 ? 1 : 0.5, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Sparkles size={20} />
                  <span>Ready!</span>
                </motion.div>
              </div>

              {/* Progress bar */}
              <motion.div
                className="progress-bar"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: currentStep / 4 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginSuccessAnimation; 