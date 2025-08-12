const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  getCategories,
  getRecommendations,
  chatWithAI,
  processPDFText,
  searchAndRecommend,
  getReadingInsights,
  clearConversation,
  getConversationStats,
  testRecommendations,
} = require("../controllers/aiController");
const Authenticate = require("../middlewares/Authenticate");

// Rate limiters with different tiers
const createRateLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// Stricter limits for non-authenticated users
const publicChatLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // Only 5 requests for non-authenticated users
  "Please sign in for unlimited chat access"
);

// Generous limits for authenticated users
const authenticatedLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window for authenticated users
  "Rate limit exceeded, please try again later"
);

const pdfLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 PDF processing requests per hour
  "PDF processing limit reached, please try again later"
);

// Validation middleware
const validateChatMessage = (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Message is required and cannot be empty",
    });
  }
  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "Message too long. Maximum 2000 characters allowed.",
    });
  }
  next();
};

const validateRecommendationRequest = (req, res, next) => {
  const { preferences, genres } = req.body;

  if (!preferences || typeof preferences !== "string" || !preferences.trim()) {
    return res.status(400).json({
      success: false,
      message: "Preferences are required",
    });
  }

  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one genre must be selected",
    });
  }

  if (genres.length > 10) {
    return res.status(400).json({
      success: false,
      message: "Maximum 10 genres allowed",
    });
  }

  next();
};

const validatePDFProcessing = (req, res, next) => {
  const { pdfText, fileName } = req.body;

  if (!pdfText || typeof pdfText !== "string" || !pdfText.trim()) {
    return res.status(400).json({
      success: false,
      message: "PDF text content is required",
    });
  }

  if (pdfText.length < 100) {
    return res.status(400).json({
      success: false,
      message: "PDF text too short. Minimum 100 characters required.",
    });
  }

  if (pdfText.length > 100000) {
    // 100KB limit
    return res.status(400).json({
      success: false,
      message: "PDF text too large. Maximum 100,000 characters allowed.",
    });
  }

  next();
};

// Public routes (accessible without authentication)
router.get("/categories", getCategories);

// Diagnostic endpoint for troubleshooting (should be public)
router.get("/diagnostic", (req, res) => {
  const diagnostics = {
    success: true,
    message: "AI Service Diagnostics",
    timestamp: new Date().toISOString(),
    environment: {
      node_version: process.version,
      gemini_api_key_configured: !!process.env.GEMINI_API_KEY,
      jwt_secret_configured: !!process.env.JWT_SECRET,
      port: process.env.PORT || "Not set",
    },
    endpoints: {
      public: [
        "GET /api/v1/ai/categories",
        "POST /api/v1/ai/chat/public",
        "GET /api/v1/ai/health",
        "GET /api/v1/ai/diagnostic",
      ],
      authenticated: [
        "POST /api/v1/ai/recommendations",
        "POST /api/v1/ai/chat",
        "POST /api/v1/ai/process-pdf-text",
        "POST /api/v1/ai/search-recommend",
        "GET /api/v1/ai/reading-insights",
        "POST /api/v1/ai/clear-conversation",
        "GET /api/v1/ai/conversation-stats",
      ],
    },
    configuration_status: {
      gemini_ai: process.env.GEMINI_API_KEY
        ? "✅ Configured"
        : "❌ Missing GEMINI_API_KEY",
      jwt_auth: process.env.JWT_SECRET
        ? "✅ Configured"
        : "❌ Missing JWT_SECRET",
    },
  };

  res.json(diagnostics);
});

// Health check endpoint (also public)
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AI service is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Public chat with strict limits
router.post("/chat/public", publicChatLimiter, validateChatMessage, chatWithAI);

// Test endpoint for debugging (before auth)
router.post("/test-recommendations", testRecommendations);

// Protected routes (require authentication)
router.use(Authenticate); // Apply authentication middleware to all routes below

// Recommendations
router.post(
  "/recommendations",
  authenticatedLimiter,
  validateRecommendationRequest,
  getRecommendations
);

// Chat for authenticated users
router.post("/chat", authenticatedLimiter, validateChatMessage, chatWithAI);

// PDF processing (browser-based, no file upload)
router.post(
  "/process-pdf-text",
  pdfLimiter,
  validatePDFProcessing,
  processPDFText
);

// Search and recommendations
router.post("/search-recommend", authenticatedLimiter, searchAndRecommend);

// Reading insights
router.get("/reading-insights", authenticatedLimiter, getReadingInsights);

// Conversation management
router.post("/clear-conversation", authenticatedLimiter, clearConversation);

router.get("/conversation-stats", authenticatedLimiter, getConversationStats);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error("AI Route Error:", error);

  // Handle specific error types
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request too large. Please reduce the content size.",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred. Please try again.",
  });
});

module.exports = router;
