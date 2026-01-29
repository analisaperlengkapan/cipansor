"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralType = exports.CounselingPriority = exports.CounselingStatus = exports.CounselingCategory = void 0;
// Enums
var CounselingCategory;
(function (CounselingCategory) {
    CounselingCategory["ACADEMIC"] = "ACADEMIC";
    CounselingCategory["CAREER"] = "CAREER";
    CounselingCategory["PERSONAL"] = "PERSONAL";
    CounselingCategory["SOCIAL"] = "SOCIAL";
    CounselingCategory["FAMILY"] = "FAMILY";
    CounselingCategory["SPIRITUAL"] = "SPIRITUAL";
    CounselingCategory["OTHER"] = "OTHER";
})(CounselingCategory || (exports.CounselingCategory = CounselingCategory = {}));
var CounselingStatus;
(function (CounselingStatus) {
    CounselingStatus["SCHEDULED"] = "SCHEDULED";
    CounselingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    CounselingStatus["COMPLETED"] = "COMPLETED";
    CounselingStatus["CANCELLED"] = "CANCELLED";
    CounselingStatus["NO_SHOW"] = "NO_SHOW";
})(CounselingStatus || (exports.CounselingStatus = CounselingStatus = {}));
var CounselingPriority;
(function (CounselingPriority) {
    CounselingPriority["LOW"] = "LOW";
    CounselingPriority["MEDIUM"] = "MEDIUM";
    CounselingPriority["HIGH"] = "HIGH";
    CounselingPriority["URGENT"] = "URGENT";
})(CounselingPriority || (exports.CounselingPriority = CounselingPriority = {}));
var ReferralType;
(function (ReferralType) {
    ReferralType["INTERNAL"] = "INTERNAL";
    ReferralType["EXTERNAL"] = "EXTERNAL";
    ReferralType["PARENT"] = "PARENT";
    ReferralType["MEDICAL"] = "MEDICAL";
})(ReferralType || (exports.ReferralType = ReferralType = {}));
//# sourceMappingURL=counseling.js.map