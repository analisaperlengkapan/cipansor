"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventScope = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["ACADEMIC"] = "ACADEMIC";
    EventType["RELIGIOUS"] = "RELIGIOUS";
    EventType["EXTRACURRICULAR"] = "EXTRACURRICULAR";
    EventType["MEETING"] = "MEETING";
    EventType["CEREMONY"] = "CEREMONY";
    EventType["HOLIDAY"] = "HOLIDAY";
    EventType["OTHER"] = "OTHER";
})(EventType || (exports.EventType = EventType = {}));
var EventScope;
(function (EventScope) {
    EventScope["ALL_UNITS"] = "ALL_UNITS";
    EventScope["SPECIFIC_UNIT"] = "SPECIFIC_UNIT";
    EventScope["SPECIFIC_CLASS"] = "SPECIFIC_CLASS";
})(EventScope || (exports.EventScope = EventScope = {}));
//# sourceMappingURL=calendar.js.map