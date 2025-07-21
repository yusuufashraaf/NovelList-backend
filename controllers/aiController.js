const { GoogleGenerativeAI } = require("@google/generative-ai");
const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const Category = require("../models/category");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversations in memory (consider Redis for production)
const conversations = new Map();

// Base AI service class for DRY principles
class AIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateContent(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  formatResponse(success, data, message = null) {
    return {
      success,
      message,
      ...data,
    };
  }

  getConversationHistory(userId, sessionId) {
    const conversationKey = `${userId}-${sessionId || "default"}`;
    if (!conversations.has(conversationKey)) {
      conversations.set(conversationKey, []);
    }
    return conversations.get(conversationKey);
  }

  addToConversation(userId, sessionId, message) {
    const history = this.getConversationHistory(userId, sessionId);
    history.push(message);

    // Keep only last 20 messages to avoid token limits
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Clean up old conversations (keep last 100)
    if (conversations.size > 100) {
      const oldestKey = conversations.keys().next().value;
      conversations.delete(oldestKey);
    }
  }
}

const aiService = new AIService();

// Get available categories from database
exports.getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({})
      .select("name slug")
      .sort({ name: 1 });

    res.json(
      aiService.formatResponse(true, {
        categories: categories.map((cat) => ({
          id: cat._id,
          name: cat.name,
          slug: cat.slug,
        })),
      })
    );
  } catch (error) {
    console.error("Categories fetch error:", error);
    res
      .status(500)
      .json(aiService.formatResponse(false, {}, "Failed to fetch categories"));
  }
});

// Get book recommendations based on categories and preferences
exports.getRecommendations = asyncHandler(async (req, res) => {
  // Add debugging logs
  console.log("=== AI Recommendations Request ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("User:", req.user ? req.user._id : "No user");
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

  const { preferences, genres, previousBooks, selectedCategories } = req.body;

  try {
    // Enhanced validation with detailed error messages
    console.log("=== VALIDATION CHECKS ===");
    console.log("preferences:", preferences, "type:", typeof preferences);
    console.log(
      "genres:",
      genres,
      "type:",
      typeof genres,
      "isArray:",
      Array.isArray(genres)
    );

    if (!preferences) {
      console.log("ERROR: Missing preferences");
      return res
        .status(400)
        .json(
          aiService.formatResponse(
            false,
            {},
            "Preferences are required. Please provide your reading preferences."
          )
        );
    }

    if (typeof preferences !== "string" || !preferences.trim()) {
      console.log("ERROR: Invalid preferences format");
      return res
        .status(400)
        .json(
          aiService.formatResponse(
            false,
            {},
            "Preferences must be a non-empty string describing your reading preferences."
          )
        );
    }

    if (!genres) {
      console.log("ERROR: Missing genres");
      return res
        .status(400)
        .json(
          aiService.formatResponse(
            false,
            {},
            "Genres are required. Please select at least one genre."
          )
        );
    }

    if (!Array.isArray(genres) || genres.length === 0) {
      console.log("ERROR: Invalid genres format or empty array");
      return res
        .status(400)
        .json(
          aiService.formatResponse(
            false,
            {},
            "Please provide at least one genre as an array."
          )
        );
    }

    console.log("=== VALIDATION PASSED ===");

    // Check if GEMINI_API_KEY is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("ERROR: GEMINI_API_KEY environment variable is not set");
      return res
        .status(500)
        .json(
          aiService.formatResponse(
            false,
            {},
            "AI service is not properly configured. Please contact support."
          )
        );
    }

    // Get category-specific books for context
    let categoryBooks = [];
    if (selectedCategories && selectedCategories.length > 0) {
      categoryBooks = await Product.find({
        category: { $in: selectedCategories },
      })
        .limit(20)
        .select("name author category description")
        .lean();
    }

    const contextBooks =
      categoryBooks.length > 0
        ? `\nBooks available in your selected categories: ${categoryBooks.map((b) => `"${b.name}" by ${b.author || "Unknown"}`).join(", ")}`
        : "";

    const prompt = `As a book recommendation expert for NovelNest, suggest 5 books based on:
    - Preferred genres: ${genres.join(", ")}
    - Reading preferences: ${preferences}
    - Previously enjoyed books: ${previousBooks?.join(", ") || "None specified"}
    ${contextBooks}
    
    Consider both popular titles and hidden gems. Format the response as a valid JSON array with objects containing: 
    {
      "title": "book title",
      "author": "author name", 
      "genre": "primary genre",
      "description": "brief engaging description (2-3 sentences)",
      "why_recommended": "personalized reason for recommendation",
      "rating": "estimated rating out of 5",
      "difficulty": "easy/medium/hard"
    }`;

    const aiResponse = await aiService.generateContent(prompt);

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json(
      aiService.formatResponse(true, {
        recommendations,
        totalRecommendations: recommendations.length,
      })
    );
  } catch (error) {
    console.error("Recommendation error:", error);
    res
      .status(500)
      .json(
        aiService.formatResponse(
          false,
          {},
          "Failed to get recommendations. Please try again."
        )
      );
  }
});

