"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationHierarchy = exports.getOrgStructureSummary = exports.createLocation = exports.createTeam = exports.createDesignation = exports.createDepartment = exports.getFullHRAnalytics = exports.getPerformanceDashboard = exports.getEmployeePerformanceHistory = exports.createPerformanceReview = exports.unassignSalaryComponentFromEmployee = exports.assignSalaryComponentToEmployee = exports.deleteSalaryComponent = exports.updateSalaryComponent = exports.createSalaryComponent = exports.listSalaryComponents = exports.getPayrollAuditTrail = exports.reconcilePayrollPayment = exports.updatePayrollPayment = exports.updatePayrollAdjustments = exports.updatePayrollLifecycleStatus = exports.getPayslipWithMetaById = exports.getPayrollRegister = exports.getPayslips = exports.getPayrollDashboard = exports.generatePayrollBulk = exports.generatePayroll = exports.getDailyAttendanceRecords = exports.markAbsentForDate = exports.getAttendanceDashboard = exports.checkOut = exports.checkIn = exports.assignShiftToEmployee = exports.assignShift = exports.assignManager = exports.changeEmployeeStatus = exports.updateEmployee = exports.getEmployeeById = exports.getEmployees = exports.createEmployee = exports.validateEmployeeBelongsToOrg = exports.HttpError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
const PAYROLL_META_FILE_PATH = path_1.default.join(process.cwd(), "data", "payroll-meta.json");
const defaultPayrollMeta = () => ({
    status: "DRAFT",
    paymentStatus: "UNPAID",
    statutoryTax: 0,
    arrears: 0,
    reimbursements: 0,
    loansAndAdvances: 0,
    paymentReference: null,
    bankTransferRef: null,
    paymentReconciled: false,
    paidAt: null,
    audits: [],
});
const ensurePayrollMetaFile = () => __awaiter(void 0, void 0, void 0, function* () {
    const dir = path_1.default.dirname(PAYROLL_META_FILE_PATH);
    yield fs_1.promises.mkdir(dir, { recursive: true });
    try {
        yield fs_1.promises.access(PAYROLL_META_FILE_PATH);
    }
    catch (_a) {
        yield fs_1.promises.writeFile(PAYROLL_META_FILE_PATH, JSON.stringify({}, null, 2), "utf-8");
    }
});
const readPayrollMetaStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield ensurePayrollMetaFile();
    const raw = yield fs_1.promises.readFile(PAYROLL_META_FILE_PATH, "utf-8");
    if (!raw.trim()) {
        return {};
    }
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
        return {};
    }
});
const writePayrollMetaStore = (store) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensurePayrollMetaFile();
    yield fs_1.promises.writeFile(PAYROLL_META_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
});
const getPayrollMetaByPayslipId = (payslipId) => __awaiter(void 0, void 0, void 0, function* () {
    const store = yield readPayrollMetaStore();
    return store[payslipId] || defaultPayrollMeta();
});
const upsertPayrollMetaByPayslipId = (payslipId, nextMeta) => __awaiter(void 0, void 0, void 0, function* () {
    const store = yield readPayrollMetaStore();
    store[payslipId] = nextMeta;
    yield writePayrollMetaStore(store);
});
const appendPayrollAudit = (payslipId, organizationId, actorId, action, beforeStatus, afterStatus, note) => __awaiter(void 0, void 0, void 0, function* () {
    const meta = yield getPayrollMetaByPayslipId(payslipId);
    const entry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        payslipId,
        organizationId,
        action,
        actorId,
        beforeStatus,
        afterStatus,
        note: note || null,
        createdAt: new Date().toISOString(),
    };
    meta.audits = [...meta.audits, entry];
    yield upsertPayrollMetaByPayslipId(payslipId, meta);
});
// ============================================
// PRIVATE VALIDATION HELPERS
// ============================================
/**
 * Private: Validates that an employee exists and belongs to organization
 */
const validateEmployeeExists = (employeeId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const employee = yield prisma_1.default.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, organizationId: true },
    });
    if (!employee) {
        throw new HttpError(404, "Employee not found");
    }
    if (employee.organizationId !== organizationId) {
        throw new HttpError(403, "Employee does not belong to this organization");
    }
    return employee;
});
/**
 * Private: Validates that a department exists and belongs to organization
 */
const validateDepartmentExists = (departmentId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const dept = yield prisma_1.default.department.findUnique({
        where: { id: departmentId },
        select: { id: true, organizationId: true, name: true },
    });
    if (!dept) {
        throw new HttpError(404, "Department not found");
    }
    if (dept.organizationId !== organizationId) {
        throw new HttpError(403, "Department does not belong to this organization");
    }
    return dept;
});
/**
 * Private: Validates that a designation exists and belongs to organization
 */
const validateDesignationExists = (designationId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const desig = yield prisma_1.default.designation.findUnique({
        where: { id: designationId },
        select: { id: true, organizationId: true, title: true },
    });
    if (!desig) {
        throw new HttpError(404, "Designation not found");
    }
    if (desig.organizationId !== organizationId) {
        throw new HttpError(403, "Designation does not belong to this organization");
    }
    return desig;
});
/**
 * Private: Validates that a team exists and belongs to organization
 */
const validateTeamExists = (teamId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const team = yield prisma_1.default.team.findUnique({
        where: { id: teamId },
        select: { id: true, organizationId: true, name: true },
    });
    if (!team) {
        throw new HttpError(404, "Team not found");
    }
    if (team.organizationId !== organizationId) {
        throw new HttpError(403, "Team does not belong to this organization");
    }
    return team;
});
/**
 * Private: Validates that a location exists and belongs to organization
 */
const validateLocationExists = (locationId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const loc = yield prisma_1.default.location.findUnique({
        where: { id: locationId },
        select: { id: true, organizationId: true, name: true },
    });
    if (!loc) {
        throw new HttpError(404, "Location not found");
    }
    if (loc.organizationId !== organizationId) {
        throw new HttpError(403, "Location does not belong to this organization");
    }
    return loc;
});
/**
 * Private: Validates manager hierarchy to prevent circular assignments
 * Supports unlimited depth reporting chains - traverses entire manager lineage
 *
 * Algorithm:
 * 1. Prevent self-assignment (employee as own manager)
 * 2. Verify new manager exists and belongs to organization
 * 3. Traverse upward from new manager through entire manager chain
 * 4. If employee is found anywhere in chain → circular loop detected
 * 5. Allow if no circular reference found (unlimited depth OK)
 */
