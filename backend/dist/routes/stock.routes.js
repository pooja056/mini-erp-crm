"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_controller_1 = require("../controllers/stock.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT);
router.get('/', (0, auth_1.requireRoles)('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), stock_controller_1.getStockLogs);
exports.default = router;
