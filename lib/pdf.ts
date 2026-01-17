// Helper to wait for all images to load
async function waitForImages(element: HTMLElement) {
    const images = Array.from(element.querySelectorAll("img"));
    const promises = images.map((img) => {
        if (img.complete && img.naturalHeight !== 0 && !img.src.includes("/api/proxy-image")) return Promise.resolve();
        return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
}

// Convert blob to base64
const toBase64 = (blob: Blob) => new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});


export async function downloadInvoicePdf(element: HTMLElement) {
  if (typeof window === "undefined") return;

  // ✅ disable mobile scaling/transforms before capture
  document.documentElement.classList.add("pdf-export");
  document.documentElement.classList.add("pdf-export");
  
  // 1. Swap images to proxy
  const images = Array.from(element.querySelectorAll("img"));
  const originalSrcs = new Map<HTMLImageElement, string>();

  for (const img of images) {
      const src = img.getAttribute("src");
      if (src && src.startsWith("http")) { // Only proxy remote images
          originalSrcs.set(img, src);
          img.setAttribute("src", `/api/proxy-image?url=${encodeURIComponent(src)}`);
          img.setAttribute("crossorigin", "anonymous"); // Important for html2canvas
      }
  }

  // 2. Wait for them to reload
  await waitForImages(element);
  
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  try {
    // ✅ each A4 page is your .a4-preview div
    const pages = Array.from(
      element.querySelectorAll<HTMLElement>(".a4-preview")
    );

    // fallback
    const targets = pages.length > 0 ? pages : [element];

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];

      // ✅ capture EXACT page size (avoid cut)
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: page.offsetWidth,
        windowHeight: page.offsetHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      // ✅ fit to PDF page
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, imgW, Math.min(imgH, pdfH));
    }

    pdf.save(`invoice-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    // 3. Restore images
    const images = Array.from(element.querySelectorAll("img"));
    if (originalSrcs) { // check if defined
        for (const [img, originalSrc] of originalSrcs) {
            img.setAttribute("src", originalSrc);
            img.removeAttribute("crossorigin");
        }
    }

    // ✅ restore UI
    document.documentElement.classList.remove("pdf-export");
  }
}
