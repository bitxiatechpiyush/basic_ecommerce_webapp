import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("Customer");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/register", { username, email, password, userType });
      alert("Signup successful! Please login.");
      navigate("/");
    } catch (error) {
      alert("Signup failed");
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h1>Signup</h1>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <select value={userType} onChange={(e) => setUserType(e.target.value)}>
        <option value="Customer">Customer</option>
        <option value="Administrator">Administrator</option>
      </select>
      <button type="submit">Signup</button>
    </form>
  );
};

export default Signup;
