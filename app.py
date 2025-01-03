from flask import Flask, request, jsonify, session, send_file
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from abc import ABC, abstractmethod
from bson.objectid import ObjectId
import pdfkit 
import os
from datetime import datetime
from flask_cors import CORS
import tempfile

# Flask setup
app = Flask(__name__)
CORS(app)

app.config['MONGO_URI'] = 'mongodb://localhost:27017/ecommerce'
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)



# Abstract base classes
class Product(ABC):
    @abstractmethod
    def get_product_details(self):
        pass

class User(ABC):
    @abstractmethod
    def get_user_details(self):
        pass

class Order(ABC):
    @abstractmethod
    def process_order(self):
        pass

# Product subclasses
class PhysicalProduct(Product):
    def __init__(self, name, category, price, quantity):
        self.name = name
        self.category = category
        self.price = price
        self.quantity = quantity

    def get_product_details(self):
        return {
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "quantity": self.quantity
        }

class DigitalProduct(Product):
    def __init__(self, name, category, price):
        self.name = name
        self.category = category
        self.price = price

    def get_product_details(self):
        return {
            "name": self.name,
            "category": self.category,
            "price": self.price
        }

# User subclasses
class Customer(User):
    def __init__(self, username, email, user_type="Regular"):
        self.username = username
        self.email = email
        self.user_type = user_type

    def get_user_details(self):
        return {
            "username": self.username,
            "email": self.email,
            "user_type": self.user_type
        }

class Administrator(User):
    def __init__(self, username, email, role):
        self.username = username
        self.email = email
        self.role = role

    def get_user_details(self):
        return {
            "username": self.username,
            "email": self.email,
            "role": self.role
        }

# Order subclasses
class Purchase(Order):
    def __init__(self, user, products):
        self.user = user
        self.products = products
        self.timestamp = datetime.now()

    def process_order(self):
        return {
            "user": self.user,
            "products": self.products,
            "timestamp": self.timestamp
        }



def generate_invoice_html(order_data, user_data):
    """Generate HTML content for the invoice"""
    html_content = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .invoice-header {{ text-align: center; padding: 20px; }}
                .invoice-details {{ margin: 20px; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                .total {{ font-weight: bold; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <h1>Invoice</h1>
                <p>Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            <div class="invoice-details">
                <h3>Customer Details:</h3>
                <p>Name: {user_data['username']}</p>
                <p>Email: {user_data['email']}</p>
                
                <h3>Order Details:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    for product in order_data['products']:
        subtotal = float(product['price']) * int(product['quantity'])
        html_content += f"""
                        <tr>
                            <td>{product['name']}</td>
                            <td>{product['quantity']}</td>
                            <td>${product['price']}</td>
                            <td>${subtotal:.2f}</td>
                        </tr>
        """
    
    html_content += f"""
                    </tbody>
                </table>
                <div class="total">
                    <p>Total Amount: ${order_data['total_amount']:.2f}</p>
                </div>
            </div>
        </body>
    </html>
    """
    return html_content
    

# Routes and API endpoints
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    email = data['email']
    password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user_type = data['userType']

    user = {
        "username": username,
        "email": email,
        "password": password,
        "user_type": user_type
    }

    mongo.db.users.insert_one(user)
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    password = data['password']
    user = mongo.db.users.find_one({"email": email})

    if user and bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(identity=str(user['_id']))
        return jsonify({
            "token": access_token,
            "userType": user['user_type']
        }), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/products', methods=['GET'])
def get_all_products():
    products = mongo.db.products.find()
    return jsonify([{
        "name": product['name'],
        "category": product['category'],
        "price": product['price'],
        "quantity": product['quantity']
    } for product in products]), 200

@app.route('/create_order', methods=['POST'])
@jwt_required()
def create_order():
    try:
        current_user = get_jwt_identity()
        data = request.json
        user = mongo.db.users.find_one({"_id": ObjectId(current_user)})
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        order = {
            "user_id": ObjectId(current_user),
            "products": data['products'],
            "total_amount": data['totalAmount'],
            "created_at": datetime.utcnow()
        }
        
        # Insert order into database
        result = mongo.db.orders.insert_one(order)
        
        # Generate invoice HTML
        invoice_html = generate_invoice_html(order, user)
        
        # Create temporary file for the PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            pdf_path = temp_file.name
            
        # Convert HTML to PDF
        pdfkit.from_string(invoice_html, pdf_path)
        
        # Send PDF file
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'invoice_{result.inserted_id}.pdf'
        )
        
    except Exception as e:
        return jsonify({"message": f"Error creating order: {str(e)}"}), 500
        
    finally:
        # Clean up temporary PDF file
        if 'pdf_path' in locals():
            try:
                os.unlink(pdf_path)
            except:
                pass



@app.route('/add_product', methods=['POST'])
@jwt_required()
def add_product():
    current_user = get_jwt_identity()
    # Convert string ID to ObjectId
    user = mongo.db.users.find_one({"_id": ObjectId(current_user)})
    
    # Check if user exists
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    if user['user_type'] != 'Administrator':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'category', 'price', 'quantity']
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields"}), 400
        
    product = {
        "name": data['name'],
        "category": data['category'],
        "price": float(data['price']),  # Ensure price is stored as float
        "quantity": int(data['quantity']),  # Ensure quantity is stored as integer
        "created_by": ObjectId(current_user),  # Track who created the product
        "created_at": datetime.utcnow()  # Track when the product was created
    }

    mongo.db.products.insert_one(product)
    return jsonify({"message": "Product added successfully"}), 201
    


# Run the application
if __name__ == '__main__':
    app.run(debug=True)
