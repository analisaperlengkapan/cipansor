"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceReportPeriod = exports.PaymentCategory = exports.ScholarshipStatus = exports.ScholarshipSource = exports.ScholarshipType = exports.JournalReferenceType = exports.CashFlowCategory = exports.AccountType = void 0;
// Enums
var AccountType;
(function (AccountType) {
    AccountType["ASSET"] = "ASSET";
    AccountType["LIABILITY"] = "LIABILITY";
    AccountType["EQUITY"] = "EQUITY";
    AccountType["REVENUE"] = "REVENUE";
    AccountType["EXPENSE"] = "EXPENSE";
})(AccountType || (exports.AccountType = AccountType = {}));
var CashFlowCategory;
(function (CashFlowCategory) {
    CashFlowCategory["OPERATING"] = "OPERATING";
    CashFlowCategory["INVESTING"] = "INVESTING";
    CashFlowCategory["FINANCING"] = "FINANCING";
})(CashFlowCategory || (exports.CashFlowCategory = CashFlowCategory = {}));
var JournalReferenceType;
(function (JournalReferenceType) {
    JournalReferenceType["MANUAL"] = "MANUAL";
    JournalReferenceType["INVOICE"] = "INVOICE";
    JournalReferenceType["PAYMENT"] = "PAYMENT";
    JournalReferenceType["SCHOLARSHIP"] = "SCHOLARSHIP";
    JournalReferenceType["PAYROLL"] = "PAYROLL";
    JournalReferenceType["OTHER"] = "OTHER";
})(JournalReferenceType || (exports.JournalReferenceType = JournalReferenceType = {}));
var ScholarshipType;
(function (ScholarshipType) {
    ScholarshipType["FULL"] = "FULL";
    ScholarshipType["PARTIAL"] = "PARTIAL";
    ScholarshipType["FIXED_AMOUNT"] = "FIXED_AMOUNT";
    ScholarshipType["SPECIFIC"] = "SPECIFIC";
})(ScholarshipType || (exports.ScholarshipType = ScholarshipType = {}));
var ScholarshipSource;
(function (ScholarshipSource) {
    ScholarshipSource["INTERNAL"] = "INTERNAL";
    ScholarshipSource["GOVERNMENT"] = "GOVERNMENT";
    ScholarshipSource["FOUNDATION"] = "FOUNDATION";
    ScholarshipSource["DONOR"] = "DONOR";
    ScholarshipSource["COMPANY"] = "COMPANY";
    ScholarshipSource["OTHER"] = "OTHER";
})(ScholarshipSource || (exports.ScholarshipSource = ScholarshipSource = {}));
var ScholarshipStatus;
(function (ScholarshipStatus) {
    ScholarshipStatus["ACTIVE"] = "ACTIVE";
    ScholarshipStatus["INACTIVE"] = "INACTIVE";
    ScholarshipStatus["EXPIRED"] = "EXPIRED";
    ScholarshipStatus["REVOKED"] = "REVOKED";
})(ScholarshipStatus || (exports.ScholarshipStatus = ScholarshipStatus = {}));
var PaymentCategory;
(function (PaymentCategory) {
    PaymentCategory["SPP"] = "SPP";
    PaymentCategory["REGISTRATION"] = "REGISTRATION";
    PaymentCategory["BUILDING"] = "BUILDING";
    PaymentCategory["UNIFORM"] = "UNIFORM";
    PaymentCategory["BOOK"] = "BOOK";
    PaymentCategory["ACTIVITY"] = "ACTIVITY";
    PaymentCategory["EXAM"] = "EXAM";
    PaymentCategory["OTHER"] = "OTHER";
})(PaymentCategory || (exports.PaymentCategory = PaymentCategory = {}));
var FinanceReportPeriod;
(function (FinanceReportPeriod) {
    FinanceReportPeriod["DAY"] = "day";
    FinanceReportPeriod["MONTH"] = "month";
    FinanceReportPeriod["YEAR"] = "year";
})(FinanceReportPeriod || (exports.FinanceReportPeriod = FinanceReportPeriod = {}));
//# sourceMappingURL=finance.js.map