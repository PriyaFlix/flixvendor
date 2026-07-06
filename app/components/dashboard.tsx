"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/src/lib/supabase";

const tabs = [
  { id: "overview", label: "L1 Overview" },
  { id: "agent", label: "L2 Agent Wise" },
  { id: "aht", label: "L3 AHT" },
  { id: "csat", label: "L4 CSAT" },
  { id: "qa", label: "L5 QA" },
] as const;

const csatTabs = [
  { id: "dsat", label: "DSAT share" },
  { id: "training", label: "Training priority" },
  { id: "breakdown", label: "Category breakdown" },
  { id: "root", label: "DSAT root cause" },
] as const;

const qaVendorTabs = [
  { id: "vendor1", label: "Vendor 1" },
  { id: "vendor2", label: "Vendor 2" },
  { id: "vendor3", label: "Vendor 3" },
  { id: "vendor6", label: "Vendor 6" },
  { id: "overall", label: "Overall" },
] as const;

const ahtChannels = [
  { id: "email", label: "Email" },
  { id: "chat", label: "Chat" },
  { id: "call", label: "Call" },
] as const;

const agentWiseScreens = [
  { id: 1, label: "AHT" },
  { id: 2, label: "Agent performance" },
];

// agentWiseScreens removed — vendor tabs are derived dynamically

type MappingRow = {
  agent_name?: string;
  vendor?: string;
  language?: string;
  agent_type?: string;
  supervisor?: string;
  wave?: string;
  category?: string;
  queue?: string;
  root_cause?: string;
  issue_focus?: string;
  flag?: string;
  case_status?: string;
};

type DataRow = {
  agent_name?: string;
  agent?: string;
  channel?: string;
  type?: string;
  week?: string;
  team_name?: string;
  week_number?: number | string;
  week_no?: number | string;
  weekNum?: number | string;
  weekNumber?: number | string;
  wk?: number | string;
  w1?: number | string;
  w2?: number | string;
  w3?: number | string;
  w4?: number | string;
  aht_w1?: number | string;
  aht_w2?: number | string;
  aht_w3?: number | string;
  aht_w4?: number | string;
  aht?: number | string;
  avg_aht?: number | string;
  vendor?: string;
  agent_team?: string;
  handle_time?: number | string;
  avg_handling_time?: number | string;
  wrap_up_time?: number | string;
  hold_time?: number | string;
  evaluation?: number | string;
  partner?: string;
  dsat_reason?: string;
  csat_w2?: number | string;
  csat_w3?: number | string;
  csat_w4?: number | string;
  qa_w1?: number | string;
  qa_w2?: number | string;
  qa_w3?: number | string;
  qa_w4?: number | string;
  volume?: number | string;
  talk_time?: number | string;
  wrap_time?: number | string;
  agent_type?: string;
  supervisor?: string;
  category?: string;
  queue?: string;
  issue_focus?: string;
  wave?: string;
  dsat_rate?: number | string;
  avg_csat?: number | string;
  severity?: string;
  score?: number | string;
  vendor_score?: number | string;
  survey_rating?: number | string;
  comment?: string;
  verbatim?: string;
  root_cause?: string;
  reviewer?: string;
  flag?: string;
  case_status?: string;
  mapping?: MappingRow;
};

type WeeklyPivotRow = {
  name: string;
  values: Array<number | undefined>;
  w1?: number;
  w2?: number;
  w3?: number;
  w4?: number;
  agent_type?: string;
  supervisor?: string;
  vendor?: string;
  csat_w1?: number;
  csat_w2?: number;
  csat_w3?: number;
  csat_w4?: number;
  qa_w1?: number;
  qa_w2?: number;
  qa_w3?: number;
  qa_w4?: number;
};

type OverviewData = {
  email: DataRow[];
  chat: DataRow[];
  call: DataRow[];
};

type QaAgentRow = WeeklyPivotRow;

type QaSummary = {
  avgVendor: number;
  avgFlix: number;
  discrepancyRate: number;
  ztCount: number;
  below85: number;
  trend: { week: string; vendor: number; flix: number }[];
  matchedCases: DataRow[];
  agentRows: WeeklyPivotRow[];
  comments: { theme: string; count: number }[];
  inps: { label: string; value: number }[];
};

const GOOD = "#34D399";
const BAD = "#F87171";
const NEUTRAL = "#A3A3A3";
const AHT_TARGET_SECONDS = 600;

function getChip(value: number | string | undefined, positive?: boolean) {
  if (value == null || value === "All") return "bg-slate-200 text-slate-900";
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "bg-slate-200 text-slate-900";
  return numeric >= 85 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";
}

function formatNumber(value: number | string | undefined) {
  if (value == null || value === "") return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1) : "—";
}

