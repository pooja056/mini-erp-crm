"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const issues = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                return res.status(400).json({ error: 'Validation failed', details: issues });
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
