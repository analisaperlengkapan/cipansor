"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationType = exports.HealthStatus = exports.MedicalRecordType = void 0;
// Enums
var MedicalRecordType;
(function (MedicalRecordType) {
    MedicalRecordType["CHECKUP"] = "CHECKUP";
    MedicalRecordType["ILLNESS"] = "ILLNESS";
    MedicalRecordType["INJURY"] = "INJURY";
    MedicalRecordType["FIRST_AID"] = "FIRST_AID";
    MedicalRecordType["REFERRAL"] = "REFERRAL";
    MedicalRecordType["VACCINATION"] = "VACCINATION";
})(MedicalRecordType || (exports.MedicalRecordType = MedicalRecordType = {}));
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "HEALTHY";
    HealthStatus["SICK"] = "SICK";
    HealthStatus["RECOVERING"] = "RECOVERING";
    HealthStatus["HOSPITALIZED"] = "HOSPITALIZED";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
var MedicationType;
(function (MedicationType) {
    MedicationType["TABLET"] = "TABLET";
    MedicationType["SYRUP"] = "SYRUP";
    MedicationType["OINTMENT"] = "OINTMENT";
    MedicationType["CAPSULE"] = "CAPSULE";
    MedicationType["INJECTION"] = "INJECTION";
    MedicationType["DROP"] = "DROP";
    MedicationType["OTHER"] = "OTHER";
})(MedicationType || (exports.MedicationType = MedicationType = {}));
//# sourceMappingURL=health.js.map