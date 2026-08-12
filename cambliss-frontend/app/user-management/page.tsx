"use client";

import { FormEvent, useEffect, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type ManagedUser = {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	role: "CLIENT" | "EMPLOYEE" | "PROJECT_MANAGER";
	phone?: string | null;
	department?: string | null;
	accesses: string[];
	createdAt: string;
};

type ManagedRole = "CLIENT" | "EMPLOYEE" | "PROJECT_MANAGER";

type UserEditState = {
	phone: string;
	department: string;
	role: ManagedRole;
	accesses: string[];
};

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Support", "Management"] as const;

const accessOptions = [
	{ key: "CRM", label: "CRM" },
	{ key: "HRM", label: "HRM" },
	{ key: "INVENTORY", label: "Inventory" },
	{ key: "FILE_SHARING", label: "File Sharing" },
	{ key: "STORE", label: "Store" },
	{ key: "VIDEO_CONNECT", label: "Video Connect" },
] as const;

export default function UserManagementPage() {
	const [users, setUsers] = useState<ManagedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [editState, setEditState] = useState<UserEditState | null>(null);
	const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
	const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
	const [resettingData, setResettingData] = useState(false);
	const [credentials, setCredentials] = useState<{
		email: string;
		password: string;
		loginUrl: string;
	} | null>(null);

	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [department, setDepartment] = useState<string>("Engineering");
	const [role, setRole] = useState<ManagedRole>("EMPLOYEE");
	const [accesses, setAccesses] = useState<string[]>(["CRM", "HRM", "INVENTORY", "FILE_SHARING", "STORE", "VIDEO_CONNECT"]);

	const [filterDepartment, setFilterDepartment] = useState("All");

	const getAuthHeaders = (): Headers => {
		const headers = new Headers();
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return headers;
	};

	const loadUsers = async () => {
		setLoading(true);
		setMessage(null);
		try {
			const response = await fetch("/api/user-management/users", {
				headers: getAuthHeaders(),
			});
			if (!response.ok) {
				const raw = await response.text();
				setMessage(raw || "Unable to load users.");
				setUsers([]);
				return;
			}
			setUsers((await response.json()) as ManagedUser[]);
		} catch {
			setMessage("Unable to load users.");
			setUsers([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadUsers();
	}, []);

	const handleToggleAccess = (key: string) => {
		setAccesses((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
	};

	const startEditUser = (user: ManagedUser) => {
		setEditingUserId(user.id);
		setEditState({
			phone: user.phone || "",
			department: user.department || "Engineering",
			role: user.role,
			accesses: [...user.accesses],
		});
		setMessage(null);
	};

	const cancelEditUser = () => {
		setEditingUserId(null);
		setEditState(null);
	};

	const handleToggleEditAccess = (key: string) => {
		setEditState((prev) => {
			if (!prev) {
				return prev;
			}
			return {
				...prev,
				accesses: prev.accesses.includes(key)
					? prev.accesses.filter((item) => item !== key)
					: [...prev.accesses, key],
			};
		});
	};

	const handleSaveUser = async (userId: string) => {
		if (!editState) {
			return;
		}

		setUpdatingUserId(userId);
		setMessage(null);
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");

			const response = await fetch(`/api/user-management/users/${userId}/access`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					phone: editState.phone,
					department: editState.department,
					role: editState.role,
					accesses: editState.accesses,
				}),
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
			if (!response.ok) {
				setMessage(data?.message || "Unable to update user.");
				return;
			}

			setMessage("User updated successfully.");
			setEditingUserId(null);
			setEditState(null);
			await loadUsers();
		} catch {
			setMessage("Unable to update user.");
		} finally {
			setUpdatingUserId(null);
		}
	};

	const handleDeactivateUser = async (userId: string) => {
		if (!window.confirm("Deactivate this user? They will lose organization access.")) {
			return;
		}

		setDeletingUserId(userId);
		setMessage(null);
		try {
			const response = await fetch(`/api/user-management/users/${userId}`, {
				method: "DELETE",
				headers: getAuthHeaders(),
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
			if (!response.ok) {
				setMessage(data?.message || "Unable to deactivate user.");
				return;
			}

			setMessage("User deactivated successfully.");
			if (editingUserId === userId) {
				setEditingUserId(null);
				setEditState(null);
			}
			await loadUsers();
		} catch {
			setMessage("Unable to deactivate user.");
		} finally {
			setDeletingUserId(null);
		}
	};

	const handleResetAllData = async () => {
		const confirmText = window.prompt(
			"This will delete all CRM data and all managed users (except your main account). Type RESET to continue.",
		);

		if (confirmText !== "RESET") {
			setMessage("Reset cancelled.");
			return;
		}

		setResettingData(true);
		setMessage(null);
		setCredentials(null);
		setEditingUserId(null);
		setEditState(null);

		try {
			const response = await fetch("/api/user-management/reset-data", {
				method: "POST",
				headers: getAuthHeaders(),
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string; deletedUsers?: number }) : null;
			if (!response.ok) {
				setMessage(data?.message || "Unable to reset data.");
				return;
			}

			setMessage(`${data?.message || "Reset complete."} Deleted users: ${data?.deletedUsers ?? 0}.`);
			await loadUsers();
		} catch {
			setMessage("Unable to reset data.");
		} finally {
			setResettingData(false);
		}
	};

	const handleCreateUser = async (event: FormEvent) => {
		event.preventDefault();
		setSaving(true);
		setMessage(null);
		setCredentials(null);
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");
			const response = await fetch("/api/user-management/users", {
				method: "POST",
				headers,
				body: JSON.stringify({ email, phone, department, role, accesses }),
			});

			const raw = await response.text();
			const data = raw ? (JSON.parse(raw) as { message?: string; tempPassword?: string; user?: { email?: string } }) : null;

			if (!response.ok) {
				setMessage(data?.message || "Unable to create user.");
				return;
			}

			setEmail("");
			setPhone("");
			setDepartment("Engineering");
			setRole("EMPLOYEE");
			setAccesses(["CRM", "HRM", "INVENTORY", "FILE_SHARING", "STORE", "VIDEO_CONNECT"]);

			const createdEmail = data?.user?.email || "";
			const tempPassword = data?.tempPassword || "";
			const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:3000/login";

			if (createdEmail && tempPassword) {
				setCredentials({
					email: createdEmail,
					password: tempPassword,
					loginUrl,
				});
				setMessage("User created. Share credentials with the user.");
			} else {
				setMessage(`User created. Temporary password: ${data?.tempPassword || "(not returned)"}`);
			}
			await loadUsers();
		} catch {
			setMessage("Unable to create user.");
		} finally {
			setSaving(false);
		}
	};

	const credentialsMailTo = credentials
		? `mailto:${encodeURIComponent(credentials.email)}?subject=${encodeURIComponent("Your account credentials")}&body=${encodeURIComponent(
			`Hi,\n\nYour account has been created.\n\nLogin URL: ${credentials.loginUrl}\nEmail: ${credentials.email}\nPassword: ${credentials.password}\n\nPlease login and change your password after first sign-in.\n`,
		)}`
		: "#";

	const handleCopyCredentials = async () => {
		if (!credentials) {
			return;
		}

		const text = `Login URL: ${credentials.loginUrl}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
		try {
			await navigator.clipboard.writeText(text);
			setMessage("Credentials copied to clipboard.");
		} catch {
			setMessage("Unable to copy credentials.");
		}
	};

	const filteredUsers = users.filter((u) => filterDepartment === "All" || u.department === filterDepartment);

	return (
		<WorkspaceShell>
			<div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">User Management</h1>
				<p className="mt-1 text-sm text-zinc-600">Add email, phone, role, and access rights.</p>
				<p className="mt-1 text-xs text-zinc-500">Managed users will not get Order History menu access.</p>
				<div className="mt-3">
					<button
						type="button"
						onClick={() => void handleResetAllData()}
						disabled={resettingData || loading || saving}
						className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
					>
						{resettingData ? "Resetting..." : "Clear User Management + CRM Data"}
					</button>
				</div>
				{message && <p className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{message}</p>}
				{credentials && (
					<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
						<p className="text-xs font-semibold text-emerald-800">User Credentials</p>
						<p className="mt-1 text-[11px] text-emerald-700">Email: {credentials.email}</p>
						<p className="text-[11px] text-emerald-700">Password: {credentials.password}</p>
						<p className="text-[11px] text-emerald-700">Login URL: {credentials.loginUrl}</p>
						<div className="mt-2 flex gap-2">
							<a href={credentialsMailTo} className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700">Send Email Draft</a>
							<button type="button" onClick={() => void handleCopyCredentials()} className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700">Copy Credentials</button>
						</div>
					</div>
				)}

				<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
					<form onSubmit={(event) => void handleCreateUser(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
						<p className="text-sm font-semibold text-zinc-900">Add User</p>
						<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="Email" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
						<div className="grid grid-cols-2 gap-2">
							<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
								{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
							</select>
						</div>
						<select value={role} onChange={(event) => setRole(event.target.value as "CLIENT" | "EMPLOYEE" | "PROJECT_MANAGER")} className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm">
							<option value="EMPLOYEE">EMPLOYEE</option>
							<option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
							<option value="CLIENT">CLIENT</option>
						</select>
						<div className="rounded-lg border border-zinc-200 p-2">
							<p className="text-xs font-semibold text-zinc-700">Access Rights</p>
							<div className="mt-2 grid grid-cols-2 gap-2">
								{accessOptions.map((option) => (
									<label key={option.key} className="flex items-center gap-2 text-xs text-zinc-700">
										<input type="checkbox" checked={accesses.includes(option.key)} onChange={() => handleToggleAccess(option.key)} />
										{option.label}
									</label>
								))}
							</div>
						</div>
						<button type="submit" disabled={saving} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{saving ? "Saving..." : "Create User"}</button>
					</form>

					<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
							<p className="text-sm font-semibold text-zinc-900">Organization Users ({filteredUsers.length})</p>
							<select 
								value={filterDepartment} 
								onChange={(e) => setFilterDepartment(e.target.value)}
								className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
							>
								<option value="All">All Departments</option>
								{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
							</select>
						</div>
						{loading ? (
							<p className="mt-2 text-xs text-zinc-500">Loading users...</p>
						) : (
							<div className="mt-2 max-h-[380px] space-y-2 overflow-y-auto pr-1">
								{filteredUsers.map((user) => {
									const isEditing = editingUserId === user.id;
									const isUpdating = updatingUserId === user.id;
									const isDeleting = deletingUserId === user.id;

									return (
										<div key={user.id} className="rounded-lg border border-zinc-200 p-3 bg-zinc-50/50">
											<div className="flex justify-between items-start">
												<div>
													<p className="text-sm font-semibold text-zinc-800">{user.email}</p>
													<div className="flex gap-2 mt-1">
														<span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{user.department || "No Dept"}</span>
														<span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">{user.role}</span>
													</div>
												</div>
											</div>

											{isEditing && editState ? (
												<div className="mt-3 space-y-2 border-t border-zinc-200 pt-3">
													<div className="grid grid-cols-2 gap-2">
														<input
															value={editState.phone}
															onChange={(event) =>
																setEditState((prev) => (prev ? { ...prev, phone: event.target.value } : prev))
															}
															placeholder="Phone"
															className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-[11px]"
														/>
														<select
															value={editState.department}
															onChange={(event) =>
																setEditState((prev) => (prev ? { ...prev, department: event.target.value } : prev))
															}
															className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-[11px]"
														>
															{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
														</select>
													</div>
													<select
														value={editState.role}
														onChange={(event) =>
															setEditState((prev) => (prev ? { ...prev, role: event.target.value as ManagedRole } : prev))
														}
														className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-[11px]"
													>
														<option value="EMPLOYEE">EMPLOYEE</option>
														<option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
														<option value="CLIENT">CLIENT</option>
													</select>
													<div className="rounded-lg border border-zinc-200 p-2">
														<p className="text-[11px] font-semibold text-zinc-700">Access Rights</p>
														<div className="mt-1 grid grid-cols-2 gap-2">
															{accessOptions.map((option) => (
																<label key={option.key} className="flex items-center gap-1 text-[11px] text-zinc-700">
																	<input
																		type="checkbox"
																		checked={editState.accesses.includes(option.key)}
																		onChange={() => handleToggleEditAccess(option.key)}
																	/>
																	{option.label}
																</label>
															))}
														</div>
													</div>
													<div className="flex gap-2">
														<button
															type="button"
															onClick={() => void handleSaveUser(user.id)}
															disabled={isUpdating || isDeleting}
															className="rounded-md border border-zinc-900 bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white"
														>
															{isUpdating ? "Saving..." : "Save"}
														</button>
														<button
															type="button"
															onClick={cancelEditUser}
															disabled={isUpdating || isDeleting}
															className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700"
														>
															Cancel
														</button>
													</div>
												</div>
											) : (
												<>
													<p className="mt-2 text-[11px] text-zinc-500">Phone: {user.phone || "N/A"}</p>
													<p className="mt-1 text-[11px] text-zinc-500">Access: {user.accesses.length ? user.accesses.join(", ") : "No access assigned"}</p>
													<div className="mt-2 flex gap-2">
														<button
															type="button"
															onClick={() => startEditUser(user)}
															disabled={isDeleting}
															className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700"
														>
															Edit
														</button>
														<button
															type="button"
															onClick={() => void handleDeactivateUser(user.id)}
															disabled={isDeleting}
															className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
														>
															{isDeleting ? "Deactivating..." : "Deactivate"}
														</button>
													</div>
												</>
											)}
										</div>
									);
								})}
								{filteredUsers.length === 0 && <p className="text-xs text-zinc-500">No users found.</p>}
							</div>
						)}
					</div>
				</div>
			</div>
		</WorkspaceShell>
	);
}
