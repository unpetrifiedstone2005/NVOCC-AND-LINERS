"use client";

import React, { useEffect, useState } from "react";
import { Ship } from "lucide-react";

const cardGradientStyle = {
  backgroundImage: `
      linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
      linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
    `,
  backgroundBlendMode: "overlay",
};

interface Booking {
  id: string;
  quotationId: string;
  customerName: string | null;
  startLocation: string;
  endLocation: string;
  status: string;
  createdAt: string;
}

export const ViewBokkings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/booking/get");
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/booking/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      // Update local state instead of re-fetching everything
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } catch (err) {
      console.error("Failed to update booking:", err);
    }
  };

  if (loading) return <p className="text-white">Loading...</p>;

  // Pagination logic
  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentBookings = bookings.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">
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
            SCMT : My bookings
            <span className="block text-cyan-400 mt-2">Booking Management</span>
          </h1>
        </div>
      </header>

      <div
        className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
        style={cardGradientStyle}
      >
        <h1 className="text-3xl font-bold mb-6">All Bookings</h1>
        <div className="overflow-x-auto border-2 border-[#22D3EE] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <table className="min-w-full table-auto text-[#faf9f6] font-bold">
            <thead className="bg-[#00FFFF] text-black">
              <tr>
                <th className="p-2 border border-gray-600">Quotation Ref</th>
                <th className="px-4 py-2 font-bold">Customer</th>
                <th className="px-4 py-2 font-bold">From</th>
                <th className="px-4 py-2 font-bold">To</th>
                <th className="px-4 py-2 font-bold">Status</th>
                <th className="px-4 py-2 font-bold">Created At</th>
                <th className="px-4 py-2 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-500">
                  <td className="p-2 border border-gray-600">
                    {b.quotationId}
                  </td>
                  <td className="p-2 border border-gray-600">
                    {b.customerName ?? "-"}
                  </td>
                  <td className="p-2 border border-gray-600">
                    {b.startLocation}
                  </td>
                  <td className="p-2 border border-gray-600">
                    {b.endLocation}
                  </td>
                  <td className="p-2 border border-gray-600">{b.status}</td>
                  <td className="p-2 border border-gray-600">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 border border-gray-600 space-x-2">
                    <button
                      onClick={() => updateStatus(b.id, "CONFIRMED")}
                      className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                      Confirm
                    </button>

                    <button
                      onClick={() => updateStatus(b.id, "DELIVERED")}
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                      Delivered
                    </button>

                    <button
                      onClick={() => updateStatus(b.id, "CANCELLED")}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[#22D3EE] text-black font-bold rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-[#22D3EE] text-black font-bold rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
