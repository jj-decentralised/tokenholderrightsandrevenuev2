"use client";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  format?: "csv" | "json";
}

export function ExportButton({ data, filename, format = "csv" }: ExportButtonProps) {
  const handleExport = () => {
    let content: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      mimeType = "application/json";
    } else {
      if (data.length === 0) return;
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((h) => {
            const val = row[h];
            if (val == null) return "";
            const str = String(val);
            return str.includes(",") ? `"${str}"` : str;
          }).join(",")
        ),
      ];
      content = csvRows.join("\n");
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#626c71] bg-[#f7f7f5] border border-[#e5e5e3] rounded-lg hover:text-[#133c3b] hover:border-[#626c71] transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v7M3 5l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Export {format.toUpperCase()}
    </button>
  );
}
