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
exports.getOrganizationHierarchyController = exports.getOrgStructureSummaryController = exports.createLocationController = exports.createTeamController = exports.createDesignationController = exports.createDepartmentController = exports.getFullHRAnalyticsController = exports.getPerformanceDashboardController = exports.getEmployeePerformanceHistoryController = exports.createPerformanceReviewController = exports.unassignSalaryComponentController = exports.assignSalaryComponentController = exports.deleteSalaryComponentController = exports.updateSalaryComponentController = exports.createSalaryComponentController = exports.listSalaryComponentsController = exports.downloadPayslipPdfController = exports.getPayrollAuditTrailController = exports.reconcilePayrollPaymentController = exports.updatePayrollPaymentController = exports.updatePayrollAdjustmentsController = exports.updatePayrollStatusController = exports.exportPayrollRegisterController = exports.getPayrollRegisterController = exports.getPayslipsController = exports.getPayrollDashboardController = exports.generatePayrollBulkController = exports.generatePayrollController = exports.getDailyAttendanceController = exports.getAttendanceDashboardController = exports.checkOutController = exports.checkInController = exports.assignShiftController = exports.assignManagerController = exports.changeEmployeeStatusController = exports.updateEmployeeController = exports.getEmployeeByIdController = exports.getEmployeesController = exports.createEmployeeController = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const hrm_service_1 = require("./hrm.service");
const handleControllerError = (res, error) => {
    if (error instanceof hrm_service_1.HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const getRequiredParam = (value, label) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (!normalized || !normalized.trim()) {
        throw new hrm_service_1.HttpError(400, `${label} is required`);
    }
    return normalized;
};
// ============================================
// EMPLOYEE CONTROLLERS
// ============================================
const createEmployeeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employee = yield (0, hrm_service_1.createEmployee)(req.user.organizationId, req.body);
        res.status(201).json(employee);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createEmployeeController = createEmployeeController;
const getEmployeesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employees = yield (0, hrm_service_1.getEmployees)(req.user.organizationId);
        res.status(200).json(employees);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getEmployeesController = getEmployeesController;
const getEmployeeByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
        const employee = yield (0, hrm_service_1.getEmployeeById)(employeeId, req.user.organizationId);
        res.status(200).json(employee);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getEmployeeByIdController = getEmployeeByIdController;
const updateEmployeeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
        const employee = yield (0, hrm_service_1.updateEmployee)(employeeId, req.user.organizationId, req.body);
        res.status(200).json(employee);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateEmployeeController = updateEmployeeController;
const changeEmployeeStatusController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
        const { status } = req.body;
        if (!status) {
            throw new hrm_service_1.HttpError(400, "status is required");
        }
        const employee = yield (0, hrm_service_1.changeEmployeeStatus)(employeeId, req.user.organizationId, status);
        res.status(200).json({ message: "Employee status updated", employee });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.changeEmployeeStatusController = changeEmployeeStatusController;
const assignManagerController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
        const { managerId } = req.body;
        if (!managerId) {
            throw new hrm_service_1.HttpError(400, "managerId is required");
        }
        const employee = yield (0, hrm_service_1.assignManager)(employeeId, req.user.organizationId, managerId);
        res.status(200).json({ message: "Manager assigned", employee });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.assignManagerController = assignManagerController;
const assignShiftController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
        const { shiftId } = req.body;
        if (!shiftId) {
            throw new hrm_service_1.HttpError(400, "shiftId is required");
        }
        const assignment = yield (0, hrm_service_1.assignShift)(employeeId, req.user.organizationId, shiftId);
        res.status(200).json({ message: "Shift assigned", assignment });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.assignShiftController = assignShiftController;
const checkInController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { employeeId, manual, checkInAt } = req.body;
        if (!employeeId) {
            throw new hrm_service_1.HttpError(400, "employeeId is required");
        }
        const result = yield (0, hrm_service_1.checkIn)(employeeId, req.user.organizationId, { manual, checkInAt });
        res.status(200).json(Object.assign({ message: "Check-in successful" }, result));
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.checkInController = checkInController;
const checkOutController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { employeeId, manual, checkOutAt } = req.body;
        if (!employeeId) {
            throw new hrm_service_1.HttpError(400, "employeeId is required");
        }
        const attendance = yield (0, hrm_service_1.checkOut)(employeeId, req.user.organizationId, { manual, checkOutAt });
        res.status(200).json({ message: "Check-out successful", attendance });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.checkOutController = checkOutController;
const getAttendanceDashboardController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dashboard = yield (0, hrm_service_1.getAttendanceDashboard)(req.user.organizationId);
        res.status(200).json(dashboard);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getAttendanceDashboardController = getAttendanceDashboardController;
const getDailyAttendanceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
        const payload = yield (0, hrm_service_1.getDailyAttendanceRecords)(req.user.organizationId, dateParam);
        res.status(200).json(payload);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getDailyAttendanceController = getDailyAttendanceController;
const generatePayrollController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { employeeId, month, year } = req.body;
        if (!employeeId) {
            throw new hrm_service_1.HttpError(400, "employeeId is required");
        }
        if (month === undefined || year === undefined) {
            throw new hrm_service_1.HttpError(400, "month and year are required");
        }
        const result = yield (0, hrm_service_1.generatePayroll)(employeeId, Number(month), Number(year), req.user.organizationId, req.user.id);
        res.status(201).json(Object.assign({ message: "Payroll generated successfully" }, result));
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.generatePayrollController = generatePayrollController;
const generatePayrollBulkController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { month, year } = req.body;
        if (month === undefined || year === undefined) {
            throw new hrm_service_1.HttpError(400, "month and year are required");
        }
        const result = yield (0, hrm_service_1.generatePayrollBulk)(req.user.organizationId, Number(month), Number(year), req.user.id);
        res.status(201).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.generatePayrollBulkController = generatePayrollBulkController;
const getPayrollDashboardController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        if (!Number.isFinite(month) || !Number.isFinite(year)) {
            throw new hrm_service_1.HttpError(400, "month and year query params are required");
        }
        const dashboard = yield (0, hrm_service_1.getPayrollDashboard)(req.user.organizationId, month, year);
        res.status(200).json(dashboard);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getPayrollDashboardController = getPayrollDashboardController;
const getPayslipsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const monthParam = req.query.month;
        const yearParam = req.query.year;
        const month = monthParam !== undefined ? Number(monthParam) : undefined;
        const year = yearParam !== undefined ? Number(yearParam) : undefined;
        if ((month !== undefined && !Number.isFinite(month)) || (year !== undefined && !Number.isFinite(year))) {
            throw new hrm_service_1.HttpError(400, "month and year must be valid numbers when provided");
        }
        const payslips = yield (0, hrm_service_1.getPayslips)(req.user.organizationId, month, year);
        res.status(200).json(payslips);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getPayslipsController = getPayslipsController;
const getPayrollRegisterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        if (!Number.isFinite(month) || !Number.isFinite(year)) {
            throw new hrm_service_1.HttpError(400, "month and year query params are required");
        }
        const register = yield (0, hrm_service_1.getPayrollRegister)(req.user.organizationId, month, year, search);
        res.status(200).json(register);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getPayrollRegisterController = getPayrollRegisterController;
const exportPayrollRegisterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        if (!Number.isFinite(month) || !Number.isFinite(year)) {
            throw new hrm_service_1.HttpError(400, "month and year query params are required");
        }
        const register = yield (0, hrm_service_1.getPayrollRegister)(req.user.organizationId, month, year, search);
        const header = [
            "Month",
            "Year",
            "Employee Code",
            "Employee Name",
            "Email",
            "Status",
            "Payment Status",
            "Gross Salary",
            "Net Salary",
            "Final Net Salary",
            "Statutory Tax",
            "Arrears",
            "Reimbursements",
            "Loans and Advances",
        ];
        const rows = register.records.map((record) => {
            var _a, _b, _c;
            return [
                String(month),
                String(year),
                record.employee.employeeCode,
                `${((_a = record.employee.user) === null || _a === void 0 ? void 0 : _a.firstName) || ""} ${((_b = record.employee.user) === null || _b === void 0 ? void 0 : _b.lastName) || ""}`.trim(),
                ((_c = record.employee.user) === null || _c === void 0 ? void 0 : _c.email) || "",
                record.status,
                record.paymentStatus,
                String(record.grossSalary),
                String(record.netSalary),
                String(record.finalNetSalary),
                String(record.statutoryTax),
                String(record.arrears),
                String(record.reimbursements),
                String(record.loansAndAdvances),
            ];
        });
        const escapeCsv = (value) => `"${value.replace(/"/g, '""')}"`;
        const csv = [header, ...rows].map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=payroll-register-${year}-${month}.csv`);
        res.status(200).send(csv);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.exportPayrollRegisterController = exportPayrollRegisterController;
const updatePayrollStatusController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
        const { status, note } = req.body;
        if (!status) {
            throw new hrm_service_1.HttpError(400, "status is required");
        }
        const result = yield (0, hrm_service_1.updatePayrollLifecycleStatus)(payslipId, req.user.organizationId, req.user.id, String(status).toUpperCase(), typeof note === "string" ? note : undefined);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updatePayrollStatusController = updatePayrollStatusController;
const updatePayrollAdjustmentsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
        const result = yield (0, hrm_service_1.updatePayrollAdjustments)(payslipId, req.user.organizationId, req.user.id, {
            statutoryTax: req.body.statutoryTax !== undefined ? Number(req.body.statutoryTax) : undefined,
            arrears: req.body.arrears !== undefined ? Number(req.body.arrears) : undefined,
            reimbursements: req.body.reimbursements !== undefined ? Number(req.body.reimbursements) : undefined,
            loansAndAdvances: req.body.loansAndAdvances !== undefined ? Number(req.body.loansAndAdvances) : undefined,
            note: typeof req.body.note === "string" ? req.body.note : undefined,
        });
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updatePayrollAdjustmentsController = updatePayrollAdjustmentsController;
const updatePayrollPaymentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
        const result = yield (0, hrm_service_1.updatePayrollPayment)(payslipId, req.user.organizationId, req.user.id, {
            paymentStatus: req.body.paymentStatus,
            paymentReference: req.body.paymentReference,
            bankTransferRef: req.body.bankTransferRef,
            note: req.body.note,
        });
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updatePayrollPaymentController = updatePayrollPaymentController;
const reconcilePayrollPaymentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
        const reconciled = Boolean(req.body.reconciled);
        const result = yield (0, hrm_service_1.reconcilePayrollPayment)(payslipId, req.user.organizationId, req.user.id, reconciled, typeof req.body.note === "string" ? req.body.note : undefined);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.reconcilePayrollPaymentController = reconcilePayrollPaymentController;
const getPayrollAuditTrailController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        if (!Number.isFinite(month) || !Number.isFinite(year)) {
            throw new hrm_service_1.HttpError(400, "month and year query params are required");
        }
        const entries = yield (0, hrm_service_1.getPayrollAuditTrail)(req.user.organizationId, month, year);
        res.status(200).json(entries);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getPayrollAuditTrailController = getPayrollAuditTrailController;
const downloadPayslipPdfController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
        const payslip = yield (0, hrm_service_1.getPayslipWithMetaById)(payslipId, req.user.organizationId);
        const employeeName = `${((_b = payslip.employee.user) === null || _b === void 0 ? void 0 : _b.firstName) || ""} ${((_c = payslip.employee.user) === null || _c === void 0 ? void 0 : _c.lastName) || ""}`.trim() || payslip.employee.employeeCode;
        const document = new pdfkit_1.default({ size: "A4", margin: 40 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=payslip-${payslip.year}-${payslip.month}-${payslip.employee.employeeCode}.pdf`);
        document.pipe(res);
        document.fontSize(18).text("Cambliss - Payroll Payslip", { align: "center" });
        document.moveDown(0.5);
        document.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
        document.moveDown(1);
        document.fontSize(12).text(`Employee: ${employeeName}`);
        document.text(`Employee Code: ${payslip.employee.employeeCode}`);
        document.text(`Email: ${((_d = payslip.employee.user) === null || _d === void 0 ? void 0 : _d.email) || "-"}`);
        document.text(`Designation: ${((_e = payslip.employee.designation) === null || _e === void 0 ? void 0 : _e.title) || "-"}`);
        document.text(`Payroll Month: ${payslip.month}/${payslip.year}`);
        document.moveDown(1);
        document.fontSize(12).text(`Status: ${payslip.status}`);
        document.text(`Payment Status: ${payslip.paymentStatus}`);
        document.moveDown(0.5);
        document.text(`Gross Salary: ${payslip.grossSalary}`);
        document.text(`Net Salary: ${payslip.netSalary}`);
        document.text(`Statutory Tax: ${payslip.statutoryTax}`);
        document.text(`Arrears: ${payslip.arrears}`);
        document.text(`Reimbursements: ${payslip.reimbursements}`);
        document.text(`Loans/Advances: ${payslip.loansAndAdvances}`);
        document.moveDown(0.5);
        document.fontSize(14).text(`Final Net Pay: ${payslip.finalNetSalary}`);
        document.end();
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.downloadPayslipPdfController = downloadPayslipPdfController;
const listSalaryComponentsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const components = yield (0, hrm_service_1.listSalaryComponents)(req.user.organizationId);
        res.status(200).json(components);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.listSalaryComponentsController = listSalaryComponentsController;
const createSalaryComponentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const component = yield (0, hrm_service_1.createSalaryComponent)(req.user.organizationId, {
            name: req.body.name,
            type: req.body.type,
            isPercentage: req.body.isPercentage,
            value: Number(req.body.value || 0),
        });
        res.status(201).json(component);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createSalaryComponentController = createSalaryComponentController;
const updateSalaryComponentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const componentId = getRequiredParam(req.params.componentId, "componentId");
        const component = yield (0, hrm_service_1.updateSalaryComponent)(componentId, req.user.organizationId, {
            name: req.body.name,
            type: req.body.type,
            isPercentage: req.body.isPercentage,
            value: req.body.value !== undefined ? Number(req.body.value) : undefined,
        });
        res.status(200).json(component);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateSalaryComponentController = updateSalaryComponentController;
const deleteSalaryComponentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const componentId = getRequiredParam(req.params.componentId, "componentId");
        const result = yield (0, hrm_service_1.deleteSalaryComponent)(componentId, req.user.organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deleteSalaryComponentController = deleteSalaryComponentController;
const assignSalaryComponentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { employeeId, componentId } = req.body;
        if (!employeeId || !componentId) {
            throw new hrm_service_1.HttpError(400, "employeeId and componentId are required");
        }
        const assignment = yield (0, hrm_service_1.assignSalaryComponentToEmployee)(employeeId, componentId, req.user.organizationId);
        res.status(201).json(assignment);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.assignSalaryComponentController = assignSalaryComponentController;
const unassignSalaryComponentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const componentId = getRequiredParam(req.params.componentId, "componentId");
        const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
        const result = yield (0, hrm_service_1.unassignSalaryComponentFromEmployee)(employeeId, componentId, req.user.organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.unassignSalaryComponentController = unassignSalaryComponentController;
const createPerformanceReviewController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { employeeId, reviewerId, rating, comments } = req.body;
        if (!employeeId || !reviewerId || rating === undefined) {
            throw new hrm_service_1.HttpError(400, "employeeId, reviewerId and rating are required");
        }
        const review = yield (0, hrm_service_1.createPerformanceReview)(employeeId, reviewerId, Number(rating), typeof comments === "string" ? comments : undefined, req.user.organizationId);
        res.status(201).json(review);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createPerformanceReviewController = createPerformanceReviewController;
const getEmployeePerformanceHistoryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
        const history = yield (0, hrm_service_1.getEmployeePerformanceHistory)(employeeId, req.user.organizationId);
        res.status(200).json(history);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getEmployeePerformanceHistoryController = getEmployeePerformanceHistoryController;
const getPerformanceDashboardController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dashboard = yield (0, hrm_service_1.getPerformanceDashboard)(req.user.organizationId);
        res.status(200).json(dashboard);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getPerformanceDashboardController = getPerformanceDashboardController;
const getFullHRAnalyticsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        if (!Number.isFinite(month) || !Number.isFinite(year)) {
            throw new hrm_service_1.HttpError(400, "month and year query params are required");
        }
        const analytics = yield (0, hrm_service_1.getFullHRAnalytics)(req.user.organizationId, month, year);
        res.status(200).json(analytics);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getFullHRAnalyticsController = getFullHRAnalyticsController;
// ============================================
// ORG STRUCTURE CONTROLLERS
// ============================================
const createDepartmentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { name } = req.body;
        if (!name) {
            throw new hrm_service_1.HttpError(400, "name is required");
        }
        const department = yield (0, hrm_service_1.createDepartment)(req.user.organizationId, name);
        res.status(201).json(department);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createDepartmentController = createDepartmentController;
const createDesignationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { title } = req.body;
        if (!title) {
            throw new hrm_service_1.HttpError(400, "title is required");
        }
        const designation = yield (0, hrm_service_1.createDesignation)(req.user.organizationId, title);
        res.status(201).json(designation);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createDesignationController = createDesignationController;
const createTeamController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { name } = req.body;
        if (!name) {
            throw new hrm_service_1.HttpError(400, "name is required");
        }
        const team = yield (0, hrm_service_1.createTeam)(req.user.organizationId, name);
        res.status(201).json(team);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createTeamController = createTeamController;
const createLocationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { name, address } = req.body;
        if (!name) {
            throw new hrm_service_1.HttpError(400, "name is required");
        }
        const location = yield (0, hrm_service_1.createLocation)(req.user.organizationId, name, address);
        res.status(201).json(location);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createLocationController = createLocationController;
const getOrgStructureSummaryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const summary = yield (0, hrm_service_1.getOrgStructureSummary)(req.user.organizationId);
        res.status(200).json(summary);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getOrgStructureSummaryController = getOrgStructureSummaryController;
const getOrganizationHierarchyController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const hierarchy = yield (0, hrm_service_1.getOrganizationHierarchy)(req.user.organizationId);
        res.status(200).json(hierarchy);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getOrganizationHierarchyController = getOrganizationHierarchyController;
