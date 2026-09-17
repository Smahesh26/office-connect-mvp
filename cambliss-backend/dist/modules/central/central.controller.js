"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKnowledgeArticleDetailsController = exports.createKnowledgeArticleController = exports.getKnowledgeArticlesController = exports.createSpacePostController = exports.getSpaceDetailsController = exports.createSpaceController = exports.getSpacesController = void 0;
const centralService = __importStar(require("./central.service"));
const getSpacesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orgId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || "org_default";
        const spaces = yield centralService.listSpaces(orgId);
        return res.json({ success: true, data: spaces });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.getSpacesController = getSpacesController;
const createSpaceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orgId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || "org_default";
        const space = yield centralService.createSpace(orgId, req.body);
        return res.status(201).json({ success: true, data: space });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.createSpaceController = createSpaceController;
const getSpaceDetailsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orgId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || "org_default";
        const slug = String(req.params.slug);
        const space = yield centralService.getSpaceBySlug(orgId, slug);
        if (!space) {
            return res.status(404).json({ success: false, message: "Space not found" });
        }
        return res.json({ success: true, data: space });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.getSpaceDetailsController = getSpaceDetailsController;
const createSpacePostController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const spaceId = String(req.params.spaceId);
        const post = yield centralService.createSpacePost(spaceId, Object.assign(Object.assign({}, req.body), { authorId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, authorName: req.body.authorName || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email) || "Team Member" }));
        return res.status(201).json({ success: true, data: post });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.createSpacePostController = createSpacePostController;
const getKnowledgeArticlesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orgId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || "org_default";
        const category = typeof req.query.category === "string" ? req.query.category : undefined;
        const articles = yield centralService.listKnowledgeArticles(orgId, category);
        return res.json({ success: true, data: articles });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.getKnowledgeArticlesController = getKnowledgeArticlesController;
const createKnowledgeArticleController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const orgId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || "org_default";
        const article = yield centralService.createKnowledgeArticle(orgId, Object.assign(Object.assign({}, req.body), { authorName: req.body.authorName || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.email) || "Knowledge Author" }));
        return res.status(201).json({ success: true, data: article });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.createKnowledgeArticleController = createKnowledgeArticleController;
const getKnowledgeArticleDetailsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orgId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || "org_default";
        const slug = String(req.params.slug);
        const article = yield centralService.getKnowledgeArticleBySlug(orgId, slug);
        if (!article) {
            return res.status(404).json({ success: false, message: "Article not found" });
        }
        return res.json({ success: true, data: article });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});
exports.getKnowledgeArticleDetailsController = getKnowledgeArticleDetailsController;