// Enhanced chat with context awareness
exports.chatWithAI = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user?._id || "anonymous";

  try {
    if (!message || !message.trim()) {
      return res
        .status(400)
        .json(aiService.formatResponse(false, {}, "Message cannot be empty"));
    }

    // Add user message to history
    aiService.addToConversation(userId, sessionId, {
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    const history = aiService.getConversationHistory(userId, sessionId);
    const recentHistory = history.slice(-10); // Last 10 messages for context

    const context = recentHistory
      .map((h) => `${h.role}: ${h.content}`)
      .join("\n");

    const prompt = `You are a helpful AI assistant for NovelNest, a comprehensive online bookstore. 
    You specialize in book recommendations, literary discussions, and reading guidance.
    
    Previous conversation:
    ${context}
    
    Your capabilities:
    - Provide personalized book recommendations
    - Discuss literature, genres, and authors
    - Help with reading choices and book discovery
    - Assist with book-related questions
    - Suggest reading lists and book clubs
    
    Guidelines:
    - Be enthusiastic and knowledgeable about books
    - Provide specific, actionable recommendations
    - Ask follow-up questions to better understand preferences
    - Keep responses conversational and engaging
    - If asked about book availability, suggest checking the NovelNest catalog
    - For complex requests, break down your response into clear sections
    
    Current user message: "${message}"
    
    Respond helpfully and naturally.`;

    const aiResponse = await aiService.generateContent(prompt);

    // Add AI response to history
    aiService.addToConversation(userId, sessionId, {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    });

    res.json(
      aiService.formatResponse(true, {
        message: aiResponse,
        sessionId: sessionId || "default",
      })
    );
  } catch (error) {
    console.error("Chat error:", error);
    res
      .status(500)
      .json(
        aiService.formatResponse(
          false,
          {},
          "Failed to process chat message. Please try again."
        )
      );
  }
});

