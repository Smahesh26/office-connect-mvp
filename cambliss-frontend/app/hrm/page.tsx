"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type Employee = {
	id: string;
	employeeCode: string;
	status: string;
	employmentType: string;
	workMode: string;
	salary: number;
	joinDate: string;
	user?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
	department?: { id: string; name: string } | null;
	designation?: { id: string; title: string } | null;
	team?: { id: string; name: string } | null;
	location?: { id: string; name: string } | null;
	manager?: { id: string; employeeCode?: string; user?: { firstName?: string | null; lastName?: string | null } | null } | null;
};

type StructureItem = { id: string; name?: string; title?: string; address?: string; _count?: { employees: number } };

type StructureSummary = {
	departments: StructureItem[];
	designations: StructureItem[];
	teams: StructureItem[];
	locations: StructureItem[];
};

type AttendanceDashboard = {
	totalPresentToday: number;
	totalAbsentToday: number;
	attendanceRate: number;
	totalLateToday: number;
	totalOvertimeToday: number;
};

type DailyAttendanceRecord = {
	employeeId: string;
	employeeCode: string;
	employeeName: string;
	email: string | null;
	checkIn: string | null;
	checkOut: string | null;
	totalHours: number;
	overtimeHours: number;
	isLate: boolean;
	status: string;
};

type DailyAttendanceResponse = {
	date: string;
	records: DailyAttendanceRecord[];
};

type PayrollDashboard = {
	month: number;
	year: number;
	totalPayrollCost: number;
	totalEmployeesPaid: number;
	totalOvertimePaid: number;
	totalDeductions: number;
	averageSalary: number;
};

type PayrollRegisterRecord = {
	id: string;
	month: number;
	year: number;
	grossSalary: number;
	netSalary: number;
	finalNetSalary: number;
	status: "DRAFT" | "APPROVED" | "PAID" | "LOCKED";
	paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
	statutoryTax: number;
	arrears: number;
	reimbursements: number;
	loansAndAdvances: number;
	paymentReconciled: boolean;
	employee: {
		id: string;
		employeeCode: string;
		user?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
	};
};

type PayrollRegisterResponse = {
	month: number;
	year: number;
	totalRecords: number;
	records: PayrollRegisterRecord[];
};

type PayrollAuditEntry = {
	id: string;
	payslipId: string;
	action: string;
	actorId: string;
	beforeStatus: string | null;
	afterStatus: string | null;
	note: string | null;
	createdAt: string;
};

type SalaryComponent = {
	id: string;
	name: string;
	type: string;
	isPercentage: boolean;
	value: number;
};

type PerformanceDashboard = {
	averageRating: number;
	reviewsThisMonth: number;
	topPerformers: Array<{ employeeId: string; employeeCode: string; name: string; averageRating: number }>;
	lowPerformers: Array<{ employeeId: string; employeeCode: string; name: string; averageRating: number }>;
};

type HrAnalytics = {
	totalEmployees: number;
	attendanceRate: number;
	totalPayrollCost: number;
	averageSalary: number;
	employeesOnLeaveToday: number;
	overtimeHours: number;
	attritionRate: number;
	performanceAverage: number;
};

type HierarchyNode = {
	id: string;
	employeeCode: string;
	firstName?: string;
	lastName?: string;
	title?: string;
	department?: string;
	subordinates: HierarchyNode[];
};

type HierarchyResponse = {
	organizationName: string;
	hierarchy: HierarchyNode[];
	totalTopLevelEmployees: number;
};

type HrmTab = "overview" | "employees" | "structure" | "attendance" | "payroll" | "performance" | "hierarchy";
type StructureType = "departments" | "designations" | "teams" | "locations";

const tabTitle: Record<HrmTab, string> = {
	overview: "Overview",
	employees: "Employees",
	structure: "Org Structure",
	attendance: "Attendance",
	payroll: "Payroll",
	performance: "Performance",
	hierarchy: "Hierarchy",
};

const emptyEmployeeForm = {
	employeeCode: "",
	departmentId: "",
	designationId: "",
	teamId: "",
	locationId: "",
	joinDate: "",
	employmentType: "FULL_TIME",
	workMode: "ON_SITE",
	salary: "",
};

const getApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
	const raw = await response.text();
	if (!raw) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(raw) as { message?: string };
		return parsed.message || fallback;
	} catch {
		return raw;
	}
};

const toIsoDateTime = (value: string): string | null => {
	if (!value) {
		return null;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed.toISOString();
};

const toDateInputValue = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const toIsoFromSelectedDate = (dateInput: string): string | null => {
	if (!dateInput) {
		return null;
	}

	const matched = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!matched) {
		return null;
	}

	const now = new Date();
	const composed = new Date(
		Number(matched[1]),
		Number(matched[2]) - 1,
		Number(matched[3]),
		now.getHours(),
		now.getMinutes(),
		now.getSeconds(),
		0,
	);

	return composed.toISOString();
};

const formatDateTime = (value: string | null): string => {
	if (!value) {
		return "-";
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return "-";
	}

	return parsed.toLocaleString();
};

function NodeTree({ nodes, level = 0 }: { nodes: HierarchyNode[]; level?: number }) {
	return (
		<div className={level === 0 ? "space-y-2" : "ml-4 mt-2 space-y-2 border-l border-zinc-200 pl-3"}>
			{nodes.map((node) => (
				<div key={node.id} className="rounded-lg border border-zinc-200 bg-white p-2">
					<p className="text-xs font-semibold text-zinc-900">
						{node.firstName || ""} {node.lastName || ""} ({node.employeeCode})
					</p>
					<p className="text-[11px] text-zinc-600">{node.title || "No designation"} · {node.department || "No department"}</p>
					{node.subordinates.length > 0 && <NodeTree nodes={node.subordinates} level={level + 1} />}
				</div>
			))}
		</div>
	);
}

