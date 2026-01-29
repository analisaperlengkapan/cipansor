"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetCondition = exports.AssetDisposalReason = exports.AssetMaintenanceStatus = exports.AssetStatus = void 0;
var AssetStatus;
(function (AssetStatus) {
    AssetStatus["ACTIVE"] = "ACTIVE";
    AssetStatus["MAINTENANCE"] = "MAINTENANCE";
    AssetStatus["DAMAGED"] = "DAMAGED";
    AssetStatus["DISPOSED"] = "DISPOSED";
})(AssetStatus || (exports.AssetStatus = AssetStatus = {}));
var AssetMaintenanceStatus;
(function (AssetMaintenanceStatus) {
    AssetMaintenanceStatus["PENDING"] = "PENDING";
    AssetMaintenanceStatus["APPROVED"] = "APPROVED";
    AssetMaintenanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AssetMaintenanceStatus["COMPLETED"] = "COMPLETED";
    AssetMaintenanceStatus["REJECTED"] = "REJECTED";
    AssetMaintenanceStatus["CANCELLED"] = "CANCELLED";
})(AssetMaintenanceStatus || (exports.AssetMaintenanceStatus = AssetMaintenanceStatus = {}));
var AssetDisposalReason;
(function (AssetDisposalReason) {
    AssetDisposalReason["SOLD"] = "SOLD";
    AssetDisposalReason["LOST"] = "LOST";
    AssetDisposalReason["DAMAGED"] = "DAMAGED";
    AssetDisposalReason["DONATED"] = "DONATED";
    AssetDisposalReason["OBSOLETE"] = "OBSOLETE";
    AssetDisposalReason["OTHER"] = "OTHER";
})(AssetDisposalReason || (exports.AssetDisposalReason = AssetDisposalReason = {}));
var AssetCondition;
(function (AssetCondition) {
    AssetCondition["EXCELLENT"] = "EXCELLENT";
    AssetCondition["GOOD"] = "GOOD";
    AssetCondition["FAIR"] = "FAIR";
    AssetCondition["POOR"] = "POOR";
    AssetCondition["BROKEN"] = "BROKEN";
})(AssetCondition || (exports.AssetCondition = AssetCondition = {}));
//# sourceMappingURL=inventory.js.map