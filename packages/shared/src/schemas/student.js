"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSchema = exports.createStudentSchema = exports.listStudentsQuerySchema = void 0;
const zod_1 = require("zod");
// ==================== QUERY PARAMS ====================
exports.listStudentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    search: zod_1.z.string().optional(),
    unitId: zod_1.z.string().uuid().optional(),
    classId: zod_1.z.string().uuid().optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE"]).optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "DROPPED_OUT"]).optional(),
});
// ==================== CREATE STUDENT ====================
exports.createStudentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Nama minimal 2 karakter"),
    email: zod_1.z
        .string()
        .email("Format email tidak valid")
        .optional()
        .or(zod_1.z.literal("")),
    password: zod_1.z.string().min(8, "Password minimal 8 karakter").optional(), // Optional because it might be auto-generated or set later
    unitId: zod_1.z.string().uuid("Unit wajib dipilih"),
    nis: zod_1.z.string().min(4, "NIS minimal 4 karakter"),
    nisn: zod_1.z.string().optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE"]),
    birthPlace: zod_1.z.string().min(2, "Tempat lahir wajib diisi"),
    birthDate: zod_1.z.coerce.date(),
    address: zod_1.z.string().min(5, "Alamat minimal 5 karakter"),
    phone: zod_1.z.string().optional(),
    parentName: zod_1.z.string().min(2, "Nama orang tua wajib diisi"),
    parentPhone: zod_1.z.string().min(10, "Nomor HP minimal 10 digit"),
    parentEmail: zod_1.z
        .string()
        .email("Format email parent tidak valid")
        .optional()
        .or(zod_1.z.literal("")),
    classId: zod_1.z.string().uuid().optional(),
    enrollmentDate: zod_1.z.coerce.date().optional(),
});
// ==================== UPDATE STUDENT ====================
exports.updateStudentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    nis: zod_1.z.string().min(4).optional(),
    nisn: zod_1.z.string().optional().nullable(),
    gender: zod_1.z.enum(["MALE", "FEMALE"]).optional(),
    birthPlace: zod_1.z.string().min(2).optional(),
    birthDate: zod_1.z.coerce.date().optional(),
    address: zod_1.z.string().min(5).optional(),
    parentName: zod_1.z.string().min(2).optional(),
    parentPhone: zod_1.z.string().min(10).optional(),
    parentEmail: zod_1.z.string().email().optional().nullable(),
    photoUrl: zod_1.z.string().url().optional().nullable(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "DROPPED_OUT"]).optional(),
    unitId: zod_1.z.string().uuid().optional(),
    classId: zod_1.z.string().uuid().optional().nullable(),
});
//# sourceMappingURL=student.js.map