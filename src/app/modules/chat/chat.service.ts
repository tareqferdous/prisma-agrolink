import { envVars } from "../../config/env";

type ChatIntent =
  | "greeting"
  | "product_info"
  | "place_bid"
  | "my_orders"
  | "payment"
  | "tracking"
  | "create_listing"
  | "account_help"
  | "refund_dispute"
  | "contact_support"
  | "unknown";

type ChatReply = {
  intent: ChatIntent;
  reply: string;
  suggestions: string[];
};

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

const SYSTEM_PROMPT =
  "You are AgroLink assistant for an agri marketplace app. Answer clearly in simple Bangla-English mix when appropriate, keep it short and practical, do not invent platform features. If unsure, say you are not fully sure and suggest contacting support@agrolinkbd.com.";

const getOpenRouterReply = async (message: string): Promise<string | null> => {
  if (!envVars.OPENROUTER_API_KEY) {
    return null;
  }

  const model = envVars.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${envVars.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
          temperature: 0.4,
          max_tokens: 220,
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as OpenRouterChatResponse;
    const text = json.choices?.[0]?.message?.content?.trim();

    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const includesAny = (message: string, keywords: string[]) => {
  return keywords.some((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = keyword.includes(" ")
      ? new RegExp(escaped, "i")
      : new RegExp(`\\b${escaped}\\b`, "i");

    return pattern.test(message);
  });
};

const detectIntent = (rawMessage: string): ChatIntent => {
  const message = rawMessage.toLowerCase();

  if (includesAny(message, ["hello", "hi", "hey", "assalam", "start"])) {
    return "greeting";
  }

  if (
    includesAny(message, [
      "product",
      "crop",
      "price",
      "quantity",
      "listing info",
      "category",
    ])
  ) {
    return "product_info";
  }

  if (includesAny(message, ["bid", "place bid", "offer"])) {
    return "place_bid";
  }

  if (
    includesAny(message, [
      "my order",
      "orders page",
      "order list",
      "order status",
    ])
  ) {
    return "my_orders";
  }

  if (includesAny(message, ["pay", "payment", "checkout", "card"])) {
    return "payment";
  }

  if (includesAny(message, ["track", "tracking", "delivery", "shipped"])) {
    return "tracking";
  }

  if (
    includesAny(message, [
      "create listing",
      "new listing",
      "sell",
      "post listing",
    ])
  ) {
    return "create_listing";
  }

  if (
    includesAny(message, [
      "login",
      "register",
      "sign in",
      "sign up",
      "password",
      "profile",
      "account",
    ])
  ) {
    return "account_help";
  }

  if (includesAny(message, ["refund", "dispute", "cancel", "problem"])) {
    return "refund_dispute";
  }

  if (includesAny(message, ["support", "help desk", "contact", "agent"])) {
    return "contact_support";
  }

  return "unknown";
};

const buildReply = (intent: ChatIntent): ChatReply => {
  switch (intent) {
    case "greeting":
      return {
        intent,
        reply:
          "Hello. I am AgroLink Assistant. I can help with listings, bids, orders, payment, and tracking.",
        suggestions: [
          "How do I place a bid?",
          "How do I create a listing?",
          "How do I track my order?",
        ],
      };

    case "product_info":
      return {
        intent,
        reply:
          "Open any listing to see crop name, quantity, unit, location, delivery options, and pricing details. Use filters on Listings page to find specific categories faster.",
        suggestions: [
          "How do I filter listings?",
          "How to contact a farmer?",
          "How to place a bid?",
        ],
      };

    case "place_bid":
      return {
        intent,
        reply:
          "To place a bid: 1) Open a listing, 2) Enter your offer amount, 3) Submit bid. If farmer accepts your bid, an order is created automatically.",
        suggestions: [
          "Where can I see my bids?",
          "What happens after bid acceptance?",
          "How do I pay for an order?",
        ],
      };

    case "my_orders":
      return {
        intent,
        reply:
          "Go to Dashboard > My Orders to view order status. You can check pending payment, shipped orders, and completed orders from there.",
        suggestions: [
          "How do I confirm received?",
          "How do I track shipping?",
          "How do I pay pending orders?",
        ],
      };

    case "payment":
      return {
        intent,
        reply:
          "For payment: open your pending order and click Pay Now. After successful payment, status changes to Paid and the farmer can prepare shipment.",
        suggestions: [
          "Payment failed. What should I do?",
          "Where can I see paid orders?",
          "How do refunds work?",
        ],
      };

    case "tracking":
      return {
        intent,
        reply:
          "When an order is shipped, tracking number and courier info appear in My Orders. Use those details to follow delivery progress.",
        suggestions: [
          "Order is delayed",
          "How do I confirm received?",
          "How do I raise a dispute?",
        ],
      };

    case "create_listing":
      return {
        intent,
        reply:
          "To create a listing: Dashboard > My Listings > New Listing. Add crop details, quantity, harvest date, location, delivery options, and images, then submit.",
        suggestions: [
          "Why is my listing pending?",
          "How to edit a listing?",
          "How to delete a listing?",
        ],
      };

    case "account_help":
      return {
        intent,
        reply:
          "For account issues, use Login or Register page, then verify profile details from Dashboard > Profile. If login fails, try Google sign-in or reset flow.",
        suggestions: [
          "I cannot login",
          "How do I update profile info?",
          "How do I change my role?",
        ],
      };

    case "refund_dispute":
      return {
        intent,
        reply:
          "If there is delivery mismatch or quality issue, contact support with your order ID and issue summary. The team reviews disputes and guides refund steps.",
        suggestions: [
          "How do I contact support?",
          "What details should I share?",
          "How long does review take?",
        ],
      };

    case "contact_support":
      return {
        intent,
        reply:
          "You can contact support via support@agrolinkbd.com. Please include your account email, order ID (if any), and a short issue summary.",
        suggestions: ["Payment issue", "Order issue", "Listing approval issue"],
      };

    default:
      return {
        intent: "unknown",
        reply:
          "I am not fully sure about that yet. I can help with listings, bids, orders, payment, and tracking. You can also contact support@agrolinkbd.com for manual help.",
        suggestions: [
          "How do I place a bid?",
          "How do I create a listing?",
          "How do I track an order?",
        ],
      };
  }
};

const getAssistantReply = async (message: string): Promise<ChatReply> => {
  const intent = detectIntent(message);
  const fallbackReply = buildReply(intent);

  const openRouterReply = await getOpenRouterReply(message);
  if (openRouterReply) {
    return {
      intent,
      reply: openRouterReply,
      suggestions: fallbackReply.suggestions,
    };
  }

  return fallbackReply;
};

export const chatService = {
  getAssistantReply,
};
