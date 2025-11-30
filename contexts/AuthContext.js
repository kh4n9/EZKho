'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'REGISTER_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'INIT_COMPLETE':
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Helper to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      if (isTokenExpired(token)) {
        console.log('Token expired on load, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'INIT_COMPLETE' });
      } else {
        try {
          const parsedUser = JSON.parse(user);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: parsedUser, token },
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'INIT_COMPLETE' });
        }
      }
    } else {
      dispatch({ type: 'INIT_COMPLETE' });
    }
  }, []);

  // Check token expiration periodically
  useEffect(() => {
    const checkExpiration = () => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        console.log('Token expired periodically, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
      }
    };

    // Check every minute
    const intervalId = setInterval(checkExpiration, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    // Skip saving if loading or initial state
    if (state.loading) return;

    console.log('Auth state changed:', {
      hasToken: !!state.token,
      hasUser: !!state.user,
      isAuthenticated: state.isAuthenticated
    });

    if (state.token && state.user) {
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    } else if (!state.isAuthenticated) {
      // Only remove if explicitly not authenticated (logout or expired)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [state.token, state.user, state.isAuthenticated, state.loading]);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      console.log('Login successful, saving token:', data.data.token);
      console.log('User data:', data.data.user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.data.user,
          token: data.data.token,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: {
          user: data.data.user,
          token: data.data.token,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
