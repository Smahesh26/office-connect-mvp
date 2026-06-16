"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type PhaseTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClientMember = {
  user: {
    id: string;
    email: string;
    firstName: string | null; 
    lastName: string | null;
  };
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    memberships?: ClientMember[];
  };
  members?: Array<{
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
  tasks: PhaseTask[];
};

type NewPhaseForm = {
  title: string;
  description: string;
  dueDate: string;
};

type StatusUpdateForm = {
  status: string;
  note: string;
};

type ClientDirectoryItem = {
  id: string;
  name: string;
  email: string;
  organizationId: string;
};

type PaidClientOrder = {
  subscription?: {
    organization?: {
      id: string;
      name: string;
      memberships?: Array<{
        user: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string;
        };
      }>;
      users?: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
      }>;
    };
  };
};

const getRoleFromToken = (token?: string | null): string | null => {
  if (!token) return null;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
};

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];

export default function AdminProjectTrackingPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [newPhaseByProject, setNewPhaseByProject] = useState<Record<string, NewPhaseForm>>({});
  const [statusUpdateByProject, setStatusUpdateByProject] = useState<Record<string, StatusUpdateForm>>({});
  const [activeUserIdFilter, setActiveUserIdFilter] = useState("");
  const [activeOrganizationFilter, setActiveOrganizationFilter] = useState("");
  const [activeClientName, setActiveClientName] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [paidClients, setPaidClients] = useState<ClientDirectoryItem[]>([]);
  const [selectedClientIdForCreate, setSelectedClientIdForCreate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = getRoleFromToken(token);
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "PROJECT_MANAGER") {
      router.replace("/project-tracking");
      return;
    }

    const loadProjects = async () => {
      if (!token) {
        setLoading(false);
        setMessage("Please login first.");
        return;
      }

      try {
        const params = new URLSearchParams();
        if (activeUserIdFilter) {
          params.set("userId", activeUserIdFilter);
        }
        if (activeOrganizationFilter) {
          params.set("organizationId", activeOrganizationFilter);
        }
        const query = params.toString() ? `?${params.toString()}` : "";
        const response = await fetch(`/api/projects${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const raw = await response.text();
          const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
          setMessage(data?.message || "Unable to fetch project tracking.");
          setProjects([]);
          return;
        }

        const data = (await response.json()) as Project[];
        const normalized = Array.isArray(data) ? data : [];
        setProjects(normalized);

        const initialForms: Record<string, NewPhaseForm> = {};
        const initialStatusForms: Record<string, StatusUpdateForm> = {};
        for (const project of normalized) {
          initialForms[project.id] = { title: "", description: "", dueDate: "" };
          initialStatusForms[project.id] = { status: "", note: "" };
        }
        setNewPhaseByProject(initialForms);
        setStatusUpdateByProject(initialStatusForms);
      } catch {
        setMessage("Unable to fetch project tracking.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    const loadPaidClients = async () => {
      if (!token) {
        return;
      }

      try {
        const adminResponse = await fetch("/api/admin/order-history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const response = adminResponse.ok
          ? adminResponse
          : await fetch("/api/subscription/order-history", {
              headers: { Authorization: `Bearer ${token}` },
            });

        if (!response.ok) {
          setPaidClients([]);
          return;
        }

        const raw = (await response.json()) as PaidClientOrder[];
        const source = Array.isArray(raw) ? raw : [];
        const deduped = new Map<string, ClientDirectoryItem>();

        for (const order of source) {
          const organizationId = order.subscription?.organization?.id;
          if (!organizationId) {
            continue;
          }

          const membershipUsers = (order.subscription?.organization?.memberships || []).map((membership) => membership.user);
          const fallbackUsers = order.subscription?.organization?.users || [];
          const users = membershipUsers.length > 0 ? membershipUsers : fallbackUsers;
          for (const user of users) {
            if (!user?.id || !user?.email) {
              continue;
            }

            if (!deduped.has(user.id)) {
              deduped.set(user.id, {
                id: user.id,
                name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
                email: user.email,
                organizationId,
              });
            }
          }
        }

        const clients = Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
        setPaidClients(clients);

        if (clients.length > 0 && !selectedClientIdForCreate) {
          setSelectedClientIdForCreate(clients[0].id);
        }
      } catch {
        setPaidClients([]);
      }
    };

    void loadProjects();
    void loadPaidClients();
  }, [router, activeUserIdFilter, activeOrganizationFilter]);

  const projectsSorted = useMemo(
    () => projects.map((project) => ({ ...project, tasks: [...project.tasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) })),
    [projects],
  );

  const refreshProjects = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const params = new URLSearchParams();
    if (activeUserIdFilter) {
      params.set("userId", activeUserIdFilter);
    }
    if (activeOrganizationFilter) {
      params.set("organizationId", activeOrganizationFilter);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/projects${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = (await response.json()) as Project[];
    setProjects(Array.isArray(data) ? data : []);
  };

  const clearClientFilter = () => {
    setActiveUserIdFilter("");
    setActiveOrganizationFilter("");
    setActiveClientName("");
    setMessage("Showing all projects.");
  };

  const applyClientFilter = (client: ClientDirectoryItem) => {
    setActiveUserIdFilter(client.id);
    setActiveOrganizationFilter(client.organizationId);
    setActiveClientName(client.name);
    setMessage(`Showing projects for client: ${client.name}`);
  };

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) return;

    if (!projectName.trim()) {
      setMessage("Project name is required.");
      return;
    }

    if (!selectedClientIdForCreate) {
      setMessage("Select a paid subscription client before creating project.");
      return;
    }

    const selectedClient = paidClients.find((client) => client.id === selectedClientIdForCreate);
    if (!selectedClient?.organizationId) {
      setMessage("Unable to resolve selected client organization.");
      return;
    }

    setCreatingProject(true);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: projectName,
        description: projectDescription || undefined,
        organizationId: selectedClient.organizationId,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
      setMessage(data?.message || "Unable to create project.");
      setCreatingProject(false);
      return;
    }

    const createdProject = (await response.json()) as { id: string };

    const linkResponse = await fetch(`/api/projects/${createdProject.id}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: selectedClientIdForCreate }),
    });

    if (!linkResponse.ok) {
      const raw = await linkResponse.text();
      const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
      setMessage(data?.message || "Project created but failed to link selected client.");
      setCreatingProject(false);
      return;
    }

    const linkedClient = selectedClient;
    setActiveUserIdFilter(selectedClientIdForCreate);
    setActiveOrganizationFilter(selectedClient.organizationId);
    setActiveClientName(linkedClient?.name || "");
    setExpandedProjectId(createdProject.id);

    setProjectName("");
    setProjectDescription("");
    setMessage("Project created and linked to selected client.");
    await refreshProjects();
    setCreatingProject(false);
  };

  const setPhaseFormField = (projectId: string, field: keyof NewPhaseForm, value: string) => {
    setNewPhaseByProject((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || { title: "", description: "", dueDate: "" }),
        [field]: value,
      },
    }));
  };

  const setStatusUpdateField = (projectId: string, field: keyof StatusUpdateForm, value: string) => {
    setStatusUpdateByProject((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || { status: "", note: "" }),
        [field]: value,
      },
    }));
  };

  const clientDirectory = useMemo<ClientDirectoryItem[]>(() => paidClients, [paidClients]);

  const createPhase = async (projectId: string, event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const form = newPhaseByProject[projectId] || { title: "", description: "", dueDate: "" };
    if (!form.title.trim()) {
      setMessage("Phase title is required.");
      return;
    }

    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
      setMessage(data?.message || "Unable to add phase.");
      return;
    }

    setMessage("Phase added.");
    setNewPhaseByProject((prev) => ({
      ...prev,
      [projectId]: { title: "", description: "", dueDate: "" },
    }));
    await refreshProjects();
  };

  const updatePhaseStatus = async (taskId: string, status: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const response = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setMessage("Unable to update phase status.");
      return;
    }

    setMessage("Phase status updated.");
    await refreshProjects();
  };

  const updatePhaseDueDate = async (taskId: string, dueDate: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dueDate: dueDate || null }),
    });

    if (!response.ok) {
      setMessage("Unable to update phase date.");
      return;
    }

    setMessage("Phase date updated.");
    await refreshProjects();
  };

  const addStatusUpdate = async (projectId: string, event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const form = statusUpdateByProject[projectId] || { status: "", note: "" };
    if (!form.status.trim()) {
      setMessage("Status text is required.");
      return;
    }

    const response = await fetch(`/api/projects/${projectId}/status-updates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: form.status,
        note: form.note || undefined,
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
      setMessage(data?.message || "Unable to add status update.");
      return;
    }

    setMessage("Status update added to timeline.");
    setStatusUpdateByProject((prev) => ({
      ...prev,
      [projectId]: { status: "", note: "" },
    }));
    await refreshProjects();
  };

  const copyClientId = async (clientId: string) => {
    try {
      await navigator.clipboard.writeText(clientId);
      setMessage(`Client ID copied: ${clientId}`);
    } catch {
      setMessage("Unable to copy client ID.");
    }
  };

  const stepStatusOrder = ["TODO", "IN_PROGRESS", "DONE"];

  const advancePhaseStep = async (taskId: string, currentStatus: string) => {
    const normalizedCurrent = currentStatus.toUpperCase();
    const currentIndex = stepStatusOrder.indexOf(normalizedCurrent);
    const nextStatus = currentIndex >= 0 && currentIndex < stepStatusOrder.length - 1 ? stepStatusOrder[currentIndex + 1] : "DONE";
    await updatePhaseStatus(taskId, nextStatus);
  };

  const resetPhaseStep = async (taskId: string) => {
    await updatePhaseStatus(taskId, "TODO");
  };

  const toggleProjectTracker = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId));
  };

  return (
    <WorkspaceShell>
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
        <h1 className="text-2xl font-semibold">Project Tracking (Admin)</h1>
        <p className="mt-1 text-sm text-zinc-500">Projects are fetched by client and timeline updates are appended step-by-step for admin + client view.</p>

        <form className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4" onSubmit={(event) => void createProject(event)}>
          <select
            value={selectedClientIdForCreate}
            onChange={(event) => setSelectedClientIdForCreate(event.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-4"
          >
            <option value="">Select paid subscription client (ID/Name/Email)</option>
            {clientDirectory.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} · {client.email} · {client.id}
              </option>
            ))}
          </select>
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Create project name"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-2"
          />
          <input
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            placeholder="Project description"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          <button
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
            type="submit"
            disabled={creatingProject}
          >
            {creatingProject ? "Creating..." : "Create Project"}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Fetch by Client</p>
            <button
              type="button"
              onClick={clearClientFilter}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Show All
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {clientDirectory.length === 0 ? (
              <p className="text-xs text-zinc-500">No paid subscription clients found yet.</p>
            ) : (
              clientDirectory.map((client) => {
                const isActive = activeUserIdFilter === client.id;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => applyClientFilter(client)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${isActive ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    <p className="text-sm font-semibold">{client.name}</p>
                    <p className={`text-xs ${isActive ? "text-zinc-200" : "text-zinc-500"}`}>{client.email}</p>
                    <p className={`text-[11px] ${isActive ? "text-zinc-300" : "text-zinc-400"}`}>ID: {client.id}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {activeUserIdFilter && (
          <p className="mt-3 text-xs font-medium text-zinc-600">Active client filter: {activeClientName || activeUserIdFilter}</p>
        )}

        {message && <p className="mt-3 text-sm text-zinc-700">{message}</p>}
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading projects...</p>
        ) : projectsSorted.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No projects found yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {projectsSorted.map((project) => {
              const orgClientUsers = project.organization.memberships?.map((membership) => membership.user) || [];
              const projectMemberUsers = project.members?.map((member) => member.user) || [];
              const combinedClientUsers = [...orgClientUsers, ...projectMemberUsers];
              const dedupedUsersMap = new Map<string, (typeof combinedClientUsers)[number]>();
              for (const user of combinedClientUsers) {
                dedupedUsersMap.set(user.id, user);
              }
              const clientUsers = Array.from(dedupedUsersMap.values());
              const primaryClient = clientUsers[0];
              const primaryClientName = primaryClient
                ? ([primaryClient.firstName, primaryClient.lastName].filter(Boolean).join(" ") || primaryClient.email)
                : "No client linked";
              const phaseForm = newPhaseByProject[project.id] || { title: "", description: "", dueDate: "" };
              const statusForm = statusUpdateByProject[project.id] || { status: "", note: "" };
              const isExpanded = expandedProjectId === project.id;

              const orderedTasks = [...project.tasks].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
              const phaseTasks = orderedTasks.filter((task) => !task.title.startsWith("Status:"));

              return (
                <div key={project.id} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-4 shadow-[0_18px_42px_-24px_rgba(0,0,0,0.5)] ring-1 ring-white/80">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-zinc-200/50 blur-2xl" />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{project.name}</h2>
                      <p className="text-sm text-zinc-600">{project.description || "No description"}</p>
                      <p className="mt-1 text-xs text-zinc-500">Client organization: {project.organization.name}</p>
                      <p className="text-xs text-zinc-600">Client: {primaryClientName}</p>
                      {primaryClient && <p className="text-xs text-zinc-500">Email: {primaryClient.email}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {primaryClient && (
                        <button
                          type="button"
                          onClick={() => void copyClientId(primaryClient.id)}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Copy Client ID
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleProjectTracker(project.id)}
                        className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                      >
                        {isExpanded ? "Hide Tracker" : "Track Project"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-white/90 p-4 shadow-inner">
                      <form className="grid grid-cols-1 gap-2 md:grid-cols-4" onSubmit={(event) => void addStatusUpdate(project.id, event)}>
                        <input
                          value={statusForm.status}
                          onChange={(event) => setStatusUpdateField(project.id, "status", event.target.value)}
                          placeholder="Update status text (e.g. Initiated, Ongoing)"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-2"
                        />
                        <input
                          value={statusForm.note}
                          onChange={(event) => setStatusUpdateField(project.id, "note", event.target.value)}
                          placeholder="Optional note"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                        />
                        <button className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700" type="submit">
                          Update Status
                        </button>
                      </form>

                      <form className="grid grid-cols-1 gap-2 md:grid-cols-4" onSubmit={(event) => void createPhase(project.id, event)}>
                        <input
                          value={phaseForm.title}
                          onChange={(event) => setPhaseFormField(project.id, "title", event.target.value)}
                          placeholder="Phase title (e.g. Requirement Gathering)"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-2"
                        />
                        <input
                          type="date"
                          value={phaseForm.dueDate}
                          onChange={(event) => setPhaseFormField(project.id, "dueDate", event.target.value)}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                        />
                        <button className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700" type="submit">
                          Add Phase
                        </button>
                        <input
                          value={phaseForm.description}
                          onChange={(event) => setPhaseFormField(project.id, "description", event.target.value)}
                          placeholder="Phase description"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 md:col-span-4"
                        />
                      </form>

                      {orderedTasks.length === 0 ? (
                        <p className="text-sm text-zinc-500">No phases or timeline entries yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {orderedTasks.map((item) => {
                            const isStatusEntry = item.title.startsWith("Status:");
                            const phaseNumber = phaseTasks.findIndex((task) => task.id === item.id) + 1;

                            return (
                              <div key={item.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-zinc-900">
                                    {isStatusEntry ? "Timeline Update" : `Phase ${phaseNumber}`}: {item.title}
                                  </p>
                                  {!isStatusEntry && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <select
                                        value={item.status}
                                        onChange={(event) => void updatePhaseStatus(item.id, event.target.value)}
                                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                                      >
                                        {STATUS_OPTIONS.map((status) => (
                                          <option key={status} value={status}>{status}</option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => void advancePhaseStep(item.id, item.status)}
                                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                      >
                                        Next Step
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void resetPhaseStep(item.id)}
                                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                      >
                                        Reset
                                      </button>
                                      <input
                                        type="date"
                                        defaultValue={item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : ""}
                                        onBlur={(event) => void updatePhaseDueDate(item.id, event.target.value)}
                                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                                      />
                                    </div>
                                  )}
                                </div>
                                {item.description && <p className="mt-1 text-xs text-zinc-600">{item.description}</p>}
                                <p className="mt-1 text-xs text-zinc-500">Status: {item.status} · {new Date(item.updatedAt).toLocaleString()}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
