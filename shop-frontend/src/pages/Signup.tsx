
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Smartphone, Lock, Eye, EyeOff, User, Store, Mail, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import { CustomSelect } from '@/components/ui/CustomSelect'

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'personal' | 'shop' | 'confirm' | 'otp'>(
    'personal'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [otpCode, setOtpCode] = useState('')

  // Personal Info
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Shop Info
  const [businessType, setBusinessType] = useState<'B2B' | 'B2C'>('B2C')
  const [shopName, setShopName] = useState('')
  const [shopCategory, setShopCategory] = useState('clothing')
  const [shopAddress, setShopAddress] = useState('')

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone: string) => {
    return phone.length >= 10
  }

  const handlePersonalNext = () => {
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }

    if (!validatePhone(phone)) {
      setError('Phone number must be at least 10 digits')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email')
      return
    }

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setStep('shop')
  }

  const handleShopNext = () => {
    setError('')

    if (!shopName.trim()) {
      setError('Please enter your shop name')
      return
    }

    setStep('confirm')
  }

  const handleSendOTP = async () => {
    setError('')
    try {
      setIsLoading(true)
      await apiClient.sendOTP(email, 'SIGNUP')
      toast.success('Verification code sent to your email!')
      setStep('otp')
    } catch (err: any) {
      console.error('Send OTP error:', err)
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.')
      toast.error('Failed to send verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async () => {
    setError('')
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    try {
      setIsLoading(true)

      await apiClient.register({
        name,
        email,
        password,
        phone,
        businessType,
        shopName,
        shopCategory,
        shopAddress,
        otpCode
      })

      toast.success('Account created successfully!')
      
      // Redirect to login
      navigate('/login')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
      toast.error('Signup failed. Please try again.')
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
        <div className="flex items-center justify-between mb-8">
          {step !== 'personal' && (
            <button
              onClick={() => {
                if (step === 'shop') setStep('personal')
                if (step === 'confirm') setStep('shop')
                if (step === 'otp') setStep('confirm')
              }}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          </div>
          <div className="w-12" />
        </div>

        {/* Progress Steps */}
        {step !== 'otp' && (
          <div className="flex gap-2 mb-8">
            {(['personal', 'shop', 'confirm'] as const).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s === step
                    ? 'bg-primary'
                    : ['personal', 'shop', 'confirm'].indexOf(s) <
                        ['personal', 'shop', 'confirm'].indexOf(step)
                      ? 'bg-success'
                      : 'bg-border'
                }`}
              />
            ))}
          </div>
        )}

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

        {/* Step 1: Personal Information */}
        {step === 'personal' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Merchant"
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9999999999"
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
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
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handlePersonalNext}
              disabled={isLoading}
              className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 2: Shop Information */}
        {step === 'shop' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Shop Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Shop Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Premium Boutique"
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Type
              </label>
              <CustomSelect
                value={businessType}
                onChange={(val) => setBusinessType(val as 'B2B' | 'B2C')}
                options={[
                  { value: 'B2C', label: 'Retail Store (B2C)' },
                  { value: 'B2B', label: 'Wholesale / Manufacturing (B2B)' }
                ]}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Category
              </label>
              <CustomSelect
                value={shopCategory}
                onChange={(val) => setShopCategory(val)}
                options={[
                  { value: 'clothing', label: 'Clothing & Fashion' },
                  { value: 'electronics', label: 'Electronics' },
                  { value: 'groceries', label: 'Groceries & Food' },
                  { value: 'furniture', label: 'Furniture' },
                  { value: 'beauty', label: 'Beauty & Cosmetics' },
                  { value: 'books', label: 'Books & Stationery' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Shop Address
              </label>
              <textarea
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Enter your shop address (optional)"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleShopNext}
              disabled={isLoading}
              className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Personal Information
                </p>
                <div className="mt-2 space-y-2 text-sm text-foreground">
                  <p>
                    <span className="font-medium">Name:</span> {name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {phone}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {email}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Shop Information
                </p>
                <div className="mt-2 space-y-2 text-sm text-foreground">
                  <p>
                    <span className="font-medium">Type:</span> {businessType === 'B2B' ? 'Wholesale (B2B)' : 'Retail (B2C)'}
                  </p>
                  <p>
                    <span className="font-medium">Shop:</span> {shopName}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{' '}
                    {shopCategory}
                  </p>
                  {shopAddress && (
                    <p>
                      <span className="font-medium">Address:</span>{' '}
                      {shopAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Send OTP Button */}
            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full mt-6 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Sending Code...' : 'Send Verification Code'}
            </button>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </motion.div>
        )}

        {/* Step 4: OTP Verification */}
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
              onClick={handleSignup}
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            
            <p className="text-xs text-muted-foreground text-center">
              Didn't receive the code?{' '}
              <button onClick={handleSendOTP} disabled={isLoading} className="text-primary hover:underline font-medium">
                Resend Code
              </button>
            </p>
          </motion.div>
        )}

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
