import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddProduct from "./pages/AddProduct";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Invoice from "./pages/Invoice";

const App = () => {
  // Move these inside the ProtectedRoute component to ensure fresh values on each render
  const isAuthenticated = () => !!localStorage.getItem("token");
  
  // Protected Route wrapper component
  const ProtectedRoute = ({ children, allowedUserType }) => {
    const userType = localStorage.getItem("userType"); // Move this inside to get fresh value
    
    if (!isAuthenticated()) {
      return <Navigate to="/" />;
    }

    // For Administrator routes, redirect non-admins to products
    if (allowedUserType === "Administrator" && userType !== "Administrator") {
      return <Navigate to="/products" />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={isAuthenticated() ? 
            <Navigate to={localStorage.getItem("userType") === "Administrator" ? "/admin" : "/products"} /> 
            : <Login />
          } 
        />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedUserType="Administrator">
              <AddProduct />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes for all authenticated users */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoice/:orderId"
          element={
            <ProtectedRoute>
              <Invoice />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;