// pages/BLDraftApproval.tsx
"use client"

import React, { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import {
  Calendar,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

// --- types
interface Draft {
  documentNo: string
  status: string
  updated: string
  type: "BL" | "SWB"
  bookingNo: string
  customerRef: string
  vessel: string
  voyage: string
  pol: string
}

export default function BLDraftApprovalComponent() {
  const [view, setView] = useState<"list" | "detail">("list")
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selected, setSelected] = useState<Draft | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [tab, setTab] = useState<"all" | "open" | "corr" | "appr" | "rel">(
    "all"
  )
  // date-range picker state
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 42), "yyyy-MM-dd")
  )
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  )
  const [showCalendar, setShowCalendar] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // mock load
  useEffect(() => {
    // TODO: fetch your real list from backend
    setDrafts([
      {
        documentNo: "HLCUHAM230904809",
        status: "Open for review",
        updated: "2024-01-24",
        type: "BL",
        bookingNo: "66987407",
        customerRef: "AN SH REF",
        vessel: "S. GABRIEL",
        voyage: "600789",
        pol: "DEHAM"
      },
      {
        documentNo: "HLCUSCL230700033",
        status: "Correction sent",
        updated: "2024-01-25",
        type: "BL",
        bookingNo: "66984227",
        customerRef: "kmkmkmkmkm",
        vessel: "UASC DOHA",
        voyage: "600605",
        pol: "SYDNEY"
      }
      // …more mock entries
    ])
  }, [])

  const filtered = drafts
    .filter((d) => !searchTerm || d.documentNo.includes(searchTerm))
    .filter((d) => {
      switch (tab) {
        case "open":
          return d.status === "Open for review"
        case "corr":
          return d.status === "Correction sent"
        case "appr":
          return d.status === "Approved"
        case "rel":
          return d.status === "Released"
        default:
          return true
      }
    })

  // Approve handler
  const handleApprove = () => {
    if (!selected) return
    // TODO: POST `/api/drafts/${selected.documentNo}/approve`
    console.log("Approving", selected.documentNo)
  }

  // ── DETAIL VIEW ──
  if (view === "detail" && selected) {
    return (
      <div className="p-6 space-y-8">
        {/* Back */}
        <button
          onClick={() => {
            setView("list")
            setIsEditing(false)
            setSelected(null)
          }}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft size={20} /> Back to List
        </button>

        {/* Either PDF+Actions or Edit Page */}
        {!isEditing ? (
          <>
            {/* PDF + Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 aspect-video border rounded overflow-hidden">
                <iframe
                  src={encodeURI(
                    `https://docs.google.com/gview?url=${""}&embedded=true`
                  )}
                  className="w-full h-full"
                  frameBorder="0"
                />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Document Details</h2>
                <div>
                  <strong>Document no:</strong> {selected.documentNo}
                </div>
                <div>
                  <strong>Creation Date:</strong>{" "}
                  {format(new Date(selected.updated), "yyyy-MM-dd")}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {selected.status}
                  </span>
                </div>
                <div>
                  <strong>Version:</strong> Freighted
                </div>

                <h3 className="mt-4 font-semibold">Actions</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex w-full items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  <span className="material-icons">edit</span> Make Changes
                </button>
                <button
                  onClick={handleApprove}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Approve BL Draft
                </button>
              </div>
            </div>
          </>
        ) : (
          <EditPage
            draft={selected}
            onCancel={() => setIsEditing(false)}
            onSave={() => {
              // TODO: POST all changes to backend
              console.log("Saving all changes…")
              setIsEditing(false)
            }}
          />
        )}
      </div>
    )
  }

  // ── LIST VIEW ──
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">BL Draft Approval</h1>

      {/* Search + Date */}
      <div className="flex flex-wrap items-center gap-4 relative">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-full pl-10 pr-4 py-2"
          />
        </div>

        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex items-center gap-2 border rounded-full px-4 py-2"
        >
          <Calendar /> {startDate} → {endDate}
        </button>

        {showCalendar && (
          <div className="absolute top-full right-0 mt-2 bg-white border rounded shadow-lg z-10 p-4 space-y-2">
            <div className="flex flex-col">
              <label className="text-sm mb-1">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded p-1"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded p-1"
              />
            </div>
            <button
              onClick={() => setShowCalendar(false)}
              className="mt-2 w-full text-center bg-blue-600 text-white rounded py-1"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <nav className="flex space-x-6 border-b">
        {(
          [
            ["all", `All (${drafts.length})`],
            [
              "open",
              `Open for review (${drafts.filter((d) => d.status === "Open for review").length})`
            ],
            [
              "corr",
              `Correction sent (${drafts.filter((d) => d.status === "Correction sent").length})`
            ],
            [
              "appr",
              `Approved (${drafts.filter((d) => d.status === "Approved").length})`
            ],
            [
              "rel",
              `Released (${drafts.filter((d) => d.status === "Released").length})`
            ]
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-2 ${
              tab === key
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Type Filter */}
      <div className="flex space-x-4 py-4">
        {(["BL", "SWB"] as Draft["type"][]).map((t) => (
          <button
            key={t}
            className="px-4 py-1 border rounded-full text-sm hover:bg-gray-100"
          >
            {t === "BL" ? "Bill of Lading" : "Sea Waybill"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Document no</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Draft Updated</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Booking no</th>
              <th className="px-4 py-2">Customer Ref</th>
              <th className="px-4 py-2">Vessel</th>
              <th className="px-4 py-2">Voyage no</th>
              <th className="px-4 py-2">POL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.documentNo}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td
                  className="px-4 py-2 text-blue-600 underline"
                  onClick={() => {
                    setSelected(d)
                    setView("detail")
                    setIsEditing(false)
                  }}
                >
                  {d.documentNo}
                </td>
                <td className="px-4 py-2">{d.status}</td>
                <td className="px-4 py-2">
                  {format(new Date(d.updated), "yyyy-MM-dd")}
                </td>
                <td className="px-4 py-2">
                  {d.type === "BL" ? "Bill of Lading" : "Sea Waybill"}
                </td>
                <td className="px-4 py-2">{d.bookingNo}</td>
                <td className="px-4 py-2">{d.customerRef}</td>
                <td className="px-4 py-2">{d.vessel}</td>
                <td className="px-4 py-2">{d.voyage}</td>
                <td className="px-4 py-2">{d.pol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination stub */}
      <div className="flex justify-between items-center pt-4">
        <div>
          Rows per page:
          <select className="ml-2 border rounded p-1">
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button>
            <ChevronLeft />
          </button>
          <span>
            1–{filtered.length} of {drafts.length}
          </span>
          <button>
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EditPage component (all sections stacked) ──
function EditPage({
  draft,
  onCancel,
  onSave
}: {
  draft: Draft
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="space-y-12">
      {/* Section 1: Addresses & References */}
      <section className="border-t pt-6 space-y-4">
        <h2 className="text-2xl font-semibold">1. Addresses & References</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1">Shipper</label>
            <textarea
              rows={4}
              className="w-full border rounded p-2"
              defaultValue={`HAPAG-LLOYD AG
AREA GERMANY & CENTRAL EUROPE
ROSENSTRASSE 17
D-20095 HAMBURG`}
            />
          </div>
          <div>
            <label className="block mb-1">Booking Number</label>
            <input
              className="w-full border rounded p-2"
              defaultValue={draft.bookingNo}
            />
          </div>
          <div>
            <label className="block mb-1">B/L No.</label>
            <input
              className="w-full border rounded p-2"
              defaultValue={draft.documentNo}
            />
          </div>
          <div>
            <label className="block mb-1">Export References</label>
            <textarea
              rows={3}
              className="w-full border rounded p-2"
              defaultValue={`AN SH REF
AN FF REF`}
            />
          </div>
          <div>
            <label className="block mb-1">Consignee</label>
            <textarea
              rows={4}
              className="w-full border rounded p-2"
              defaultValue={`HAPAG-LLOYD (AMERICA) LLC.
24600 CENTER RIDGE ROAD
SUITE 220
WESTLAKE, OH 44145
USA`}
            />
          </div>
          <div>
            <label className="block mb-1">Notify Address</label>
            <textarea
              rows={4}
              className="w-full border rounded p-2"
              defaultValue={`FINAL ADDRESS TBA
FINAL ADDRESS TBA
DUMMYLAND WORLD`}
            />
          </div>
          <div>
            <label className="block mb-1">Forwarding Agent</label>
            <textarea
              rows={3}
              className="w-full border rounded p-2"
              defaultValue={`HAPAG-LLOYD AG
BALLINDAMM 25`}
            />
          </div>
          <div>
            <label className="block mb-1">Consignee’s Reference</label>
            <input
              className="w-full border rounded p-2"
              defaultValue="CONSIGNEE REF"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Containers & Cargo */}
      <section className="border-t pt-6 space-y-4">
        <h2 className="text-2xl font-semibold">2. Containers & Cargo</h2>
        <div className="space-y-8">
          {/* Container block */}
          <div className="border rounded p-6 space-y-4">
            <h3 className="font-medium">Container 1 (45GP)</h3>
            <div className="grid md:grid-cols-6 gap-4">
              <div>
                <label className="block mb-1">Cargo Description</label>
                <input
                  className="w-full border rounded p-2"
                  defaultValue="FAK"
                />
              </div>
              <div>
                <label className="block mb-1">HS Code</label>
                <div className="flex gap-1">
                  <input
                    maxLength={2}
                    className="w-12 border rounded p-2 text-center"
                    defaultValue="23"
                  />
                  <input
                    maxLength={2}
                    className="w-12 border rounded p-2 text-center"
                    defaultValue="23"
                  />
                  <input
                    maxLength={2}
                    className="w-12 border rounded p-2 text-center"
                    defaultValue="00"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Cargo Weight</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  defaultValue={20000}
                />
              </div>
              <div>
                <label className="block mb-1">Unit</label>
                <select className="w-full border rounded p-2" defaultValue="kg">
                  <option>kg</option>
                  <option>lb</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                  DG…
                </button>
              </div>
            </div>

            {/* Actions for container */}
            <div className="flex justify-center gap-4 mt-6">
              <button className="px-4 py-2 bg-orange-600 text-white rounded">
                Copy Container with Cargo
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded">
                Copy This Cargo to all Containers
              </button>
            </div>
            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-orange-600 text-white rounded">
                Out-Of-Gauge
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded">
                Change Type
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded">
                Remove
              </button>
            </div>
          </div>

          {/* + Add another container */}
          <button className="flex items-center text-blue-600 hover:underline">
            <span className="mr-1">+</span> Add Container
          </button>
        </div>
      </section>

      {/* Section 3: Customs & Remarks */}
      <section className="border-t pt-6 space-y-4">
        <h2 className="text-2xl font-semibold">3. Customs & Remarks</h2>
        <div>
          <label className="block mb-1">Bill of Lading Numbers</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="bol" defaultChecked /> Not needed
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="bol" /> No. of BL numbers:
            </label>
            <input
              type="number"
              className="w-20 border rounded p-2"
              defaultValue={0}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">Export Customs Filing</label>
          <div className="flex items-start gap-4">
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" /> Export filing by third party
            </label>
            <textarea
              rows={3}
              className="flex-1 border rounded p-2"
              placeholder="Performed by (address)"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">
            Remarks (optional Shipper/Consignee address)
          </label>
          <textarea
            rows={4}
            className="w-full border rounded p-2"
            placeholder="Enter any remarks here…"
          />
        </div>
      </section>

      {/* Section 4: Document Issuance */}
      <section className="border-t pt-6 space-y-4">
        <h2 className="text-2xl font-semibold">4. Document Issuance</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1">Place of Issue</label>
            <input className="w-full border rounded p-2" defaultValue="HAMBURG" />
          </div>
          <div>
            <label className="block mb-1">Date of Issue</label>
            <input
              type="date"
              className="w-full border rounded p-2 bg-gray-50"
              disabled
              defaultValue={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <div>
            <label className="block mb-1">Freight payable at</label>
            <select className="w-full border rounded p-2">
              <option>Elsewhere</option>
              <option>Port of Loading</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Freight payable at (detail)</label>
            <input className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block mb-1">Document Type</label>
            <select className="w-full border rounded p-2">
              <option>Original</option>
              <option>Non-negotiable</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1"># of Freighted Original BLs</label>
              <input
                type="number"
                readOnly
                className="w-full border rounded p-2 bg-gray-50"
                defaultValue={2}
              />
            </div>
            <div>
              <label className="block mb-1"># of Freighted Copies</label>
              <input type="number" className="w-full border rounded p-2" defaultValue={0} />
            </div>
            <div>
              <label className="block mb-1"># of Unfreighted Originals</label>
              <input
                type="number"
                readOnly
                className="w-full border rounded p-2 bg-gray-50"
                defaultValue={3}
              />
            </div>
            <div>
              <label className="block mb-1"># of Unfreighted Copies</label>
              <input type="number" className="w-full border rounded p-2" defaultValue={0} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Final Comments & Submit */}
      <section className="border-t pt-6 space-y-4">
        <h2 className="text-2xl font-semibold">5. Final Comments & Submit</h2>
        <div>
          <label className="block mb-1">General comment</label>
          <textarea rows={4} className="w-full border rounded p-2 resize-none" />
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel Changes
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save All
          </button>
        </div>
      </section>
    </div>
  )
}