const validateManagerHierarchy = (employeeId, newManagerId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Step 1: Self-assignment check (employee cannot be their own manager)
    if (employeeId === newManagerId) {
        throw new HttpError(400, "Employee cannot be their own manager");
    }
    // Step 2: Verify new manager exists and belongs to organization
    yield validateEmployeeExists(newManagerId, organizationId);
    // Step 3 & 4: Detect circular reference by traversing entire manager chain
    let currentManagerId = newManagerId;
    const visitedManagers = new Set();
    while (currentManagerId) {
        // Check if we've already visited this manager (loop detection)
        if (visitedManagers.has(currentManagerId)) {
            throw new HttpError(400, "Circular reporting structure detected. Cannot create a reporting loop in manager hierarchy.");
        }
        // Check if current manager is the employee we're trying to assign
        if (currentManagerId === employeeId) {
            throw new HttpError(400, `Circular reporting structure detected: Assigning this manager would create a loop where the employee reports to one of their own subordinates.`);
        }
        visitedManagers.add(currentManagerId);
        // Move to parent manager
        const manager = yield prisma_1.default.employee.findUnique({
            where: { id: currentManagerId },
            select: { managerId: true },
        });
        currentManagerId = (manager === null || manager === void 0 ? void 0 : manager.managerId) || null;
    }
    // Step 5: Reached top of hierarchy without circular reference - assignment is safe
});
// ============================================
// VALIDATION HELPERS (Public)
// ============================================
exports.validateEmployeeBelongsToOrg = validateEmployeeExists;
const parseDateInput = (value, fieldName, required = false) => {
    if (value === undefined || value === null || value === "") {
        if (required) {
            throw new HttpError(400, `${fieldName} is required`);
        }
        return undefined;
    }
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            throw new HttpError(400, `Invalid ${fieldName}. Expected ISO-8601 DateTime or YYYY-MM-DD`);
        }
        return value;
    }
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00.000Z`
        : value;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(400, `Invalid ${fieldName}. Expected ISO-8601 DateTime or YYYY-MM-DD`);
    }
    return parsed;
};
const createEmployee = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const joinDate = parseDateInput(input.joinDate, "joinDate", true);
    const confirmationDate = parseDateInput(input.confirmationDate, "confirmationDate");
    const dateOfBirth = parseDateInput(input.dateOfBirth, "dateOfBirth");
    if (!joinDate) {
        throw new HttpError(400, "joinDate is required");
    }
    // Validate org exists
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    // Validate employee code is unique per org
    const existingCode = yield prisma_1.default.employee.findFirst({
        where: {
            organizationId,
            employeeCode: input.employeeCode,
        },
    });
    if (existingCode) {
        throw new HttpError(400, `Employee code "${input.employeeCode}" already exists in this organization`);
    }
    // If userId provided, validate it exists
    if (input.userId) {
        const user = yield prisma_1.default.user.findUnique({
            where: { id: input.userId },
            select: { id: true },
        });
        if (!user) {
            throw new HttpError(404, "User not found");
        }
    }
    // Validate all org-scoped relations belong to this org
    if (input.departmentId) {
        yield validateDepartmentExists(input.departmentId, organizationId);
    }
    if (input.designationId) {
        yield validateDesignationExists(input.designationId, organizationId);
    }
    if (input.teamId) {
        yield validateTeamExists(input.teamId, organizationId);
    }
    if (input.locationId) {
        yield validateLocationExists(input.locationId, organizationId);
    }
    // Validate manager and hierarchy
    if (input.managerId) {
        yield validateManagerHierarchy(generateTempId(), input.managerId, organizationId);
    }
    return prisma_1.default.employee.create({
        data: {
            organizationId,
            employeeCode: input.employeeCode,
            userId: input.userId,
            departmentId: input.departmentId,
            designationId: input.designationId,
            teamId: input.teamId,
            locationId: input.locationId,
            managerId: input.managerId,
            joinDate,
            confirmationDate,
            employmentType: input.employmentType,
            workMode: input.workMode,
            status: "ACTIVE",
            salary: input.salary,
            bankAccountNumber: input.bankAccountNumber,
            bankIFSC: input.bankIFSC,
            taxId: input.taxId,
            dateOfBirth,
            gender: input.gender,
            phone: input.phone,
            address: input.address,
            emergencyContactName: input.emergencyContactName,
            emergencyContactPhone: input.emergencyContactPhone,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
            team: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
            manager: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
});
exports.createEmployee = createEmployee;
// Helper to generate a temporary ID for new employees (for hierarchy validation)
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const getEmployees = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.employee.findMany({
        where: { organizationId, status: "ACTIVE" },
        include: {
            user: true,
            department: true,
            designation: true,
            team: true,
            location: true,
            manager: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
});
exports.getEmployees = getEmployees;
const getEmployeeById = (employeeId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const employee = yield prisma_1.default.employee.findUnique({
        where: { id: employeeId },
        include: {
            user: true,
            department: true,
            designation: true,
            team: true,
            location: true,
            manager: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
            subordinates: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    if (!employee) {
        throw new HttpError(404, "Employee not found");
    }
    if (employee.organizationId !== organizationId) {
        throw new HttpError(403, "Employee does not belong to this organization");
    }
    return employee;
});
exports.getEmployeeById = getEmployeeById;
const updateEmployee = (employeeId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate employee exists in org
    yield validateEmployeeExists(employeeId, organizationId);
    // Validate all relations
    if (input.departmentId) {
        yield validateDepartmentExists(input.departmentId, organizationId);
    }
    if (input.designationId) {
        yield validateDesignationExists(input.designationId, organizationId);
    }
    if (input.teamId) {
        yield validateTeamExists(input.teamId, organizationId);
    }
    if (input.locationId) {
        yield validateLocationExists(input.locationId, organizationId);
    }
    // Validate manager and hierarchy if changing
    if (input.managerId) {
        yield validateManagerHierarchy(employeeId, input.managerId, organizationId);
    }
    const data = {};
    if (input.departmentId !== undefined)
        data.department = input.departmentId ? { connect: { id: input.departmentId } } : { disconnect: true };
    if (input.designationId !== undefined)
        data.designation = input.designationId ? { connect: { id: input.designationId } } : { disconnect: true };
    if (input.teamId !== undefined)
        data.team = input.teamId ? { connect: { id: input.teamId } } : { disconnect: true };
    if (input.locationId !== undefined)
        data.location = input.locationId ? { connect: { id: input.locationId } } : { disconnect: true };
    if (input.managerId !== undefined)
        data.manager = input.managerId ? { connect: { id: input.managerId } } : { disconnect: true };
    if (input.phone !== undefined)
        data.phone = input.phone;
    if (input.address !== undefined)
        data.address = input.address;
    if (input.salary !== undefined)
        data.salary = input.salary;
    if (input.bankAccountNumber !== undefined)
        data.bankAccountNumber = input.bankAccountNumber;
    if (input.bankIFSC !== undefined)
        data.bankIFSC = input.bankIFSC;
    if (input.taxId !== undefined)
        data.taxId = input.taxId;
    if (input.joinDate !== undefined)
        data.joinDate = parseDateInput(input.joinDate, "joinDate");
    if (input.confirmationDate !== undefined) {
        data.confirmationDate = parseDateInput(input.confirmationDate, "confirmationDate");
    }
    if (input.dateOfBirth !== undefined)
        data.dateOfBirth = parseDateInput(input.dateOfBirth, "dateOfBirth");
    return prisma_1.default.employee.update({
        where: { id: employeeId },
        data,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
            team: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
            manager: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
});
exports.updateEmployee = updateEmployee;
const changeEmployeeStatus = (employeeId, organizationId, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    const validStatuses = ["ACTIVE", "RESIGNED", "TERMINATED", "ON_LEAVE"];
    if (!validStatuses.includes(newStatus)) {
        throw new HttpError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
    // Get current employee for status transition validation
    const employee = yield prisma_1.default.employee.findUnique({
        where: { id: employeeId },
        select: { status: true },
    });
    // Business rule: TERMINATED cannot revert without explicit override
    if ((employee === null || employee === void 0 ? void 0 : employee.status) === "TERMINATED" && newStatus !== "TERMINATED") {
        throw new HttpError(400, "Terminated employees cannot be re-activated without HR override. Contact HR administrator.");
    }
    return prisma_1.default.employee.update({
        where: { id: employeeId },
        data: { status: newStatus },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
            team: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
        },
    });
});
exports.changeEmployeeStatus = changeEmployeeStatus;
const assignManager = (employeeId, organizationId, managerId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    yield validateManagerHierarchy(employeeId, managerId, organizationId);
    return prisma_1.default.employee.update({
        where: { id: employeeId },
        data: {
            manager: {
                connect: { id: managerId },
            },
        },
        include: {
            manager: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
            subordinates: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
});
exports.assignManager = assignManager;
const assignShift = (employeeId, organizationId, shiftId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    const shift = yield prisma_1.default.shift.findUnique({
        where: { id: shiftId },
        select: { id: true, organizationId: true },
    });
    if (!shift)
        throw new HttpError(404, "Shift not found");
    if (shift.organizationId !== organizationId)
        throw new HttpError(403, "Shift does not belong to this organization");
    // Check for duplicate shift assignment
    const existingAssignment = yield prisma_1.default.employeeShift.findFirst({
        where: {
            employeeId,
            shiftId,
        },
    });
    if (existingAssignment) {
        throw new HttpError(400, "Employee is already assigned to this shift");
    }
    return prisma_1.default.employeeShift.create({
        data: {
            employeeId,
            shiftId,
        },
        include: {
            employee: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
            shift: {
                select: {
                    id: true,
                    name: true,
                    startTime: true,
                    endTime: true,
                },
            },
        },
    });
});
exports.assignShift = assignShift;
const assignShiftToEmployee = (employeeId, shiftId, organizationId) => __awaiter(void 0, void 0, void 0, function* () { return (0, exports.assignShift)(employeeId, organizationId, shiftId); });
exports.assignShiftToEmployee = assignShiftToEmployee;
const getStartOfLocalDay = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
const parseDateOnlyInput = (value) => {
    if (!value) {
        return getStartOfLocalDay(new Date());
    }
    const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!matched) {
        throw new HttpError(400, "Invalid date. Expected format YYYY-MM-DD");
    }
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    return new Date(year, month - 1, day);
};
const parseShiftTimeForDate = (date, shiftTime) => {
    const [hourPart, minutePart] = shiftTime.split(":");
    const hours = Number(hourPart);
    const minutes = Number(minutePart);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new HttpError(400, `Invalid shift time format: ${shiftTime}. Expected HH:mm`);
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
};
const roundHours = (value) => Number(value.toFixed(2));
const parseAttendanceDateTime = (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            throw new HttpError(400, `Invalid ${fieldName}. Expected ISO-8601 DateTime`);
        }
        return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(400, `Invalid ${fieldName}. Expected ISO-8601 DateTime`);
    }
    return parsed;
};
const getAttendanceContext = (employeeId, organizationId, requireShift) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    const employee = yield prisma_1.default.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, status: true },
    });
    if (!employee) {
        throw new HttpError(404, "Employee not found");
    }
    if (employee.status !== "ACTIVE") {
        throw new HttpError(400, "Only ACTIVE employees can perform attendance actions");
    }
    const employeeShift = yield prisma_1.default.employeeShift.findFirst({
        where: { employeeId },
        include: {
            shift: {
                select: {
                    id: true,
                    organizationId: true,
                    name: true,
                    startTime: true,
                    endTime: true,
                    graceMinutes: true,
                },
            },
        },
        orderBy: { id: "asc" },
    });
    if (!employeeShift) {
        if (!requireShift) {
            return {
                employee,
                shift: null,
            };
        }
        throw new HttpError(400, "No shift assigned to employee");
    }
    if (employeeShift.shift.organizationId !== organizationId) {
        throw new HttpError(403, "Assigned shift does not belong to this organization");
    }
    return {
        employee,
        shift: employeeShift.shift,
    };
});
const checkIn = (employeeId, organizationId, options) => __awaiter(void 0, void 0, void 0, function* () {
    const manualMode = (options === null || options === void 0 ? void 0 : options.manual) === true;
    const checkInAt = parseAttendanceDateTime(options === null || options === void 0 ? void 0 : options.checkInAt, "checkInAt") || new Date();
    const { shift } = yield getAttendanceContext(employeeId, organizationId, !manualMode);
    const attendanceDate = getStartOfLocalDay(checkInAt);
    const openAttendance = yield prisma_1.default.attendance.findFirst({
        where: {
            employeeId,
            checkIn: { not: null },
            checkOut: null,
        },
        orderBy: { date: "desc" },
    });
    if (openAttendance && !manualMode) {
        throw new HttpError(400, "Employee already has an open check-in. Please check out first");
    }
    const existingAttendance = yield prisma_1.default.attendance.findUnique({
        where: {
            employeeId_date: {
                employeeId,
                date: attendanceDate,
            },
        },
    });
    const shiftStartDateTime = shift ? parseShiftTimeForDate(attendanceDate, shift.startTime) : null;
    const graceDeadline = shiftStartDateTime && shift
        ? new Date(shiftStartDateTime.getTime() + shift.graceMinutes * 60 * 1000)
        : null;
    const isLate = graceDeadline ? checkInAt > graceDeadline : false;
    if (existingAttendance && existingAttendance.checkIn && !manualMode) {
        throw new HttpError(400, "Employee has already checked in for today");
    }
    if (existingAttendance && existingAttendance.checkIn && manualMode) {
        if (existingAttendance.checkOut && checkInAt >= existingAttendance.checkOut) {
            throw new HttpError(400, "checkInAt must be earlier than existing checkOut time");
        }
        const attendance = yield prisma_1.default.attendance.update({
            where: { id: existingAttendance.id },
            data: {
                checkIn: checkInAt,
                isLate,
                status: "PRESENT",
            },
        });
        return {
            attendance,
            shift: shift
                ? {
                    id: shift.id,
                    name: shift.name,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    graceMinutes: shift.graceMinutes,
                }
                : null,
        };
    }
    if (existingAttendance && !existingAttendance.checkIn) {
        const attendance = yield prisma_1.default.attendance.update({
            where: { id: existingAttendance.id },
            data: {
                checkIn: checkInAt,
                isLate,
                status: "PRESENT",
            },
        });
        return {
            attendance,
            shift: shift
                ? {
                    id: shift.id,
                    name: shift.name,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    graceMinutes: shift.graceMinutes,
                }
                : null,
        };
    }
    const attendance = yield prisma_1.default.attendance.create({
        data: {
            organizationId,
            employeeId,
            date: attendanceDate,
            checkIn: checkInAt,
            isLate,
            status: "PRESENT",
        },
    });
    return {
        attendance,
        shift: shift
            ? {
                id: shift.id,
                name: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime,
                graceMinutes: shift.graceMinutes,
            }
            : null,
    };
});
exports.checkIn = checkIn;
const checkOut = (employeeId, organizationId, options) => __awaiter(void 0, void 0, void 0, function* () {
    const manualMode = (options === null || options === void 0 ? void 0 : options.manual) === true;
    const checkOutAt = parseAttendanceDateTime(options === null || options === void 0 ? void 0 : options.checkOutAt, "checkOutAt") || new Date();
    const { shift } = yield getAttendanceContext(employeeId, organizationId, !manualMode);
    const attendanceDate = getStartOfLocalDay(checkOutAt);
    let attendance = yield prisma_1.default.attendance.findFirst({
        where: {
            employeeId,
            checkIn: { not: null },
            checkOut: null,
        },
        orderBy: { date: "desc" },
    });
    if (!attendance && manualMode) {
        attendance = yield prisma_1.default.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: attendanceDate,
                },
            },
        });
    }
    if (!attendance || !attendance.checkIn) {
        throw new HttpError(400, "Cannot check out without an active check-in");
    }
    if (checkOutAt <= attendance.checkIn) {
        throw new HttpError(400, "checkOutAt must be later than checkIn");
    }
    const shiftStartDateTime = shift ? parseShiftTimeForDate(attendance.date, shift.startTime) : null;
    let shiftEndDateTime = shift ? parseShiftTimeForDate(attendance.date, shift.endTime) : null;
    if (shiftEndDateTime && shiftStartDateTime && shiftEndDateTime <= shiftStartDateTime) {
        shiftEndDateTime = new Date(shiftEndDateTime.getTime() + 24 * 60 * 60 * 1000);
    }
    const totalHoursRaw = Math.max(0, (checkOutAt.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60));
    const overtimeRaw = shiftEndDateTime && checkOutAt > shiftEndDateTime
        ? (checkOutAt.getTime() - shiftEndDateTime.getTime()) / (1000 * 60 * 60)
        : 0;
    const totalHours = roundHours(totalHoursRaw);
    const overtimeHours = roundHours(Math.max(0, overtimeRaw));
    return prisma_1.default.attendance.update({
        where: { id: attendance.id },
        data: {
            checkOut: checkOutAt,
            totalHours,
            overtimeHours,
            status: "PRESENT",
        },
    });
});
exports.checkOut = checkOut;
const getAttendanceDashboard = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const now = new Date();
    const attendanceDate = getStartOfLocalDay(now);
    const [activeEmployeesCount, attendanceRecords, overtimeAggregate] = yield Promise.all([
        prisma_1.default.employee.count({
            where: {
                organizationId,
                status: "ACTIVE",
            },
        }),
        prisma_1.default.attendance.findMany({
            where: {
                organizationId,
                date: attendanceDate,
            },
            select: {
                id: true,
                isLate: true,
                checkIn: true,
                overtimeHours: true,
            },
        }),
        prisma_1.default.attendance.aggregate({
            where: {
                organizationId,
                date: attendanceDate,
            },
            _sum: {
                overtimeHours: true,
            },
        }),
    ]);
    const totalPresentToday = attendanceRecords.filter((record) => record.checkIn !== null).length;
    const totalLateToday = attendanceRecords.filter((record) => record.isLate).length;
    const totalAbsentToday = Math.max(activeEmployeesCount - totalPresentToday, 0);
    const totalOvertimeToday = roundHours((_a = overtimeAggregate._sum.overtimeHours) !== null && _a !== void 0 ? _a : 0);
    const attendanceRate = activeEmployeesCount === 0 ? 0 : roundHours((totalPresentToday / activeEmployeesCount) * 100);
    return {
        date: attendanceDate,
        totalPresentToday,
        totalAbsentToday,
        totalLateToday,
        totalOvertimeToday,
        attendanceRate,
    };
});
exports.getAttendanceDashboard = getAttendanceDashboard;
const markAbsentForDate = (organizationId_1, ...args_1) => __awaiter(void 0, [organizationId_1, ...args_1], void 0, function* (organizationId, dateInput = new Date()) {
    const attendanceDate = getStartOfLocalDay(dateInput);
    const [activeEmployees, existingAttendance] = yield Promise.all([
        prisma_1.default.employee.findMany({
            where: {
                organizationId,
                status: "ACTIVE",
            },
            select: { id: true },
        }),
        prisma_1.default.attendance.findMany({
            where: {
                organizationId,
                date: attendanceDate,
            },
            select: { employeeId: true },
        }),
    ]);
    const existingEmployeeIds = new Set(existingAttendance.map((row) => row.employeeId));
    const absentRows = activeEmployees
        .filter((employee) => !existingEmployeeIds.has(employee.id))
        .map((employee) => ({
        organizationId,
        employeeId: employee.id,
        date: attendanceDate,
        status: "ABSENT",
    }));
    if (absentRows.length === 0) {
        return {
            date: attendanceDate,
            createdAbsentRecords: 0,
        };
    }
    const result = yield prisma_1.default.attendance.createMany({
        data: absentRows,
        skipDuplicates: true,
    });
    return {
        date: attendanceDate,
        createdAbsentRecords: result.count,
    };
});
exports.markAbsentForDate = markAbsentForDate;
// ============================================
// PAYROLL ENGINE OPERATIONS
// ============================================
const getMonthRange = (month, year) => {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new HttpError(400, "month must be between 1 and 12");
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new HttpError(400, "year must be between 2000 and 2100");
    }
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    return { start, end };
};
const roundMoney = (value) => Number(value.toFixed(2));
const isDeductionComponent = (type) => type.toUpperCase().includes("DEDUCTION");
const isUnpaidLeavePolicy = (policyName) => {
    const normalized = policyName.toLowerCase();
    return normalized.includes("unpaid") || normalized.includes("lop") || normalized.includes("loss of pay");
};
const getOverlapDaysInclusive = (startDate, endDate, monthStart, monthEndExclusive) => {
    const from = startDate > monthStart ? startDate : monthStart;
    const monthEndInclusive = new Date(monthEndExclusive.getTime() - 1);
    const to = endDate < monthEndInclusive ? endDate : monthEndInclusive;
    if (from > to) {
        return 0;
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.floor((toUtc - fromUtc) / dayMs) + 1;
};
const getDailyAttendanceRecords = (organizationId, dateInput) => __awaiter(void 0, void 0, void 0, function* () {
    const attendanceDate = getStartOfLocalDay(parseDateOnlyInput(dateInput));
    const [employees, attendanceRecords] = yield Promise.all([
        prisma_1.default.employee.findMany({
            where: {
                organizationId,
                status: "ACTIVE",
            },
            select: {
                id: true,
                employeeCode: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { employeeCode: "asc" },
        }),
        prisma_1.default.attendance.findMany({
            where: {
                organizationId,
                date: attendanceDate,
            },
            select: {
                employeeId: true,
                checkIn: true,
                checkOut: true,
                totalHours: true,
                overtimeHours: true,
                status: true,
                isLate: true,
            },
        }),
    ]);
    const attendanceByEmployee = new Map(attendanceRecords.map((record) => [record.employeeId, record]));
    const records = employees.map((employee) => {
        var _a, _b, _c;
        const record = attendanceByEmployee.get(employee.id);
        const fullName = `${((_a = employee.user) === null || _a === void 0 ? void 0 : _a.firstName) || ""} ${((_b = employee.user) === null || _b === void 0 ? void 0 : _b.lastName) || ""}`.trim();
        return {
            employeeId: employee.id,
            employeeCode: employee.employeeCode,
            employeeName: fullName || employee.employeeCode,
            email: ((_c = employee.user) === null || _c === void 0 ? void 0 : _c.email) || null,
            checkIn: (record === null || record === void 0 ? void 0 : record.checkIn) || null,
            checkOut: (record === null || record === void 0 ? void 0 : record.checkOut) || null,
            totalHours: (record === null || record === void 0 ? void 0 : record.totalHours) || 0,
            overtimeHours: (record === null || record === void 0 ? void 0 : record.overtimeHours) || 0,
            isLate: Boolean(record === null || record === void 0 ? void 0 : record.isLate),
            status: (record === null || record === void 0 ? void 0 : record.status) || "ABSENT",
        };
    });
    return {
        date: attendanceDate,
        records,
    };
});
exports.getDailyAttendanceRecords = getDailyAttendanceRecords;
const calculatePayrollBreakdown = (employeeId, organizationId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { start: monthStart, end: monthEnd } = getMonthRange(month, year);
    const employee = yield prisma_1.default.employee.findUnique({
        where: { id: employeeId },
        select: {
            id: true,
            organizationId: true,
            salary: true,
        },
    });
    if (!employee) {
        throw new HttpError(404, "Employee not found");
    }
    if (employee.organizationId !== organizationId) {
        throw new HttpError(403, "Employee does not belong to this organization");
    }
    const baseSalary = Number(employee.salary);
    const salaryStructures = yield prisma_1.default.salaryStructure.findMany({
        where: {
            employeeId,
            component: {
                organizationId,
            },
        },
        include: {
            component: {
                select: {
                    name: true,
                    type: true,
                    isPercentage: true,
                    value: true,
                },
            },
        },
    });
    let allowances = 0;
    let deductions = 0;
    for (const structure of salaryStructures) {
        const rawValue = Number(structure.component.value);
        const componentAmount = structure.component.isPercentage
            ? (baseSalary * rawValue) / 100
            : rawValue;
        if (isDeductionComponent(structure.component.type)) {
            deductions += componentAmount;
        }
        else {
            allowances += componentAmount;
        }
    }
    const attendanceAggregate = yield prisma_1.default.attendance.aggregate({
        where: {
            employeeId,
            organizationId,
            date: {
                gte: monthStart,
                lt: monthEnd,
            },
        },
        _sum: {
            overtimeHours: true,
        },
    });
    const overtimeHours = Number((_a = attendanceAggregate._sum.overtimeHours) !== null && _a !== void 0 ? _a : 0);
    const hourlyRate = baseSalary / 30 / 8;
    const overtimePay = overtimeHours * hourlyRate;
    const approvedLeaves = yield prisma_1.default.leaveRequest.findMany({
        where: {
            employeeId,
            status: "APPROVED",
            startDate: {
                lt: monthEnd,
            },
            endDate: {
                gte: monthStart,
            },
        },
        include: {
            leavePolicy: {
                select: {
                    name: true,
                },
            },
        },
    });
    let unpaidLeaveDays = 0;
    for (const leave of approvedLeaves) {
        if (!isUnpaidLeavePolicy(leave.leavePolicy.name)) {
            continue;
        }
        unpaidLeaveDays += getOverlapDaysInclusive(leave.startDate, leave.endDate, monthStart, monthEnd);
    }
    const leaveDeduction = (baseSalary / 30) * unpaidLeaveDays;
    const grossSalary = baseSalary + allowances + overtimePay;
    const totalDeductions = deductions + leaveDeduction;
    const netSalary = Math.max(0, grossSalary - totalDeductions);
    return {
        baseSalary: roundMoney(baseSalary),
        allowances: roundMoney(allowances),
        deductions: roundMoney(deductions),
        overtimeHours: roundHours(overtimeHours),
        overtimePay: roundMoney(overtimePay),
        leaveDeduction: roundMoney(leaveDeduction),
        grossSalary: roundMoney(grossSalary),
        netSalary: roundMoney(netSalary),
        hourlyRate: roundMoney(hourlyRate),
        unpaidLeaveDays,
    };
});
const generatePayroll = (employeeId, month, year, organizationId, actorId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    const existingPayslip = yield prisma_1.default.payslip.findUnique({
        where: {
            employeeId_month_year: {
                employeeId,
                month,
                year,
            },
        },
    });
    if (existingPayslip) {
        throw new HttpError(400, `Payroll already generated for ${month}/${year}`);
    }
    const breakdown = yield calculatePayrollBreakdown(employeeId, organizationId, month, year);
    const payslip = yield prisma_1.default.payslip.create({
        data: {
            employeeId,
            month,
            year,
            grossSalary: breakdown.grossSalary,
            netSalary: breakdown.netSalary,
        },
        include: {
            employee: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    if (actorId) {
        yield appendPayrollAudit(payslip.id, organizationId, actorId, "GENERATE_PAYROLL", null, "DRAFT");
    }
    return {
        payslip,
        breakdown,
    };
});
exports.generatePayroll = generatePayroll;
const generatePayrollBulk = (organizationId, month, year, actorId) => __awaiter(void 0, void 0, void 0, function* () {
    getMonthRange(month, year);
    const employees = yield prisma_1.default.employee.findMany({
        where: { organizationId, status: "ACTIVE" },
        select: { id: true, employeeCode: true },
    });
    const results = [];
    for (const employee of employees) {
        try {
            yield (0, exports.generatePayroll)(employee.id, month, year, organizationId, actorId);
            results.push({ employeeId: employee.id, employeeCode: employee.employeeCode, status: "CREATED" });
        }
        catch (error) {
            if (error instanceof HttpError && error.message.includes("already generated")) {
                results.push({
                    employeeId: employee.id,
                    employeeCode: employee.employeeCode,
                    status: "SKIPPED",
                    reason: error.message,
                });
                continue;
            }
            throw error;
        }
    }
    return {
        month,
        year,
        totalEmployees: employees.length,
        createdCount: results.filter((item) => item.status === "CREATED").length,
        skippedCount: results.filter((item) => item.status === "SKIPPED").length,
        results,
    };
});
exports.generatePayrollBulk = generatePayrollBulk;
const getPayrollDashboard = (organizationId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    getMonthRange(month, year);
    const payslips = yield prisma_1.default.payslip.findMany({
        where: {
            month,
            year,
            employee: {
                organizationId,
            },
        },
        select: {
            id: true,
            employeeId: true,
            netSalary: true,
            grossSalary: true,
        },
    });
    const totalEmployeesPaid = payslips.length;
    const totalPayrollCost = roundMoney(payslips.reduce((sum, payslip) => sum + Number(payslip.netSalary), 0));
    const averageSalary = totalEmployeesPaid === 0 ? 0 : roundMoney(totalPayrollCost / totalEmployeesPaid);
    const breakdowns = yield Promise.all(payslips.map((payslip) => calculatePayrollBreakdown(payslip.employeeId, organizationId, month, year)));
    const totalOvertimePaid = roundMoney(breakdowns.reduce((sum, breakdown) => sum + breakdown.overtimePay, 0));
    const totalDeductions = roundMoney(breakdowns.reduce((sum, breakdown) => sum + breakdown.deductions + breakdown.leaveDeduction, 0));
    return {
        month,
        year,
        totalPayrollCost,
        totalEmployeesPaid,
        totalOvertimePaid,
        totalDeductions,
        averageSalary,
    };
});
exports.getPayrollDashboard = getPayrollDashboard;
const getPayslips = (organizationId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    if ((month !== undefined && year === undefined) || (month === undefined && year !== undefined)) {
        throw new HttpError(400, "month and year must be provided together");
    }
    if (month !== undefined && year !== undefined) {
        getMonthRange(month, year);
    }
    return prisma_1.default.payslip.findMany({
        where: Object.assign({ employee: {
                organizationId,
            } }, (month !== undefined && year !== undefined ? { month, year } : {})),
        include: {
            employee: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    designation: {
                        select: {
                            title: true,
                        },
                    },
                },
            },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { generatedAt: "desc" }],
    });
});
exports.getPayslips = getPayslips;
const mergePayslipWithMeta = (organizationId, payslip) => __awaiter(void 0, void 0, void 0, function* () {
    const meta = yield getPayrollMetaByPayslipId(payslip.id);
    const grossSalary = Number(payslip.grossSalary);
    const netSalary = Number(payslip.netSalary);
    const finalNetSalary = Math.max(0, netSalary + meta.arrears + meta.reimbursements - meta.loansAndAdvances - meta.statutoryTax);
    return Object.assign(Object.assign({}, payslip), { grossSalary,
        netSalary, finalNetSalary: roundMoney(finalNetSalary), status: meta.status, paymentStatus: meta.paymentStatus, statutoryTax: meta.statutoryTax, arrears: meta.arrears, reimbursements: meta.reimbursements, loansAndAdvances: meta.loansAndAdvances, paymentReference: meta.paymentReference, bankTransferRef: meta.bankTransferRef, paymentReconciled: meta.paymentReconciled, paidAt: meta.paidAt, organizationId });
});
const getPayrollRegister = (organizationId, month, year, search) => __awaiter(void 0, void 0, void 0, function* () {
    const payslips = yield (0, exports.getPayslips)(organizationId, month, year);
    const merged = yield Promise.all(payslips.map((payslip) => mergePayslipWithMeta(organizationId, payslip)));
    const normalizedSearch = (search || "").trim().toLowerCase();
    const records = normalizedSearch
        ? merged.filter((item) => {
            var _a, _b, _c;
            const name = `${((_a = item.employee.user) === null || _a === void 0 ? void 0 : _a.firstName) || ""} ${((_b = item.employee.user) === null || _b === void 0 ? void 0 : _b.lastName) || ""}`.trim();
            const haystack = `${name} ${item.employee.employeeCode} ${((_c = item.employee.user) === null || _c === void 0 ? void 0 : _c.email) || ""}`.toLowerCase();
            return haystack.includes(normalizedSearch);
        })
        : merged;
    return {
        month,
        year,
        totalRecords: records.length,
        records,
    };
});
exports.getPayrollRegister = getPayrollRegister;
const getPayslipWithMetaById = (payslipId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const payslip = yield prisma_1.default.payslip.findUnique({
        where: { id: payslipId },
        include: {
            employee: {
                select: {
                    id: true,
                    employeeCode: true,
                    user: { select: { firstName: true, lastName: true, email: true } },
                    designation: { select: { title: true } },
                    organizationId: true,
                },
            },
        },
    });
    if (!payslip || payslip.employee.organizationId !== organizationId) {
        throw new HttpError(404, "Payslip not found");
    }
    return mergePayslipWithMeta(organizationId, payslip);
});
exports.getPayslipWithMetaById = getPayslipWithMetaById;
const updatePayrollLifecycleStatus = (payslipId, organizationId, actorId, nextStatus, note) => __awaiter(void 0, void 0, void 0, function* () {
    const payslip = yield prisma_1.default.payslip.findUnique({
        where: { id: payslipId },
        select: {
            id: true,
            employee: { select: { organizationId: true } },
        },
    });
    if (!payslip || payslip.employee.organizationId !== organizationId) {
        throw new HttpError(404, "Payslip not found");
    }
    const meta = yield getPayrollMetaByPayslipId(payslipId);
    const allowedTransitions = {
        DRAFT: ["APPROVED"],
        APPROVED: ["PAID"],
        PAID: ["LOCKED"],
        LOCKED: [],
    };
    if (!allowedTransitions[meta.status].includes(nextStatus)) {
        throw new HttpError(400, `Invalid transition from ${meta.status} to ${nextStatus}`);
    }
    const prev = meta.status;
    meta.status = nextStatus;
    if (nextStatus === "PAID") {
        meta.paymentStatus = "PAID";
        meta.paidAt = new Date().toISOString();
    }
    yield upsertPayrollMetaByPayslipId(payslipId, meta);
    yield appendPayrollAudit(payslipId, organizationId, actorId, "STATUS_CHANGE", prev, nextStatus, note);
    return { payslipId, previousStatus: prev, status: nextStatus };
});
exports.updatePayrollLifecycleStatus = updatePayrollLifecycleStatus;
const updatePayrollAdjustments = (payslipId, organizationId, actorId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const payslip = yield prisma_1.default.payslip.findUnique({
        where: { id: payslipId },
        select: { id: true, employee: { select: { organizationId: true } } },
    });
    if (!payslip || payslip.employee.organizationId !== organizationId) {
        throw new HttpError(404, "Payslip not found");
    }
    const meta = yield getPayrollMetaByPayslipId(payslipId);
    if (meta.status === "LOCKED") {
        throw new HttpError(400, "Locked payroll cannot be adjusted");
    }
    meta.statutoryTax = Number((_a = input.statutoryTax) !== null && _a !== void 0 ? _a : meta.statutoryTax);
    meta.arrears = Number((_b = input.arrears) !== null && _b !== void 0 ? _b : meta.arrears);
    meta.reimbursements = Number((_c = input.reimbursements) !== null && _c !== void 0 ? _c : meta.reimbursements);
    meta.loansAndAdvances = Number((_d = input.loansAndAdvances) !== null && _d !== void 0 ? _d : meta.loansAndAdvances);
    yield upsertPayrollMetaByPayslipId(payslipId, meta);
    yield appendPayrollAudit(payslipId, organizationId, actorId, "ADJUSTMENT_UPDATE", meta.status, meta.status, input.note);
    return { payslipId, meta };
});
exports.updatePayrollAdjustments = updatePayrollAdjustments;
const updatePayrollPayment = (payslipId, organizationId, actorId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const payslip = yield prisma_1.default.payslip.findUnique({
        where: { id: payslipId },
        select: { id: true, employee: { select: { organizationId: true } } },
    });
    if (!payslip || payslip.employee.organizationId !== organizationId) {
        throw new HttpError(404, "Payslip not found");
    }
    const meta = yield getPayrollMetaByPayslipId(payslipId);
    meta.paymentStatus = input.paymentStatus || meta.paymentStatus;
    meta.paymentReference = (_a = input.paymentReference) !== null && _a !== void 0 ? _a : meta.paymentReference;
    meta.bankTransferRef = (_b = input.bankTransferRef) !== null && _b !== void 0 ? _b : meta.bankTransferRef;
    if (meta.paymentStatus === "PAID") {
        meta.paidAt = new Date().toISOString();
        if (meta.status === "APPROVED") {
            meta.status = "PAID";
        }
    }
    yield upsertPayrollMetaByPayslipId(payslipId, meta);
    yield appendPayrollAudit(payslipId, organizationId, actorId, "PAYMENT_UPDATE", meta.status, meta.status, input.note);
    return { payslipId, meta };
});
exports.updatePayrollPayment = updatePayrollPayment;
const reconcilePayrollPayment = (payslipId, organizationId, actorId, reconciled, note) => __awaiter(void 0, void 0, void 0, function* () {
    const payslip = yield prisma_1.default.payslip.findUnique({
        where: { id: payslipId },
        select: { id: true, employee: { select: { organizationId: true } } },
    });
    if (!payslip || payslip.employee.organizationId !== organizationId) {
        throw new HttpError(404, "Payslip not found");
    }
    const meta = yield getPayrollMetaByPayslipId(payslipId);
    meta.paymentReconciled = reconciled;
    yield upsertPayrollMetaByPayslipId(payslipId, meta);
    yield appendPayrollAudit(payslipId, organizationId, actorId, "PAYMENT_RECONCILE", meta.status, meta.status, note);
    return { payslipId, paymentReconciled: reconciled };
});
exports.reconcilePayrollPayment = reconcilePayrollPayment;
const getPayrollAuditTrail = (organizationId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    const payslips = yield (0, exports.getPayslips)(organizationId, month, year);
    const allEntries = [];
    for (const payslip of payslips) {
        const meta = yield getPayrollMetaByPayslipId(payslip.id);
        allEntries.push(...meta.audits);
    }
    return allEntries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
});
exports.getPayrollAuditTrail = getPayrollAuditTrail;
const listSalaryComponents = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.salaryComponent.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
    });
});
exports.listSalaryComponents = listSalaryComponents;
const createSalaryComponent = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new HttpError(400, "name is required");
    }
    return prisma_1.default.salaryComponent.create({
        data: {
            organizationId,
            name: input.name.trim(),
            type: ((_b = input.type) === null || _b === void 0 ? void 0 : _b.trim()) || "EARNING",
            isPercentage: Boolean(input.isPercentage),
            value: Number(input.value || 0),
        },
    });
});
exports.createSalaryComponent = createSalaryComponent;
const updateSalaryComponent = (componentId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const component = yield prisma_1.default.salaryComponent.findUnique({ where: { id: componentId } });
    if (!component || component.organizationId !== organizationId) {
        throw new HttpError(404, "Salary component not found");
    }
    return prisma_1.default.salaryComponent.update({
        where: { id: componentId },
        data: {
            name: ((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim()) || component.name,
            type: ((_b = input.type) === null || _b === void 0 ? void 0 : _b.trim()) || component.type,
            isPercentage: (_c = input.isPercentage) !== null && _c !== void 0 ? _c : component.isPercentage,
            value: input.value !== undefined ? Number(input.value) : component.value,
        },
    });
});
exports.updateSalaryComponent = updateSalaryComponent;
const deleteSalaryComponent = (componentId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const component = yield prisma_1.default.salaryComponent.findUnique({ where: { id: componentId } });
    if (!component || component.organizationId !== organizationId) {
        throw new HttpError(404, "Salary component not found");
    }
    yield prisma_1.default.salaryStructure.deleteMany({ where: { componentId } });
    yield prisma_1.default.salaryComponent.delete({ where: { id: componentId } });
    return { success: true };
});
exports.deleteSalaryComponent = deleteSalaryComponent;
const assignSalaryComponentToEmployee = (employeeId, componentId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    const component = yield prisma_1.default.salaryComponent.findUnique({ where: { id: componentId } });
    if (!component || component.organizationId !== organizationId) {
        throw new HttpError(404, "Salary component not found");
    }
    const existing = yield prisma_1.default.salaryStructure.findFirst({ where: { employeeId, componentId } });
    if (existing) {
        return existing;
    }
    return prisma_1.default.salaryStructure.create({
        data: { employeeId, componentId },
    });
});
exports.assignSalaryComponentToEmployee = assignSalaryComponentToEmployee;
const unassignSalaryComponentFromEmployee = (employeeId, componentId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    const component = yield prisma_1.default.salaryComponent.findUnique({ where: { id: componentId } });
    if (!component || component.organizationId !== organizationId) {
        throw new HttpError(404, "Salary component not found");
    }
    yield prisma_1.default.salaryStructure.deleteMany({
        where: { employeeId, componentId },
    });
    return { success: true };
});
exports.unassignSalaryComponentFromEmployee = unassignSalaryComponentFromEmployee;
// ============================================
// PERFORMANCE ENGINE OPERATIONS
// ============================================
const createPerformanceReview = (employeeId, reviewerId, rating, comments, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    yield validateEmployeeExists(reviewerId, organizationId);
    if (employeeId === reviewerId) {
        throw new HttpError(400, "Reviewer cannot review themselves");
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        throw new HttpError(400, "rating must be between 1 and 5");
    }
    return prisma_1.default.performanceReview.create({
        data: {
            employeeId,
            reviewerId,
            rating: Math.round(rating),
            comments,
        },
    });
});
exports.createPerformanceReview = createPerformanceReview;
const getEmployeePerformanceHistory = (employeeId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateEmployeeExists(employeeId, organizationId);
    return prisma_1.default.performanceReview.findMany({
        where: {
            employeeId,
            employee: {
                organizationId,
            },
        },
        orderBy: { reviewDate: "desc" },
    });
});
exports.getEmployeePerformanceHistory = getEmployeePerformanceHistory;
const getPerformanceDashboard = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const [averageAgg, reviewsThisMonth, reviews] = yield Promise.all([
        prisma_1.default.performanceReview.aggregate({
            where: {
                employee: {
                    organizationId,
                },
            },
            _avg: { rating: true },
        }),
        prisma_1.default.performanceReview.count({
            where: {
                employee: {
                    organizationId,
                },
                reviewDate: {
                    gte: monthStart,
                    lt: monthEnd,
                },
            },
        }),
        prisma_1.default.performanceReview.findMany({
            where: {
                employee: {
                    organizationId,
                },
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        department: {
                            select: {
                                name: true,
                            },
                        },
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        }),
    ]);
    const employeeRatingMap = new Map();
    const departmentRatingMap = new Map();
    for (const review of reviews) {
        const empId = review.employee.id;
        const empName = `${(_b = (_a = review.employee.user) === null || _a === void 0 ? void 0 : _a.firstName) !== null && _b !== void 0 ? _b : ""} ${(_d = (_c = review.employee.user) === null || _c === void 0 ? void 0 : _c.lastName) !== null && _d !== void 0 ? _d : ""}`.trim() || review.employee.employeeCode;
        const deptName = (_f = (_e = review.employee.department) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : "Unassigned";
        const existingEmp = employeeRatingMap.get(empId);
        if (existingEmp) {
            existingEmp.ratingSum += review.rating;
            existingEmp.reviewCount += 1;
        }
        else {
            employeeRatingMap.set(empId, {
                employeeCode: review.employee.employeeCode,
                name: empName,
                department: (_h = (_g = review.employee.department) === null || _g === void 0 ? void 0 : _g.name) !== null && _h !== void 0 ? _h : null,
                ratingSum: review.rating,
                reviewCount: 1,
            });
        }
        const existingDept = departmentRatingMap.get(deptName);
        if (existingDept) {
            existingDept.ratingSum += review.rating;
            existingDept.reviewCount += 1;
        }
        else {
            departmentRatingMap.set(deptName, { ratingSum: review.rating, reviewCount: 1 });
        }
    }
    const performerSummaries = Array.from(employeeRatingMap.entries()).map(([employeeId, value]) => ({
        employeeId,
        employeeCode: value.employeeCode,
        name: value.name,
        department: value.department,
        averageRating: roundHours(value.ratingSum / value.reviewCount),
        reviewCount: value.reviewCount,
    }));
    const topPerformers = [...performerSummaries]
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);
    const lowPerformers = [...performerSummaries]
        .sort((a, b) => a.averageRating - b.averageRating)
        .slice(0, 5);
    const departmentPerformanceAverage = Array.from(departmentRatingMap.entries())
        .map(([department, value]) => ({
        department,
        averageRating: roundHours(value.ratingSum / value.reviewCount),
        reviewCount: value.reviewCount,
    }))
        .sort((a, b) => b.averageRating - a.averageRating);
    return {
        averageRating: roundHours((_j = averageAgg._avg.rating) !== null && _j !== void 0 ? _j : 0),
        reviewsThisMonth,
        topPerformers,
        lowPerformers,
        departmentPerformanceAverage,
    };
});
exports.getPerformanceDashboard = getPerformanceDashboard;
const getFullHRAnalytics = (organizationId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { start: monthStart, end: monthEnd } = getMonthRange(month, year);
    const todayStart = getStartOfLocalDay(new Date());
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const [totalEmployees, resignedEmployees, attendanceDashboard, payrollDashboard, employeesOnLeaveToday, overtimeAggregate, performanceDashboard,] = yield Promise.all([
        prisma_1.default.employee.count({ where: { organizationId } }),
        prisma_1.default.employee.count({ where: { organizationId, status: "RESIGNED" } }),
        (0, exports.getAttendanceDashboard)(organizationId),
        (0, exports.getPayrollDashboard)(organizationId, month, year),
        prisma_1.default.leaveRequest.count({
            where: {
                status: "APPROVED",
                startDate: { lt: tomorrowStart },
                endDate: { gte: todayStart },
                employee: { organizationId },
            },
        }),
        prisma_1.default.attendance.aggregate({
            where: {
                organizationId,
                date: {
                    gte: monthStart,
                    lt: monthEnd,
                },
            },
            _sum: {
                overtimeHours: true,
            },
        }),
        (0, exports.getPerformanceDashboard)(organizationId),
    ]);
    const attritionRate = totalEmployees === 0 ? 0 : roundHours((resignedEmployees / totalEmployees) * 100);
    return {
        totalEmployees,
        attendanceRate: attendanceDashboard.attendanceRate,
        totalPayrollCost: payrollDashboard.totalPayrollCost,
        averageSalary: payrollDashboard.averageSalary,
        employeesOnLeaveToday,
        overtimeHours: roundHours((_a = overtimeAggregate._sum.overtimeHours) !== null && _a !== void 0 ? _a : 0),
        attritionRate,
        performanceAverage: performanceDashboard.averageRating,
    };
});
exports.getFullHRAnalytics = getFullHRAnalytics;
// ============================================
// ORG STRUCTURE OPERATIONS
// ============================================
const createDepartment = (organizationId, name) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedName = name === null || name === void 0 ? void 0 : name.trim();
    if (!normalizedName) {
        throw new HttpError(400, "Department name is required");
    }
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    const existing = yield prisma_1.default.department.findFirst({
        where: {
            organizationId,
            name: normalizedName,
        },
        select: { id: true },
    });
    if (existing) {
        throw new HttpError(409, `Department "${normalizedName}" already exists`);
    }
    return prisma_1.default.department.create({
        data: {
            organizationId,
            name: normalizedName,
        },
    });
});
exports.createDepartment = createDepartment;
const createDesignation = (organizationId, title) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedTitle = title === null || title === void 0 ? void 0 : title.trim();
    if (!normalizedTitle) {
        throw new HttpError(400, "Designation title is required");
    }
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    const existing = yield prisma_1.default.designation.findFirst({
        where: {
            organizationId,
            title: normalizedTitle,
        },
        select: { id: true },
    });
    if (existing) {
        throw new HttpError(409, `Designation "${normalizedTitle}" already exists`);
    }
    return prisma_1.default.designation.create({
        data: {
            organizationId,
            title: normalizedTitle,
        },
    });
});
exports.createDesignation = createDesignation;
const createTeam = (organizationId, name) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedName = name === null || name === void 0 ? void 0 : name.trim();
    if (!normalizedName) {
        throw new HttpError(400, "Team name is required");
    }
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    const existing = yield prisma_1.default.team.findFirst({
        where: {
            organizationId,
            name: normalizedName,
        },
        select: { id: true },
    });
    if (existing) {
        throw new HttpError(409, `Team "${normalizedName}" already exists`);
    }
    return prisma_1.default.team.create({
        data: {
            organizationId,
            name: normalizedName,
        },
    });
});
exports.createTeam = createTeam;
const createLocation = (organizationId, name, address) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedName = name === null || name === void 0 ? void 0 : name.trim();
    if (!normalizedName) {
        throw new HttpError(400, "Location name is required");
    }
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    const existing = yield prisma_1.default.location.findFirst({
        where: {
            organizationId,
            name: normalizedName,
        },
        select: { id: true },
    });
    if (existing) {
        throw new HttpError(409, `Location "${normalizedName}" already exists`);
    }
    return prisma_1.default.location.create({
        data: {
            organizationId,
            name: normalizedName,
            address: (address === null || address === void 0 ? void 0 : address.trim()) || undefined,
        },
    });
});
exports.createLocation = createLocation;
const getOrgStructureSummary = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const [departments, designations, teams, locations] = yield Promise.all([
        prisma_1.default.department.findMany({
            where: { organizationId },
            include: { _count: { select: { employees: true } } },
        }),
        prisma_1.default.designation.findMany({
            where: { organizationId },
            include: { _count: { select: { employees: true } } },
        }),
        prisma_1.default.team.findMany({
            where: { organizationId },
            include: { _count: { select: { employees: true } } },
        }),
        prisma_1.default.location.findMany({
            where: { organizationId },
            include: { _count: { select: { employees: true } } },
        }),
    ]);
    return {
        departments,
        designations,
        teams,
        locations,
    };
});
exports.getOrgStructureSummary = getOrgStructureSummary;
/**
 * Builds organization hierarchy tree from pre-fetched employees
 * Uses in-memory tree construction for maximum performance
 * Avoids recursive DB queries by building map-based structure once
 *
 * Algorithm:
 * 1. Load all employees for organization (single DB query)
 * 2. Build Map for O(1) lookups
 * 3. Assign subordinates by iterating once
 * 4. Return root employees with nested structure
 * Performance: O(n) single pass, 1 DB query
 */
const buildOrganizationHierarchyTree = (employees) => {
    // Step 1: Create map of all employees for O(1) lookup
    const employeeMap = new Map();
    employees.forEach((emp) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        employeeMap.set(emp.id, {
            id: emp.id,
            employeeCode: emp.employeeCode,
            firstName: (_b = (_a = emp.user) === null || _a === void 0 ? void 0 : _a.firstName) !== null && _b !== void 0 ? _b : undefined,
            lastName: (_d = (_c = emp.user) === null || _c === void 0 ? void 0 : _c.lastName) !== null && _d !== void 0 ? _d : undefined,
            email: (_f = (_e = emp.user) === null || _e === void 0 ? void 0 : _e.email) !== null && _f !== void 0 ? _f : undefined,
            title: (_h = (_g = emp.designation) === null || _g === void 0 ? void 0 : _g.title) !== null && _h !== void 0 ? _h : undefined,
            department: (_k = (_j = emp.department) === null || _j === void 0 ? void 0 : _j.name) !== null && _k !== void 0 ? _k : undefined,
            subordinates: [],
        });
    });
    // Step 2: Assign subordinates by traversing once
    employees.forEach((emp) => {
        if (emp.managerId) {
            const manager = employeeMap.get(emp.managerId);
            if (manager) {
                const subordinate = employeeMap.get(emp.id);
                if (subordinate) {
                    manager.subordinates.push(subordinate);
                }
            }
        }
    });
    // Step 3: Get root employees (no manager) and sort by code
    const roots = employees
        .filter((emp) => !emp.managerId)
        .map((emp) => employeeMap.get(emp.id))
        .filter((node) => node !== undefined)
        .sort((a, b) => (a.employeeCode || "").localeCompare(b.employeeCode || ""));
    // Step 4: Sort subordinates recursively
    const sortSubordinates = (node) => {
        node.subordinates.sort((a, b) => (a.employeeCode || "").localeCompare(b.employeeCode || ""));
        node.subordinates.forEach(sortSubordinates);
    };
    roots.forEach(sortSubordinates);
    return roots;
};
/**
 * Retrieves the complete organizational hierarchy for an organization
 * Returns nested tree structure starting from all employees with no manager (top-level executives)
 *
 * Performance Strategy:
 * - Load all employees in ONE query (better than recursive queries)
 * - Build tree structure in memory (O(n) single pass)
 * - No recursive DB calls (enterprise-grade approach)
 *
 * Use cases:
 * - HR dashboard visualization of reporting structure
 * - Leave approval chain determination
 * - Performance review escalation paths
 * - Payroll reporting structure validation
 */
const getOrganizationHierarchy = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify organization exists
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    // SINGLE DB QUERY: Fetch all employees for organization with all relations
    const employees = yield prisma_1.default.employee.findMany({
        where: {
            organizationId,
            status: "ACTIVE",
        },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            designation: {
                select: { title: true },
            },
            department: {
                select: { name: true },
            },
        },
        orderBy: { employeeCode: "asc" },
    });
    // Build tree in memory (no more DB queries)
    const hierarchyTrees = buildOrganizationHierarchyTree(employees);
    return {
        organizationId,
        organizationName: org.name,
        hierarchy: hierarchyTrees,
        totalTopLevelEmployees: hierarchyTrees.length,
    };
});
exports.getOrganizationHierarchy = getOrganizationHierarchy;
