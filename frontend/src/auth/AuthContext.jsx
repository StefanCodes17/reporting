import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

// Create AuthContext
export const AuthContext = createContext(null);

// Create AuthProvider component
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null)

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
        }
    }, []);

    const setAuthToken = (newToken) => {
        setToken(newToken);
        setIsAuthenticated(true);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post('http://localhost:8000/token', { username, password });
            setAuthToken(response.data.access_token);
            const decoded = jwtDecode(response.data.access_token)
            setUser({"username":decoded["sub"]})
        } catch (error) {
            throw error;
        }
    };

    const signup = async (username, password, email) => {
        try {
            const response = await axios.post('http://localhost:8000/register/', { username, password });
            if (response.data.message === "User registered successfully") {
              const loginResponse = await axios.post('http://localhost:8000/token', { username, password });
              setAuthToken(loginResponse.data.access_token)
              setUser({"username": username})
            }
          } catch (err) {
            throw err;
          }
        try {
            const response = await axios.post('http://localhost:8000/register', { username, password, email });
            setAuthToken(response.data.access_token);
            login(username, password)
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        delete axios.defaults.headers.common['Authorization'];
    };

    const getToken = () => token;

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, signup, logout, getToken, user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
