// Ported from Nixy Live v4 bait.js
export const SHEET = {
 "COLS": [
  "ID",
  "Section",
  "Requirement",
  "Parameter",
  "Unit",
  "Option A",
  "Option B",
  "Option C",
  "Standard / ref",
  "Selected",
  "Cost band",
  "Owner",
  "Status",
  "Comments"
 ],
 "SECTIONS": {
  "Room & use": [
   [
    "Primary use case",
    "Use type",
    "-",
    "Hybrid meetings",
    "Client presentations",
    "Training",
    "Internal",
    ""
   ],
   [
    "Secondary use",
    "Use type",
    "-",
    "Workshops",
    "Board",
    "Interviews",
    "Internal",
    ""
   ],
   [
    "Room dimensions",
    "L × W × H",
    "m",
    "6.0 × 4.2 × 2.7",
    "",
    "",
    "Survey",
    ""
   ],
   [
    "Furniture layout",
    "Layout",
    "-",
    "Boardroom",
    "Boat-shaped",
    "U-shape",
    "Internal",
    ""
   ],
   [
    "Front of room wall",
    "Wall type",
    "-",
    "Plasterboard",
    "Glazed",
    "Block",
    "Survey",
    ""
   ],
   [
    "Window orientation",
    "Bearing",
    "°",
    "W",
    "SW",
    "",
    "Survey",
    ""
   ],
   [
    "Room booking",
    "System",
    "-",
    "Outlook",
    "Panel",
    "None",
    "IT policy",
    ""
   ]
  ],
  "Occupancy": [
   [
    "Typical occupancy",
    "Persons",
    "n",
    "6",
    "10",
    "12",
    "Brief",
    ""
   ],
   [
    "Max occupancy",
    "Persons",
    "n",
    "12",
    "14",
    "",
    "Fire cert.",
    ""
   ],
   [
    "Farthest viewer distance",
    "Distance",
    "m",
    "5.4",
    "",
    "",
    "AVIXA DISCAS",
    ""
   ],
   [
    "Seating rows",
    "Rows",
    "n",
    "1",
    "2",
    "",
    "Brief",
    ""
   ],
   [
    "Accessibility",
    "Requirement",
    "-",
    "Hearing loop",
    "Wheelchair space",
    "",
    "Equality Act",
    ""
   ]
  ],
  "Platform": [
   [
    "UC platform",
    "Platform",
    "-",
    "Microsoft Teams",
    "Zoom",
    "Google Meet",
    "IT policy",
    ""
   ],
   [
    "Room system certification",
    "Certified",
    "Y/N",
    "Y",
    "N",
    "",
    "Vendor",
    ""
   ],
   [
    "BYOD mode",
    "USB-C",
    "Y/N",
    "Y",
    "N",
    "",
    "IT policy",
    ""
   ],
   [
    "Licence type",
    "Licence",
    "-",
    "Pro",
    "Basic",
    "",
    "Vendor",
    ""
   ],
   [
    "Content sharing",
    "Method",
    "-",
    "Wired",
    "Wireless",
    "Both",
    "IT policy",
    ""
   ]
  ],
  "Displays": [
   [
    "Content category",
    "DISCAS type",
    "-",
    "BDM",
    "ADM",
    "Inspection",
    "AVIXA V202.01",
    ""
   ],
   [
    "Minimum image height",
    "Height",
    "m",
    "0.90",
    "1.35",
    "",
    "AVIXA V202.01",
    ""
   ],
   [
    "Display size",
    "Diagonal",
    "in",
    "75",
    "86",
    "98",
    "Calc.",
    ""
   ],
   [
    "Quantity",
    "Displays",
    "n",
    "1",
    "2",
    "",
    "Design",
    ""
   ],
   [
    "Resolution",
    "Pixels",
    "-",
    "3840×2160",
    "1920×1080",
    "",
    "Design",
    ""
   ],
   [
    "Duty cycle",
    "Hours/day",
    "h",
    "16/7",
    "18/7",
    "24/7",
    "Vendor",
    ""
   ],
   [
    "Mounting height (bottom)",
    "AFF",
    "mm",
    "1100",
    "1150",
    "",
    "Design",
    ""
   ],
   [
    "Mount type",
    "Mount",
    "-",
    "Fixed",
    "Tilt",
    "Motorised",
    "Structural",
    ""
   ],
   [
    "Brightness",
    "Luminance",
    "cd/m²",
    "350",
    "500",
    "",
    "Design",
    ""
   ],
   [
    "EDID management",
    "Method",
    "-",
    "Fixed",
    "Pass-through",
    "",
    "Design",
    ""
   ]
  ],
  "Camera": [
   [
    "Camera type",
    "Type",
    "-",
    "Video bar",
    "PTZ",
    "Multi-cam",
    "Design",
    ""
   ],
   [
    "Horizontal FOV",
    "Angle",
    "°",
    "90",
    "112",
    "120",
    "Calc.",
    ""
   ],
   [
    "Lens height",
    "AFF",
    "mm",
    "1080",
    "1200",
    "",
    "Design",
    ""
   ],
   [
    "Framing",
    "Mode",
    "-",
    "Auto",
    "Speaker",
    "Group",
    "Vendor",
    ""
   ],
   [
    "Seats in frame",
    "Seats",
    "n",
    "10",
    "12",
    "",
    "Calc.",
    ""
   ],
   [
    "Privacy shutter",
    "Shutter",
    "Y/N",
    "Y",
    "N",
    "",
    "IT policy",
    ""
   ]
  ],
  "Audio": [
   [
    "Microphone type",
    "Type",
    "-",
    "Ceiling array",
    "Table",
    "Bar",
    "Design",
    ""
   ],
   [
    "Mic coverage zones",
    "Zones",
    "n",
    "8",
    "10",
    "12",
    "Calc.",
    ""
   ],
   [
    "Pickup distance",
    "Distance",
    "m",
    "3.0",
    "4.0",
    "",
    "Vendor",
    ""
   ],
   [
    "AEC",
    "Processing",
    "-",
    "Built-in",
    "DSP",
    "",
    "Design",
    ""
   ],
   [
    "Speaker type",
    "Type",
    "-",
    "Bar",
    "Ceiling",
    "Soundbar",
    "Design",
    ""
   ],
   [
    "Speech level at seat",
    "SPL",
    "dBA",
    "65",
    "70",
    "",
    "Design",
    ""
   ],
   [
    "Hearing loop",
    "Loop",
    "Y/N",
    "Y",
    "N",
    "",
    "BS EN 60118-4",
    ""
   ]
  ],
  "Acoustics": [
   [
    "Reverberation time",
    "RT60 (500 Hz–1 kHz)",
    "s",
    "0.4",
    "0.6",
    "0.8",
    "BB93 / vendor",
    ""
   ],
   [
    "Measured RT60",
    "RT60",
    "s",
    "1.1",
    "",
    "",
    "Survey",
    ""
   ],
   [
    "Background noise",
    "Level",
    "dBA",
    "35",
    "40",
    "44",
    "NR/NC",
    ""
   ],
   [
    "Absorber rating",
    "NRC",
    "-",
    "0.8",
    "0.9",
    "1.0",
    "ISO 354",
    ""
   ],
   [
    "Treatment area",
    "Area",
    "m²",
    "10",
    "14",
    "18",
    "Calc.",
    ""
   ],
   [
    "Floor finish",
    "Finish",
    "-",
    "Carpet tile",
    "Vinyl",
    "Existing",
    "Design",
    ""
   ],
   [
    "Glazing treatment",
    "Treatment",
    "-",
    "Film",
    "Panels",
    "None",
    "Design",
    ""
   ],
   [
    "HVAC diffuser noise",
    "Level",
    "NR",
    "25",
    "30",
    "35",
    "CIBSE",
    ""
   ]
  ],
  "Lighting": [
   [
    "Vertical illuminance at faces",
    "Lux",
    "lx",
    "300",
    "400",
    "500",
    "EN 12464-1",
    ""
   ],
   [
    "Colour temperature",
    "CCT",
    "K",
    "3500",
    "4000",
    "5000",
    "Design",
    ""
   ],
   [
    "Glare rating",
    "UGR",
    "-",
    "<19",
    "<22",
    "",
    "EN 12464-1",
    ""
   ],
   [
    "CRI",
    "Ra",
    "-",
    "80",
    "90",
    "",
    "Design",
    ""
   ],
   [
    "Dimming",
    "Protocol",
    "-",
    "DALI",
    "0–10 V",
    "None",
    "M&E",
    ""
   ],
   [
    "Blinds",
    "Type",
    "-",
    "Solar roller",
    "Blackout",
    "None",
    "Design",
    ""
   ],
   [
    "Scene control",
    "Scenes",
    "n",
    "2",
    "4",
    "",
    "Design",
    ""
   ]
  ],
  "Cabling": [
   [
    "Data cable category",
    "Category",
    "-",
    "Cat6A U/FTP",
    "Cat6 U/UTP",
    "",
    "TIA-568 / ISO 11801",
    ""
   ],
   [
    "Sheath",
    "Type",
    "-",
    "LSZH",
    "PVC",
    "",
    "CPR / BS 7671",
    ""
   ],
   [
    "CPR Euroclass",
    "Class",
    "-",
    "Cca",
    "Dca",
    "B2ca",
    "Fire strategy",
    ""
   ],
   [
    "Permanent link length",
    "Length",
    "m",
    "38",
    "",
    "",
    "≤ 90 m",
    ""
   ],
   [
    "Outlets required",
    "Outlets",
    "n",
    "8",
    "10",
    "",
    "Design",
    ""
   ],
   [
    "Containment",
    "Type",
    "-",
    "Basket",
    "Trunking",
    "Conduit",
    "BS EN 61537",
    ""
   ],
   [
    "Power/data segregation",
    "Separation",
    "mm",
    "50",
    "200",
    "",
    "BS EN 50174-2",
    ""
   ],
   [
    "Labelling scheme",
    "Scheme",
    "-",
    "TIA-606",
    "Client",
    "",
    "TIA-606-C",
    ""
   ],
   [
    "Floor box",
    "Modules",
    "n",
    "4",
    "6",
    "8",
    "Design",
    ""
   ],
   [
    "HDMI run length",
    "Length",
    "m",
    "8",
    "10",
    "15",
    "Calc.",
    ""
   ],
   [
    "USB-C extension",
    "Type",
    "-",
    "Active",
    "HDBaseT",
    "",
    "Design",
    ""
   ]
  ],
  "Network": [
   [
    "VLAN",
    "VLAN ID",
    "-",
    "120",
    "130",
    "",
    "IT policy",
    ""
   ],
   [
    "QoS marking",
    "DSCP",
    "-",
    "EF (46)",
    "AF41",
    "",
    "IT policy",
    ""
   ],
   [
    "PoE standard",
    "IEEE",
    "-",
    "802.3at",
    "802.3bt",
    "",
    "IEEE",
    ""
   ],
   [
    "PoE budget",
    "Power",
    "W",
    "120",
    "180",
    "240",
    "Calc.",
    ""
   ],
   [
    "Switch ports",
    "Ports",
    "n",
    "8",
    "10",
    "12",
    "Design",
    ""
   ],
   [
    "Bandwidth per room",
    "Rate",
    "Mbps",
    "10",
    "20",
    "",
    "Vendor",
    ""
   ],
   [
    "Firewall rules",
    "Ruleset",
    "-",
    "Vendor list",
    "Custom",
    "",
    "IT policy",
    ""
   ],
   [
    "Device management",
    "Portal",
    "-",
    "Vendor",
    "MSP",
    "None",
    "IT policy",
    ""
   ]
  ],
  "Power": [
   [
    "Front-of-room supply",
    "Circuit",
    "-",
    "2 × double",
    "4 × double",
    "",
    "BS 7671",
    ""
   ],
   [
    "Table power",
    "Sockets",
    "n",
    "4",
    "6",
    "",
    "Design",
    ""
   ],
   [
    "UPS",
    "UPS",
    "Y/N",
    "Y",
    "N",
    "",
    "IT policy",
    ""
   ],
   [
    "Isolation",
    "Method",
    "-",
    "Fused spur",
    "Plug",
    "",
    "BS 7671",
    ""
   ]
  ],
  "Building": [
   [
    "Ceiling void depth",
    "Depth",
    "mm",
    "450",
    "",
    "",
    "Survey",
    ""
   ],
   [
    "Raised floor",
    "Floor",
    "Y/N",
    "N",
    "Y",
    "",
    "Survey",
    ""
   ],
   [
    "Listed status",
    "Grade",
    "-",
    "None",
    "II",
    "",
    "Landlord",
    ""
   ],
   [
    "Landlord consent",
    "Consent",
    "Y/N",
    "TBC",
    "",
    "",
    "Lease",
    ""
   ],
   [
    "Asbestos register",
    "Checked",
    "Y/N",
    "TBC",
    "",
    "",
    "CDM",
    ""
   ],
   [
    "Working hours",
    "Window",
    "-",
    "Evenings",
    "Weekends",
    "Closure",
    "Client",
    ""
   ]
  ],
  "Programme": [
   [
    "Rooms in scope",
    "Rooms",
    "n",
    "1",
    "4",
    "12",
    "Brief",
    ""
   ],
   [
    "Target completion",
    "Date",
    "-",
    "",
    "",
    "",
    "Client",
    ""
   ],
   [
    "Survey type",
    "Type",
    "-",
    "Physical",
    "Virtual",
    "",
    "Brief",
    ""
   ],
   [
    "Design pack issue",
    "Date",
    "-",
    "",
    "",
    "",
    "Programme",
    ""
   ],
   [
    "Client review",
    "Days",
    "d",
    "5",
    "10",
    "",
    "Programme",
    ""
   ],
   [
    "Install duration",
    "Days",
    "d",
    "2",
    "3",
    "5",
    "Programme",
    ""
   ],
   [
    "Commissioning",
    "Days",
    "d",
    "1",
    "2",
    "",
    "Programme",
    ""
   ],
   [
    "Training",
    "Sessions",
    "n",
    "1",
    "2",
    "",
    "Programme",
    ""
   ]
  ],
  "Sign-off": [
   [
    "Client approver",
    "Name",
    "-",
    "",
    "",
    "",
    "Client",
    ""
   ],
   [
    "IT approver",
    "Name",
    "-",
    "",
    "",
    "",
    "Client",
    ""
   ],
   [
    "Budget approval",
    "Status",
    "-",
    "TBC",
    "",
    "",
    "Finance",
    ""
   ],
   [
    "Design freeze",
    "Date",
    "-",
    "",
    "",
    "",
    "Programme",
    ""
   ],
   [
    "Handover pack",
    "Format",
    "-",
    "PDF",
    "Portal",
    "",
    "Contract",
    ""
   ]
  ]
 },
 "STATUS": [
  "TBC",
  "TBC",
  "TBC",
  "Awaiting info",
  "TBC",
  "Query",
  "TBC",
  "Agreed"
 ],
 "COMMENTS": [
  "",
  "",
  "Confirm w/ IT",
  "See email 14/08",
  "",
  "TBC after survey",
  "",
  "Check with landlord",
  "Per rev 12?",
  "",
  "Awaiting quote",
  "#REF!",
  "Carry fwd from v11",
  "",
  "Tom to advise",
  "Needs board approval",
  ""
 ],
 "OWNERS": [
  "",
  "YA",
  "TR",
  "AK",
  "",
  "IT",
  "FM",
  ""
 ]
};
