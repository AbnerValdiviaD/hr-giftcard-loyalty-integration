"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusResponseSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.StatusResponseSchema = typebox_1.Type.Object({
    status: typebox_1.Type.String(),
    timestamp: typebox_1.Type.String(),
    version: typebox_1.Type.String(),
    metadata: typebox_1.Type.Optional(typebox_1.Type.Any()),
    checks: typebox_1.Type.Array(typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        status: typebox_1.Type.String(),
        details: typebox_1.Type.Optional(typebox_1.Type.Any()),
        message: typebox_1.Type.Optional(typebox_1.Type.String()),
    })),
});
