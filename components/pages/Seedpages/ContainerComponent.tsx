  "use client";

  import React, { useState, useEffect } from "react";
  import axios from "axios";
  import {
    Container as ContainerIcon,
    Package,
    Plus,
    Edit3,
    Save,
    X,
    Database,
    Settings,
    CheckCircle,
    AlertCircle,
    Upload,
    FileText,
    Download,
    List,
    ChevronLeft,
    ChevronRight,
  } from "lucide-react";

  // Types based on your models
  interface ContainerType {
    isoCode: string;
    name: string;
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    maxStackWeightKg: number;
    tareWeightKg: number;
    maxGrossWeightKg: number;
    group: ContainerGroup;
    teuFactor: number;
  }

  interface Container {
    id?: string;
    containerNo: string;
    bicCode?: string;
    containerTypeIsoCode: string;
    ownership?: string;
    companyOrigin?: string;
    manufacturer?: string;
    customsApproval?: string;
    description?: string;
    status?: ContainerStatus;
    currentDepot?: string;
    lastUsedAt?: string;
    cscPlateUrl?: string;
    certificationExpiry?: string;
    foodGrade?: boolean;
  }

  enum ContainerGroup {
    DRY_STANDARD = "DRY_STANDARD",
    REEFER = "REEFER",
    OPEN_TOP = "OPEN_TOP",
    FLAT_RACK = "FLAT_RACK",
    TANK = "TANK",
  }

  enum ContainerStatus {
    AVAILABLE = "AVAILABLE",
    IN_TRANSIT = "IN_TRANSIT",
    MAINTENANCE = "MAINTENANCE",
    DAMAGED = "DAMAGED",
    RETIRED = "RETIRED",
  }

  // Master list of all industry‐standard container types
  const STANDARD_CONTAINER_TYPES: ContainerType[] = [
    {
      isoCode: "20STD",
      name: "20' Dry Standard Container",
      group: ContainerGroup.DRY_STANDARD,
      lengthMm: 6058,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 2200,
      maxGrossWeightKg: 30480,
      maxStackWeightKg: 192000,
      teuFactor: 1,
    },
    {
      isoCode: "40STD",
      name: "40' Dry Standard Container",
      group: ContainerGroup.DRY_STANDARD,
      lengthMm: 12192,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 3800,
      maxGrossWeightKg: 30480,
      maxStackWeightKg: 192000,
      teuFactor: 2,
    },
    {
      isoCode: "40HC",
      name: "40' High Cube Container",
      group: ContainerGroup.DRY_STANDARD,
      lengthMm: 12032,
      widthMm: 2438,
      heightMm: 2896,
      tareWeightKg: 3900,
      maxGrossWeightKg: 30480,
      maxStackWeightKg: 192000,
      teuFactor: 2,
    },
    {
      isoCode: "45HC",
      name: "45' High Cube Container",
      group: ContainerGroup.DRY_STANDARD,
      lengthMm: 13716,
      widthMm: 2438,
      heightMm: 2896,
      tareWeightKg: 4300,
      maxGrossWeightKg: 30480,
      maxStackWeightKg: 192000,
      teuFactor: 2.25,
    },
    {
      isoCode: "20RF",
      name: "20' Refrigerated Container",
      group: ContainerGroup.REEFER,
      lengthMm: 6058,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 3000,
      maxGrossWeightKg: 26000,
      maxStackWeightKg: 160000,
      teuFactor: 1,
    },
    {
      isoCode: "40RF",
      name: "40' Refrigerated Container",
      group: ContainerGroup.REEFER,
      lengthMm: 12192,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 4200,
      maxGrossWeightKg: 28000,
      maxStackWeightKg: 160000,
      teuFactor: 2,
    },
    {
      isoCode: "20OT",
      name: "20' Open Top Container",
      group: ContainerGroup.OPEN_TOP,
      lengthMm: 6058,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 2300,
      maxGrossWeightKg: 30480,
      maxStackWeightKg: 192000,
      teuFactor: 1,
    },
    {
      isoCode: "40OT",
      name: "40' Open Top Container",
      group: ContainerGroup.OPEN_TOP,
      lengthMm: 12192,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 3800,
      maxGrossWeightKg: 30480,
      maxStackWeightKg: 192000,
      teuFactor: 2,
    },
    {
      isoCode: "20TK",
      name: "20' Tank Container",
      group: ContainerGroup.TANK,
      lengthMm: 6058,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 4200,
      maxGrossWeightKg: 36000,
      maxStackWeightKg: 200000,
      teuFactor: 1,
    },
    {
      isoCode: "40FR",
      name: "40' Flat Rack Container",
      group: ContainerGroup.FLAT_RACK,
      lengthMm: 12192,
      widthMm: 2438,
      heightMm: 2591,
      tareWeightKg: 3800,
      maxGrossWeightKg: 30480,
      maxStackWeightKg: 192000,
      teuFactor: 2,
    },
  ];

  const cardGradientStyle = {
    backgroundImage: `
      linear-gradient(to bottom left, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%),
      linear-gradient(to bottom right, #0A1A2F 0%, #0A1A2F 15%, #22D3EE 100%)
    `,
    backgroundBlendMode: "overlay",
  };

  export function ContainerComponent() {
    const [activeTab, setActiveTab] = useState<'container-types' | 'containers' | 'bulk-import' | 'container-list'>('container-types');
    const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
    const [dbIsoCodes, setDbIsoCodes] = useState<string[]>([]);
    const [containers, setContainers] = useState<Container[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Bulk import states
    const [bulkData, setBulkData] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [bulkImportMode, setBulkImportMode] = useState<'textarea' | 'file'>('textarea');

    // Container list states
    const [allContainers, setAllContainers] = useState<Container[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(20);
    const [isLoadingList, setIsLoadingList] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
      containerNo: '',
      containerTypeIsoCode: '',
      status: '',
      currentDepot: '',
      ownership: ''
    });

    // Edit modal states
    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
    const [editForm, setEditForm] = useState<Container>({} as Container);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [typeCount, setTypeCount] = useState<number>(0);
    const [containerCount, setContainerCount] = useState<number>(0);
    // Container Type Form State
    const [containerTypeForm, setContainerTypeForm] = useState<ContainerType>({
      isoCode: '',
      name: '',
      lengthMm: 0,
      widthMm: 0,
      heightMm: 0,
      maxStackWeightKg: 0,
      tareWeightKg: 0,
      maxGrossWeightKg: 0,
      group: ContainerGroup.DRY_STANDARD,
      teuFactor: 1.0,
    });

    // Container Form State
    const [containerForm, setContainerForm] = useState<Container>({
      containerNo: '',
      bicCode: '',
      containerTypeIsoCode: '',
      ownership: '',
      companyOrigin: '',
      manufacturer: '',
      customsApproval: '',
      description: '',
      status: ContainerStatus.AVAILABLE,
      currentDepot: '',
      lastUsedAt: '',
      cscPlateUrl: '',
      certificationExpiry: '',
      foodGrade: false,
    });

    const showMessage = (type: 'success' | 'error', text: string) => {
      setMessage({ type, text });
      setTimeout(() => setMessage(null), 5000);
    };

    // Fetch existing container-types from DB
useEffect(() => {
  console.log("📦 useEffect: fetching container types & stats");

  // 1) fetch types
  axios
    .get<{ items: ContainerType[] }>("/api/seed/containers/types/get")
    .then(({ data }) => {
      const types = data.items;
      setContainerTypes(types);
      setDbIsoCodes(types.map(t => t.isoCode));
      setTypeCount(types.length);
    })
    .catch((err) => {
      console.error("❌ Container-types API error:", err);
      showMessage("error", "Failed to load existing container types");
    });

  // 2) fetch just one container page to read the `total` field
  axios
    .get<{
      containers: Container[];
      totalPages: number;
      total: number;
      currentPage: number;
    }>("/api/seed/containers/get", { params: { page: 1, limit: 1 } })
    .then(({ data }) => {
      // our GET returns a `total` count, so use that
      setContainerCount(typeof data.total === "number"
        ? data.total
        : data.containers.length
      );
    })
    .catch(err => {
      console.error("❌ Containers-stats API error:", err);
      showMessage("error", "Failed to load container stats");
    });
}, []);




    // available types = standard minus DB
    const availableTypes = STANDARD_CONTAINER_TYPES.filter(
      t => !dbIsoCodes.includes(t.isoCode)
    );

  const handleSubmitContainerType = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1) POST the new type
      const { data: newType } = await axios.post<ContainerType>("/api/seed/containers/types/post", containerTypeForm);

      // 2) update your local state
      setContainerTypes(prev => [...prev, newType]);
      setDbIsoCodes(prev => [...prev, newType.isoCode]);

      setTypeCount(c => c + 1)

      // 3) reset the form
      setContainerTypeForm({
        isoCode: "",
        name: "",
        lengthMm: 0,
        widthMm: 0,
        heightMm: 0,
        maxStackWeightKg: 0,
        tareWeightKg: 0,
        maxGrossWeightKg: 0,
        group: ContainerGroup.DRY_STANDARD,
        teuFactor: 1.0,
      });

      showMessage("success", "Container Type created successfully!");
    } catch (err: any) {
      // handle validation errors from Zod or Prisma
      if (err.response?.data?.errors) {
        showMessage("error", err.response.data.errors.map((e: any) => e.message).join("; "));
      } else {
        showMessage("error", err.response?.data?.error || "Failed to create container type");
      }
    } finally {
      setIsLoading(false);
    }
  };

    const handleSubmitContainer = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1) send to your Next.js POST handler
    const { data: newContainer } = await axios.post<Container>(
      "/api/seed/containers/post",
      containerForm
    );

    // 2) update UI state
    setContainers(prev => [...prev, newContainer]);

    setContainerCount(c => c + 1)

    // 3) clear the form
    setContainerForm({
      containerNo: "",
      bicCode: "",
      containerTypeIsoCode: "",
      ownership: "",
      companyOrigin: "",
      manufacturer: "",
      customsApproval: "",
      description: "",
      status: ContainerStatus.AVAILABLE,
      currentDepot: "",
      lastUsedAt: "",
      cscPlateUrl: "",
      certificationExpiry: "",
      foodGrade: false,
    });

    showMessage("success", "Container created successfully!");
  } catch (err: any) {
    // Zod errors come back as `errors` array
    if (err.response?.data?.errors) {
      showMessage("error", err.response.data.errors.map((e: any) => e.message).join("; "));
    } else {
      showMessage("error", err.response?.data?.error || "Failed to create container");
    }
  } finally {
    setIsLoading(false);
  }
};

   const handleBulkImport = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  // 1) pull raw JSON from textarea or uploaded file
  let jsonData = bulkData;
  if (bulkImportMode === "file" && uploadedFile) {
    jsonData = await uploadedFile.text();
  }
  if (!jsonData.trim()) {
    showMessage("error", "Please provide JSON data");
    setIsLoading(false);
    return;
  }

  // 2) parse into `items` array
  let items: Partial<Container>[];
  try {
    items = JSON.parse(jsonData);
    if (!Array.isArray(items)) throw new Error();
  } catch {
    showMessage("error", "Invalid JSON format. Provide an array of container objects.");
    setIsLoading(false);
    return;
  }

  // 3) basic validation
  const errors: string[] = [];
  items.forEach((c, i) => {
    if (!c.containerNo || !c.containerTypeIsoCode) {
      errors.push(`Item ${i + 1}: missing containerNo or containerTypeIsoCode`);
    }
  });
  if (errors.length) {
    showMessage("error", `Validation errors: ${errors.join("; ")}`);
    setIsLoading(false);
    return;
  }

  // 4) loop and import via axios.post
  let successCount = 0;
  const failed: string[] = [];

  for (const c of items) {
    try {
      const { data: nc } = await axios.post<Container>(
        "/api/seed/containers/post",
        c
      );
      setContainers(prev => [...prev, nc]);
      successCount++;
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.map((e: any) => e.message).join(", ")
          : err.message);
      failed.push(`${c.containerNo || "[no number]"}: ${msg}`);
    }
  }

  // 5) show results
  if (successCount) {
    setContainerCount(c => c + successCount);
    showMessage(
      "success",
      `Imported ${successCount} containers${failed.length ? `. Failed: ${failed.length}` : ""}`
    );
    setBulkData("");
    setUploadedFile(null);
  } else {
    showMessage("error", `No containers created. Errors: ${failed.join("; ")}`);
  }

  setIsLoading(false);
};

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file?.type === "application/json") {
        setUploadedFile(file);
      } else {
        showMessage("error", "Please select a valid JSON file");
      }
    };

    const downloadSampleJSON = () => {
      const sample = [
        {
          containerNo: "SCMT1234567",
          containerTypeIsoCode: "40HC",
          bicCode: "SCMT",
          ownership: "SCMT",
          companyOrigin: "Iraq",
          manufacturer: "Manufacturer A",
          status: "AVAILABLE",
          currentDepot: "Baghdad Port",
          foodGrade: false,
          description: "Sample container 1"
        }
      ];
      const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "container_import_sample.json"; a.click();
      URL.revokeObjectURL(url);
    };

    // inside your ContainerComponent()

