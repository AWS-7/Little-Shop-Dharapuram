import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Build a chainable query object
const buildChain = () => {
  const result = {
    data: null,
    error: null,
    then: function(onFulfilled) {
      return Promise.resolve(result).then(onFulfilled);
    },
    catch: function(onRejected) {
      return Promise.resolve(result).catch(onRejected);
    }
  };
  
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains',
    'containedBy', 'range', 'overlapping',
    'textSearch', 'match', 'not', 'or', 'and',
    'filter', 'order', 'limit', 'range_lt', 'range_gt',
    'range_lte', 'range_gte', 'fulltext', 'fts',
    'plfts', 'phfts', 'wfts', 'cs', 'cd', 'sl',
    'sr', 'nxl', 'nxr', 'adj', 'mv', 'single'
  ];
  
  methods.forEach(method => {
    result[method] = function() { return result; };
  });
  
  return result;
};

// Create dummy client if credentials missing (for migration period)
const createDummyClient = () => {
  console.warn('⚠️ Supabase not configured - using dummy client');
  
  const chainable = buildChain();
  
  return {
    from: () => chainable,
    
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Not configured' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Not configured' } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Not configured' } }),
    },
    
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    
    channel: () => ({
      on: function() { return this; },
      subscribe: function() { return this; },
      unsubscribe: function() { return this; },
    }),
    
    removeChannel: () => {},
    removeAllChannels: () => {},
  };
};

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : createDummyClient();
