"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LetterStatus = exports.LetterNature = exports.LetterUrgency = exports.LetterDirection = void 0;
// Letter Enums
var LetterDirection;
(function (LetterDirection) {
    LetterDirection["INCOMING"] = "INCOMING";
    LetterDirection["OUTGOING"] = "OUTGOING";
})(LetterDirection || (exports.LetterDirection = LetterDirection = {}));
var LetterUrgency;
(function (LetterUrgency) {
    LetterUrgency["NORMAL"] = "NORMAL";
    LetterUrgency["IMMEDIATE"] = "IMMEDIATE";
    LetterUrgency["URGENT"] = "URGENT";
})(LetterUrgency || (exports.LetterUrgency = LetterUrgency = {}));
var LetterNature;
(function (LetterNature) {
    LetterNature["PUBLIC"] = "PUBLIC";
    LetterNature["CONFIDENTIAL"] = "CONFIDENTIAL";
    LetterNature["STRICTLY_CONFIDENTIAL"] = "STRICTLY_CONFIDENTIAL";
})(LetterNature || (exports.LetterNature = LetterNature = {}));
var LetterStatus;
(function (LetterStatus) {
    LetterStatus["DRAFT"] = "DRAFT";
    LetterStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    LetterStatus["REVISION_NEEDED"] = "REVISION_NEEDED";
    LetterStatus["READY_TO_SIGN"] = "READY_TO_SIGN";
    LetterStatus["SIGNED"] = "SIGNED";
    LetterStatus["SENT"] = "SENT";
    LetterStatus["ARCHIVED"] = "ARCHIVED";
    LetterStatus["DISPOSED"] = "DISPOSED";
})(LetterStatus || (exports.LetterStatus = LetterStatus = {}));
//# sourceMappingURL=correspondence.js.map