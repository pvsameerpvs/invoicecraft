import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InvoicePage from "../app/invoice/page";

jest.mock("../lib/pdf", () => ({
  downloadInvoicePdf: jest.fn(() => Promise.resolve())
}));

import { downloadInvoicePdf } from "../lib/pdf";

describe("Invoice PDF download", () => {
  it("triggers PDF generation when Download PDF is clicked", async () => {
    const user = userEvent.setup();
    render(<InvoicePage />);

    const button = screen.getByRole("button", { name: /download pdf/i });
    await user.click(button);

    await waitFor(() => {
      expect(downloadInvoicePdf).toHaveBeenCalled();
    });
  });
});