// Process PDF content (browser-based, no file upload)
exports.processPDFText = asyncHandler(async (req, res) => {
  const { pdfText, fileName, pageCount } = req.body;

  try {
    if (!pdfText || !pdfText.trim()) {
      return res
        .status(400)
        .json(
          aiService.formatResponse(false, {}, "No PDF text content provided")
        );
    }

    // Limit text for API processing (first 15,000 characters)
    const textSample = pdfText.substring(0, 15000);

    if (textSample.length < 100) {
      return res
        .status(400)
        .json(
          aiService.formatResponse(
            false,
            {},
            "PDF text too short or unable to extract meaningful content"
          )
        );
    }

    const prompt = `Analyze this book content and provide a comprehensive summary:

    Title: ${fileName || "Unknown"}
    Content excerpt: "${textSample}"
    
    Please provide a structured analysis including:
    
    ## 📖 Overview
    Brief synopsis of the content
    
    ## 🎯 Main Themes  
    Key themes and topics covered (3-5 points)
    
    ## ✍️ Writing Style
    Description of the author's approach and tone
    
    ## 👥 Target Audience  
    Who would benefit from reading this
    
    ## 💡 Key Insights
    Most important takeaways or lessons (4-6 points)
    
    ## ⭐ Assessment
    Overall evaluation and recommendation (include pros/cons)
    
    ## 📚 Similar Books
    Suggest 2-3 books readers might enjoy if they like this one
    
    Make the response engaging and informative, suitable for book lovers.`;

    const aiResponse = await aiService.generateContent(prompt);

    res.json(
      aiService.formatResponse(true, {
        summary: aiResponse,
        metadata: {
          fileName: fileName || "Unknown",
          pageCount: pageCount || "Unknown",
          textLength: textSample.length,
          processingDate: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error("PDF processing error:", error);
    res
      .status(500)
      .json(
        aiService.formatResponse(
          false,
          {},
          "Failed to process PDF content. Please try again."
        )
      );
  }
});

// Enhanced search with AI insights
exports.searchAndRecommend = asyncHandler(async (req, res) => {
  const { query } = req.body;

  try {
    if (!query || !query.trim()) {
      return res
        .status(400)
        .json(
          aiService.formatResponse(false, {}, "Search query cannot be empty")
        );
    }

    // Search in database with improved matching
    const searchRegex = new RegExp(query.split(" ").join("|"), "i");

    const books = await Product.find({
      $or: [
        { name: { $regex: searchRegex } },
        { author: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
    })
      .limit(15)
      .select("name author price category description image")
      .lean();

    // Get AI insights based on search results
    let prompt;
    if (books.length > 0) {
      const bookList = books
        .map(
          (b) =>
            `"${b.name}" by ${b.author || "Unknown"} (${b.category || "Uncategorized"})`
        )
        .join(", ");

      prompt = `Based on the search query "${query}", I found ${books.length} books in our NovelNest catalog: 
      
      ${bookList}
      
      Provide a helpful response that:
      1. Highlights the best matches and explains why they fit the search
      2. Groups similar books or themes if applicable  
      3. Suggests which book to start with based on different reader preferences
      4. Recommends related books or authors not in the current results
      5. Offers tips for exploring this topic/genre further
      
      Be enthusiastic and provide actionable guidance for book lovers.`;
    } else {
      prompt = `The user searched for "${query}" in our bookstore but no direct matches were found.
      
      As a book expert, provide a helpful response that:
      1. Suggests similar books, authors, or topics they might enjoy
      2. Recommends related genres or categories to explore
      3. Offers alternative search terms or approaches
      4. Provides general guidance for finding books on this topic
      5. Encourages exploration of our catalog
      
      Be encouraging and offer specific, actionable suggestions.`;
    }

    const aiInsights = await aiService.generateContent(prompt);

    res.json(
      aiService.formatResponse(true, {
        books,
        aiInsights,
        totalFound: books.length,
        searchQuery: query,
      })
    );
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json(
        aiService.formatResponse(
          false,
          {},
          "Failed to search books. Please try again."
        )
      );
  }
});

// Get personalized reading insights
exports.getReadingInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Note: You'll need to import Order model when available
    // const orders = await Order.find({ user: userId })
    //   .populate("items.product", "name author category")
    //   .sort("-createdAt")
    //   .limit(20);

    // For now, provide general insights
    const prompt = `As a reading advisor for NovelNest, provide personalized insights for a book lover:

    Since we're building your reading profile, here are some ways to enhance your reading experience:
    
    ## 📊 Building Your Reading Profile
    - Track your favorite genres and authors
    - Note books that particularly resonated with you
    - Keep a reading journal or wishlist
    
    ## 🎯 Discovering New Books
    - Explore staff picks and featured collections
    - Try books from genres adjacent to your favorites  
    - Follow author recommendations and book awards
    
    ## 📚 Reading Habits
    - Set realistic reading goals
    - Mix different types of books (fiction/non-fiction, long/short)
    - Consider audiobooks for busy periods
    
    ## 🌟 Community Engagement
    - Join book clubs or online reading communities
    - Share reviews and recommendations
    - Participate in reading challenges
    
    Start building your reading journey with NovelNest today!`;

    const insights = await aiService.generateContent(prompt);

    res.json(
      aiService.formatResponse(true, {
        insights,
        isNewUser: true,
        suggestions: [
          "Browse our featured collections",
          "Take our book preference quiz",
          "Explore staff recommendations",
          "Join our book club community",
        ],
      })
    );
  } catch (error) {
    console.error("Insights error:", error);
    res
      .status(500)
      .json(
        aiService.formatResponse(
          false,
          {},
          "Failed to generate reading insights."
        )
      );
  }
});

// Test endpoint for debugging recommendation requests
exports.testRecommendations = asyncHandler(async (req, res) => {
  console.log("=== TEST RECOMMENDATIONS ENDPOINT ===");
  console.log("Method:", req.method);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("User:", req.user ? req.user._id : "No user");
  console.log("Content-Type:", req.headers["content-type"]);

  res.json(
    aiService.formatResponse(true, {
      message: "Test endpoint reached successfully",
      receivedData: {
        body: req.body,
        hasUser: !!req.user,
        contentType: req.headers["content-type"],
        method: req.method,
      },
    })
  );
});

// Clear conversation history
exports.clearConversation = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user?._id || "anonymous";

  try {
    const conversationKey = `${userId}-${sessionId || "default"}`;
    conversations.delete(conversationKey);

    res.json(
      aiService.formatResponse(true, {
        message: "Conversation cleared successfully",
      })
    );
  } catch (error) {
    console.error("Clear conversation error:", error);
    res
      .status(500)
      .json(
        aiService.formatResponse(false, {}, "Failed to clear conversation")
      );
  }
});

// Get conversation statistics
exports.getConversationStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id || "anonymous";
  const { sessionId } = req.query;

  try {
    const history = aiService.getConversationHistory(userId, sessionId);

    const stats = {
      totalMessages: history.length,
      userMessages: history.filter((m) => m.role === "user").length,
      assistantMessages: history.filter((m) => m.role === "assistant").length,
      conversationStarted: history.length > 0 ? history[0].timestamp : null,
      lastActivity:
        history.length > 0 ? history[history.length - 1].timestamp : null,
    };

    res.json(aiService.formatResponse(true, { stats }));
  } catch (error) {
    console.error("Stats error:", error);
    res
      .status(500)
      .json(
        aiService.formatResponse(
          false,
          {},
          "Failed to get conversation statistics"
        )
      );
  }
});
