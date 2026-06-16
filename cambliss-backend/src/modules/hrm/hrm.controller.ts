import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import {
	assignManager,
	assignShift,
	checkIn,
	checkOut,
	changeEmployeeStatus,
	createDepartment,
	createDesignation,
	createEmployee,
	CreateEmployeeInput,
	createLocation,
	createTeam,
	createPerformanceReview,
	createSalaryComponent,
	generatePayroll,
	generatePayrollBulk,
	getAttendanceDashboard,
	getDailyAttendanceRecords,
	getEmployeeById,
	getEmployees,
	getPayslipWithMetaById,
	getPayrollAuditTrail,
	getPayrollRegister,
	getEmployeePerformanceHistory,
	getFullHRAnalytics,
	getOrgStructureSummary,
	getOrganizationHierarchy,
	getPerformanceDashboard,
	getPayrollDashboard,
	getPayslips,
	HttpError,
	listSalaryComponents,
	reconcilePayrollPayment,
	assignSalaryComponentToEmployee,
	unassignSalaryComponentFromEmployee,
	updatePayrollAdjustments,
	updatePayrollLifecycleStatus,
	updatePayrollPayment,
	updateSalaryComponent,
	deleteSalaryComponent,
	updateEmployee,
} from "./hrm.service";

const handleControllerError = (res: Response, error: unknown): void => {
	if (error instanceof HttpError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

const getRequiredParam = (value: string | string[] | undefined, label: string): string => {
	const normalized = Array.isArray(value) ? value[0] : value;

	if (!normalized || !normalized.trim()) {
		throw new HttpError(400, `${label} is required`);
	}

	return normalized;
};

// ============================================
// EMPLOYEE CONTROLLERS
// ============================================

export const createEmployeeController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employee = await createEmployee(req.user.organizationId, req.body as CreateEmployeeInput);
		res.status(201).json(employee);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getEmployeesController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employees = await getEmployees(req.user.organizationId);
		res.status(200).json(employees);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getEmployeeByIdController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
		const employee = await getEmployeeById(employeeId, req.user.organizationId);
		res.status(200).json(employee);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateEmployeeController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
		const employee = await updateEmployee(employeeId, req.user.organizationId, req.body);
		res.status(200).json(employee);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const changeEmployeeStatusController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
		const { status } = req.body;

		if (!status) {
			throw new HttpError(400, "status is required");
		}

		const employee = await changeEmployeeStatus(employeeId, req.user.organizationId, status);
		res.status(200).json({ message: "Employee status updated", employee });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const assignManagerController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
		const { managerId } = req.body;

		if (!managerId) {
			throw new HttpError(400, "managerId is required");
		}

		const employee = await assignManager(employeeId, req.user.organizationId, managerId);
		res.status(200).json({ message: "Manager assigned", employee });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const assignShiftController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
		const { shiftId } = req.body;

		if (!shiftId) {
			throw new HttpError(400, "shiftId is required");
		}

		const assignment = await assignShift(employeeId, req.user.organizationId, shiftId);
		res.status(200).json({ message: "Shift assigned", assignment });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const checkInController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { employeeId, manual, checkInAt } = req.body;

		if (!employeeId) {
			throw new HttpError(400, "employeeId is required");
		}

		const result = await checkIn(employeeId, req.user.organizationId, { manual, checkInAt });
		res.status(200).json({ message: "Check-in successful", ...result });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const checkOutController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { employeeId, manual, checkOutAt } = req.body;

		if (!employeeId) {
			throw new HttpError(400, "employeeId is required");
		}

		const attendance = await checkOut(employeeId, req.user.organizationId, { manual, checkOutAt });
		res.status(200).json({ message: "Check-out successful", attendance });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getAttendanceDashboardController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dashboard = await getAttendanceDashboard(req.user.organizationId);
		res.status(200).json(dashboard);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getDailyAttendanceController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;

		const payload = await getDailyAttendanceRecords(req.user.organizationId, dateParam);
		res.status(200).json(payload);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const generatePayrollController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { employeeId, month, year } = req.body;

		if (!employeeId) {
			throw new HttpError(400, "employeeId is required");
		}

		if (month === undefined || year === undefined) {
			throw new HttpError(400, "month and year are required");
		}

		const result = await generatePayroll(employeeId, Number(month), Number(year), req.user.organizationId, req.user.id);
		res.status(201).json({ message: "Payroll generated successfully", ...result });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const generatePayrollBulkController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { month, year } = req.body;
		if (month === undefined || year === undefined) {
			throw new HttpError(400, "month and year are required");
		}

		const result = await generatePayrollBulk(req.user.organizationId, Number(month), Number(year), req.user.id);
		res.status(201).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getPayrollDashboardController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const month = Number(req.query.month);
		const year = Number(req.query.year);

		if (!Number.isFinite(month) || !Number.isFinite(year)) {
			throw new HttpError(400, "month and year query params are required");
		}

		const dashboard = await getPayrollDashboard(req.user.organizationId, month, year);
		res.status(200).json(dashboard);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getPayslipsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const monthParam = req.query.month;
		const yearParam = req.query.year;
		const month = monthParam !== undefined ? Number(monthParam) : undefined;
		const year = yearParam !== undefined ? Number(yearParam) : undefined;

		if ((month !== undefined && !Number.isFinite(month)) || (year !== undefined && !Number.isFinite(year))) {
			throw new HttpError(400, "month and year must be valid numbers when provided");
		}

		const payslips = await getPayslips(req.user.organizationId, month, year);
		res.status(200).json(payslips);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getPayrollRegisterController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const month = Number(req.query.month);
		const year = Number(req.query.year);
		const search = typeof req.query.search === "string" ? req.query.search : undefined;
		if (!Number.isFinite(month) || !Number.isFinite(year)) {
			throw new HttpError(400, "month and year query params are required");
		}

		const register = await getPayrollRegister(req.user.organizationId, month, year, search);
		res.status(200).json(register);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const exportPayrollRegisterController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const month = Number(req.query.month);
		const year = Number(req.query.year);
		const search = typeof req.query.search === "string" ? req.query.search : undefined;
		if (!Number.isFinite(month) || !Number.isFinite(year)) {
			throw new HttpError(400, "month and year query params are required");
		}

		const register = await getPayrollRegister(req.user.organizationId, month, year, search);
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
		const rows = register.records.map((record) => [
			String(month),
			String(year),
			record.employee.employeeCode,
			`${record.employee.user?.firstName || ""} ${record.employee.user?.lastName || ""}`.trim(),
			record.employee.user?.email || "",
			record.status,
			record.paymentStatus,
			String(record.grossSalary),
			String(record.netSalary),
			String(record.finalNetSalary),
			String(record.statutoryTax),
			String(record.arrears),
			String(record.reimbursements),
			String(record.loansAndAdvances),
		]);

		const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
		const csv = [header, ...rows].map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename=payroll-register-${year}-${month}.csv`);
		res.status(200).send(csv);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updatePayrollStatusController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
		const { status, note } = req.body;
		if (!status) {
			throw new HttpError(400, "status is required");
		}

		const result = await updatePayrollLifecycleStatus(
			payslipId,
			req.user.organizationId,
			req.user.id,
			String(status).toUpperCase() as "DRAFT" | "APPROVED" | "PAID" | "LOCKED",
			typeof note === "string" ? note : undefined,
		);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updatePayrollAdjustmentsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
		const result = await updatePayrollAdjustments(payslipId, req.user.organizationId, req.user.id, {
			statutoryTax: req.body.statutoryTax !== undefined ? Number(req.body.statutoryTax) : undefined,
			arrears: req.body.arrears !== undefined ? Number(req.body.arrears) : undefined,
			reimbursements: req.body.reimbursements !== undefined ? Number(req.body.reimbursements) : undefined,
			loansAndAdvances: req.body.loansAndAdvances !== undefined ? Number(req.body.loansAndAdvances) : undefined,
			note: typeof req.body.note === "string" ? req.body.note : undefined,
		});
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updatePayrollPaymentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
		const result = await updatePayrollPayment(payslipId, req.user.organizationId, req.user.id, {
			paymentStatus: req.body.paymentStatus,
			paymentReference: req.body.paymentReference,
			bankTransferRef: req.body.bankTransferRef,
			note: req.body.note,
		});
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const reconcilePayrollPaymentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
		const reconciled = Boolean(req.body.reconciled);
		const result = await reconcilePayrollPayment(
			payslipId,
			req.user.organizationId,
			req.user.id,
			reconciled,
			typeof req.body.note === "string" ? req.body.note : undefined,
		);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getPayrollAuditTrailController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const month = Number(req.query.month);
		const year = Number(req.query.year);
		if (!Number.isFinite(month) || !Number.isFinite(year)) {
			throw new HttpError(400, "month and year query params are required");
		}

		const entries = await getPayrollAuditTrail(req.user.organizationId, month, year);
		res.status(200).json(entries);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const downloadPayslipPdfController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const payslipId = getRequiredParam(req.params.payslipId, "payslipId");
		const payslip = await getPayslipWithMetaById(payslipId, req.user.organizationId);

		const employeeName = `${payslip.employee.user?.firstName || ""} ${payslip.employee.user?.lastName || ""}`.trim() || payslip.employee.employeeCode;
		const document = new PDFDocument({ size: "A4", margin: 40 });

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename=payslip-${payslip.year}-${payslip.month}-${payslip.employee.employeeCode}.pdf`);
		document.pipe(res);

		document.fontSize(18).text("Cambliss - Payroll Payslip", { align: "center" });
		document.moveDown(0.5);
		document.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
		document.moveDown(1);

		document.fontSize(12).text(`Employee: ${employeeName}`);
		document.text(`Employee Code: ${payslip.employee.employeeCode}`);
		document.text(`Email: ${payslip.employee.user?.email || "-"}`);
		document.text(`Designation: ${payslip.employee.designation?.title || "-"}`);
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
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const listSalaryComponentsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const components = await listSalaryComponents(req.user.organizationId);
		res.status(200).json(components);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createSalaryComponentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const component = await createSalaryComponent(req.user.organizationId, {
			name: req.body.name,
			type: req.body.type,
			isPercentage: req.body.isPercentage,
			value: Number(req.body.value || 0),
		});

		res.status(201).json(component);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateSalaryComponentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const componentId = getRequiredParam(req.params.componentId, "componentId");
		const component = await updateSalaryComponent(componentId, req.user.organizationId, {
			name: req.body.name,
			type: req.body.type,
			isPercentage: req.body.isPercentage,
			value: req.body.value !== undefined ? Number(req.body.value) : undefined,
		});

		res.status(200).json(component);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deleteSalaryComponentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const componentId = getRequiredParam(req.params.componentId, "componentId");
		const result = await deleteSalaryComponent(componentId, req.user.organizationId);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const assignSalaryComponentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { employeeId, componentId } = req.body;
		if (!employeeId || !componentId) {
			throw new HttpError(400, "employeeId and componentId are required");
		}

		const assignment = await assignSalaryComponentToEmployee(employeeId, componentId, req.user.organizationId);
		res.status(201).json(assignment);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const unassignSalaryComponentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const componentId = getRequiredParam(req.params.componentId, "componentId");
		const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
		const result = await unassignSalaryComponentFromEmployee(employeeId, componentId, req.user.organizationId);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createPerformanceReviewController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { employeeId, reviewerId, rating, comments } = req.body;

		if (!employeeId || !reviewerId || rating === undefined) {
			throw new HttpError(400, "employeeId, reviewerId and rating are required");
		}

		const review = await createPerformanceReview(
			employeeId,
			reviewerId,
			Number(rating),
			typeof comments === "string" ? comments : undefined,
			req.user.organizationId,
		);

		res.status(201).json(review);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getEmployeePerformanceHistoryController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const employeeId = getRequiredParam(req.params.employeeId, "employeeId");
		const history = await getEmployeePerformanceHistory(employeeId, req.user.organizationId);
		res.status(200).json(history);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getPerformanceDashboardController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dashboard = await getPerformanceDashboard(req.user.organizationId);
		res.status(200).json(dashboard);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getFullHRAnalyticsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const month = Number(req.query.month);
		const year = Number(req.query.year);

		if (!Number.isFinite(month) || !Number.isFinite(year)) {
			throw new HttpError(400, "month and year query params are required");
		}

		const analytics = await getFullHRAnalytics(req.user.organizationId, month, year);
		res.status(200).json(analytics);
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// ORG STRUCTURE CONTROLLERS
// ============================================

export const createDepartmentController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { name } = req.body;

		if (!name) {
			throw new HttpError(400, "name is required");
		}

		const department = await createDepartment(req.user.organizationId, name);
		res.status(201).json(department);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createDesignationController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { title } = req.body;

		if (!title) {
			throw new HttpError(400, "title is required");
		}

		const designation = await createDesignation(req.user.organizationId, title);
		res.status(201).json(designation);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createTeamController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { name } = req.body;

		if (!name) {
			throw new HttpError(400, "name is required");
		}

		const team = await createTeam(req.user.organizationId, name);
		res.status(201).json(team);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createLocationController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const { name, address } = req.body;

		if (!name) {
			throw new HttpError(400, "name is required");
		}

		const location = await createLocation(req.user.organizationId, name, address);
		res.status(201).json(location);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getOrgStructureSummaryController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const summary = await getOrgStructureSummary(req.user.organizationId);
		res.status(200).json(summary);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getOrganizationHierarchyController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const hierarchy = await getOrganizationHierarchy(req.user.organizationId);
		res.status(200).json(hierarchy);
	} catch (error) {
		handleControllerError(res, error);
	}
};
