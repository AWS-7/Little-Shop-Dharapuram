import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Package, Heart, ChevronRight, Chrome,
  MapPin, Plus, Pencil, Trash2, Star, StickyNote, Check, Gift, Share2, Copy, Wallet, Shield, Sparkles
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

// ── Address Form (Add / Edit) ──
function AddressForm({ initial = EMPTY_ADDRESS, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-purple-50 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name (Receiver)</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="e.g. Priya Sharma"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="e.g. 9876543210" type="tel"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300" />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Address</label>
          <input name="address" value={form.address} onChange={handleChange} required placeholder="123, Main Street, Apt 4B"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">City</label>
          <input name="city" value={form.city} onChange={handleChange} required placeholder="Chennai"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">State</label>
          <input name="state" value={form.state} onChange={handleChange} required placeholder="Tamil Nadu"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PIN Code</label>
          <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="600001"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Location Tag</label>
          <select name="relationship_tag" value={form.relationship_tag} onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all appearance-none cursor-pointer">
            {RELATIONSHIP_TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Instructions</label>
          <textarea name="delivery_notes" value={form.delivery_notes} onChange={handleChange} rows={2}
            placeholder="e.g. Leave at security, call if I don't pick up"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-purple-primary focus:bg-white transition-all placeholder:text-gray-300 resize-none" />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${form.is_default ? 'bg-purple-primary border-purple-primary' : 'border-gray-200 group-hover:border-purple-primary'}`}>
          {form.is_default && <Check size={14} className="text-white" />}
        </div>
        <input type="checkbox" className="hidden" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
        <span className="text-xs font-bold text-gray-600">Set as default shipping address</span>
      </label>

      <div className="flex gap-4 pt-4 border-t border-gray-50">
        <button onClick={onCancel}
          className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-sm font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest">
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={saving || !form.full_name || !form.address || !form.city || !form.state || !form.pincode}
          className="flex-1 py-4 rounded-2xl bg-purple-primary text-white text-sm font-black hover:bg-purple-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-purple-primary/20">
          {saving ? 'Saving...' : 'Save Address'}
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
        
        {/* Left: User Info & Nav */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-purple-50 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-purple-primary p-1 mb-6 rotate-3 shadow-xl shadow-purple-primary/20">
              <div className="w-full h-full rounded-[20px] overflow-hidden bg-white">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-light text-purple-primary font-black text-2xl">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-1">{user.displayName}</h1>
            <p className="text-xs font-bold text-gray-400 mb-6">{user.email}</p>
            
            <div className="w-full h-px bg-gray-50 mb-6" />
            
            <div className="w-full space-y-2">
              <Link to="/my-orders" className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-light transition-colors group">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-gray-400 group-hover:text-purple-primary" />
                  <span className="text-sm font-black text-gray-700">Orders</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
              <Link to="/wishlist" className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-light transition-colors group">
                <div className="flex items-center gap-3">
                  <Heart size={18} className="text-gray-400 group-hover:text-purple-primary" />
                  <span className="text-sm font-black text-gray-700">Wishlist</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
              <Link to="/track-order" className="flex items-center justify-between p-4 rounded-2xl hover:bg-purple-light transition-colors group">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-gray-400 group-hover:text-purple-primary" />
                  <span className="text-sm font-black text-gray-700">Track Order</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
              <button onClick={onSignOut} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
                  <span className="text-sm font-black text-gray-700">Sign Out</span>
                </div>
              </button>
            </div>
          </div>

          {/* Referral Card */}
          <div className="bg-purple-primary rounded-3xl p-8 text-white shadow-xl shadow-purple-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Gift size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-black mb-2">Refer & Earn</h2>
              <p className="text-white/70 text-xs font-medium mb-6 leading-relaxed">
                Invite your friends and get ₹100 off your next order.
              </p>
              
              <div className="bg-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between border border-white/10">
                <span className="font-black tracking-widest">{referralCode || '...'}</span>
                <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-black">{referralStats?.totalReferrals || 0}</p>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Invites</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black">₹{referralStats?.totalRewards || 0}</p>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Earned</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
          </div>
        </div>

        {/* Right: Addresses */}
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm font-bold animate-shake">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Saved Addresses</h2>
            {!showForm && (
              <button onClick={() => setShowForm('add')} className="flex items-center gap-2 bg-white border-2 border-purple-primary text-purple-primary px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-light transition-all">
                <Plus size={16} /> Add New
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
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-purple-primary/10 border-t-purple-primary rounded-full animate-spin" />
            </div>
          ) : addresses.length === 0 && !showForm ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
              <MapPin size={48} className="mx-auto text-gray-200 mb-6" />
              <h3 className="text-lg font-black text-gray-900 mb-2">No Saved Addresses</h3>
              <p className="text-gray-400 text-sm font-medium mb-8">Add an address for a seamless checkout experience.</p>
              <button onClick={() => setShowForm('add')} className="bg-purple-primary text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-primary/20">
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map(addr => (
                <div key={addr.id} className={`bg-white rounded-3xl p-6 border transition-all ${addr.is_default ? 'border-purple-primary shadow-lg shadow-purple-primary/5' : 'border-gray-100 hover:border-purple-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-purple-primary uppercase tracking-widest bg-purple-light px-3 py-1 rounded-lg">
                      {addr.relationship_tag}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditData(addr); setShowForm(addr.id); }} className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-purple-primary">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(addr.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-black text-gray-900 mb-2 flex items-center gap-2">
                    {addr.full_name}
                    {addr.is_default && <Star size={12} fill="#6A0DAD" className="text-purple-primary" />}
                  </h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">
                    {addr.address}, {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                  
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.id)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-purple-primary transition-colors">
                      Set as Default
                    </button>
                  )}
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
      <div className="container-clean pt-36 pb-24 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-purple-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-purple-primary/20 rotate-3">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Your Identity</h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            Please sign in with Google to access your profile, orders, and saved addresses.
          </p>
          <button
            onClick={async () => {
              const res = await loginWithGoogle();
              if (res.success) setUser(res.user);
            }}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 rounded-2xl font-black text-gray-700 hover:border-purple-primary hover:bg-purple-light transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="uppercase tracking-widest">Continue with Google</span>
          </button>
          
          <div className="mt-12 flex items-center justify-center gap-3 text-xs font-black text-gray-300 uppercase tracking-widest">
            <Shield size={16} />
            Secure Authentication
          </div>
        </div>
      </div>
    );
  }

  return <ProfileView user={user} onSignOut={handleSignOut} />;
}
