import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ReportBuilder from './components/ReportBuilder';
import Login from './components/Login';
import Signup from './components/Signup';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { useState } from 'react';
import Navbar from './components/ui/Navbar';

const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  return auth?.isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="App">
        {/* Navbar */}
       <Navbar/>
        <Routes> 
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ReportBuilder />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

const App = () =>{
  return(
    <AuthProvider>
      <AppContent/>
    </AuthProvider>
  )
}

export default App;