"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Ship,
  ListIcon,
  Upload,
  Edit3,
} from "lucide-react";
import Papa from "papaparse";

interface LocationForm {
  containerNumber: string;
  vesselNumber: string;
  vesselName: string;
}

interface VesselContainer {
  id: number;
  containerNumber: string;
  vesselNumber: string;
  vesselName: string;
  dateTime: string;
}

const cardGradientStyle = {
  backgroundImage: `
      linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
      linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
    `,
  backgroundBlendMode: "overlay",
};

export function VesselContainer() {
  const [form, setForm] = useState<LocationForm>({
    containerNumber: "",
    vesselNumber: "",
    vesselName: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "bulk-import" | "list">(
    "create"
  );
  const [items, setItems] = useState<VesselContainer[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selected, setSelected] = useState<VesselContainer | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [filters, setFilters] = useState({
    containerNumber: "",
    vesselNumber: "",
    vesselName: "",
  });

  const [isLoadingList, setIsLoadingList] = useState(false);

  const fetchVessels = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await axios.get("/api/seed/vesselcontainer/get");
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to fetch vessel containers", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchVessels();
  }, []);

  const filteredItems = items.filter((vc) => {
    return (
      (!filters.containerNumber ||
        vc.containerNumber
          .toLowerCase()
          .includes(filters.containerNumber.toLowerCase())) &&
      (!filters.vesselNumber ||
        vc.vesselNumber
          .toLowerCase()
          .includes(filters.vesselNumber.toLowerCase())) &&
      (!filters.vesselName ||
        vc.vesselName.toLowerCase().includes(filters.vesselName.toLowerCase()))
    );
  });

  const openEdit = (vc: VesselContainer) => {
    setSelected(vc);
    setEditForm({
      containerNumber: vc.containerNumber,
      vesselNumber: vc.vesselNumber,
      vesselName: vc.vesselName,
    });
    setEditModalOpen(true);
  };

  const applyEdit = async () => {
    if (!selected) return;
    try {
      setIsUpdating(true);

      // validate container number if changed
      if (editForm.containerNumber !== selected.containerNumber) {
        const { data } = await axios.get("/api/seed/containers/get");
        const containers = data.containers || [];
        const exists = containers.some(
          (c: any) =>
            String(c.containerNo).toUpperCase() ===
            String(editForm.containerNumber).toUpperCase()
        );
        if (!exists) {
          alert(
            `Container ${editForm.containerNumber} not found. Add container first.`
          );
          setIsUpdating(false);
          return;
        }
      }

      await axios.patch(
        `/api/seed/vesselcontainer/${selected.id}/patch`,
        editForm
      );

      setEditModalOpen(false);
      fetchVessels(); // refresh list
    } catch (err) {
      console.error("Failed to update vessel container", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // 1) Check container exists

      const { data } = await axios.get("/api/seed/containers/get");
      console.log("data", data);
      const containers = data.containers || [];
      const exists = containers.some(
        (c: any) => c.containerNo === form.containerNumber
      );

      if (!exists) {
        setMessage({
          type: "error",
          text: `Container number "${form.containerNumber}" not found. Please add the container first.`,
        });
        setIsLoading(false);
        return;
      }

      // 2) Create vessel container
      await axios.post("/api/seed/vesselcontainer/post", {
        containerNumber: form.containerNumber,
        vesselNumber: form.vesselNumber,
        vesselName: form.vesselName,
        dateTime: new Date().toISOString(),
      });

      setMessage({
        type: "success",
        text: "Vessel container created successfully.",
      });

      // reset form
      setForm({ containerNumber: "", vesselNumber: "", vesselName: "" });
    } catch (err: any) {
      console.error("Create vesselContainer failed:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to create vessel container",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [parsedRows, setParsedRows] = useState<any[]>([]);

  const handleBulkFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedRows(results.data as any[]);
        setMessage(null);
      },
      error: () => {
        setMessage({ type: "error", text: "Failed to parse CSV file." });
      },
    });
  };

  // fetch ALL containers (no pagination)
  const fetchAllContainerNos = async (): Promise<Set<string>> => {
    const { data } = await axios.get("/api/seed/containers/get");
    console.log("data", data);
    const set = new Set<string>();

    const list = data?.containers ?? [];
    list.forEach((c: any) => {
      if (c?.containerNo) set.add(String(c.containerNo).toUpperCase());
    });

    return set;
  };

  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) {
      setMessage({
        type: "error",
        text: "No rows loaded. Choose a CSV first.",
      });
      return;
    }

    try {
      setIsLoading(true);

      // 1) fetch all known containerNos from DB
      const { data } = await axios.get("/api/seed/containers/get");
      const existingNos = new Set<string>();
      (data?.containers ?? []).forEach((c: any) => {
        if (c?.containerNo)
          existingNos.add(String(c.containerNo).toUpperCase());
      });

      // 2) normalize CSV rows → backend expects snake_case
      const normalized = parsedRows.map((r) => {
        const containerNumber = String(
          r.container_number ?? r.containerNumber ?? ""
        )
          .trim()
          .toUpperCase();
        const vesselNumber = String(r.vessel_number ?? r.vesselNumber ?? "")
          .trim()
          .toUpperCase();
        const vesselName = String(r.vessel_name ?? r.vesselName ?? "").trim();
        const dateTime = String(
          r.date_time ?? r.dateTime ?? new Date().toISOString()
        );

        return {
          container_number: containerNumber,
          vessel_number: vesselNumber,
          vessel_name: vesselName,
          date_time: dateTime,
        };
      });

      // 3) filter valid vs skipped
      const valid = normalized.filter(
        (x) => x.container_number && existingNos.has(x.container_number)
      );
      const skipped = normalized.filter(
        (x) => !x.container_number || !existingNos.has(x.container_number)
      );

      if (valid.length === 0) {
        const missingList = [
          ...new Set(skipped.map((s) => s.container_number).filter(Boolean)),
        ].join(", ");
        setMessage({
          type: "error",
          text: `No rows imported. Missing containers: ${
            missingList || "N/A"
          }. Add containers first.`,
        });
        return;
      }

      // 4) send valid rows to backend in { rows: [...] }
      const res = await axios.post("/api/seed/vesselcontainer/bulk", {
        rows: valid,
      });

      // 5) show summary
      const missingList = [
        ...new Set(skipped.map((s) => s.container_number).filter(Boolean)),
      ];
      setMessage({
        type: "success",
        text:
          `Submitted ${valid.length} row${valid.length > 1 ? "s" : ""}. ` +
          `Skipped ${skipped.length}${
            missingList.length ? ` (missing: ${missingList.join(", ")})` : ""
          }.`,
      });

      // reset
      setParsedRows([]);
      const input = document.getElementById(
        "bulk-upload-csv"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err: any) {
      console.error("Bulk import failed:", err);
      setMessage({
        type: "error",
        text: err?.response?.data?.error || "Bulk import failed",
      });
    } finally {
      setIsLoading(false);
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
            SCMT : Vessels
            <span className="block text-cyan-400 mt-2">Vessel Management</span>
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
            { key: "bulk-import", icon: <Upload />, label: "BULK IMPORT" },
            { key: "list", icon: <ListIcon />, label: "LIST" },
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
      </div>

      {/* Create Form */}
      {activeTab === "create" && (
        <section className="px-6 md:px-16 mb-16">
          <div
            className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradientStyle}
          >
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={handleSubmit}
            >
              {[
                {
                  label: "Container Number",
                  key: "containerNumber",
                  placeholder: "Container Number",
                },
                {
                  label: "Vessel Number",
                  key: "vesselNumber",
                  placeholder: "Vessel Number",
                },
                {
                  label: "Vessel Name",
                  key: "vesselName",
                  placeholder: "Vessel Name",
                },
              ].map((f) => (
                <div key={f.key} className="space-y-2">
                  <label className="text-sm font-semibold">{f.label} *</label>
                  <input
                    type="text"
                    value={(form as any)[f.key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [f.key]: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder={f.placeholder}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                    placeholder-white/60 focus:border-white mt-2"
                  />
                </div>
              ))}

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
        <section className="px-6 md:px-16 mb-16">
          <div
            className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradientStyle}
          >
            <h2 className="text-2xl font-bold mb-6">
              Bulk Import Vessel Containers
            </h2>

            {/* Hidden input */}
            <input
              id="bulk-upload-csv"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleBulkFileSelected}
            />

            <div className="flex gap-4 mb-4">
              <button
                type="button"
                className="bg-[#2D4D8B] hover:bg-[#1A2F4E] px-6 py-3 rounded-lg font-semibold uppercase shadow-[6px_6px_0_rgba(0,0,0,1)]"
                onClick={() =>
                  document.getElementById("bulk-upload-csv")?.click()
                }
              >
                <Upload className="inline w-5 h-5 mr-2" />
                Choose CSV
              </button>

              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={isLoading || parsedRows.length === 0}
                className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-[15px_15px_0_rgba(0,0,0,1)]"
              >
                {isLoading ? (
                  <Settings className="animate-spin w-5 h-5" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                Bulk Import
              </button>
            </div>

            {parsedRows.length > 0 && (
              <p className="text-sm text-gray-300">
                Loaded <b>{parsedRows.length}</b> rows from CSV.
              </p>
            )}
          </div>
        </section>
      )}

      {activeTab === "list" && (
        <section className="px-6 md:px-16 mb-16">
          <div
            className="rounded-3xl p-8 border-2 shadow-[30px_30px_0_rgba(0,0,0,1)]"
            style={cardGradientStyle}
          >
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-6">
              <ListIcon className="text-cyan-400" /> Vessel Containers
            </h2>

            {/* Filters */}
            <div
              className="bg-[#2e4972] rounded-lg border-4 border-black p-6 mb-8"
              style={cardGradientStyle}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Container No */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    Container No
                  </label>
                  <input
                    type="text"
                    placeholder="Enter container no"
                    value={filters.containerNumber}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        containerNumber: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white
                        focus:border-white focus:outline-none"
                  />
                </div>
                {/* Vessel No */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    Vessel No
                  </label>
                  <input
                    type="text"
                    placeholder="Enter vessel no"
                    value={filters.vesselNumber}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        vesselNumber: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white"
                  />
                </div>
                {/* Vessel Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">
                    Vessel Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter vessel name"
                    value={filters.vesselName}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, vesselName: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-[#2D4D8B] border-4 border-black rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() =>
                    setFilters({
                      containerNumber: "",
                      vesselNumber: "",
                      vesselName: "",
                    })
                  }
                  className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-6 py-2 rounded-lg text-white uppercase text-sm shadow-[8px_8px_0_rgba(0,0,0,1)]
                      hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Vessel Container Cards */}
            {/* Vessel Container Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {isLoadingList ? (
                <div className="col-span-full text-center py-12">
                  <Settings className="animate-spin" />
                </div>
              ) : (
                filteredItems.map(
                  (
                    vc // ✅ use filteredItems instead of items
                  ) => (
                    <div
                      key={vc.id}
                      className="bg-[#1A2A4A] rounded-lg p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] transition-shadow group cursor-pointer"
                      style={cardGradientStyle}
                      onClick={() => openEdit(vc)} // ✅ connected to helper
                    >
                      <div className="space-y-2 text-sm mb-2">
                        <p>
                          <span className="text-slate-400">Container:</span>{" "}
                          {vc.containerNumber}
                        </p>
                        <p>
                          <span className="text-slate-400">Vessel No:</span>{" "}
                          {vc.vesselNumber}
                        </p>
                        <p>
                          <span className="text-slate-400">Vessel Name:</span>{" "}
                          {vc.vesselName}
                        </p>
                        <p>
                          <span className="text-slate-400">Date:</span>{" "}
                          {new Date(vc.dateTime).toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-2 opacity-0 group-hover:opacity-100 text-xs flex items-center gap-2 text-cyan-400 transition-opacity">
                        <Edit3 className="w-4 h-4" /> Click to edit
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </section>
      )}
      {editModalOpen && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1A2A4A] p-6 rounded-xl shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4 text-cyan-400">
              Edit Vessel Container
            </h3>

            <div className="space-y-4">
              {["containerNumber", "vesselNumber", "vesselName"].map(
                (field) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold mb-1 capitalize">
                      {field}
                    </label>
                    <input
                      type="text"
                      value={editForm[field] || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          [field]: e.target.value.toUpperCase(),
                        }))
                      }
                      className="w-full px-4 py-2 bg-[#2D4D8B] border-2 border-black rounded-lg text-white"
                    />
                  </div>
                )
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-gray-500 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={applyEdit}
                disabled={isUpdating}
                className="px-4 py-2 bg-[#600f9e] hover:bg-[#491174] rounded-lg font-semibold uppercase disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
