import prisma from "../../config/prisma";

export class HttpError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "HttpError";
	}
}

const getActiveSubscriptionPlan = async (organizationId: string) => {
	const subscription = await prisma.subscription.findFirst({
		where: {
			organizationId,
			status: "ACTIVE",
		},
		include: {
			plan: true,
		},
	});

	if (!subscription || !subscription.plan) {
		throw new HttpError(403, "No active subscription. Please subscribe to continue.");
	}

	return subscription.plan;
};

const bytesFromGigabytes = (gb: number): number => gb * 1024 * 1024 * 1024;

const ensureProjectInOrganization = async (projectId: string, organizationId: string): Promise<void> => {
	const project = await prisma.project.findFirst({
		where: { id: projectId, organizationId },
		select: { id: true },
	});

	if (!project) {
		throw new HttpError(404, "Project not found");
	}
};

export const uploadFile = async (
	organizationId: string,
	userId: string,
	file: Express.Multer.File,
	projectId?: string,
) => {
	const plan = await getActiveSubscriptionPlan(organizationId);

	const usedStorage = await prisma.file.aggregate({
		where: { organizationId },
		_sum: { fileSize: true },
	});

	const usedBytes = usedStorage._sum.fileSize ?? 0;
	const limitBytes = bytesFromGigabytes(plan.storageLimit);

	if (usedBytes + file.size > limitBytes) {
		throw new HttpError(403, "Storage limit exceeded");
	}

	if (projectId) {
		await ensureProjectInOrganization(projectId, organizationId);
	}

	return prisma.file.create({
		data: {
			fileName: file.originalname,
			filePath: file.path,
			fileSize: file.size,
			organizationId,
			projectId: projectId ?? null,
			uploadedBy: userId,
		},
	});
};

export const getFiles = async (organizationId: string) => {
	return prisma.file.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
	});
};

export const deleteFile = async (fileId: string, organizationId: string) => {
	const file = await prisma.file.findFirst({
		where: { id: fileId, organizationId },
		select: { id: true },
	});

	if (!file) {
		throw new HttpError(404, "File not found");
	}

	return prisma.file.delete({
		where: { id: fileId },
	});
};
