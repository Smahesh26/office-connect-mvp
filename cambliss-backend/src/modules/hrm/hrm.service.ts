import prisma from "../../config/prisma";
import { promises as fs } from "fs";
import path from "path";

export class HttpError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "HttpError";
	}
}

type PayrollLifecycleStatus = "DRAFT" | "APPROVED" | "PAID" | "LOCKED";
type PayrollPaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

type PayrollAuditEntry = {
	id: string;
	payslipId: string;
	organizationId: string;
	action: string;
	actorId: string;
	beforeStatus: PayrollLifecycleStatus | null;
	afterStatus: PayrollLifecycleStatus | null;
	note: string | null;
	createdAt: string;
};

type PayrollMeta = {
	status: PayrollLifecycleStatus;
	paymentStatus: PayrollPaymentStatus;
	statutoryTax: number;
	arrears: number;
	reimbursements: number;
	loansAndAdvances: number;
	paymentReference: string | null;
	bankTransferRef: string | null;
	paymentReconciled: boolean;
	paidAt: string | null;
	audits: PayrollAuditEntry[];
};

const PAYROLL_META_FILE_PATH = path.join(process.cwd(), "data", "payroll-meta.json");

const defaultPayrollMeta = (): PayrollMeta => ({
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

const ensurePayrollMetaFile = async () => {
	const dir = path.dirname(PAYROLL_META_FILE_PATH);
	await fs.mkdir(dir, { recursive: true });

	try {
		await fs.access(PAYROLL_META_FILE_PATH);
	} catch {
		await fs.writeFile(PAYROLL_META_FILE_PATH, JSON.stringify({}, null, 2), "utf-8");
	}
};

const readPayrollMetaStore = async (): Promise<Record<string, PayrollMeta>> => {
	await ensurePayrollMetaFile();
	const raw = await fs.readFile(PAYROLL_META_FILE_PATH, "utf-8");
	if (!raw.trim()) {
		return {};
	}

	try {
		return JSON.parse(raw) as Record<string, PayrollMeta>;
	} catch {
		return {};
	}
};

const writePayrollMetaStore = async (store: Record<string, PayrollMeta>) => {
	await ensurePayrollMetaFile();
	await fs.writeFile(PAYROLL_META_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
};

const getPayrollMetaByPayslipId = async (payslipId: string): Promise<PayrollMeta> => {
	const store = await readPayrollMetaStore();
	return store[payslipId] || defaultPayrollMeta();
};

const upsertPayrollMetaByPayslipId = async (payslipId: string, nextMeta: PayrollMeta) => {
	const store = await readPayrollMetaStore();
	store[payslipId] = nextMeta;
	await writePayrollMetaStore(store);
};

const appendPayrollAudit = async (
	payslipId: string,
	organizationId: string,
	actorId: string,
	action: string,
	beforeStatus: PayrollLifecycleStatus | null,
	afterStatus: PayrollLifecycleStatus | null,
	note?: string,
) => {
	const meta = await getPayrollMetaByPayslipId(payslipId);
	const entry: PayrollAuditEntry = {
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
	await upsertPayrollMetaByPayslipId(payslipId, meta);
};

// ============================================
// PRIVATE VALIDATION HELPERS
// ============================================

/**
 * Private: Validates that an employee exists and belongs to organization
 */
const validateEmployeeExists = async (employeeId: string, organizationId: string) => {
	const employee = await prisma.employee.findUnique({
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
};

/**
 * Private: Validates that a department exists and belongs to organization
 */
const validateDepartmentExists = async (departmentId: string, organizationId: string) => {
	const dept = await prisma.department.findUnique({
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
};

/**
 * Private: Validates that a designation exists and belongs to organization
 */
const validateDesignationExists = async (designationId: string, organizationId: string) => {
	const desig = await prisma.designation.findUnique({
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
};

/**
 * Private: Validates that a team exists and belongs to organization
 */
const validateTeamExists = async (teamId: string, organizationId: string) => {
	const team = await prisma.team.findUnique({
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
};

/**
 * Private: Validates that a location exists and belongs to organization
 */
const validateLocationExists = async (locationId: string, organizationId: string) => {
	const loc = await prisma.location.findUnique({
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
};

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
const validateManagerHierarchy = async (
	employeeId: string,
	newManagerId: string,
	organizationId: string,
) => {
	// Step 1: Self-assignment check (employee cannot be their own manager)
	if (employeeId === newManagerId) {
		throw new HttpError(400, "Employee cannot be their own manager");
	}

	// Step 2: Verify new manager exists and belongs to organization
	await validateEmployeeExists(newManagerId, organizationId);

	// Step 3 & 4: Detect circular reference by traversing entire manager chain
	let currentManagerId: string | null = newManagerId;
	const visitedManagers = new Set<string>();

	while (currentManagerId) {
		// Check if we've already visited this manager (loop detection)
		if (visitedManagers.has(currentManagerId)) {
			throw new HttpError(
				400,
				"Circular reporting structure detected. Cannot create a reporting loop in manager hierarchy.",
			);
		}

		// Check if current manager is the employee we're trying to assign
		if (currentManagerId === employeeId) {
			throw new HttpError(
				400,
				`Circular reporting structure detected: Assigning this manager would create a loop where the employee reports to one of their own subordinates.`,
			);
		}

		visitedManagers.add(currentManagerId);

		// Move to parent manager
		const manager: { managerId: string | null } | null = await prisma.employee.findUnique({
			where: { id: currentManagerId },
			select: { managerId: true },
		});

		currentManagerId = manager?.managerId || null;
	}

	// Step 5: Reached top of hierarchy without circular reference - assignment is safe
};

// ============================================
// VALIDATION HELPERS (Public)
// ============================================

export const validateEmployeeBelongsToOrg = validateEmployeeExists;

// ============================================
// EMPLOYEE CRUD OPERATIONS
// ============================================

export interface CreateEmployeeInput {
	employeeCode: string;
	userId?: string;
	departmentId?: string;
	designationId?: string;
	teamId?: string;
	locationId?: string;
	managerId?: string;
	joinDate: Date | string;
	confirmationDate?: Date | string;
	employmentType: string;
	workMode: string;
	salary: number;
	bankAccountNumber?: string;
	bankIFSC?: string;
	taxId?: string;
	dateOfBirth?: Date | string;
	gender?: string;
	phone?: string;
	address?: string;
	emergencyContactName?: string;
	emergencyContactPhone?: string;
}

const parseDateInput = (value: Date | string | undefined, fieldName: string, required = false) => {
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

export const createEmployee = async (organizationId: string, input: CreateEmployeeInput) => {
	const joinDate = parseDateInput(input.joinDate, "joinDate", true);
	const confirmationDate = parseDateInput(input.confirmationDate, "confirmationDate");
	const dateOfBirth = parseDateInput(input.dateOfBirth, "dateOfBirth");

	if (!joinDate) {
		throw new HttpError(400, "joinDate is required");
	}

	// Validate org exists
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	// Validate employee code is unique per org
	const existingCode = await prisma.employee.findFirst({
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
		const user = await prisma.user.findUnique({
			where: { id: input.userId },
			select: { id: true },
		});

		if (!user) {
			throw new HttpError(404, "User not found");
		}
	}

	// Validate all org-scoped relations belong to this org
	if (input.departmentId) {
		await validateDepartmentExists(input.departmentId, organizationId);
	}

	if (input.designationId) {
		await validateDesignationExists(input.designationId, organizationId);
	}

	if (input.teamId) {
		await validateTeamExists(input.teamId, organizationId);
	}

	if (input.locationId) {
		await validateLocationExists(input.locationId, organizationId);
	}

	// Validate manager and hierarchy
	if (input.managerId) {
		await validateManagerHierarchy(generateTempId(), input.managerId, organizationId);
	}

	return prisma.employee.create({
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
};

// Helper to generate a temporary ID for new employees (for hierarchy validation)
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const getEmployees = async (organizationId: string) => {
	return prisma.employee.findMany({
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
};

export const getEmployeeById = async (employeeId: string, organizationId: string) => {
	const employee = await prisma.employee.findUnique({
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
};

export const updateEmployee = async (
	employeeId: string,
	organizationId: string,
	input: Partial<CreateEmployeeInput>,
) => {
	// Validate employee exists in org
	await validateEmployeeExists(employeeId, organizationId);

	// Validate all relations
	if (input.departmentId) {
		await validateDepartmentExists(input.departmentId, organizationId);
	}

	if (input.designationId) {
		await validateDesignationExists(input.designationId, organizationId);
	}

	if (input.teamId) {
		await validateTeamExists(input.teamId, organizationId);
	}

	if (input.locationId) {
		await validateLocationExists(input.locationId, organizationId);
	}

	// Validate manager and hierarchy if changing
	if (input.managerId) {
		await validateManagerHierarchy(employeeId, input.managerId, organizationId);
	}

	const data: Record<string, unknown> = {};

	if (input.departmentId !== undefined) data.department = input.departmentId ? { connect: { id: input.departmentId } } : { disconnect: true };
	if (input.designationId !== undefined) data.designation = input.designationId ? { connect: { id: input.designationId } } : { disconnect: true };
	if (input.teamId !== undefined) data.team = input.teamId ? { connect: { id: input.teamId } } : { disconnect: true };
	if (input.locationId !== undefined) data.location = input.locationId ? { connect: { id: input.locationId } } : { disconnect: true };
	if (input.managerId !== undefined) data.manager = input.managerId ? { connect: { id: input.managerId } } : { disconnect: true };
	if (input.phone !== undefined) data.phone = input.phone;
	if (input.address !== undefined) data.address = input.address;
	if (input.salary !== undefined) data.salary = input.salary;
	if (input.bankAccountNumber !== undefined) data.bankAccountNumber = input.bankAccountNumber;
	if (input.bankIFSC !== undefined) data.bankIFSC = input.bankIFSC;
	if (input.taxId !== undefined) data.taxId = input.taxId;
	if (input.joinDate !== undefined) data.joinDate = parseDateInput(input.joinDate, "joinDate");
	if (input.confirmationDate !== undefined) {
		data.confirmationDate = parseDateInput(input.confirmationDate, "confirmationDate");
	}
	if (input.dateOfBirth !== undefined) data.dateOfBirth = parseDateInput(input.dateOfBirth, "dateOfBirth");

	return prisma.employee.update({
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
};

export const changeEmployeeStatus = async (
	employeeId: string,
	organizationId: string,
	newStatus: string,
) => {
	await validateEmployeeExists(employeeId, organizationId);

	const validStatuses = ["ACTIVE", "RESIGNED", "TERMINATED", "ON_LEAVE"];

	if (!validStatuses.includes(newStatus)) {
		throw new HttpError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
	}

	// Get current employee for status transition validation
	const employee = await prisma.employee.findUnique({
		where: { id: employeeId },
		select: { status: true },
	});

	// Business rule: TERMINATED cannot revert without explicit override
	if (employee?.status === "TERMINATED" && newStatus !== "TERMINATED") {
		throw new HttpError(400, "Terminated employees cannot be re-activated without HR override. Contact HR administrator.");
	}

	return prisma.employee.update({
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
};

export const assignManager = async (
	employeeId: string,
	organizationId: string,
	managerId: string,
) => {
	await validateEmployeeExists(employeeId, organizationId);
	await validateManagerHierarchy(employeeId, managerId, organizationId);

	return prisma.employee.update({
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
};

export const assignShift = async (
	employeeId: string,
	organizationId: string,
	shiftId: string,
) => {
	await validateEmployeeExists(employeeId, organizationId);

	const shift = await prisma.shift.findUnique({
		where: { id: shiftId },
		select: { id: true, organizationId: true },
	});

	if (!shift) throw new HttpError(404, "Shift not found");
	if (shift.organizationId !== organizationId)
		throw new HttpError(403, "Shift does not belong to this organization");

	// Check for duplicate shift assignment
	const existingAssignment = await prisma.employeeShift.findFirst({
		where: {
			employeeId,
			shiftId,
		},
	});

	if (existingAssignment) {
		throw new HttpError(400, "Employee is already assigned to this shift");
	}

	return prisma.employeeShift.create({
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
};

export const assignShiftToEmployee = async (
	employeeId: string,
	shiftId: string,
	organizationId: string,
) => assignShift(employeeId, organizationId, shiftId);

const getStartOfLocalDay = (date: Date): Date => {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const parseDateOnlyInput = (value: string | undefined): Date => {
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

const parseShiftTimeForDate = (date: Date, shiftTime: string): Date => {
	const [hourPart, minutePart] = shiftTime.split(":");
	const hours = Number(hourPart);
	const minutes = Number(minutePart);

	if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		throw new HttpError(400, `Invalid shift time format: ${shiftTime}. Expected HH:mm`);
	}

	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		hours,
		minutes,
		0,
		0,
	);
};

const roundHours = (value: number): number => Number(value.toFixed(2));

const parseAttendanceDateTime = (
	value: Date | string | undefined,
	fieldName: string,
): Date | undefined => {
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

const getAttendanceContext = async (
	employeeId: string,
	organizationId: string,
	requireShift: boolean,
) => {
	await validateEmployeeExists(employeeId, organizationId);

	const employee = await prisma.employee.findUnique({
		where: { id: employeeId },
		select: { id: true, status: true },
	});

	if (!employee) {
		throw new HttpError(404, "Employee not found");
	}

	if (employee.status !== "ACTIVE") {
		throw new HttpError(400, "Only ACTIVE employees can perform attendance actions");
	}

	const employeeShift = await prisma.employeeShift.findFirst({
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
};

export const checkIn = async (
	employeeId: string,
	organizationId: string,
	options?: { manual?: boolean; checkInAt?: Date | string },
) => {
	const manualMode = options?.manual === true;
	const checkInAt = parseAttendanceDateTime(options?.checkInAt, "checkInAt") || new Date();
	const { shift } = await getAttendanceContext(employeeId, organizationId, !manualMode);

	const attendanceDate = getStartOfLocalDay(checkInAt);

	const openAttendance = await prisma.attendance.findFirst({
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

	const existingAttendance = await prisma.attendance.findUnique({
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

		const attendance = await prisma.attendance.update({
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
		const attendance = await prisma.attendance.update({
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

	const attendance = await prisma.attendance.create({
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
};

export const checkOut = async (
	employeeId: string,
	organizationId: string,
	options?: { manual?: boolean; checkOutAt?: Date | string },
) => {
	const manualMode = options?.manual === true;
	const checkOutAt = parseAttendanceDateTime(options?.checkOutAt, "checkOutAt") || new Date();
	const { shift } = await getAttendanceContext(employeeId, organizationId, !manualMode);
	const attendanceDate = getStartOfLocalDay(checkOutAt);

	let attendance = await prisma.attendance.findFirst({
		where: {
			employeeId,
			checkIn: { not: null },
			checkOut: null,
		},
		orderBy: { date: "desc" },
	});

	if (!attendance && manualMode) {
		attendance = await prisma.attendance.findUnique({
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

	return prisma.attendance.update({
		where: { id: attendance.id },
		data: {
			checkOut: checkOutAt,
			totalHours,
			overtimeHours,
			status: "PRESENT",
		},
	});
};

export const getAttendanceDashboard = async (organizationId: string) => {
	const now = new Date();
	const attendanceDate = getStartOfLocalDay(now);

	const [activeEmployeesCount, attendanceRecords, overtimeAggregate] = await Promise.all([
		prisma.employee.count({
			where: {
				organizationId,
				status: "ACTIVE",
			},
		}),
		prisma.attendance.findMany({
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
		prisma.attendance.aggregate({
			where: {
				organizationId,
				date: attendanceDate,
			},
			_sum: {
				overtimeHours: true,
			},
		}),
	]);

	const totalPresentToday = attendanceRecords.filter((record: { checkIn: Date | null }) => record.checkIn !== null).length;
	const totalLateToday = attendanceRecords.filter((record: { isLate: boolean }) => record.isLate).length;
	const totalAbsentToday = Math.max(activeEmployeesCount - totalPresentToday, 0);
	const totalOvertimeToday = roundHours(overtimeAggregate._sum.overtimeHours ?? 0);
	const attendanceRate = activeEmployeesCount === 0 ? 0 : roundHours((totalPresentToday / activeEmployeesCount) * 100);

	return {
		date: attendanceDate,
		totalPresentToday,
		totalAbsentToday,
		totalLateToday,
		totalOvertimeToday,
		attendanceRate,
	};
};

export const markAbsentForDate = async (organizationId: string, dateInput: Date = new Date()) => {
	const attendanceDate = getStartOfLocalDay(dateInput);

	const [activeEmployees, existingAttendance] = await Promise.all([
		prisma.employee.findMany({
			where: {
				organizationId,
				status: "ACTIVE",
			},
			select: { id: true },
		}),
		prisma.attendance.findMany({
			where: {
				organizationId,
				date: attendanceDate,
			},
			select: { employeeId: true },
		}),
	]);

	const existingEmployeeIds = new Set(existingAttendance.map((row: { employeeId: string }) => row.employeeId));
	const absentRows = activeEmployees
		.filter((employee: { id: string }) => !existingEmployeeIds.has(employee.id))
		.map((employee: { id: string }) => ({
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

	const result = await prisma.attendance.createMany({
		data: absentRows,
		skipDuplicates: true,
	});

	return {
		date: attendanceDate,
		createdAbsentRecords: result.count,
	};
};

// ============================================
// PAYROLL ENGINE OPERATIONS
// ============================================

const getMonthRange = (month: number, year: number) => {
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

const roundMoney = (value: number) => Number(value.toFixed(2));

const isDeductionComponent = (type: string) => type.toUpperCase().includes("DEDUCTION");

const isUnpaidLeavePolicy = (policyName: string) => {
	const normalized = policyName.toLowerCase();
	return normalized.includes("unpaid") || normalized.includes("lop") || normalized.includes("loss of pay");
};

const getOverlapDaysInclusive = (
	startDate: Date,
	endDate: Date,
	monthStart: Date,
	monthEndExclusive: Date,
): number => {
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

export const getDailyAttendanceRecords = async (organizationId: string, dateInput?: string) => {
	const attendanceDate = getStartOfLocalDay(parseDateOnlyInput(dateInput));

	const [employees, attendanceRecords] = await Promise.all([
		prisma.employee.findMany({
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
		prisma.attendance.findMany({
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
		const record = attendanceByEmployee.get(employee.id);
		const fullName = `${employee.user?.firstName || ""} ${employee.user?.lastName || ""}`.trim();

		return {
			employeeId: employee.id,
			employeeCode: employee.employeeCode,
			employeeName: fullName || employee.employeeCode,
			email: employee.user?.email || null,
			checkIn: record?.checkIn || null,
			checkOut: record?.checkOut || null,
			totalHours: record?.totalHours || 0,
			overtimeHours: record?.overtimeHours || 0,
			isLate: Boolean(record?.isLate),
			status: record?.status || "ABSENT",
		};
	});

	return {
		date: attendanceDate,
		records,
	};
};

type PayrollBreakdown = {
	baseSalary: number;
	allowances: number;
	deductions: number;
	overtimeHours: number;
	overtimePay: number;
	leaveDeduction: number;
	grossSalary: number;
	netSalary: number;
	hourlyRate: number;
	unpaidLeaveDays: number;
};

const calculatePayrollBreakdown = async (
	employeeId: string,
	organizationId: string,
	month: number,
	year: number,
): Promise<PayrollBreakdown> => {
	const { start: monthStart, end: monthEnd } = getMonthRange(month, year);

	const employee = await prisma.employee.findUnique({
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

	const salaryStructures = await prisma.salaryStructure.findMany({
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
		} else {
			allowances += componentAmount;
		}
	}

	const attendanceAggregate = await prisma.attendance.aggregate({
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

	const overtimeHours = Number(attendanceAggregate._sum.overtimeHours ?? 0);
	const hourlyRate = baseSalary / 30 / 8;
	const overtimePay = overtimeHours * hourlyRate;

	const approvedLeaves = await prisma.leaveRequest.findMany({
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
};

export const generatePayroll = async (
	employeeId: string,
	month: number,
	year: number,
	organizationId: string,
	actorId?: string,
) => {
	await validateEmployeeExists(employeeId, organizationId);

	const existingPayslip = await prisma.payslip.findUnique({
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

	const breakdown = await calculatePayrollBreakdown(employeeId, organizationId, month, year);

	const payslip = await prisma.payslip.create({
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
		await appendPayrollAudit(payslip.id, organizationId, actorId, "GENERATE_PAYROLL", null, "DRAFT");
	}

	return {
		payslip,
		breakdown,
	};
};

export const generatePayrollBulk = async (
	organizationId: string,
	month: number,
	year: number,
	actorId: string,
) => {
	getMonthRange(month, year);

	const employees = await prisma.employee.findMany({
		where: { organizationId, status: "ACTIVE" },
		select: { id: true, employeeCode: true },
	});

	const results: Array<{ employeeId: string; employeeCode: string; status: "CREATED" | "SKIPPED"; reason?: string }> = [];

	for (const employee of employees) {
		try {
			await generatePayroll(employee.id, month, year, organizationId, actorId);
			results.push({ employeeId: employee.id, employeeCode: employee.employeeCode, status: "CREATED" });
		} catch (error) {
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
};

export const getPayrollDashboard = async (organizationId: string, month: number, year: number) => {
	getMonthRange(month, year);

	const payslips = await prisma.payslip.findMany({
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
	const totalPayrollCost = roundMoney(
		payslips.reduce((sum: number, payslip: { netSalary: number | { toString(): string } }) => sum + Number(payslip.netSalary), 0),
	);
	const averageSalary = totalEmployeesPaid === 0 ? 0 : roundMoney(totalPayrollCost / totalEmployeesPaid);

	const breakdowns = await Promise.all(
		payslips.map((payslip: { employeeId: string }) =>
			calculatePayrollBreakdown(payslip.employeeId, organizationId, month, year),
		),
	);

	const totalOvertimePaid = roundMoney(
		breakdowns.reduce((sum: number, breakdown: PayrollBreakdown) => sum + breakdown.overtimePay, 0),
	);
	const totalDeductions = roundMoney(
		breakdowns.reduce(
			(sum: number, breakdown: PayrollBreakdown) => sum + breakdown.deductions + breakdown.leaveDeduction,
			0,
		),
	);

	return {
		month,
		year,
		totalPayrollCost,
		totalEmployeesPaid,
		totalOvertimePaid,
		totalDeductions,
		averageSalary,
	};
};

export const getPayslips = async (organizationId: string, month?: number, year?: number) => {
	if ((month !== undefined && year === undefined) || (month === undefined && year !== undefined)) {
		throw new HttpError(400, "month and year must be provided together");
	}

	if (month !== undefined && year !== undefined) {
		getMonthRange(month, year);
	}

	return prisma.payslip.findMany({
		where: {
			employee: {
				organizationId,
			},
			...(month !== undefined && year !== undefined ? { month, year } : {}),
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
};

const mergePayslipWithMeta = async (organizationId: string, payslip: Awaited<ReturnType<typeof getPayslips>>[number]) => {
	const meta = await getPayrollMetaByPayslipId(payslip.id);
	const grossSalary = Number(payslip.grossSalary);
	const netSalary = Number(payslip.netSalary);
	const finalNetSalary = Math.max(
		0,
		netSalary + meta.arrears + meta.reimbursements - meta.loansAndAdvances - meta.statutoryTax,
	);

	return {
		...payslip,
		grossSalary,
		netSalary,
		finalNetSalary: roundMoney(finalNetSalary),
		status: meta.status,
		paymentStatus: meta.paymentStatus,
		statutoryTax: meta.statutoryTax,
		arrears: meta.arrears,
		reimbursements: meta.reimbursements,
		loansAndAdvances: meta.loansAndAdvances,
		paymentReference: meta.paymentReference,
		bankTransferRef: meta.bankTransferRef,
		paymentReconciled: meta.paymentReconciled,
		paidAt: meta.paidAt,
		organizationId,
	};
};

export const getPayrollRegister = async (
	organizationId: string,
	month: number,
	year: number,
	search?: string,
) => {
	const payslips = await getPayslips(organizationId, month, year);
	const merged = await Promise.all(payslips.map((payslip) => mergePayslipWithMeta(organizationId, payslip)));

	const normalizedSearch = (search || "").trim().toLowerCase();
	const records = normalizedSearch
		? merged.filter((item) => {
			const name = `${item.employee.user?.firstName || ""} ${item.employee.user?.lastName || ""}`.trim();
			const haystack = `${name} ${item.employee.employeeCode} ${item.employee.user?.email || ""}`.toLowerCase();
			return haystack.includes(normalizedSearch);
		})
		: merged;

	return {
		month,
		year,
		totalRecords: records.length,
		records,
	};
};

export const getPayslipWithMetaById = async (payslipId: string, organizationId: string) => {
	const payslip = await prisma.payslip.findUnique({
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

	return mergePayslipWithMeta(organizationId, payslip as Awaited<ReturnType<typeof getPayslips>>[number]);
};

export const updatePayrollLifecycleStatus = async (
	payslipId: string,
	organizationId: string,
	actorId: string,
	nextStatus: PayrollLifecycleStatus,
	note?: string,
) => {
	const payslip = await prisma.payslip.findUnique({
		where: { id: payslipId },
		select: {
			id: true,
			employee: { select: { organizationId: true } },
		},
	});

	if (!payslip || payslip.employee.organizationId !== organizationId) {
		throw new HttpError(404, "Payslip not found");
	}

	const meta = await getPayrollMetaByPayslipId(payslipId);
	const allowedTransitions: Record<PayrollLifecycleStatus, PayrollLifecycleStatus[]> = {
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

	await upsertPayrollMetaByPayslipId(payslipId, meta);
	await appendPayrollAudit(payslipId, organizationId, actorId, "STATUS_CHANGE", prev, nextStatus, note);

	return { payslipId, previousStatus: prev, status: nextStatus };
};

export const updatePayrollAdjustments = async (
	payslipId: string,
	organizationId: string,
	actorId: string,
	input: {
		statutoryTax?: number;
		arrears?: number;
		reimbursements?: number;
		loansAndAdvances?: number;
		note?: string;
	},
) => {
	const payslip = await prisma.payslip.findUnique({
		where: { id: payslipId },
		select: { id: true, employee: { select: { organizationId: true } } },
	});
	if (!payslip || payslip.employee.organizationId !== organizationId) {
		throw new HttpError(404, "Payslip not found");
	}

	const meta = await getPayrollMetaByPayslipId(payslipId);
	if (meta.status === "LOCKED") {
		throw new HttpError(400, "Locked payroll cannot be adjusted");
	}

	meta.statutoryTax = Number(input.statutoryTax ?? meta.statutoryTax);
	meta.arrears = Number(input.arrears ?? meta.arrears);
	meta.reimbursements = Number(input.reimbursements ?? meta.reimbursements);
	meta.loansAndAdvances = Number(input.loansAndAdvances ?? meta.loansAndAdvances);

	await upsertPayrollMetaByPayslipId(payslipId, meta);
	await appendPayrollAudit(payslipId, organizationId, actorId, "ADJUSTMENT_UPDATE", meta.status, meta.status, input.note);

	return { payslipId, meta };
};

export const updatePayrollPayment = async (
	payslipId: string,
	organizationId: string,
	actorId: string,
	input: { paymentStatus?: PayrollPaymentStatus; paymentReference?: string; bankTransferRef?: string; note?: string },
) => {
	const payslip = await prisma.payslip.findUnique({
		where: { id: payslipId },
		select: { id: true, employee: { select: { organizationId: true } } },
	});
	if (!payslip || payslip.employee.organizationId !== organizationId) {
		throw new HttpError(404, "Payslip not found");
	}

	const meta = await getPayrollMetaByPayslipId(payslipId);
	meta.paymentStatus = input.paymentStatus || meta.paymentStatus;
	meta.paymentReference = input.paymentReference ?? meta.paymentReference;
	meta.bankTransferRef = input.bankTransferRef ?? meta.bankTransferRef;
	if (meta.paymentStatus === "PAID") {
		meta.paidAt = new Date().toISOString();
		if (meta.status === "APPROVED") {
			meta.status = "PAID";
		}
	}

	await upsertPayrollMetaByPayslipId(payslipId, meta);
	await appendPayrollAudit(payslipId, organizationId, actorId, "PAYMENT_UPDATE", meta.status, meta.status, input.note);

	return { payslipId, meta };
};

export const reconcilePayrollPayment = async (
	payslipId: string,
	organizationId: string,
	actorId: string,
	reconciled: boolean,
	note?: string,
) => {
	const payslip = await prisma.payslip.findUnique({
		where: { id: payslipId },
		select: { id: true, employee: { select: { organizationId: true } } },
	});
	if (!payslip || payslip.employee.organizationId !== organizationId) {
		throw new HttpError(404, "Payslip not found");
	}

	const meta = await getPayrollMetaByPayslipId(payslipId);
	meta.paymentReconciled = reconciled;
	await upsertPayrollMetaByPayslipId(payslipId, meta);
	await appendPayrollAudit(payslipId, organizationId, actorId, "PAYMENT_RECONCILE", meta.status, meta.status, note);

	return { payslipId, paymentReconciled: reconciled };
};

export const getPayrollAuditTrail = async (
	organizationId: string,
	month: number,
	year: number,
) => {
	const payslips = await getPayslips(organizationId, month, year);
	const allEntries: PayrollAuditEntry[] = [];

	for (const payslip of payslips) {
		const meta = await getPayrollMetaByPayslipId(payslip.id);
		allEntries.push(...meta.audits);
	}

	return allEntries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const listSalaryComponents = async (organizationId: string) => {
	return prisma.salaryComponent.findMany({
		where: { organizationId },
		orderBy: { name: "asc" },
	});
};

export const createSalaryComponent = async (
	organizationId: string,
	input: { name: string; type: string; isPercentage?: boolean; value: number },
) => {
	if (!input.name?.trim()) {
		throw new HttpError(400, "name is required");
	}

	return prisma.salaryComponent.create({
		data: {
			organizationId,
			name: input.name.trim(),
			type: input.type?.trim() || "EARNING",
			isPercentage: Boolean(input.isPercentage),
			value: Number(input.value || 0),
		},
	});
};

export const updateSalaryComponent = async (
	componentId: string,
	organizationId: string,
	input: { name?: string; type?: string; isPercentage?: boolean; value?: number },
) => {
	const component = await prisma.salaryComponent.findUnique({ where: { id: componentId } });
	if (!component || component.organizationId !== organizationId) {
		throw new HttpError(404, "Salary component not found");
	}

	return prisma.salaryComponent.update({
		where: { id: componentId },
		data: {
			name: input.name?.trim() || component.name,
			type: input.type?.trim() || component.type,
			isPercentage: input.isPercentage ?? component.isPercentage,
			value: input.value !== undefined ? Number(input.value) : component.value,
		},
	});
};

export const deleteSalaryComponent = async (componentId: string, organizationId: string) => {
	const component = await prisma.salaryComponent.findUnique({ where: { id: componentId } });
	if (!component || component.organizationId !== organizationId) {
		throw new HttpError(404, "Salary component not found");
	}

	await prisma.salaryStructure.deleteMany({ where: { componentId } });
	await prisma.salaryComponent.delete({ where: { id: componentId } });
	return { success: true };
};

export const assignSalaryComponentToEmployee = async (
	employeeId: string,
	componentId: string,
	organizationId: string,
) => {
	await validateEmployeeExists(employeeId, organizationId);
	const component = await prisma.salaryComponent.findUnique({ where: { id: componentId } });
	if (!component || component.organizationId !== organizationId) {
		throw new HttpError(404, "Salary component not found");
	}

	const existing = await prisma.salaryStructure.findFirst({ where: { employeeId, componentId } });
	if (existing) {
		return existing;
	}

	return prisma.salaryStructure.create({
		data: { employeeId, componentId },
	});
};

export const unassignSalaryComponentFromEmployee = async (
	employeeId: string,
	componentId: string,
	organizationId: string,
) => {
	await validateEmployeeExists(employeeId, organizationId);
	const component = await prisma.salaryComponent.findUnique({ where: { id: componentId } });
	if (!component || component.organizationId !== organizationId) {
		throw new HttpError(404, "Salary component not found");
	}

	await prisma.salaryStructure.deleteMany({
		where: { employeeId, componentId },
	});

	return { success: true };
};

// ============================================
// PERFORMANCE ENGINE OPERATIONS
// ============================================

export const createPerformanceReview = async (
	employeeId: string,
	reviewerId: string,
	rating: number,
	comments: string | undefined,
	organizationId: string,
) => {
	await validateEmployeeExists(employeeId, organizationId);
	await validateEmployeeExists(reviewerId, organizationId);

	if (employeeId === reviewerId) {
		throw new HttpError(400, "Reviewer cannot review themselves");
	}

	if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
		throw new HttpError(400, "rating must be between 1 and 5");
	}

	return prisma.performanceReview.create({
		data: {
			employeeId,
			reviewerId,
			rating: Math.round(rating),
			comments,
		},
	});
};

export const getEmployeePerformanceHistory = async (employeeId: string, organizationId: string) => {
	await validateEmployeeExists(employeeId, organizationId);

	return prisma.performanceReview.findMany({
		where: {
			employeeId,
			employee: {
				organizationId,
			},
		},
		orderBy: { reviewDate: "desc" },
	});
};

type PerformerSummary = {
	employeeId: string;
	employeeCode: string;
	name: string;
	department: string | null;
	averageRating: number;
	reviewCount: number;
};

export const getPerformanceDashboard = async (organizationId: string) => {
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

	const [averageAgg, reviewsThisMonth, reviews] = await Promise.all([
		prisma.performanceReview.aggregate({
			where: {
				employee: {
					organizationId,
				},
			},
			_avg: { rating: true },
		}),
		prisma.performanceReview.count({
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
		prisma.performanceReview.findMany({
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

	const employeeRatingMap = new Map<
		string,
		{
			employeeCode: string;
			name: string;
			department: string | null;
			ratingSum: number;
			reviewCount: number;
		}
	>();

	const departmentRatingMap = new Map<string, { ratingSum: number; reviewCount: number }>();

	for (const review of reviews) {
		const empId = review.employee.id;
		const empName = `${review.employee.user?.firstName ?? ""} ${review.employee.user?.lastName ?? ""}`.trim() || review.employee.employeeCode;
		const deptName = review.employee.department?.name ?? "Unassigned";

		const existingEmp = employeeRatingMap.get(empId);
		if (existingEmp) {
			existingEmp.ratingSum += review.rating;
			existingEmp.reviewCount += 1;
		} else {
			employeeRatingMap.set(empId, {
				employeeCode: review.employee.employeeCode,
				name: empName,
				department: review.employee.department?.name ?? null,
				ratingSum: review.rating,
				reviewCount: 1,
			});
		}

		const existingDept = departmentRatingMap.get(deptName);
		if (existingDept) {
			existingDept.ratingSum += review.rating;
			existingDept.reviewCount += 1;
		} else {
			departmentRatingMap.set(deptName, { ratingSum: review.rating, reviewCount: 1 });
		}
	}

	const performerSummaries: PerformerSummary[] = Array.from(employeeRatingMap.entries()).map(
		([employeeId, value]) => ({
			employeeId,
			employeeCode: value.employeeCode,
			name: value.name,
			department: value.department,
			averageRating: roundHours(value.ratingSum / value.reviewCount),
			reviewCount: value.reviewCount,
		}),
	);

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
		averageRating: roundHours(averageAgg._avg.rating ?? 0),
		reviewsThisMonth,
		topPerformers,
		lowPerformers,
		departmentPerformanceAverage,
	};
};

export const getFullHRAnalytics = async (organizationId: string, month: number, year: number) => {
	const { start: monthStart, end: monthEnd } = getMonthRange(month, year);
	const todayStart = getStartOfLocalDay(new Date());
	const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

	const [
		totalEmployees,
		resignedEmployees,
		attendanceDashboard,
		payrollDashboard,
		employeesOnLeaveToday,
		overtimeAggregate,
		performanceDashboard,
	] = await Promise.all([
		prisma.employee.count({ where: { organizationId } }),
		prisma.employee.count({ where: { organizationId, status: "RESIGNED" } }),
		getAttendanceDashboard(organizationId),
		getPayrollDashboard(organizationId, month, year),
		prisma.leaveRequest.count({
			where: {
				status: "APPROVED",
				startDate: { lt: tomorrowStart },
				endDate: { gte: todayStart },
				employee: { organizationId },
			},
		}),
		prisma.attendance.aggregate({
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
		getPerformanceDashboard(organizationId),
	]);

	const attritionRate = totalEmployees === 0 ? 0 : roundHours((resignedEmployees / totalEmployees) * 100);

	return {
		totalEmployees,
		attendanceRate: attendanceDashboard.attendanceRate,
		totalPayrollCost: payrollDashboard.totalPayrollCost,
		averageSalary: payrollDashboard.averageSalary,
		employeesOnLeaveToday,
		overtimeHours: roundHours(overtimeAggregate._sum.overtimeHours ?? 0),
		attritionRate,
		performanceAverage: performanceDashboard.averageRating,
	};
};

// ============================================
// ORG STRUCTURE OPERATIONS
// ============================================

export const createDepartment = async (organizationId: string, name: string) => {
	const normalizedName = name?.trim();
	if (!normalizedName) {
		throw new HttpError(400, "Department name is required");
	}

	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	const existing = await prisma.department.findFirst({
		where: {
			organizationId,
			name: normalizedName,
		},
		select: { id: true },
	});

	if (existing) {
		throw new HttpError(409, `Department "${normalizedName}" already exists`);
	}

	return prisma.department.create({
		data: {
			organizationId,
			name: normalizedName,
		},
	});
};

export const createDesignation = async (organizationId: string, title: string) => {
	const normalizedTitle = title?.trim();
	if (!normalizedTitle) {
		throw new HttpError(400, "Designation title is required");
	}

	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	const existing = await prisma.designation.findFirst({
		where: {
			organizationId,
			title: normalizedTitle,
		},
		select: { id: true },
	});

	if (existing) {
		throw new HttpError(409, `Designation "${normalizedTitle}" already exists`);
	}

	return prisma.designation.create({
		data: {
			organizationId,
			title: normalizedTitle,
		},
	});
};

export const createTeam = async (organizationId: string, name: string) => {
	const normalizedName = name?.trim();
	if (!normalizedName) {
		throw new HttpError(400, "Team name is required");
	}

	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	const existing = await prisma.team.findFirst({
		where: {
			organizationId,
			name: normalizedName,
		},
		select: { id: true },
	});

	if (existing) {
		throw new HttpError(409, `Team "${normalizedName}" already exists`);
	}

	return prisma.team.create({
		data: {
			organizationId,
			name: normalizedName,
		},
	});
};

export const createLocation = async (organizationId: string, name: string, address?: string) => {
	const normalizedName = name?.trim();
	if (!normalizedName) {
		throw new HttpError(400, "Location name is required");
	}

	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	const existing = await prisma.location.findFirst({
		where: {
			organizationId,
			name: normalizedName,
		},
		select: { id: true },
	});

	if (existing) {
		throw new HttpError(409, `Location "${normalizedName}" already exists`);
	}

	return prisma.location.create({
		data: {
			organizationId,
			name: normalizedName,
			address: address?.trim() || undefined,
		},
	});
};

export const getOrgStructureSummary = async (organizationId: string) => {
	const [departments, designations, teams, locations] = await Promise.all([
		prisma.department.findMany({
			where: { organizationId },
			include: { _count: { select: { employees: true } } },
		}),
		prisma.designation.findMany({
			where: { organizationId },
			include: { _count: { select: { employees: true } } },
		}),
		prisma.team.findMany({
			where: { organizationId },
			include: { _count: { select: { employees: true } } },
		}),
		prisma.location.findMany({
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
};

// ============================================
// HIERARCHY TREE OPERATIONS
// ============================================

/**
 * Interface for organization hierarchy tree node
 */
interface HierarchyNode {
	id: string;
	employeeCode: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	title?: string;
	department?: string;
	subordinates: HierarchyNode[];
}

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
const buildOrganizationHierarchyTree = (
	employees: Array<{
		id: string;
		employeeCode: string;
		managerId: string | null;
		user: { firstName?: string | null; lastName?: string | null; email: string } | null;
		designation: { title: string } | null;
		department: { name: string } | null;
	}>,
): HierarchyNode[] => {
	// Step 1: Create map of all employees for O(1) lookup
	const employeeMap = new Map<string, HierarchyNode>();

	employees.forEach((emp) => {
		employeeMap.set(emp.id, {
			id: emp.id,
			employeeCode: emp.employeeCode,
			firstName: emp.user?.firstName ?? undefined,
			lastName: emp.user?.lastName ?? undefined,
			email: emp.user?.email ?? undefined,
			title: emp.designation?.title ?? undefined,
			department: emp.department?.name ?? undefined,
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
		.filter((node): node is HierarchyNode => node !== undefined)
		.sort((a, b) => (a.employeeCode || "").localeCompare(b.employeeCode || ""));

	// Step 4: Sort subordinates recursively
	const sortSubordinates = (node: HierarchyNode): void => {
		node.subordinates.sort((a, b) =>
			(a.employeeCode || "").localeCompare(b.employeeCode || ""),
		);
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
export const getOrganizationHierarchy = async (organizationId: string) => {
	// Verify organization exists
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true, name: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	// SINGLE DB QUERY: Fetch all employees for organization with all relations
	const employees = await prisma.employee.findMany({
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
};
