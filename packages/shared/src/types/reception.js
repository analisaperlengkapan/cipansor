"use strict";
// Reception / Front Office Module Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageStatus = exports.VisitStatus = void 0;
var VisitStatus;
(function (VisitStatus) {
    VisitStatus["PENDING"] = "PENDING";
    VisitStatus["APPROVED"] = "APPROVED";
    VisitStatus["REJECTED"] = "REJECTED";
    VisitStatus["COMPLETED"] = "COMPLETED";
    VisitStatus["CANCELLED"] = "CANCELLED";
})(VisitStatus || (exports.VisitStatus = VisitStatus = {}));
var PackageStatus;
(function (PackageStatus) {
    PackageStatus["RECEIVED"] = "RECEIVED";
    PackageStatus["NOTIFIED"] = "NOTIFIED";
    PackageStatus["PICKED_UP"] = "PICKED_UP";
    PackageStatus["RETURNED"] = "RETURNED";
})(PackageStatus || (exports.PackageStatus = PackageStatus = {}));
//# sourceMappingURL=reception.js.map