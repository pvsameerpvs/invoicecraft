export async function downloadInvoicePdf(element: HTMLElement) {
  if (typeof window === "undefined") return;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // ✅ each A4 page is your .a4-preview div
  const pages = Array.from(element.querySelectorAll<HTMLElement>(".a4-preview"));

  // if only one page container exists, fallback to element itself
  const targets = pages.length > 0 ? pages : [element as HTMLElement];

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < targets.length; i++) {
    const page = targets[i];

    // ✅ IMPORTANT: capture full width so nothing cuts
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);

    const imgW = pdfW;
    const imgH = (imgProps.height * imgW) / imgProps.width;

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, imgW, Math.min(imgH, pdfH));
  }

  pdf.save(`invoice-${new Date().toISOString().slice(0, 10)}.pdf`);
}
