"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeType = exports.ExamStatus = exports.ExamType = void 0;
var ExamType;
(function (ExamType) {
    ExamType["DAILY_TEST"] = "DAILY_TEST";
    ExamType["QUIZ"] = "QUIZ";
    ExamType["MIDTERM"] = "MIDTERM";
    ExamType["FINAL"] = "FINAL";
    ExamType["PRACTICAL"] = "PRACTICAL";
    ExamType["PROJECT"] = "PROJECT";
    ExamType["TAHFIDZ_TEST"] = "TAHFIDZ_TEST";
})(ExamType || (exports.ExamType = ExamType = {}));
var ExamStatus;
(function (ExamStatus) {
    ExamStatus["DRAFT"] = "DRAFT";
    ExamStatus["SCHEDULED"] = "SCHEDULED";
    ExamStatus["ONGOING"] = "ONGOING";
    ExamStatus["COMPLETED"] = "COMPLETED";
    ExamStatus["GRADED"] = "GRADED";
})(ExamStatus || (exports.ExamStatus = ExamStatus = {}));
var GradeType;
(function (GradeType) {
    GradeType["EXAM"] = "EXAM";
    GradeType["ASSIGNMENT"] = "ASSIGNMENT";
    GradeType["PARTICIPATION"] = "PARTICIPATION";
    GradeType["ATTENDANCE"] = "ATTENDANCE";
    GradeType["PROJECT"] = "PROJECT";
    GradeType["TAHFIDZ"] = "TAHFIDZ";
})(GradeType || (exports.GradeType = GradeType = {}));
//# sourceMappingURL=assessment.js.map