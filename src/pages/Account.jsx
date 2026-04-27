import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Package, Heart, ChevronRight, Chrome,
  MapPin, Plus, Pencil, Trash2, Star, Check, Gift, Share2, Copy, Wallet, Shield, Sparkles
} from 'lucide-react';
import { loginWithGoogle, logoutUser, getCurrentUser, isAuthenticated } from '../lib/firebaseAuth';
import {
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, RELATIONSHIP_TAGS,
} from '../lib/addresses';
import { getOrCreateReferralCode, getReferralStats } from '../lib/referrals';
import { getUserCoupons } from '../lib/coupons';

// ── Empty address template ──
const EMPTY_ADDRESS = {
  full_name: '', phone: '', address: '', city: '', state: '', pincode: '',
  relationship_tag: 'self', delivery_notes: '', is_default: false,
};

// ── Address Form (Add / Edit) - Modern MNC Style ──
function AddressForm({ initial = EMPTY_ADDRESS, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
    >
      {/* Form Header */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          {initial.id ? 'Edit Address' : 'Add New Address'}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {initial.id ? 'Update your delivery address details' : 'Enter your delivery address details'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name (Receiver)</label>
          <input 
            name="full_name" 
            value={form.full_name} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Priya Sharma"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400" 
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input 
            name="phone" 
            value={form.phone} 
            onChange={handleChange} 
            required 
            placeholder="e.g. 9876543210" 
            type="tel"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400" 
          />
        </div>

        {/* Tag */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Location Tag</label>
          <select 
            name="relationship_tag" 
            value={form.relationship_tag} 
            onChange={handleChange}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]"
          >
            {RELATIONSHIP_TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        
        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Street Address</label>
          <input 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            required 
            placeholder="House/Flat No, Street, Landmark"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400" 
          />
        </div>

        {/* City & State */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">City</label>
          <input 
            name="city" 
            value={form.city} 
            onChange={handleChange} 
            required 
            placeholder="Chennai"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400" 
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">State</label>
          <input 
            name="state" 
            value={form.state} 
            onChange={handleChange} 
            required 
            placeholder="Tamil Nadu"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400" 
          />
        </div>

        {/* PIN */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">PIN Code</label>
          <input 
            name="pincode" 
            value={form.pincode} 
            onChange={handleChange} 
            required 
            placeholder="600001"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400" 
          />
        </div>

        {/* Delivery Notes */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Delivery Instructions (Optional)</label>
          <textarea 
            name="delivery_notes" 
            value={form.delivery_notes} 
            onChange={handleChange} 
            rows={2}
            placeholder="e.g. Leave at security, call before delivery"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400 resize-none" 
          />
        </div>
      </div>

      {/* Default Checkbox */}
      <div className="mt-4 flex items-center gap-3">
        <input 
          type="checkbox" 
          id="is_default" 
          checked={form.is_default} 
          onChange={(e) => setForm({ ...form, is_default: e.target.checked })} 
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
        />
        <label htmlFor="is_default" className="text-sm text-gray-700 cursor-pointer select-none">
          Set as default shipping address
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
        <button 
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSave(form)} 
          disabled={saving || !form.full_name || !form.address || !form.city || !form.state || !form.pincode}
          className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            'Save Address'
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ── Profile View (logged-in) ──
function ProfileView({ user, onSignOut }) {
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Referral state
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [copied, setCopied] = useState(false);

  // Helper to check if UID is valid UUID format
  const isValidUUID = (id) => {
    if (!id) return false;
    // UUID v4 format: 8-4-4-4-12 hex characters
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  useEffect(() => {
    if (user?.uid) {
      // Skip API calls if UID is not valid UUID (Firebase Auth ID issue)
      if (!isValidUUID(user.uid)) {
        setAddresses([]);
        setLoadingAddresses(false);
        setLoadingReferral(false);
        return;
      }
      
      getAddresses(user.uid).then(({ data, error }) => {
        if (error && error.code === '22P02') {
          setAddresses([]);
        } else {
          setAddresses(data || []);
        }
        setLoadingAddresses(false);
      });
      loadReferralData();
    }
  }, [user?.uid]);

  const loadReferralData = async () => {
    // Skip if UID is not valid UUID
    if (!isValidUUID(user?.uid)) {
      setLoadingReferral(false);
      return;
    }
    
    setLoadingReferral(true);
    try {
      const { code } = await getOrCreateReferralCode(user.uid);
      setReferralCode(code);
      const { stats } = await getReferralStats(user.uid);
      setReferralStats(stats);
      const { data: userCoupons } = await getUserCoupons(user.uid, { onlyActive: true });
      setCoupons(userCoupons?.filter(c => c.type === 'referral_reward') || []);
    } catch (err) {
      // Silently ignore UUID errors
      if (err?.code !== '22P02') {
        console.error('Error loading referral data:', err);
      }
    } finally {
      setLoadingReferral(false);
    }
  };

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    setError('');
    try {
      if (showForm === 'add') {
        const { data, error } = await createAddress(user.uid, formData);
        if (error) throw error;
        if (data) {
          setAddresses(prev => data.is_default ? prev.map(a => ({ ...a, is_default: false })).concat(data) : [...prev, data]);
          setShowForm(false);
        }
      } else {
        const { data, error } = await updateAddress(user.uid, showForm, formData);
        if (error) throw error;
        if (data) {
          setAddresses(prev => prev.map(a => a.id === data.id ? data : (data.is_default ? { ...a, is_default: false } : a)));
          setShowForm(false);
        }
      }
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err.message || 'Failed to save address. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this address?')) {
      const { error } = await deleteAddress(id);
      if (!error) setAddresses(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSetDefault = async (id) => {
    const { data, error } = await setDefaultAddress(user.uid, id);
    if (!error && data) {
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    }
  };

  return (
    <div className="container-clean pt-36 pb-24">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left: User Info & Nav - Modern MNC Style */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Avatar Section */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 p-0.5 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-600 font-semibold text-xl">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">{user.displayName}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                Active
              </span>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <Link to="/my-orders" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Package size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">My Orders</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
              
              <Link to="/wishlist" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Heart size={18} className="text-rose-500" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Wishlist</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
              
              <Link to="/track-order" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <MapPin size={18} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Track Order</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            </div>

            {/* Sign Out */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all group">
                <LogOut size={18} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Referral Card - Modern MNC Style */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            {/* Decorative Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Gift size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Refer & Earn</h2>
                  <p className="text-white/70 text-xs">Share with friends</p>
                </div>
              </div>
              
              {/* Referral Code */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Your Code</p>
                    <span className="text-lg font-mono font-semibold tracking-wider">{referralCode || '...'}</span>
                  </div>
                  <button 
                    onClick={handleCopyCode} 
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5">
                  <p className="text-xl font-semibold">{referralStats?.totalReferrals || 0}</p>
                  <p className="text-[10px] text-white/60">Invites</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/5">
                  <p className="text-xl font-semibold">₹{referralStats?.totalRewards || 0}</p>
                  <p className="text-[10px] text-white/60">Earned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Addresses - Modern MNC Style */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              {error}
            </div>
          )}
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage your delivery locations</p>
            </div>
            {!showForm && (
              <button 
                onClick={() => setShowForm('add')} 
                className="flex items-center gap-2 bg-purple-primary text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-purple-secondary transition-all shadow-sm hover:shadow-md"
              >
                <Plus size={16} /> 
                Add New
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showForm && (
              <AddressForm
                initial={editData || EMPTY_ADDRESS}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditData(null); }}
                saving={saving}
              />
            )}
          </AnimatePresence>

          {loadingAddresses ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading addresses...</p>
              </div>
            </div>
          ) : addresses.length === 0 && !showForm ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Addresses</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Add a delivery address to enjoy faster checkout and seamless order delivery.</p>
              <button 
                onClick={() => setShowForm('add')} 
                className="bg-purple-primary text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-purple-secondary transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  className={`bg-white rounded-xl p-5 border transition-all ${addr.is_default ? 'border-purple-200 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-md capitalize">
                        {addr.relationship_tag}
                      </span>
                      {addr.is_default && (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
                          <Star size={10} fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditData(addr); setShowForm(addr.id); }} 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(addr.id)} 
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Address Content */}
                  <div className="space-y-1 mb-4">
                    <h4 className="font-semibold text-gray-900">{addr.full_name}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {addr.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    {addr.delivery_notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Note: {addr.delivery_notes}
                      </p>
                    )}
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                      {addr.phone}
                    </p>
                    {!addr.is_default && (
                      <button 
                        onClick={() => handleSetDefault(addr.id)} 
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    navigate('/');
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="container-clean pt-32 pb-24 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full">
          {/* Card Container */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-sm text-gray-500">
                Sign in to access your orders, wishlist, and saved addresses.
              </p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={async () => {
                const res = await loginWithGoogle();
                if (res.success) setUser(res.user);
              }}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3.5 px-4 rounded-xl font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400">or</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-green-600" />
                </div>
                <span>Track your orders in real-time</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <Heart size={16} className="text-rose-500" />
                </div>
                <span>Save items to your wishlist</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                <span>Manage multiple delivery addresses</span>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield size={14} />
              <span>Secure, encrypted authentication</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-gray-400">
            <div className="flex items-center gap-1.5 text-xs">
              <Check size={12} className="text-green-500" />
              <span>Fast Checkout</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Check size={12} className="text-green-500" />
              <span>Order History</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Check size={12} className="text-green-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ProfileView user={user} onSignOut={handleSignOut} />;
}
