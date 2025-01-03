import React, { useState } from "react";
import axios from "axios";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/add_product",
        { name, category, price, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Product added successfully");
    } catch (error) {
      alert("Failed to add product");
    }
  };

  return (
    <form onSubmit={handleAddProduct}>
      <h1>Add Product</h1>
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
      <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      <button type="submit">Add Product</button>
    </form>
  );
};

export default AddProduct;
