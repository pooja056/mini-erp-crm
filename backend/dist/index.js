"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const stock_routes_1 = __importDefault(require("./routes/stock.routes"));
const challan_routes_1 = __importDefault(require("./routes/challan.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Mount Module Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/customers', customer_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/stock-logs', stock_routes_1.default);
app.use('/api/challans', challan_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Mini ERP Backend Server running on http://localhost:${PORT}`);
});
