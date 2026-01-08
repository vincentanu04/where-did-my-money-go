export async function fetchExpensesCsv(
  body: {
    type: "monthly" | "yearly" | "range"
    monthOffset?: number
    year?: number
    from?: string
    to?: string
  }
): Promise<Blob> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/expenses/export`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Failed to export CSV")
  }

  return await res.blob()
}
