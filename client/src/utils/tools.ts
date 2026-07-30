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
  // Allow up to ~30% of the query length as edit distance (min 2 edits)
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
  // In dev: Vite proxy forwards /api → localhost:3001
  // In prod: goes directly to the deployed Express server (no json-server needed)
  const DB_URL = "/api/db";

  try {
    switch (name) {
      case "get_order": {
        const orderId = args.orderId as string;
        if (!orderId) return { error: "Missing orderId argument." };
        const res = await fetch(`${DB_URL}/orders/${orderId}`);
        if (res.status === 404) return { error: `Order ${orderId} not found.` };
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
      }
      case "check_inventory": {
        const query = (args.sku ?? args.productName ?? args.name ?? args.query) as string;
        if (!query) return { error: "Missing product SKU or name to search for." };

        // First try exact SKU match
        const skuRes = await fetch(`${DB_URL}/inventory?sku=${encodeURIComponent(query)}`);
        if (skuRes.ok) {
          const skuData = await skuRes.json();
          if (Array.isArray(skuData) && skuData.length > 0) return skuData[0];
        }

        // Fallback: fetch all and match by product name/SKU (case-insensitive substring)
        const allRes = await fetch(`${DB_URL}/inventory`);
        if (!allRes.ok) throw new Error(`Server error: ${allRes.status}`);
        const allData: Array<{ sku: string; name: string; inStock: number }> = await allRes.json();
        const lowerQuery = query.toLowerCase();
        const match = allData.find(item =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.sku.toLowerCase().includes(lowerQuery)
        );
        if (match) return match;

        // Fuzzy fallback: tolerate typos (e.g. SLV-BLU-42 → SYL-BLU-42)
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
        const orderId = args.orderId as string;
        const reason = args.reason as string;
        if (!orderId) return { error: "Missing orderId argument." };
        if (!reason) return { error: "Missing reason argument." };
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
        return { error: `Unknown tool: "${name}". This is a model hallucination.` };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Tool endpoint failure: ${msg}` };
  }
}
