import { Request, Response } from "express";
import * as centralService from "./central.service";

export const getSpacesController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const spaces = await centralService.listSpaces(orgId);
		return res.json({ success: true, data: spaces });
	} catch (error: any) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const createSpaceController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const space = await centralService.createSpace(orgId, req.body);
		return res.status(201).json({ success: true, data: space });
	} catch (error: any) {
		return res.status(400).json({ success: false, message: error.message });
	}
};

export const getSpaceDetailsController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const slug = String(req.params.slug);
		const space = await centralService.getSpaceBySlug(orgId, slug);
		if (!space) {
			return res.status(404).json({ success: false, message: "Space not found" });
		}
		return res.json({ success: true, data: space });
	} catch (error: any) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const createSpacePostController = async (req: Request, res: Response) => {
	try {
		const spaceId = String(req.params.spaceId);
		const post = await centralService.createSpacePost(spaceId, {
			...req.body,
			authorId: req.user?.id,
			authorName: req.body.authorName || req.user?.email || "Team Member",
		});
		return res.status(201).json({ success: true, data: post });
	} catch (error: any) {
		return res.status(400).json({ success: false, message: error.message });
	}
};

export const getKnowledgeArticlesController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const category = typeof req.query.category === "string" ? req.query.category : undefined;
		const articles = await centralService.listKnowledgeArticles(orgId, category);
		return res.json({ success: true, data: articles });
	} catch (error: any) {
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const createKnowledgeArticleController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const article = await centralService.createKnowledgeArticle(orgId, {
			...req.body,
			authorName: req.body.authorName || req.user?.email || "Knowledge Author",
		});
		return res.status(201).json({ success: true, data: article });
	} catch (error: any) {
		return res.status(400).json({ success: false, message: error.message });
	}
};

export const getKnowledgeArticleDetailsController = async (req: Request, res: Response) => {
	try {
		const orgId = req.user?.organizationId || "org_default";
		const slug = String(req.params.slug);
		const article = await centralService.getKnowledgeArticleBySlug(orgId, slug);
		if (!article) {
			return res.status(404).json({ success: false, message: "Article not found" });
		}
		return res.json({ success: true, data: article });
	} catch (error: any) {
		return res.status(500).json({ success: false, message: error.message });
	}
};
