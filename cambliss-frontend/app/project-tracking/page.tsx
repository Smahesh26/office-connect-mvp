"use client";

import { useEffect, useMemo, useState } from "react";
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

type Project = {
  id: string;
  name: string;
  description: string | null;
  tasks: PhaseTask[];
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

const statusPillClass = (status: string) => {
  const normalized = status.trim().toUpperCase();
  if (normalized === "DONE") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (normalized === "IN_PROGRESS") return "border-amber-300 bg-amber-50 text-amber-700";
  if (normalized === "BLOCKED") return "border-red-300 bg-red-50 text-red-700";
  return "border-zinc-300 bg-zinc-100 text-zinc-700";
};

export default function ProjectTrackingPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = getRoleFromToken(token);
    if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROJECT_MANAGER") {
      router.replace("/admin-project-tracking");
      return;
    }

    const loadProjects = async () => {
      if (!token) {
        setLoading(false);
        setMessage("Please login first.");
        return;
      }

      try {
        const response = await fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const raw = await response.text();
          const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
          setMessage(data?.message || "Unable to fetch project timeline.");
          setProjects([]);
          return;
        }

        const data = (await response.json()) as Project[];
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setMessage("Unable to fetch project timeline.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    void loadProjects();
  }, [router]);

  const projectsWithSortedTimeline = useMemo(
    () => projects.map((project) => ({
      ...project,
      tasks: [...project.tasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    })),
    [projects],
  );

  return (
    <WorkspaceShell>
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/60 ring-1 ring-white/70">
        <h1 className="text-2xl font-semibold">Project Timeline</h1>
        <p className="mt-1 text-sm text-zinc-500">Track each project phase, due date, and status updated by admin.</p>

        {message && <p className="mt-3 text-sm text-zinc-700">{message}</p>}
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading timeline...</p>
        ) : projectsWithSortedTimeline.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No projects found yet.</p>
        ) : (
          <div className="mt-5 space-y-5">
            {projectsWithSortedTimeline.map((project) => (
              <div key={project.id} className="rounded-xl border border-zinc-200 p-4">
                <h2 className="text-lg font-semibold text-zinc-900">{project.name}</h2>
                <p className="text-sm text-zinc-600">{project.description || "No description"}</p>

                {project.tasks.length === 0 ? (
                  <p className="mt-4 text-sm text-zinc-500">No phases shared yet.</p>
                ) : (
                  <ol className="mt-4 space-y-3 border-l border-zinc-300 pl-4">
                    {project.tasks.map((phase, index) => (
                      <li key={phase.id} className="relative">
                        <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-700" />
                        <div className="rounded-lg border border-zinc-200 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-zinc-900">Phase {index + 1}: {phase.title}</p>
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusPillClass(phase.status)}`}>
                              {phase.status.replaceAll("_", " ")}
                            </span>
                          </div>
                          {phase.description && <p className="mt-1 text-xs text-zinc-600">{phase.description}</p>}
                          <p className="mt-1 text-xs text-zinc-500">
                            Target Date: {phase.dueDate ? new Date(phase.dueDate).toLocaleDateString() : "Not set"}
                          </p>
                          <p className="text-xs text-zinc-500">Last Update: {new Date(phase.updatedAt).toLocaleString()}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
