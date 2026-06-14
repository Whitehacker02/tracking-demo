const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// DATABASE FILE
// ========================
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// ========================
// MIDDLEWARE
// ========================
app.use(express.json());
app.use(express.static(__dirname));

// ========================
// HELPERS
// ========================
function readOrders() {
    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify({}, null, 2));
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
}

function writeOrders(orders) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ========================
// ROUTES
// ========================

// 🛒 CREATE ORDER (CUSTOMER OR TEST)
app.post('/api/create-order', (req, res) => {
    const { product } = req.body;

    if (!product) {
        return res.status(400).json({ error: 'Product is required' });
    }

    const code = uuidv4(); // tracking code

    const orders = readOrders();

    orders[code] = {
        product,
        status: "Processing",
        trackingNumber: code,
        lastUpdate: new Date().toISOString()
    };

    writeOrders(orders);

    res.json({
        message: "Order created successfully",
        trackingCode: code
    });
});


// 📦 TRACK ORDER (PUBLIC - SAFE VIEW)
app.get('/api/order', (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ error: 'Missing tracking code' });
    }

    const orders = readOrders();
    const order = orders[code];

    if (!order) {
        return res.status(404).json({ error: 'No order found with that code' });
    }

    // SAFE OUTPUT (NO SENSITIVE DATA)
    res.json({
        product: order.product,
        status: order.status,
        lastUpdate: order.lastUpdate
    });
});


// 🛠️ ADMIN UPDATE ORDER (MANUAL CONTROL)
app.post('/api/admin/update-order', (req, res) => {
    const { code, status, product, trackingNumber, lastUpdate } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Order code required' });
    }

    const orders = readOrders();

    if (!orders[code]) {
        return res.status(404).json({ error: 'Order not found' });
    }

    // Update only provided fields
    if (status) orders[code].status = status;
    if (product) orders[code].product = product;
    if (trackingNumber) orders[code].trackingNumber = trackingNumber;
    if (lastUpdate) {
        orders[code].lastUpdate = lastUpdate;
    } else {
        orders[code].lastUpdate = new Date().toISOString();
    }

    writeOrders(orders);

    res.json({
        success: true,
        message: "Order updated successfully",
        code
    });
});


// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


