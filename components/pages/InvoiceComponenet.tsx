"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Ship,
  ListIcon,
  Upload,
} from "lucide-react";

const cardGradientStyle = {
  backgroundImage: `
      linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
      linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
    `,
  backgroundBlendMode: "overlay",
};

interface InvoiceForm {
  invoice_number: string;
  status: string;
}

export const InvoiceComponent = () => {
  const [form, setForm] = useState<InvoiceForm>({
    invoice_number: "",
    status: "PENDING",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "bulk-import" | "list">(
    "create"
  );
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("/api/invoices/get");
        const data = await res.json();

        // Ensure invoices is always an array
        if (Array.isArray(data)) {
          setInvoices(data);
        } else {
          console.error("Unexpected invoices response:", data);
          setInvoices([]); // fallback to empty array
        }
      } catch (err) {
        console.error("Failed to load invoices", err);
        setInvoices([]); // fallback
      }
    };
    fetchInvoices();
  }, []);

  // Filtering + Pagination
  const filtered = Array.isArray(invoices)
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
          inv.status?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/invoices/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: form.invoice_number,
          status: form.status,
        }),
      });

      if (!res.ok) throw new Error("Failed to create invoice");

      await res.json();
      setMessage({ type: "success", text: "Invoice created successfully!" });

      // reset form
      setForm({ invoice_number: "", status: "PENDING" });
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      setMessage({
        type: "error",
        text: err.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editingInvoice.status }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();

      // update frontend state
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === updated.id ? updated : inv))
      );

      setMessage({ type: "success", text: "Invoice updated successfully!" });
      setEditingInvoice(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update invoice." });
    }
  };
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
      {/* Header */}
      <header className="py-1 px-6 md:px-16">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div
              className="rounded-full bg-[#1A2A4A] p-3"
              style={cardGradientStyle}
            >
              <Ship height={50} width={50} className="text-[#00FFFF]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            SCMT : Invoices
            <span className="block text-cyan-400 mt-2">Invoice Management</span>
          </h1>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div
          className={`mx-6 md:mx-16 mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-900/30 border-green-400 text-green-400"
              : "bg-red-900/30 border-red-400 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 md:px-16 mb-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "create", icon: <Plus />, label: "CREATE" },
            { key: "bulk-import", icon: <Upload />, label: "View" },
            { key: "list", icon: <ListIcon />, label: "Edit" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-1 py-2 font-bold flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? "bg-gray-300 text-black rounded-3xl shadow-[13px_13px_0_rgba(0,0,0,1)] "
                  : "bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] rounded-lg shadow-[4px_4px_0_rgba(0,0,0,1)] "
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Create Form */}
        {activeTab === "create" && (
          <section className="px-6 md:px-16 mb-16 mt-8">
            <div
              className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
              style={cardGradientStyle}
            >
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                onSubmit={handleSubmit}
              >
                {/* Invoice Number */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={form.invoice_number}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        invoice_number: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Invoice Number"
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                               placeholder-white/60 focus:border-white mt-2"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                               focus:border-white mt-2"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 flex justify-center mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    {isLoading ? (
                      <Settings className="animate-spin w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    Create
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {activeTab === "bulk-import" && (
          <section className="px-6 md:px-16 mb-16 mt-8">
            <div
              className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
              style={cardGradientStyle}
            >
              {/* Search */}
              <div className="flex justify-between items-center mb-6">
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 w-1/3 bg-[#2D4D8B] border-2 border-black rounded-lg text-white placeholder-white/60"
                />
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-gray-600 text-left">
                <thead className="bg-[#1A2A4A] text-cyan-400">
                  <tr>
                    <th className="border border-gray-600 px-4 py-2">
                      Invoice Number
                    </th>
                    <th className="border border-gray-600 px-4 py-2">Status</th>
                    <th className="border border-gray-600 px-4 py-2">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#2D4D8B]">
                      <td className="border border-gray-600 px-4 py-2">
                        {inv.invoiceNumber}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        {inv.status}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#600f9e] rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-[#600f9e] rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}
        {activeTab === "list" && (
          <section className="px-6 md:px-16 mb-16 mt-8">
            <div
              className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
              style={cardGradientStyle}
            >
              {/* Search */}
              <div className="flex justify-between items-center mb-6">
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 w-1/3 bg-[#2D4D8B] border-2 border-black rounded-lg text-white placeholder-white/60"
                />
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-gray-600 text-left">
                <thead className="bg-[#1A2A4A] text-cyan-400">
                  <tr>
                    <th className="border border-gray-600 px-4 py-2">
                      Invoice Number
                    </th>
                    <th className="border border-gray-600 px-4 py-2">Status</th>
                    <th className="border border-gray-600 px-4 py-2">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#2D4D8B]">
                      <td className="border border-gray-600 px-4 py-2">
                        {inv.invoiceNumber}
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            inv.status === "APPROVED"
                              ? "bg-green-700 text-green-200"
                              : "bg-yellow-700 text-yellow-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="border border-gray-600 px-4 py-2">
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#600f9e] rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-[#600f9e] rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {/* Edit Form Modal */}
              {editingInvoice && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60">
                  <div className="bg-[#0A1A2F] p-6 rounded-2xl shadow-lg w-96">
                    <h2 className="text-xl font-bold mb-4">Edit Invoice</h2>

                    <form
                      onSubmit={handleEditSubmit}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="text-sm font-semibold">
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          value={editingInvoice.invoiceNumber}
                          disabled
                          className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">Status</label>
                        <select
                          value={editingInvoice.status}
                          onChange={(e) =>
                            setEditingInvoice({
                              ...editingInvoice,
                              status: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-[#2D4D8B] border-2 border-black rounded-lg text-white mt-1"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                        </select>
                      </div>

                      <div className="flex justify-between mt-6">
                        <button
                          type="button"
                          onClick={() => setEditingInvoice(null)}
                          className="px-4 py-2 bg-gray-500 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
