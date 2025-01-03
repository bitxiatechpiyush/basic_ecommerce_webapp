import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Invoice = () => {
  const { orderId } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/invoice/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoice(response.data);
      } catch (error) {
        console.error("Error fetching invoice", error);
      }
    };

    fetchInvoice();
  }, [orderId]);

  return (
    <div>
      <h1>Invoice</h1>
      {invoice && (
        <div>
          <p>Order ID: {invoice.order_id}</p>
          <p>User: {invoice.user.username}</p>
          <p>Email: {invoice.user.email}</p>
          <p>Total: ${invoice.total}</p>
          <p>Date: {new Date(invoice.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default Invoice;
