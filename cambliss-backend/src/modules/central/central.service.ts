import prisma from "../../config/prisma";

export const listSpaces = async (organizationId: string) => {
	return (prisma as any).space.findMany({
		where: { organizationId },
		include: {
			_count: {
				select: { posts: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});
};

export const createSpace = async (
	organizationId: string,
	data: {
		name: string;
		description: string;
		category?: string;
		icon?: string;
		leadName?: string;
		isPrivate?: boolean;
	}
) => {
	const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	return (prisma as any).space.create({
		data: {
			organizationId,
			name: data.name,
			slug,
			description: data.description,
			category: data.category || "public",
			icon: data.icon || "🏢",
			leadName: data.leadName,
			isPrivate: Boolean(data.isPrivate),
		},
	});
};

export const getSpaceBySlug = async (organizationId: string, slug: string) => {
	return (prisma as any).space.findFirst({
		where: { organizationId, slug },
		include: {
			posts: {
				orderBy: { createdAt: "desc" },
			},
		},
	});
};

export const createSpacePost = async (
	spaceId: string,
	data: {
		authorId?: string;
		authorName: string;
		authorRole?: string;
		authorDept?: string;
		title: string;
		content: string;
		pinned?: boolean;
		tags?: string[];
	}
) => {
	return (prisma as any).spacePost.create({
		data: {
			spaceId,
			authorId: data.authorId,
			authorName: data.authorName,
			authorRole: data.authorRole,
			authorDept: data.authorDept,
			title: data.title,
			content: data.content,
			pinned: Boolean(data.pinned),
			tags: data.tags || [],
		},
	});
};

export const listKnowledgeArticles = async (organizationId: string, category?: string) => {
	const where: Record<string, any> = { organizationId };
	if (category && category !== "all") {
		where.category = category;
	}
	return (prisma as any).knowledgeItem.findMany({
		where,
		orderBy: { updatedAt: "desc" },
	});
};

export const createKnowledgeArticle = async (
	organizationId: string,
	data: {
		title: string;
		category: string;
		summary: string;
		content: string;
		authorName: string;
		authorRole?: string;
		authorDept?: string;
		readingTime?: string;
		tags?: string[];
	}
) => {
	const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	return (prisma as any).knowledgeItem.create({
		data: {
			organizationId,
			title: data.title,
			slug,
			category: data.category,
			summary: data.summary,
			content: data.content,
			authorName: data.authorName,
			authorRole: data.authorRole,
			authorDept: data.authorDept,
			readingTime: data.readingTime || "5 min read",
			tags: data.tags || [],
			verified: true,
		},
	});
};

export const getKnowledgeArticleBySlug = async (organizationId: string, slug: string) => {
	const article = await (prisma as any).knowledgeItem.findFirst({
		where: { organizationId, slug },
	});
	if (article) {
		await (prisma as any).knowledgeItem.update({
			where: { id: article.id },
			data: { views: { increment: 1 } },
		});
	}
	return article;
};
