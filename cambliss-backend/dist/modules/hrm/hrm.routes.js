"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const module_middleware_1 = require("../../middleware/module.middleware");
const subscription_middleware_1 = require("../../middleware/subscription.middleware");
const hrm_controller_1 = require("./hrm.controller");
const hrmRouter = (0, express_1.Router)();
// ============================================
// MIDDLEWARE: Protected by JWT, Subscription, Module
// ============================================
hrmRouter.use(auth_middleware_1.authenticateJWT, subscription_middleware_1.requireActiveSubscription, (0, module_middleware_1.moduleGuard)("HRM"));
// ============================================
// EMPLOYEE ROUTES
// ============================================
hrmRouter.post("/employees", hrm_controller_1.createEmployeeController);
hrmRouter.get("/employees", hrm_controller_1.getEmployeesController);
hrmRouter.get("/employees/:employeeId", hrm_controller_1.getEmployeeByIdController);
hrmRouter.put("/employees/:employeeId", hrm_controller_1.updateEmployeeController);
hrmRouter.put("/employees/:employeeId/status", hrm_controller_1.changeEmployeeStatusController);
hrmRouter.put("/employees/:employeeId/manager", hrm_controller_1.assignManagerController);
hrmRouter.post("/employees/:employeeId/shifts", hrm_controller_1.assignShiftController);
hrmRouter.post("/attendance/check-in", hrm_controller_1.checkInController);
hrmRouter.post("/attendance/check-out", hrm_controller_1.checkOutController);
hrmRouter.get("/attendance/dashboard", hrm_controller_1.getAttendanceDashboardController);
hrmRouter.get("/attendance/daily", hrm_controller_1.getDailyAttendanceController);
hrmRouter.post("/payroll/generate", hrm_controller_1.generatePayrollController);
hrmRouter.post("/payroll/generate-bulk", hrm_controller_1.generatePayrollBulkController);
hrmRouter.get("/payroll/dashboard", hrm_controller_1.getPayrollDashboardController);
hrmRouter.get("/payroll/payslips", hrm_controller_1.getPayslipsController);
hrmRouter.get("/payroll/register", hrm_controller_1.getPayrollRegisterController);
hrmRouter.get("/payroll/register/export", hrm_controller_1.exportPayrollRegisterController);
hrmRouter.put("/payroll/payslips/:payslipId/status", hrm_controller_1.updatePayrollStatusController);
hrmRouter.put("/payroll/payslips/:payslipId/adjustments", hrm_controller_1.updatePayrollAdjustmentsController);
hrmRouter.put("/payroll/payslips/:payslipId/payment", hrm_controller_1.updatePayrollPaymentController);
hrmRouter.put("/payroll/payslips/:payslipId/reconcile", hrm_controller_1.reconcilePayrollPaymentController);
hrmRouter.get("/payroll/payslips/:payslipId/pdf", hrm_controller_1.downloadPayslipPdfController);
hrmRouter.get("/payroll/audit", hrm_controller_1.getPayrollAuditTrailController);
hrmRouter.get("/payroll/components", hrm_controller_1.listSalaryComponentsController);
hrmRouter.post("/payroll/components", hrm_controller_1.createSalaryComponentController);
hrmRouter.put("/payroll/components/:componentId", hrm_controller_1.updateSalaryComponentController);
hrmRouter.delete("/payroll/components/:componentId", hrm_controller_1.deleteSalaryComponentController);
hrmRouter.post("/payroll/components/assign", hrm_controller_1.assignSalaryComponentController);
hrmRouter.delete("/payroll/components/:componentId/employees/:employeeId", hrm_controller_1.unassignSalaryComponentController);
hrmRouter.post("/performance/review", hrm_controller_1.createPerformanceReviewController);
hrmRouter.get("/performance/dashboard", hrm_controller_1.getPerformanceDashboardController);
hrmRouter.get("/performance/:employeeId", hrm_controller_1.getEmployeePerformanceHistoryController);
hrmRouter.get("/analytics", hrm_controller_1.getFullHRAnalyticsController);
// ============================================
// ORG STRUCTURE ROUTES
// ============================================
hrmRouter.post("/departments", hrm_controller_1.createDepartmentController);
hrmRouter.post("/designations", hrm_controller_1.createDesignationController);
hrmRouter.post("/teams", hrm_controller_1.createTeamController);
hrmRouter.post("/locations", hrm_controller_1.createLocationController);
hrmRouter.get("/structure", hrm_controller_1.getOrgStructureSummaryController);
hrmRouter.get("/hierarchy", hrm_controller_1.getOrganizationHierarchyController);
exports.default = hrmRouter;
