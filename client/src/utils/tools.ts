/** Compute Levenshtein edit distance between two strings (case-insensitive). */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Return the inventory item whose SKU or name is closest to `query`, within a threshold. */
function findBestFuzzyMatch(
  query: string,
  items: Array<{ sku: string; name: string; inStock: number }>
) {
  const q = query.toLowerCase();
  const threshold = Math.max(2, Math.floor(q.length * 0.35));

  let bestItem: (typeof items)[number] | null = null;
  let bestDist = Infinity;

  for (const item of items) {
    const skuDist  = levenshtein(q, item.sku.toLowerCase());
    const nameDist = levenshtein(q, item.name.toLowerCase());
    const dist = Math.min(skuDist, nameDist);
    if (dist < bestDist) { bestDist = dist; bestItem = item; }
  }

  return bestDist <= threshold ? bestItem : null;
}

export async function executeTool(name: string, args: Record<string, unknown>) {
  const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const DB_URL = API_BASE ? `${API_BASE}/api/db` : "/api/db";

  try {
    switch (name) {
      case "get_order": {
        const query = ((args.orderId ?? args.query ?? args.customer ?? args.order_id) as string)?.trim();
        if (!query) return { error: "Missing orderId or customer name argument." };

        // 1. Try exact order ID endpoint
        const res = await fetch(`${DB_URL}/orders/${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error && data.id) return data;
        }

        // 2. Search all orders by ID or customer name (case-insensitive substring match)
        const allRes = await fetch(`${DB_URL}/orders`);
        if (allRes.ok) {
          const allOrders: Array<{ id: string; customer: string; status: string; total: number }> = await allRes.json();
          const lowerQ = query.toLowerCase();
          const match = allOrders.find(o =>
            o.id.toLowerCase() === lowerQ ||
            o.customer.toLowerCase().includes(lowerQ)
          );
          if (match) return match;
        }

        return { error: `No order found matching "${query}".` };
      }
      case "check_inventory": {
        const query = (args.sku ?? args.productName ?? args.name ?? args.query) as string;
        if (!query) return { error: "Missing product SKU or name to search for." };

        const skuRes = await fetch(`${DB_URL}/inventory?sku=${encodeURIComponent(query)}`);
        if (skuRes.ok) {
          const skuData = await skuRes.json();
          if (Array.isArray(skuData) && skuData.length > 0) return skuData[0];
        }

        const allRes = await fetch(`${DB_URL}/inventory`);
        if (!allRes.ok) throw new Error(`Server error: ${allRes.status}`);
        const allData: Array<{ sku: string; name: string; inStock: number }> = await allRes.json();
        const lowerQuery = query.toLowerCase();
        const match = allData.find(item =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.sku.toLowerCase().includes(lowerQuery)
        );
        if (match) return match;

        const fuzzyMatch = findBestFuzzyMatch(query, allData);
        if (fuzzyMatch) return fuzzyMatch;

        return { error: `No product matching "${query}" found in inventory.` };
      }
      case "lookup_policy": {
        const topic = args.topic as string;
        if (!topic) return { error: "Missing topic argument." };
        const res = await fetch(`${DB_URL}/policies?topic=${encodeURIComponent(topic)}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return { error: `Policy for topic "${topic}" not found.` };
        return data[0];
      }
      case "cancel_order": {
        const orderId = (args.orderId ?? args.order_id) as string;
        const reason = (args.reason as string) ?? "Customer requested cancellation";
        if (!orderId) return { error: "Missing orderId argument." };
        const res = await fetch(`${DB_URL}/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled", cancelReason: reason }),
        });
        if (res.status === 404) return { error: `Order ${orderId} not found.` };
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
      }
      default:
        return { error: `Unknown tool: "${name}".` };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Tool endpoint failure: ${msg}` };
  }
}
