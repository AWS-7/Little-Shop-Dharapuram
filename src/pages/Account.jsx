import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, LogIn, LogOut, Package, Heart, ChevronRight, Smartphone, Chrome,
  MapPin, Plus, Pencil, Trash2, Star, Phone, StickyNote, X, Check, Users, Gift, Share2, Copy, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, RELATIONSHIP_TAGS,
} from '../lib/addresses';
import { getOrCreateReferralCode, getReferralStats } from '../lib/referrals';
import { getUserCoupons } from '../lib/coupons';

// 6-Digit OTP Input Component with auto-focus and auto-fill
function OTPInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

  // Sync external value with internal state
  useEffect(() => {
    if (value) {
      const chars = value.split('').slice(0, 6);
      setOtpValues(chars.concat(Array(6 - chars.length).fill('')));
    }
  }, [value]);

  const handleChange = (index, char) => {
    const newOtp = [...otpValues];
    newOtp[index] = char;
    setOtpValues(newOtp);
    onChange(newOtp.join(''));

    // Auto-focus next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace to go back
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Left arrow to go back
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    // Right arrow to go forward
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newOtp = pasteData.split('').concat(Array(6 - pasteData.length).fill(''));
      setOtpValues(newOtp);
      onChange(pasteData);
      // Focus the next empty input or last one
      const focusIndex = Math.min(pasteData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {otpValues.map((char, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={char}
          onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-lg
                     focus:border-purple-primary focus:outline-none transition-colors
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  );
}

// ── Empty address template ──
const EMPTY_ADDRESS = {
  full_name: '', phone: '', alt_phone: '', address: '', city: '', state: '', pincode: '',
  relationship_tag: 'self', delivery_notes: '', is_default: false,
};

// ── Address Form (Add / Edit) ──
function AddressForm({ initial = EMPTY_ADDRESS, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">Full Name (Receiver)</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="e.g. Priya Sharma"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">Phone Number</label>
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210" type="tel"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">Alternative Number <span className="normal-case text-gray-300">(for delivery)</span></label>
          <input name="alt_phone" value={form.alt_phone} onChange={handleChange} placeholder="Optional" type="tel"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300" />
        </div>
        <div className="md:col-span-2">
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">Address</label>
          <input name="address" value={form.address} onChange={handleChange} required placeholder="123, Main Street, Apt 4B"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">City</label>
          <input name="city" value={form.city} onChange={handleChange} required placeholder="Chennai"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">State</label>
          <input name="state" value={form.state} onChange={handleChange} required placeholder="Tamil Nadu"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">PIN Code</label>
          <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="600001"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">Tag</label>
          <select name="relationship_tag" value={form.relationship_tag} onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors bg-white">
            {RELATIONSHIP_TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block font-inter text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5 font-medium">Delivery Instructions <span className="normal-case text-gray-300">(optional)</span></label>
          <textarea name="delivery_notes" value={form.delivery_notes} onChange={handleChange} rows={2}
            placeholder="e.g. Leave at security, call alternate number if I don't pick up"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors placeholder:text-gray-300 resize-none" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-purple-primary focus:ring-purple-primary" />
        <span className="font-inter text-xs text-gray-600">Set as default shipping address</span>
      </label>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-full border border-gray-200 font-inter text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={saving || !form.full_name || !form.phone || !form.address || !form.city || !form.state || !form.pincode}
          className="flex-1 py-3 rounded-full bg-purple-primary text-white font-inter text-sm font-medium hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <Check size={14} /> {saving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Profile View (logged-in) ──
function ProfileView({ user, onSignOut }) {
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const isGoogleUser = user.app_metadata?.provider === 'google' || user.user_metadata?.iss?.includes('google');

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm] = useState(false); // 'add' | addressId (edit) | false
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Referral state
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch addresses and referral data on mount
  useEffect(() => {
    if (user?.id) {
      getAddresses(user.id).then(({ data }) => {
        setAddresses(data);
        setLoadingAddresses(false);
      });

      // Fetch referral data
      loadReferralData();
    }
  }, [user?.id]);

  const loadReferralData = async () => {
    setLoadingReferral(true);
    try {
      // Get or create referral code
      const { code } = await getOrCreateReferralCode(user.id);
      setReferralCode(code);

      // Get referral stats
      const { stats } = await getReferralStats(user.id);
      setReferralStats(stats);

      // Get user's reward coupons
      const { data: userCoupons } = await getUserCoupons(user.id, { onlyActive: true });
      setCoupons(userCoupons.filter(c => c.type === 'referral_reward'));
    } catch (err) {
      console.error('Error loading referral data:', err);
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

  const handleShareWhatsApp = () => {
    if (!referralCode) return;
    
    const message = `🛍️ Join me at Little Shop - Luxury Boutique!

Shop beautiful sarees, jewellery, and more. Use my referral code *${referralCode}* and get exclusive benefits on your first order!

Shop now: ${window.location.origin}

#Littleshop #ReferAndEarn`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSave = async (formData) => {
    setSaving(true);
    if (showForm === 'add') {
      const { data, error } = await createAddress(user.id, formData);
      if (error) {
        console.error('Error creating address:', error);
        alert('Failed to save address: ' + (error.message || 'Unknown error'));
      } else if (data) {
        if (data.is_default) {
          setAddresses((prev) => prev.map((a) => ({ ...a, is_default: false })).concat(data));
        } else {
          setAddresses((prev) => [...prev, data]);
        }
        setShowForm(false);
        setEditData(null);
      }
    } else {
      // editing
      const { data, error } = await updateAddress(showForm, formData);
      if (error) {
        console.error('Error updating address:', error);
        alert('Failed to update address: ' + (error.message || 'Unknown error'));
      } else if (data) {
        if (data.is_default) {
          setAddresses((prev) => prev.map((a) => a.id === data.id ? data : { ...a, is_default: false }));
        } else {
          setAddresses((prev) => prev.map((a) => a.id === data.id ? data : a));
        }
        setShowForm(false);
        setEditData(null);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this address?')) return;
    const { error } = await deleteAddress(id);
    if (!error) setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id) => {
    const { data, error } = await setDefaultAddress(user.id, id);
    if (!error && data) {
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    }
  };

  const tagColor = (tag) => {
    const map = { self: 'bg-purple-primary/10 text-purple-primary', father: 'bg-blue-50 text-blue-600', mother: 'bg-pink-50 text-pink-600', friend: 'bg-amber-50 text-amber-600', office: 'bg-gray-100 text-gray-600' };
    return map[tag] || map.self;
  };

  return (
    <div className="container-luxury section-spacing">
      <div className="max-w-2xl mx-auto">

        {/* ═══ Glassmorphism Profile Header ═══ */}
        <div className="relative rounded-3xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-primary/80 via-purple-primary/60 to-rose-gold/40" />
          <div className="absolute inset-0 backdrop-blur-sm bg-white/10" />
          <div className="relative px-6 py-10 md:py-12 text-center">
            {/* Avatar with Rose Gold ring */}
            <div className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-rose-gold/60 ring-offset-4 ring-offset-white/20 overflow-hidden bg-white/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={36} className="text-white" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <h1 className="font-playfair text-2xl md:text-3xl text-white mb-1 drop-shadow-sm">{displayName}</h1>
            <p className="font-inter text-sm text-white/70">{user.email}</p>
            {user.phone && <p className="font-inter text-xs text-white/50 mt-0.5">{user.phone}</p>}
            {isGoogleUser && (
              <p className="font-inter text-[10px] text-white/60 mt-2 flex items-center justify-center gap-1">
                <Chrome size={12} /> Signed in with Google
              </p>
            )}
          </div>
        </div>

        {/* ═══ Quick Links ═══ */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 mb-8">
          <Link to="/my-orders" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-primary/5 flex items-center justify-center"><Package size={16} className="text-purple-primary" /></div>
              <span className="font-inter text-sm text-gray-700">My Orders</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
          <Link to="/wishlist" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-gold/5 flex items-center justify-center"><Heart size={16} className="text-rose-gold" /></div>
              <span className="font-inter text-sm text-gray-700">Wishlist</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
          <Link to="/track-order" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-primary/5 flex items-center justify-center"><MapPin size={16} className="text-purple-primary" /></div>
              <span className="font-inter text-sm text-gray-700">Track Order</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        </div>

        {/* ═══ Refer & Earn ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-br from-purple-primary/90 to-emerald-800 rounded-2xl overflow-hidden shadow-lg shadow-purple-primary/20"
        >
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Gift size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-playfair text-xl text-white">Refer & Earn</h2>
                <p className="font-inter text-xs text-white/70">Invite friends & earn ₹100 per referral</p>
              </div>
            </div>

            {loadingReferral ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Referral Code Display */}
                {referralCode && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                    <p className="font-inter text-[10px] tracking-wider uppercase text-white/60 mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white rounded-lg px-4 py-3">
                        <span className="font-inter text-lg font-bold text-purple-primary tracking-wider">{referralCode}</span>
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        title="Copy code"
                      >
                        {copied ? <Check size={20} className="text-white" /> : <Copy size={20} className="text-white" />}
                      </button>
                    </div>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-inter text-xs text-white/80 mt-2"
                      >
                        Code copied to clipboard!
                      </motion.p>
                    )}
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="font-playfair text-2xl text-white">{referralStats?.totalReferrals || 0}</p>
                    <p className="font-inter text-[10px] text-white/60 uppercase tracking-wider">Invited</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="font-playfair text-2xl text-white">{referralStats?.successfulReferrals || 0}</p>
                    <p className="font-inter text-[10px] text-white/60 uppercase tracking-wider">Joined</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="font-playfair text-2xl text-white">₹{referralStats?.totalRewards || 0}</p>
                    <p className="font-inter text-[10px] text-white/60 uppercase tracking-wider">Earned</p>
                  </div>
                </div>

                {/* Active Rewards */}
                {coupons.length > 0 && (
                  <div className="mb-6">
                    <p className="font-inter text-[10px] tracking-wider uppercase text-white/60 mb-3 flex items-center gap-2">
                      <Wallet size={12} /> Active Rewards ({coupons.length})
                    </p>
                    <div className="space-y-2">
                      {coupons.slice(0, 2).map((coupon) => (
                        <div key={coupon.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-inter text-sm font-medium text-white">₹{coupon.discount_amount} OFF</p>
                            <p className="font-inter text-[10px] text-white/60">Valid until {new Date(coupon.valid_until).toLocaleDateString()}</p>
                          </div>
                          <span className="font-inter text-xs text-white/80 bg-white/20 px-2 py-1 rounded">{coupon.code}</span>
                        </div>
                      ))}
                      {coupons.length > 2 && (
                        <p className="font-inter text-xs text-white/60 text-center">+{coupons.length - 2} more rewards</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-white text-purple-primary font-inter text-sm font-semibold py-3.5 rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  <Share2 size={18} />
                  Share on WhatsApp
                </button>

                {/* How it Works */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="font-inter text-xs text-white/60 mb-3">How it works:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-inter text-[10px] text-white">1</span>
                      <span className="font-inter text-xs text-white/80">Share your code with friends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-inter text-[10px] text-white">2</span>
                      <span className="font-inter text-xs text-white/80">They sign up & complete first purchase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-inter text-[10px] text-white">3</span>
                      <span className="font-inter text-xs text-white/80">You get ₹100 off coupon instantly!</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ═══ Saved Addresses ═══ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-playfair text-xl text-purple-primary">Saved Addresses</h2>
              <p className="font-inter text-[10px] text-gray-400 mt-0.5">Manage your shipping addresses</p>
            </div>
            {!showForm && (
              <button onClick={() => { setShowForm('add'); setEditData(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-primary text-purple-primary font-inter text-xs font-medium hover:bg-purple-primary hover:text-white transition-colors">
                <Plus size={14} /> Add New
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showForm && (
              <div className="mb-4">
                <AddressForm
                  initial={editData || EMPTY_ADDRESS}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditData(null); }}
                  saving={saving}
                />
              </div>
            )}
          </AnimatePresence>

          {loadingAddresses ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-purple-primary/20 border-t-purple-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : addresses.length === 0 && !showForm ? (
            <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl">
              <MapPin size={32} className="mx-auto text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="font-inter text-sm text-gray-400">No saved addresses yet</p>
              <p className="font-inter text-xs text-gray-300 mt-1">Add an address for faster checkout</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <motion.div
                  key={addr.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border rounded-2xl p-5 transition-shadow ${addr.is_default ? 'border-purple-primary/30 shadow-sm shadow-purple-primary/5' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h4 className="font-inter text-sm font-semibold text-gray-800">{addr.full_name}</h4>
                        <span className={`font-inter text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full font-medium ${tagColor(addr.relationship_tag)}`}>
                          {addr.relationship_tag}
                        </span>
                        {addr.is_default && (
                          <span className="font-inter text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-primary text-white font-medium flex items-center gap-1">
                            <Star size={8} fill="currentColor" /> Default
                          </span>
                        )}
                      </div>
                      <p className="font-inter text-xs text-gray-500 leading-relaxed">
                        {addr.address}, {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-gray-400">
                        <span className="font-inter text-[11px] flex items-center gap-1"><Phone size={11} /> {addr.phone}</span>
                        {addr.alt_phone && (
                          <span className="font-inter text-[11px] flex items-center gap-1"><Phone size={11} /> {addr.alt_phone}</span>
                        )}
                      </div>
                      {addr.delivery_notes && (
                        <p className="font-inter text-[11px] text-gray-400 mt-1.5 flex items-start gap-1">
                          <StickyNote size={11} className="mt-0.5 flex-shrink-0" /> {addr.delivery_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!addr.is_default && (
                        <button onClick={() => handleSetDefault(addr.id)} title="Set as default"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-purple-primary hover:bg-purple-primary/5 transition-colors">
                          <Star size={14} />
                        </button>
                      )}
                      <button onClick={() => { setShowForm(addr.id); setEditData(addr); }} title="Edit"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-purple-primary hover:bg-purple-primary/5 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(addr.id)} title="Delete"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-gray-200 font-inter text-sm text-gray-500 hover:text-rose-gold hover:border-rose-gold transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, signIn, signUp, signOut, signInWithGoogle, signInWithPhone, verifyPhoneOtp, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', otp: '', referralCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);

  // Handle OAuth callback (Google redirect back)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if URL has hash with access_token (OAuth callback)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        setOauthProcessing(true);
        setLoading(true);
        try {
          // The session is automatically handled by Supabase client
          // Just refresh to get the user
          await refreshUser();
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        } catch (err) {
          console.error('OAuth callback error:', err);
          setError('Authentication failed. Please try again.');
        } finally {
          setOauthProcessing(false);
          setLoading(false);
        }
      }
    };
    handleOAuthCallback();
  }, [refreshUser]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) setError(err.message);
    // Note: Google OAuth redirects, so we don't setLoading(false)
  };

  // Phone OTP handlers
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signInWithPhone(form.phone);
    if (err) {
      setError(err.message);
    } else {
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await verifyPhoneOtp(form.phone, form.otp);
    if (err) setError(err.message);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const { error: err } = await signIn(form.email, form.password);
      if (err) setError(err.message);
    } else {
      const { error: err } = await signUp(form.email, form.password, form.name, form.referralCode);
      if (err) setError(err.message);
      else setError(''); // Supabase may require email confirmation
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || oauthProcessing) {
    return (
      <div className="container-luxury section-spacing flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-primary/20 border-t-purple-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="font-inter text-sm text-gray-400">
            {oauthProcessing ? 'Completing Google Sign In...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // ── Logged-in Profile View ──
  if (user) {
    return <ProfileView user={user} onSignOut={handleSignOut} />;
  }

  // ── Auth Form ──
  return (
    <div className="container-luxury section-spacing">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-playfair text-3xl text-purple-primary mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="font-inter text-sm text-gray-400">
            {isLogin ? 'Sign in to your Little Shop account' : 'Join the Little Shop circle'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-gold/5 border border-rose-gold/20 rounded-sm p-3 mb-4 text-center">
            <p className="font-inter text-sm text-rose-gold">{error}</p>
          </div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {!isLogin && (
            <>
              <div>
                <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              {/* Referral Code Field (Optional) */}
              <div>
                <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                  Referral Code <span className="text-gray-300 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Gift size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="referralCode"
                    value={form.referralCode}
                    onChange={handleChange}
                    className="w-full border border-gray-200 pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                    placeholder="Enter friend's code (e.g., LSABCD1234)"
                  />
                </div>
                <p className="font-inter text-[10px] text-gray-400 mt-1.5">
                  Have a referral code? Enter it to help your friend earn rewards!
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-200 pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-200 pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn size={16} />
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </motion.button>
        </motion.form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="font-inter text-xs text-gray-400 uppercase">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => { setAuthMode('email'); setError(''); setOtpSent(false); }}
            className={`flex items-center gap-2 px-4 py-2 font-inter text-xs rounded-sm transition-colors ${
              authMode === 'email' ? 'bg-purple-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Mail size={14} /> Email
          </button>
          <button
            onClick={() => { setAuthMode('phone'); setError(''); setOtpSent(false); }}
            className={`flex items-center gap-2 px-4 py-2 font-inter text-xs rounded-sm transition-colors ${
              authMode === 'phone' ? 'bg-purple-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Smartphone size={14} /> Phone
          </button>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-sm font-inter text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
        >
          <Chrome size={18} className="text-blue-500" />
          Continue with Google
        </button>

        {/* Phone OTP Form */}
        {authMode === 'phone' && !otpSent && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSendOtp}
            className="space-y-4"
          >
            <div>
              <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-200 pl-11 pr-4 py-3 font-inter text-sm outline-none focus:border-purple-primary transition-colors"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <p className="font-inter text-[10px] text-gray-400 mt-1">Enter with country code (e.g., +91)</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </motion.form>
        )}

        {/* OTP Verification Form */}
        {authMode === 'phone' && otpSent && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleVerifyOtp}
            className="space-y-4"
          >
            <div className="bg-purple-primary/5 border border-purple-primary/20 rounded-sm p-3 text-center">
              <p className="font-inter text-sm text-purple-primary">OTP sent to {form.phone}</p>
            </div>
            <div>
              <label className="block font-inter text-xs tracking-wider uppercase text-gray-500 mb-3 text-center">
                Enter 6-Digit Code
              </label>
              <OTPInput
                value={form.otp}
                onChange={(otp) => setForm({ ...form, otp })}
                disabled={loading}
              />
              <p className="font-inter text-[10px] text-gray-400 mt-2 text-center">
                Auto-fills from SMS on mobile devices
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || form.otp.length !== 6}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn size={16} />
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setForm({ ...form, otp: '' }); }}
              className="w-full font-inter text-xs text-gray-500 hover:text-purple-primary"
            >
              Change phone number
            </button>
          </motion.form>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setAuthMode('email'); setOtpSent(false); }}
            className="font-inter text-sm text-gray-500 hover:text-purple-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