interface ContainersApiResponse {
  containers: Container[];
  totalPages: number;
  total: number;
  currentPage: number;
}

const fetchContainers = async (page: number = 1) => {
  setIsLoadingList(true);

  try {
    // 1) Build params: page, limit, plus only the filters that have values
    const params: Record<string, string | number> = {
      page,
      limit: pageSize
    };
    Object.entries(filters).forEach(([key, val]) => {
      if (val.trim() !== "") {
        params[key] = val.trim();
      }
    });

    // 2) Call your API with axios.get
    const { data } = await axios.get<ContainersApiResponse>(
      "/api/seed/containers/get",
      { params }
    );

    

    // 3) Unpack
    setAllContainers(data.containers);
    setTotalPages(data.totalPages);
    setCurrentPage(data.currentPage);
    setContainerCount(data.total);


  } catch (err) {
    console.error("Error fetching containers:", err);
    showMessage("error", "Failed to fetch containers");
  } finally {
    setIsLoadingList(false);
  }
};


    const handleFilterChange = (field: string, value: string) => {
      setFilters(prev => ({ ...prev, [field]: value }));
      setCurrentPage(1);
    };

    const applyFilters = () => fetchContainers(1);
    const clearFilters = () => {
      setFilters({ containerNo: "", containerTypeIsoCode: "", status: "", currentDepot: "", ownership: "" });
      setCurrentPage(1);
      fetchContainers(1);
    };

    const handleRowClick = (c: Container) => {
      setSelectedContainer(c);
      setEditForm({ ...c });
      setHasChanges(false);
      setIsEditModalOpen(true);
    };

    const handleEditFormChange = (field: keyof Container, value: any) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    };

    const handleCloseEditModal = () => {
      setIsEditModalOpen(false);
      setSelectedContainer(null);
      setHasChanges(false);
    };

    const handleApplyChanges = async () => {
  if (!selectedContainer?.id) return;
  setIsUpdating(true);

  try {
   const { data: updated } = await axios.patch<Container>(
      `/api/seed/containers/${selectedContainer.id}/patch`,
      editForm
    );

    setAllContainers(prev =>
      prev.map(c =>
        c.id === selectedContainer.id ? updated : c
      )
    );

    showMessage("success", "Container updated successfully!");
    handleCloseEditModal();
  } catch (err: any) {
    if (err.response?.data?.errors) {
      showMessage("error", err.response.data.errors.map((e: any) => e.message).join("; "));
    } else if (err.response?.data?.error) {
      showMessage("error", `Error: ${err.response.data.error}`);
    } else {
      showMessage("error", "Network error occurred");
    }
  } finally {
    setIsUpdating(false);
  }
};



    useEffect(() => {
      if (activeTab === "container-list") fetchContainers(currentPage);
    }, [activeTab, currentPage]);

    return (
      <div className="w-full max-w-[1600px] mx-auto min-h-screen text-white uppercase">

        {/* Header */}
        <header className="py-1 px-6 md:px-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-[#1A2A4A] p-3" style={cardGradientStyle}>
                <Database height={50} width={50} className="text-[#00FFFF]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
              SCMT Data Seeding
              <span className="block text-cyan-400 mt-2">Container Management</span>
            </h1>
            <p className="text-lg text-slate-100 mb-4 max-w-xl leading-relaxed mx-auto">
              Create and manage container types and individual containers for your maritime operations.
            </p>
          </div>
        </header>

        {/* Message Display */}
        {message && (
          <div className={`mx-6 md:mx-16 mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-900/30 border-green-400 text-green-400'
              : 'bg-red-900/30 border-red-400 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
      <div className="px-6 md:px-16 mb-8 ">
      <div className="grid grid-cols-4 gap-4 mb-8 ">
        {[
          { label: 'Container Types', value: 'container-types', icon: <Package className="w-5 h-5" /> },
          { label: 'Containers',      value: 'containers',       icon: <ContainerIcon className="w-5 h-5" /> },
          { label: 'Bulk Import',     value: 'bulk-import',      icon: <Upload className="w-5 h-5" /> },
          { label: 'Container List',  value: 'container-list',   icon: <List className="w-5 h-5" /> },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as any)}
            className={`px-1 py-2 uppercase text-md font-bold transition shadow border-2 border-black cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === tab.value
                ? 'bg-gray-300 text-black rounded-3xl shadow-[13px_13px_0px_rgba(0,0,0,1)]'
                : 'bg-[#2D4D8B] hover:bg-[#1A2F4E] hover:text-[#00FFFF] text-white rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)]'
            }`}
          >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  </div>

        {/* Container Types Tab */}
        {activeTab === 'container-types' && (
          <section className=" px-6 md:px-16">
            <div className=" rounded-3xl border-white border-2 shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 transition-shadow" style={cardGradientStyle}>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Package className="w-8 h-8 text-cyan-400" /> Create Container Type
              </h2>
              <form onSubmit={handleSubmitContainerType} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* ISO Code dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">ISO Code *</label>
                  <select
                    value={containerTypeForm.isoCode}
                    onChange={e => setContainerTypeForm(prev => ({ ...prev, isoCode: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  >
                    <option value="">SELECT CONTAINER TYPE</option>
                    {availableTypes.map(type => (
                      <option key={type.isoCode} value={type.isoCode}>
                        {type.isoCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name (locked) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Name *</label>
                  <input
                    type="text"
                    value={
                      STANDARD_CONTAINER_TYPES.find(t => t.isoCode === containerTypeForm.isoCode)?.name ||
                      containerTypeForm.name
                    }
                    readOnly
                    className="w-full px-4 py-3 bg-[#2D4D8B] mt-2 hover:text-[#00FFFF] border-black border-4 rounded-lg text-white placeholder-slate-300 focus:border-white focus:outline-none cursor-not-allowed shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                {/* Group (locked) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Group *</label>
                  <input
                    type="text"
                    value={
                        // only show the group when an ISO code is picked
                        containerTypeForm.isoCode
                          ? STANDARD_CONTAINER_TYPES
                              .find(t => t.isoCode === containerTypeForm.isoCode)
                              ?.group.replace('_', ' ')
                          : ''
                      }
                    readOnly
                    className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] rounded-lg text-white focus:border-white focus:outline-none cursor-not-allowed"
                  />
                </div>

                {/* Specs fields */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Length (mm) *</label>
                  <input
                    type="number"
                    value={containerTypeForm.lengthMm || ''}
                    onChange={e => setContainerTypeForm(prev => ({ ...prev, lengthMm: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="e.g., 6058"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Width (mm) *</label>
                  <input
                    type="number"
                    value={containerTypeForm.widthMm || ''}
                    onChange={e => setContainerTypeForm(prev => ({ ...prev, widthMm: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="e.g., 2438"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Height (mm) *</label>
                  <input
                    type="number"
                    value={containerTypeForm.heightMm || ''}
                    onChange={e => setContainerTypeForm(prev => ({ ...prev, heightMm: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="e.g., 2591"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Tare Weight (kg) *</label>
                  <input
                    type="number"
                    value={containerTypeForm.tareWeightKg || ''}
                    onChange={e => setContainerTypeForm(prev => ({ ...prev, tareWeightKg: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="e.g., 2200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Max Gross Weight (kg) *</label>
                  <input
                    type="number"
                    value={containerTypeForm.maxGrossWeightKg || ''}
                    onChange={e => setContainerTypeForm(prev => ({ ...prev, maxGrossWeightKg: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-[#11235d] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="e.g., 30480"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Max Stack Weight (kg) *</label>
                  <input
                    type="number"
                    value={containerTypeForm.maxStackWeightKg || ''}
                    onChange={e => setContainerTypeForm(prev => ({ ...prev, maxStackWeightKg: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="e.g., 192000"
                    required
                  />
                </div>

                <div className="space-y-2 col-span-full md:col-span-2 lg:col-span-1 lg:col-start-2">
                <label className="text-sm font-semibold text-white">TEU Factor *</label>
              <input
                  type="number"
                  step="0.01"
                  value={
                    // if ISO is picked, show the standard value; otherwise fallback to form state
                    STANDARD_CONTAINER_TYPES.find(t => t.isoCode === containerTypeForm.isoCode)
                      ?.teuFactor.toString() ||
                    containerTypeForm.teuFactor.toString()
                  }
                  onChange={e => setContainerTypeForm(prev => ({
                    ...prev,
                    teuFactor: parseFloat(e.target.value) || 0
                  }))}
                  readOnly={!!containerTypeForm.isoCode}
                  className={`
                    w-full px-4 py-3 bg-[#0A1A2F] mt-2 border-4 border-black
                    shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:text-[#00FFFF] rounded-lg text-white
                    placeholder-white/80 focus:border-white focus:outline-none
                    ${containerTypeForm.isoCode ? 'cursor-not-allowed' : ''}
                  `}
                  placeholder="e.g., 1.0"
                />
              </div>

                <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    {isLoading ? (
                      <>
                        <Settings className="w-5 h-5 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" /> Create Container Type
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Containers Tab */}
        {activeTab === 'containers' && (
        <section className="px-6 md:px-16">
          <div className="rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-2 border-white" style={cardGradientStyle}>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <ContainerIcon className="w-8 h-8 text-cyan-400" /> Create Container
            </h2>
            <form onSubmit={handleSubmitContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Container Number - Required */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Container Number *</label>
                <input
                  type="text"
                  value={containerForm.containerNo}
                  onChange={e => setContainerForm(prev => ({ ...prev, containerNo: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  placeholder="SCMT1234567"
                  required
                />
              </div>

              {/* Container Type - Required */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Container Type *</label>
                <select
                  value={containerForm.containerTypeIsoCode}
                  onChange={e => setContainerForm(prev => ({ ...prev, containerTypeIsoCode: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  required
                >
                  <option value="">Select Container Type</option>
                  {containerTypes.map(type => (
                    <option key={type.isoCode} value={type.isoCode}>
                      {type.isoCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* BIC Code - Required */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">BIC Code *</label>
                <input
                  type="text"
                  value={containerForm.bicCode}
                  onChange={e => setContainerForm(prev => ({ ...prev, bicCode: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#2D4D8B] hover:text-[#00FFFF] hover:bg-[#0A1A2F] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow border border-black border-4 rounded-lg text-white mt-3 focus:border-white focus:outline-none"
                  placeholder="SCMT"
                  required
                />
              </div>

              {/* Status - Required */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Status *</label>
                <select
                  value={containerForm.status}
                  onChange={e => setContainerForm(prev => ({ ...prev, status: e.target.value as ContainerStatus }))}
                  className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  required
                >
                  <option value="">Select Status</option>
                  {Object.values(ContainerStatus).map(st => (
                    <option key={st} value={st}>{st.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Ownership - Required */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Ownership *</label>
                <input
                  type="text"
                  value={containerForm.ownership}
                  onChange={e => setContainerForm(prev => ({ ...prev, ownership: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  placeholder="SCMT"
                  required
                />
              </div>

              {/* Current Depot */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Current Depot</label>
                <input
                  type="text"
                  value={containerForm.currentDepot}
                  onChange={e => setContainerForm(prev => ({ ...prev, currentDepot: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] hover:bg-[#1A2A4A] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  placeholder="Basra Port"
                />
              </div>

              {/* Manufacturer */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Manufacturer</label>
                <input
                  type="text"
                  value={containerForm.manufacturer}
                  onChange={e => setContainerForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  placeholder="CIMC"
                />
              </div>

              {/* Customs Approval */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Customs Approval</label>
                <input
                  type="text"
                  value={containerForm.customsApproval}
                  onChange={e => setContainerForm(prev => ({ ...prev, customsApproval: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  placeholder="Approved"
                />
              </div>

              {/* CSC Plate URL */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">CSC Plate URL</label>
                <input
                  type="url"
                  value={containerForm.cscPlateUrl}
                  onChange={e => setContainerForm(prev => ({ ...prev, cscPlateUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#11235d] hover:text-[#00FFFF] hover:bg-[#1a307a] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  placeholder="https://example.com/plate.jpg"
                />
              </div>

              {/* Certification Expiry */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Certification Expiry</label>
                <input
                  type="datetime-local"
                  value={containerForm.certificationExpiry}
                  onChange={e => setContainerForm(prev => ({ ...prev, certificationExpiry: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0A1A2F] hover:text-[#00FFFF] hover:bg-[#2D4D8B] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>

              {/* Last Used At */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Last Used At</label>
                <input
                  type="datetime-local"
                  value={containerForm.lastUsedAt}
                  onChange={e => setContainerForm(prev => ({ ...prev, lastUsedAt: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0A1A2F] hover:text-[#00FFFF] hover:bg-[#2D4D8B] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Description</label>
                <textarea
                  value={containerForm.description}
                  onChange={e => setContainerForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0A1A2F] hover:text-[#00FFFF] hover:bg-[#2D4D8B] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  rows={3}
                  placeholder="Container description..."
                />
              </div>

              {/* Food Grade - Redesigned as a toggle switch */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Food Grade Certification</label>
                <div className="flex items-center mt-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={containerForm.foodGrade}
                      onChange={e => setContainerForm(prev => ({ ...prev, foodGrade: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-[#1A2A4A] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-cyan-600 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-shadow"></div>
                    <span className="ml-3 text-sm font-medium text-white">
                      {containerForm.foodGrade ? 'Food Grade Certified' : 'Not Food Grade'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  {isLoading ? (
                    <>
                      <Settings className="w-5 h-5 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" /> Create Container
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

        {/* Bulk Import Tab */}
        {activeTab === 'bulk-import' && (
  <section className="px-6 md:px-16">
    <div className=" rounded-3xl shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 border-2 border-white" style={cardGradientStyle}>
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Upload className="w-8 h-8 text-cyan-400" /> Bulk Import Containers
      </h2>

      {/* Mode Selection Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setBulkImportMode('file')}
          className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all ${
            bulkImportMode === 'file' ? 'bg-[#600f9e] text-white' : 'bg-[#1A2A4A] text-white hover:bg-[#00FFFF] hover:text-black'
          }`}
          style={bulkImportMode === 'file' ? cardGradientStyle : {}}
        >
          <Upload className="w-5 h-5" /> Upload JSON File
        </button>
        
        <button
          onClick={() => setBulkImportMode('textarea')}
          className={`px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all ${
            bulkImportMode === 'textarea' ? 'bg-[#600f9e] text-white' : 'bg-[#1A2A4A] text-white hover:bg-[#00FFFF] hover:text-black'
          }`}
          style={bulkImportMode === 'textarea' ? cardGradientStyle : {}}
        >
          <FileText className="w-5 h-5" /> Paste JSON Data
        </button>
      </div>

      {/* Download Sample Button */}
      <div className="mb-6">
        <button
          onClick={downloadSampleJSON}
          className="bg-[#2a72dc] hover:bg-[#00FFFF] hover:text-black px-6 py-3 rounded-lg font-semibold uppercase flex items-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Download className="w-5 h-5" /> Download Sample JSON
        </button>
        <p className="text-md text-slate-200 mt-5">
          Download a sample JSON file to see the expected format and structure.
        </p>
      </div>

      {/* Import Form */}
      <form onSubmit={handleBulkImport} className="space-y-6">
        {/* File Upload Mode */}
        {bulkImportMode === 'file' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">Select JSON File *</label>
            <div className=" border-2 border-dashed border-white rounded-lg p-8 text-center hover:border-cyan-400 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                required
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <Upload className="w-16 h-16 text-slate-400" />
                <div>
                  <p className="text-lg font-semibold text-white">Click to upload JSON file</p>
                  <p className="text-sm text-slate-400">or drag and drop</p>
                </div>
              </label>
            </div>
            <p className="text-xs font-bold text-white">
              Upload a JSON file containing an array of container objects.
            </p>
          </div>
        )}

        {/* Textarea Mode */}
        {bulkImportMode === 'textarea' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">JSON Data *</label>
            <textarea
              value={bulkData}
              onChange={e => setBulkData(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A1A2F] border border-white/80 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none font-mono text-sm"
              rows={12}
              placeholder='[
  {
    "containerNo": "SCMT1234567",
    "containerTypeIsoCode": "40HC",
    "bicCode": "SCMT",
    "ownership": "SCMT",
    "manufacturer": "Manufacturer A",
    "status": "AVAILABLE",
    "currentDepot": "Baghdad Port",
    "foodGrade": false,
    "description": "Sample container 1"
  }
]'
              required
            />
            <p className="text-xs font-bold text-white">
              Paste your JSON array here. Industry standard format for bulk operations.
            </p>
            

             <div className="bg-[#1A2A4A] rounded-lg p-4 border border-slate-600" style={cardGradientStyle}>
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">JSON Format:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-md font-bold text-white">
                  <div>• containerNo (required)</div>
                  <div>• containerTypeIsoCode (required)</div>
                  <div>• bicCode (optional)</div>
                  <div>• ownership (optional)</div>
                  <div>• companyOrigin (optional)</div>
                  <div>• manufacturer (optional)</div>
                  <div>• status (optional)</div>
                  <div>• currentDepot (optional)</div>
                  <div>• foodGrade (boolean)</div>
                  <div>• description (optional)</div>
                </div>
                <p className="text-sm text-slate-200 mt-3">
                  Industry standard: JSON array format. Each object represents one container.
                </p>
              </div>

          </div>

          
        )}


        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-semibold uppercase flex items-center gap-3 shadow-[10px_10px_0px_rgba(0,0,0,1)] hover:shadow-[15px_15px_0px_rgba(0,0,0,1)] transition-shadow"
          >
            {isLoading ? (
              <>
                <Settings className="w-5 h-5 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" /> Import Containers
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </section>
)}

        {/* Container List Tab */}
        {activeTab === 'container-list' && (
          <section className="px-6 md:px-16">
            <div className=" rounded-3xl shadow-[0px_30px_0px_rgba(0,0,0,1)] p-8 border-white border-2" style={cardGradientStyle}>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <List className="w-8 h-8 text-cyan-400" /> Container List
              </h2>

              {/* Filters */}
              <div className="bg-[#2e4972] rounded-lg border-10 border-black p-6 mb-8 " style={cardGradientStyle}>
                <h3 className="text-lg font-semibold text-[#00FFFF] mb-4 ">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Container Number</label>
                    <input
                      type="text"
                      value={filters.containerNo}
                      onChange={e => handleFilterChange('containerNo', e.target.value)}
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                      placeholder="Search by container number..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Container Type</label>
                    <input
                      type="text"
                      value={filters.containerTypeIsoCode}
                      onChange={e => handleFilterChange('containerTypeIsoCode', e.target.value)}
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                      placeholder="Search by type..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Status</label>
                    <select
                      value={filters.status}
                      onChange={e => handleFilterChange('status', e.target.value)}
                      className="w-full px-4 py-3 bg-[#2D4D8B] hover:bg-[#0A1A2F] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    >
                      <option value="">All Statuses</option>
                      {Object.values(ContainerStatus).map(st => (
                        <option key={st} value={st}>{st.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Current Depot</label>
                    <input
                      type="text"
                      value={filters.currentDepot}
                      onChange={e => handleFilterChange('currentDepot', e.target.value)}
                      className="w-full px-4 py-3 bg-[#11235d] hover:bg-[#1a307a] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                      placeholder="Search by depot..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Ownership</label>
                    <input
                      type="text"
                      value={filters.ownership}
                      onChange={e => handleFilterChange('ownership', e.target.value)}
                      className="w-full px-4 py-3 bg-[#11235d] hover:bg-[#1a307a] hover:text-[#00FFFF]  mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                      placeholder="Search by owner..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={applyFilters}
                    className="bg-[#600f9e] hover:bg-[#491174] px-6 py-2 rounded-lg font-semibold uppercase text-sm shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="bg-[#2a72dc] hover:bg-[#1e5bb8] px-6 py-2 rounded-lg font-semibold uppercase text-sm shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {isLoadingList ? (
                <div className="flex items-center justify-center py-12">
                  <Settings className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="ml-3 text-lg">Loading containers...</span>
                </div>
              ) : allContainers.length === 0 ? (
                <div className="text-center py-12">
                  <ContainerIcon className="w-16 h-16 text-white mx-auto mb-4" />
                  <p className="text-xl font-semibold text-white">No containers found</p>
                  <p className="text-md font-semibold text-white mt-2">Create some containers first to see them listed here</p>
                </div>
              ) : (
                <>
                  {/* Container Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {allContainers.map((container, index) => (
                      <div
                        key={container.id || index}
                        onClick={() => handleRowClick(container)}
                        className="bg-[#1A2A4A] rounded-lg border border-slate-600 p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer hover:border-cyan-400 group"
                        style={cardGradientStyle}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <ContainerIcon className="w-6 h-6 text-cyan-400" />
                          <h3 className="text-lg font-bold text-white truncate">{container.containerNo}</h3>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-300">Type:</span>
                            <span className="text-white font-semibold">{container.containerTypeIsoCode}</span>
                          </div>

                          {container.status && (
                            <div className="flex justify-between">
                              <span className="text-slate-300">Status:</span>
                              <span className={`font-semibold px-2 py-1 rounded text-xs ${
                                container.status === 'AVAILABLE' ? 'bg-green-700 text-green-200' :
                                container.status === 'IN_TRANSIT' ? 'bg-blue-700 text-blue-200' :
                                container.status === 'MAINTENANCE' ? 'bg-yellow-700 text-yellow-200' :
                                container.status === 'DAMAGED' ? 'bg-red-700 text-red-200' :
                                'bg-gray-700 text-gray-200'
                              }`}>
                                {container.status.replace('_', ' ')}
                              </span>
                            </div>
                          )}

                          {container.currentDepot && (
                            <div className="flex justify-between">
                              <span className="text-slate-300">Depot:</span>
                              <span className="text-white">{container.currentDepot}</span>
                            </div>
                          )}

                          {container.ownership && (
                            <div className="flex justify-between">
                              <span className="text-slate-300">Owner:</span>
                              <span className="text-white">{container.ownership}</span>
                            </div>
                          )}

                          {container.foodGrade && (
                            <div className="flex justify-between">
                              <span className="text-slate-300">Food Grade:</span>
                              <span className="text-green-400 font-semibold">✓ Yes</span>
                            </div>
                          )}

                          {container.description && (
                            <div className="mt-3 pt-3 border-t border-slate-600">
                              <p className="text-slate-300 text-xs">{container.description}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#00FFFF] opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 text-[#00FFFF] text-xs font-semibold">
                            <Edit3 className="w-3 h-3" /> Click to edit
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-300">
                        Page {currentPage} of {totalPages} (showing {pageSize} per page)
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage <= 1}
                          className="bg-[#2a72dc] hover:bg-[#1e5bb8] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold uppercase text-sm flex items-center gap-2 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage >= totalPages}
                          className="bg-[#2a72dc] hover:bg-[#1e5bb8] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold uppercase text-sm flex items-center gap-2 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Stats Section */}
       <section className="py-16 px-6 md:px-16">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
    <div className="bg-[#1A2A4A] rounded-2xl border border-slate-700 shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center px-8 py-6 flex flex-col items-center" style={cardGradientStyle}>
      <Package className="w-8 h-8 text-cyan-400 mb-2" />
      <div className="text-3xl font-bold text-cyan-400">{typeCount}</div>
      <div className="text-slate-100 text-sm mt-1">Container Types</div>
    </div>
    <div className="bg-[#1A2A4A] rounded-2xl border border-slate-700 shadow-[10px_10px_0px_rgba(0,0,0,1)] text-center px-8 py-6 flex flex-col items-center" style={cardGradientStyle}>
      <ContainerIcon className="w-8 h-8 text-cyan-400 mb-2" />
      <div className="text-3xl font-bold text-cyan-400">{containerCount}</div>
      <div className="text-slate-100 text-sm mt-1">Containers</div>
    </div>
  </div>
</section>

        {/* Edit Container Modal */}
        {isEditModalOpen && selectedContainer && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#121c2d] rounded-3xl border-2 border-white shadow-[30px_30px_0px_rgba(0,0,0,1)] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={cardGradientStyle}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold flex items-center gap-3">
                  <Edit3 className="w-8 h-8 text-cyan-400" /> Edit Container: {selectedContainer.containerNo}
                </h3>
                <button onClick={handleCloseEditModal} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Container Number *</label>
                  <input
                    type="text"
                    value={editForm.containerNo || ""}
                    onChange={e => handleEditFormChange("containerNo", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="SCMT1234567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Container Type ISO Code *</label>
                  <input
                    type="text"
                    value={editForm.containerTypeIsoCode || ""}
                    onChange={e => handleEditFormChange("containerTypeIsoCode", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="40HC"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">BIC Code *</label>
                  <input
                    type="text"
                    value={editForm.bicCode || ""}
                    onChange={e => handleEditFormChange("bicCode", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="SCMT"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Status *</label>
                  <select
                    value={editForm.status || ""}
                    onChange={e => handleEditFormChange("status", e.target.value as ContainerStatus)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  >
                    {Object.values(ContainerStatus).map(st => (
                      <option key={st} value={st}>{st.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Ownership *</label>
                  <input
                    type="text"
                    value={editForm.ownership || ""}
                    onChange={e => handleEditFormChange("ownership", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="SCMT"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Current Depot</label>
                  <input
                    type="text"
                    value={editForm.currentDepot || ""}
                    onChange={e => handleEditFormChange("currentDepot", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="Basra Port"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Company Origin</label>
                  <input
                    type="text"
                    value={editForm.companyOrigin || ""}
                    onChange={e => handleEditFormChange("companyOrigin", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="Iraq"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Manufacturer</label>
                  <input
                    type="text"
                    value={editForm.manufacturer || ""}
                    onChange={e => handleEditFormChange("manufacturer", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="CIMC"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Customs Approval</label>
                  <input
                    type="text"
                    value={editForm.customsApproval || ""}
                    onChange={e => handleEditFormChange("customsApproval", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="Approved"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">CSC Plate URL</label>
                  <input
                    type="url"
                    value={editForm.cscPlateUrl || ""}
                    onChange={e => handleEditFormChange("cscPlateUrl", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    placeholder="https://example.com/plate.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Certification Expiry</label>
                  <input
                    type="datetime-local"
                    value={editForm.certificationExpiry || ""}
                    onChange={e => handleEditFormChange("certificationExpiry", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Last Used At</label>
                  <input
                    type="datetime-local"
                    value={editForm.lastUsedAt || ""}
                    onChange={e => handleEditFormChange("lastUsedAt", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1d4595] hover:bg-[#1A2A4A] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-2">
                  <label className="text-sm font-semibold text-white">Description</label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={e => handleEditFormChange("description", e.target.value)}
                    className="w-full px-4 py-3 bg-[#1A2A4A] hover:bg-[#1A2A4A] border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-nonew-full px-4 py-3 bg-[#1d4595] hover:text-[#00FFFF] mt-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[10px_8px_0px_rgba(0,0,0,1)] transition-shadow rounded-lg text-white placeholder-white/80 focus:border-white focus:outline-none"
                    rows={3}
                    placeholder="Container description..."
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editFoodGrade"
                    checked={editForm.foodGrade || false}
                    onChange={e => handleEditFormChange("foodGrade", e.target.checked)}
                    className="w-5 h-5 bg-[#1A2A4A] border border-slate-600 rounded focus:border-cyan-400"
                  />
                  <label htmlFor="editFoodGrade" className="text-sm font-semibold text-slate-300">Food Grade</label>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-600">
                <button
                  onClick={handleCloseEditModal}
                  className="bg-[#1A2A4A] hover:bg-[#2A3A5A] px-6 py-3 rounded-lg font-semibold uppercase text-slate-300 hover:text-white transition-colors shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  Cancel
                </button>
                {hasChanges && (
                  <button
                    onClick={handleApplyChanges}
                    disabled={isUpdating}
                    className="bg-[#600f9e] hover:bg-[#491174] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold uppercase text-white flex items-center gap-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    {isUpdating ? (
                      <>
                        <Settings className="w-4 h-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Apply Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
