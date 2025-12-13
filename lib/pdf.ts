export async function downloadInvoicePdf(element: HTMLElement) {
  if (typeof window === "undefined") return;

  const html2pdf = (await import("html2pdf.js")).default;

  const fullWidth = Math.max(
    element.scrollWidth,
    element.getBoundingClientRect().width
  );

  const opt = {
    margin: 0,
    filename: `invoice-${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: fullWidth,
      scrollX: 0,
      scrollY: 0,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
  };

  await html2pdf().set(opt).from(element).save();
}
