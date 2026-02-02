"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintStatus = exports.ComplaintCategory = exports.EnrollmentStatus = exports.BorrowingStatus = exports.BookStatus = exports.MemorizationQuality = exports.AttendanceStatus = exports.DayOfWeek = exports.Semester = exports.Gender = exports.UnitType = exports.UserRole = void 0;
// User Roles
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["UNIT_ADMIN"] = "UNIT_ADMIN";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["STUDENT"] = "STUDENT";
    UserRole["PARENT"] = "PARENT";
    UserRole["STAFF"] = "STAFF";
})(UserRole || (exports.UserRole = UserRole = {}));
// Unit Types
var UnitType;
(function (UnitType) {
    UnitType["PESANTREN"] = "PESANTREN";
    UnitType["PAUD"] = "PAUD";
    UnitType["SD_IT"] = "SD_IT";
    UnitType["SMP_IT"] = "SMP_IT";
    UnitType["SMA_QURAN"] = "SMA_QURAN";
    UnitType["TK_QURAN"] = "TK_QURAN";
    UnitType["OTHER"] = "OTHER";
})(UnitType || (exports.UnitType = UnitType = {}));
// Gender
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
})(Gender || (exports.Gender = Gender = {}));
// Semester
var Semester;
(function (Semester) {
    Semester["ODD"] = "ODD";
    Semester["EVEN"] = "EVEN";
})(Semester || (exports.Semester = Semester = {}));
// Day of Week
var DayOfWeek;
(function (DayOfWeek) {
    DayOfWeek["MONDAY"] = "MONDAY";
    DayOfWeek["TUESDAY"] = "TUESDAY";
    DayOfWeek["WEDNESDAY"] = "WEDNESDAY";
    DayOfWeek["THURSDAY"] = "THURSDAY";
    DayOfWeek["FRIDAY"] = "FRIDAY";
    DayOfWeek["SATURDAY"] = "SATURDAY";
    DayOfWeek["SUNDAY"] = "SUNDAY";
})(DayOfWeek || (exports.DayOfWeek = DayOfWeek = {}));
// Attendance Status
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "PRESENT";
    AttendanceStatus["ABSENT"] = "ABSENT";
    AttendanceStatus["LATE"] = "LATE";
    AttendanceStatus["SICK"] = "SICK";
    AttendanceStatus["EXCUSED"] = "EXCUSED";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
// Memorization Quality
var MemorizationQuality;
(function (MemorizationQuality) {
    MemorizationQuality["LANCAR"] = "LANCAR";
    MemorizationQuality["KURANG_LANCAR"] = "KURANG_LANCAR";
    MemorizationQuality["ULANG"] = "ULANG";
})(MemorizationQuality || (exports.MemorizationQuality = MemorizationQuality = {}));
// Book Status
var BookStatus;
(function (BookStatus) {
    BookStatus["AVAILABLE"] = "AVAILABLE";
    BookStatus["BORROWED"] = "BORROWED";
    BookStatus["RESERVED"] = "RESERVED";
    BookStatus["MAINTENANCE"] = "MAINTENANCE";
    BookStatus["LOST"] = "LOST";
})(BookStatus || (exports.BookStatus = BookStatus = {}));
// Borrowing Status
var BorrowingStatus;
(function (BorrowingStatus) {
    BorrowingStatus["ACTIVE"] = "ACTIVE";
    BorrowingStatus["RETURNED"] = "RETURNED";
    BorrowingStatus["OVERDUE"] = "OVERDUE";
    BorrowingStatus["LOST"] = "LOST";
})(BorrowingStatus || (exports.BorrowingStatus = BorrowingStatus = {}));
// Enrollment Status
var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["ACTIVE"] = "active";
    EnrollmentStatus["COMPLETED"] = "completed";
    EnrollmentStatus["TRANSFERRED"] = "transferred";
    EnrollmentStatus["DROPPED"] = "dropped";
})(EnrollmentStatus || (exports.EnrollmentStatus = EnrollmentStatus = {}));
// Complaint Category
var ComplaintCategory;
(function (ComplaintCategory) {
    ComplaintCategory["ACADEMIC"] = "ACADEMIC";
    ComplaintCategory["FACILITY"] = "FACILITY";
    ComplaintCategory["SERVICE"] = "SERVICE";
    ComplaintCategory["BULLYING"] = "BULLYING";
    ComplaintCategory["FINANCE"] = "FINANCE";
    ComplaintCategory["OTHER"] = "OTHER";
})(ComplaintCategory || (exports.ComplaintCategory = ComplaintCategory = {}));
// Complaint Status
var ComplaintStatus;
(function (ComplaintStatus) {
    ComplaintStatus["PENDING"] = "PENDING";
    ComplaintStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ComplaintStatus["RESOLVED"] = "RESOLVED";
    ComplaintStatus["REJECTED"] = "REJECTED";
})(ComplaintStatus || (exports.ComplaintStatus = ComplaintStatus = {}));
//# sourceMappingURL=enums.js.map