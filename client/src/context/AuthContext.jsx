import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get('/login'); // We mapped getLogin to /login
                if (res.data.isLoggedIn && res.data.user) {
                    setUser(res.data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (userId, password) => {
        const res = await api.post('/login', { userId, password });
        if (res.data.success) {
            setUser(res.data.user);
            return res.data;
        }
        return res.data;
    };

    const logout = async () => {
        await api.get('/logout');
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
