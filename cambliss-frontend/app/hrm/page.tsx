"use client";

import { FormEvent, useEffect, useMemo, useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import * as XLSX from "xlsx";
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
	firstName: "",
	lastName: "",
	email: "",
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

const parseCSV = (text: string) => {
	const lines = text.split('\n').filter(l => l.trim() !== '');
	if (lines.length === 0) return { headers: [], rows: [] };
	const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
	const rows = lines.slice(1).map(line => {
		const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
		return headers.reduce((acc, header, index) => {
			acc[header] = values[index] || '';
			return acc;
		}, {} as Record<string, string>);
	});
	return { headers, rows };
};

const parseSalaryNumber = (val: any): number => {
	if (typeof val === "number") return isNaN(val) ? 0 : val;
	if (!val) return 0;
	const cleanStr = String(val).replace(/[^0-9.]/g, "");
	const num = parseFloat(cleanStr);
	return isNaN(num) ? 0 : num;
};

const IMPORT_MODULE_FIELDS = {
	employees: [
		{ key: "employeeCode", label: "Employee Code", required: true, aliases: ["employeecode", "empcode", "emp code", "emp id", "empid", "employee id", "employeeid", "staff id", "staffid", "id"] },
		{ key: "firstName", label: "First Name", required: true, aliases: ["firstname", "first", "fname", "frstname", "given name", "givenname", "forename", "name", "fullname", "full name", "employee name"] },
		{ key: "lastName", label: "Last Name", required: false, aliases: ["lastname", "last", "lname", "surname", "family name", "familyname"] },
		{ key: "email", label: "Email Address", required: true, aliases: ["email", "emailaddress", "e-mail", "email id", "emailid", "mail", "work email"] },
		{ key: "salary", label: "Salary", required: false, aliases: ["salary", "pay", "ctc", "gross salary", "grosssalary", "basic", "wages", "compensation"] },
		{ key: "departmentName", label: "Department", required: false, aliases: ["department", "dept", "department name", "dept name", "division"] },
		{ key: "designationTitle", label: "Designation", required: false, aliases: ["designation", "title", "job title", "role", "position", "designation title"] },
		{ key: "phone", label: "Phone Number", required: false, aliases: ["phone", "phone number", "mobile", "mobile number", "contact", "contact number", "tel"] },
		{ key: "workMode", label: "Work Mode", required: false, aliases: ["work mode", "workmode", "mode", "location mode", "workplace"] },
		{ key: "employmentType", label: "Employment Type", required: false, aliases: ["employment type", "employmenttype", "type", "job type", "emp type"] },
	],
	attendance: [
		{ key: "employeeCode", label: "Employee Code", required: true, aliases: ["employeecode", "empcode", "emp code", "emp id", "empid", "employee id", "employeeid"] },
		{ key: "checkIn", label: "Check-in Time", required: true, aliases: ["checkin", "check in", "check-in", "login", "in time", "intime", "start time", "arrival"] },
		{ key: "checkOut", label: "Check-out Time", required: false, aliases: ["checkout", "check out", "check-out", "logout", "out time", "outtime", "end time", "departure"] },
	],
	payroll: [
		{ key: "employeeCode", label: "Employee Code", required: true, aliases: ["employeecode", "empcode", "emp code", "emp id", "empid"] },
		{ key: "month", label: "Month", required: true, aliases: ["month", "paymonth", "pay month", "period month"] },
		{ key: "year", label: "Year", required: true, aliases: ["year", "payyear", "pay year", "period year"] },
		{ key: "grossSalary", label: "Gross Salary", required: true, aliases: ["grosssalary", "gross salary", "gross", "total pay", "totalpay", "ctc"] },
	]
};

const TOP_HRMS = [
	{ id: "workday", name: "Workday", color: "bg-[#005cb9]/10 text-[#005cb9] border-[#005cb9]/20", logo: "🌤️" },
	{ id: "bamboohr", name: "BambooHR", color: "bg-[#91c11e]/10 text-[#91c11e] border-[#91c11e]/20", logo: "🐼" },
	{ id: "gusto", name: "Gusto", color: "bg-[#f45d48]/10 text-[#f45d48] border-[#f45d48]/20", logo: "🍃" },
	{ id: "adp", name: "ADP", color: "bg-[#d0271d]/10 text-[#d0271d] border-[#d0271d]/20", logo: "🔴" },
	{ id: "rippling", name: "Rippling", color: "bg-[#fdb515]/10 text-[#fdb515] border-[#fdb515]/20", logo: "🌊" },
	{ id: "paycor", name: "Paycor", color: "bg-[#007da5]/10 text-[#007da5] border-[#007da5]/20", logo: "💳" },
	{ id: "zenefits", name: "Zenefits", color: "bg-[#f36b22]/10 text-[#f36b22] border-[#f36b22]/20", logo: "🧘" },
	{ id: "deel", name: "Deel", color: "bg-[#2c71f0]/10 text-[#2c71f0] border-[#2c71f0]/20", logo: "🌍" },
	{ id: "paylocity", name: "Paylocity", color: "bg-[#f26722]/10 text-[#f26722] border-[#f26722]/20", logo: "🏢" },
	{ id: "successfactors", name: "SAP", color: "bg-[#f0ab00]/10 text-[#f0ab00] border-[#f0ab00]/20", logo: "🏆" },
];

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

	// Full Edit Employee State
	const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
	const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);

	// External HRM Integration State
	const [selectedHrmToConnect, setSelectedHrmToConnect] = useState<string | null>(null);
	const [connectedHrms, setConnectedHrms] = useState<string[]>([]);

	// Smart Attendance Kiosk State
	const [selectedKioskEmployeeId, setSelectedKioskEmployeeId] = useState("");
	const [isCameraActive, setIsCameraActive] = useState(false);
	const [isScanning, setIsScanning] = useState(false);
	const [scanResult, setScanResult] = useState<{ name: string, action: string } | null>(null);
	const webcamRef = useRef<Webcam>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

	const startCameraStream = async () => {
		try {
			if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
				const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
				setCameraStream(stream);
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.play().catch(() => {});
				}
				setIsCameraActive(true);
			} else {
				setIsCameraActive(true);
			}
		} catch (err) {
			console.error("Camera permission error:", err);
			setIsCameraActive(true);
		}
	};

	const stopCameraStream = () => {
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
			setCameraStream(null);
		}
		setIsCameraActive(false);
	};

	// Enrollment State
	const [enrollingEmployee, setEnrollingEmployee] = useState<string | null>(null);
	const [isEnrollScanning, setIsEnrollScanning] = useState(false);
	const [enrollTab, setEnrollTab] = useState<"camera" | "upload">("camera");
	const [enrollPhotoFile, setEnrollPhotoFile] = useState<string | null>(null);
	const [enrollCameraError, setEnrollCameraError] = useState<string | null>(null);
	const enrollWebcamRef = useRef<Webcam>(null);
	const enrollVideoRef = useRef<HTMLVideoElement>(null);

	const startEnrollCamera = async () => {
		setEnrollCameraError(null);
		try {
			if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true });
				if (enrollVideoRef.current) {
					enrollVideoRef.current.srcObject = stream;
					enrollVideoRef.current.play().catch(() => {});
				}
			}
		} catch (err) {
			console.error("Enroll camera error:", err);
			setEnrollCameraError("Camera permission blocked or HTTP restricted. Click 'Upload Photo File' tab above.");
		}
	};

	useEffect(() => {
		if (enrollingEmployee && enrollTab === "camera") {
			void startEnrollCamera();
		}
	}, [enrollingEmployee, enrollTab]);

	const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => {
			if (typeof reader.result === "string") {
				setEnrollPhotoFile(reader.result);
			}
		};
		reader.readAsDataURL(file);
	};

	const handleEnrollFace = async () => {
		if (!enrollingEmployee) return;

		let imageSrc = enrollTab === "upload" ? enrollPhotoFile : enrollWebcamRef.current?.getScreenshot();

		if (!imageSrc && enrollVideoRef.current) {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = enrollVideoRef.current.videoWidth || 640;
				canvas.height = enrollVideoRef.current.videoHeight || 480;
				const ctx = canvas.getContext("2d");
				if (ctx) {
					ctx.drawImage(enrollVideoRef.current, 0, 0, canvas.width, canvas.height);
					imageSrc = canvas.toDataURL("image/jpeg");
				}
			} catch (err) {
				console.error("Frame capture error:", err);
			}
		}

		if (!imageSrc) {
			setNotice(enrollTab === "upload" ? "Please select an image photo file first." : "Unable to access camera feed. Please click 'Upload Photo File' tab above to select employee photo.");
			return;
		}

		setIsEnrollScanning(true);
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");

			const response = await fetch(`/api/hrm/employees/${enrollingEmployee}/enroll-face`, {
				method: "POST",
				headers,
				body: JSON.stringify({ imageBase64: imageSrc }),
			});

			if (response.ok) {
				setNotice("Face successfully enrolled for employee!");
				setEnrollingEmployee(null);
				setEnrollPhotoFile(null);
			} else {
				const data = await response.json().catch(() => ({}));
				setNotice(data.message || "Failed to enroll face");
			}
		} catch (err) {
			setNotice("An error occurred while enrolling face");
		} finally {
			setIsEnrollScanning(false);
		}
	};

	const startCamera = () => {
		setIsCameraActive(true);
		setScanResult(null);
	};

	const stopCamera = () => {
		setIsCameraActive(false);
		setIsScanning(false);
	};

	// Clean up camera on unmount
	useEffect(() => {
		return () => stopCamera();
	}, []);

	const handleSmartScan = async (actionType: "checkin" | "checkout") => {
		if (!selectedKioskEmployeeId) {
			setNotice("Please select an employee from the dropdown list first.");
			return;
		}

		if (!isCameraActive || !cameraStream) {
			await startCameraStream();
		}

		setIsScanning(true);
		setScanResult(null);

		setTimeout(async () => {
			let imageSrc = webcamRef.current?.getScreenshot();

			if (!imageSrc && videoRef.current) {
				try {
					const canvas = document.createElement("canvas");
					canvas.width = videoRef.current.videoWidth || 640;
					canvas.height = videoRef.current.videoHeight || 480;
					const ctx = canvas.getContext("2d");
					if (ctx) {
						ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
						imageSrc = canvas.toDataURL("image/jpeg");
					}
				} catch (err) {
					console.error("Frame capture error:", err);
				}
			}

			if (!imageSrc) {
				setNotice("Camera is initializing... Please grant camera permission in your browser and click again.");
				setIsScanning(false);
				return;
			}

			try {
				const headers = getAuthHeaders();
				headers.set("Content-Type", "application/json");

				const response = await fetch("/api/hrm/attendance/smart-scan", {
					method: "POST",
					headers,
					body: JSON.stringify({
						imageBase64: imageSrc,
						employeeId: selectedKioskEmployeeId,
						actionType,
					}),
				});

				if (response.ok) {
					const result = await response.json();
					const targetEmp = employees.find(e => e.id === selectedKioskEmployeeId);
					const empDisplayName = targetEmp ? `${targetEmp.user?.firstName || ''} ${targetEmp.user?.lastName || ''} (${targetEmp.employeeCode})`.trim() : (result.employeeCode || "Employee");

					setNotice(result.message || `Attendance recorded successfully.`);
					setScanResult({ 
						name: empDisplayName, 
						action: actionType === "checkin" ? "Checked In" : "Checked Out" 
					});
					await loadAll();
				} else {
					setNotice(await getApiErrorMessage(response, `Smart ${actionType} failed. Please ensure face is enrolled.`));
				}
			} catch {
				setNotice("Network error during face scan.");
			} finally {
				setIsScanning(false);
			}
		}, 500);
	};
	const [isConnectingHrm, setIsConnectingHrm] = useState(false);
	const [structureModalError, setStructureModalError] = useState<string | null>(null);

	// Import Wizard State
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
	const [importModule, setImportModule] = useState<"employees" | "attendance" | "payroll">("employees");
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importHeaders, setImportHeaders] = useState<string[]>([]);
	const [importData, setImportData] = useState<Record<string, string>[]>([]);
	const [columnMapping, setColumnMapping] = useState<Record<string, { csvColumn: string, defaultValue: string }>>({});
	const [isImporting, setIsImporting] = useState(false);

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
					firstName: employeeForm.firstName.trim(),
					lastName: employeeForm.lastName.trim(),
					email: employeeForm.email.trim(),
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

	const handleSaveEditEmployee = async (e: FormEvent) => {
		e.preventDefault();
		if (!editingEmployee) return;
		setIsUpdatingEmployee(true);
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const response = await fetch(`/api/hrm/employees/${editingEmployee.id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					employeeCode: editingEmployee.employeeCode,
					status: editingEmployee.status,
					employmentType: editingEmployee.employmentType,
					workMode: editingEmployee.workMode,
					salary: Number(editingEmployee.salary || 0),
					joinDate: editingEmployee.joinDate ? editingEmployee.joinDate.split("T")[0] : undefined,
					departmentId: editingEmployee.department?.id || undefined,
					designationId: editingEmployee.designation?.id || undefined,
					teamId: editingEmployee.team?.id || undefined,
					locationId: editingEmployee.location?.id || undefined,
					firstName: editingEmployee.user?.firstName || undefined,
					lastName: editingEmployee.user?.lastName || undefined,
					email: editingEmployee.user?.email || undefined,
				}),
			});

			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to update employee."));
				return;
			}

			setEditingEmployee(null);
			await loadAll();
			setNotice("Employee details updated successfully.");
		} finally {
			setIsUpdatingEmployee(false);
		}
	};

	const handleDeleteEmployee = async (employeeId: string) => {
		if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
		try {
			const headers = getAuthHeaders();
			const response = await fetch(`/api/hrm/employees/${employeeId}`, {
				method: "DELETE",
				headers,
			});
			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Failed to delete employee."));
				return;
			}
			await loadAll();
			setNotice("Employee deleted successfully.");
		} catch {
			setNotice("Unable to delete employee.");
		}
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

	const handleConnectExternalHrm = (event: FormEvent) => {
		event.preventDefault();
		if (!selectedHrmToConnect) return;
		setIsConnectingHrm(true);
		
		setTimeout(() => {
			if (!connectedHrms.includes(selectedHrmToConnect)) {
				setConnectedHrms(prev => [...prev, selectedHrmToConnect]);
			}
			setIsConnectingHrm(false);
		}, 1500);
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImportFile(file);
		
		const processParsedData = (headers: string[], rows: Record<string, string>[]) => {
			setImportHeaders(headers);
			setImportData(rows);
			
			// Normalize a string to bare lowercase alphanumeric for fuzzy matching
			const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
			const normalizedHeaders = headers.map(h => ({ original: h, normalized: normalize(h) }));

			const newMapping: Record<string, { csvColumn: string, defaultValue: string }> = {};
			IMPORT_MODULE_FIELDS[importModule].forEach(field => {
				const allCandidates = [
					normalize(field.key),
					normalize(field.label),
					...(field.aliases || []).map(normalize),
				];
				const matched = normalizedHeaders.find(h => allCandidates.includes(h.normalized));
				newMapping[field.key] = {
					csvColumn: matched?.original || "",
					defaultValue: ""
				};
			});
			setColumnMapping(newMapping);
			setImportStep(3);
		};

		if (file.name.toLowerCase().endsWith('.csv')) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const text = event.target?.result as string;
				const { headers, rows } = parseCSV(text);
				processParsedData(headers, rows);
			};
			reader.readAsText(file);
		} else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const data = new Uint8Array(event.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];
				const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, any>[];
				
				if (jsonRows.length === 0) {
					processParsedData([], []);
					return;
				}
				
				const headers = Object.keys(jsonRows[0]);
				const rows = jsonRows.map(row => {
					const newRow: Record<string, string> = {};
					headers.forEach(h => {
						newRow[h] = String(row[h] || "");
					});
					return newRow;
				});
				
				processParsedData(headers, rows);
			};
			reader.readAsArrayBuffer(file);
		}
	};

	const downloadSample = () => {
		const fields = IMPORT_MODULE_FIELDS[importModule];
		const headerRow = fields.map(f => `"${f.label}"`).join(",");
		const blob = new Blob([headerRow + "\n"], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `cambliss_hrm_${importModule}_sample.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const executeImport = async () => {
		setIsImporting(true);
		
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");

			if (importModule === "employees") {
				const promises = importData.map(async (row) => {
					const rawSalary = columnMapping.salary?.csvColumn ? row[columnMapping.salary.csvColumn] : columnMapping.salary?.defaultValue;
					const parsedSalary = parseSalaryNumber(rawSalary);

					const deptVal = columnMapping.departmentName?.csvColumn ? row[columnMapping.departmentName.csvColumn] : columnMapping.departmentName?.defaultValue;
					const desigVal = columnMapping.designationTitle?.csvColumn ? row[columnMapping.designationTitle.csvColumn] : columnMapping.designationTitle?.defaultValue;
					const phoneVal = columnMapping.phone?.csvColumn ? row[columnMapping.phone.csvColumn] : columnMapping.phone?.defaultValue;
					const modeVal = columnMapping.workMode?.csvColumn ? row[columnMapping.workMode.csvColumn] : columnMapping.workMode?.defaultValue;
					const empTypeVal = columnMapping.employmentType?.csvColumn ? row[columnMapping.employmentType.csvColumn] : columnMapping.employmentType?.defaultValue;

					const payload = {
						firstName: (columnMapping.firstName?.csvColumn ? row[columnMapping.firstName.csvColumn] : columnMapping.firstName?.defaultValue) || "",
						lastName: (columnMapping.lastName?.csvColumn ? row[columnMapping.lastName.csvColumn] : columnMapping.lastName?.defaultValue) || "",
						email: (columnMapping.email?.csvColumn ? row[columnMapping.email.csvColumn] : columnMapping.email?.defaultValue) || "",
						employeeCode: (columnMapping.employeeCode?.csvColumn ? row[columnMapping.employeeCode.csvColumn] : columnMapping.employeeCode?.defaultValue) || "",
						employmentType: empTypeVal || "FULL_TIME",
						workMode: modeVal || "OFFICE",
						salary: parsedSalary,
						phone: phoneVal || undefined,
						departmentName: deptVal || undefined,
						designationTitle: desigVal || undefined,
						joinDate: new Date().toISOString(),
					};
					return fetch("/api/hrm/employees", {
						method: "POST",
						headers: authHeaders,
						body: JSON.stringify(payload)
					});
				});
				await Promise.all(promises);
			}
			
			await loadAll();
			setImportStep(4);
		} catch (error) {
			console.error("Failed to import data:", error);
			setNotice("An error occurred during import.");
		} finally {
			setIsImporting(false);
		}
	};

	const closeImportModal = () => {
		setIsImportModalOpen(false);
		setTimeout(() => {
			setImportStep(1);
			setImportFile(null);
			setImportData([]);
			setImportHeaders([]);
			setColumnMapping({});
		}, 300);
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
			{/* Import Data Modal */}
			{isImportModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
						<button onClick={closeImportModal} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600">
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
						</button>
						<h2 className="text-2xl font-bold text-zinc-900 mb-6">HRM Data Import Wizard</h2>
						
						{importStep === 1 && (
							<div className="space-y-4">
								<p className="text-zinc-600">Select the module you want to import data into:</p>
								<div className="grid grid-cols-2 gap-4">
									{(["employees", "attendance", "payroll"] as const).map(mod => (
										<button 
											key={mod} 
											type="button"
											onClick={() => setImportModule(mod)}
											className={`p-4 rounded-xl border-2 text-left ${importModule === mod ? "border-[#404d85] bg-[#404d85]/5" : "border-zinc-200 hover:border-[#404d85]/50"}`}
										>
											<h3 className="font-semibold text-zinc-900 capitalize">{mod}</h3>
										</button>
									))}
								</div>
								<div className="flex justify-end pt-4">
									<button onClick={() => setImportStep(2)} className="bg-[#404d85] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#323d6a]">Next Step</button>
								</div>
							</div>
						)}
						
						{importStep === 2 && (
							<div className="space-y-6">
								<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
									<div>
										<h4 className="font-semibold text-blue-900">Need the correct format?</h4>
										<p className="text-sm text-blue-700">Download our sample CSV file for {importModule}.</p>
									</div>
									<button onClick={downloadSample} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm">Download Sample</button>
								</div>
								
								<div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center hover:bg-zinc-50 transition relative">
									<input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
									<svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									<p className="mt-4 text-sm text-zinc-600 font-medium">Click or drag CSV or Excel file to this area to upload</p>
								</div>
								<div className="flex justify-between pt-4">
									<button onClick={() => setImportStep(1)} className="text-zinc-600 font-semibold px-4 py-2 hover:bg-zinc-100 rounded-lg">Back</button>
								</div>
							</div>
						)}
						
						{importStep === 3 && (
							<div className="space-y-6">
								<p className="text-zinc-600">Map your CSV columns to the HRM fields. If a column is missing, you can provide a default fallback value.</p>
								<div className="border border-zinc-200 rounded-xl overflow-hidden">
									<table className="w-full text-left text-sm">
										<thead className="bg-zinc-50">
											<tr>
												<th className="px-4 py-3 font-semibold text-zinc-900 border-b border-zinc-200">HRM Field</th>
												<th className="px-4 py-3 font-semibold text-zinc-900 border-b border-zinc-200">Your CSV Column</th>
												<th className="px-4 py-3 font-semibold text-zinc-900 border-b border-zinc-200">Fallback Default Value</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-zinc-200">
											{IMPORT_MODULE_FIELDS[importModule].map(field => (
												<tr key={field.key}>
													<td className="px-4 py-3">
														<span className="font-medium text-zinc-900">{field.label}</span>
														{field.required && <span className="text-rose-500 ml-1">*</span>}
													</td>
													<td className="px-4 py-3">
														<select 
															value={columnMapping[field.key]?.csvColumn || ""} 
															onChange={(e) => setColumnMapping(prev => ({...prev, [field.key]: { ...prev[field.key], csvColumn: e.target.value }}))}
															className="w-full rounded-md border-zinc-300 shadow-sm text-sm focus:border-[#404d85] focus:ring-[#404d85]"
														>
															<option value="">-- Ignore / Missing --</option>
															{importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
														</select>
													</td>
													<td className="px-4 py-3">
														<input 
															type="text" 
															placeholder={field.required ? "Required fallback" : "e.g. Unknown"} 
															value={columnMapping[field.key]?.defaultValue || ""}
															onChange={(e) => setColumnMapping(prev => ({...prev, [field.key]: { ...prev[field.key], defaultValue: e.target.value }}))}
															disabled={!!columnMapping[field.key]?.csvColumn}
															className="w-full rounded-md border-zinc-300 shadow-sm text-sm focus:border-[#404d85] focus:ring-[#404d85] disabled:bg-zinc-100 disabled:text-zinc-400"
														/>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<div className="flex justify-between pt-4">
									<button onClick={() => setImportStep(2)} className="text-zinc-600 font-semibold px-4 py-2 hover:bg-zinc-100 rounded-lg">Back</button>
									<button onClick={executeImport} disabled={isImporting} className="bg-[#404d85] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#323d6a] shadow-lg disabled:opacity-50">
										{isImporting ? "Importing..." : `Import ${importData.length} Records`}
									</button>
								</div>
							</div>
						)}
						
						{importStep === 4 && (
							<div className="py-8 text-center space-y-4">
								<div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
									<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
								</div>
								<h3 className="text-2xl font-bold text-zinc-900">Import Successful!</h3>
								<p className="text-zinc-600">Successfully imported {importData.length} records into {importModule}.</p>
								<div className="pt-6">
									<button onClick={closeImportModal} className="bg-zinc-900 text-white px-8 py-2 rounded-lg font-semibold hover:bg-zinc-800 shadow-lg">Done</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* HRM Connection Modal */}
			{selectedHrmToConnect && (() => {
				const hrm = TOP_HRMS.find(c => c.id === selectedHrmToConnect);
				if (!hrm) return null;
				const isConnected = connectedHrms.includes(hrm.id);
				
				return (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
							<button onClick={() => setSelectedHrmToConnect(null)} className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors">
								<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
							</button>
							
							<div className="flex flex-col items-center text-center">
								<div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl shadow-md ${hrm.color} bg-white`}>
									{hrm.logo}
								</div>
								<h2 className="text-2xl font-bold text-zinc-900">{isConnected ? `Manage ${hrm.name}` : `Connect ${hrm.name}`}</h2>
								<p className="mt-2 text-sm text-zinc-600">
									{isConnected 
										? `Your ${hrm.name} account is currently syncing with Cambliss.` 
										: `Authorize Cambliss to access your ${hrm.name} data via API.`}
								</p>
							</div>

							{!isConnected ? (
								<form onSubmit={handleConnectExternalHrm} className="mt-8 space-y-4">
									<div>
										<label className="block text-xs font-semibold text-zinc-700 mb-1">API Key or Access Token</label>
										<input 
											type="password" 
											required
											placeholder={`Enter your ${hrm.name} API key`} 
											className="w-full rounded-xl border-zinc-300 px-4 py-3 text-sm shadow-sm focus:border-[#404d85] focus:ring-[#404d85]"
										/>
									</div>
									<div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 flex gap-3">
										<svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
										<p className="text-xs text-blue-800 leading-relaxed">
											In a production environment, this would redirect you to a secure OAuth 2.0 authorization screen provided by {hrm.name}.
										</p>
									</div>
									<button 
										type="submit" 
										disabled={isConnectingHrm}
										className="w-full mt-4 rounded-xl bg-[#404d85] px-4 py-3.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 hover:bg-[#323d6a] transition-all disabled:opacity-70 disabled:hover:translate-y-0"
									>
										{isConnectingHrm ? "Authenticating..." : `Connect ${hrm.name}`}
									</button>
								</form>
							) : (
								<div className="mt-8 space-y-4">
									<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-center gap-2 text-emerald-800 font-semibold">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
										Connection Active & Syncing
									</div>
									<button 
										onClick={() => {
											setConnectedHrms(prev => prev.filter(id => id !== hrm.id));
											setSelectedHrmToConnect(null);
										}}
										className="w-full rounded-xl border-2 border-rose-100 bg-white px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
									>
										Disconnect Integration
									</button>
								</div>
							)}
						</div>
					</div>
				);
			})()}

			<div className="mt-5 mb-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#404d85] to-[#252f5a] shadow-lg">
				<div className="px-8 py-8 md:px-10 text-center flex flex-col items-center justify-center">
					<h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
						Your HR Data, Fully Synchronized.
					</h2>
					<p className="mt-3 max-w-2xl text-sm md:text-base text-[#c9d4ea] font-medium leading-relaxed">
						Sync employees, run payroll, and manage performance by connecting your existing HR tools to Cambliss in seconds.
					</p>
					<div className="mt-4 bg-white/10 rounded-full px-5 py-2 border border-white/20 shadow-sm backdrop-blur-sm">
						<span className="text-sm font-bold text-white">
							Don't see your tool below? <a href="#" className="underline decoration-2 underline-offset-2 hover:text-blue-200 transition-colors">Let us know</a> and we'll build a custom connection immediately.
						</span>
					</div>
					
					{/* Top 10 HRM Grid */}
					<div className="mt-10 w-full max-w-5xl">
						<p className="text-sm font-semibold uppercase tracking-widest text-[#8f9ecf] mb-6">Supported Enterprise Integrations</p>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
							{TOP_HRMS.map(hrm => {
								const isConnected = connectedHrms.includes(hrm.id);
								return (
									<button
										key={hrm.id}
										onClick={() => setSelectedHrmToConnect(hrm.id)}
										className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${isConnected ? "bg-white/20 border-white/40 ring-2 ring-white/50" : "bg-white/5 border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg"}`}
									>
										{isConnected && (
											<div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-[#252f5a]">
												<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
											</div>
										)}
										<div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl border-2 text-2xl shadow-sm transition-transform group-hover:scale-110 ${hrm.color} bg-white`}>
											{hrm.logo}
										</div>
										<span className="text-xs font-bold text-white tracking-wide">{hrm.name}</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Premium HRM Suite</h1>
				<p className="mt-1 text-sm text-zinc-600">Enterprise-ready HR operations: employees, org structure, attendance, payroll, performance and hierarchy.</p>
				<div className="mt-3 flex gap-3">
					<button
						type="button"
						onClick={() => setIsImportModalOpen(true)}
						className="flex items-center gap-1.5 rounded-lg border border-[#404d85] bg-[#404d85] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#323d6a]"
					>
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
						Import Data (CSV)
					</button>
				</div>
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
							<div className="grid grid-cols-2 gap-2">
								<input value={employeeForm.firstName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="First name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
								<input value={employeeForm.lastName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Last name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
							</div>
							<input value={employeeForm.email} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))} type="email" placeholder="Email address" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" required />
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
											<button type="button" onClick={() => setEditingEmployee(employee)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Edit</button>
											<button type="button" onClick={() => void handleDeleteEmployee(employee.id)} className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
											<button type="button" onClick={() => void handleChangeEmployeeStatus(employee.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Status</button>
											<button type="button" onClick={() => void handleAssignManager(employee.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Assign Manager</button>
											<button type="button" onClick={() => setEnrollingEmployee(employee.id)} className="rounded-md border border-zinc-300 bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-zinc-800">Enroll Face</button>
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
						<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-3">
							<div className="flex justify-between items-center mb-4">
								<div>
									<h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
										<svg className="w-6 h-6 text-[#404d85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Smart Attendance Kiosk
									</h2>
									<p className="text-sm text-zinc-500 mt-1">Facial recognition terminal for automated check-ins.</p>
								</div>
								<button type="button" onClick={downloadAttendanceExcel} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">Download Excel</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
								{/* Camera View Area */}
								<div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-zinc-300 shadow-inner flex flex-col items-center justify-center">
									{isCameraActive ? (
										<div className="w-full h-full relative">
											<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
											<Webcam
												audio={false}
												ref={webcamRef}
												screenshotFormat="image/jpeg"
												className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
											/>
										</div>
									) : (
										<div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 p-4 text-center">
											<svg className="w-12 h-12 mb-2 opacity-50 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
											<p className="text-sm font-medium">Camera Feed Standby</p>
											<button
												type="button"
												onClick={() => void startCameraStream()}
												className="mt-3 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 shadow-sm"
											>
												🎥 Turn On Camera
											</button>
										</div>
									)}

									{/* Scanning Overlay Animation */}
									{isScanning && (
										<div className="absolute inset-0 border-4 border-[#404d85] border-dashed rounded-lg animate-pulse">
											<div className="absolute top-0 left-0 w-full h-1 bg-[#404d85] shadow-[0_0_8px_#404d85] animate-[scan_2s_ease-in-out_infinite]" />
										</div>
									)}

									{/* Status Overlay */}
									{scanResult && !isScanning && (
										<div className="absolute inset-x-0 bottom-0 bg-emerald-600/90 backdrop-blur-sm text-white p-3 text-center transform translate-y-0 transition-transform">
											<p className="font-bold text-lg">{scanResult.name}</p>
											<p className="text-sm text-emerald-100 font-medium">Successfully {scanResult.action} at {new Date().toLocaleTimeString()}</p>
										</div>
									)}
								</div>

								{/* Controls Area */}
								<div className="flex flex-col justify-center space-y-3">
									<div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm space-y-2">
										<label className="text-xs font-bold text-zinc-900 block">Select Employee for Attendance:</label>
										<select 
											value={selectedKioskEmployeeId}
											onChange={(e) => setSelectedKioskEmployeeId(e.target.value)} 
											className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-zinc-50 font-semibold text-zinc-900 shadow-sm"
										>
											<option value="">-- Select Employee --</option>
											{employees.map(emp => (
												<option key={emp.id} value={emp.id}>
													{emp.user?.firstName || emp.employeeCode} {emp.user?.lastName || ''} ({emp.employeeCode})
												</option>
											))}
										</select>
									</div>

									<div className="w-full h-px bg-zinc-200 my-1"></div>

									<button 
										type="button" 
										onClick={() => void handleSmartScan("checkin")} 
										disabled={isScanning}
										className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#404d85] to-[#252f5a] hover:from-[#323d6a] hover:to-[#1a2245] text-white font-bold text-base shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									>
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
										{isScanning ? "Scanning Face..." : "Scan Face to Check-In"}
									</button>
									
									<button 
										type="button" 
										onClick={() => void handleSmartScan("checkout")} 
										disabled={isScanning}
										className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-50 border-2 border-[#404d85] text-[#404d85] font-bold text-sm shadow-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									>
										<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
										Scan Face to Check-Out
									</button>

									<div className="flex justify-center pt-1">
										<button 
											type="button" 
											onClick={() => {
												if (isCameraActive) {
													stopCameraStream();
												} else {
													void startCameraStream();
												}
											}} 
											className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
										>
											{isCameraActive ? "Turn Off Camera Preview" : "Turn On Camera Preview"}
										</button>
									</div>
								</div>
							</div>
							
							<style dangerouslySetInnerHTML={{__html: `
								@keyframes scan {
									0% { transform: translateY(0); }
									50% { transform: translateY(200px); }
									100% { transform: translateY(0); }
								}
							`}} />

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
			{/* Enroll Face Modal */}
			{enrollingEmployee && (() => {
				const targetEmp = employees.find(e => e.id === enrollingEmployee);
				const empName = targetEmp ? `${targetEmp.user?.firstName || ''} ${targetEmp.user?.lastName || ''} (${targetEmp.employeeCode})`.trim() : "Employee";

				return (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl space-y-3 p-6">
							<div className="flex justify-between items-center border-b border-zinc-200 pb-3">
								<div>
									<h3 className="text-lg font-bold text-zinc-900">Enroll Employee Face</h3>
									<p className="text-xs font-semibold text-indigo-600 mt-0.5">{empName}</p>
								</div>
								<button onClick={() => { setEnrollingEmployee(null); setEnrollPhotoFile(null); }} className="text-zinc-400 hover:text-zinc-600">✕</button>
							</div>

							<div className="flex rounded-lg bg-zinc-100 p-1">
								<button
									type="button"
									onClick={() => setEnrollTab("camera")}
									className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${enrollTab === "camera" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
								>
									📷 Live Camera
								</button>
								<button
									type="button"
									onClick={() => setEnrollTab("upload")}
									className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${enrollTab === "upload" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
								>
									📁 Upload Photo File
								</button>
							</div>

							{enrollTab === "camera" ? (
								<div>
									<div className="relative overflow-hidden rounded-xl bg-zinc-900 aspect-video shadow-inner flex items-center justify-center">
										<video ref={enrollVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
										<Webcam
											ref={enrollWebcamRef}
											audio={false}
											screenshotFormat="image/jpeg"
											onUserMedia={() => setEnrollCameraError(null)}
											onUserMediaError={() => setEnrollCameraError("Camera access blocked by browser or HTTP. Use 'Upload Photo File' tab above.")}
											className="absolute inset-0 h-full w-full object-cover opacity-0 pointer-events-none"
										/>
										{enrollCameraError && (
											<div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center p-4 text-center text-zinc-300">
												<p className="text-xs font-semibold text-rose-400 mb-3">{enrollCameraError}</p>
												<button
													type="button"
													onClick={() => setEnrollTab("upload")}
													className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
												>
													📁 Switch to Upload Photo File
												</button>
											</div>
										)}
									</div>
									<div className="flex justify-between items-center mt-2">
										<p className="text-xs text-zinc-500">Ensure face is clear & well-lit.</p>
										<button
											type="button"
											onClick={() => void startEnrollCamera()}
											className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
										>
											🎥 Turn On Camera
										</button>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									<div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 text-center hover:bg-zinc-50 transition relative">
										<input type="file" accept="image/*" onChange={handlePhotoFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
										{enrollPhotoFile ? (
											<img src={enrollPhotoFile} alt="Selected preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
										) : (
											<div>
												<svg className="mx-auto h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
												<p className="mt-2 text-xs text-zinc-600 font-medium">Click or drag a clear employee face photo (.jpg, .png)</p>
											</div>
										)}
									</div>
								</div>
							)}

							<button 
								type="button" 
								onClick={() => void handleEnrollFace()} 
								disabled={isEnrollScanning || (enrollTab === "upload" && !enrollPhotoFile)}
								className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isEnrollScanning ? "Saving Face..." : enrollTab === "upload" ? "Save Photo Enrolment" : "Capture & Save Camera Face"}
							</button>
						</div>
					</div>
				);
			})()}

			{/* EDIT EMPLOYEE MODAL */}
			{editingEmployee && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between border-b border-zinc-200 pb-3">
							<h3 className="text-lg font-bold text-zinc-900">Edit Employee Details</h3>
							<button type="button" onClick={() => setEditingEmployee(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
						</div>
						<form onSubmit={(e) => void handleSaveEditEmployee(e)} className="space-y-3">
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="text-xs font-semibold text-zinc-700">First Name</label>
									<input value={editingEmployee.user?.firstName || ""} onChange={(e) => setEditingEmployee({ ...editingEmployee, user: { ...editingEmployee.user, firstName: e.target.value } })} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm" />
								</div>
								<div>
									<label className="text-xs font-semibold text-zinc-700">Last Name</label>
									<input value={editingEmployee.user?.lastName || ""} onChange={(e) => setEditingEmployee({ ...editingEmployee, user: { ...editingEmployee.user, lastName: e.target.value } })} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm" />
								</div>
							</div>
							<div>
								<label className="text-xs font-semibold text-zinc-700">Email Address</label>
								<input value={editingEmployee.user?.email || ""} onChange={(e) => setEditingEmployee({ ...editingEmployee, user: { ...editingEmployee.user, email: e.target.value } })} type="email" className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm" />
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="text-xs font-semibold text-zinc-700">Employee Code</label>
									<input value={editingEmployee.employeeCode} onChange={(e) => setEditingEmployee({ ...editingEmployee, employeeCode: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm" required />
								</div>
								<div>
									<label className="text-xs font-semibold text-zinc-700">Status</label>
									<select value={editingEmployee.status || "ACTIVE"} onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm">
										<option value="ACTIVE">ACTIVE</option>
										<option value="INACTIVE">INACTIVE</option>
										<option value="ON_LEAVE">ON_LEAVE</option>
										<option value="TERMINATED">TERMINATED</option>
									</select>
								</div>
							</div>
							<div className="grid grid-cols-3 gap-2">
								<div>
									<label className="text-xs font-semibold text-zinc-700">Employment Type</label>
									<select value={editingEmployee.employmentType || "FULL_TIME"} onChange={(e) => setEditingEmployee({ ...editingEmployee, employmentType: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm">
										<option value="FULL_TIME">FULL_TIME</option>
										<option value="PART_TIME">PART_TIME</option>
										<option value="CONTRACT">CONTRACT</option>
										<option value="INTERN">INTERN</option>
									</select>
								</div>
								<div>
									<label className="text-xs font-semibold text-zinc-700">Work Mode</label>
									<select value={editingEmployee.workMode || "OFFICE"} onChange={(e) => setEditingEmployee({ ...editingEmployee, workMode: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm">
										<option value="OFFICE">OFFICE</option>
										<option value="HYBRID">HYBRID</option>
										<option value="REMOTE">REMOTE</option>
									</select>
								</div>
								<div>
									<label className="text-xs font-semibold text-zinc-700">Salary ($)</label>
									<input value={editingEmployee.salary || 0} onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: Number(e.target.value) })} type="number" className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm" />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="text-xs font-semibold text-zinc-700">Department</label>
									<select value={editingEmployee.department?.id || ""} onChange={(e) => {
										const dept = structure.departments.find(d => d.id === e.target.value);
										setEditingEmployee({ ...editingEmployee, department: dept ? { id: dept.id, name: dept.name || "" } : null });
									}} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm">
										<option value="">None</option>
										{structure.departments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
									</select>
								</div>
								<div>
									<label className="text-xs font-semibold text-zinc-700">Designation</label>
									<select value={editingEmployee.designation?.id || ""} onChange={(e) => {
										const desig = structure.designations.find(d => d.id === e.target.value);
										setEditingEmployee({ ...editingEmployee, designation: desig ? { id: desig.id, title: desig.title || "" } : null });
									}} className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm">
										<option value="">None</option>
										{structure.designations.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
									</select>
								</div>
							</div>
							<div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
								<button type="button" onClick={() => setEditingEmployee(null)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700">Cancel</button>
								<button type="submit" disabled={isUpdatingEmployee} className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white">{isUpdatingEmployee ? "Saving..." : "Save All Changes"}</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</WorkspaceShell>
	);
}
