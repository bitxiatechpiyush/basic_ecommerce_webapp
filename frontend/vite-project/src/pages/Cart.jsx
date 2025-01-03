import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve the cart from localStorage when component mounts
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const handleAddToCart = (product) => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProductIndex = storedCart.findIndex(
      (item) => item.id === product.id
    );

    if (existingProductIndex !== -1) {
      storedCart[existingProductIndex].quantity += product.quantity;
    } else {
      storedCart.push(product);
    }

    localStorage.setItem("cart", JSON.stringify(storedCart));
    setCart(storedCart);
  };

  const handleClearCart = () => {
    localStorage.removeItem("cart");
    setCart([]);
    setErrorMessage("");
  };

  const updateQuantity = (index, action) => {
    const updatedCart = [...cart];
    const product = updatedCart[index];

    if (action === "increment") {
      if (product.quantity < parseInt(product.total_available_quantity, 10)) {
        product.quantity += 1;
        setErrorMessage("");
      } else {
        setErrorMessage(`Only ${product.total_available_quantity} items available`);
        return;
      }
    } else if (action === "decrement") {
      if (product.quantity === 1) {
        updatedCart.splice(index, 1);
      } else {
        product.quantity -= 1;
        setErrorMessage("");
      }
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const calculateTotalPayment = () => {
    return cart.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  const handleConfirmOrder = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage("Please login to place order");
        navigate('/login');
        return;
      }

      const orderData = {
        products: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: calculateTotalPayment()
      };

      const response = await fetch('http://localhost:5000/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : 'invoice.pdf';

        // Convert response to blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Order placed successfully! Invoice downloaded.');
        handleClearCart();
        navigate('/products');
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Failed to place order');
      }
    } catch (error) {
      setErrorMessage('Error placing order. Please try again.');
      console.error('Order error:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const goToProducts = () => {
    navigate("/products");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {cart.length > 0 ? (
        <div className="space-y-4">
          <ul className="divide-y divide-gray-200">
            {cart.map((product, index) => (
              <li key={index} className="py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-gray-600">${product.price}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(index, "decrement")}
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    -
                  </button>
                  <span className="mx-2">{product.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, "increment")}
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t pt-4">
            <h2 className="text-xl font-bold">
              Total: ${calculateTotalPayment().toFixed(2)}
            </h2>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleClearCart}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Clear Cart
            </button>
            <button
              onClick={goToProducts}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Continue Shopping
            </button>
            <button
              onClick={handleConfirmOrder}
              disabled={loading || cart.length === 0}
              className={`px-4 py-2 rounded text-white ${
                loading || cart.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500"
              }`}
            >
              {loading ? "Processing..." : "Confirm Order"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <button
            onClick={goToProducts}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Browse Products
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;