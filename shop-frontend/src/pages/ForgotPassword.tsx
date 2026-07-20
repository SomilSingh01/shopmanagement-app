import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // State
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSendOTP = async () => {
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setIsLoading(true)
      await apiClient.sendOTP(email, 'FORGOT_PASSWORD')
      toast.success('Verification code sent to your email!')
      setStep('otp')
    } catch (err: any) {
      console.error('Send OTP error:', err)
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setError('')
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    try {
      setIsLoading(true)
      const res = await apiClient.verifyOTP(email, otpCode, 'FORGOT_PASSWORD')
      if (res.resetToken) {
        setResetToken(res.resetToken)
        setStep('password')
      } else {
        setError('Invalid response from server')
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err)
      setError(err.response?.data?.message || 'Failed to verify code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setIsLoading(true)
      await apiClient.resetPassword(resetToken, password)
      toast.success('Password reset successfully! You can now log in.')
      navigate('/login')
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center mb-8 relative">
          <Link
            to="/login"
            className="absolute left-0 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8">
          {(['email', 'otp', 'password'] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s === step
                  ? 'bg-primary'
                  : ['email', 'otp', 'password'].indexOf(s) <
                      ['email', 'otp', 'password'].indexOf(step)
                    ? 'bg-success'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg"
          >
            <p className="text-sm text-danger font-medium">{error}</p>
          </motion.div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Enter your registered email address and we'll send you a code to reset your password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={isLoading || !email}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </motion.div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Verify Your Email</h2>
              <p className="text-sm text-muted-foreground mt-2">
                We've sent a 6-digit code to <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 text-center">
                Enter Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-center text-2xl tracking-[0.5em] font-bold"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <p className="text-xs text-muted-foreground text-center">
              Didn't receive the code?{' '}
              <button onClick={handleSendOTP} disabled={isLoading} className="text-primary hover:underline font-medium">
                Resend Code
              </button>
            </p>
          </motion.div>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Please enter your new password below.
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={isLoading || !password || !confirmPassword}
              className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
