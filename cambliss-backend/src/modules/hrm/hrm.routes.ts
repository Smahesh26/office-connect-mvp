import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { moduleGuard } from "../../middleware/module.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	assignManagerController,
	assignShiftController,
	checkInController,
	checkOutController,
	changeEmployeeStatusController,
	createDepartmentController,
	createDesignationController,
	createEmployeeController,
	createSalaryComponentController,
	createPerformanceReviewController,
	createLocationController,
	createTeamController,
	deleteSalaryComponentController,
	downloadPayslipPdfController,
	exportPayrollRegisterController,
	generatePayrollController,
	generatePayrollBulkController,
	getAttendanceDashboardController,
	getDailyAttendanceController,
	getEmployeePerformanceHistoryController,
	getFullHRAnalyticsController,
	getEmployeeByIdController,
	getEmployeesController,
	getOrgStructureSummaryController,
	getOrganizationHierarchyController,
	getPayrollAuditTrailController,
	getPayrollRegisterController,
	getPerformanceDashboardController,
	getPayrollDashboardController,
	getPayslipsController,
	listSalaryComponentsController,
	reconcilePayrollPaymentController,
	assignSalaryComponentController,
	unassignSalaryComponentController,
	updatePayrollAdjustmentsController,
	updatePayrollPaymentController,
	updatePayrollStatusController,
	updateSalaryComponentController,
	updateEmployeeController,
} from "./hrm.controller";

const hrmRouter = Router();

// ============================================
// MIDDLEWARE: Protected by JWT, Subscription, Module
// ============================================

hrmRouter.use(authenticateJWT, requireActiveSubscription, moduleGuard("HRM"));

// ============================================
// EMPLOYEE ROUTES
// ============================================

hrmRouter.post("/employees", createEmployeeController);
hrmRouter.get("/employees", getEmployeesController);
hrmRouter.get("/employees/:employeeId", getEmployeeByIdController);
hrmRouter.put("/employees/:employeeId", updateEmployeeController);
hrmRouter.put("/employees/:employeeId/status", changeEmployeeStatusController);
hrmRouter.put("/employees/:employeeId/manager", assignManagerController);
hrmRouter.post("/employees/:employeeId/shifts", assignShiftController);
hrmRouter.post("/attendance/check-in", checkInController);
hrmRouter.post("/attendance/check-out", checkOutController);
hrmRouter.get("/attendance/dashboard", getAttendanceDashboardController);
hrmRouter.get("/attendance/daily", getDailyAttendanceController);
hrmRouter.post("/payroll/generate", generatePayrollController);
hrmRouter.post("/payroll/generate-bulk", generatePayrollBulkController);
hrmRouter.get("/payroll/dashboard", getPayrollDashboardController);
hrmRouter.get("/payroll/payslips", getPayslipsController);
hrmRouter.get("/payroll/register", getPayrollRegisterController);
hrmRouter.get("/payroll/register/export", exportPayrollRegisterController);
hrmRouter.put("/payroll/payslips/:payslipId/status", updatePayrollStatusController);
hrmRouter.put("/payroll/payslips/:payslipId/adjustments", updatePayrollAdjustmentsController);
hrmRouter.put("/payroll/payslips/:payslipId/payment", updatePayrollPaymentController);
hrmRouter.put("/payroll/payslips/:payslipId/reconcile", reconcilePayrollPaymentController);
hrmRouter.get("/payroll/payslips/:payslipId/pdf", downloadPayslipPdfController);
hrmRouter.get("/payroll/audit", getPayrollAuditTrailController);
hrmRouter.get("/payroll/components", listSalaryComponentsController);
hrmRouter.post("/payroll/components", createSalaryComponentController);
hrmRouter.put("/payroll/components/:componentId", updateSalaryComponentController);
hrmRouter.delete("/payroll/components/:componentId", deleteSalaryComponentController);
hrmRouter.post("/payroll/components/assign", assignSalaryComponentController);
hrmRouter.delete("/payroll/components/:componentId/employees/:employeeId", unassignSalaryComponentController);
hrmRouter.post("/performance/review", createPerformanceReviewController);
hrmRouter.get("/performance/dashboard", getPerformanceDashboardController);
hrmRouter.get("/performance/:employeeId", getEmployeePerformanceHistoryController);
hrmRouter.get("/analytics", getFullHRAnalyticsController);

// ============================================
// ORG STRUCTURE ROUTES
// ============================================

hrmRouter.post("/departments", createDepartmentController);
hrmRouter.post("/designations", createDesignationController);
hrmRouter.post("/teams", createTeamController);
hrmRouter.post("/locations", createLocationController);
hrmRouter.get("/structure", getOrgStructureSummaryController);
hrmRouter.get("/hierarchy", getOrganizationHierarchyController);

export default hrmRouter;
