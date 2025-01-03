import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products", error);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setSelectedProduct(product);
    setIsPopupOpen(true); // Show the popup to select quantity
  };

  const handleQuantityChange = (e) => {
    setQuantity(e.target.value);
  };

  const handleAddToCartWithQuantity = () => {
    const selectedQuantity = parseInt(quantity, 10); // Ensure quantity is an integer

    if (selectedQuantity > parseInt(selectedProduct.quantity, 10)) {
      setErrorMessage("Item is out of stock!"); // Show error if quantity exceeds stock
    } else {
      // Retrieve the current cart from localStorage
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existingProductIndex = cart.findIndex(
        (item) => item.id === selectedProduct.id
      );

      if (existingProductIndex !== -1) {
        // Update the quantity if the product already exists in the cart
        cart[existingProductIndex].quantity += selectedQuantity;
        cart[existingProductIndex].total_available_quantity = String(
          parseInt(cart[existingProductIndex].total_available_quantity, 10) -
            selectedQuantity
        );
      } else {
        // Add a new product entry to the cart
        const updatedProduct = {
          ...selectedProduct,
          quantity: selectedQuantity,
          total_available_quantity: String(
            parseInt(selectedProduct.quantity, 10) - selectedQuantity
          ), // Add total_available_quantity to the cart item
        };
        cart.push(updatedProduct);
      }

      // Save the updated cart back to localStorage
      localStorage.setItem("cart", JSON.stringify(cart));

      // Update total_available_quantity in products
      const updatedProducts = products.map((product) =>
        product.id === selectedProduct.id
          ? {
              ...product,
              quantity: String(
                parseInt(product.quantity, 10) - selectedQuantity
              ),
            }
          : product
      );

      setProducts(updatedProducts); // Update the state with the modified products array

      alert(`${selectedProduct.name} has been added to your cart!`);
      setIsPopupOpen(false); // Close the popup
      setErrorMessage(""); // Clear any error messages
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false); // Close the popup without adding to cart
  };

  const goToCart = () => {
    navigate("/cart");
  };

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((product, index) => (
          <li key={index}>
            {product.name} - ${product.price} - {product.category} -{" "}
            {product.quantity} available
            <button onClick={() => addToCart(product)}>Add to cart</button>
          </li>
        ))}
      </ul>

      {/* Go to Cart Button */}
      <button onClick={goToCart}>Go to Cart</button>

      {/* Quantity Input Popup */}
      {isPopupOpen && (
        <div style={popupStyles}>
          <div style={popupContentStyles}>
            <h2>Select Quantity</h2>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              max={selectedProduct.quantity}
            />
            <div style={errorMessageStyles}>{errorMessage}</div>
            <button onClick={handleAddToCartWithQuantity}>Add to Cart</button>
            <button onClick={closePopup}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline styles for popup
const popupStyles = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const popupContentStyles = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  textAlign: "center",
  width: "300px",
};

const errorMessageStyles = {
  color: "red",
  margin: "10px 0",
};

export default Products;
