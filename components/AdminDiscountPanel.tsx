import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Eye, BarChart3, Calendar, Users, Euro } from 'lucide-react';

interface DiscountCode {
  _id: string;
  code: string;
  type: 'percentage' | 'free_year' | 'free_lifetime';
  description: string;
  discountPercent?: number;
  applicablePlans: string[];
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateDiscountData {
  code: string;
  type: 'percentage' | 'free_year' | 'free_lifetime';
  description: string;
  discountPercent?: number;
  applicablePlans: string[];
  maxUses?: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
}

interface AdminDiscountPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AdminDiscountPanel({ isVisible, onClose }: AdminDiscountPanelProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDiscountData>({
    code: '',
    type: 'percentage',
    description: '',
    discountPercent: 0,
    applicablePlans: ['basic', 'premium', 'business'],
    maxUses: undefined,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    isActive: true,
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    if (isVisible) {
      fetchDiscountCodes();
    }
  }, [isVisible]);

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || '';
  };

  const fetchDiscountCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/discount-codes`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data.codes || []);
      } else {
        setError('Failed to fetch discount codes');
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      setError('Network error while fetching codes');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingCode 
        ? `${apiUrl}/api/discount-codes/${editingCode._id}`
        : `${apiUrl}/api/discount-codes`;
      
      const method = editingCode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editingCode ? 'Code updated successfully!' : 'Code created successfully!');
        setShowCreateForm(false);
        setEditingCode(null);
        resetForm();
        fetchDiscountCodes();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save discount code');
      }
    } catch (error) {
      console.error('Error saving discount code:', error);
      setError('Network error while saving code');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      const response = await fetch(`${apiUrl}/api/discount-codes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        setSuccess('Code deleted successfully!');
        fetchDiscountCodes();
      } else {
        setError('Failed to delete discount code');
      }
    } catch (error) {
      console.error('Error deleting discount code:', error);
      setError('Network error while deleting code');
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      const response = await fetch(`${apiUrl}/api/discount-codes/${code._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ ...code, isActive: !code.isActive }),
      });

      if (response.ok) {
        setSuccess(`Code ${!code.isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchDiscountCodes();
      } else {
        setError('Failed to update code status');
      }
    } catch (error) {
      console.error('Error updating code status:', error);
      setError('Network error while updating code');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      description: '',
      discountPercent: 0,
      applicablePlans: ['basic', 'premium', 'business'],
      maxUses: undefined,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      isActive: true,
    });
  };

  const startEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      type: code.type,
      description: code.description,
      discountPercent: code.discountPercent || 0,
      applicablePlans: code.applicablePlans,
      maxUses: code.maxUses,
      validFrom: code.validFrom.split('T')[0],
      validUntil: code.validUntil ? code.validUntil.split('T')[0] : '',
      isActive: code.isActive,
    });
    setShowCreateForm(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`Code "${text}" copied to clipboard!`);
  };

  const createQuickCode = (type: 'percentage' | 'free_year' | 'free_lifetime', percent?: number) => {
    const timestamp = Date.now().toString(36).toUpperCase();
    let code = '';
    let description = '';

    switch (type) {
      case 'percentage':
        code = `SAVE${percent || 20}_${timestamp}`;
        description = `${percent || 20}% discount on all plans`;
        break;
      case 'free_year':
        code = `FREEYEAR_${timestamp}`;
        description = 'Free subscription for 1 year';
        break;
      case 'free_lifetime':
        code = `LIFETIME_${timestamp}`;
        description = 'Lifetime free access';
        break;
    }

    setFormData({
      ...formData,
      code,
      type,
      description,
      discountPercent: type === 'percentage' ? (percent || 20) : 0,
    });
    setShowCreateForm(true);
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'percentage': return { text: 'Percentage', color: 'bg-blue-100 text-blue-800' };
      case 'free_year': return { text: 'Free Year', color: 'bg-green-100 text-green-800' };
      case 'free_lifetime': return { text: 'Lifetime', color: 'bg-purple-100 text-purple-800' };
      default: return { text: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Euro className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Discount Code Management</h2>
                <p className="opacity-90">Create and manage discount codes for TIK</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quick Create</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => createQuickCode('percentage', 10)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                10% Off Code
              </button>
              <button
                onClick={() => createQuickCode('percentage', 25)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                25% Off Code
              </button>
              <button
                onClick={() => createQuickCode('percentage', 50)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                50% Off Code
              </button>
              <button
                onClick={() => createQuickCode('free_year')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Free Year Code
              </button>
              <button
                onClick={() => createQuickCode('free_lifetime')}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                Lifetime Code
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Custom Code
              </button>
            </div>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingCode ? 'Edit Discount Code' : 'Create New Discount Code'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="DISCOUNT20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Type of discount code"
                    >
                      <option value="percentage">Percentage Discount</option>
                      <option value="free_year">Free Year</option>
                      <option value="free_lifetime">Lifetime Free</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="20% off all plans"
                    required
                  />
                </div>

                {formData.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Percentage
                    </label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                      placeholder="Enter percentage (1-100)"
                      aria-label="Discount percentage"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Uses (optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxUses || ''}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      aria-label="Valid from date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Valid until date (optional)"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active immediately
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Saving...' : (editingCode ? 'Update Code' : 'Create Code')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCode(null);
                      resetForm();
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Codes List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Existing Codes</h3>
              <button
                onClick={fetchDiscountCodes}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Usage</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valid Until</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {discountCodes.map((code) => {
                    const typeDisplay = getTypeDisplay(code.type);
                    return (
                      <tr key={code._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{code.code}</span>
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              className="text-gray-400 hover:text-gray-600"
                              aria-label={`Copy code ${code.code} to clipboard`}
                              title={`Copy ${code.code}`}
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeDisplay.color}`}>
                            {typeDisplay.text}
                            {code.type === 'percentage' && ` ${code.discountPercent}%`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {code.description}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {code.validUntil ? formatDate(code.validUntil) : 'No expiry'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(code)}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              code.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {code.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(code)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(code._id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {discountCodes.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No discount codes found. Create your first code above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}