export default function HrmPage() {
	const [activeTab, setActiveTab] = useState<HrmTab>("overview");
	const [loading, setLoading] = useState(true);
	const [notice, setNotice] = useState<string | null>(null);

	const [employees, setEmployees] = useState<Employee[]>([]);
	const [structure, setStructure] = useState<StructureSummary>({ departments: [], designations: [], teams: [], locations: [] });
	const [attendance, setAttendance] = useState<AttendanceDashboard | null>(null);
	const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceRecord[]>([]);
	const [payroll, setPayroll] = useState<PayrollDashboard | null>(null);
	const [payrollRegister, setPayrollRegister] = useState<PayrollRegisterRecord[]>([]);
	const [payrollAudit, setPayrollAudit] = useState<PayrollAuditEntry[]>([]);
	const [salaryComponents, setSalaryComponents] = useState<SalaryComponent[]>([]);
	const [payrollSearch, setPayrollSearch] = useState("");
	const [isBulkGeneratingPayroll, setIsBulkGeneratingPayroll] = useState(false);
	const [isExportingPayroll, setIsExportingPayroll] = useState(false);
	const [componentForm, setComponentForm] = useState({ name: "", type: "EARNING", value: "", isPercentage: false });
	const [performance, setPerformance] = useState<PerformanceDashboard | null>(null);
	const [analytics, setAnalytics] = useState<HrAnalytics | null>(null);
	const [hierarchy, setHierarchy] = useState<HierarchyResponse | null>(null);

	const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
	const [savingEmployee, setSavingEmployee] = useState(false);

	const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
	const [year, setYear] = useState<number>(new Date().getFullYear());
	const [isRefreshingDash, setIsRefreshingDash] = useState(false);
	const [attendanceEmployeeId, setAttendanceEmployeeId] = useState("");
	const [attendanceDate, setAttendanceDate] = useState<string>(toDateInputValue(new Date()));
	const [attendanceNameFilter, setAttendanceNameFilter] = useState("");
	const [manualCheckInAt, setManualCheckInAt] = useState("");
	const [manualCheckOutAt, setManualCheckOutAt] = useState("");
	const [payrollEmployeeId, setPayrollEmployeeId] = useState("");
	const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);
	const [reviewForm, setReviewForm] = useState({ employeeId: "", reviewerId: "", rating: "", comments: "" });
	const [isSavingReview, setIsSavingReview] = useState(false);
	const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
	const [structureModalType, setStructureModalType] = useState<StructureType>("departments");
	const [structureModalValue, setStructureModalValue] = useState("");
	const [structureModalAddress, setStructureModalAddress] = useState("");
	const [isSavingStructure, setIsSavingStructure] = useState(false);
	const [structureModalError, setStructureModalError] = useState<string | null>(null);

	const getAuthHeaders = (): Headers => {
		const headers = new Headers();
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("authToken");
			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
			}
		}
		return headers;
	};

	const loadAll = async () => {
		setLoading(true);
		setNotice(null);
		try {
			const headers = getAuthHeaders();
			const [employeesRes, structureRes, attendanceRes, dailyAttendanceRes, payrollRes, payrollRegisterRes, payrollAuditRes, componentsRes, performanceRes, analyticsRes, hierarchyRes] = await Promise.all([
				fetch("/api/hrm/employees", { headers }),
				fetch("/api/hrm/structure", { headers }),
				fetch("/api/hrm/attendance/dashboard", { headers }),
				fetch(`/api/hrm/attendance/daily?date=${encodeURIComponent(attendanceDate)}`, { headers }),
				fetch(`/api/hrm/payroll/dashboard?month=${month}&year=${year}`, { headers }),
				fetch(`/api/hrm/payroll/register?month=${month}&year=${year}&search=${encodeURIComponent(payrollSearch)}`, { headers }),
				fetch(`/api/hrm/payroll/audit?month=${month}&year=${year}`, { headers }),
				fetch("/api/hrm/payroll/components", { headers }),
				fetch("/api/hrm/performance/dashboard", { headers }),
				fetch(`/api/hrm/analytics?month=${month}&year=${year}`, { headers }),
				fetch("/api/hrm/hierarchy", { headers }),
			]);

			if (!employeesRes.ok || !structureRes.ok || !attendanceRes.ok) {
				const failed = [employeesRes, structureRes, attendanceRes].find((response) => !response.ok);
				const message = failed ? await getApiErrorMessage(failed, "Unable to load HRM.") : "Unable to load HRM.";
				setNotice(message);
				return;
			}

			setEmployees((await employeesRes.json()) as Employee[]);
			setStructure((await structureRes.json()) as StructureSummary);
			setAttendance((await attendanceRes.json()) as AttendanceDashboard);
			setDailyAttendance(dailyAttendanceRes.ok ? ((await dailyAttendanceRes.json()) as DailyAttendanceResponse).records : []);
			setPayroll(payrollRes.ok ? ((await payrollRes.json()) as PayrollDashboard) : null);
			setPayrollRegister(payrollRegisterRes.ok ? ((await payrollRegisterRes.json()) as PayrollRegisterResponse).records : []);
			setPayrollAudit(payrollAuditRes.ok ? ((await payrollAuditRes.json()) as PayrollAuditEntry[]) : []);
			setSalaryComponents(componentsRes.ok ? ((await componentsRes.json()) as SalaryComponent[]) : []);
			setPerformance(performanceRes.ok ? ((await performanceRes.json()) as PerformanceDashboard) : null);
			setAnalytics(analyticsRes.ok ? ((await analyticsRes.json()) as HrAnalytics) : null);
			setHierarchy(hierarchyRes.ok ? ((await hierarchyRes.json()) as HierarchyResponse) : null);
		} catch {
			setNotice("Unable to load HRM.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadAll();
	}, [month, year, attendanceDate, payrollSearch]);

	const downloadAttendanceExcel = () => {
		if (filteredDailyAttendance.length === 0) {
			setNotice("No daily attendance data to export.");
			return;
		}

		const escapeCsv = (value: string | number | boolean | null) => {
			const text = value === null ? "" : String(value);
			return `"${text.replace(/"/g, '""')}"`;
		};

		const header = [
			"Date",
			"Employee Code",
			"Employee Name",
			"Email",
			"Status",
			"Check-In",
			"Check-Out",
			"Total Hours",
			"Overtime Hours",
			"Late",
		];

		const rows = filteredDailyAttendance.map((record) => [
			attendanceDate,
			record.employeeCode,
			record.employeeName,
			record.email || "",
			record.status,
			formatDateTime(record.checkIn),
			formatDateTime(record.checkOut),
			record.totalHours,
			record.overtimeHours,
			record.isLate ? "YES" : "NO",
		]);

		const csvContent = [header, ...rows]
			.map((row) => row.map((cell) => escapeCsv(cell)).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `attendance-${attendanceDate}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const filteredDailyAttendance = useMemo(() => {
		const filter = attendanceNameFilter.trim().toLowerCase();
		if (!filter) {
			return dailyAttendance;
		}

		return dailyAttendance.filter((record) => {
			const haystack = `${record.employeeName} ${record.employeeCode} ${record.email || ""}`.toLowerCase();
			return haystack.includes(filter);
		});
	}, [dailyAttendance, attendanceNameFilter]);

	const handleCreateEmployee = async (event: FormEvent) => {
		event.preventDefault();
		setSavingEmployee(true);
		setNotice(null);
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const response = await fetch("/api/hrm/employees", {
				method: "POST",
				headers,
				body: JSON.stringify({
					employeeCode: employeeForm.employeeCode.trim(),
					departmentId: employeeForm.departmentId || undefined,
					designationId: employeeForm.designationId || undefined,
					teamId: employeeForm.teamId || undefined,
					locationId: employeeForm.locationId || undefined,
					joinDate: employeeForm.joinDate,
					employmentType: employeeForm.employmentType,
					workMode: employeeForm.workMode,
					salary: Number(employeeForm.salary || 0),
				}),
			});

			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to create employee."));
				return;
			}

			setEmployeeForm(emptyEmployeeForm);
			await loadAll();
			setNotice("Employee created.");
		} catch {
			setNotice("Unable to create employee.");
		} finally {
			setSavingEmployee(false);
		}
	};

	const openStructureModal = (type: StructureType) => {
		setStructureModalType(type);
		setStructureModalValue("");
		setStructureModalAddress("");
		setStructureModalError(null);
		setIsStructureModalOpen(true);
	};

	const closeStructureModal = () => {
		setIsStructureModalOpen(false);
		setStructureModalValue("");
		setStructureModalAddress("");
		setStructureModalError(null);
	};

	const createStructureItem = async (event: FormEvent) => {
		event.preventDefault();

		const type = structureModalType;
		let label = "name";
		let endpoint = "/api/hrm/departments";
		if (type === "designations") {
			label = "title";
			endpoint = "/api/hrm/designations";
		}
		if (type === "teams") {
			endpoint = "/api/hrm/teams";
		}
		if (type === "locations") {
			endpoint = "/api/hrm/locations";
		}

		const value = structureModalValue.trim();
		if (!value) {
			setStructureModalError(`Enter ${label}.`);
			return;
		}

		setIsSavingStructure(true);
		setStructureModalError(null);
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const body =
			type === "designations"
				? { title: value }
				: type === "locations"
					? { name: value, address: structureModalAddress.trim() || undefined }
					: { name: value };
		const response = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			setIsSavingStructure(false);
			const message = await getApiErrorMessage(response, `Unable to create ${type.slice(0, -1)}.`);
			setStructureModalError(message);
			return;
		}

		await loadAll();
		setIsSavingStructure(false);
		closeStructureModal();
		setNotice(`${type.slice(0, -1)} created.`);
	};

	const handleEditEmployee = async (employee: Employee) => {
		const phone = window.prompt("Phone", "");
		if (phone === null) {
			return;
		}
		const address = window.prompt("Address", "");
		if (address === null) {
			return;
		}
		const salaryRaw = window.prompt("Salary", String(employee.salary || 0));
		if (salaryRaw === null) {
			return;
		}

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/hrm/employees/${employee.id}`, {
			method: "PUT",
			headers,
			body: JSON.stringify({
				phone: phone.trim() || null,
				address: address.trim() || null,
				salary: Number(salaryRaw || 0),
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update employee."));
			return;
		}

		await loadAll();
		setNotice("Employee updated.");
	};

	const handleChangeEmployeeStatus = async (employeeId: string) => {
		const status = window.prompt("New status (ACTIVE, RESIGNED, TERMINATED, ON_LEAVE)", "ACTIVE");
		if (!status) {
			return;
		}

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/hrm/employees/${employeeId}/status`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ status: status.trim().toUpperCase() }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update employee status."));
			return;
		}

		await loadAll();
		setNotice("Employee status updated.");
	};

	const handleAssignManager = async (employeeId: string) => {
		const managerId = window.prompt("Manager employee ID");
		if (!managerId) {
			return;
		}

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/hrm/employees/${employeeId}/manager`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ managerId: managerId.trim() }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to assign manager."));
			return;
		}

		await loadAll();
		setNotice("Manager assigned.");
	};

	const handleCheckIn = async () => {
		if (!attendanceEmployeeId) {
			setNotice("Select employee for check-in.");
			return;
		}

		const checkInAt = manualCheckInAt
			? toIsoDateTime(manualCheckInAt)
			: toIsoFromSelectedDate(attendanceDate);
		if (!checkInAt) {
			setNotice("Provide a valid check-in date/time.");
			return;
		}

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/hrm/attendance/check-in", {
			method: "POST",
			headers,
			body: JSON.stringify({
				employeeId: attendanceEmployeeId,
				manual: true,
				checkInAt: checkInAt || undefined,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Check-in failed."));
			return;
		}

		await loadAll();
		setManualCheckInAt("");
		setNotice("Check-in successful.");
	};

	const handleCheckOut = async () => {
		if (!attendanceEmployeeId) {
			setNotice("Select employee for check-out.");
			return;
		}

		const checkOutAt = manualCheckOutAt
			? toIsoDateTime(manualCheckOutAt)
			: toIsoFromSelectedDate(attendanceDate);
		if (!checkOutAt) {
			setNotice("Provide a valid check-out date/time.");
			return;
		}

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/hrm/attendance/check-out", {
			method: "POST",
			headers,
			body: JSON.stringify({
				employeeId: attendanceEmployeeId,
				manual: true,
				checkOutAt: checkOutAt || undefined,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Check-out failed."));
			return;
		}

		await loadAll();
		setManualCheckOutAt("");
		setNotice("Check-out successful.");
	};

	const handleGeneratePayroll = async () => {
		if (!payrollEmployeeId) {
			setNotice("Select employee for payroll generation.");
			return;
		}

		setIsGeneratingPayroll(true);
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/hrm/payroll/generate", {
			method: "POST",
			headers,
			body: JSON.stringify({ employeeId: payrollEmployeeId, month, year }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Payroll generation failed."));
			setIsGeneratingPayroll(false);
			return;
		}

		await loadAll();
		setIsGeneratingPayroll(false);
		setNotice("Payroll generated successfully.");
	};

	const handleBulkGeneratePayroll = async () => {
		setIsBulkGeneratingPayroll(true);
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/hrm/payroll/generate-bulk", {
			method: "POST",
			headers,
			body: JSON.stringify({ month, year }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Bulk payroll generation failed."));
			setIsBulkGeneratingPayroll(false);
			return;
		}

		await loadAll();
		setIsBulkGeneratingPayroll(false);
		setNotice("Bulk payroll generation completed.");
	};

	const handleExportPayrollRegister = async () => {
		setIsExportingPayroll(true);
		const headers = getAuthHeaders();
		const response = await fetch(
			`/api/hrm/payroll/register/export?month=${month}&year=${year}&search=${encodeURIComponent(payrollSearch)}`,
			{ headers },
		);

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Payroll export failed."));
			setIsExportingPayroll(false);
			return;
		}

		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `payroll-register-${year}-${month}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		setIsExportingPayroll(false);
	};

	const updatePayrollStatus = async (payslipId: string, status: "APPROVED" | "PAID" | "LOCKED") => {
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/hrm/payroll/payslips/${payslipId}/status`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ status }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update payroll status."));
			return;
		}

		await loadAll();
		setNotice(`Payroll status moved to ${status}.`);
	};

	const openPayrollAdjustments = async (record: PayrollRegisterRecord) => {
		const statutoryTax = window.prompt("Statutory Tax", String(record.statutoryTax));
		if (statutoryTax === null) return;
		const arrears = window.prompt("Arrears", String(record.arrears));
		if (arrears === null) return;
		const reimbursements = window.prompt("Reimbursements", String(record.reimbursements));
		if (reimbursements === null) return;
		const loansAndAdvances = window.prompt("Loans and Advances", String(record.loansAndAdvances));
		if (loansAndAdvances === null) return;

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/hrm/payroll/payslips/${record.id}/adjustments`, {
			method: "PUT",
			headers,
			body: JSON.stringify({
				statutoryTax: Number(statutoryTax || 0),
				arrears: Number(arrears || 0),
				reimbursements: Number(reimbursements || 0),
				loansAndAdvances: Number(loansAndAdvances || 0),
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to update payroll adjustments."));
			return;
		}

		await loadAll();
		setNotice("Payroll adjustments updated.");
	};

	const markPayrollPayment = async (record: PayrollRegisterRecord) => {
		const paymentReference = window.prompt("Payment Reference", "");
		if (paymentReference === null) return;
		const bankTransferRef = window.prompt("Bank Transfer Ref", "");
		if (bankTransferRef === null) return;

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/hrm/payroll/payslips/${record.id}/payment`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ paymentStatus: "PAID", paymentReference, bankTransferRef }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to mark payment."));
			return;
		}

		await loadAll();
		setNotice("Payroll payment updated.");
	};

	const reconcilePayroll = async (record: PayrollRegisterRecord, reconciled: boolean) => {
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch(`/api/hrm/payroll/payslips/${record.id}/reconcile`, {
			method: "PUT",
			headers,
			body: JSON.stringify({ reconciled }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to reconcile payroll payment."));
			return;
		}

		await loadAll();
		setNotice(`Payroll reconciliation ${reconciled ? "completed" : "reverted"}.`);
	};

	const downloadPayslipPdf = (payslipId: string) => {
		window.open(`/api/hrm/payroll/payslips/${payslipId}/pdf`, "_blank");
	};

	const createComponent = async (event: FormEvent) => {
		event.preventDefault();
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/hrm/payroll/components", {
			method: "POST",
			headers,
			body: JSON.stringify({
				name: componentForm.name,
				type: componentForm.type,
				value: Number(componentForm.value || 0),
				isPercentage: componentForm.isPercentage,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to create salary component."));
			return;
		}

		setComponentForm({ name: "", type: "EARNING", value: "", isPercentage: false });
		await loadAll();
		setNotice("Salary component created.");
	};

	const assignComponentToEmployee = async (componentId: string) => {
		const employeeId = window.prompt("Enter employee ID to assign this component");
		if (!employeeId) return;

		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/hrm/payroll/components/assign", {
			method: "POST",
			headers,
			body: JSON.stringify({ employeeId: employeeId.trim(), componentId }),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to assign component."));
			return;
		}

		setNotice("Component assigned to employee.");
	};

	const handleCreateReview = async (event: FormEvent) => {
		event.preventDefault();
		if (!reviewForm.employeeId || !reviewForm.reviewerId || !reviewForm.rating) {
			setNotice("Select employee, reviewer and rating.");
			return;
		}

		setIsSavingReview(true);
		const headers = getAuthHeaders();
		headers.set("Content-Type", "application/json");
		const response = await fetch("/api/hrm/performance/review", {
			method: "POST",
			headers,
			body: JSON.stringify({
				employeeId: reviewForm.employeeId,
				reviewerId: reviewForm.reviewerId,
				rating: Number(reviewForm.rating),
				comments: reviewForm.comments.trim() || undefined,
			}),
		});

		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Unable to create performance review."));
			setIsSavingReview(false);
			return;
		}

		setReviewForm({ employeeId: "", reviewerId: "", rating: "", comments: "" });
		await loadAll();
		setIsSavingReview(false);
		setNotice("Performance review created.");
	};

	const refreshDashboards = async () => {
		setIsRefreshingDash(true);
		await loadAll();
		setIsRefreshingDash(false);
	};

	const headcount = useMemo(() => employees.length, [employees]);
	const activeCount = useMemo(() => employees.filter((item) => item.status === "ACTIVE").length, [employees]);

	const tabButtonClass = (tab: HrmTab) =>
		`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${activeTab === tab ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"}`;

	const structureModalLabel = structureModalType === "designations" ? "Title" : "Name";
	const structureModalTitle =
		structureModalType === "departments"
			? "Add Department"
			: structureModalType === "designations"
				? "Add Designation"
				: structureModalType === "teams"
					? "Add Team"
					: "Add Location";

	return (
		<WorkspaceShell>
			<div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Premium HRM Suite</h1>
				<p className="mt-1 text-sm text-zinc-600">Enterprise-ready HR operations: employees, org structure, attendance, payroll, performance and hierarchy.</p>
				{notice && <p className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{notice}</p>}

				<div className="mt-4 flex flex-wrap gap-2">
					{(Object.keys(tabTitle) as HrmTab[]).map((tab) => (
						<button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabButtonClass(tab)}>
							{tabTitle[tab]}
						</button>
					))}
				</div>

				{isStructureModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
						<div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
							<p className="text-sm font-semibold text-zinc-900">{structureModalTitle}</p>
							<form onSubmit={(event) => void createStructureItem(event)} className="mt-3 space-y-2">
								{structureModalError && (
									<p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
										{structureModalError}
									</p>
								)}
								<input
									value={structureModalValue}
									onChange={(event) => setStructureModalValue(event.target.value)}
									placeholder={structureModalLabel}
									className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
									autoFocus
								/>
								{structureModalType === "locations" && (
									<input
										value={structureModalAddress}
										onChange={(event) => setStructureModalAddress(event.target.value)}
										placeholder="Address (optional)"
										className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
									/>
								)}
								<div className="flex justify-end gap-2 pt-1">
									<button type="button" onClick={closeStructureModal} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">Cancel</button>
									<button type="submit" disabled={isSavingStructure} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isSavingStructure ? "Saving..." : "Create"}</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{loading ? (
					<p className="mt-4 text-sm text-zinc-500">Loading HRM...</p>
				) : activeTab === "overview" ? (
					<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
						{[
							["Headcount", headcount],
							["Active Employees", activeCount],
							["Attendance Rate", `${attendance?.attendanceRate ?? 0}%`],
							["Payroll Cost", payroll?.totalPayrollCost ?? 0],
							["Average Salary", payroll?.averageSalary ?? 0],
							["Performance Avg", performance?.averageRating ?? 0],
							["Attrition", `${analytics?.attritionRate ?? 0}%`],
							["On Leave Today", analytics?.employeesOnLeaveToday ?? 0],
						].map(([label, value]) => (
							<div key={String(label)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<p className="text-xs text-zinc-500">{label}</p>
								<p className="mt-1 text-lg font-semibold text-zinc-900">{String(value)}</p>
							</div>
						))}
					</div>
				) : activeTab === "employees" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
						<form onSubmit={(event) => void handleCreateEmployee(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Add Employee</p>
							<input value={employeeForm.employeeCode} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employeeCode: event.target.value }))} placeholder="Employee code" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<input value={employeeForm.joinDate} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, joinDate: event.target.value }))} type="date" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<input value={employeeForm.salary} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, salary: event.target.value }))} placeholder="Salary" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							<select value={employeeForm.employmentType} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employmentType: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="FULL_TIME">FULL_TIME</option>
								<option value="PART_TIME">PART_TIME</option>
								<option value="CONTRACT">CONTRACT</option>
							</select>
							<select value={employeeForm.workMode} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, workMode: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="ON_SITE">ON_SITE</option>
								<option value="HYBRID">HYBRID</option>
								<option value="REMOTE">REMOTE</option>
							</select>
							<select value={employeeForm.departmentId} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, departmentId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Department (optional)</option>
								{structure.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
							</select>
							<select value={employeeForm.designationId} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, designationId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Designation (optional)</option>
								{structure.designations.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
							</select>
							<select value={employeeForm.teamId} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, teamId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Team (optional)</option>
								{structure.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
							</select>
							<select value={employeeForm.locationId} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, locationId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Location (optional)</option>
								{structure.locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
							</select>
							<button type="submit" disabled={savingEmployee} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{savingEmployee ? "Saving..." : "Create Employee"}</button>
						</form>

						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Employee Directory</p>
							<div className="mt-2 max-h-[520px] space-y-2 overflow-y-auto">
								{employees.map((employee) => (
									<div key={employee.id} className="rounded-lg border border-zinc-200 p-3">
										<p className="text-xs font-semibold text-zinc-800">{employee.user?.firstName || employee.employeeCode} ({employee.employeeCode})</p>
										<p className="text-[11px] text-zinc-500">{employee.user?.email || "No linked user"} · {employee.status}</p>
										<p className="text-[11px] text-zinc-500">{employee.designation?.title || "No designation"} · {employee.department?.name || "No department"}</p>
										<p className="text-[11px] text-zinc-500">Salary: {employee.salary} · Mode: {employee.workMode}</p>
										<p className="text-[11px] text-zinc-500">Manager: {employee.manager?.employeeCode || "Not assigned"}</p>
										<div className="mt-2 flex flex-wrap gap-1">
											<button type="button" onClick={() => void handleEditEmployee(employee)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Edit</button>
											<button type="button" onClick={() => void handleChangeEmployeeStatus(employee.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Status</button>
											<button type="button" onClick={() => void handleAssignManager(employee.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Assign Manager</button>
										</div>
									</div>
								))}
								{employees.length === 0 && <p className="text-xs text-zinc-500">No employees yet.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "structure" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						{([
							["Departments", "departments"],
							["Designations", "designations"],
							["Teams", "teams"],
							["Locations", "locations"],
						] as const).map(([title, type]) => (
							<div key={type} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<div className="flex items-center justify-between">
									<p className="text-sm font-semibold text-zinc-900">{title}</p>
									<button type="button" onClick={() => openStructureModal(type)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Add</button>
								</div>
								<div className="mt-2 max-h-[220px] space-y-2 overflow-y-auto">
									{(structure[type] || []).map((item) => (
										<div key={item.id} className="rounded-md border border-zinc-200 p-2">
											<p className="text-xs font-medium text-zinc-800">{item.name || item.title}</p>
											<p className="text-[11px] text-zinc-500">Employees: {item._count?.employees ?? 0}</p>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				) : activeTab === "attendance" ? (
					<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
						{[
							["Present Today", attendance?.totalPresentToday ?? 0],
							["Absent Today", attendance?.totalAbsentToday ?? 0],
							["Attendance Rate", `${attendance?.attendanceRate ?? 0}%`],
							["Late Check-ins", attendance?.totalLateToday ?? 0],
							["Overtime Hours", attendance?.totalOvertimeToday ?? 0],
						].map(([label, value]) => (
							<div key={String(label)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<p className="text-xs text-zinc-500">{label}</p>
								<p className="mt-1 text-lg font-semibold text-zinc-900">{String(value)}</p>
							</div>
						))}
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-3">
							<p className="text-sm font-semibold text-zinc-900">Check-in / Check-out</p>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<input
									type="date"
									value={attendanceDate}
									onChange={(event) => setAttendanceDate(event.target.value)}
									className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
								/>
								<select value={attendanceEmployeeId} onChange={(event) => setAttendanceEmployeeId(event.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
									<option value="">Select Employee</option>
									{employees.map((employee) => (
										<option key={employee.id} value={employee.id}>{employee.user?.firstName || employee.employeeCode} ({employee.employeeCode})</option>
									))}
								</select>
								<input
									type="datetime-local"
									value={manualCheckInAt}
									onChange={(event) => setManualCheckInAt(event.target.value)}
									className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
									title="Manual check-in time"
								/>
								<button type="button" onClick={() => void handleCheckIn()} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Check-in</button>
								<input
									type="datetime-local"
									value={manualCheckOutAt}
									onChange={(event) => setManualCheckOutAt(event.target.value)}
									className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
									title="Manual check-out time"
								/>
								<button type="button" onClick={() => void handleCheckOut()} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">Check-out</button>
								<button type="button" onClick={downloadAttendanceExcel} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Download Excel</button>
							</div>
							<p className="mt-2 text-[11px] text-zinc-500">Manual mode: pick employee and optional date/time. If date/time is empty, selected attendance date with current time is used.</p>

							<div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
								<p className="text-sm font-semibold text-zinc-800">Filter Daily Records</p>
								<input
									type="text"
									value={attendanceNameFilter}
									onChange={(event) => setAttendanceNameFilter(event.target.value)}
									placeholder="Search by employee name, code, or email"
									className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base"
								/>
							</div>

							<div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200">
								<table className="min-w-full divide-y divide-zinc-200 text-xs">
									<thead className="bg-zinc-50">
										<tr>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Employee</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Status</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Check-In</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Check-Out</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Hours</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Overtime</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Late</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 bg-white">
										{filteredDailyAttendance.map((record) => (
											<tr key={record.employeeId}>
												<td className="px-3 py-2 text-zinc-700">{record.employeeName} ({record.employeeCode})</td>
												<td className="px-3 py-2 text-zinc-700">{record.status}</td>
												<td className="px-3 py-2 text-zinc-700">{formatDateTime(record.checkIn)}</td>
												<td className="px-3 py-2 text-zinc-700">{formatDateTime(record.checkOut)}</td>
												<td className="px-3 py-2 text-zinc-700">{record.totalHours}</td>
												<td className="px-3 py-2 text-zinc-700">{record.overtimeHours}</td>
												<td className="px-3 py-2 text-zinc-700">{record.isLate ? "Yes" : "No"}</td>
											</tr>
										))}
										{filteredDailyAttendance.length === 0 && (
											<tr>
												<td colSpan={7} className="px-3 py-4 text-center text-zinc-500">No attendance records for selected date.</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				) : activeTab === "payroll" ? (
					<div className="mt-4 space-y-4">
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<div className="flex flex-wrap items-end gap-2">
								<div>
									<p className="text-xs text-zinc-500">Month</p>
									<input type="number" min={1} max={12} value={month} onChange={(event) => setMonth(Number(event.target.value || 1))} className="rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
								</div>
								<div>
									<p className="text-xs text-zinc-500">Year</p>
									<input type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value || new Date().getFullYear()))} className="rounded-lg border border-zinc-300 px-2 py-1 text-sm" />
								</div>
								<input value={payrollSearch} onChange={(event) => setPayrollSearch(event.target.value)} placeholder="Search employee" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
								<button type="button" onClick={() => void refreshDashboards()} disabled={isRefreshingDash} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isRefreshingDash ? "Refreshing..." : "Refresh"}</button>
								<button type="button" onClick={() => void handleExportPayrollRegister()} disabled={isExportingPayroll} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">{isExportingPayroll ? "Exporting..." : "Export Register"}</button>
							</div>
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<select value={payrollEmployeeId} onChange={(event) => setPayrollEmployeeId(event.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
									<option value="">Select Employee for Payroll</option>
									{employees.map((employee) => (
										<option key={employee.id} value={employee.id}>{employee.user?.firstName || employee.employeeCode} ({employee.employeeCode})</option>
									))}
								</select>
								<button type="button" onClick={() => void handleGeneratePayroll()} disabled={isGeneratingPayroll} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isGeneratingPayroll ? "Generating..." : "Generate Payroll"}</button>
								<button type="button" onClick={() => void handleBulkGeneratePayroll()} disabled={isBulkGeneratingPayroll} className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{isBulkGeneratingPayroll ? "Running..." : "Bulk Generate"}</button>
							</div>
							<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
								{[
									["Total Payroll", payroll?.totalPayrollCost ?? 0],
									["Employees Paid", payroll?.totalEmployeesPaid ?? 0],
									["Overtime Paid", payroll?.totalOvertimePaid ?? 0],
									["Deductions", payroll?.totalDeductions ?? 0],
									["Average Salary", payroll?.averageSalary ?? 0],
								].map(([label, value]) => (
									<div key={String(label)} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
										<p className="text-xs text-zinc-500">{label}</p>
										<p className="mt-1 text-lg font-semibold text-zinc-900">{String(value)}</p>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Payroll Register</p>
							<div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200">
								<table className="min-w-full divide-y divide-zinc-200 text-xs">
									<thead className="bg-zinc-50">
										<tr>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Employee</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Gross</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Net</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Final Net</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Status</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Payment</th>
											<th className="px-3 py-2 text-left font-semibold text-zinc-600">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 bg-white">
										{payrollRegister.map((record) => (
											<tr key={record.id}>
												<td className="px-3 py-2 text-zinc-700">{record.employee.user?.firstName || record.employee.employeeCode} ({record.employee.employeeCode})</td>
												<td className="px-3 py-2 text-zinc-700">{record.grossSalary}</td>
												<td className="px-3 py-2 text-zinc-700">{record.netSalary}</td>
												<td className="px-3 py-2 text-zinc-700">{record.finalNetSalary}</td>
												<td className="px-3 py-2 text-zinc-700">{record.status}</td>
												<td className="px-3 py-2 text-zinc-700">{record.paymentStatus} {record.paymentReconciled ? "(Reconciled)" : ""}</td>
												<td className="px-3 py-2 text-zinc-700">
													<div className="flex flex-wrap gap-1">
														<button type="button" onClick={() => void updatePayrollStatus(record.id, "APPROVED")} className="rounded border border-zinc-300 px-2 py-1">Approve</button>
														<button type="button" onClick={() => void updatePayrollStatus(record.id, "PAID")} className="rounded border border-zinc-300 px-2 py-1">Mark Paid</button>
														<button type="button" onClick={() => void updatePayrollStatus(record.id, "LOCKED")} className="rounded border border-zinc-300 px-2 py-1">Lock</button>
														<button type="button" onClick={() => void openPayrollAdjustments(record)} className="rounded border border-zinc-300 px-2 py-1">Adjust</button>
														<button type="button" onClick={() => void markPayrollPayment(record)} className="rounded border border-zinc-300 px-2 py-1">Payment</button>
														<button type="button" onClick={() => void reconcilePayroll(record, !record.paymentReconciled)} className="rounded border border-zinc-300 px-2 py-1">Reconcile</button>
														<button type="button" onClick={() => downloadPayslipPdf(record.id)} className="rounded border border-zinc-300 px-2 py-1">PDF</button>
													</div>
												</td>
											</tr>
										))}
										{payrollRegister.length === 0 && (
											<tr>
												<td colSpan={7} className="px-3 py-4 text-center text-zinc-500">No payroll records for selected month/year.</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<p className="text-sm font-semibold text-zinc-900">Salary Components</p>
								<form onSubmit={(event) => void createComponent(event)} className="mt-2 flex flex-wrap items-center gap-2">
									<input value={componentForm.name} onChange={(event) => setComponentForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
									<select value={componentForm.type} onChange={(event) => setComponentForm((prev) => ({ ...prev, type: event.target.value }))} className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
										<option value="EARNING">EARNING</option>
										<option value="DEDUCTION">DEDUCTION</option>
									</select>
									<input value={componentForm.value} onChange={(event) => setComponentForm((prev) => ({ ...prev, value: event.target.value }))} placeholder="Value" className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
									<label className="flex items-center gap-1 text-xs text-zinc-600"><input type="checkbox" checked={componentForm.isPercentage} onChange={(event) => setComponentForm((prev) => ({ ...prev, isPercentage: event.target.checked }))} /> %</label>
									<button type="submit" className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">Add</button>
								</form>
								<div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto">
									{salaryComponents.map((component) => (
										<div key={component.id} className="rounded-md border border-zinc-200 p-2">
											<p className="text-xs font-semibold text-zinc-800">{component.name} ({component.type})</p>
											<p className="text-[11px] text-zinc-500">{component.isPercentage ? `${component.value}%` : component.value}</p>
											<button type="button" onClick={() => void assignComponentToEmployee(component.id)} className="mt-1 rounded border border-zinc-300 px-2 py-1 text-[11px]">Assign to Employee</button>
										</div>
									))}
								</div>
							</div>

							<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<p className="text-sm font-semibold text-zinc-900">Payroll Audit Trail</p>
								<div className="mt-2 max-h-[280px] space-y-2 overflow-y-auto">
									{payrollAudit.map((entry) => (
										<div key={entry.id} className="rounded-md border border-zinc-200 p-2">
											<p className="text-xs font-semibold text-zinc-800">{entry.action} ({entry.beforeStatus || "-"} {"->"} {entry.afterStatus || "-"})</p>
											<p className="text-[11px] text-zinc-500">Actor: {entry.actorId} · {new Date(entry.createdAt).toLocaleString()}</p>
											{entry.note ? <p className="text-[11px] text-zinc-600">{entry.note}</p> : null}
										</div>
									))}
									{payrollAudit.length === 0 && <p className="text-xs text-zinc-500">No audit entries for this period.</p>}
								</div>
							</div>
						</div>
					</div>
				) : activeTab === "performance" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<form onSubmit={(event) => void handleCreateReview(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Create Performance Review</p>
							<select value={reviewForm.employeeId} onChange={(event) => setReviewForm((prev) => ({ ...prev, employeeId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Employee</option>
								{employees.map((employee) => (
									<option key={employee.id} value={employee.id}>{employee.user?.firstName || employee.employeeCode} ({employee.employeeCode})</option>
								))}
							</select>
							<select value={reviewForm.reviewerId} onChange={(event) => setReviewForm((prev) => ({ ...prev, reviewerId: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Reviewer</option>
								{employees.map((employee) => (
									<option key={employee.id} value={employee.id}>{employee.user?.firstName || employee.employeeCode} ({employee.employeeCode})</option>
								))}
							</select>
							<select value={reviewForm.rating} onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								<option value="">Rating</option>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
							</select>
							<textarea value={reviewForm.comments} onChange={(event) => setReviewForm((prev) => ({ ...prev, comments: event.target.value }))} placeholder="Comments (optional)" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" rows={3} />
							<button type="submit" disabled={isSavingReview} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isSavingReview ? "Saving..." : "Create Review"}</button>
						</form>

						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Performance Snapshot</p>
							<p className="mt-1 text-xs text-zinc-600">Average Rating: {performance?.averageRating ?? 0} · Reviews This Month: {performance?.reviewsThisMonth ?? 0}</p>
							<div className="mt-2 space-y-2">
								{performance?.topPerformers?.slice(0, 5).map((item) => (
									<div key={item.employeeId} className="rounded-md border border-zinc-200 p-2">
										<p className="text-xs font-medium text-zinc-800">{item.name} ({item.employeeCode})</p>
										<p className="text-[11px] text-zinc-500">Rating: {item.averageRating}</p>
									</div>
								))}
							</div>
						</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">HR Analytics</p>
							<ul className="mt-2 space-y-1 text-xs text-zinc-600">
								<li>Employees On Leave Today: {analytics?.employeesOnLeaveToday ?? 0}</li>
								<li>Overtime Hours: {analytics?.overtimeHours ?? 0}</li>
								<li>Attendance Rate: {analytics?.attendanceRate ?? 0}%</li>
								<li>Attrition: {analytics?.attritionRate ?? 0}%</li>
								<li>Performance Average: {analytics?.performanceAverage ?? 0}</li>
							</ul>
						</div>
					</div>
				) : (
					<div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
						<p className="text-sm font-semibold text-zinc-900">Organization Hierarchy</p>
						<p className="mt-1 text-xs text-zinc-600">{hierarchy?.organizationName || "Organization"} · Top-level: {hierarchy?.totalTopLevelEmployees ?? 0}</p>
						<div className="mt-3 max-h-[520px] overflow-y-auto">
							{hierarchy?.hierarchy?.length ? <NodeTree nodes={hierarchy.hierarchy} /> : <p className="text-xs text-zinc-500">No active hierarchy available.</p>}
						</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
