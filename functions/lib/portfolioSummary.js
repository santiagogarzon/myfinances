"use strict";
// Cloud Function con Firebase Genkit para generar resumen de portafolio
// Paso 1: crea este archivo en `functions/src/portfolioSummary.ts`
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioSummary = void 0;
const generative_ai_1 = require("@google/generative-ai");
const zod_1 = require("zod");
const https_1 = require("firebase-functions/v2/https");
// Initialize Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(((_a = process.env.gemini) === null || _a === void 0 ? void 0 : _a.api_key) || "");
// Define the input schema separately
const portfolioSummaryInputSchema = zod_1.z.object({
    assets: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        value: zod_1.z.number(),
        type: zod_1.z.string(),
    })),
});
exports.portfolioSummary = (0, https_1.onRequest)({
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const input = req.body;
    try {
        portfolioSummaryInputSchema.parse(input);
    }
    catch (err) {
        const error = err;
        res.status(400).send(`Invalid input: ${error.message}`);
        return;
    }
    const safeAssets = input.assets.filter((a) => a.name &&
        a.type &&
        typeof a.value === "number" &&
        !isNaN(a.value) &&
        ["crypto", "stock", "etf", "cash"].includes(a.type));
    const total = safeAssets.reduce((sum, a) => sum + a.value, 0);
    const prompt = `Dame un resumen financiero simple en español para estos activos con un valor total de $${total}:\n${JSON.stringify(safeAssets, null, 2)}.`;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        res.status(200).json({ data: text });
    }
    catch (error) {
        console.error("Gemini API error:", error);
        res.status(500).send("Failed to generate portfolio summary");
    }
});
//# sourceMappingURL=portfolioSummary.js.map