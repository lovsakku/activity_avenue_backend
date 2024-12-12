// Import dependencies modules:
const express = require('express');
const path = require('path');
const { MongoClient, ObjectID } = require('mongodb'); // Use destructuring to import MongoClient and ObjectID

// Create an Express.js instance:
const app = express();

// Logger Middleware
const logger = (req, res, next) => {
    // Log the HTTP method, request URL, and timestamp
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next(); // Pass control to the next middleware or route handler
};

// Apply the logger middleware globally (before routes)
app.use(logger);

// Config Express.js
app.use(express.json());
app.set('port', 3001);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
    );
    next();
});

app.use(express.static(path.join('C:\\Users\\sakku\\OneDrive\\Desktop\\Activity Avenue')));

app.use('/images', express.static(path.join('C:\\Users\\sakku\\OneDrive\\Desktop\\Activity Avenue Backend\\images')));

// MongoDB Compass connection string
const uri = 'mongodb+srv://sakina:fullstack@cluster0.4m3fb.mongodb.net/';
const options = { useNewUrlParser: true, useUnifiedTopology: true };

let db;

// Connect to MongoDB Compass with error handling
MongoClient.connect(uri, options)
    .then(client => {
        console.log('Successfully connected to MongoDB Compass');
        db = client.db('Webstore'); // The database name must match your MongoDB Compass setup

        // Start the server after successful DB connection
        app.listen(app.get('port'), () => {
            console.log(`Express.js server running at http://localhost:${app.get('port')}`);
        });
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1); // Exit the application if the connection fails
    });

// Route to fetch all products from the database
app.get('/products', (req, res) => {
    if (!db) {
        return res.status(500).send({ error: 'Database connection not established' });
    }

    const collection = db.collection('products');
    collection.find({}).toArray((err, items) => {
        if (err) {
            console.error('Error fetching products:', err.message);
            return res.status(500).send({ error: 'Error fetching products' });
        }
        console.log('Fetched products:', items);  // Add this log
        res.send(items);
    });
});

// POST endpoint to add a new order
app.post('/orders', (req, res) => {
    const orderData = req.body;  // Order data received from the frontend

    // Validate order data (basic validation)
    if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
        return res.status(400).send({ error: 'Invalid order data' });
    }

    // Insert the order into the 'orders' collection
    const collection = db.collection('orders');
    collection.insertOne(orderData, (err, result) => {
        if (err) {
            console.error('Error saving order:', err.message);
            return res.status(500).send({ error: 'Error saving order' });
        }

        res.status(201).send({
            message: 'Order placed successfully',
            orderId: result.insertedId,
        });
    });
});

// PUT endpoint to update product availability
app.put('/products/:id', (req, res) => {
    const productId = req.params.id;
    const updateData = req.body;

    // Validate if the updateData contains availableSpots and it's a number
    if (!updateData || typeof updateData.availableSpots !== 'number') {
        return res.status(400).send({ error: 'Invalid update data' });
    }

    const collection = db.collection('products');
    collection.updateOne(
        { _id: new ObjectID(productId) },
        { $set: { availableSpots: updateData.availableSpots } }, // Update only the availableSpots field
        (err, result) => {
            if (err) {
                console.error('Error updating product:', err.message);
                return res.status(500).send({ error: 'Error updating product' });
            }

            if (result.matchedCount === 0) {
                return res.status(404).send({ error: 'Product not found' });
            }

            res.send({ message: 'Product availability updated successfully' });
        }
    );
});

