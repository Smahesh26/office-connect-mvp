"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKnowledgeArticleBySlug = exports.createKnowledgeArticle = exports.listKnowledgeArticles = exports.createSpacePost = exports.getSpaceBySlug = exports.createSpace = exports.listSpaces = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const listSpaces = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.space.findMany({
        where: { organizationId },
        include: {
            _count: {
                select: { posts: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
});
exports.listSpaces = listSpaces;
const createSpace = (organizationId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return prisma_1.default.space.create({
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
});
exports.createSpace = createSpace;
const getSpaceBySlug = (organizationId, slug) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.space.findFirst({
        where: { organizationId, slug },
        include: {
            posts: {
                orderBy: { createdAt: "desc" },
            },
        },
    });
});
exports.getSpaceBySlug = getSpaceBySlug;
const createSpacePost = (spaceId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.spacePost.create({
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
});
exports.createSpacePost = createSpacePost;
const listKnowledgeArticles = (organizationId, category) => __awaiter(void 0, void 0, void 0, function* () {
    const where = { organizationId };
    if (category && category !== "all") {
        where.category = category;
    }
    return prisma_1.default.knowledgeItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
    });
});
exports.listKnowledgeArticles = listKnowledgeArticles;
const createKnowledgeArticle = (organizationId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return prisma_1.default.knowledgeItem.create({
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
});
exports.createKnowledgeArticle = createKnowledgeArticle;
const getKnowledgeArticleBySlug = (organizationId, slug) => __awaiter(void 0, void 0, void 0, function* () {
    const article = yield prisma_1.default.knowledgeItem.findFirst({
        where: { organizationId, slug },
    });
    if (article) {
        yield prisma_1.default.knowledgeItem.update({
            where: { id: article.id },
            data: { views: { increment: 1 } },
        });
    }
    return article;
});
exports.getKnowledgeArticleBySlug = getKnowledgeArticleBySlug;
