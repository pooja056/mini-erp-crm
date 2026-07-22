"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.loginSchema = void 0;
const prisma_1 = require("../prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const JWT_SECRET = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026';
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        return res.json({
            message: 'Login successful',
            token,
            user: payload,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
exports.getMe = getMe;