function formatAhtSeconds(value: number | string | undefined) {
  if (value == null || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${Math.round(numeric)}`;
}

function getAhtChipClass(value: number | string | undefined) {
  if (value == null || value === "") return "bg-slate-200 text-slate-900";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "bg-slate-200 text-slate-900";
  return numeric < AHT_TARGET_SECONDS ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";
}

function getAgentAhtChipClass(value: number | string | undefined) {
  if (value == null || value === "") return "bg-slate-200 text-slate-900";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "bg-slate-200 text-slate-900";
  return numeric < 400 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";
}

function getPercentChipClass(value: number | string | undefined) {
  if (value == null || value === "") return "bg-slate-200 text-slate-900";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "bg-slate-200 text-slate-900";
  return numeric >= 85 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";
}

function getCsatChipClass(value: number | string | undefined) {
  // CSAT is on 1-5 scale; consider >=4.25 (85%) as good
  if (value == null || value === "") return "bg-slate-200 text-slate-900";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "bg-slate-200 text-slate-900";
  return numeric >= 3.5 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";
}

function renderValue(value: number | string | undefined) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "—";
  return formatNumber(value);
}

function pivotWeeklyRowsWithWeeks(
  rows: DataRow[],
  keyFn: (row: DataRow) => string,
  valueFn: (row: DataRow) => number,
  weeks: string[],
) {
  const pivotMap = new Map<string, { sums: number[]; counts: number[]; key: string }>();

  rows.forEach((row) => {
    const key = keyFn(row);
    const week = getRowWeek(row);
    const index = weeks.indexOf(week);
    if (!key || index < 0) return;

    const pivot = pivotMap.get(key) ?? { key, sums: Array(weeks.length).fill(0), counts: Array(weeks.length).fill(0) };
    pivot.sums[index] += valueFn(row);
    pivot.counts[index] += 1;
    pivotMap.set(key, pivot);
  });

  return {
    weeks,
    rows: Array.from(pivotMap.values()).map((item) => {
      const values = item.sums.map((sum, idx) => (item.counts[idx] ? sum / item.counts[idx] : undefined));
      return {
        name: item.key,
        values,
      };
    }),
  };
}

function mergeWithMapping(rows: DataRow[], mapping: MappingRow[]) {
  const map = mapping.reduce((acc: Record<string, MappingRow>, row: MappingRow) => {
    if (row.agent_name) {
      acc[row.agent_name] = row;
    }
    return acc;
  }, {} as Record<string, MappingRow>);

  return rows.map((row) => ({ ...row, mapping: row.agent_name ? map[row.agent_name] ?? {} : {} }));
}

function getRowWeek(row: DataRow) {
  const rawWeek = row.week ?? row.week_number ?? row.week_no ?? row.weekNum ?? row.weekNumber ?? row.wk;
  if (rawWeek == null) return "";
  return String(rawWeek).trim();
}

function getLastWeeks(rows: DataRow[], count = 4) {
  const weeks = Array.from(new Set(rows.map(getRowWeek).filter(Boolean)));
  return weeks
    .sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    })
    .slice(-count);
}

function toNumber(value: number | string | undefined) {
  if (value == null || value === "") return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function findPivotRow(rows: WeeklyPivotRow[], name: string) {
  return rows.find((row) => row.name === name);
}

function pivotWeeklyRows(
  rows: DataRow[],
  keyFn: (row: DataRow) => string,
  valueFn: (row: DataRow) => number,
  count = 4,
) {
  const weeks = getLastWeeks(rows, count);
  const pivotMap = new Map<string, { sums: number[]; counts: number[]; key: string }>();

  rows.forEach((row) => {
    const key = keyFn(row);
    const week = getRowWeek(row);
    const index = weeks.indexOf(week);
    if (!key || index < 0) return;

    const pivot = pivotMap.get(key) ?? { key, sums: Array(count).fill(0), counts: Array(count).fill(0) };
    pivot.sums[index] += valueFn(row);
    pivot.counts[index] += 1;
    pivotMap.set(key, pivot);
  });

  return {
    weeks,
    rows: Array.from(pivotMap.values()).map((item) => {
      const values = item.sums.map((sum, idx) => (item.counts[idx] ? sum / item.counts[idx] : undefined));
      return {
        name: item.key,
        values,
        w1: values[0],
        w2: values[1],
        w3: values[2],
        w4: values[3],
      };
    }),
  };
}

function pivotWeeklyPercentRows(
  rows: DataRow[],
  keyFn: (row: DataRow) => string,
  yesFn: (row: DataRow) => boolean,
  count = 4,
) {
  const weeks = getLastWeeks(rows, count);
  const pivotMap = new Map<string, { yes: number[]; total: number[]; key: string }>();

  rows.forEach((row) => {
    const key = keyFn(row);
    const week = getRowWeek(row);
    const index = weeks.indexOf(week);
    if (!key || index < 0) return;

    const pivot = pivotMap.get(key) ?? { key, yes: Array(count).fill(0), total: Array(count).fill(0) };
    pivot.yes[index] += yesFn(row) ? 1 : 0;
    pivot.total[index] += 1;
    pivotMap.set(key, pivot);
  });

  return {
    weeks,
    rows: Array.from(pivotMap.values()).map((item) => {
      const values = item.yes.map((yesCount, idx) =>
        item.total[idx] ? (yesCount / item.total[idx]) * 100 : undefined,
      );
      return {
        name: item.key,
        values,
        w1: values[0],
        w2: values[1],
        w3: values[2],
        w4: values[3],
      };
    }),
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [agentScreen, setAgentScreen] = useState<1 | 2>(1);
  const [ahtChannel, setAhtChannel] = useState<(typeof ahtChannels)[number]["id"]>("email");
  const [csatTab, setCsatTab] = useState<(typeof csatTabs)[number]["id"]>("dsat");
  const [qaVendorTab, setQaVendorTab] = useState<(typeof qaVendorTabs)[number]["id"]>("overall");

  const [filterVendor, setFilterVendor] = useState("All");
  const [filterLanguage, setFilterLanguage] = useState("All");
  const [filterWeek, setFilterWeek] = useState("All");
  const [filterAgentType, setFilterAgentType] = useState("All");
  const [filterAgent, setFilterAgent] = useState("All");
  const [filterSupervisor, setFilterSupervisor] = useState("All");
  const [filterWave, setFilterWave] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterQueue, setFilterQueue] = useState("All");
  const [filterChannel, setFilterChannel] = useState("All");

  const [mapping, setMapping] = useState<MappingRow[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewData>({ email: [], chat: [], call: [] });
  const [agentWiseData, setAgentWiseData] = useState<DataRow[]>([]);
  const [ahtData, setAhtData] = useState<DataRow[]>([]);
  const [csatData, setCsatData] = useState<DataRow[]>([]);
  const [qaData, setQaData] = useState<DataRow[]>([]);

  const [vendorTab, setVendorTab] = useState<string>("");


  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingAgentWise, setLoadingAgentWise] = useState(false);
  const [loadingAht, setLoadingAht] = useState(false);
  const [loadingCsat, setLoadingCsat] = useState(false);
  const [loadingQa, setLoadingQa] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadingOverview(true);
      setLoadingAgentWise(true);
      setLoadingAht(true);
      setLoadingCsat(true);
      setLoadingQa(true);

      const [mappingRes] = await Promise.all([
        supabase.from("agent_mapping").select("*").limit(50000),
      ]);

      const fetchTableBatches = async (tableName: string) => {
        const rows: DataRow[] = [];
        const batchSize = 1000;
        let start = 0;

        while (true) {
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .range(start, start + batchSize - 1);
          if (error) {
            console.error(`Error fetching ${tableName} batch:`, error);
            break;
          }
          if (!data || data.length === 0) break;
          rows.push(...data);
          if (data.length < batchSize) break;
          start += batchSize;
        }

        return rows;
      };

      const [emailRows, chatRows, csatRows, qaRows] = await Promise.all([
        fetchTableBatches("email_aht"),
        fetchTableBatches("chat_call_aht"),
        fetchTableBatches("csat_data"),
        fetchTableBatches("qa_scores"),
      ]);

      console.log("Supabase mappingRes:", mappingRes);
      console.log("Raw email_aht fetched rows:", emailRows.length);
      console.log("Raw email_aht first 5 items:", emailRows.slice(0, 5));
      console.log("Raw chat_call_aht fetched rows:", chatRows.length);
      console.log("Raw chat_call_aht first 5 items:", chatRows.slice(0, 5));
      console.log("Raw csat_data fetched rows:", csatRows.length);
      console.log("Raw qa_scores fetched rows:", qaRows.length);

      if (mappingRes.data) setMapping(mappingRes.data);
      const mergedEmail = mergeWithMapping(emailRows, mappingRes.data ?? []);
      const mergedChatCall = mergeWithMapping(chatRows, mappingRes.data ?? []);
      const mergedCsat = mergeWithMapping(csatRows, mappingRes.data ?? [],);
      const mergedQa = mergeWithMapping(qaRows, mappingRes.data ?? []);

      // Filter out csat rows without team_name
      const filteredCsat = (mergedCsat as DataRow[]).filter((r) => r.team_name?.trim() !== "");

      // Aggregate chat AHT per agent_team and week (SQL equivalent client-side)
      const chatAggMap = new Map<string, { team: string; week: string; vendor?: string; sum: number; count: number }>();
      (mergedChatCall as DataRow[]).forEach((row) => {
        const team = row.agent_team?.trim() || row.mapping?.vendor?.trim() || row.team_name?.trim() || "Unknown";
        const wk = getRowWeek(row);
        if (!wk) return;
        const key = `${team}||${wk}`;
        const value = toNumber(row.avg_handling_time);
        if (row.avg_handling_time == null) return;
        const existing = chatAggMap.get(key) ?? {
          team,
          week: wk,
          vendor: row.vendor ?? row.mapping?.vendor ?? row.team_name ?? row.agent_team,
          sum: 0,
          count: 0,
        };
        existing.sum += value;
        existing.count += 1;
        chatAggMap.set(key, existing);
      });
      const chatAggRows: DataRow[] = Array.from(chatAggMap.values()).map((item) => ({
        agent_team: item.team,
        week: item.week,
        avg_handling_time: item.count ? item.sum / item.count : 0,
        vendor: item.vendor,
      }));
      console.log("Grouped chatAggRows:", chatAggRows);

      // Aggregate QA per partner and week, exclude reviewer 'Quality assurance'
      const qaAggMap = new Map<string, { partner: string; week: string; sum: number; count: number }>();
      (mergedQa as DataRow[]).forEach((row) => {
        if ((row.reviewer ?? "").toLowerCase() === "quality assurance") return;
        const partner = row.partner ?? row.mapping?.vendor ?? row.vendor ?? "Unknown";
        const wk = getRowWeek(row);
        if (!partner || !wk) return;
        const key = `${partner}||${wk}`;
        const value = toNumber(row.evaluation ?? 0);
        const existing = qaAggMap.get(key) ?? { partner, week: wk, sum: 0, count: 0 };
        existing.sum += value;
        existing.count += 1;
        qaAggMap.set(key, existing);
      });
      const qaAggRows: DataRow[] = Array.from(qaAggMap.values()).map((item) => ({
        partner: item.partner,
        week: item.week,
        evaluation: item.count ? (item.sum / item.count) * 100 : 0,
        vendor: item.partner,
      }));
      console.log("Grouped qaAggRows:", qaAggRows);

      const emailAggMap = new Map<string, { vendor: string; week: string; sum: number; count: number }>();
      (emailRows as DataRow[]).forEach((row) => {
        const vendor = row.vendor?.trim() || "Unknown";
        const wk = getRowWeek(row);
        if (!vendor || !wk) return;
        const key = `${vendor}||${wk}`;
        const value = toNumber(row.handle_time);
        if (row.handle_time == null) return;
        const existing = emailAggMap.get(key) ?? { vendor, week: wk, sum: 0, count: 0 };
        existing.sum += value;
        existing.count += 1;
        emailAggMap.set(key, existing);
      });
      const emailAggRows: DataRow[] = Array.from(emailAggMap.values()).map((item) => ({
        vendor: item.vendor,
        week: item.week,
        handle_time: item.count ? item.sum / item.count : 0,
      }));
      console.log("Grouped emailAggRows:", emailAggRows);

      setOverviewData({
        email: emailAggRows,
        chat: chatAggRows.filter((row) => row.agent_team?.trim() !== ""),
        call: mergedChatCall.filter((row) => row.channel?.toLowerCase() === "call" || row.type?.toLowerCase() === "call"),
      });

      setAgentWiseData([...mergedEmail, ...mergedChatCall, ...mergedCsat, ...mergedQa]);
      setAhtData([...mergedEmail, ...mergedChatCall]);
      setCsatData(filteredCsat);
      setQaData(qaAggRows);

      setLoadingOverview(false);
      setLoadingAgentWise(false);
      setLoadingAht(false);
      setLoadingCsat(false);
      setLoadingQa(false);
    };

    loadData();
  }, []);

  const uniqueVendors = useMemo(() => {
    const values = new Set<string>();
    mapping.forEach((row) => {
      if (row.vendor) values.add(row.vendor);
    });
    [...overviewData.email, ...overviewData.chat, ...overviewData.call, ...qaData].forEach((row) => {
      if (row.vendor) values.add(row.vendor);
      if (row.team_name) values.add(row.team_name);
      if (row.partner) values.add(row.partner);
      if (row.agent_team) values.add(row.agent_team);
    });
    return ["All", ...Array.from(values).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))];
  }, [mapping, overviewData.email, overviewData.chat, overviewData.call, qaData]);

  const uniqueLanguages = useMemo(() => {
    return ["All", ...new Set(mapping.map((row) => row.language).filter(Boolean))];
  }, [mapping]);

  const getVendorKey = (row: DataRow) =>
    row.vendor ?? row.team_name ?? row.mapping?.vendor ?? row.agent_team ?? row.mapping?.agent_name ?? "Unknown";

  const getChatAgentTeamKey = (row: DataRow) =>
    row.agent_team ?? "Unknown";

  const getPartnerKey = (row: DataRow) =>
    row.partner ?? row.mapping?.vendor ?? row.vendor ?? row.team_name ?? row.agent_team ?? row.mapping?.agent_name ?? "Unknown";

  const getAgentKey = (row: DataRow) => row.agent_name ?? row.agent ?? row.mapping?.agent_name ?? "Unknown";

  const overviewWeeks = useMemo(() => {
    const allWeeks = [
      ...overviewData.email,
      ...overviewData.chat,
      ...overviewData.call,
      ...csatData,
      ...qaData,
    ]
      .map(getRowWeek)
      .filter(Boolean);
    return Array.from(new Set(allWeeks)).sort((a, b) => Number(a) - Number(b)).slice(-4);
  }, [overviewData, csatData, qaData]);

  const uniqueAgentTypes = useMemo(() => {
    return ["All", ...new Set(mapping.map((row) => row.agent_type).filter(Boolean))];
  }, [mapping]);

  const uniqueAgents = useMemo(() => {
    return ["All", ...new Set(agentWiseData.map((row) => row.agent_name).filter(Boolean))];
  }, [agentWiseData]);

  const uniqueSupervisors = useMemo(() => {
    return ["All", ...new Set(mapping.map((row) => row.supervisor).filter(Boolean))];
  }, [mapping]);

  const uniqueWaves = useMemo(() => {
    return ["All", ...new Set(mapping.map((row) => row.wave).filter(Boolean))];
  }, [mapping]);

  const mappingByAgent = useMemo(() => {
    return mapping.reduce((acc: Record<string, MappingRow>, row: MappingRow) => {
      if (row.agent_name) acc[row.agent_name] = row;
      return acc;
    }, {} as Record<string, MappingRow>);
  }, [mapping]);

  const supervisorList = uniqueSupervisors;
  const waveList = uniqueWaves;

  const uniqueCategories = useMemo(() => {
    return ["All", ...new Set(mapping.map((row) => row.category).filter(Boolean))];
  }, [mapping]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; value: string; clear: () => void }[] = [];
    if (filterVendor !== "All") filters.push({ label: `Vendor: ${filterVendor}`, value: filterVendor, clear: () => setFilterVendor("All") });
    if (filterLanguage !== "All") filters.push({ label: `Language: ${filterLanguage}`, value: filterLanguage, clear: () => setFilterLanguage("All") });
    if (filterWeek !== "All") filters.push({ label: `Week: ${filterWeek}`, value: filterWeek, clear: () => setFilterWeek("All") });
    if (filterAgentType !== "All") filters.push({ label: `Agent type: ${filterAgentType}`, value: filterAgentType, clear: () => setFilterAgentType("All") });
    return filters;
  }, [filterVendor, filterLanguage, filterWeek, filterAgentType]);

  const uniqueQueues = useMemo(() => {
    return ["All", ...new Set(mapping.map((row) => row.queue).filter(Boolean))];
  }, [mapping]);

  const vendorFilterFn = (row: DataRow) =>
    filterVendor === "All" ||
    row.vendor === filterVendor ||
    row.team_name === filterVendor ||
    row.partner === filterVendor ||
    row.agent_team === filterVendor ||
    row.mapping?.vendor === filterVendor;
  const languageFilterFn = (row: DataRow) => filterLanguage === "All" || row.mapping?.language === filterLanguage;
  const weekFilterFn = (row: DataRow) => filterWeek === "All" || getRowWeek(row) === filterWeek;
  const typeFilterFn = (row: DataRow) =>
    filterAgentType === "All" || row.mapping?.agent_type === filterAgentType || row.agent_type === filterAgentType;
  const agentFilterFn = (row: DataRow) => filterAgent === "All" || row.agent_name === filterAgent;
  const supervisorFilterFn = (row: DataRow) =>
    filterSupervisor === "All" || row.mapping?.supervisor === filterSupervisor || row.supervisor === filterSupervisor;
  const waveFilterFn = (row: DataRow) => filterWave === "All" || row.mapping?.wave === filterWave || row.wave === filterWave;
  const categoryFilterFn = (row: DataRow) =>
    filterCategory === "All" || row.mapping?.category === filterCategory || row.category === filterCategory;
  const queueFilterFn = (row: DataRow) => filterQueue === "All" || row.mapping?.queue === filterQueue || row.queue === filterQueue;

  const overviewFiltered = useMemo(() => {
    const filter = (row: DataRow) => vendorFilterFn(row) && languageFilterFn(row) && weekFilterFn(row) && typeFilterFn(row);
    return {
      email: overviewData.email.filter(filter),
      chat: overviewData.chat.filter(filter),
      call: overviewData.call.filter(filter),
    };
  }, [overviewData, filterVendor, filterLanguage, filterWeek, filterAgentType]);

  const sectionWeeks = overviewWeeks.length ? overviewWeeks : ["W1", "W2", "W3", "W4"];

  const agentWiseFiltered = useMemo(() => {
    return agentWiseData.filter(
      (row: DataRow) =>
        vendorFilterFn(row) &&
        languageFilterFn(row) &&
        weekFilterFn(row) &&
        typeFilterFn(row) &&
        agentFilterFn(row) &&
        supervisorFilterFn(row),
    );
  }, [agentWiseData, filterVendor, filterLanguage, filterWeek, filterAgentType, filterAgent, filterSupervisor]);

  const ahtFiltered = useMemo(() => {
    return ahtData.filter(
      (row: DataRow) =>
        vendorFilterFn(row) &&
        languageFilterFn(row) &&
        weekFilterFn(row) &&
        typeFilterFn(row) &&
        agentFilterFn(row) &&
        supervisorFilterFn(row) &&
        waveFilterFn(row) &&
        (ahtChannel === "email" ? categoryFilterFn(row) : queueFilterFn(row)),
    );
  }, [ahtData, filterVendor, filterLanguage, filterWeek, filterAgentType, filterAgent, filterSupervisor, filterWave, filterCategory, filterQueue, ahtChannel]);

  const csatFiltered = useMemo(() => {
    return csatData.filter(
      (row: DataRow) =>
        vendorFilterFn(row) &&
        languageFilterFn(row) &&
        weekFilterFn(row) &&
        typeFilterFn(row) &&
        agentFilterFn(row) &&
        supervisorFilterFn(row),
    );
  }, [csatData, filterVendor, filterLanguage, filterWeek, filterAgentType, filterAgent, filterSupervisor]);

  const qaFiltered = useMemo(() => {
    return qaData.filter((row: DataRow) => vendorFilterFn(row) && languageFilterFn(row) && weekFilterFn(row) && typeFilterFn(row));
  }, [qaData, filterVendor, filterLanguage, filterWeek, filterAgentType]);

  const emailVendorPivot = useMemo(
    () =>
      pivotWeeklyRowsWithWeeks(
        overviewFiltered.email,
        getVendorKey,
        (row) => toNumber(row.handle_time ?? row.avg_handling_time ?? row.aht ?? row.w1),
        overviewWeeks,
      ),
    [overviewFiltered.email, overviewWeeks],
  );

  const chatVendorPivot = useMemo(
    () =>
      pivotWeeklyRowsWithWeeks(
        overviewFiltered.chat,
        getVendorKey,
        (row) => toNumber(row.avg_handling_time ?? row.handle_time ?? row.aht ?? row.w1),
        overviewWeeks,
      ),
    [overviewFiltered.chat, overviewWeeks],
  );

  const callVendorPivot = useMemo(
    () =>
      pivotWeeklyRowsWithWeeks(
        overviewFiltered.call,
        getVendorKey,
        (row) => toNumber(row.avg_handling_time ?? row.handle_time ?? row.aht ?? row.w1),
        overviewWeeks,
      ),
    [overviewFiltered.call, overviewWeeks],
  );

  const csatVendorPivot = useMemo(
    () =>
      pivotWeeklyRowsWithWeeks(
        csatFiltered,
        getVendorKey,
        (row) => toNumber(row.survey_rating ?? row.avg_csat),
        overviewWeeks,
      ),
    [csatFiltered, overviewWeeks],
  );

  const qaVendorPivot = useMemo(
    () =>
      pivotWeeklyRowsWithWeeks(
        qaFiltered,
        getVendorKey,
        (row) => toNumber(row.evaluation ?? 0),
        overviewWeeks,
      ),
    [qaFiltered, overviewWeeks],
  );

  const agentAhtPivot = useMemo(
    () =>
      pivotWeeklyRows(
        agentWiseFiltered.filter((row) => Boolean(row.agent_name)),
        getAgentKey,
        (row) => toNumber(row.avg_handling_time ?? row.handle_time ?? row.aht ?? row.w1),
      ),
    [agentWiseFiltered],
  );

  const agentCsatPivot = useMemo(
    () =>
      pivotWeeklyRows(
        csatFiltered.filter((row) => Boolean(row.agent_name) || Boolean(row.agent)),
        getAgentKey,
        (row) => toNumber(row.survey_rating ?? row.avg_csat),
        4,
      ),
    [csatFiltered],
  );

  const agentQaPivot = useMemo(
    () =>
      pivotWeeklyRows(
        qaFiltered.filter((row) => Boolean(row.agent_name) || Boolean(row.agent)),
        getAgentKey,
        (row) => toNumber(row.evaluation ?? row.score ?? 0) * 100,
        4,
      ),
    [qaFiltered],
  );

  const agentWeeks = useMemo(
    () =>
      agentAhtPivot.weeks.length
        ? agentAhtPivot.weeks
        : agentCsatPivot.weeks.length
        ? agentCsatPivot.weeks
        : agentQaPivot.weeks,
    [agentAhtPivot.weeks, agentCsatPivot.weeks, agentQaPivot.weeks],
  );

  const agentPivotRows = useMemo(() => {
    const names = Array.from(
      new Set([
        ...agentAhtPivot.rows.map((row) => row.name),
        ...agentCsatPivot.rows.map((row) => row.name),
        ...agentQaPivot.rows.map((row) => row.name),
      ]),
    );
    return names.map((name) => ({
      name,
      aht: agentAhtPivot.rows.find((row) => row.name === name),
      csat: agentCsatPivot.rows.find((row) => row.name === name),
      qa: agentQaPivot.rows.find((row) => row.name === name),
    }));
  }, [agentAhtPivot.rows, agentCsatPivot.rows, agentQaPivot.rows]);

  const vendorTabs = useMemo(() => {
    const teams = Array.from(new Set(agentWiseData.map((r) => r.agent_team).filter(Boolean)));
    return teams.length ? teams : ["VentureSathi", "XMC India"];
  }, [agentWiseData]);

  useEffect(() => {
    if (!vendorTab && vendorTabs.length) setVendorTab(vendorTabs[0] ?? "");
  }, [vendorTabs, vendorTab]);


  const agentListByVendor = useMemo(() =>
    Array.from(new Set(agentWiseData.filter((r) => (vendorTab ? r.agent_team === vendorTab : true)).map((r) => r.agent_name ?? r.agent).filter(Boolean))),
    [agentWiseData, vendorTab],
  );

  const channelList = useMemo(() => ["All", ...Array.from(new Set(agentWiseData.map((r) => (r.channel ?? r.type ?? "").toString()).filter(Boolean)))], [agentWiseData]);

  const agentWisePivotsByChannel = useMemo(() => {
    const weeks = overviewWeeks.length ? overviewWeeks : getLastWeeks(agentWiseData, 4);
    const makeRows = (channelId: string, valueFn: (row: DataRow) => number) => {
      const rows = agentWiseData.filter((r) => {
        if (vendorTab && r.agent_team !== vendorTab) return false;
        const ch = (r.channel ?? r.type ?? "").toString().toLowerCase();
        if (channelId && ch !== channelId) return false;
        if (filterAgent !== "All" && getAgentKey(r) !== filterAgent) return false;
        const agentTypeVal = r.mapping?.agent_type ?? r.agent_type ?? r.mapping?.tenure ?? "";
        if (filterAgentType !== "All" && (agentTypeVal ?? "") !== filterAgentType) return false;
        if (filterSupervisor !== "All" && (r.mapping?.supervisor ?? r.supervisor ?? "") !== filterSupervisor) return false;
        if (filterWave !== "All" && (r.mapping?.wave ?? r.wave ?? "") !== filterWave) return false;
        if (filterLanguage !== "All" && (r.mapping?.language ?? "") !== filterLanguage) return false;
        if (filterWeek !== "All" && getRowWeek(r) !== filterWeek) return false;
        return true;
      });
      return pivotWeeklyRowsWithWeeks(rows, getAgentKey, valueFn, weeks);
    };

    return {
      weeks,
      aht: {
        call: makeRows("call", (row) => toNumber(row.avg_handling_time ?? row.handle_time ?? row.aht ?? row.w1)),
        email: makeRows("email", (row) => toNumber(row.handle_time ?? row.aht ?? row.w1)),
        chat: makeRows("chat", (row) => toNumber(row.avg_handling_time ?? row.handle_time ?? row.aht ?? row.w1)),
      },
      csatByChannel: {
        call: makeRows("call", (row) => toNumber(row.survey_rating ?? row.avg_csat)),
        email: makeRows("email", (row) => toNumber(row.survey_rating ?? row.avg_csat)),
        chat: makeRows("chat", (row) => toNumber(row.survey_rating ?? row.avg_csat)),
      },
      qaByChannel: {
        call: makeRows("call", (row) => toNumber(row.evaluation ?? row.score ?? 0) * 100),
        email: makeRows("email", (row) => toNumber(row.evaluation ?? row.score ?? 0) * 100),
        chat: makeRows("chat", (row) => toNumber(row.evaluation ?? row.score ?? 0) * 100),
      },
    };
  }, [agentWiseData, vendorTab, overviewWeeks, filterAgent, filterAgentType, filterSupervisor, filterWave, filterLanguage, filterWeek]);

  const ahtChannelFiltered = useMemo(
    () =>
      ahtFiltered.filter(
        (row) =>
          row.channel?.toLowerCase() === ahtChannel || row.type?.toLowerCase() === ahtChannel,
      ),
    [ahtFiltered, ahtChannel],
  );

  const ahtChannelPivot = useMemo(
    () =>
      pivotWeeklyRows(
        ahtChannelFiltered,
        getAgentKey,
        (row) => toNumber(row.avg_handling_time ?? row.handle_time ?? row.aht ?? row.w1),
      ),
    [ahtChannelFiltered],
  );

  const ahtAgentMetrics = useMemo(() => {
    const map = new Map(
      ahtChannelFiltered.map((row) => [
        getAgentKey(row),
        { talk: 0, wrap: 0, hold: 0, count: 0 },
      ]),
    );

    ahtChannelFiltered.forEach((row) => {
      const key = getAgentKey(row);
      const metric = map.get(key);
      if (!metric) return;
      metric.talk += toNumber(row.talk_time);
      metric.wrap += toNumber(row.wrap_time);
      metric.hold += toNumber(row.hold_time);
      metric.count += 1;
    });

    return Array.from(map.entries()).map(([key, metric]) => ({
      name: key,
      avgTalk: metric.count ? metric.talk / metric.count : 0,
      avgWrap: metric.count ? metric.wrap / metric.count : 0,
      avgHold: metric.count ? metric.hold / metric.count : 0,
    }));
  }, [ahtChannelFiltered]);

  const qaAgentPivot = useMemo(
    () =>
      pivotWeeklyRows(
        qaFiltered,
        getAgentKey,
        (row) => toNumber(row.evaluation ?? row.score ?? 0),
      ),
    [qaFiltered],
  );

  const csatAgentStats = useMemo(() => {
    const agentMap = new Map<string, { ratingSum: number; count: number; csat: number; dsat: number; dsatAgent: number; dsatTotal: number }>();
    csatFiltered.forEach((row) => {
      const agent = getAgentKey(row);
      const item = agentMap.get(agent) ?? { ratingSum: 0, count: 0, csat: 0, dsat: 0, dsatAgent: 0, dsatTotal: 0 };
      const rating = Number(row.survey_rating);
      item.ratingSum += rating;
      item.count += 1;
      if (rating >= 4) item.csat += 1;
      if (rating <= 3) {
        item.dsat += 1;
        item.dsatTotal += 1;
        if (row.dsat_reason?.toLowerCase() === "agent related") item.dsatAgent += 1;
      }
      agentMap.set(agent, item);
    });
    return Array.from(agentMap.entries()).map(([agent, item]) => ({
      agent,
      avgRating: item.count ? item.ratingSum / item.count : 0,
      csatCount: item.csat,
      dsatCount: item.dsat,
      dsatPercent: item.dsatTotal ? Math.round((item.dsat / item.dsatTotal) * 100) : 0,
      agentIssuePercent: item.dsatTotal ? Math.round((item.dsatAgent / item.dsatTotal) * 100) : 0,
    }));
  }, [csatFiltered]);

  const qaWeeks = qaAgentPivot.weeks;

  const summaryForChannel = (rows: DataRow[]) => {
    const numeric = (field: keyof DataRow) =>
      rows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0) / Math.max(rows.length, 1);
    return {
      avgAht: numeric("aht") || numeric("w1") || numeric("avg_aht"),
      volume: rows.reduce((sum, row) => sum + Number(row.volume ?? 0), 0),
      talkTime: rows.reduce((sum, row) => sum + Number(row.talk_time ?? 0), 0),
      wrapTime: rows.reduce((sum, row) => sum + Number(row.wrap_time ?? 0), 0),
    };
  };

  const ahtTrendData = useMemo(() => {
    type TrendRow = { name: string; w1: number; w2: number; w3: number; w4: number; count: number };
    const grouping = new Map<string, TrendRow>();
    ahtFiltered.forEach((row: DataRow) => {
      const label = row.agent_name || row.mapping?.agent_name || "Unknown";
      const existing = grouping.get(label) ?? { name: label, w1: 0, w2: 0, w3: 0, w4: 0, count: 0 };
      existing.w1 += Number(row.w1 ?? row.aht_w1 ?? 0);
      existing.w2 += Number(row.w2 ?? row.aht_w2 ?? 0);
      existing.w3 += Number(row.w3 ?? row.aht_w3 ?? 0);
      existing.w4 += Number(row.w4 ?? row.aht_w4 ?? 0);
      existing.count += 1;
      grouping.set(label, existing);
    });
    return Array.from(grouping.values()).map((row) => ({
      name: row.name,
      W1: row.w1 / Math.max(row.count, 1),
      W2: row.w2 / Math.max(row.count, 1),
      W3: row.w3 / Math.max(row.count, 1),
      W4: row.w4 / Math.max(row.count, 1),
    }));
  }, [ahtFiltered]);

  const stackedBarData = useMemo(() => {
    return ahtTrendData.slice(0, 6).map((point) => ({
      name: point.name,
      talk: point.W1 * 0.4 + 10,
      wrap: point.W2 * 0.2 + 5,
      hold: point.W3 * 0.1 + 3,
    }));
  }, [ahtTrendData]);

  const csatSummary = useMemo(() => {
    const total = csatFiltered.length;
    const dsat = csatFiltered.filter((row: DataRow) => Number(row.survey_rating) <= 3).length;
    const csat = csatFiltered.filter((row: DataRow) => Number(row.survey_rating) >= 4).length;
    const avg = csatFiltered.reduce((sum: number, row: DataRow) => sum + Number(row.survey_rating ?? 0), 0) / Math.max(total, 1);
    return {
      avgCSAT: avg,
      total,
      dsatCount: dsat,
      csatCount: csat,
      dsatShare: Math.round((dsat / Math.max(total, 1)) * 100),
    };
  }, [csatFiltered]);

  const qaSummary = useMemo(() => {
    const rows = qaFiltered.filter(
      (row: DataRow) =>
        qaVendorTab === "overall" ||
        row.mapping?.vendor?.toLowerCase().includes(qaVendorTab.replace("vendor", "")),
    );
    const vendorRows = rows.filter((row: DataRow) => row.reviewer?.toLowerCase() !== "quality assurance");
    const flixRows = rows.filter((row: DataRow) => row.reviewer?.toLowerCase() === "quality assurance");
    const avgVendor = (vendorRows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / Math.max(vendorRows.length, 1)) * 100;
    const avgFlix = (flixRows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / Math.max(flixRows.length, 1)) * 100;
    const discrepancyCases = rows.filter((row: DataRow) => Math.abs(Number(row.score ?? 0) - Number(row.vendor_score ?? 0)) > 0.05).length;
    const weeks = getLastWeeks(rows, 4);
    const weeklyTrend = weeks.map((week) => {
      const weekRows = rows.filter((row) => getRowWeek(row) === week);
      const weekVendor = weekRows.filter((row: DataRow) => row.reviewer?.toLowerCase() !== "quality assurance");
      const weekFlix = weekRows.filter((row: DataRow) => row.reviewer?.toLowerCase() === "quality assurance");
      const vendorAvg = (weekVendor.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / Math.max(weekVendor.length, 1)) * 100;
      const flixAvg = (weekFlix.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / Math.max(weekFlix.length, 1)) * 100;
      return {
        week,
        vendor: Number(vendorAvg.toFixed(1)),
        flix: Number(flixAvg.toFixed(1)),
      };
    });
    const agentRows = pivotWeeklyRows(rows, getAgentKey, (row) => toNumber(row.score ?? row.evaluation ?? 0), 4).rows.map((row) => ({
      ...row,
      values: row.values,
    }));
    return {
      avgVendor: Number(avgVendor.toFixed(1)),
      avgFlix: Number(avgFlix.toFixed(1)),
      discrepancyRate: Math.round((discrepancyCases / Math.max(rows.length, 1)) * 100),
      ztCount: rows.filter((row: DataRow) => row.flag === "ZT" || row.case_status === "ZT").length,
      below85: rows.filter((row: DataRow) => Number(row.score ?? 0) < 0.85).length,
      trend: weeklyTrend,
      matchedCases: rows.slice(0, 6),
      agentRows,
      comments: [
        { theme: "Response quality", count: 18 },
        { theme: "Documentation", count: 12 },
        { theme: "Tone & empathy", count: 9 },
      ],
      inps: [
        { label: "Promoters", value: 48 },
        { label: "Passives", value: 32 },
        { label: "Detractors", value: 20 },
      ],
    };
  }, [qaFiltered, qaVendorTab]);

  const csatRootCauseData = useMemo(() => {
    const groups: Record<string, number> = { agent: 0, process: 0, product: 0 };
    csatFiltered.forEach((row: DataRow) => {
      const rating = Number(row.survey_rating);
      if (rating <= 3) {
        groups[row.root_cause?.toLowerCase() === "process" ? "process" : row.root_cause?.toLowerCase() === "product" ? "product" : "agent"] += 1;
      }
    });
    return Object.entries(groups).map(([key, value]) => ({ name: key, value }));
  }, [csatFiltered]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Vendor Performance</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Agent performance control center</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Explore AHT, CSAT, QA and agent-level metrics across vendors, channels and quality programs.
              </p>
            </div>
          </div>
          <nav className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Top unlabelled filters removed — keeping the labeled 4 filters below */}
          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={filter.clear}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                >
                  <span>{filter.label}</span>
                  <span aria-hidden="true" className="text-slate-500">×</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {loadingOverview ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading overview...</div>
            ) : (
              <>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-2">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Vendor overview</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Weekly performance across all vendors and channels</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Vendor</label>
                      <select className="mt-2 w-full bg-transparent text-slate-900 outline-none" value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}>
                        {uniqueVendors.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Language</label>
                      <select className="mt-2 w-full bg-transparent text-slate-900 outline-none" value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)}>
                        {uniqueLanguages.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Time period</label>
                      <select className="mt-2 w-full bg-transparent text-slate-900 outline-none" value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)}>
                        {overviewWeeks.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Agent type</label>
                      <select className="mt-2 w-full bg-transparent text-slate-900 outline-none" value={filterAgentType} onChange={(e) => setFilterAgentType(e.target.value)}>
                        {uniqueAgentTypes.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {[
                  { id: "call", label: "CALL", color: "bg-amber-100 text-amber-800", rows: callVendorPivot.rows },
                  { id: "email", label: "EMAIL", color: "bg-sky-100 text-sky-800", rows: emailVendorPivot.rows },
                  { id: "chat", label: "CHAT", color: "bg-violet-100 text-violet-800", rows: chatVendorPivot.rows },
                ].map((section) => (
                  <div key={section.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${section.color}`}>{section.label}</span>
                        <h3 className="text-lg font-semibold text-slate-900">{section.label} vendor performance</h3>
                      </div>
                    </div>
                    <div className="overflow-auto px-6 py-4">
                      <table className="min-w-full border-collapse text-left text-sm text-slate-700">
                        <thead>
                          <tr>
                            <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-900">Vendor</th>
                            <th colSpan={sectionWeeks.length} className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-900">AHT</th>
                            <th colSpan={sectionWeeks.length} className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-900">CSAT</th>
                            <th colSpan={sectionWeeks.length} className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-900">QA</th>
                          </tr>
                          <tr>
                            <th className="sr-only">Vendor</th>
                            {sectionWeeks.map((week) => (
                              <th key={`${section.id}-aht-week-${week}`} className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-600">{week}</th>
                            ))}
                            {sectionWeeks.map((week) => (
                              <th key={`${section.id}-csat-week-${week}`} className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-600">{week}</th>
                            ))}
                            {sectionWeeks.map((week) => (
                              <th key={`${section.id}-qa-week-${week}`} className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-600">{week}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.length === 0 ? (
                            <tr>
                              <td colSpan={1 + sectionWeeks.length * 3} className="px-3 py-6 text-center text-slate-500">No {section.label.toLowerCase()} data available.</td>
                            </tr>
                          ) : (
                            section.rows.map((row, index) => (
                              <tr key={`${section.id}-${index}`} className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                                <td className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-900">{row.name}</td>
                                {sectionWeeks.map((weekIndex, cellIndex) => (
                                  <td key={`${section.id}-aht-${row.name}-${cellIndex}`} className="border-b border-slate-200 px-3 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getAhtChipClass(row.values?.[cellIndex])}`}>
                                      {formatAhtSeconds(row.values?.[cellIndex])}
                                    </span>
                                  </td>
                                ))}
                                {sectionWeeks.map((weekIndex, cellIndex) => {
                                  const csatVal = csatVendorPivot.rows.find((r) => r.name === row.name)?.values?.[cellIndex];
                                  return (
                                    <td key={`${section.id}-csat-${row.name}-${cellIndex}`} className="border-b border-slate-200 px-3 py-3">
                                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getCsatChipClass(csatVal)}`}>
                                        {formatNumber(csatVal)}
                                      </span>
                                    </td>
                                  );
                                })}
                                {sectionWeeks.map((weekIndex, cellIndex) => (
                                  <td key={`${section.id}-qa-${row.name}-${cellIndex}`} className="border-b border-slate-200 px-3 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPercentChipClass(qaVendorPivot.rows.find((r) => r.name === row.name)?.values?.[cellIndex])}`}>
                                      {formatNumber(qaVendorPivot.rows.find((r) => r.name === row.name)?.values?.[cellIndex])}%
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === "agent" && (
          <div className="space-y-6">
            {/* Removed static Vendor group tabs — vendor tabs are shown below from DB */}

            <div className="mt-4 flex flex-wrap gap-3">
              {vendorTabs.map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setVendorTab(String(v))}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${vendorTab === v ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            {loadingAgentWise ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading agent-level data...</div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="grid grid-cols-7 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Agent</label>
                      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}>
                        <option value="All">All</option>
                        {agentListByVendor.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Agent Type</label>
                      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={filterAgentType} onChange={(e) => setFilterAgentType(e.target.value)}>
                        <option value="All">All</option>
                        {uniqueAgentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Supervisor</label>
                      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={filterSupervisor} onChange={(e) => setFilterSupervisor(e.target.value)}>
                        {supervisorList.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Wave</label>
                      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={filterWave} onChange={(e) => setFilterWave(e.target.value)}>
                        {waveList.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Channel</label>
                      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
                        {channelList.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Language</label>
                      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)}>
                        {uniqueLanguages.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500">Week</label>
                      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)}>
                        <option value="All">All</option>
                        {overviewWeeks.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Combined per-channel tables */}
                {(["call", "email", "chat"] as const).map((channelId) => {
                  const weeks = agentWisePivotsByChannel.weeks ?? [];
                  const ahtPivot = agentWisePivotsByChannel.aht?.[channelId];
                  const csatPivot = agentWisePivotsByChannel.csatByChannel?.[channelId];
                  const qaPivot = agentWisePivotsByChannel.qaByChannel?.[channelId];
                  const names = Array.from(new Set([
                    ...(ahtPivot?.rows ?? []).map((r) => r.name),
                    ...(csatPivot?.rows ?? []).map((r) => r.name),
                    ...(qaPivot?.rows ?? []).map((r) => r.name),
                  ]));

                  return (
                    <div key={`channel-${channelId}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-900">{channelId.toUpperCase()} — Agent performance</h2>
                      </div>
                      <div className="overflow-auto px-6 py-4">
                        <table className="min-w-full text-left text-sm text-slate-700">
                          <thead>
                            <tr>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Agent</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Supervisor</th>
                              <th className="border-b border-slate-200 px-3 py-3 font-semibold">Type</th>
                              {weeks.map((w) => (
                                <th key={`aht-${channelId}-${w}`} className="border-b border-slate-200 px-3 py-3 font-semibold">AHT {w}</th>
                              ))}
                              {weeks.map((w) => (
                                <th key={`csat-${channelId}-${w}`} className="border-b border-slate-200 px-3 py-3 font-semibold">CSAT {w}</th>
                              ))}
                              {weeks.map((w) => (
                                <th key={`qa-${channelId}-${w}`} className="border-b border-slate-200 px-3 py-3 font-semibold">QA {w}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {names.length === 0 ? (
                              <tr><td colSpan={3 + weeks.length * 3} className="px-3 py-6 text-center text-slate-500">No data available.</td></tr>
                            ) : (
                              names.map((name, idx) => {
                                const ahtRow = ahtPivot?.rows.find((r) => r.name === name);
                                const csatRow = csatPivot?.rows.find((r) => r.name === name);
                                const qaRow = qaPivot?.rows.find((r) => r.name === name);
                                const map = mappingByAgent[name] ?? {};
                                const typeLabel = (map.agent_type ?? map.tenure ?? "").toString() || "Unknown";
                                const isNew = /new/i.test(typeLabel);
                                return (
                                  <tr key={`${channelId}-agent-${name}`} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                                    <td className="border-b border-slate-200 px-3 py-3 font-medium text-slate-800">{name}</td>
                                    <td className="border-b border-slate-200 px-3 py-3">{map.supervisor ?? "—"}</td>
                                    <td className="border-b border-slate-200 px-3 py-3">
                                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isNew ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}>{isNew ? "Newbie" : "Tenured"}</span>
                                    </td>
                                    {weeks.map((w, wi) => (
                                      <td key={`${name}-aht-${w}`} className="border-b border-slate-200 px-3 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getAgentAhtChipClass(ahtRow?.values?.[wi])}`}>{formatAhtSeconds(ahtRow?.values?.[wi])}</span>
                                      </td>
                                    ))}
                                    {weeks.map((w, wi) => (
                                      <td key={`${name}-csat-${w}`} className="border-b border-slate-200 px-3 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getCsatChipClass(csatRow?.values?.[wi])}`}>{formatNumber(csatRow?.values?.[wi])}</span>
                                      </td>
                                    ))}
                                    {weeks.map((w, wi) => (
                                      <td key={`${name}-qa-${w}`} className="border-b border-slate-200 px-3 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPercentChipClass(qaRow?.values?.[wi])}`}>{formatNumber(qaRow?.values?.[wi])}%</span>
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "aht" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {ahtChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setAhtChannel(channel.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${ahtChannel === channel.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {channel.label}
                </button>
              ))}
            </div>
            {loadingAht ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading AHT metrics...</div>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-4">
                  {Object.entries(summaryForChannel(ahtFiltered)).map(([label, value]) => (
                    <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{label.replace(/([A-Z])/g, " $1")}</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(Number(value))}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Agent AHT trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={ahtTrendData.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="W1" stroke="#2563eb" />
                        <Line type="monotone" dataKey="W2" stroke="#10b981" />
                        <Line type="monotone" dataKey="W3" stroke="#f59e0b" />
                        <Line type="monotone" dataKey="W4" stroke="#ef4444" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Talk/Wrap/Hold breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stackedBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="talk" fill="#2563eb" stackId="a" />
                        <Bar dataKey="wrap" fill="#10b981" stackId="a" />
                        <Bar dataKey="hold" fill="#f97316" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900">Agent breakdown</h3>
                  </div>
                  <div className="overflow-auto px-6 py-4">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <thead>
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-3">Agent</th>
                          <th className="border-b border-slate-200 px-3 py-3">Vendor</th>
                          <th className="border-b border-slate-200 px-3 py-3">W1</th>
                          <th className="border-b border-slate-200 px-3 py-3">W2</th>
                          <th className="border-b border-slate-200 px-3 py-3">W3</th>
                          <th className="border-b border-slate-200 px-3 py-3">W4</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ahtTrendData.slice(0, 10).map((row) => (
                          <tr key={row.name} className="odd:bg-slate-50 even:bg-white">
                            <td className="border-b border-slate-200 px-3 py-3 font-medium">{row.name}</td>
                            <td className="border-b border-slate-200 px-3 py-3">{filterVendor !== "All" ? filterVendor : "All vendors"}</td>
                            <td className="border-b border-slate-200 px-3 py-3">{formatNumber(row.W1)}</td>
                            <td className="border-b border-slate-200 px-3 py-3">{formatNumber(row.W2)}</td>
                            <td className="border-b border-slate-200 px-3 py-3">{formatNumber(row.W3)}</td>
                            <td className="border-b border-slate-200 px-3 py-3">{formatNumber(row.W4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "csat" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {csatTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCsatTab(tab.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${csatTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {loadingCsat ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading CSAT details...</div>
            ) : csatTab === "dsat" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Avg CSAT</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(csatSummary.avgCSAT)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">CSAT count</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{csatSummary.csatCount}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">DSAT count</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{csatSummary.dsatCount}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">DSAT share</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{csatSummary.dsatShare}%</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900">Top agent concerns</h3>
                  </div>
                  <div className="overflow-auto px-6 py-4">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <thead>
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-3">Agent</th>
                          <th className="border-b border-slate-200 px-3 py-3">Avg CSAT</th>
                          <th className="border-b border-slate-200 px-3 py-3">DSAT share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csatFiltered.slice(0, 8).map((row: DataRow, idx: number) => {
                          const dsatShare = Number(row.survey_rating) <= 3 ? "100%" : "0%";
                          return (
                            <tr key={`dsat-${idx}`} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                              <td className="border-b border-slate-200 px-3 py-3 font-medium">{row.agent_name}</td>
                              <td className="border-b border-slate-200 px-3 py-3">{row.survey_rating}</td>
                              <td className="border-b border-slate-200 px-3 py-3">{dsatShare}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : csatTab === "training" ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {csatFiltered.slice(0, 6).map((row: DataRow, idx: number) => (
                  <div key={`training-${idx}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-800">{row.agent_name || "Agent"}</p>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${Number(row.survey_rating) <= 2 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>Critical</span>
                    <div className="mt-4 text-sm text-slate-600">Worst category: {row.category || "N/A"}</div>
                    <div className="mt-3 text-sm text-slate-600">Coaching focus: {row.issue_focus || "Tone & accuracy"}</div>
                  </div>
                ))}
              </div>
            ) : csatTab === "breakdown" ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-auto px-6 py-4">
                  <table className="min-w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-3">Category</th>
                        <th className="border-b border-slate-200 px-3 py-3">Avg CSAT</th>
                        <th className="border-b border-slate-200 px-3 py-3">DSAT rate</th>
                        <th className="border-b border-slate-200 px-3 py-3">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csatFiltered.slice(0, 10).map((row: DataRow, idx: number) => {
                        const dsatRate = Number(row.dsat_rate ?? Math.round((Number(row.survey_rating) <= 3 ? 100 : 0)));
                        return (
                          <tr key={`breakdown-${idx}`} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                            <td className="border-b border-slate-200 px-3 py-3 font-medium">{row.category || "General"}</td>
                            <td className="border-b border-slate-200 px-3 py-3">{formatNumber(row.avg_csat)}</td>
                            <td className="border-b border-slate-200 px-3 py-3">{dsatRate}%</td>
                            <td className="border-b border-slate-200 px-3 py-3">{row.severity || "Moderate"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">DSAT root cause</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={csatRootCauseData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={4}>
                        {csatRootCauseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#2563eb", "#f59e0b", "#ef4444"][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Verbatim review</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    {csatFiltered.slice(0, 5).map((row: DataRow, idx: number) => (
                      <div key={`verbatim-${idx}`} className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{row.agent_name || "Agent"}</p>
                        <p className="mt-2">{row.comment || row.verbatim || "No detailed comment available."}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "qa" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {qaVendorTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQaVendorTab(tab.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${qaVendorTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {loadingQa ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading QA metrics...</div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Avg vendor QA</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(qaSummary.avgVendor)}%</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Avg Flix QA</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(qaSummary.avgFlix)}%</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Discrepancy rate</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{qaSummary.discrepancyRate}%</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">ZT count</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{qaSummary.ztCount}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Agents below 85</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{qaSummary.below85}</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-900">Flix vs Vendor trend</h3>
                  </div>
                  <div className="p-5" style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={qaSummary.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="vendor" stroke="#2563eb" />
                        <Line type="monotone" dataKey="flix" stroke="#10b981" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                      <h3 className="text-lg font-semibold text-slate-900">Matched cases</h3>
                    </div>
                    <div className="overflow-auto px-6 py-4">
                      <table className="min-w-full text-left text-sm text-slate-700">
                        <thead>
                          <tr>
                            <th className="border-b border-slate-200 px-3 py-3">Agent</th>
                            <th className="border-b border-slate-200 px-3 py-3">Score</th>
                            <th className="border-b border-slate-200 px-3 py-3">Reviewer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qaSummary.matchedCases.map((row: DataRow, idx: number) => (
                            <tr key={`match-${idx}`} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                              <td className="border-b border-slate-200 px-3 py-3 font-medium">{row.agent_name}</td>
                              <td className="border-b border-slate-200 px-3 py-3">{formatNumber(Number(row.score ?? 0) * 100)}%</td>
                              <td className="border-b border-slate-200 px-3 py-3">{row.reviewer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                      <h3 className="text-lg font-semibold text-slate-900">Agent score summary</h3>
                    </div>
                    <div className="overflow-auto px-6 py-4">
                      <table className="min-w-full text-left text-sm text-slate-700">
                        <thead>
                          <tr>
                            <th className="border-b border-slate-200 px-3 py-3">Agent</th>
                            <th className="border-b border-slate-200 px-3 py-3">W1</th>
                            <th className="border-b border-slate-200 px-3 py-3">W2</th>
                            <th className="border-b border-slate-200 px-3 py-3">W3</th>
                            <th className="border-b border-slate-200 px-3 py-3">W4</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qaSummary.agentRows.slice(0, 8).map((agent: QaAgentRow, idx: number) => (
                            <tr key={`qa-agent-${idx}`} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                              <td className="border-b border-slate-200 px-3 py-3 font-medium">{agent.name}</td>
                              {(agent.values ?? [0, 0, 0, 0]).map((value, valueIndex) => (
                                <td key={`${agent.name}-qa-${valueIndex}`} className="border-b border-slate-200 px-3 py-3">
                                  {formatNumber(value)}%
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                      <h3 className="text-lg font-semibold text-slate-900">Comment themes</h3>
                    </div>
                    <div className="p-5">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={qaSummary.comments} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="theme" width={120} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#2563eb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                      <h3 className="text-lg font-semibold text-slate-900">I-NPS distribution</h3>
                    </div>
                    <div className="p-5 space-y-3">
                      {qaSummary.inps.map((item) => (
                        <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                            <span>{item.label}</span>
                            <span>{item.value}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-slate-800" style={{ width: `${item.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
