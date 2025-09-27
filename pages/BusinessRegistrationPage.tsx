import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../src/store';
import { Page } from '../src/types';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/api';
import { BuildingOffice2Icon } from '../components/icons/Icons';

interface BusinessFormData {
  // Owner info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Business info
  businessName: string;
  businessDescription: string;
  category: string;
  phone: string;
  website: string;
  
  // Address
  street: string;
  postalCode: string;
  city: string;
  country: string;
  
  // Legal
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  
  // Social Media
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  tiktokUrl: string;
}

const BUSINESS_CATEGORIES = [
  'restaurants', 'beauty', 'fitness', 'education', 'healthcare',
  'automotive', 'technology', 'professional-services', 'retail',
  'real-estate', 'entertainment', 'construction', 'transportation',
  'agriculture', 'manufacturing', 'other'
];

export const BusinessRegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const { navigate } = useStore();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessDescription: '',
    category: '',
    phone: '',
    website: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'Netherlands',
    kvkNumber: '',
    btwNumber: '',
    iban: '',
    instagram: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    tiktokUrl: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal info
        return !!(formData.name && formData.email && formData.password && formData.confirmPassword);
      case 2: // Business info
        return !!(formData.businessName && formData.businessDescription && formData.category);
      case 3: // Contact & Address
        return !!(formData.street && formData.postalCode && formData.city);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.registerBusiness(formData);
      
      // Use the login method from AuthContext to set user and token
      await login(formData.email, formData.password);
      
      setToast({ message: 'Business registered successfully!', type: 'success' });
      
      setTimeout(() => {
        navigate(Page.Dashboard);
      }, 2000);
      
    } catch (error) {
      console.error('Business registration error:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Registration failed', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={`w-16 h-1 ${
                currentStep > step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">Full Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="Your full name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email Address *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="your.email@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password *</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="Create a strong password"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Confirm Password *</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="Confirm your password"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Business Information</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">Business Name *</label>
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="Your business name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Business Description *</label>
        <textarea
          name="businessDescription"
          value={formData.businessDescription}
          onChange={handleInputChange}
          rows={4}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="Describe what your business does..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Business Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          title="Select business category"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          required
        >
          <option value="">Select a category</option>
          {BUSINESS_CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="+31 6 12345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Website</label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="https://www.yourbusiness.com"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Address & Contact</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">Street Address *</label>
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={handleInputChange}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
          placeholder="Street name and number"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Postal Code *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
            placeholder="1234 AB"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
            placeholder="Amsterdam"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Country</label>
        <select
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          title="Select country"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="Netherlands">Netherlands</option>
          <option value="Belgium">Belgium</option>
          <option value="Germany">Germany</option>
        </select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Legal & Social Media (Optional)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">KVK Number</label>
          <input
            type="text"
            name="kvkNumber"
            value={formData.kvkNumber}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
            placeholder="12345678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">BTW Number</label>
          <input
            type="text"
            name="btwNumber"
            value={formData.btwNumber}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
            placeholder="NL123456789B01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">IBAN</label>
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
            placeholder="NL12 ABCD 0123456789"
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-6">
        <h4 className="text-lg font-medium mb-4">Social Media Links</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Instagram</label>
            <input
              type="url"
              name="instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
              placeholder="https://instagram.com/yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Facebook</label>
            <input
              type="url"
              name="facebook"
              value={formData.facebook}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
              placeholder="https://facebook.com/yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Twitter</label>
            <input
              type="url"
              name="twitter"
              value={formData.twitter}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
              placeholder="https://twitter.com/yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn</label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
              placeholder="https://linkedin.com/company/yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">TikTok</label>
            <input
              type="url"
              name="tiktokUrl"
              value={formData.tiktokUrl}
              onChange={handleInputChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600"
              placeholder="https://tiktok.com/@yourbusiness"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BuildingOffice2Icon className="h-12 w-12 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Register Your Business
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Join our platform and start connecting with customers
            </p>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-3 rounded-lg font-medium ${
                  currentStep === 1
                    ? 'invisible'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                disabled={currentStep === 1}
              >
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>Register Business</span>
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <button
                onClick={() => navigate(Page.Auth)}
                className="text-blue-500 hover:text-blue-600 font-medium underline bg-transparent border-none cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessRegistrationPage;
