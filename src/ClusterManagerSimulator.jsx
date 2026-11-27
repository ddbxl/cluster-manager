import { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

// ─────────────────────────────────────────────────────────────
// EU regional reference data
// 27 countries · 180 NUTS regions · 14 industrial ecosystems.
// ─────────────────────────────────────────────────────────────

const DATA_ECOSYSTEMS = [{"id": "energy_renewables", "name": "Energy-Renewables", "icon": "leaf", "color": "#34d399"}, {"id": "agri_food", "name": "Agri-food", "icon": "wheat-awn", "color": "#4ade80"}, {"id": "mobility_transport", "name": "Mobility, Transport, Automotive", "icon": "car", "color": "#60a5fa"}, {"id": "digital", "name": "Digital", "icon": "display", "color": "#38bdf8"}, {"id": "health", "name": "Health", "icon": "hospital", "color": "#f87171"}, {"id": "energy_intensive_i", "name": "Energy Intensive Industries", "icon": "industry", "color": "#fb923c"}, {"id": "tourism", "name": "Tourism", "icon": "plane", "color": "#2dd4bf"}, {"id": "construction", "name": "Construction", "icon": "trowel", "color": "#f0a020"}, {"id": "creative_and_cultu", "name": "Creative and Cultural Industries", "icon": "palette", "color": "#c084fc"}, {"id": "electronics", "name": "Electronics", "icon": "microchip", "color": "#facc15"}, {"id": "aerospace_and_defe", "name": "Aerospace and Defence", "icon": "rocket", "color": "#94a3b8"}, {"id": "proximity_and_soci", "name": "Proximity and Social Economy", "icon": "handshake", "color": "#a78bfa"}, {"id": "textiles", "name": "Textiles", "icon": "shirt", "color": "#f472b6"}, {"id": "retail", "name": "Retail", "icon": "bag-shopping", "color": "#fb7185"}];

const RIS_MODIFIER = {
  "Leader":           { budget: 1.40, members: 1.6, prestige: 6 },
  "Strong, Leader":   { budget: 1.35, members: 1.5, prestige: 6 },
  "Strong":           { budget: 1.20, members: 1.3, prestige: 4 },
  "Moderate, Strong, Leader": { budget: 1.20, members: 1.3, prestige: 4 },
  "Moderate, Strong": { budget: 1.05, members: 1.1, prestige: 2 },
  "Moderate":         { budget: 1.00, members: 1.0, prestige: 0 },
  "Emerging":         { budget: 0.85, members: 0.8, prestige: -2 },
  "":                 { budget: 1.00, members: 1.0, prestige: 0 },
};

const REGIONS_BY_COUNTRY = {"Austria": [{"name": "Austria", "nuts": "AT", "ecos": ["Construction", "Cross-ecosystem", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Burgenland", "nuts": "AT11", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Carinthia", "nuts": "AT21", "ecos": ["Electronics", "Energy Intensive Industries", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Lower Austria", "nuts": "AT12", "ecos": ["Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong", "coh": "More Developed"}, {"name": "Salzburg", "nuts": "AT32", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Styria", "nuts": "AT22", "ecos": ["Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Strong", "coh": "More Developed"}, {"name": "Tyrol", "nuts": "AT33", "ecos": ["Construction", "Cross-ecosystem", "Digital", "Energy-Renewables"], "ris": "Strong", "coh": "More Developed"}, {"name": "Upper Austria", "nuts": "AT31", "ecos": ["Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "More Developed"}, {"name": "Vienna", "nuts": "AT13", "ecos": ["Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "More Developed"}, {"name": "Vorarlberg", "nuts": "AT34", "ecos": ["Agri-food", "Cross-ecosystem", "Energy-Renewables", "Health", "Textiles"], "ris": "Strong", "coh": "More Developed"}], "Belgium": [{"name": "Brussels Capital Region", "nuts": "BE1", "ecos": ["Agri-food", "Construction", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Leader", "coh": "More Developed"}, {"name": "Flanders", "nuts": "BE2", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail"], "ris": "Leader", "coh": "Transition, More Developed"}, {"name": "Wallonia", "nuts": "BE3", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Less Developed, Transition, More Developed"}], "Bulgaria": [{"name": "Severozapaden", "nuts": "BG31", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Severen tsentralen", "nuts": "BG32", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Severoiztochen", "nuts": "BG33", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Yugoiztochen", "nuts": "BG34", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Yugozapaden", "nuts": "BG41", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Yuzhen tsentralen", "nuts": "BG42", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}], "Cyprus": [{"name": "Cyprus", "nuts": "CY", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}], "Czech Republic": [{"name": "Prague", "nuts": "CZ01", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Central Bohemia", "nuts": "CZ02", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Southwest", "nuts": "CZ03", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Northwest", "nuts": "CZ04", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Northeast", "nuts": "CZ05", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Southeast", "nuts": "CZ06", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Central Moravia", "nuts": "CZ07", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Moravian-Silesia", "nuts": "CZ08", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}], "Germany": [{"name": "Baden-Württemberg", "nuts": "DE1", "ecos": ["Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong, Leader", "coh": "More Developed"}, {"name": "Bavaria", "nuts": "DE2", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong, Leader", "coh": "More Developed"}, {"name": "Berlin", "nuts": "DE3", "ecos": ["Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Brandenburg", "nuts": "DE4", "ecos": ["Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Transition"}, {"name": "Bremen", "nuts": "DE5", "ecos": ["Aerospace and Defence", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "More Developed"}, {"name": "Hamburg", "nuts": "DE6", "ecos": ["Aerospace and Defence", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Hesse", "nuts": "DE7", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong", "coh": "More Developed"}, {"name": "Lower Saxony", "nuts": "DE9", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong", "coh": "Transition, More Developed"}, {"name": "Mecklenburg-Vorpommern", "nuts": "DE8", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Transition"}, {"name": "North Rhine-Westphalia", "nuts": "DEA", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate, Strong, Leader", "coh": "More Developed"}, {"name": "Rhineland-Palatinate", "nuts": "DEB", "ecos": ["Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong", "coh": "Transition, More Developed"}, {"name": "Saarland", "nuts": "DEC", "ecos": ["Digital", "Electronics", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Saxony", "nuts": "DED", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong", "coh": "Transition, More Developed"}, {"name": "Saxony-Anhalt", "nuts": "DEE", "ecos": ["Agri-food", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Transition"}, {"name": "Schleswig-Holstein", "nuts": "DEF", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "More Developed"}, {"name": "Thuringia", "nuts": "DEG", "ecos": ["Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Transition"}], "Denmark": [{"name": "Capital Region", "nuts": "DK01", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "Zealand", "nuts": "DK02", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "Southern Denmark", "nuts": "DK03", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "Central Jutland", "nuts": "DK04", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "North Jutland", "nuts": "DK05", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}], "Estonia": [{"name": "Estonia", "nuts": "EE", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}], "Greece": [{"name": "Attica", "nuts": "EL30", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "North Aegean", "nuts": "EL41", "ecos": ["Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Proximity and Social Economy", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "South Aegean", "nuts": "EL42", "ecos": ["Agri-food", "Cross-ecosystem", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Transition"}, {"name": "Crete", "nuts": "EL43", "ecos": ["Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Health", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Eastern Macedonia & Thrace", "nuts": "EL51", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Central Macedonia", "nuts": "EL52", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Western Macedonia", "nuts": "EL53", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Textiles", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Epirus", "nuts": "EL54", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Thessaly", "nuts": "EL61", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Ionian Islands", "nuts": "EL62", "ecos": ["Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Western Greece", "nuts": "EL63", "ecos": ["Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy-Renewables", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Central Greece", "nuts": "EL64", "ecos": ["Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Energy Intensive Industries", "Energy-Renewables", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Peloponnese", "nuts": "EL65", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Energy Intensive Industries", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}], "Spain": [{"name": "Andalusia", "nuts": "ES61", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Aragon", "nuts": "ES24", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Asturias", "nuts": "ES12", "ecos": ["Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Balearic Islands", "nuts": "ES53", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Basque Country", "nuts": "ES21", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "More Developed"}, {"name": "Canary Islands", "nuts": "ES70", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Cantabria", "nuts": "ES13", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Castile and León", "nuts": "ES41", "ecos": ["Agri-food", "Construction", "Digital", "Health"], "ris": "Moderate", "coh": "Transition"}, {"name": "Castile-La Mancha", "nuts": "ES42", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Catalonia", "nuts": "ES51", "ecos": ["Agri-food", "Cross-ecosystem", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "More Developed"}, {"name": "Extremadura", "nuts": "ES43", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Galicia", "nuts": "ES11", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health"], "ris": "Moderate", "coh": "Transition"}, {"name": "La Rioja", "nuts": "ES23", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Transition"}, {"name": "Madrid", "nuts": "ES30", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Strong", "coh": "More Developed"}, {"name": "Murcia", "nuts": "ES62", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Navarre", "nuts": "ES22", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Spain", "nuts": "ES", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Valencia", "nuts": "ES52", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Health", "Textiles", "Tourism"], "ris": "Strong", "coh": "Transition"}], "Finland": [{"name": "Central Finland", "nuts": "FI193", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Textiles"], "ris": "Strong", "coh": "Transition"}, {"name": "Central Ostrobothnia", "nuts": "FI1D5", "ecos": ["Aerospace and Defence", "Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Proximity and Social Economy", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Helsinki Uusimaa", "nuts": "FI1B1", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health"], "ris": "Leader", "coh": "More Developed"}, {"name": "Kainuu", "nuts": "FI1D8", "ecos": ["Aerospace and Defence", "Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Kanta-Häme", "nuts": "FI1C2", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy-Renewables", "Textiles"], "ris": "Strong", "coh": "Transition"}, {"name": "Kymenlaakso", "nuts": "FI1C4", "ecos": ["Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Transition"}, {"name": "Lapland", "nuts": "FI1D7", "ecos": ["Electronics", "Energy Intensive Industries", "Energy-Renewables", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "North Karelia", "nuts": "FI1D3", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Textiles", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "North Ostrobothnia", "nuts": "FI1D9", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "North Savo", "nuts": "FI1D2", "ecos": ["Agri-food", "Creative and Cultural Industries", "Energy-Renewables", "Health", "Textiles", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Ostrobothnia", "nuts": "FI195", "ecos": ["Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Transition"}, {"name": "Pirkanmaa", "nuts": "FI197", "ecos": ["Aerospace and Defence", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Päijät-Häme", "nuts": "FI1C3", "ecos": ["Agri-food", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Satakunta", "nuts": "FI196", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Textiles", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "South Karelia", "nuts": "FI1C5", "ecos": ["Aerospace and Defence", "Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong", "coh": "Transition"}, {"name": "South Ostrobothnia", "nuts": "FI194", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "South Savo", "nuts": "FI1D1", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Southwest Finland", "nuts": "FI1C1", "ecos": ["Aerospace and Defence", "Agri-food", "Cross-ecosystem", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Transition"}], "France": [{"name": "Auvergne-Rhône-Alpes", "nuts": "FRK", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Strong", "coh": "Transition, More Developed"}, {"name": "Bourgogne-Franche-Comté", "nuts": "FRC", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Transition"}, {"name": "Brittany", "nuts": "FRH", "ecos": ["Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Transition"}, {"name": "Centre-Val de Loire", "nuts": "FRB", "ecos": ["Construction", "Creative and Cultural Industries", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Corsica", "nuts": "FRM0", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": ""}, {"name": "Grand Est", "nuts": "FRF", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Moderate", "coh": "Transition"}, {"name": "Guadeloupe", "nuts": "FRY1", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Guyane", "nuts": "FRY3", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Proximity and Social Economy", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Hauts-de-France", "nuts": "FRE", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Martinique", "nuts": "FRY2", "ecos": ["Agri-food", "Construction", "Digital", "Health"], "ris": "Moderate", "coh": "Transition"}, {"name": "Mayotte", "nuts": "FRY5", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Proximity and Social Economy", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Normandy", "nuts": "FRD", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Transition"}, {"name": "Nouvelle-Aquitaine", "nuts": "FRI", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Occitanie", "nuts": "FRJ", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "Transition"}, {"name": "Pays de la Loire", "nuts": "FRG", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Moderate", "coh": "Transition"}, {"name": "Provence-Alpes-Côte d'Azur", "nuts": "FRL", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Réunion", "nuts": "FRY4", "ecos": ["Agri-food", "Cross-ecosystem", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Île-de-France", "nuts": "FR1", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Leader", "coh": "More Developed"}], "Croatia": [{"name": "Pannonian Croatia", "nuts": "HR02", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Adriatic Croatia", "nuts": "HR03", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "City of Zagreb", "nuts": "HR05", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Northern Croatia", "nuts": "HR06", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}], "Hungary": [{"name": "Budapest", "nuts": "HU11", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Pest", "nuts": "HU12", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Central Transdanubia", "nuts": "HU21", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Western Transdanubia", "nuts": "HU22", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Southern Transdanubia", "nuts": "HU23", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Northern Hungary", "nuts": "HU31", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Northern Great Plain", "nuts": "HU32", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Southern Great Plain", "nuts": "HU33", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}], "Ireland": [{"name": "Northern & Western", "nuts": "IE04", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}, {"name": "Southern", "nuts": "IE05", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}, {"name": "Eastern & Midland", "nuts": "IE06", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}], "Italy": [{"name": "Abruzzo", "nuts": "ITF1", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Electronics", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Aosta Valley", "nuts": "ITC2", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Emerging", "coh": "More Developed"}, {"name": "Basilicata", "nuts": "ITF5", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Calabria", "nuts": "ITF6", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Campania", "nuts": "ITF3", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Emilia-Romagna", "nuts": "ITH5", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Friuli-Venezia Giulia", "nuts": "ITH4", "ecos": ["Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Italy", "nuts": "IT", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Lazio", "nuts": "ITI4", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Liguria", "nuts": "ITC3", "ecos": ["Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Lombardy", "nuts": "ITC4", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Marche", "nuts": "ITI3", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Molise", "nuts": "ITF2", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Piedmont", "nuts": "ITC1", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Puglia", "nuts": "ITF4", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Sardinia", "nuts": "ITG2", "ecos": ["Construction", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Sicily", "nuts": "ITG1", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "South Tyrol", "nuts": "ITH1", "ecos": ["Agri-food", "Construction", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Trentino", "nuts": "ITH2", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong", "coh": "More Developed"}, {"name": "Tuscany", "nuts": "ITI1", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Umbria", "nuts": "ITI2", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Veneto", "nuts": "ITH3", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "More Developed"}], "Lithuania": [{"name": "Capital Region", "nuts": "LT01", "ecos": ["Digital", "Electronics", "Health"], "ris": "Moderate"}, {"name": "Central & Western Lithuania", "nuts": "LT02", "ecos": ["Digital", "Electronics", "Health"], "ris": "Moderate"}], "Luxembourg": [{"name": "Luxembourg", "nuts": "LU", "ecos": ["Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Strong"}], "Latvia": [{"name": "Latvia", "nuts": "LV", "ecos": ["Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}], "Malta": [{"name": "Malta", "nuts": "MT", "ecos": ["Aerospace and Defence", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}], "Netherlands": [{"name": "East Netherlands", "nuts": "NL2", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Health", "Textiles"], "ris": "Strong, Leader", "coh": "Transition, More Developed"}, {"name": "North Netherlands", "nuts": "NL1", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Strong, Leader", "coh": "Transition, More Developed"}, {"name": "South Netherlands", "nuts": "NL4", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Leader", "coh": "More Developed"}, {"name": "West Netherlands", "nuts": "NL3", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong, Leader", "coh": "More Developed"}], "Poland": [{"name": "Greater Poland", "nuts": "PL41", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging", "coh": "Transition"}, {"name": "Kuyavia-Pomerania", "nuts": "PL61", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Lesser Poland", "nuts": "PL21", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Lower Silesia", "nuts": "PL51", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Transition"}, {"name": "Lublin", "nuts": "PL81", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Lubusz", "nuts": "PL43", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Masovia", "nuts": "PL92", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Health"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Opole", "nuts": "PL52", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Podlasie", "nuts": "PL84", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Poland", "nuts": "PL", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Pomerania", "nuts": "PL63", "ecos": ["Agri-food", "Construction", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Silesia", "nuts": "PL22", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Subcarpathia", "nuts": "PL82", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Warmia-Masuria", "nuts": "PL62", "ecos": ["Agri-food", "Construction", "Energy-Renewables", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "West Pomerania", "nuts": "PL42", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Łódź", "nuts": "PL71", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Świętokrzyskie", "nuts": "PL72", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}], "Portugal": [{"name": "Alentejo", "nuts": "PT18", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Algarve", "nuts": "PT15", "ecos": ["Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate", "coh": "Transition"}, {"name": "Azores", "nuts": "PT20", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Centre", "nuts": "PT16", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Lisbon Metropolitan Area", "nuts": "PT17", "ecos": ["Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Madeira", "nuts": "PT30", "ecos": ["Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "North", "nuts": "PT11", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate", "coh": "Less Developed"}, {"name": "Portugal", "nuts": "PT", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}], "Romania": [{"name": "Bucharest-Ilfov", "nuts": "RO32", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "More Developed"}, {"name": "Centre", "nuts": "RO12", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "North-East", "nuts": "RO21", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Textiles", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "North-West", "nuts": "RO11", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Health"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "Romania", "nuts": "RO", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Emerging"}, {"name": "South-East", "nuts": "RO22", "ecos": ["Agri-food", "Digital", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "South-Muntenia", "nuts": "RO31", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "South-West Oltenia", "nuts": "RO41", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging", "coh": "Less Developed"}, {"name": "West", "nuts": "RO42", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging", "coh": "Less Developed"}], "Sweden": [{"name": "Blekinge", "nuts": "SE221", "ecos": ["Cross-ecosystem", "Digital", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Dalarna", "nuts": "SE312", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Gotland", "nuts": "SE214", "ecos": ["Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong", "coh": "More Developed"}, {"name": "Gävleborg", "nuts": "SE313", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Strong", "coh": "Transition"}, {"name": "Halland", "nuts": "SE231", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Jämtland", "nuts": "SE322", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Jönköping", "nuts": "SE211", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Mobility, Transport, Automotive", "Retail", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Kalmar", "nuts": "SE213", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Kronoberg", "nuts": "SE212", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries"], "ris": "Strong", "coh": "More Developed"}, {"name": "Norrbotten", "nuts": "SE332", "ecos": ["Aerospace and Defence", "Creative and Cultural Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Skåne", "nuts": "SE224", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Leader", "coh": "More Developed"}, {"name": "Stockholm", "nuts": "SE110", "ecos": ["Construction", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Södermanland", "nuts": "SE122", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Uppsala", "nuts": "SE121", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Leader", "coh": "More Developed"}, {"name": "Värmland", "nuts": "SE311", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "Transition"}, {"name": "Västerbotten", "nuts": "SE331", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong", "coh": "More Developed"}, {"name": "Västernorrland", "nuts": "SE321", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Moderate", "coh": "More Developed"}, {"name": "Västmanland", "nuts": "SE125", "ecos": ["Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Västra Götaland", "nuts": "SE232", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Leader", "coh": "More Developed"}, {"name": "Örebro", "nuts": "SE124", "ecos": ["Agri-food", "Digital", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}, {"name": "Östergötland", "nuts": "SE123", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader", "coh": "More Developed"}], "Slovenia": [{"name": "Eastern Slovenia", "nuts": "SI03", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Western Slovenia", "nuts": "SI04", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}], "Slovakia": [{"name": "Bratislava Region", "nuts": "SK01", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Western Slovakia", "nuts": "SK02", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Central Slovakia", "nuts": "SK03", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Eastern Slovakia", "nuts": "SK04", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}]};

const DATA_COUNTRIES = Object.keys(REGIONS_BY_COUNTRY).sort();

const DATA_NAME_TO_ISO = {"Austria": "AT", "Belgium": "BE", "Bulgaria": "BG", "Croatia": "HR", "Cyprus": "CY", "Czech Republic": "CZ", "Denmark": "DK", "Estonia": "EE", "Finland": "FI", "France": "FR", "Germany": "DE", "Greece": "GR", "Hungary": "HU", "Ireland": "IE", "Italy": "IT", "Latvia": "LV", "Lithuania": "LT", "Luxembourg": "LU", "Malta": "MT", "Netherlands": "NL", "Poland": "PL", "Portugal": "PT", "Romania": "RO", "Slovakia": "SK", "Slovenia": "SI", "Spain": "ES", "Sweden": "SE"};

function ecosystemAligns(region, ecosystemName) {
  if (!region || !region.ecos) return false;
  return region.ecos.includes(ecosystemName) || region.ecos.includes('Cross-ecosystem');
}


/* ═══════════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════════ */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;background:var(--page-bg,#F5F7FA);overflow:hidden;font-size:13px;line-height:1.5}
html.dark{--page-bg:#0A1430;--scroll-bg:#0F1B3D;--scroll-thumb:#243461}
body{-webkit-text-size-adjust:100%;text-size-adjust:100%;font-variant-numeric:tabular-nums;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
::-webkit-scrollbar{width:5px;height:5px;background:var(--scroll-bg,#e4ecf7)}
::-webkit-scrollbar-thumb{background:var(--scroll-thumb,#aabdd8)}

/* ── motion system ─────────────────────────────────────────── */
.btn{transition:background .12s ease,border-color .12s ease,color .12s ease}
.btn:hover:not(:disabled){filter:brightness(.96)}
.btn:active:not(:disabled){filter:brightness(.90)}
.btn:focus-visible{outline:2px solid #1B49C4;outline-offset:1px}

/* One shape carries the identity: primary actions have a single clipped corner,
   like a stamped file rather than a rounded pill. Everything else stays square
   so the cut corner reads as a signal, not decoration. */
.cut{clip-path:polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 0 100%)}
.cut-sm{clip-path:polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%)}

/* Surfaces. Sheets are fixed panels attached to the screen edge: square, no
   shadow, divided from the map by one rule. Floating things (cards over the map,
   tooltips, the turn button) get a 6px radius and a single crisp shadow, so the
   radius itself says "this sits above the map". */
.sheet{background:#FFFFFF !important;border:none !important;border-radius:0 !important;box-shadow:none !important}
.sheet-left{border-right:1px solid #D9DFEA !important}
.sheet-right{border-left:1px solid #D9DFEA !important}
html.dark .sheet{background:#0F1B3D !important}
html.dark .sheet-left{border-right-color:#243461 !important}
html.dark .sheet-right{border-left-color:#243461 !important}
.sheet > div{background:transparent !important;border:none !important}
.glass{background:#FFFFFF !important;border:1px solid #D9DFEA !important;border-radius:6px !important;box-shadow:0 1px 0 rgba(11,27,63,.04),0 6px 20px rgba(11,27,63,.10) !important}
html.dark .glass{background:#0F1B3D !important;border-color:#243461 !important;box-shadow:0 6px 20px rgba(0,0,0,.4) !important}
.glass-flat{background:#FFFFFF !important;border-bottom:1px solid #D9DFEA !important}
html.dark .glass-flat{background:#0F1B3D !important;border-bottom-color:#243461 !important}
.title-caps{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:600;letter-spacing:-.2px;color:#0B1B3F}
html.dark .title-caps{color:#EEF2FA}
.card-btn{background:#FFFFFF !important;border:1px solid #D9DFEA !important;border-radius:6px !important}
html.dark .card-btn{background:#0F1B3D !important;border-color:#243461 !important}
.card-btn:hover:not(:disabled),.card-btn:focus-visible{border-color:#1F4BD8 !important;background:#F2F5FD !important;filter:none;outline:none}
html.dark .card-btn:hover:not(:disabled),html.dark .card-btn:focus-visible{border-color:#7C9BFF !important;background:#16244A !important}
.orb{min-width:176px;height:48px;border-radius:6px !important;background:#1F4BD8 !important;border:none !important;color:#FFFFFF !important;box-shadow:0 6px 18px rgba(31,75,216,.28) !important;display:flex;align-items:center;justify-content:center;padding:0 22px !important;font-size:15px;font-weight:600}
.orb:hover:not(:disabled){background:#1A40BA !important;filter:none}
.orb:disabled{background:#D9DFEA !important;color:#5A6785 !important;box-shadow:none !important}
html.dark .orb{background:#7C9BFF !important;color:#0A1430 !important}
html.dark .orb:disabled{background:#243461 !important;color:#9AA8C8 !important}
.orb-sm{height:48px;min-width:64px;border-radius:6px !important;background:#FFFFFF !important;border:1px solid #D9DFEA !important;padding:0 14px !important;display:flex;align-items:center;justify-content:center}
.orb-sm:hover:not(:disabled){border-color:#1F4BD8 !important;filter:none}
html.dark .orb-sm{background:#0F1B3D !important;border-color:#243461 !important}
/* Figures: label over value, values large and tabular. */
.figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 16px;margin:12px 0 6px}
.figs div{min-width:0}
.figs dt{font-size:11.5px;color:#5A6785;margin:0;display:flex;align-items:center;gap:5px}
.figs dd{font-size:17px;font-weight:600;margin:1px 0 0;color:#0B1B3F;font-variant-numeric:tabular-nums}
html.dark .figs dt{color:#9AA8C8}
html.dark .figs dd{color:#EEF2FA}
/* Conditions read as a short list: met ones quiet, unmet ones in red. */
.conds{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px}
.conds li::before{display:inline-block;width:14px;font-weight:700}
.conds .met{color:#5A6785}.conds .met::before{content:"✓";color:#0F7B4A}
.conds .unmet{color:#B00E28}.conds .unmet::before{content:"✕"}
html.dark .conds .met{color:#9AA8C8}
.partners{display:flex;align-items:center;gap:12px;margin-top:10px;font-size:12px;color:#5A6785}
.partners input{flex:1;accent-color:#1F4BD8}
.partners .tnum{min-width:2ch;text-align:right;color:#0B1B3F;font-weight:600}
html.dark .partners .tnum{color:#EEF2FA}
.menu-scope .btn.act{display:block;margin-top:10px;padding:6px 0 !important;font-size:13.5px;font-weight:600;color:#1F4BD8}
html.dark .menu-scope .btn.act{color:#7C9BFF}
.menu-scope .btn.act:disabled{color:#5A6785}
.rows{display:grid;grid-template-columns:1fr auto;gap:3px 10px;margin:10px 0 0;font-size:12px}
.rows dt{color:#5A6785;margin:0;display:flex;align-items:center;gap:7px}.rows dd{margin:0;text-align:right;color:#0B1B3F;font-variant-numeric:tabular-nums}
html.dark .rows dt{color:#9AA8C8} html.dark .rows dd{color:#EEF2FA}
.glass-flat .btn:hover:not(:disabled){background:#EEF2F7 !important;filter:none}
html.dark .glass-flat .btn:hover:not(:disabled){background:#16244A !important}
.setup input,.setup select{border-radius:8px !important;border-style:solid !important;padding:10px 12px !important;font-size:13px !important;background:#FFFFFF}
html.dark .setup input,html.dark .setup select{background:#0F1B3D}
.setup .btn{border-radius:8px}
.setup .btn:hover:not(:disabled){filter:none;border-color:#1F4BD8}
.facts{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:#5A6785;line-height:1.3}
html.dark .facts{color:#9AA8C8}
.fact{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.seat-row{display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;cursor:help}
.locked{list-style:none;margin:0;padding:0}
.locked li{display:grid;grid-template-columns:auto 1fr auto;gap:2px 9px;align-items:center;padding:9px 0;border-top:1px solid #D9DFEA;font-size:12.5px}
html.dark .locked li{border-top-color:#243461}
.locked .need{grid-column:2 / 4;font-size:12px;color:#B00E28}
html.dark .locked .need{color:#FF97A0}
span[style*="padding: 2px 7px"],span[style*="padding:2px 7px"],span[style*="padding: 2px 8px"],span[style*="padding:2px 8px"],span[style*="padding: 3px 0px"],span[style*="padding:3px 0"]{border:none !important;background:transparent !important;padding:0 !important;font-weight:600}
/* Segmented control: one rounded track, the chosen option filled. */
.seg{display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:2px;border-radius:8px;background:#EEF2F7}
html.dark .seg{background:#16244A}
.seg .btn{border:none !important;border-radius:6px !important;background:transparent !important;padding:5px 4px !important;font-size:11.5px !important;color:#5A6785 !important;font-weight:500}
html.dark .seg .btn{color:#9AA8C8 !important}
.seg .btn[aria-pressed="true"]{background:#FFFFFF !important;color:#0B1B3F !important;box-shadow:0 1px 2px rgba(11,27,63,.12)}
html.dark .seg .btn[aria-pressed="true"]{background:#0F1B3D !important;color:#EEF2FA !important}
.btn.link{display:inline-flex;align-items:center;gap:7px;background:transparent;border:none;padding:4px 0;color:#1F4BD8;font-size:13px;font-weight:500;text-underline-offset:3px}
.btn.link:hover:not(:disabled){text-decoration:underline;filter:none}
html.dark .btn.link{color:#7C9BFF}
/* Staff */
.team{list-style:none;margin:0 0 4px;padding:0}
.team li{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid #D9DFEA;font-size:12.5px}
.team .nm{color:#0B1B3F}.team .mu{color:#5A6785}
html.dark .team li{border-top-color:#243461} html.dark .team .nm{color:#EEF2FA} html.dark .team .mu{color:#9AA8C8}
.menu-scope .btn.fire{color:#B00E28 !important;font-size:12px;padding:2px 0 !important}
.hire-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
.btn.hire-tile{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;padding:11px 10px !important;min-height:96px;border:1px solid #D9DFEA !important;border-radius:8px !important;background:#FFFFFF !important;text-decoration:none !important}
.btn.hire-tile:hover:not(:disabled),.btn.hire-tile:focus-visible{border-color:#1F4BD8 !important;background:#F2F5FD !important}
.btn.hire-tile:disabled{opacity:.55}
.hire-tile .nm{font-size:12px;font-weight:500;color:#0B1B3F;line-height:1.25}
.hire-tile .pr{font-size:12px;color:#5A6785;margin-top:auto}
.hire-tile .cnt{position:absolute;top:8px;right:9px;font-size:11px;font-weight:600;color:#1F4BD8}
html.dark .btn.hire-tile{background:#0F1B3D !important;border-color:#243461 !important}
html.dark .btn.hire-tile:hover:not(:disabled){background:#16244A !important;border-color:#7C9BFF !important}
html.dark .hire-tile .nm{color:#EEF2FA} html.dark .hire-tile .pr{color:#9AA8C8}
.hire-detail{margin-top:10px;min-height:74px;padding:10px 12px;border-radius:8px;background:#F5F7FA;font-size:12px;line-height:1.5;color:#5A6785}
html.dark .hire-detail{background:#16244A;color:#9AA8C8}
/* Next stage */
.evo-head{display:flex;align-items:center;gap:16px;padding:4px 0 16px;border-bottom:1px solid #D9DFEA}
.evo-head .mu{font-size:11.5px;color:#5A6785}.evo-head .st{font-size:16px;font-weight:600;color:#0B1B3F;margin-top:2px}
.evo-reqs{list-style:none;margin:6px 0 16px;padding:0}
.evo-reqs li{display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:center;padding:10px 0;border-bottom:1px solid #EEF2F7;font-size:12.5px}
.evo-reqs .nm{color:#0B1B3F}.evo-reqs .v{color:#5A6785}
.evo-reqs .bar{grid-column:2 / 4;height:4px;border-radius:2px;background:#EEF2F7;overflow:hidden}
.evo-reqs .bar span{display:block;height:100%;border-radius:2px}
.btn.evo-go{width:100%;height:48px;border:none;border-radius:6px;background:#1F4BD8;color:#FFFFFF;font-size:14px;font-weight:600}
.btn.evo-go:hover:not(:disabled){background:#1A40BA;filter:none}
.btn.evo-go:disabled{background:#EEF2F7;color:#5A6785}
html.dark .evo-head{border-bottom-color:#243461} html.dark .evo-head .st,html.dark .evo-reqs .nm{color:#EEF2FA}
html.dark .evo-head .mu,html.dark .evo-reqs .v{color:#9AA8C8}
html.dark .evo-reqs li{border-bottom-color:#16244A} html.dark .evo-reqs .bar{background:#16244A}
html.dark .btn.evo-go{background:#7C9BFF;color:#0A1430} html.dark .btn.evo-go:disabled{background:#16244A;color:#9AA8C8}
.menu-scope .btn.evo-go{background:#1F4BD8 !important;color:#FFFFFF !important;padding:0 16px !important;text-decoration:none !important}
.menu-scope .btn.evo-go:disabled{background:#EEF2F7 !important;color:#5A6785 !important}
html.dark .menu-scope .btn.evo-go{background:#7C9BFF !important;color:#0A1430 !important}
.menu-scope .btn.hire-tile{text-decoration:none !important}
/* Rivals */
.mkt{display:flex;height:6px;border-radius:3px;overflow:hidden;background:#EEF2F7}
html.dark .mkt{background:#16244A}
.rival{padding:14px 0;border-top:1px solid #D9DFEA}
html.dark .rival{border-top-color:#243461}
.rv-head{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:start}
.rv-head .sw{width:10px;height:10px;border-radius:3px;margin-top:4px}
.rv-head .nm{font-size:13.5px;font-weight:600;color:#0B1B3F;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
html.dark .rv-head .nm{color:#EEF2FA}
.rv-head .tag{font-size:11.5px;font-weight:600;white-space:nowrap;margin-top:2px}
.rv-bars{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:9px}
.rv-bars > span{display:flex;align-items:center;gap:7px}
.rv-bars .bar{flex:1;height:4px;border-radius:2px;background:#EEF2F7;overflow:hidden}
html.dark .rv-bars .bar{background:#16244A}
.rv-bars .bar span{display:block;height:100%}
.ops{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.btn.op{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px !important;border:1px solid #D9DFEA !important;border-radius:6px !important;background:#FFFFFF !important;font-size:12px;color:#0B1B3F !important;text-decoration:none !important}
.btn.op:hover:not(:disabled){border-color:#1F4BD8 !important;background:#F2F5FD !important}
.btn.op:disabled{color:#5A6785 !important;opacity:.6}
html.dark .btn.op{background:#0F1B3D !important;border-color:#243461 !important;color:#EEF2FA !important}
/* Network */
.net-list{list-style:none;margin:12px 0 0;padding:0}
.net-list li{display:grid;grid-template-columns:auto minmax(0,1fr) 72px auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid #D9DFEA;font-size:12.5px}
.net-list .nm{color:#0B1B3F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.net-list .mu{color:#5A6785}
.net-list .bar{height:4px;border-radius:2px;background:#EEF2F7;overflow:hidden}
.net-list .bar span{display:block;height:100%;background:#1F4BD8}
html.dark .net-list li{border-top-color:#243461} html.dark .net-list .nm{color:#EEF2FA} html.dark .net-list .bar{background:#16244A}
/* End screen */
.end-figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 24px;margin:0 0 26px;text-align:left}
.end-figs dt{display:flex;align-items:center;gap:6px;font-size:12px;color:#5A6785;margin:0}
.end-figs dd{margin:3px 0 0;font-size:18px;font-weight:600;color:#0B1B3F;font-variant-numeric:tabular-nums}
html.dark .end-figs dt{color:#9AA8C8} html.dark .end-figs dd{color:#EEF2FA}
.ach{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#5A6785;margin:0 14px 6px 0}
.ach.got{color:#0B1B3F;font-weight:600}
html.dark .ach{color:#9AA8C8} html.dark .ach.got{color:#EEF2FA}
.seg .btn{text-decoration:none !important}
.btn.evo-go:disabled{opacity:1}
.btn.real-pick{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:8px 10px !important;border-radius:8px !important;border:1px solid transparent !important;background:#FFFFFF !important}
.btn.real-pick:hover{border-color:#1F4BD8 !important;filter:none}
.real-pick .nm{font-size:12.5px;font-weight:500;color:#0B1B3F}
.real-pick .mu{font-size:11.5px;color:#5A6785;display:inline-flex;align-items:center;gap:5px}
html.dark .btn.real-pick{background:#0F1B3D !important} html.dark .real-pick .nm{color:#EEF2FA} html.dark .real-pick .mu{color:#9AA8C8}
/* Running projects */
.ap-row{padding:10px 0;border-top:1px solid #D9DFEA}
.ap-row:first-of-type{border-top:none}
html.dark .ap-row{border-top-color:#243461}
.ap-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.ap-top .nm{font-size:13px;font-weight:500;color:#0B1B3F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html.dark .ap-top .nm{color:#EEF2FA}
.ap-top .st{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;white-space:nowrap}
.ap-top .dot{width:7px;height:7px;border-radius:50%}
.ap-bar{height:4px;border-radius:2px;background:#EEF2F7;margin-top:8px;overflow:hidden}
html.dark .ap-bar{background:#16244A}
.ap-bar span{display:block;height:100%;border-radius:2px;transition:width .4s}
.seat-full{padding:8px 0;border-top:1px solid #EEF2F7}
html.dark .seat-full{border-top-color:#16244A}
/* Resize handles between panels */
.resizer{position:absolute;z-index:62;touch-action:none}
.resizer.col{top:0;bottom:0;width:8px;cursor:col-resize}
.resizer.row{left:0;right:0;height:8px;cursor:row-resize}
.resizer::after{content:"";position:absolute;background:transparent;transition:background .15s}
.resizer.col::after{top:0;bottom:0;left:3px;width:2px}
.resizer.row::after{left:0;right:0;top:3px;height:2px}
.resizer:hover::after,.resizer.on::after{background:#1F4BD8}
html.dark .resizer:hover::after,html.dark .resizer.on::after{background:#7C9BFF}
/* The hover label on the map: sized to its content, wraps long names. */
.map-hover{position:absolute;z-index:47;pointer-events:none;max-width:240px;padding:9px 11px;background:#FFFFFF;border:1px solid #D9DFEA;border-radius:6px;box-shadow:0 6px 20px rgba(11,27,63,.12);font-size:12px;line-height:1.45;color:#0B1B3F}
html.dark .map-hover{background:#0F1B3D;border-color:#243461;color:#EEF2FA}

/* Inside a menu a button is plain text: no box, no fill. Hovering, focusing or
   pressing it draws an underline. The rules are forced because each button
   still carries its old box styling inline; this strips it in one place. */
.menu-scope .btn:not(.dot):not(.card-btn):not(.hire-tile):not(.evo-go):not(.op){background:transparent !important;border-color:transparent !important;box-shadow:none !important;clip-path:none !important;padding-left:2px !important;padding-right:2px !important;text-underline-offset:3px;text-decoration-thickness:1.5px}
.menu-scope .btn:not(.dot):not(.card-btn):not(.hire-tile):not(.evo-go):not(.op):hover:not(:disabled),.menu-scope .btn:not(.dot):not(.card-btn):not(.hire-tile):not(.evo-go):not(.op):focus-visible,.menu-scope .btn:not(.dot):not(.card-btn):not(.hire-tile):not(.evo-go):not(.op):active:not(:disabled){text-decoration:underline;filter:none}
.menu-scope .btn:disabled{cursor:not-allowed;text-decoration:none}
.menu-scope .btn:focus-visible{outline:none}
/* a chosen option stays underlined */
.menu-scope .btn[aria-pressed="true"]{text-decoration:underline;text-decoration-color:#1F4BD8;text-decoration-thickness:3px}
/* buttons that were white on a solid fill would vanish without the fill */
.menu-scope .btn[style*="color: rgb(255, 255, 255)"],.menu-scope .btn[style*="color:#FFFFFF"],.menu-scope .btn[style*="color:#fff"]{color:#1F4BD8 !important}
html.dark .menu-scope .btn[style*="color: rgb(10, 20, 48)"],html.dark .menu-scope .btn[style*="color:#0A1430"]{color:#7C9BFF !important}
/* a button in the ordinary text colour would read as a label, so it takes the action colour */
.menu-scope .btn[style*="color: rgb(11, 27, 63)"],.menu-scope .btn[style*="color:#0B1B3F"]{color:#1F4BD8 !important}
html.dark .menu-scope .btn[style*="color: rgb(238, 242, 250)"]{color:#7C9BFF !important}
.menu-tabs .btn:hover{text-decoration:underline;text-underline-offset:3px;filter:none}

/* Figures line up in columns without a monospace face. */
.tnum{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.bar-fill{transition:width .65s cubic-bezier(.22,1,.36,1)}
.modal-in{animation:modalIn .2s cubic-bezier(.22,1,.36,1) both}
.backdrop-in{animation:fadeIn .18s ease both}
.event-in{animation:eventIn .32s cubic-bezier(.22,1,.36,1) both}
.pulse-good{animation:pulseGood .8s ease-out}
.pulse-bad{animation:pulseBad .8s ease-out}
.flip-in{display:inline-block;animation:flipIn .4s cubic-bezier(.22,1,.36,1) both}
.log-in{animation:logIn .35s ease-out both}
.panel-fade{animation:panelFade .22s ease both}
@keyframes panelFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.wiggle{animation:wiggle .5s ease-in-out 1}
.glow-good{animation:glowGood 1.6s ease-in-out infinite}
.float-delta{position:absolute;font-family:"Helvetica Neue", Helvetica, Arial, sans-serif;font-weight:700;font-size:12px;pointer-events:none;animation:floatUp 1.4s ease-out both;white-space:nowrap;text-shadow:0 1px 3px var(--delta-halo,rgba(255,255,255,.85)),0 0 2px var(--delta-halo,rgba(255,255,255,.85))}
html.dark .float-delta{--delta-halo:rgba(5,10,20,.92)}
.confetti-bit{position:absolute;top:-14px;width:8px;height:12px;border-radius:2px;animation:confettiFall var(--dur,2.3s) cubic-bezier(.3,.4,.6,1) var(--delay,0s) both;pointer-events:none}
.map-home{animation:breathe 3.6s ease-in-out infinite}
.map-new{animation:regionPop 1.6s ease-out both}
.map-contested{animation:shimmer 2.6s ease-in-out infinite}

/* The wordmark is solid Reflex Blue. It was gradient-filled text, which depends
   on clipping a background to the glyphs and leaves the title invisible whenever
   that clip does not apply. Flat colour cannot fail, and suits the rest. */
.brand-title{color:#0B1B3F;font-weight:700 !important;letter-spacing:-2px !important}
html.dark .brand-title{color:#EEF2FA}
/* The map sea fills its whole panel edge-to-edge; the dot grid is a fixed-size CSS
   layer so it stays crisp no matter how the SVG map scales inside it. */
.map-sea{background:#CFDDEE}
html.dark .map-sea{background:#081131}
.threat-pulse{animation:threatPulse 2.4s ease-in-out infinite}
@keyframes threatPulse{0%,100%{box-shadow:0 0 0 0 var(--threat)}50%{box-shadow:0 0 0 3px color-mix(in srgb, var(--threat) 22%, transparent)}}



@keyframes modalIn{from{opacity:0;transform:scale(.955) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes eventIn{from{opacity:0;transform:translateY(-22px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes pulseGood{0%{box-shadow:0 0 0 0 rgba(36,161,72,.45);background:rgba(36,161,72,.14)}100%{box-shadow:0 0 0 12px rgba(36,161,72,0);background:transparent}}
@keyframes pulseBad{0%{box-shadow:0 0 0 0 rgba(218,30,40,.4);background:rgba(218,30,40,.12)}100%{box-shadow:0 0 0 12px rgba(218,30,40,0);background:transparent}}
@keyframes flipIn{from{opacity:0;transform:rotateX(75deg)}to{opacity:1;transform:rotateX(0)}}
@keyframes logIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes wiggle{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(2deg)}}
@keyframes glowGood{0%,100%{filter:drop-shadow(0 0 1px rgba(36,161,72,.4))}50%{filter:drop-shadow(0 0 7px rgba(36,161,72,.85))}}
@keyframes floatUp{0%{opacity:0;transform:translateY(4px)}12%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}
@keyframes confettiFall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:.85;transform:translateY(105vh) rotate(var(--spin,540deg))}}
@keyframes breathe{0%,100%{stroke-width:1;filter:none}50%{stroke-width:2.4;filter:drop-shadow(0 0 5px currentColor)}}
@keyframes regionPop{0%{fill-opacity:1;filter:drop-shadow(0 0 10px currentColor)}100%{filter:none}}
@keyframes shimmer{0%,100%{fill-opacity:.85}50%{fill-opacity:.5}}
to{background-position:-30% 0}}
.stage-pop{animation:stagePop .5s cubic-bezier(.2,1.4,.4,1) both}
@keyframes stagePop{0%{opacity:0;transform:scale(.6) translateY(14px)}60%{opacity:1}100%{opacity:1;transform:scale(1) translateY(0)}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
.btn{cursor:pointer;border:none;font-family:"Helvetica Neue", Helvetica, Arial, sans-serif;transition:all .12s;font-weight:700;-webkit-tap-highlight-color:transparent;touch-action:manipulation;font-size:inherit}
.btn:hover:not(:disabled){filter:brightness(0.94)}
.btn:active:not(:disabled){transform:translateY(0)}
.btn:disabled{opacity:.28;cursor:not-allowed!important;transform:none!important;filter:none!important}
@keyframes pulse{0%,100%{opacity:.2}50%{opacity:.6}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes geopulse{0%,100%{stroke-opacity:.3}50%{stroke-opacity:.8}}
.fadeup{animation:fadeUp .2s ease forwards}
input[type=range]{width:100%;accent-color:#3860ED;cursor:pointer}
`;

/* ═══════════════════════════════════════════════════════════
   PALETTE
═══════════════════════════════════════════════════════════ */
// EU Commission colour system (ECL v4); trailing comments name each token.
/* Paper, ink and one blue. Text is a deep navy ink, actions are blue, red and
   green only mark losses and gains. Secondary hues are muted so the rivals'
   colours on the map are the only saturated colour on screen besides blue. */
const P = {
  bg:"#F5F7FA",     panel:"#FFFFFF",   card:"#FFFFFF",   border:"#D9DFEA",
  bright:"#EEF2F7", text:"#0B1B3F",    muted:"#5A6785",
  accent:"#1F4BD8", blue:"#1F4BD8",    gold:"#1F4BD8",
  red:"#C8102E",    orange:"#A85A00",  green:"#0F7B4A",
  purple:"#3F4E86", teal:"#1B6A86",
  goldText:"#1F4BD8", greenText:"#0F7B4A", redText:"#B00E28",
  onAccent:"#FFFFFF",
};
// The light palette is kept as a copy: applyTheme swaps P back to it after dark mode.
const P_LIGHT = { ...P };
const P_DARK = {
  bg:"#0A1430",     panel:"#0F1B3D",   card:"#0F1B3D",   border:"#243461",
  bright:"#16244A", text:"#EEF2FA",    muted:"#9AA8C8",
  accent:"#7C9BFF", blue:"#7C9BFF",    gold:"#7C9BFF",
  red:"#FF7A85",    orange:"#F0A257",  green:"#4FCB8E",
  purple:"#A7B4E6", teal:"#7FC3DD",
  goldText:"#9DB4FF", greenText:"#6FD9A4", redText:"#FF97A0",
  onAccent:"#0A1430",
};
let THEME_DARK = false;
function applyTextScale(big) {
  if (typeof document === "undefined") return;
  // Inline font sizes are in px, so a root font-size change does nothing; zoom the app
  // container instead, and only on wider screens. On phones the fixed-height layout would
  // overflow the viewport, and native pinch-zoom already covers that need there.
  const root = document.getElementById("root") || document.documentElement;
  const wide = (typeof window !== "undefined" ? window.innerWidth : 1024) >= 900;
  root.style.zoom = (big && wide) ? "1.12" : "";
  document.documentElement.classList.toggle("text-lg", !!(big && wide));
}
function applyTheme(dark) {
  THEME_DARK = !!dark;
  Object.assign(P, dark ? P_DARK : P_LIGHT);
  if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", !!dark);
}
// Adjust any hex for legible text: darken on light backgrounds, lighten on dark ones
const darkHex = (h, f=0.5) => {
  const v = (h||"#26324B").replace("#","").slice(0,6);
  const ch = i => parseInt(v.slice(i,i+2),16);
  const mix = c => THEME_DARK ? Math.round(c + (255-c)*0.55) : Math.round(c*f);
  return "#" + [0,2,4].map(i => mix(ch(i)).toString(16).padStart(2,"0")).join("");
};

/* ═══════════════════════════════════════════════════════════
   ICONS: Font Awesome Free 6 (solid), CC BY 4.0 / MIT.
   Path data is embedded so the game makes no external request.
═══════════════════════════════════════════════════════════ */
const ICON_PATHS = {
  "file-csv":[512,512,"M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM200 352l16 0c22.1 0 40 17.9 40 40l0 8c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-8c0-4.4-3.6-8-8-8l-16 0c-4.4 0-8 3.6-8 8l0 80c0 4.4 3.6 8 8 8l16 0c4.4 0 8-3.6 8-8l0-8c0-8.8 7.2-16 16-16s16 7.2 16 16l0 8c0 22.1-17.9 40-40 40l-16 0c-22.1 0-40-17.9-40-40l0-80c0-22.1 17.9-40 40-40zm133.1 0l34.9 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-34.9 0c-7.2 0-13.1 5.9-13.1 13.1c0 5.2 3 9.9 7.8 12l37.4 16.6c16.3 7.2 26.8 23.4 26.8 41.2c0 24.9-20.2 45.1-45.1 45.1L304 512c-8.8 0-16-7.2-16-16s7.2-16 16-16l42.9 0c7.2 0 13.1-5.9 13.1-13.1c0-5.2-3-9.9-7.8-12l-37.4-16.6c-16.3-7.2-26.8-23.4-26.8-41.2c0-24.9 20.2-45.1 45.1-45.1zm98.9 0c8.8 0 16 7.2 16 16l0 31.6c0 23 5.5 45.6 16 66c10.5-20.3 16-42.9 16-66l0-31.6c0-8.8 7.2-16 16-16s16 7.2 16 16l0 31.6c0 34.7-10.3 68.7-29.6 97.6l-5.1 7.7c-3 4.5-8 7.1-13.3 7.1s-10.3-2.7-13.3-7.1l-5.1-7.7c-19.3-28.9-29.6-62.9-29.6-97.6l0-31.6c0-8.8 7.2-16 16-16z"],
  "link":[640,512,"M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"],
  "building":[384,512,"M48 0C21.5 0 0 21.5 0 48L0 464c0 26.5 21.5 48 48 48l96 0 0-80c0-26.5 21.5-48 48-48s48 21.5 48 48l0 80 96 0c26.5 0 48-21.5 48-48l0-416c0-26.5-21.5-48-48-48L48 0zM64 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm112-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM80 96l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM272 96l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16z"],
  "heart-pulse":[512,512,"M228.3 469.1L47.6 300.4c-4.2-3.9-8.2-8.1-11.9-12.4l87 0c22.6 0 43-13.6 51.7-34.5l10.5-25.2 49.3 109.5c3.8 8.5 12.1 14 21.4 14.1s17.8-5 22-13.3L320 253.7l1.7 3.4c9.5 19 28.9 31 50.1 31l104.5 0c-3.7 4.3-7.7 8.5-11.9 12.4L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9zM503.7 240l-132 0c-3 0-5.8-1.7-7.2-4.4l-23.2-46.3c-4.1-8.1-12.4-13.3-21.5-13.3s-17.4 5.1-21.5 13.3l-41.4 82.8L205.9 158.2c-3.9-8.7-12.7-14.3-22.2-14.1s-18.1 5.9-21.8 14.8l-31.8 76.3c-1.2 3-4.2 4.9-7.4 4.9L16 240c-2.6 0-5 .4-7.3 1.1C3 225.2 0 208.2 0 190.9l0-5.8c0-69.9 50.5-129.5 119.4-141C165 36.5 211.4 51.4 244 84l12 12 12-12c32.6-32.6 79-47.5 124.6-39.9C461.5 55.6 512 115.2 512 185.1l0 5.8c0 16.9-2.8 33.5-8.3 49.1z"],
  "sitemap":[576,512,"M208 80c0-26.5 21.5-48 48-48l64 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-8 0 0 40 152 0c30.9 0 56 25.1 56 56l0 32 8 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-64 0c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48l8 0 0-32c0-4.4-3.6-8-8-8l-152 0 0 40 8 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-64 0c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48l8 0 0-40-152 0c-4.4 0-8 3.6-8 8l0 32 8 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-64 0c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48l8 0 0-32c0-30.9 25.1-56 56-56l152 0 0-40-8 0c-26.5 0-48-21.5-48-48l0-64z"],
  "user-minus":[640,512,"M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM472 200l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"],
  "hourglass-half":[384,512,"M32 0C14.3 0 0 14.3 0 32S14.3 64 32 64l0 11c0 42.4 16.9 83.1 46.9 113.1L146.7 256 78.9 323.9C48.9 353.9 32 394.6 32 437l0 11c-17.7 0-32 14.3-32 32s14.3 32 32 32l32 0 256 0 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-11c0-42.4-16.9-83.1-46.9-113.1L237.3 256l67.9-67.9c30-30 46.9-70.7 46.9-113.1l0-11c17.7 0 32-14.3 32-32s-14.3-32-32-32L320 0 64 0 32 0zM96 75l0-11 192 0 0 11c0 19-5.6 37.4-16 53L112 128c-10.3-15.6-16-34-16-53zm16 309c3.5-5.3 7.6-10.3 12.1-14.9L192 301.3l67.9 67.9c4.6 4.6 8.6 9.6 12.1 14.9L112 384z"],
  "calendar-days":[448,512,"M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z"],
  "arrow-trend-up":[576,512,"M384 160c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0c17.7 0 32 14.3 32 32l0 160c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-82.7L342.6 374.6c-12.5 12.5-32.8 12.5-45.3 0L192 269.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 306.7 466.7 160 384 160z"],
  "map-location-dot":[576,512,"M408 120c0 54.6-73.1 151.9-105.2 192c-7.7 9.6-22 9.6-29.6 0C241.1 271.9 168 174.6 168 120C168 53.7 221.7 0 288 0s120 53.7 120 120zm8 80.4c3.5-6.9 6.7-13.8 9.6-20.6c.5-1.2 1-2.5 1.5-3.7l116-46.4C558.9 123.4 576 135 576 152l0 270.8c0 9.8-6 18.6-15.1 22.3L416 503l0-302.6zM137.6 138.3c2.4 14.1 7.2 28.3 12.8 41.5c2.9 6.8 6.1 13.7 9.6 20.6l0 251.4L32.9 502.7C17.1 509 0 497.4 0 480.4L0 209.6c0-9.8 6-18.6 15.1-22.3l122.6-49zM327.8 332c13.9-17.4 35.7-45.7 56.2-77l0 249.3L192 449.4 192 255c20.5 31.3 42.3 59.6 56.2 77c20.5 25.6 59.1 25.6 79.6 0zM288 152a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"],
  "location-dot":[384,512,"M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"],
  "percent":[384,512,"M374.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-320 320c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l320-320zM128 128A64 64 0 1 0 0 128a64 64 0 1 0 128 0zM384 384a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z"],
  "user-plus":[640,512,"M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"],
  "people-group":[640,512,"M72 88a56 56 0 1 1 112 0A56 56 0 1 1 72 88zM64 245.7C54 256.9 48 271.8 48 288s6 31.1 16 42.3l0-84.7zm144.4-49.3C178.7 222.7 160 261.2 160 304c0 34.3 12 65.8 32 90.5l0 21.5c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-26.8C26.2 371.2 0 332.7 0 288c0-61.9 50.1-112 112-112l32 0c24 0 46.2 7.5 64.4 20.3zM448 416l0-21.5c20-24.7 32-56.2 32-90.5c0-42.8-18.7-81.3-48.4-107.7C449.8 183.5 472 176 496 176l32 0c61.9 0 112 50.1 112 112c0 44.7-26.2 83.2-64 101.2l0 26.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32zm8-328a56 56 0 1 1 112 0A56 56 0 1 1 456 88zM576 245.7l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM320 32a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM240 304c0 16.2 6 31 16 42.3l0-84.7c-10 11.3-16 26.1-16 42.3zm144-42.3l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM448 304c0 44.7-26.2 83.2-64 101.2l0 42.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-42.8c-37.8-18-64-56.5-64-101.2c0-61.9 50.1-112 112-112l32 0c61.9 0 112 50.1 112 112z"],
  "city":[640,512,"M480 48c0-26.5-21.5-48-48-48L336 0c-26.5 0-48 21.5-48 48l0 48-64 0 0-72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 72-64 0 0-72c0-13.3-10.7-24-24-24S64 10.7 64 24l0 72L48 96C21.5 96 0 117.5 0 144l0 96L0 464c0 26.5 21.5 48 48 48l256 0 32 0 96 0 160 0c26.5 0 48-21.5 48-48l0-224c0-26.5-21.5-48-48-48l-112 0 0-144zm96 320l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16zM240 416l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16zM128 400c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32zM560 256c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0zM256 176l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16zM112 160c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0zM256 304c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32zM112 320l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16zm304-48l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16zM400 64c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0zm16 112l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16z"],
  "globe":[512,512,"M352 256c0 22.2-1.2 43.6-3.3 64l-185.3 0c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64l185.3 0c2.2 20.4 3.3 41.8 3.3 64zm28.8-64l123.1 0c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64l-123.1 0c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32l-116.7 0c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0l-176.6 0c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0L18.6 160C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192l123.1 0c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64L8.1 320C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6l176.6 0c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352l116.7 0zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6l116.7 0z"],
  "sliders":[512,512,"M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z"],
  "dice":[640,512,"M274.9 34.3c-28.1-28.1-73.7-28.1-101.8 0L34.3 173.1c-28.1 28.1-28.1 73.7 0 101.8L173.1 413.7c28.1 28.1 73.7 28.1 101.8 0L413.7 274.9c28.1-28.1 28.1-73.7 0-101.8L274.9 34.3zM200 224a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM96 200a24 24 0 1 1 0 48 24 24 0 1 1 0-48zM224 376a24 24 0 1 1 0-48 24 24 0 1 1 0 48zM352 200a24 24 0 1 1 0 48 24 24 0 1 1 0-48zM224 120a24 24 0 1 1 0-48 24 24 0 1 1 0 48zm96 328c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-114.3 0c11.6 36 3.1 77-25.4 105.5L320 413.8l0 34.2zM480 328a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"],
  "seedling":[512,512,"M512 32c0 113.6-84.6 207.5-194.2 222c-7.1-53.4-30.6-101.6-65.3-139.3C290.8 46.3 364 0 448 0l32 0c17.7 0 32 14.3 32 32zM0 96C0 78.3 14.3 64 32 64l32 0c123.7 0 224 100.3 224 224l0 32 0 160c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-160C100.3 320 0 219.7 0 96z"],
  "list-check":[512,512,"M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"],
  "chevron-right":[320,512,"M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"],
  "chevron-left":[320,512,"M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"],
  "plus":[448,512,"M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"],
  "minus":[448,512,"M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"],
  "hand-holding-dollar":[576,512,"M312 24l0 10.5c6.4 1.2 12.6 2.7 18.2 4.2c12.8 3.4 20.4 16.6 17 29.4s-16.6 20.4-29.4 17c-10.9-2.9-21.1-4.9-30.2-5c-7.3-.1-14.7 1.7-19.4 4.4c-2.1 1.3-3.1 2.4-3.5 3c-.3 .5-.7 1.2-.7 2.8c0 .3 0 .5 0 .6c.2 .2 .9 1.2 3.3 2.6c5.8 3.5 14.4 6.2 27.4 10.1l.9 .3s0 0 0 0c11.1 3.3 25.9 7.8 37.9 15.3c13.7 8.6 26.1 22.9 26.4 44.9c.3 22.5-11.4 38.9-26.7 48.5c-6.7 4.1-13.9 7-21.3 8.8l0 10.6c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-11.4c-9.5-2.3-18.2-5.3-25.6-7.8c-2.1-.7-4.1-1.4-6-2c-12.6-4.2-19.4-17.8-15.2-30.4s17.8-19.4 30.4-15.2c2.6 .9 5 1.7 7.3 2.5c13.6 4.6 23.4 7.9 33.9 8.3c8 .3 15.1-1.6 19.2-4.1c1.9-1.2 2.8-2.2 3.2-2.9c.4-.6 .9-1.8 .8-4.1l0-.2c0-1 0-2.1-4-4.6c-5.7-3.6-14.3-6.4-27.1-10.3l-1.9-.6c-10.8-3.2-25-7.5-36.4-14.4c-13.5-8.1-26.5-22-26.6-44.1c-.1-22.9 12.9-38.6 27.7-47.4c6.4-3.8 13.3-6.4 20.2-8.2L264 24c0-13.3 10.7-24 24-24s24 10.7 24 24zM568.2 336.3c13.1 17.8 9.3 42.8-8.5 55.9L433.1 485.5c-23.4 17.2-51.6 26.5-80.7 26.5L192 512 32 512c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l36.8 0 44.9-36c22.7-18.2 50.9-28 80-28l78.3 0 16 0 64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0-16 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l120.6 0 119.7-88.2c17.8-13.1 42.8-9.3 55.9 8.5zM193.6 384c0 0 0 0 0 0l-.9 0c.3 0 .6 0 .9 0z"],
  "file-signature":[576,512,"M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-19.3c-2.7 1.1-5.4 2-8.2 2.7l-60.1 15c-3 .7-6 1.2-9 1.4c-.9 .1-1.8 .2-2.7 .2l-64 0c-6.1 0-11.6-3.4-14.3-8.8l-8.8-17.7c-1.7-3.4-5.1-5.5-8.8-5.5s-7.2 2.1-8.8 5.5l-8.8 17.7c-2.9 5.9-9.2 9.4-15.7 8.8s-12.1-5.1-13.9-11.3L144 381l-9.8 32.8c-6.1 20.3-24.8 34.2-46 34.2L80 448c-8.8 0-16-7.2-16-16s7.2-16 16-16l8.2 0c7.1 0 13.3-4.6 15.3-11.4l14.9-49.5c3.4-11.3 13.8-19.1 25.6-19.1s22.2 7.8 25.6 19.1l11.6 38.6c7.4-6.2 16.8-9.7 26.8-9.7c15.9 0 30.4 9 37.5 23.2l4.4 8.8 8.9 0c-3.1-8.8-3.7-18.4-1.4-27.8l15-60.1c2.8-11.3 8.6-21.5 16.8-29.7L384 203.6l0-43.6-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM549.8 139.7c-15.6-15.6-40.9-15.6-56.6 0l-29.4 29.4 71 71 29.4-29.4c15.6-15.6 15.6-40.9 0-56.6l-14.4-14.4zM311.9 321c-4.1 4.1-7 9.2-8.4 14.9l-15 60.1c-1.4 5.5 .2 11.2 4.2 15.2s9.7 5.6 15.2 4.2l60.1-15c5.6-1.4 10.8-4.3 14.9-8.4L512.1 262.7l-71-71L311.9 321z"],
  "route":[512,512,"M512 96c0 50.2-59.1 125.1-84.6 155c-3.8 4.4-9.4 6.1-14.5 5L320 256c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c53 0 96 43 96 96s-43 96-96 96l-276.4 0c8.7-9.9 19.3-22.6 30-36.8c6.3-8.4 12.8-17.6 19-27.2L416 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0c-53 0-96-43-96-96s43-96 96-96l39.8 0c-21-31.5-39.8-67.7-39.8-96c0-53 43-96 96-96s96 43 96 96zM117.1 489.1c-3.8 4.3-7.2 8.1-10.1 11.3l-1.8 2-.2-.2c-6 4.6-14.6 4-20-1.8C59.8 473 0 402.5 0 352c0-53 43-96 96-96s96 43 96 96c0 30-21.1 67-43.5 97.9c-10.7 14.7-21.7 28-30.8 38.5l-.6 .7zM128 352a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM416 128a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"],
  "circle-nodes":[512,512,"M418.4 157.9c35.3-8.3 61.6-40 61.6-77.9c0-44.2-35.8-80-80-80c-43.4 0-78.7 34.5-80 77.5L136.2 151.1C121.7 136.8 101.9 128 80 128c-44.2 0-80 35.8-80 80s35.8 80 80 80c12.2 0 23.8-2.7 34.1-7.6L259.7 407.8c-2.4 7.6-3.7 15.8-3.7 24.2c0 44.2 35.8 80 80 80s80-35.8 80-80c0-27.7-14-52.1-35.4-66.4l37.8-207.7zM156.3 232.2c2.2-6.9 3.5-14.2 3.7-21.7l183.8-73.5c3.6 3.5 7.4 6.7 11.6 9.5L317.6 354.1c-5.5 1.3-10.8 3.1-15.8 5.5L156.3 232.2z"],
  "arrow-right-to-bracket":[512,512,"M352 96l64 0c17.7 0 32 14.3 32 32l0 256c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0c53 0 96-43 96-96l0-256c0-53-43-96-96-96l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32zm-9.4 182.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L242.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"],
  "gauge-simple-high":[512,512,"M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm320 96c0-15.9-5.8-30.4-15.3-41.6l76.6-147.4c6.1-11.8 1.5-26.3-10.2-32.4s-26.2-1.5-32.4 10.2L262.1 288.3c-2-.2-4-.3-6.1-.3c-35.3 0-64 28.7-64 64s28.7 64 64 64s64-28.7 64-64z"],
  "person-chalkboard":[640,512,"M192 96a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm-8 384l0-128 16 0 0 128c0 17.7 14.3 32 32 32s32-14.3 32-32l0-288 56 0 64 0 16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-16 0 0-64 192 0 0 192-192 0 0-32-64 0 0 48c0 26.5 21.5 48 48 48l224 0c26.5 0 48-21.5 48-48l0-224c0-26.5-21.5-48-48-48L368 0c-26.5 0-48 21.5-48 48l0 80-76.9 0-65.9 0c-33.7 0-64.9 17.7-82.3 46.6l-58.3 97c-9.1 15.1-4.2 34.8 10.9 43.9s34.8 4.2 43.9-10.9L120 256.9 120 480c0 17.7 14.3 32 32 32s32-14.3 32-32z"],
  "clock-rotate-left":[512,512,"M75 75L41 41C25.9 25.9 0 36.6 0 57.9L0 168c0 13.3 10.7 24 24 24l110.1 0c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1c0-13.3-10.7-24-24-24z"],
  "bolt-lightning":[384,512,"M0 256L28.5 28c2-16 15.6-28 31.8-28H228.9c15 0 27.1 12.1 27.1 27.1c0 3.2-.6 6.5-1.7 9.5L208 160H347.3c20.2 0 36.7 16.4 36.7 36.7c0 7.4-2.2 14.6-6.4 20.7l-192.2 281c-5.9 8.6-15.6 13.7-25.9 13.7h-2.9c-15.7 0-28.5-12.8-28.5-28.5c0-2.3 .3-4.6 .9-6.9L176 288H32c-17.7 0-32-14.3-32-32z"],
  "check-double":[448,512,"M342.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 178.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l80 80c12.5 12.5 32.8 12.5 45.3 0l160-160zm96 128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 402.7 54.6 297.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l256-256z"],
  "star":[576,512,"M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"],
  "triangle-exclamation":[512,512,"M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"],
  "clipboard-check":[384,512,"M192 0c-41.8 0-77.4 26.7-90.5 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-37.5 0C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM305 273L177 401c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L271 239c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"],
  "arrow-up-right-dots":[512,512,"M160 64a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM320 224a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM448 384a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM144 448a48 48 0 1 1 -96 0 48 48 0 1 1 96 0zM48 240a48 48 0 1 1 0-96 48 48 0 1 1 0 96zm256 8c0-13.3 10.7-24 24-24l112 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-54.1 0L216 425.9l0 54.1c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-64c0-6.4 2.5-12.5 7-17L385.9 224 328 224c-13.3 0-24-10.7-24-24z"],
  "circle-exclamation":[512,512,"M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"],
  "text-height":[576,512,"M32 32C14.3 32 0 46.3 0 64l0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32 48 0 0 288-16 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-16 0 0-288 48 0 0 32c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64c0-17.7-14.3-32-32-32L32 32zM384 480l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-3.6 0 44.2-92.5c.9-1.4 1.6-2.9 2.3-4.4L544 172.6l0 51.4c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-192 0c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32 43.6 0-88.4 185c-.9 1.4-1.6 2.9-2.3 4.4L336 416c-17.7 0-32 14.3-32 32s14.3 32 32 32l48 0z"],
  "floppy-disk":[448,512,"M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"],
  "circle-check":[512,512,"M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"],
  "xmark":[384,512,"M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"],
  "circle-question":[512,512,"M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm169.8-90.7c7.9-22.3 29.1-37.3 52.8-37.3l58.3 0c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24l0-13.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1l-58.3 0c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"],
  "circle-xmark":[512,512,"M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"],
  "circle-info":[512,512,"M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"],
  "lock":[448,512,"M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z"],
  "lock-open":[576,512,"M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80l0 48c0 17.7 14.3 32 32 32s32-14.3 32-32l0-48C576 64.5 511.5 0 432 0S288 64.5 288 144l0 48L64 192c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-32 0 0-48z"],
  "magnifying-glass":[512,512,"M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"],
  "play":[384,512,"M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"],
  "pause":[320,512,"M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z"],
  "forward":[512,512,"M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416L0 96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4L224 214.3l0 41.7 0 41.7L52.5 440.6zM256 352l0-96 0-128 0-32c0-12.4 7.2-23.7 18.4-29s24.5-3.6 34.1 4.4l192 160c7.3 6.1 11.5 15.1 11.5 24.6s-4.2 18.5-11.5 24.6l-192 160c-9.5 7.9-22.8 9.7-34.1 4.4s-18.4-16.6-18.4-29l0-64z"],
  "skull":[512,512,"M416 398.9c58.5-41.1 96-104.1 96-174.9C512 100.3 397.4 0 256 0S0 100.3 0 224c0 70.7 37.5 133.8 96 174.9c0 .4 0 .7 0 1.1l0 64c0 26.5 21.5 48 48 48l48 0 0-48c0-8.8 7.2-16 16-16s16 7.2 16 16l0 48 64 0 0-48c0-8.8 7.2-16 16-16s16 7.2 16 16l0 48 48 0c26.5 0 48-21.5 48-48l0-64c0-.4 0-.7 0-1.1zM96 256a64 64 0 1 1 128 0A64 64 0 1 1 96 256zm256-64a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"],
  "trophy":[576,512,"M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"],
  "money-bill-wave":[576,512,"M0 112.5L0 422.3c0 18 10.1 35 27 41.3c87 32.5 174 10.3 261-11.9c79.8-20.3 159.6-40.7 239.3-18.9c23 6.3 48.7-9.5 48.7-33.4l0-309.9c0-18-10.1-35-27-41.3C462 15.9 375 38.1 288 60.3C208.2 80.6 128.4 100.9 48.7 79.1C25.6 72.8 0 88.6 0 112.5zM288 352c-44.2 0-80-43-80-96s35.8-96 80-96s80 43 80 96s-35.8 96-80 96zM64 352c35.3 0 64 28.7 64 64l-64 0 0-64zm64-208c0 35.3-28.7 64-64 64l0-64 64 0zM512 304l0 64-64 0c0-35.3 28.7-64 64-64zM448 96l64 0 0 64c-35.3 0-64-28.7-64-64z"],
  "flag":[448,512,"M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32L0 64 0 368 0 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128 64.3-16.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30l0-247.7c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L64 48l0-16z"],
  "flag-checkered":[448,512,"M32 0C49.7 0 64 14.3 64 32l0 16 69-17.2c38.1-9.5 78.3-5.1 113.5 12.5c46.3 23.2 100.8 23.2 147.1 0l9.6-4.8C423.8 28.1 448 43.1 448 66.1l0 279.7c0 13.3-8.3 25.3-20.8 30l-34.7 13c-46.2 17.3-97.6 14.6-141.7-7.4c-37.9-19-81.3-23.7-122.5-13.4L64 384l0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-80 0-66L0 64 0 32C0 14.3 14.3 0 32 0zM64 187.1l64-13.9 0 65.5L64 252.6 64 318l48.8-12.2c5.1-1.3 10.1-2.4 15.2-3.3l0-63.9 38.9-8.4c8.3-1.8 16.7-2.5 25.1-2.1l0-64c13.6 .4 27.2 2.6 40.4 6.4l23.6 6.9 0 66.7-41.7-12.3c-7.3-2.1-14.8-3.4-22.3-3.8l0 71.4c21.8 1.9 43.3 6.7 64 14.4l0-69.8 22.7 6.7c13.5 4 27.3 6.4 41.3 7.4l0-64.2c-7.8-.8-15.6-2.3-23.2-4.5l-40.8-12 0-62c-13-3.8-25.8-8.8-38.2-15c-8.2-4.1-16.9-7-25.8-8.8l0 72.4c-13-.4-26 .8-38.7 3.6L128 173.2 128 98 64 114l0 73.1zM320 335.7c16.8 1.5 33.9-.7 50-6.8l14-5.2 0-71.7-7.9 1.8c-18.4 4.3-37.3 5.7-56.1 4.5l0 77.4zm64-149.4l0-70.8c-20.9 6.1-42.4 9.1-64 9.1l0 69.4c13.9 1.4 28 .5 41.7-2.6l22.3-5.2z"],
  "satellite-dish":[512,512,"M192 32c0-17.7 14.3-32 32-32C383.1 0 512 128.9 512 288c0 17.7-14.3 32-32 32s-32-14.3-32-32C448 164.3 347.7 64 224 64c-17.7 0-32-14.3-32-32zM60.6 220.6L164.7 324.7l28.4-28.4c-.7-2.6-1.1-5.4-1.1-8.3c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32c-2.9 0-5.6-.4-8.3-1.1l-28.4 28.4L291.4 451.4c14.5 14.5 11.8 38.8-7.3 46.3C260.5 506.9 234.9 512 208 512C93.1 512 0 418.9 0 304c0-26.9 5.1-52.5 14.4-76.1c7.5-19 31.8-21.8 46.3-7.3zM224 96c106 0 192 86 192 192c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-70.7-57.3-128-128-128c-17.7 0-32-14.3-32-32s14.3-32 32-32z"],
  "user-slash":[640,512,"M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L353.3 251.6C407.9 237 448 187.2 448 128C448 57.3 390.7 0 320 0C250.2 0 193.5 55.8 192 125.2L38.8 5.1zM264.3 304.3C170.5 309.4 96 387.2 96 482.3c0 16.4 13.3 29.7 29.7 29.7l388.6 0c3.9 0 7.6-.7 11-2.1l-261-205.6z"],
  "arrow-trend-down":[576,512,"M384 352c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0c17.7 0 32-14.3 32-32l0-160c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 82.7L342.6 137.4c-12.5-12.5-32.8-12.5-45.3 0L192 242.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0L320 205.3 466.7 352 384 352z"],
  "folder-open":[576,512,"M88.7 223.8L0 375.8 0 96C0 60.7 28.7 32 64 32l117.5 0c17 0 33.3 6.7 45.3 18.7l26.5 26.5c12 12 28.3 18.7 45.3 18.7L416 96c35.3 0 64 28.7 64 64l0 32-336 0c-22.8 0-43.8 12.1-55.3 31.8zm27.6 16.1C122.1 230 132.6 224 144 224l400 0c11.5 0 22 6.1 27.7 16.1s5.7 22.2-.1 32.1l-112 192C453.9 474 443.4 480 432 480L32 480c-11.5 0-22-6.1-27.7-16.1s-5.7-22.2 .1-32.1l112-192z"],
  "users":[640,512,"M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z"],
  "earth-europe":[512,512,"M266.3 48.3L232.5 73.6c-5.4 4-8.5 10.4-8.5 17.1l0 9.1c0 6.8 5.5 12.3 12.3 12.3c2.4 0 4.8-.7 6.8-2.1l41.8-27.9c2-1.3 4.4-2.1 6.8-2.1l1 0c6.2 0 11.3 5.1 11.3 11.3c0 3-1.2 5.9-3.3 8l-19.9 19.9c-5.8 5.8-12.9 10.2-20.7 12.8l-26.5 8.8c-5.8 1.9-9.6 7.3-9.6 13.4c0 3.7-1.5 7.3-4.1 10l-17.9 17.9c-6.4 6.4-9.9 15-9.9 24l0 4.3c0 16.4 13.6 29.7 29.9 29.7c11 0 21.2-6.2 26.1-16l4-8.1c2.4-4.8 7.4-7.9 12.8-7.9c4.5 0 8.7 2.1 11.4 5.7l16.3 21.7c2.1 2.9 5.5 4.5 9.1 4.5c8.4 0 13.9-8.9 10.1-16.4l-1.1-2.3c-3.5-7 0-15.5 7.5-18l21.2-7.1c7.6-2.5 12.7-9.6 12.7-17.6c0-10.3 8.3-18.6 18.6-18.6l29.4 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-20.7 0c-7.2 0-14.2 2.9-19.3 8l-4.7 4.7c-2.1 2.1-3.3 5-3.3 8c0 6.2 5.1 11.3 11.3 11.3l11.3 0c6 0 11.8 2.4 16 6.6l6.5 6.5c1.8 1.8 2.8 4.3 2.8 6.8s-1 5-2.8 6.8l-7.5 7.5C386 262 384 266.9 384 272s2 10 5.7 13.7L408 304c10.2 10.2 24.1 16 38.6 16l7.3 0c6.5-20.2 10-41.7 10-64c0-111.4-87.6-202.4-197.7-207.7zm172 307.9c-3.7-2.6-8.2-4.1-13-4.1c-6 0-11.8-2.4-16-6.6L396 332c-7.7-7.7-18-12-28.9-12c-9.7 0-19.2-3.5-26.6-9.8L314 287.4c-11.6-9.9-26.4-15.4-41.7-15.4l-20.9 0c-12.6 0-25 3.7-35.5 10.7L188.5 301c-17.8 11.9-28.5 31.9-28.5 53.3l0 3.2c0 17 6.7 33.3 18.7 45.3l16 16c8.5 8.5 20 13.3 32 13.3l21.3 0c13.3 0 24 10.7 24 24c0 2.5 .4 5 1.1 7.3c71.3-5.8 132.5-47.6 165.2-107.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM187.3 100.7c-6.2-6.2-16.4-6.2-22.6 0l-32 32c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0l32-32c6.2-6.2 6.2-16.4 0-22.6z"],
  "clipboard-list":[384,512,"M192 0c-41.8 0-77.4 26.7-90.5 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-37.5 0C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16l128 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-128 0c-8.8 0-16-7.2-16-16z"],
  "rocket":[512,512,"M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2l0 82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9l0-107.2c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"],
  "bullseye":[512,512,"M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"],
  "shield-halved":[512,512,"M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8l0 378.1C394 378 431.1 230.1 432 141.4L256 66.8s0 0 0 0z"],
  "chart-line":[512,512,"M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64L0 400c0 44.2 35.8 80 80 80l400 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 416c-8.8 0-16-7.2-16-16L64 64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"],
  "building-columns":[512,512,"M243.4 2.6l-224 96c-14 6-21.8 21-18.7 35.8S16.8 160 32 160l0 8c0 13.3 10.7 24 24 24l400 0c13.3 0 24-10.7 24-24l0-8c15.2 0 28.3-10.7 31.3-25.6s-4.8-29.9-18.7-35.8l-224-96c-8-3.4-17.2-3.4-25.2 0zM128 224l-64 0 0 196.3c-.6 .3-1.2 .7-1.8 1.1l-48 32c-11.7 7.8-17 22.4-12.9 35.9S17.9 512 32 512l448 0c14.1 0 26.5-9.2 30.6-22.7s-1.1-28.1-12.9-35.9l-48-32c-.6-.4-1.2-.7-1.8-1.1L448 224l-64 0 0 192-40 0 0-192-64 0 0 192-48 0 0-192-64 0 0 192-40 0 0-192zM256 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"],
  "volume-high":[640,512,"M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"],
  "volume-xmark":[576,512,"M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"],
  "rotate-left":[512,512,"M48.5 224L40 224c-13.3 0-24-10.7-24-24L16 72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8L48.5 224z"],
  "moon":[384,512,"M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"],
  "sun":[512,512,"M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"],
  "map":[576,512,"M384 476.1L192 421.2l0-385.3L384 90.8l0 385.3zm32-1.2l0-386.5L543.1 37.5c15.8-6.3 32.9 5.3 32.9 22.3l0 334.8c0 9.8-6 18.6-15.1 22.3L416 474.8zM15.1 95.1L160 37.2l0 386.5L32.9 474.5C17.1 480.8 0 469.2 0 452.2L0 117.4c0-9.8 6-18.6 15.1-22.3z"],
  "sack-dollar":[512,512,"M320 96L192 96 144.6 24.9C137.5 14.2 145.1 0 157.9 0L354.1 0c12.8 0 20.4 14.2 13.3 24.9L320 96zM192 128l128 0c3.8 2.5 8.1 5.3 13 8.4C389.7 172.7 512 250.9 512 416c0 53-43 96-96 96L96 512c-53 0-96-43-96-96C0 250.9 122.3 172.7 179 136.4c0 0 0 0 0 0s0 0 0 0c4.8-3.1 9.2-5.9 13-8.4zm84 88c0-11-9-20-20-20s-20 9-20 20l0 14c-7.6 1.7-15.2 4.4-22.2 8.5c-13.9 8.3-25.9 22.8-25.8 43.9c.1 20.3 12 33.1 24.7 40.7c11 6.6 24.7 10.8 35.6 14l1.7 .5c12.6 3.8 21.8 6.8 28 10.7c5.1 3.2 5.8 5.4 5.9 8.2c.1 5-1.8 8-5.9 10.5c-5 3.1-12.9 5-21.4 4.7c-11.1-.4-21.5-3.9-35.1-8.5c-2.3-.8-4.7-1.6-7.2-2.4c-10.5-3.5-21.8 2.2-25.3 12.6s2.2 21.8 12.6 25.3c1.9 .6 4 1.3 6.1 2.1c0 0 0 0 0 0s0 0 0 0c8.3 2.9 17.9 6.2 28.2 8.4l0 14.6c0 11 9 20 20 20s20-9 20-20l0-13.8c8-1.7 16-4.5 23.2-9c14.3-8.9 25.1-24.1 24.8-45c-.3-20.3-11.7-33.4-24.6-41.6c-11.5-7.2-25.9-11.6-37.1-15c0 0 0 0 0 0l-.7-.2c-12.8-3.9-21.9-6.7-28.3-10.5c-5.2-3.1-5.3-4.9-5.3-6.7c0-3.7 1.4-6.5 6.2-9.3c5.4-3.2 13.6-5.1 21.5-5c9.6 .1 20.2 2.2 31.2 5.2c10.7 2.8 21.6-3.5 24.5-14.2s-3.5-21.6-14.2-24.5c-6.5-1.7-13.7-3.4-21.1-4.7l0-13.9z"],
  "gauge-high":[512,512,"M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM256 416c35.3 0 64-28.7 64-64c0-17.4-6.9-33.1-18.1-44.6L366 161.7c5.3-12.1-.2-26.3-12.3-31.6s-26.3 .2-31.6 12.3L257.9 288c-.6 0-1.3 0-1.9 0c-35.3 0-64 28.7-64 64s28.7 64 64 64zM176 144a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM96 288a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm352-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"],
  "chess-knight":[448,512,"M96 48L82.7 61.3C70.7 73.3 64 89.5 64 106.5l0 132.4c0 10.7 5.3 20.7 14.2 26.6l10.6 7c14.3 9.6 32.7 10.7 48.1 3l3.2-1.6c2.6-1.3 5-2.8 7.3-4.5l49.4-37c6.6-5 15.7-5 22.3 0c10.2 7.7 9.9 23.1-.7 30.3L90.4 350C73.9 361.3 64 380 64 400l320 0 28.9-159c2.1-11.3 3.1-22.8 3.1-34.3l0-14.7C416 86 330 0 224 0L83.8 0C72.9 0 64 8.9 64 19.8c0 7.5 4.2 14.3 10.9 17.7L96 48zm24 68a20 20 0 1 1 40 0 20 20 0 1 1 -40 0zM22.6 473.4c-4.2 4.2-6.6 10-6.6 16C16 501.9 26.1 512 38.6 512l370.7 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L384 432 64 432 22.6 473.4z"],
  "user-tie":[448,512,"M96 128a128 128 0 1 0 256 0A128 128 0 1 0 96 128zm94.5 200.2l18.6 31L175.8 483.1l-36-146.9c-2-8.1-9.8-13.4-17.9-11.3C51.9 342.4 0 405.8 0 481.3c0 17 13.8 30.7 30.7 30.7l131.7 0c0 0 0 0 .1 0l5.5 0 112 0 5.5 0c0 0 0 0 .1 0l131.7 0c17 0 30.7-13.8 30.7-30.7c0-75.5-51.9-138.9-121.9-156.4c-8.1-2-15.9 3.3-17.9 11.3l-36 146.9L238.9 359.2l18.6-31c6.4-10.7-1.3-24.2-13.7-24.2L224 304l-19.7 0c-12.4 0-20.1 13.6-13.7 24.2z"],
  "bullhorn":[512,512,"M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75l-8.7 0-32 0-96 0c-35.3 0-64 28.7-64 64l0 96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32l0-128 8.7 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6l0-147.6c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4L480 32zm-64 76.7L416 240l0 131.3C357.2 317.8 280.5 288 200.7 288l-8.7 0 0-96 8.7 0c79.8 0 156.5-29.8 215.3-83.3z"],
  "landmark":[512,512,"M240.1 4.2c9.8-5.6 21.9-5.6 31.8 0l171.8 98.1L448 104l0 .9 47.9 27.4c12.6 7.2 18.8 22 15.1 36s-16.4 23.8-30.9 23.8L32 192c-14.5 0-27.2-9.8-30.9-23.8s2.5-28.8 15.1-36L64 104.9l0-.9 4.4-1.6L240.1 4.2zM64 224l64 0 0 192 40 0 0-192 64 0 0 192 48 0 0-192 64 0 0 192 40 0 0-192 64 0 0 196.3c.6 .3 1.2 .7 1.8 1.1l48 32c11.7 7.8 17 22.4 12.9 35.9S494.1 512 480 512L32 512c-14.1 0-26.5-9.2-30.6-22.7s1.1-28.1 12.9-35.9l48-32c.6-.4 1.2-.7 1.8-1.1L64 224z"],
  "graduation-cap":[640,512,"M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9l0 28.1c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6C0 442.7-.9 448.3 .9 453.4s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7 .3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7C90.3 344.3 86 329.8 80 316.5l0-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5 .8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1L624.2 182.6c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1C336.1 33.4 328.1 32 320 32zM128 408c0 35.3 86 72 192 72s192-36.7 192-72L496.7 262.6 354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6L143.3 262.6 128 408z"],
  "diagram-project":[576,512,"M0 80C0 53.5 21.5 32 48 32l96 0c26.5 0 48 21.5 48 48l0 16 192 0 0-16c0-26.5 21.5-48 48-48l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-16-192 0 0 16c0 1.7-.1 3.4-.3 5L272 288l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96c0-1.7 .1-3.4 .3-5L144 224l-96 0c-26.5 0-48-21.5-48-48L0 80z"],
  "magnifying-glass-chart":[512,512,"M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zm-312 8l0 64c0 13.3 10.7 24 24 24s24-10.7 24-24l0-64c0-13.3-10.7-24-24-24s-24 10.7-24 24zm80-96l0 160c0 13.3 10.7 24 24 24s24-10.7 24-24l0-160c0-13.3-10.7-24-24-24s-24 10.7-24 24zm80 64l0 96c0 13.3 10.7 24 24 24s24-10.7 24-24l0-96c0-13.3-10.7-24-24-24s-24 10.7-24 24z"],
  "briefcase":[512,512,"M184 48l144 0c4.4 0 8 3.6 8 8l0 40L176 96l0-40c0-4.4 3.6-8 8-8zm-56 8l0 40L64 96C28.7 96 0 124.7 0 160l0 96 192 0 128 0 192 0 0-96c0-35.3-28.7-64-64-64l-64 0 0-40c0-30.9-25.1-56-56-56L184 0c-30.9 0-56 25.1-56 56zM512 288l-192 0 0 32c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-32L0 288 0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-128z"],
  "scale-balanced":[640,512,"M384 32l128 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L398.4 96c-5.2 25.8-22.9 47.1-46.4 57.3L352 448l160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-192 0-192 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0 0-294.7c-23.5-10.3-41.2-31.6-46.4-57.3L128 96c-17.7 0-32-14.3-32-32s14.3-32 32-32l128 0c14.6-19.4 37.8-32 64-32s49.4 12.6 64 32zm55.6 288l144.9 0L512 195.8 439.6 320zM512 416c-62.9 0-115.2-34-126-78.9c-2.6-11 1-22.3 6.7-32.1l95.2-163.2c5-8.6 14.2-13.8 24.1-13.8s19.1 5.3 24.1 13.8l95.2 163.2c5.7 9.8 9.3 21.1 6.7 32.1C627.2 382 574.9 416 512 416zM126.8 195.8L54.4 320l144.9 0L126.8 195.8zM.9 337.1c-2.6-11 1-22.3 6.7-32.1l95.2-163.2c5-8.6 14.2-13.8 24.1-13.8s19.1 5.3 24.1 13.8l95.2 163.2c5.7 9.8 9.3 21.1 6.7 32.1C242 382 189.7 416 126.8 416S11.7 382 .9 337.1z"],
  "users-gear":[640,512,"M144 160A80 80 0 1 0 144 0a80 80 0 1 0 0 160zm368 0A80 80 0 1 0 512 0a80 80 0 1 0 0 160zM0 298.7C0 310.4 9.6 320 21.3 320l213.3 0c.2 0 .4 0 .7 0c-26.6-23.5-43.3-57.8-43.3-96c0-7.6 .7-15 1.9-22.3c-13.6-6.3-28.7-9.7-44.6-9.7l-42.7 0C47.8 192 0 239.8 0 298.7zM320 320c24 0 45.9-8.8 62.7-23.3c2.5-3.7 5.2-7.3 8-10.7c2.7-3.3 5.7-6.1 9-8.3C410 262.3 416 243.9 416 224c0-53-43-96-96-96s-96 43-96 96s43 96 96 96zm65.4 60.2c-10.3-5.9-18.1-16.2-20.8-28.2l-103.2 0C187.7 352 128 411.7 128 485.3c0 14.7 11.9 26.7 26.7 26.7l300.6 0c-2.1-5.2-3.2-10.9-3.2-16.4l0-3c-1.3-.7-2.7-1.5-4-2.3l-2.6 1.5c-16.8 9.7-40.5 8-54.7-9.7c-4.5-5.6-8.6-11.5-12.4-17.6l-.1-.2-.1-.2-2.4-4.1-.1-.2-.1-.2c-3.4-6.2-6.4-12.6-9-19.3c-8.2-21.2 2.2-42.6 19-52.3l2.7-1.5c0-.8 0-1.5 0-2.3s0-1.5 0-2.3l-2.7-1.5zM533.3 192l-42.7 0c-15.9 0-31 3.5-44.6 9.7c1.3 7.2 1.9 14.7 1.9 22.3c0 17.4-3.5 33.9-9.7 49c2.5 .9 4.9 2 7.1 3.3l2.6 1.5c1.3-.8 2.6-1.6 4-2.3l0-3c0-19.4 13.3-39.1 35.8-42.6c7.9-1.2 16-1.9 24.2-1.9s16.3 .6 24.2 1.9c22.5 3.5 35.8 23.2 35.8 42.6l0 3c1.3 .7 2.7 1.5 4 2.3l2.6-1.5c16.8-9.7 40.5-8 54.7 9.7c2.3 2.8 4.5 5.8 6.6 8.7c-2.1-57.1-49-102.7-106.6-102.7zm91.3 163.9c6.3-3.6 9.5-11.1 6.8-18c-2.1-5.5-4.6-10.8-7.4-15.9l-2.3-4c-3.1-5.1-6.5-9.9-10.2-14.5c-4.6-5.7-12.7-6.7-19-3l-2.9 1.7c-9.2 5.3-20.4 4-29.6-1.3s-16.1-14.5-16.1-25.1l0-3.4c0-7.3-4.9-13.8-12.1-14.9c-6.5-1-13.1-1.5-19.9-1.5s-13.4 .5-19.9 1.5c-7.2 1.1-12.1 7.6-12.1 14.9l0 3.4c0 10.6-6.9 19.8-16.1 25.1s-20.4 6.6-29.6 1.3l-2.9-1.7c-6.3-3.6-14.4-2.6-19 3c-3.7 4.6-7.1 9.5-10.2 14.6l-2.3 3.9c-2.8 5.1-5.3 10.4-7.4 15.9c-2.6 6.8 .5 14.3 6.8 17.9l2.9 1.7c9.2 5.3 13.7 15.8 13.7 26.4s-4.5 21.1-13.7 26.4l-3 1.7c-6.3 3.6-9.5 11.1-6.8 17.9c2.1 5.5 4.6 10.7 7.4 15.8l2.4 4.1c3 5.1 6.4 9.9 10.1 14.5c4.6 5.7 12.7 6.7 19 3l2.9-1.7c9.2-5.3 20.4-4 29.6 1.3s16.1 14.5 16.1 25.1l0 3.4c0 7.3 4.9 13.8 12.1 14.9c6.5 1 13.1 1.5 19.9 1.5s13.4-.5 19.9-1.5c7.2-1.1 12.1-7.6 12.1-14.9l0-3.4c0-10.6 6.9-19.8 16.1-25.1s20.4-6.6 29.6-1.3l2.9 1.7c6.3 3.6 14.4 2.6 19-3c3.7-4.6 7.1-9.4 10.1-14.5l2.4-4.2c2.8-5.1 5.3-10.3 7.4-15.8c2.6-6.8-.5-14.3-6.8-17.9l-3-1.7c-9.2-5.3-13.7-15.8-13.7-26.4s4.5-21.1 13.7-26.4l3-1.7zM472 384a40 40 0 1 1 80 0 40 40 0 1 1 -80 0z"],
  "award":[384,512,"M173.8 5.5c11-7.3 25.4-7.3 36.4 0L228 17.2c6 3.9 13 5.8 20.1 5.4l21.3-1.3c13.2-.8 25.6 6.4 31.5 18.2l9.6 19.1c3.2 6.4 8.4 11.5 14.7 14.7L344.5 83c11.8 5.9 19 18.3 18.2 31.5l-1.3 21.3c-.4 7.1 1.5 14.2 5.4 20.1l11.8 17.8c7.3 11 7.3 25.4 0 36.4L366.8 228c-3.9 6-5.8 13-5.4 20.1l1.3 21.3c.8 13.2-6.4 25.6-18.2 31.5l-19.1 9.6c-6.4 3.2-11.5 8.4-14.7 14.7L301 344.5c-5.9 11.8-18.3 19-31.5 18.2l-21.3-1.3c-7.1-.4-14.2 1.5-20.1 5.4l-17.8 11.8c-11 7.3-25.4 7.3-36.4 0L156 366.8c-6-3.9-13-5.8-20.1-5.4l-21.3 1.3c-13.2 .8-25.6-6.4-31.5-18.2l-9.6-19.1c-3.2-6.4-8.4-11.5-14.7-14.7L39.5 301c-11.8-5.9-19-18.3-18.2-31.5l1.3-21.3c.4-7.1-1.5-14.2-5.4-20.1L5.5 210.2c-7.3-11-7.3-25.4 0-36.4L17.2 156c3.9-6 5.8-13 5.4-20.1l-1.3-21.3c-.8-13.2 6.4-25.6 18.2-31.5l19.1-9.6C65 70.2 70.2 65 73.4 58.6L83 39.5c5.9-11.8 18.3-19 31.5-18.2l21.3 1.3c7.1 .4 14.2-1.5 20.1-5.4L173.8 5.5zM272 192a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM1.3 441.8L44.4 339.3c.2 .1 .3 .2 .4 .4l9.6 19.1c11.7 23.2 36 37.3 62 35.8l21.3-1.3c.2 0 .5 0 .7 .2l17.8 11.8c5.1 3.3 10.5 5.9 16.1 7.7l-37.6 89.3c-2.3 5.5-7.4 9.2-13.3 9.7s-11.6-2.2-14.8-7.2L74.4 455.5l-56.1 8.3c-5.7 .8-11.4-1.5-15-6s-4.3-10.7-2.1-16zm248 60.4L211.7 413c5.6-1.8 11-4.3 16.1-7.7l17.8-11.8c.2-.1 .4-.2 .7-.2l21.3 1.3c26 1.5 50.3-12.6 62-35.8l9.6-19.1c.1-.2 .2-.3 .4-.4l43.2 102.5c2.2 5.3 1.4 11.4-2.1 16s-9.3 6.9-15 6l-56.1-8.3-32.2 49.2c-3.2 5-8.9 7.7-14.8 7.2s-11-4.3-13.3-9.7z"],
  "leaf":[512,512,"M272 96c-78.6 0-145.1 51.5-167.7 122.5c33.6-17 71.5-26.5 111.7-26.5l88 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-16 0-72 0s0 0 0 0c-16.6 0-32.7 1.9-48.3 5.4c-25.9 5.9-49.9 16.4-71.4 30.7c0 0 0 0 0 0C38.3 298.8 0 364.9 0 440l0 16c0 13.3 10.7 24 24 24s24-10.7 24-24l0-16c0-48.7 20.7-92.5 53.8-123.2C121.6 392.3 190.3 448 272 448l1 0c132.1-.7 239-130.9 239-291.4c0-42.6-7.5-83.1-21.1-119.6c-2.6-6.9-12.7-6.6-16.2-.1C455.9 72.1 418.7 96 376 96L272 96z"],
  "wheat-awn":[512,512,"M505 41c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L383 95c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l88-88zM305.5 27.3c-6.2-6.2-16.4-6.2-22.6 0L271.5 38.6c-37.5 37.5-37.5 98.3 0 135.8l10.4 10.4-30.5 30.5c-3.4-27.3-15.5-53.8-36.5-74.8l-11.3-11.3c-6.2-6.2-16.4-6.2-22.6 0l-11.3 11.3c-37.5 37.5-37.5 98.3 0 135.8l10.4 10.4-30.5 30.5c-3.4-27.3-15.5-53.8-36.5-74.8L101.8 231c-6.2-6.2-16.4-6.2-22.6 0L67.9 242.3c-37.5 37.5-37.5 98.3 0 135.8l10.4 10.4L9.4 457.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l68.9-68.9 12.2 12.2c37.5 37.5 98.3 37.5 135.8 0l11.3-11.3c6.2-6.2 6.2-16.4 0-22.6l-11.3-11.3c-21.8-21.8-49.6-34.1-78.1-36.9l31.9-31.9 12.2 12.2c37.5 37.5 98.3 37.5 135.8 0l11.3-11.3c6.2-6.2 6.2-16.4 0-22.6l-11.3-11.3c-21.8-21.8-49.6-34.1-78.1-36.9l31.9-31.9 12.2 12.2c37.5 37.5 98.3 37.5 135.8 0L486.5 231c6.2-6.2 6.2-16.4 0-22.6L475.2 197c-5.2-5.2-10.6-9.8-16.4-13.9L505 137c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-59.4 59.4c-20.6-4.4-42-3.7-62.3 2.1c6.1-21.3 6.6-43.8 1.4-65.3L409 41c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L329.1 52.9c-3.7-5-7.8-9.8-12.4-14.3L305.5 27.3z"],
  "car":[512,512,"M135.2 117.4L109.1 192l293.8 0-26.1-74.6C372.3 104.6 360.2 96 346.6 96L165.4 96c-13.6 0-25.7 8.6-30.2 21.4zM39.6 196.8L74.8 96.3C88.3 57.8 124.6 32 165.4 32l181.2 0c40.8 0 77.1 25.8 90.6 64.3l35.2 100.5c23.2 9.6 39.6 32.5 39.6 59.2l0 144 0 48c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-48L96 400l0 48c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-48L0 256c0-26.7 16.4-49.6 39.6-59.2zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"],
  "display":[576,512,"M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 288L64 352 64 64l448 0z"],
  "hospital":[640,512,"M192 48c0-26.5 21.5-48 48-48L400 0c26.5 0 48 21.5 48 48l0 464-80 0 0-80c0-26.5-21.5-48-48-48s-48 21.5-48 48l0 80-80 0 0-464zM48 96l112 0 0 416L48 512c-26.5 0-48-21.5-48-48L0 320l80 0c8.8 0 16-7.2 16-16s-7.2-16-16-16L0 288l0-64 80 0c8.8 0 16-7.2 16-16s-7.2-16-16-16L0 192l0-48c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48l0 48-80 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l80 0 0 64-80 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l80 0 0 144c0 26.5-21.5 48-48 48l-112 0 0-416 112 0zM312 64c-8.8 0-16 7.2-16 16l0 24-24 0c-8.8 0-16 7.2-16 16l0 16c0 8.8 7.2 16 16 16l24 0 0 24c0 8.8 7.2 16 16 16l16 0c8.8 0 16-7.2 16-16l0-24 24 0c8.8 0 16-7.2 16-16l0-16c0-8.8-7.2-16-16-16l-24 0 0-24c0-8.8-7.2-16-16-16l-16 0z"],
  "industry":[576,512,"M64 32C46.3 32 32 46.3 32 64l0 240 0 48 0 80c0 26.5 21.5 48 48 48l416 0c26.5 0 48-21.5 48-48l0-128 0-151.8c0-18.2-19.4-29.7-35.4-21.1L352 215.4l0-63.2c0-18.2-19.4-29.7-35.4-21.1L160 215.4 160 64c0-17.7-14.3-32-32-32L64 32z"],
  "plane":[576,512,"M482.3 192c34.2 0 93.7 29 93.7 64c0 36-59.5 64-93.7 64l-116.6 0L265.2 495.9c-5.7 10-16.3 16.1-27.8 16.1l-56.2 0c-10.6 0-18.3-10.2-15.4-20.4l49-171.6L112 320 68.8 377.6c-3 4-7.8 6.4-12.8 6.4l-42 0c-7.8 0-14-6.3-14-14c0-1.3 .2-2.6 .5-3.9L32 256 .5 145.9c-.4-1.3-.5-2.6-.5-3.9c0-7.8 6.3-14 14-14l42 0c5 0 9.8 2.4 12.8 6.4L112 192l102.9 0-49-171.6C162.9 10.2 170.6 0 181.2 0l56.2 0c11.5 0 22.1 6.2 27.8 16.1L365.7 192l116.6 0z"],
  "trowel":[512,512,"M343.9 213.4L245.3 312l65.4 65.4c7.9 7.9 11.1 19.4 8.4 30.3s-10.8 19.6-21.5 22.9l-256 80c-11.4 3.5-23.8 .5-32.2-7.9S-2.1 481.8 1.5 470.5l80-256c3.3-10.7 12-18.9 22.9-21.5s22.4 .5 30.3 8.4L200 266.7l98.6-98.6c-14.3-14.6-14.2-38 .3-52.5l95.4-95.4c26.9-26.9 70.5-26.9 97.5 0s26.9 70.5 0 97.5l-95.4 95.4c-14.5 14.5-37.9 14.6-52.5 .3z"],
  "palette":[512,512,"M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3L344 320c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"],
  "microchip":[512,512,"M176 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c-35.3 0-64 28.7-64 64l-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0c0 35.3 28.7 64 64 64l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40c35.3 0 64-28.7 64-64l40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0c0-35.3-28.7-64-64-64l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40zM160 128l192 0c17.7 0 32 14.3 32 32l0 192c0 17.7-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32l0-192c0-17.7 14.3-32 32-32zm192 32l-192 0 0 192 192 0 0-192z"],
  "coins":[512,512,"M512 80c0 18-14.3 34.6-38.4 48c-29.1 16.1-72.5 27.5-122.3 30.9c-3.7-1.8-7.4-3.5-11.3-5C300.6 137.4 248.2 128 192 128c-8.3 0-16.4 .2-24.5 .6l-1.1-.6C142.3 114.6 128 98 128 80c0-44.2 86-80 192-80S512 35.8 512 80zM160.7 161.1c10.2-.7 20.7-1.1 31.3-1.1c62.2 0 117.4 12.3 152.5 31.4C369.3 204.9 384 221.7 384 240c0 4-.7 7.9-2.1 11.7c-4.6 13.2-17 25.3-35 35.5c0 0 0 0 0 0c-.1 .1-.3 .1-.4 .2c0 0 0 0 0 0s0 0 0 0c-.3 .2-.6 .3-.9 .5c-35 19.4-90.8 32-153.6 32c-59.6 0-112.9-11.3-148.2-29.1c-1.9-.9-3.7-1.9-5.5-2.9C14.3 274.6 0 258 0 240c0-34.8 53.4-64.5 128-75.4c10.5-1.5 21.4-2.7 32.7-3.5zM416 240c0-21.9-10.6-39.9-24.1-53.4c28.3-4.4 54.2-11.4 76.2-20.5c16.3-6.8 31.5-15.2 43.9-25.5l0 35.4c0 19.3-16.5 37.1-43.8 50.9c-14.6 7.4-32.4 13.7-52.4 18.5c.1-1.8 .2-3.5 .2-5.3zm-32 96c0 18-14.3 34.6-38.4 48c-1.8 1-3.6 1.9-5.5 2.9C304.9 404.7 251.6 416 192 416c-62.8 0-118.6-12.6-153.6-32C14.3 370.6 0 354 0 336l0-35.4c12.5 10.3 27.6 18.7 43.9 25.5C83.4 342.6 135.8 352 192 352s108.6-9.4 148.1-25.9c7.8-3.2 15.3-6.9 22.4-10.9c6.1-3.4 11.8-7.2 17.2-11.2c1.5-1.1 2.9-2.3 4.3-3.4l0 3.4 0 5.7 0 26.3zm32 0l0-32 0-25.9c19-4.2 36.5-9.5 52.1-16c16.3-6.8 31.5-15.2 43.9-25.5l0 35.4c0 10.5-5 21-14.9 30.9c-16.3 16.3-45 29.7-81.3 38.4c.1-1.7 .2-3.5 .2-5.3z"],
  "handshake":[640,512,"M323.4 85.2l-96.8 78.4c-16.1 13-19.2 36.4-7 53.1c12.9 17.8 38 21.3 55.3 7.8l99.3-77.2c7-5.4 17-4.2 22.5 2.8s4.2 17-2.8 22.5l-20.9 16.2L512 316.8 512 128l-.7 0-3.9-2.5L434.8 79c-15.3-9.8-33.2-15-51.4-15c-21.8 0-43 7.5-60 21.2zm22.8 124.4l-51.7 40.2C263 274.4 217.3 268 193.7 235.6c-22.2-30.5-16.6-73.1 12.7-96.8l83.2-67.3c-11.6-4.9-24.1-7.4-36.8-7.4C234 64 215.7 69.6 200 80l-72 48 0 224 28.2 0 91.4 83.4c19.6 17.9 49.9 16.5 67.8-3.1c5.5-6.1 9.2-13.2 11.1-20.6l17 15.6c19.5 17.9 49.9 16.6 67.8-2.9c4.5-4.9 7.8-10.6 9.9-16.5c19.4 13 45.8 10.3 62.1-7.5c17.9-19.5 16.6-49.9-2.9-67.8l-134.2-123zM16 128c-8.8 0-16 7.2-16 16L0 352c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-224-80 0zM48 320a16 16 0 1 1 0 32 16 16 0 1 1 0-32zM544 128l0 224c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-208c0-8.8-7.2-16-16-16l-80 0zm32 208a16 16 0 1 1 32 0 16 16 0 1 1 -32 0z"],
  "shirt":[640,512,"M211.8 0c7.8 0 14.3 5.7 16.7 13.2C240.8 51.9 277.1 80 320 80s79.2-28.1 91.5-66.8C413.9 5.7 420.4 0 428.2 0l12.6 0c22.5 0 44.2 7.9 61.5 22.3L628.5 127.4c6.6 5.5 10.7 13.5 11.4 22.1s-2.1 17.1-7.8 23.6l-56 64c-11.4 13.1-31.2 14.6-44.6 3.5L480 197.7 480 448c0 35.3-28.7 64-64 64l-192 0c-35.3 0-64-28.7-64-64l0-250.3-51.5 42.9c-13.3 11.1-33.1 9.6-44.6-3.5l-56-64c-5.7-6.5-8.5-15-7.8-23.6s4.8-16.6 11.4-22.1L137.7 22.3C155 7.9 176.7 0 199.2 0l12.6 0z"],
  "bag-shopping":[448,512,"M160 112c0-35.3 28.7-64 64-64s64 28.7 64 64l0 48-128 0 0-48zm-48 48l-64 0c-26.5 0-48 21.5-48 48L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-208c0-26.5-21.5-48-48-48l-64 0 0-48C336 50.1 285.9 0 224 0S112 50.1 112 112l0 48zm24 48a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm152 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"],
  "bolt":[448,512,"M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288l111.5 0L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7l-111.5 0L349.4 44.6z"],
  "medal":[512,512,"M4.1 38.2C1.4 34.2 0 29.4 0 24.6C0 11 11 0 24.6 0L133.9 0c11.2 0 21.7 5.9 27.4 15.5l68.5 114.1c-48.2 6.1-91.3 28.6-123.4 61.9L4.1 38.2zm503.7 0L405.6 191.5c-32.1-33.3-75.2-55.8-123.4-61.9L350.7 15.5C356.5 5.9 366.9 0 378.1 0L487.4 0C501 0 512 11 512 24.6c0 4.8-1.4 9.6-4.1 13.6zM80 336a176 176 0 1 1 352 0A176 176 0 1 1 80 336zm184.4-94.9c-3.4-7-13.3-7-16.8 0l-22.4 45.4c-1.4 2.8-4 4.7-7 5.1L168 298.9c-7.7 1.1-10.7 10.5-5.2 16l36.3 35.4c2.2 2.2 3.2 5.2 2.7 8.3l-8.6 49.9c-1.3 7.6 6.7 13.5 13.6 9.9l44.8-23.6c2.7-1.4 6-1.4 8.7 0l44.8 23.6c6.9 3.6 14.9-2.2 13.6-9.9l-8.6-49.9c-.5-3 .5-6.1 2.7-8.3l36.3-35.4c5.6-5.4 2.5-14.8-5.2-16l-50.1-7.3c-3-.4-5.7-2.4-7-5.1l-22.4-45.4z"],
  "check":[448,512,"M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"],
  "arrow-right":[448,512,"M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"],
  "arrow-left":[448,512,"M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"],
  "circle":[512,512,"M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"],
  "circle-outline":[512,512,"M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"],
  "diamond":[512,512,"M284.3 11.7c-15.6-15.6-40.9-15.6-56.6 0l-216 216c-15.6 15.6-15.6 40.9 0 56.6l216 216c15.6 15.6 40.9 15.6 56.6 0l216-216c15.6-15.6 15.6-40.9 0-56.6l-216-216z"],
  "square":[448,512,"M0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96z"]
};
function Icon({ name, size=14, color="currentColor", style }) {
  const def = ICON_PATHS[name];
  if (!def) return null;
  const [w,h,d] = def;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={size} height={size} style={{flexShrink:0,verticalAlign:"middle",...style}} aria-hidden="true">
      <path fill={color} d={d}/>
    </svg>
  );
}

/* FontAwesome glyph for use INSIDE an <svg> (map tooltip etc.) */
function FAGlyph({ name, x, y, size=9, color="currentColor" }) {
  const def = ICON_PATHS[name];
  if (!def) return null;
  const [w,h,d] = def;
  const s = size / h;
  return <path d={d} fill={color} transform={`translate(${x},${y}) scale(${s})`} />;
}

const NAME_TO_ISO = DATA_NAME_TO_ISO;
const ISO_TO_NAME = Object.fromEntries(Object.entries(NAME_TO_ISO).map(([k,v])=>[v,k]));

/* ═══════════════════════════════════════════════════════════
   GAME DATA  ·  regions and industrial ecosystems
═══════════════════════════════════════════════════════════ */
// Region records (name, nuts, ecos[], ris) keyed by country.
// Some countries carry a country-level record (nuts = 2-letter ISO) alongside real
// NUTS-2 regions for some countries; a country is not a region of itself, so drop
// those, except where the country is a single NUTS-2 unit (EE, LV, MT and so on).
const REGION_RECORDS = Object.fromEntries(
  Object.entries(REGIONS_BY_COUNTRY).map(([c, regs]) => [
    c, regs.length > 1 ? regs.filter(r => (r.nuts||"").length > 2) : regs
  ])
);
// Backwards-compatible shape used across the UI: country -> [regionName, ...]
const EU_COUNTRIES = Object.fromEntries(
  Object.entries(REGION_RECORDS).map(([c, regs]) => [c, regs.map(r => r.name)])
);
// Quick lookup: (country, regionName) -> full region record
const REGION_LOOKUP = {};
for (const [c, regs] of Object.entries(REGION_RECORDS)) {
  for (const r of regs) REGION_LOOKUP[`${c}|||${r.name}`] = r;
}
const getRegion = (country, name) => REGION_LOOKUP[`${country}|||${name}`] || null;

// The 14 EU industrial ecosystems a cluster can specialise in.
const ECOSYSTEMS = DATA_ECOSYSTEMS;

// Regions written in their own language, mapped to the English names used here,
// so a cluster called "Photonics Bretagne" resolves to Brittany.
const REGION_ALIASES = {"österreich":"Austria","région de bruxelles-capitale":"Brussels Capital Region","brussels hoofdstedelijk gewest":"Brussels Capital Region","vlaanderen":"Flanders","région wallonne":"Wallonia","κύπρος":"Cyprus","bayern":"Bavaria","hessen":"Hesse","niedersachsen":"Lower Saxony","nordrhein-westfalen":"North Rhine-Westphalia","rheinland-pfalz":"Rhineland-Palatinate","sachsen":"Saxony","sachsen-anhalt":"Saxony-Anhalt","thüringen":"Thuringia","eesti":"Estonia","αττική (attiki)":"Attica","βόρειο αιγαίο (voreio aigaio)":"North Aegean","νότιο αιγαίο (notio aigaio)":"South Aegean","kriti (κρήτη)":"Crete","kentriki makedonia  (κεντρική μακεδονία)":"Central Macedonia","dytiki makedonia  (δυτική μακεδονία)":"Western Macedonia","ipeiros (ήπειρος)":"Epirus","thessalia (θεσσαλία)":"Thessaly","ionia nisia (ιόνια νησιά)":"Ionian Islands","dytiki ellada ( δυτική ελλάδα)":"Western Greece","sterea ellada (στερεά ελλάδα)":"Central Greece","peloponnisos (πελοπόννησος)":"Peloponnese","españa":"Spain","principado de asturias":"Asturias","país vasco":"Basque Country","comunidad foral de navarra":"Navarre","aragón":"Aragon","comunidad de madrid":"Madrid","castilla y león":"Castile and León","castilla-la mancha":"Castile-La Mancha","cataluña":"Catalonia","comunitat valenciana":"Valencia","illes balears":"Balearic Islands","andalucía":"Andalusia","región de murcia":"Murcia","canarias":"Canary Islands","keski-suomi":"Central Finland","etelä-pohjanmaa":"South Ostrobothnia","pohjanmaa":"Ostrobothnia","varsinais-suomi":"Southwest Finland","etelä-karjala":"South Karelia","etelä-savo":"South Savo","pohjois-savo":"North Savo","pohjois-karjala":"North Karelia","keski-pohjanmaa":"Central Ostrobothnia","pohjois-pohjanmaa":"North Ostrobothnia","lappi":"Lapland","île-de-france":"Île-de-France","normandie":"Normandy","bourgogne franche-comté":"Bourgogne-Franche-Comté","auvergne-rhône-alpes":"Auvergne-Rhône-Alpes","bretagne":"Brittany","provence-alpes-côte d’azur":"Provence-Alpes-Côte d'Azur","corse":"Corsica","la réunion":"Réunion","italia":"Italy","piemonte":"Piedmont","valle d'aosta":"Aosta Valley","vallée d'aoste":"Aosta Valley","lombardia":"Lombardy","sicilia":"Sicily","sardegna":"Sardinia","provincia autonoma di bolzano":"South Tyrol","bozen":"South Tyrol","provincia autonoma di trento":"Trentino","toscana":"Tuscany","lëtzebuerg":"Luxembourg","latvija":"Latvia","noord-nederland":"North Netherlands","oost-nederland":"East Netherlands","west-nederland":"West Netherlands","zuid-nederland":"South Netherlands","polska":"Poland","łódzkie":"Łódź","mazowiecki regionalny":"Masovia","małopolskie":"Lesser Poland","śląskie":"Silesia","lubelskie":"Lublin","podkarpackie":"Subcarpathia","podlaskie":"Podlasie","wielkopolskie":"Greater Poland","zachodniopomorskie":"West Pomerania","lubuskie":"Lubusz","dolnośląskie":"Lower Silesia","opolskie":"Opole","kujawsko-pomorskie":"Kuyavia-Pomerania","warmińsko-mazurskie":"Warmia-Masuria","pomorskie":"Pomerania","norte":"North","área metropolitana de lisboa":"Lisbon Metropolitan Area","região autónoma dos açores (pt)":"Azores","região autónoma da madeira (pt)":"Madeira","românia":"Romania","bucurești - ilfov":"Bucharest-Ilfov","sud-vest oltenia":"South-West Oltenia","nord-vest":"North-West","nord-est":"North-East","sud-est":"South-East","sud-muntenia":"South-Muntenia","vest":"West","blekinge län":"Blekinge","kalmar län":"Kalmar","gotlands län":"Gotland","jönköpings län":"Jönköping","kronobergs län":"Kronoberg","halland län":"Halland","uppsala län":"Uppsala","södermanlands län":"Södermanland","östergötlands län":"Östergötland","örebro län":"Örebro","västmanlands län":"Västmanland","skåne län":"Skåne","västra götalands län":"Västra Götaland","värmlands län":"Värmland","dalarnas län":"Dalarna","gävleborgs län":"Gävleborg","jämtlands län":"Jämtland","västerbottens län":"Västerbotten","västernorrlands län":"Västernorrland","norrbottens län":"Norrbotten","stockholms län":"Stockholm","niederösterreich":"Lower Austria","wien":"Vienna","kärnten":"Carinthia","steiermark":"Styria","oberösterreich":"Upper Austria","tirol":"Tyrol","hlavní město praha":"Prague"};

/* ═══════════════════════════════════════════════════════════
   CLUSTER REGISTRY
   Names, countries and cities of real cluster organisations listed on the
   European Cluster Collaboration Platform (ECCP), used to name your cluster
   and your rivals. Organisational fields only: no contact details or people.
   r is the region the cluster's city lies in, found from the city's location.
   Rival conduct in this game is invented and describes no real organisation.
   1445 profiles across the EU-27 and candidate countries.
═══════════════════════════════════════════════════════════ */
const ECCP_CLUSTERS = [
{n:"AgriNet Albania",c:"AL",y:"Korçë"},
{n:"Albanian ICT Association (AITA)",c:"AL",y:"Tirana"},
{n:"PROEKSPORT ALBANIA ASSOCIATION TEXTILE&FOOTWEAR",c:"AL",e:"textiles",y:"Albania"},
{n:"Wood Industry Cluster Albania",c:"AL",e:"retail",y:"Tirana"},
{n:"ACstyria Mobilitätscluster",c:"AT",e:"aerospace_and_defe",y:"Raaba-Grambach"},
{n:"Austrian Centre of Industrial Biotechnology (acib)",c:"AT",y:"Graz",r:"Styria"},
{n:"Automotive Cluster @Business Upper Austria - OÖ Wirtschaftsagentur",c:"AT",y:"Linz",r:"Upper Austria"},
{n:"BioNanoNet Forschungsgesellschaft mbH (BNN)",c:"AT",e:"health",y:"Graz",r:"Styria"},
{n:"Building Innovation Cluster @Business Upper Austria - OÖ Wirtschaftsagentur GmbH",c:"AT",y:"Linz",r:"Upper Austria"},
{n:"Cluster for Automation & Advanced Technologies Styria",c:"AT",e:"construction",y:"Graz",r:"Styria"},
{n:"Creative Industries Styria",c:"AT",e:"creative_and_cultu",y:"Österreich"},
{n:"Food Cluster @Business Upper - OÖ Wirtschaftsagentur GmbH",c:"AT",e:"agri_food",y:"Linz",r:"Upper Austria"},
{n:"Green Tech Valley Cluster",c:"AT",e:"energy_intensive_i",y:"Graz",r:"Styria"},
{n:"Holzcluster Steiermark GmbH",c:"AT",e:"agri_food",y:"Graz",r:"Styria"},
{n:"Human.technology Styria GmbH",c:"AT",e:"health",y:"Graz",r:"Styria"},
{n:"IT Cluster of Business Upper Austria GmbH",c:"AT",y:"Linz",r:"Upper Austria"},
{n:"Kreativwirtschaft Austria",c:"AT",y:"Vienna",r:"Vienna"},
{n:"LISAvienna",c:"AT",e:"agri_food",y:"Vienna",r:"Vienna"},
{n:"Mechatronics Cluster @ Business Upper Austria - OÖ Wirtschaftsagentur",c:"AT",y:"Linz",r:"Upper Austria"},
{n:"Medical Technology Cluster @Business Upper Austria - OÖ Wirtschaftsagentur GmbH",c:"AT",e:"digital",y:"Linz",r:"Upper Austria"},
{n:"Network Human Resources Cluster @Business Upper Austria - Wirtschaftsagentur GmbH",c:"AT",y:"Linz",r:"Upper Austria"},
{n:"OÖ Energiesparverband - Cleantech-Cluster Energy",c:"AT",e:"energy_renewables",y:"Linz",r:"Upper Austria"},
{n:"Photonics Austria",c:"AT",e:"aerospace_and_defe",y:"Weiz"},
{n:"Plastics Cluster @ Business Upper Austria - OÖ Wirtschaftsagentur GmbH",c:"AT",y:"Linz",r:"Upper Austria"},
{n:"Silicon Alps",c:"AT",y:"Villach",r:"Carinthia"},
{n:"Silicon Alps Cluster GmbH",c:"AT",e:"electronics",y:"Österreich"},
{n:"Social Entrepreneurship Network Austria",c:"AT",y:"Vienna",r:"Vienna"},
{n:"Standortagentur Tirol GmbH | Cluster Mechatronik Tirol",c:"AT",e:"construction",y:"Österreich"},
{n:"Standortagentur Tirol GmbH: Cluster IT Tirol",c:"AT",y:"Innsbruck",r:"Tyrol"},
{n:"Standortagentur Tirol GmbH: Cluster Life Sciences Tirol",c:"AT",y:"Innsbruck",r:"Tyrol"},
{n:"Standortagentur Tirol GmbH: Cluster Renewable Energies Tirol",c:"AT",y:"Innsbruck",r:"Tyrol"},
{n:"Standortagentur Tirol GmbH: Cluster Wellness Tirol",c:"AT",e:"agri_food",y:"Innsbruck",r:"Tyrol"},
{n:"ecoplus. The Business Agency of Lower Austria, Food Cluster",c:"AT",e:"agri_food",y:"St. Pölten",r:"Lower Austria"},
{n:"ecoplus. The Business Agency of Lower Austria, Green Building Cluster",c:"AT",e:"construction",y:"St. Pölten",r:"Lower Austria"},
{n:"ecoplus. The Business Agency of Lower Austria, Mechatronics-Cluster",c:"AT",e:"electronics",y:"St. Pölten",r:"Lower Austria"},
{n:"ecoplus. The Business Agency of Lower Austria, Plastics-Cluster",c:"AT",e:"digital",y:"St. Pölten",r:"Lower Austria"},
{n:"Bit Alliance",c:"BA",y:"Sarajevo"},
{n:"BioWin",c:"BE",y:"Gosselies"},
{n:"Biovia",c:"BE",e:"health",y:"Gent",r:"Flanders"},
{n:"Blue Cluster",c:"BE",e:"construction",y:"Oostende",r:"Flanders"},
{n:"CAP Construction",c:"BE",y:"Les Isnes"},
{n:"CIDSS.be",c:"BE",y:"Brussel",r:"Brussels Capital Region"},
{n:"Catalisti",c:"BE",e:"digital",y:"Antwerpen",r:"Flanders"},
{n:"Cluster Eco Construction",c:"BE",y:"Namur",r:"Wallonia"},
{n:"Cluster H2O",c:"BE",e:"agri_food",y:"Belgique"},
{n:"Cluster Innovatieve Coatings",c:"BE",y:"Brussels",r:"Brussels Capital Region"},
{n:"DSP Valley",c:"BE",y:"Leuven",r:"Flanders"},
{n:"EquisFair",c:"BE",y:"Vielsalm"},
{n:"European Association of Remote Sensing Companies",c:"BE",y:"BRUSSELS",r:"Brussels Capital Region"},
{n:"Flanders Bike Valley",c:"BE",y:"Beringen",r:"Flanders"},
{n:"Flanders Biobased Valley",c:"BE",y:"Gent",r:"Flanders"},
{n:"Flanders Make",c:"BE",y:"Lommel",r:"Flanders"},
{n:"Flanders Space",c:"BE",e:"aerospace_and_defe",y:"Hoboken",r:"Flanders"},
{n:"Flanders' FOOD",c:"BE",e:"agri_food",y:"Brussels",r:"Brussels Capital Region"},
{n:"Flemish Aerospace Group (FLAG)",c:"BE",y:"Brussels",r:"Brussels Capital Region"},
{n:"Flux50 vzw",c:"BE",e:"construction",y:"Brussels",r:"Brussels Capital Region"},
{n:"GREENWIN, Belgian Innovation Cluster",c:"BE",y:"Gosselies"},
{n:"Groen Licht Vlaanderen",c:"BE",y:"Gent",r:"Flanders"},
{n:"Hydrogen Industry Cluster",c:"BE",e:"energy_renewables",y:"Turnhout",r:"Flanders"},
{n:"IBN Offshore Energy (OWI-Lab)",c:"BE",y:"Heverlee",r:"Flanders"},
{n:"INFOPOLE Cluster TIC",c:"BE",e:"digital",y:"Charleroi",r:"Wallonia"},
{n:"LSEC - Leaders In Security",c:"BE",y:"Leuven",r:"Flanders"},
{n:"Logistics in Wallonia",c:"BE",e:"mobility_transport",y:"Grâce-Hollogne"},
{n:"Mechanical Engineering and Mechatronics Cluster West Flanders",c:"BE",y:"Brugge",r:"Flanders"},
{n:"PLASTIWIN",c:"BE",y:"Nivelles",r:"Wallonia"},
{n:"Pack4Food",c:"BE",e:"agri_food",y:"Ghent",r:"Flanders"},
{n:"Pôle MecaTech",c:"BE",e:"aerospace_and_defe",y:"Suarlée"},
{n:"REWAN",c:"BE",e:"energy_intensive_i",y:"Liège",r:"Wallonia"},
{n:"Skywin",c:"BE",y:"Wavre",r:"Wallonia"},
{n:"Smart Digital Farming",c:"BE",y:"Merelbeke",r:"Flanders"},
{n:"Smart Hub Flemish Brabant Cleantech",c:"BE",y:"Leuven",r:"Flanders"},
{n:"Smart Hub Flemish Brabant Health",c:"BE",y:"Leuven",r:"Flanders"},
{n:"Smart Region Flanders V.Z.W.",c:"BE",y:"Leuven",r:"Flanders"},
{n:"Strategisch Initiatief Materialen - Flam3D",c:"BE",y:"ZWIJNAARDE"},
{n:"TWIST Cluster",c:"BE",e:"creative_and_cultu",y:"Seraing",r:"Wallonia"},
{n:"Valbiom",c:"BE",e:"agri_food",y:"Belgique"},
{n:"Wagralim, the agri-food innovation cluster of Wallonia, Belgium",c:"BE",e:"agri_food",y:"Gosselies"},
{n:"circlemade",c:"BE",y:"Bruxelles",r:"Brussels Capital Region"},
{n:"ecobuild.brussels",c:"BE",y:"Brussels",r:"Brussels Capital Region"},
{n:"hospitality.brussels",c:"BE",y:"Brussels",r:"Brussels Capital Region"},
{n:"lifetech.brussels",c:"BE",y:"Brussels",r:"Brussels Capital Region"},
{n:"play.brussels",c:"BE",y:"Brussels",r:"Brussels Capital Region"},
{n:"AI Cluster Bulgaria",c:"BG",e:"digital",y:"Sofia",r:"Yugozapaden"},
{n:"AgriVentures",c:"BG",e:"agri_food",y:"София-Град"},
{n:"Association for innovation, business excellence, services and technology",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Automotive Cluster Bulgaria",c:"BG",e:"mobility_transport",y:"Sofia",r:"Yugozapaden"},
{n:"Black Sea Energy Cluster",c:"BG",y:"Varna",r:"Severoiztochen"},
{n:"Bulgarian Branch Association Polymers",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Bulgarian Digital Cluster",c:"BG",e:"digital",y:"Ruse",r:"Severen tsentralen"},
{n:"Bulgarian Fashion Association",c:"BG",e:"creative_and_cultu",y:"Ruse",r:"Severen tsentralen"},
{n:"Bulgarian Fintech Association",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Bulgarian Furniture Cluster",c:"BG",e:"creative_and_cultu",y:"Montana",r:"Severozapaden"},
{n:"CLUSTER HOISTING DEVICES LTD.",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"CREATECH BULGARIA",c:"BG",e:"creative_and_cultu",y:"Vidin",r:"Severozapaden"},
{n:"Cleantech Bulgaria",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Cluster Aero-Space Technologies, Research and Applications/ CASTRA",c:"BG",y:"Sofiia"},
{n:"Cluster Green Transport",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Cluster Information and Communication Technologies Blagoevgrad",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Cluster Mechatronics and Automation",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Cluster Sofia Knowledge City",c:"BG",e:"creative_and_cultu",y:"Sofia",r:"Yugozapaden"},
{n:"Cluster for Digital Transformation and Innovations",c:"BG",e:"digital",y:"Sofia",r:"Yugozapaden"},
{n:"Cluster for development and training of doctors in dental medicine",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Cluster of information and communication technologies Burgas",c:"BG",e:"digital",y:"Burgas",r:"Yugoiztochen"},
{n:"Culinary Arts and Hospitality Association",c:"BG",y:"Dobrich",r:"Severoiztochen"},
{n:"DIGITAL HEALTH AND INNOVATION CLUSTER BULGARIA",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"E-Business Cluster",c:"BG",y:"Пловдив"},
{n:"Electric vehicles industrial cluster",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Green Synergy Cluster",c:"BG",e:"energy_intensive_i",y:"Plovdiv",r:"Yuzhen tsentralen"},
{n:"Health and Life Sciences Cluster Bulgaria",c:"BG",e:"agri_food",y:"Sofia",r:"Yugozapaden"},
{n:"ICT Cluster",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"ICT Cluster Plovdiv",c:"BG",y:"Plovdiv",r:"Yuzhen tsentralen"},
{n:"ICT Cluster Varna",c:"BG",e:"digital",y:"Varna",r:"Severoiztochen"},
{n:"Industrial Cluster Srednogorie",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Innovative cluster Simulation models in medicine",c:"BG",y:"Sofia",r:"Yugozapaden"},
{n:"Marine Cluster Bulgaria",c:"BG",e:"energy_intensive_i",y:"Varna",r:"Severoiztochen"},
{n:"Regional Innovation Centre \"Ambitious Gabrovo\"",c:"BG",e:"digital",y:"Gabrovo",r:"Severen tsentralen"},
{n:"Renewable Energy Sources Cluster",c:"BG",e:"digital",y:"Blagoevgrad",r:"Yugozapaden"},
{n:"Space & STEAM Cluster",c:"BG",e:"aerospace_and_defe",y:"Sofia",r:"Yugozapaden"},
{n:"Specialized Cluster and Institute for Apparel and Textile - Danube",c:"BG",y:"Ruse",r:"Severen tsentralen"},
{n:"Cyprus Foundation of the Sea",c:"CY",e:"tourism",y:"Limassol",r:"Cyprus"},
{n:"Cyprus Space Cluster",c:"CY",e:"aerospace_and_defe",y:"Nicosia",r:"Cyprus"},
{n:"Green Cluster",c:"CY",y:"Nicosia",r:"Cyprus"},
{n:"Shopkeepers Artisans and Production Marketing Cooperative",c:"CY",y:"Nicosia",r:"Cyprus"},
{n:"Smart Cities Mediterranean Cluster",c:"CY",y:"Limassol",r:"Cyprus"},
{n:"AUTOKLASTR",c:"CZ",e:"mobility_transport",y:"Česko"},
{n:"Art of Glass - Czech and Moravian Glass Cluster",c:"CZ",e:"creative_and_cultu",y:"Czechia"},
{n:"Association for Applied Research in IT",c:"CZ",e:"creative_and_cultu",y:"Prague",r:"Prague"},
{n:"CLUTEX - klastr technicke textilie, z.s.",c:"CZ",e:"textiles",y:"Liberec",r:"Northeast"},
{n:"CREA Hydro&Energy, z.s.",c:"CZ",y:"Brno",r:"Southeast"},
{n:"CZECH STONE CLUSTER, družstvo",c:"CZ",y:"Lázně Bělohrad"},
{n:"CZECHIMPLANT",c:"CZ",e:"digital",y:"Kladno",r:"Central Bohemia"},
{n:"Cluster of Czech Furniture Manufacturers",c:"CZ",e:"creative_and_cultu",y:"Brno",r:"Southeast"},
{n:"Czech Aerospace Cluster, z.s.",c:"CZ",e:"mobility_transport",y:"Kunovice"},
{n:"Czech Battery Cluster",c:"CZ",e:"aerospace_and_defe",y:"Brno",r:"Southeast"},
{n:"Czech Machinery Cluster",c:"CZ",y:"Ostrava-Vítkovice",r:"Moravian-Silesia"},
{n:"Czech Marine Cluster, z. s.",c:"CZ",y:"Zlín",r:"Central Moravia"},
{n:"Czech National Semiconductor Cluster",c:"CZ",e:"electronics",y:"Brno",r:"Southeast"},
{n:"Czech Optical Cluster",c:"CZ",e:"aerospace_and_defe",y:"Olomouc",r:"Central Moravia"},
{n:"Czech Pellets Cluster",c:"CZ",y:"Dobrichovice"},
{n:"Czech Shoe and Leather Association",c:"CZ",e:"textiles",y:"Zlín",r:"Central Moravia"},
{n:"Czech Smart City Cluster",c:"CZ",e:"mobility_transport",y:"Prague",r:"Prague"},
{n:"CzechBio",c:"CZ",y:"Prague",r:"Prague"},
{n:"Defence and Security Industry Association of the Czech Republic",c:"CZ",y:"Prague",r:"Prague"},
{n:"E-commerce & Tech cluster, z.s.",c:"CZ",e:"digital",y:"Ostrava",r:"Moravian-Silesia"},
{n:"Energy-Technical Innovation Cluster",c:"CZ",e:"digital",y:"Pardubice",r:"Northeast"},
{n:"General Engineering Cluster",c:"CZ",e:"digital",y:"Planá nad Lužnicí"},
{n:"HK kovo cluster",c:"CZ",y:"Havířov",r:"Moravian-Silesia"},
{n:"HR Development Cluster",c:"CZ",e:"digital",y:"Želechovice nad Dřevnicí"},
{n:"INDUSTRY CLUSTER 4.0",c:"CZ",e:"digital",y:"Brno",r:"Southeast"},
{n:"IT Cluster",c:"CZ",e:"digital",y:"Ostrava-Mariánské Hory",r:"Moravian-Silesia"},
{n:"IT People Technological Platform",c:"CZ",e:"retail",y:"Podlesí"},
{n:"Klastr Mechatronika, z.s.",c:"CZ",e:"digital",y:"Dobřany"},
{n:"MedChemBio",c:"CZ",e:"health",y:"Olomouc - Holice",r:"Central Moravia"},
{n:"Moravian-Silesian Hydrogen Cluster",c:"CZ",e:"energy_renewables",y:"Česko"},
{n:"NATIONAL ENERGY CLUSTER, z.s.",c:"CZ",y:"Ostrava - Poruba",r:"Moravian-Silesia"},
{n:"NATIONAL WOOD PROCESSING CLUSTER",c:"CZ",y:"Ostrava-Poruba",r:"Moravian-Silesia"},
{n:"Nanoprogress",c:"CZ",e:"agri_food",y:"Pardubice",r:"Northeast"},
{n:"National Construction Cluster",c:"CZ",e:"construction",y:"Ostrava - Pustkovec",r:"Moravian-Silesia"},
{n:"Network Security Monitoring Cluster, cooperative",c:"CZ",y:"Brno",r:"Southeast"},
{n:"Plastics Cluster",c:"CZ",y:"Zlín",r:"Central Moravia"},
{n:"Prague.bio",c:"CZ",e:"health",y:"Prague",r:"Prague"},
{n:"Safety Technology Cluster",c:"CZ",e:"health",y:"Ostrava – Radvanice",r:"Moravian-Silesia"},
{n:"Scientific Expansion z.s.",c:"CZ",e:"construction",y:"Kravare"},
{n:"The Association for Innovation in Logistics",c:"CZ",e:"digital",y:"Ostrava-Mariánské Hory",r:"Moravian-Silesia"},
{n:"The Czech Hemp Cluster",c:"CZ",e:"agri_food",y:"Svor"},
{n:"WASTen, z.s.",c:"CZ",e:"construction",y:"Ústí nad Labem",r:"Northwest"},
{n:"Zlín Creative Cluster",c:"CZ",y:"Zlín",r:"Central Moravia"},
{n:"AFBW",c:"DE",y:"Stuttgart",r:"Baden-Württemberg"},
{n:"AMZ Sachsen",c:"DE",e:"mobility_transport",y:"Dresden",r:"Saxony"},
{n:"AVIASPACE BREMEN e.V.",c:"DE",y:"Bremen",r:"Bremen"},
{n:"Additive Manufacturing Berlin Brandenburg",c:"DE",e:"aerospace_and_defe",y:"Deutschland"},
{n:"Agronym - Network for Sustainable Bioeconomy",c:"DE",y:"Dresden",r:"Saxony"},
{n:"Artificial Intelligence Regensburg",c:"DE",e:"creative_and_cultu",y:"Deutschland"},
{n:"Automotive Nordwest e.V.",c:"DE",y:"Bremen",r:"Bremen"},
{n:"Baden Württemberg: Connected e.V.",c:"DE",y:"Stuttgart",r:"Baden-Württemberg"},
{n:"BalticNet-PlasmaTec e.V.",c:"DE",y:"Greifswald",r:"Mecklenburg-Vorpommern"},
{n:"Bavarian Food Cluster",c:"DE",y:"Kulmbach",r:"Bavaria"},
{n:"Bayern Innovativ Digital",c:"DE",e:"agri_food",y:"München",r:"Bavaria"},
{n:"Berlin-Brandenburg Aerospace Allianz e.V. (BBAA)",c:"DE",y:"Wildau"},
{n:"BioCon Valley GmbH®",c:"DE",y:"Rostock",r:"Mecklenburg-Vorpommern"},
{n:"BioEconomy Cluster Central Germany",c:"DE",y:"Halle/ Saale",r:"Saxony-Anhalt"},
{n:"BioLAGO e.V. the health network",c:"DE",e:"health",y:"Konstanz",r:"Baden-Württemberg"},
{n:"BioM Biotech Cluster Development GmbH",c:"DE",y:"Martinsried/Munich",r:"Bavaria"},
{n:"BioPark Regensburg GmbH / BioRegio Regensburg",c:"DE",y:"Regensburg",r:"Bavaria"},
{n:"BioRN - Life Science Cluster Rhine-Neckar",c:"DE",e:"health",y:"Deutschland"},
{n:"BioRegio STERN Management GmbH",c:"DE",e:"health",y:"Stuttgart",r:"Baden-Württemberg"},
{n:"Bioanalytik Münster",c:"DE",e:"health",y:"Münster",r:"North Rhine-Westphalia"},
{n:"Bioeconomy at Marine Sites (BaMS)",c:"DE",y:"Kiel",r:"Schleswig-Holstein"},
{n:"Bioeconomy in the metropolitan area",c:"DE",y:"Frankfurt Am Main",r:"Hesse"},
{n:"CLEANTECH Initiative Eastern Germany",c:"DE",y:"Dresden",r:"Saxony"},
{n:"CLIB - Cluster Industrial Biotechnology",c:"DE",e:"agri_food",y:"Duesseldorf",r:"North Rhine-Westphalia"},
{n:"CNA Railway Technology Cluster",c:"DE",y:"Nürnberg",r:"Bavaria"},
{n:"CURPAS",c:"DE",y:"Wildau"},
{n:"Chemistry Cluster Bavaria / Chemie-Cluster Bayern",c:"DE",e:"energy_intensive_i",y:"Munich / München",r:"Bavaria"},
{n:"Circular Saxony",c:"DE",e:"agri_food",y:"Chemnitz",r:"Saxony"},
{n:"Cluster Automotive",c:"DE",e:"mobility_transport",y:"Nürnberg",r:"Bavaria"},
{n:"Cluster Electric Mobility South-West managed by e-mobil BW",c:"DE",e:"mobility_transport",y:"Deutschland"},
{n:"Cluster Energietechnik",c:"DE",e:"energy_intensive_i",y:"Nürnberg",r:"Bavaria"},
{n:"Cluster Energy Technology Berlin-Brandenburg",c:"DE",y:"Potsdam",r:"Brandenburg"},
{n:"Cluster Food Industry Brandenburg",c:"DE",y:"Potsdam",r:"Brandenburg"},
{n:"Cluster H2BW (managed by e-mobil BW)",c:"DE",e:"energy_intensive_i",y:"Stuttgart",r:"Baden-Württemberg"},
{n:"Cluster ICT, Media, Creative Industries Berlin-Brandenburg",c:"DE",y:"Potsdam",r:"Brandenburg"},
{n:"Cluster Mechatronik & Automation @ Bayern Innovativ",c:"DE",e:"digital",y:"Nürnberg",r:"Bavaria"},
{n:"Cluster Medizin.NRW",c:"DE",e:"health",y:"Düsseldorf",r:"North Rhine-Westphalia"},
{n:"Cluster Metal Industry Brandenburg",c:"DE",y:"Potsdam",r:"Brandenburg"},
{n:"Cluster Mobility & Logistics",c:"DE",e:"digital",y:"Regensburg",r:"Bavaria"},
{n:"Cluster NanoMicroMaterialsPhotonics.NRW",c:"DE",e:"aerospace_and_defe",y:"Düsseldorf",r:"North Rhine-Westphalia"},
{n:"Cluster Nanotechnology/ Nanoinitiative Bayern GmbH",c:"DE",y:"Würzburg",r:"Bavaria"},
{n:"Cluster New Materials",c:"DE",y:"Nuremberg",r:"Bavaria"},
{n:"Cluster Plastics and Chemistry Brandenburg",c:"DE",y:"Potsdam",r:"Brandenburg"},
{n:"Cluster Sensor technology Bavaria / Strategic Partnership for Sensor Technologies",c:"DE",e:"aerospace_and_defe",y:"Regensburg",r:"Bavaria"},
{n:"Cluster Smart Industries",c:"DE",e:"construction",y:"Mannheim",r:"Baden-Württemberg"},
{n:"Cluster Transport, Mobility and Logistics Berlin-Brandenburg",c:"DE",e:"mobility_transport",y:"Berlin",r:"Berlin"},
{n:"Cluster for Individualized Immune Intervention (Ci3)",c:"DE",y:"Mainz",r:"Rhineland-Palatinate"},
{n:"Commercial Vehicle Cluster - Nutzfahrzeug GmbH",c:"DE",y:"Kaiserslautern",r:"Rhineland-Palatinate"},
{n:"Competence Center of aerospace and space technology Saxony/Thuringia r.a.",c:"DE",y:"Dresden",r:"Saxony"},
{n:"Cool Silicon e.V.",c:"DE",y:"Dresden",r:"Saxony"},
{n:"CyberForum e.V.",c:"DE",y:"Karlsruhe",r:"Baden-Württemberg"},
{n:"DiWISH Digitale Wirtschaft Schleswig-Holstein",c:"DE",y:"Kiel",r:"Schleswig-Holstein"},
{n:"EIN Quantum NRW",c:"DE",e:"digital",y:"Duesseldorf",r:"North Rhine-Westphalia"},
{n:"ENERGIEregion Nürnberg e.V.",c:"DE",y:"Nuremberg",r:"Bavaria"},
{n:"EPSI - European Platform for Sport Innovation",c:"DE",y:"Munich",r:"Bavaria"},
{n:"Ecoliance Rhineland-Palatinate",c:"DE",y:"Hoppstädten-Weiersbach"},
{n:"Electrifying Technical Organic Syntheses",c:"DE",e:"energy_intensive_i",y:"Karlsruhe",r:"Baden-Württemberg"},
{n:"Energy Saxony e.V.",c:"DE",y:"Dresden",r:"Saxony"},
{n:"Food Cluster Hamburg GmbH",c:"DE",e:"agri_food",y:"Deutschland"},
{n:"Franconian Plastics Network (KNF)",c:"DE",y:"Bayreuth",r:"Bavaria"},
{n:"GeoEnergy Celle e.V.",c:"DE",y:"Celle",r:"Lower Saxony"},
{n:"Geokompetenzzentrum Freiberg e.V. (GKZ)",c:"DE",e:"energy_intensive_i",y:"Freiberg",r:"Saxony"},
{n:"Green Tech Cluster",c:"DE",y:"Regensburg",r:"Bavaria"},
{n:"HZwo Hydrogen Technology Cluster",c:"DE",e:"mobility_transport",y:"Chemnitz",r:"Saxony"},
{n:"Hamburg Aviation e.V.",c:"DE",y:"Hamburg",r:"Hamburg"},
{n:"Hamburg Kreativ Gesellschaft mbH",c:"DE",y:"Hamburg",r:"Hamburg"},
{n:"Health Innovation Network by Bayern Innovativ GmbH",c:"DE",e:"health",y:"Nürnberg",r:"Bavaria"},
{n:"HealthCapital - Cluster Healthcare Industries Berlin Brandenburg",c:"DE",y:"Berlin",r:"Berlin"},
{n:"Hydrogen Clusters4Future",c:"DE",e:"energy_renewables",y:"Aachen",r:"North Rhine-Westphalia"},
{n:"INPLAS Network of Competence Industrial Plasma Surface Technology e.V.",c:"DE",e:"mobility_transport",y:"Braunschweig",r:"Lower Saxony"},
{n:"IT-Security Cluster",c:"DE",y:"93053 Regensburg",r:"Bavaria"},
{n:"ITS mobility e. V.",c:"DE",y:"Braunschweig",r:"Lower Saxony"},
{n:"IVAM Microtechnology Network",c:"DE",y:"Dortmund",r:"North Rhine-Westphalia"},
{n:"Industrial Association for Finishing - Yarns - Fabrics - Technical Textiles (IVGT)",c:"DE",y:"Frankfurt am Main",r:"Hesse"},
{n:"InfectoGnostics Research Campus Jena",c:"DE",y:"Jena",r:"Thuringia"},
{n:"InnoZent OWL e.V.",c:"DE",y:"Paderborn",r:"North Rhine-Westphalia"},
{n:"Innonet Kunststoff, Technologiezentrum Horb GmbH&Co.KG",c:"DE",y:"Horb am Neckar",r:"Baden-Württemberg"},
{n:"Innovations- und Effizienzcluster innoEFF",c:"DE",y:"Freiburg",r:"Baden-Württemberg"},
{n:"KI.NRW",c:"DE",e:"digital",y:"Sankt Augustin",r:"North Rhine-Westphalia"},
{n:"Kunststoff-Institut Lüdenscheid",c:"DE",y:"Lüdenscheid",r:"North Rhine-Westphalia"},
{n:"Kunststoff-Netzwerk Franken",c:"DE",y:"Bayreuth",r:"Bavaria"},
{n:"Leichtbau BW",c:"DE",y:"Stuttgart",r:"Baden-Württemberg"},
{n:"Life Science Nord",c:"DE",e:"health",y:"Hamburg",r:"Hamburg"},
{n:"Logistics Initiative Hamburg (Logistik-Initiative Hamburg Management GmbH)",c:"DE",e:"mobility_transport",y:"Hamburg",r:"Hamburg"},
{n:"MAI Carbon Cluster Management",c:"DE",y:"Augsburg",r:"Bavaria"},
{n:"MAI Carbon of Carbon Composites e.V.",c:"DE",y:"Augsburg",r:"Bavaria"},
{n:"Maritime Cluster Northern Germany",c:"DE",e:"mobility_transport",y:"Hamburg",r:"Hamburg"},
{n:"Measurement Valley e.V.",c:"DE",y:"Goettingen",r:"Lower Saxony"},
{n:"Medical Valley EMN e.V.",c:"DE",e:"digital",y:"Deutschland"},
{n:"MedicalMountains GmbH",c:"DE",y:"Tuttlingen",r:"Baden-Württemberg"},
{n:"MoWiN.net e.V., Cluster Mobility, Regionalmanagement Nordhessen GmbH",c:"DE",y:"Kassel",r:"Hesse"},
{n:"Mobility|Medical goes Additive e.V.",c:"DE",e:"aerospace_and_defe",y:"Berlin",r:"Berlin"},
{n:"NaGeB eV, Foodindustrie Bremen",c:"DE",y:"Bremen",r:"Bremen"},
{n:"NanoMat",c:"DE",y:"Eggenstein-Leopoldshafen",r:"Baden-Württemberg"},
{n:"Netzwerk Energie und Umwelt e.V. (NEU)",c:"DE",y:"Leipzig",r:"Saxony"},
{n:"Niedersachsen Aviation",c:"DE",y:"Hannover",r:"Lower Saxony"},
{n:"OLEC e.V.",c:"DE",y:"Oldenburg",r:"Lower Saxony"},
{n:"Optence e.V. / Photonics Hub",c:"DE",y:"Wörrstadt"},
{n:"OptoNet e.V. Photonics Network Thuringia",c:"DE",e:"aerospace_and_defe",y:"Jena",r:"Thuringia"},
{n:"Organic Electronics Saxony (OES)",c:"DE",e:"electronics",y:"Dresden",r:"Saxony"},
{n:"PROXIDRUGS",c:"DE",e:"health",y:"Frankfurt am Main",r:"Hesse"},
{n:"Packaging Valley Germany e.V.",c:"DE",e:"agri_food",y:"Deutschland"},
{n:"PhotonicNet GmbH",c:"DE",e:"agri_food",y:"Hannover",r:"Lower Saxony"},
{n:"Photonics BW e.V.",c:"DE",e:"electronics",y:"Aalen",r:"Baden-Württemberg"},
{n:"Photonics Cluster Berlin Brandenburg",c:"DE",e:"agri_food",y:"Berlin",r:"Berlin"},
{n:"Power Electronics Cluster within ECPE e.V.",c:"DE",y:"Nürnberg",r:"Bavaria"},
{n:"Process4Sustainability",c:"DE",e:"energy_intensive_i",y:"Frankfurt am Main",r:"Hesse"},
{n:"REGINA e.V.",c:"DE",y:"Aachen",r:"North Rhine-Westphalia"},
{n:"ROBONOM - AUTONOMOUS SERVICE ROBOTS",c:"DE",y:"Ellwangen",r:"Baden-Württemberg"},
{n:"Rail.S e.V.",c:"DE",e:"mobility_transport",y:"Dresden",r:"Saxony"},
{n:"Rhine-Neckar Metropolitan Region Ltd.",c:"DE",y:"Mannheim",r:"Baden-Württemberg"},
{n:"SACHSEN!TEXTIL",c:"DE",y:"Chemnitz",r:"Saxony"},
{n:"SaxoCell",c:"DE",e:"health",y:"Dresden",r:"Saxony"},
{n:"Security Network Munich",c:"DE",y:"Garching bei München",r:"Bavaria"},
{n:"Silicon Saxony",c:"DE",e:"digital",y:"Dresden",r:"Saxony"},
{n:"Silicon Vilstal",c:"DE",y:"Geisenhausen"},
{n:"Smart Infrastructure Hub Leipzig",c:"DE",e:"construction",y:"Leipzig",r:"Saxony"},
{n:"Smart Logistics Cluster",c:"DE",y:"Aachen",r:"North Rhine-Westphalia"},
{n:"Smart Systems Hub",c:"DE",e:"digital",y:"Deutschland"},
{n:"SmartTex Network",c:"DE",y:"Weimar",r:"Thuringia"},
{n:"Social Entrepreneurship City Hamburg",c:"DE",e:"proximity_and_soci",y:"Hamburg",r:"Hamburg"},
{n:"Sondermaschinen- und Anlagenbau SMAB",c:"DE",y:"Magdeburg",r:"Saxony-Anhalt"},
{n:"SpectroNet c/o Technologie- und Innovationspark Jena GmbH",c:"DE",y:"Jena",r:"Thuringia"},
{n:"TRANSFORMOTIVE DIALOG",c:"DE",e:"energy_intensive_i",y:"Deutschland"},
{n:"TechnologyMountains e. V",c:"DE",e:"aerospace_and_defe",y:"Villingen-Schwenningen",r:"Baden-Württemberg"},
{n:"Thurigian Renewable Energies Network (ThEEN)",c:"DE",e:"energy_renewables",y:"Erfurt",r:"Thuringia"},
{n:"Transmedia Bayern",c:"DE",y:"Munich",r:"Bavaria"},
{n:"Umweltcluster Bayern",c:"DE",y:"Augsburg",r:"Bavaria"},
{n:"Virtual Dimension Center Fellbach w.V.",c:"DE",y:"Fellbach",r:"Baden-Württemberg"},
{n:"automotive-bw",c:"DE",y:"Stuttgart",r:"Baden-Württemberg"},
{n:"bavAIRia e.V. / Cluster Aerospace",c:"DE",y:"Gilching",r:"Bavaria"},
{n:"bayern photonics e. V.",c:"DE",y:"Grafrath"},
{n:"biomastec",c:"DE",y:"Ellwangen",r:"Baden-Württemberg"},
{n:"biosaxony e.V.",c:"DE",y:"Dresden",r:"Saxony"},
{n:"cyberLAGO e.V. - digital competence network",c:"DE",y:"Konstanz",r:"Baden-Württemberg"},
{n:"food.net:z",c:"DE",y:"Heidelberg",r:"Baden-Württemberg"},
{n:"foodRegio",c:"DE",e:"agri_food",y:"Lübeck",r:"Schleswig-Holstein"},
{n:"health.textil",c:"DE",y:"Chemnitz",r:"Saxony"},
{n:"it's OWL Clustermanagement GmbH",c:"DE",y:"Paderborn",r:"North Rhine-Westphalia"},
{n:"kunststoffland NRW e.V.",c:"DE",e:"energy_intensive_i",y:"Düsseldorf",r:"North Rhine-Westphalia"},
{n:"media:net berlinbrandenburg e.V.",c:"DE",y:"Berlin",r:"Berlin"},
{n:"medways e.V.",c:"DE",y:"Jena",r:"Thuringia"},
{n:"microTEC Südwest e.V.",c:"DE",y:"Freiburg",r:"Baden-Württemberg"},
{n:"nanodiag BW",c:"DE",e:"health",y:"Freiburg im Breisgau",r:"Baden-Württemberg"},
{n:"smart³ e.V.",c:"DE",y:"Bautzen",r:"Saxony"},
{n:"thermoPre e. V. - Fibre composites for large-scale production",c:"DE",y:"Chemnitz",r:"Saxony"},
{n:"BigScience.dk or Big Science.dk",c:"DK",e:"aerospace_and_defe",y:"Danmark"},
{n:"CLEAN",c:"DK",e:"agri_food",y:"Sønderborg",r:"Southern Denmark"},
{n:"CenSec",c:"DK",e:"aerospace_and_defe",y:"Viborg",r:"Central Jutland"},
{n:"Copenhagen Fintech",c:"DK",y:"København K",r:"Capital Region"},
{n:"DAMRC",c:"DK",y:"Herning",r:"Central Jutland"},
{n:"Danish Life Science Cluster",c:"DK",y:"Copenhagen",r:"Capital Region"},
{n:"Danish Materials Network",c:"DK",e:"energy_renewables",y:"Esbjerg",r:"Southern Denmark"},
{n:"Danish Sound Cluster",c:"DK",y:"Struer"},
{n:"Dansk Center for Lys",c:"DK",y:"Ballerup",r:"Capital Region"},
{n:"DigitalLead",c:"DK",y:"Aarhus N",r:"Central Jutland"},
{n:"Energy Cluster Denmark",c:"DK",e:"energy_intensive_i",y:"Aalborg",r:"North Jutland"},
{n:"Filmby Aarhus",c:"DK",y:"Aarhus C.",r:"Central Jutland"},
{n:"Food & Bio Cluster Denmark",c:"DK",e:"agri_food",y:"Aarhus - Head Quarters, hubs: Copenhagen and 4 other cities",r:"Central Jutland"},
{n:"Indo Nordic Innovation Cluster",c:"DK",e:"agri_food",y:"Ballerup",r:"Capital Region"},
{n:"InnoBYG",c:"DK",y:"Taastrup",r:"Capital Region"},
{n:"Lifestyle & Design Cluster",c:"DK",y:"Herning",r:"Central Jutland"},
{n:"MADE - Manufacturing Academy of Denmark",c:"DK",e:"aerospace_and_defe",y:"Copenhagen",r:"Capital Region"},
{n:"Maritime & Logistics Innovation Denmark - MARLOG",c:"DK",y:"Copenhagen",r:"Capital Region"},
{n:"Maritime Cluster Copenhagen North",c:"DK",y:"Elsingore"},
{n:"Medicon Valley Alliance",c:"DK",y:"Copenhagen S",r:"Capital Region"},
{n:"Odense Robotics",c:"DK",e:"aerospace_and_defe",y:"Odense M",r:"Southern Denmark"},
{n:"WE BUILD DENMARK",c:"DK",y:"Albertslund",r:"Capital Region"},
{n:"Active Life Cluster SportEST",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"CREATIVE ESTONIA",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"Cleantech Estonia",c:"EE",e:"aerospace_and_defe",y:"Tallinn",r:"Estonia"},
{n:"Defence Estonia Cluster",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"Eesti Vesinikuklaster",c:"EE",e:"energy_renewables",y:"Tartu",r:"Estonia"},
{n:"Estonian Aviation Cluster",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"Estonian Digital Construction Cluster",c:"EE",e:"construction",y:"Tallinn",r:"Estonia"},
{n:"Estonian ICT Cluster",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"Estonian Logistics Cluster",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"Estonian Maritime Cluster",c:"EE",e:"aerospace_and_defe",y:"Tallinn",r:"Estonia"},
{n:"Estonian Recycling Competence Center/Green Economy Cluster",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"Estonian Smart City Cluster",c:"EE",y:"Tartu",r:"Estonia"},
{n:"Estonian Wooden Houses Cluster",c:"EE",y:"Tallinn",r:"Estonia"},
{n:"Medicine Estonia",c:"EE",y:"TALLINN",r:"Estonia"},
{n:"Tartu Health cluster",c:"EE",e:"digital",y:"Estonia",r:"Estonia"},
{n:"Tehnopol Greentech Cluster",c:"EE",e:"digital",y:"Tallinn",r:"Estonia"},
{n:"Tehnopol HealthTech Community (former Estonian Connected Health Cluster)",c:"EE",e:"health",y:"Tallinn",r:"Estonia"},
{n:"4icvesport",c:"ES",e:"agri_food",y:"valencia",r:"Valencia"},
{n:"AEI CLUSTER DEL TURISMO DE EXTREMADURA",c:"ES",y:"Cáceres",r:"Extremadura"},
{n:"AEI Conocimiento Asturias / Innovative Knowledge Business Association of Asturias",c:"ES",y:"Gijón",r:"Asturias"},
{n:"AEI de la Infancia - Asociación de Empresas Innovadoras de la Infancia",c:"ES",y:"Valencia (VALENCIA)",r:"Valencia"},
{n:"AEICE",c:"ES",y:"VALLADOLID",r:"Castile and León"},
{n:"AFM Cluster - Advanced Manufacturing Technologies",c:"ES",e:"aerospace_and_defe",y:"San Sebastian",r:"Basque Country"},
{n:"AINIA",c:"ES",y:"PATERNA",r:"Valencia"},
{n:"AMEC - Association for the Impulse of Internationalized Industry.",c:"ES",e:"construction",y:"Barcelona",r:"Catalonia"},
{n:"AMUEBLA | Innovative Business Association of Furniture Manufacturers in the Region of Murcia",c:"ES",y:"Murcia",r:"Murcia"},
{n:"APIDIT CTCR",c:"ES",y:"Arnedo"},
{n:"ASICE. Rubber Cluster",c:"ES",y:"MADRID",r:"Madrid"},
{n:"ASINCAR Agrifood Cluster of Asturias / ASINCAR",c:"ES",e:"agri_food",y:"Norena"},
{n:"ASOCIACION DE EMPRESAS DE TECNOLOGIA DE GALICIA (INEO)",c:"ES",y:"VIGO (PONTEVEDRA)",r:"Galicia"},
{n:"ASOCIACION VALENCIANA DE EMPRESARIOS DE PLASTICOS - AVEP",c:"ES",y:"Valencia",r:"Valencia"},
{n:"ASOCIACIÓN CLÚSTER DEL PAPEL DE EUSKADI",c:"ES",y:"San Sebastián",r:"Basque Country"},
{n:"ASSOCIATION OF TEXTILE COMPANIES OF THE VALENCIAN REGION",c:"ES",e:"textiles",y:"ONTINYENT",r:"Valencia"},
{n:"ATANA, Clúster TIC de Navarra (ICT Cluster of Navarra)",c:"ES",y:"Pamplona",r:"Navarre"},
{n:"AVAESEN",c:"ES",y:"Valencia",r:"Valencia"},
{n:"AVEBIOM Biomass Spanish Cluster",c:"ES",y:"Valladolid",r:"Castile and León"},
{n:"Aclima- Basque Environment Cluster - Asociación Cluster de Industrias de Medio Ambiente de Euskadi",c:"ES",y:"Bilbao",r:"Basque Country"},
{n:"Advanced Materials Cluster of Catalonia (MAV)",c:"ES",e:"mobility_transport",y:"Barcelona",r:"Catalonia"},
{n:"Aerospace, Space and Defence Cluster of Catalonia",c:"ES",e:"aerospace_and_defe",y:"Viladecans",r:"Catalonia"},
{n:"Andalucia Aerospace",c:"ES",e:"aerospace_and_defe",y:"San José de la Rinconada (Sevilla)",r:"Andalusia"},
{n:"Andalusian Cluster of Renewable Energy and Energy Efficiency",c:"ES",y:"Malaga",r:"Andalusia"},
{n:"Andalusian Food Cluster",c:"ES",e:"agri_food",y:"España"},
{n:"Andalusian Hydrogen Cluster",c:"ES",e:"energy_renewables",y:"Granada",r:"Andalusia"},
{n:"Andalusian Plastic Cluster",c:"ES",e:"agri_food",y:"Martos",r:"Andalusia"},
{n:"Aragon Audiovisual Cluster",c:"ES",e:"creative_and_cultu",y:"ZARAGOZA",r:"Aragon"},
{n:"Aragon Automotive and Mobility Cluster - CAAR",c:"ES",y:"Zaragoza",r:"Aragon"},
{n:"Aragonese Cluster of Agricultural and Livestock Production Means",c:"ES",e:"agri_food",y:"Zaragoza",r:"Aragon"},
{n:"Aragonian Aerospace Cluster",c:"ES",e:"aerospace_and_defe",y:"España"},
{n:"Aragón-Energy-Cluster-CLENAR",c:"ES",e:"energy_renewables",y:"Zaragoza",r:"Aragon"},
{n:"Arahealth",c:"ES",e:"health",y:"Zaragoza",r:"Aragon"},
{n:"Asociación Cluster del Naval Gallego (ACLUNAGA)",c:"ES",e:"construction",y:"Vigo",r:"Galicia"},
{n:"Asociación de Empresas del Metal de Madrid (AECIM)",c:"ES",e:"aerospace_and_defe",y:"Madrid",r:"Madrid"},
{n:"Asociación de Industrias de Forja por Estampación",c:"ES",y:"Bilbao",r:"Basque Country"},
{n:"Associació Clúster Foodservice of Catalonia",c:"ES",e:"agri_food",y:"Barcelona",r:"Catalonia"},
{n:"Audiovisual Cluster of Navarre",c:"ES",y:"Pamplona",r:"Navarre"},
{n:"Automotive Valencian Cluster",c:"ES",y:"Almussafes"},
{n:"BIOENERGY CLUSTER OF CATALONIA",c:"ES",e:"agri_food",y:"Terrassa",r:"Catalonia"},
{n:"BIOGA Cluster Tecnolóxico Empresarial das Ciencias da Vida",c:"ES",e:"agri_food",y:"Santiago de Compostela",r:"Galicia"},
{n:"BIOPLAT",c:"ES",y:"Madrid",r:"Madrid"},
{n:"BIOVEGEN - Spanish Technology Platform for Plant Biotechnology",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Balearic Marine Cluster",c:"ES",y:"Palma",r:"Balearic Islands"},
{n:"Balears.t Clúster d’Innovació Tecnològica en Turisme de les Illes Balears",c:"ES",y:"Palma",r:"Balearic Islands"},
{n:"Barcelona Finance Cluster",c:"ES",e:"proximity_and_soci",y:"Barcelona",r:"Catalonia"},
{n:"Barcelona Nautical Cluster",c:"ES",e:"tourism",y:"Barcelona",r:"Catalonia"},
{n:"Basque Energy Cluster (Cluster de Energía)",c:"ES",e:"energy_renewables",y:"Bilbao",r:"Basque Country"},
{n:"Basque Health Cluster",c:"ES",e:"health",y:"Derio"},
{n:"Basque Mobility and Logistics Cluster, MLC ITS Euskadi",c:"ES",e:"mobility_transport",y:"San Sebastian",r:"Basque Country"},
{n:"Beauty Cluster",c:"ES",e:"health",y:"Barcelona",r:"Catalonia"},
{n:"Biocat (Bioregion of Catalonia)",c:"ES",e:"health",y:"Barcelona",r:"Catalonia"},
{n:"Biotecnology and Biomedical Cluster of the Balearic Islands",c:"ES",e:"health",y:"Palma",r:"Balearic Islands"},
{n:"Bioval",c:"ES",e:"agri_food",y:"Valencia",r:"Valencia"},
{n:"CATALAN FINE FOOD CLUSTER CATALONIA GOURMET",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"CEEC",c:"ES",e:"digital",y:"España"},
{n:"CENFIM Home & Contract Furnishings Cluster",c:"ES",y:"La Sénia"},
{n:"CENTRO ESPAÑOL DE LOGÍSTICA (CEL)",c:"ES",e:"mobility_transport",y:"Coslada",r:"Madrid"},
{n:"CENTRO ESPAÑOL DE PLASTICOS",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"CEQUIP",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"CICAT: Lighting Cluster",c:"ES",e:"electronics",y:"Barcelona",r:"Catalonia"},
{n:"CIDATUM",c:"ES",e:"digital",y:"Logroño",r:"La Rioja"},
{n:"CITET Innovation Cluster for Sustainable Freight Delivery",c:"ES",e:"mobility_transport",y:"Madrid",r:"Madrid"},
{n:"CLUSTER DE ALIMENTACUÓN DE EUSKADI - BASQUE FOOD CLUSTER",c:"ES",y:"Zamudio, Vizcaya"},
{n:"CLUSTER DE BIENES DE EQUIPO DE CASTILLA Y LEON ( CBECYL )",c:"ES",y:"VALLADOLID",r:"Castile and León"},
{n:"CLUSTER DE FUNDICIÓN DEL PAíS VASCO (AFV - FUNDIGEX). BASQUE FOUNDRY CLUSTER",c:"ES",y:"Bilbao",r:"Basque Country"},
{n:"CLUSTER DE TURISMO DE MONTAÑA",c:"ES",y:"Jaca"},
{n:"CLUSTER EMPRESAS INNOVADORAS VALLE DEL JUGUETE",c:"ES",y:"IBI",r:"Valencia"},
{n:"CLUSTER MARÍTIMO DE CANARIAS",c:"ES",y:"LAS PALMAS DE GRAN CANARIA",r:"Canary Islands"},
{n:"CLUSTER SMART CITIES DE LA REGIÓN DE MURCIA",c:"ES",y:"Murcia",r:"Murcia"},
{n:"COEXPHAL, ASOCIACIÓN DE ORGANIZACIONES DE PRODUCTORES DE FRUTAS Y HORTALIZAS DE ALMERÍA",c:"ES",y:"Almería",r:"Andalusia"},
{n:"CSIM Real Estate Services Cluster",c:"ES",e:"construction",y:"Barcelona",r:"Catalonia"},
{n:"CTA Aerospace and Production Processes",c:"ES",y:"Sevilla",r:"Andalusia"},
{n:"CTA Agrifood",c:"ES",y:"Sevilla",r:"Andalusia"},
{n:"CTA Biotech",c:"ES",y:"Sevilla",r:"Andalusia"},
{n:"CTA Construction and Civil Engineering",c:"ES",y:"Sevilla",r:"Andalusia"},
{n:"CTA Energy and Environment",c:"ES",y:"Sevilla",r:"Andalusia"},
{n:"CTA ICT",c:"ES",y:"Sevilla",r:"Andalusia"},
{n:"CTN - Marine Tecnology Centre",c:"ES",y:"Fuente Álamo"},
{n:"Canarias Excelencia Tecnológica",c:"ES",e:"digital",y:"Las Palmas de Gran Canaria",r:"Canary Islands"},
{n:"Canary Cluster for Transports and Logistics",c:"ES",y:"Las Palmas de Gran Canaria",r:"Canary Islands"},
{n:"Canary Islands Audiovisual Cluster (CLAC)",c:"ES",e:"creative_and_cultu",y:"Santa Cruz de Tenerife",r:"Canary Islands"},
{n:"Canary Islands Enotourism Cluster",c:"ES",e:"agri_food",y:"España"},
{n:"Catalan Fashion Cluster",c:"ES",e:"textiles",y:"Barcelona",r:"Catalonia"},
{n:"Catalan Waste Cluster",c:"ES",e:"construction",y:"Barcelona",r:"Catalonia"},
{n:"Catalan Water Partnership",c:"ES",e:"agri_food",y:"Girona",r:"Catalonia"},
{n:"Catalonia Fire Safety Cluster",c:"ES",e:"construction",y:"España"},
{n:"Catalonia Logistics",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"Catalonia.health",c:"ES",e:"health",y:"Barcelona",r:"Catalonia"},
{n:"Chemical Industry Cluster of the Balearic Islands (CliQIB)",c:"ES",e:"tourism",y:"Palma de Mallorca",r:"Balearic Islands"},
{n:"Cluster ACUIPLUS",c:"ES",y:"Sant Carles de la Ràpita - Tarragona",r:"Catalonia"},
{n:"Cluster Audiovisual de Catalunya",c:"ES",e:"creative_and_cultu",y:"Barcelona",r:"Catalonia"},
{n:"Cluster Construcción Sostenible",c:"ES",y:"S/C de Tenerife"},
{n:"Cluster EDUTECH IB",c:"ES",e:"digital",y:"Palma",r:"Balearic Islands"},
{n:"Cluster FOOD+i",c:"ES",y:"Calahorra",r:"La Rioja"},
{n:"Cluster ICT Asturias",c:"ES",e:"digital",y:"Gijon",r:"Asturias"},
{n:"Cluster IDiA",c:"ES",e:"aerospace_and_defe",y:"Zaragoza",r:"Aragon"},
{n:"Cluster Innovacal",c:"ES",e:"agri_food",y:"España"},
{n:"Cluster SIVI",c:"ES",e:"health",y:"Valladolid",r:"Castile and León"},
{n:"Cluster Smart City Asturias",c:"ES",e:"aerospace_and_defe",y:"Gijón",r:"Asturias"},
{n:"Cluster Social Sumando Empleo Aragón",c:"ES",e:"proximity_and_soci",y:"Zaragoza",r:"Aragon"},
{n:"Cluster TEIB Transició Ecològica de les Illes Balears",c:"ES",e:"energy_intensive_i",y:"Palma",r:"Balearic Islands"},
{n:"Cluster de Empresas Digitales, Sostenibles e Industrias Innovadoras",c:"ES",e:"digital",y:"Granada",r:"Andalusia"},
{n:"Cluster de la Acuicultura",c:"ES",y:"Ribeira",r:"Galicia"},
{n:"Cluster del Granito",c:"ES",y:"O Porriño",r:"Galicia"},
{n:"Cluster of Renevable Energy and Energetic Solutions of Castilla and León",c:"ES",y:"Arroyo de la Encomienda"},
{n:"Clúster Digital Catalunya",c:"ES",e:"agri_food",y:"Barcelona",r:"Catalonia"},
{n:"Clúster Marítimo Marino de Andalucía",c:"ES",y:"Málaga",r:"Andalusia"},
{n:"Clúster de la Industria d'Automoció de Catalunya",c:"ES",e:"mobility_transport",y:"Barcelona",r:"Catalonia"},
{n:"ConstruLab360 Balearic Islands Innovative Construction Cluster",c:"ES",e:"construction",y:"Bunyola"},
{n:"CyberLur",c:"ES",e:"aerospace_and_defe",y:"León",r:"Castile and León"},
{n:"EDUTECH CLUSTER",c:"ES",e:"creative_and_cultu",y:"Barcelona",r:"Catalonia"},
{n:"EIKEN- Basque Audiovisual and Digital Content",c:"ES",y:"Bilbao",r:"Basque Country"},
{n:"ENERCLUSTER - WIND ENERGY CLUSTER OF NAVARRE",c:"ES",y:"Pamplona",r:"Navarre"},
{n:"ENERGY TECHNOLOGY CONSORTIUM OF ASTURIAS (CONSORCIO TECNOLÓGICO DE LA ENERGÍA DE ASTURIAS, AIE)",c:"ES",y:"MIERES",r:"Asturias"},
{n:"ETICOM (Asociación Empresarial Eticom, cluster de Economía Digital de Andalucía",c:"ES",y:"SEVILLA",r:"Andalusia"},
{n:"EXTREMADURA ENERGY CLUSTER (CLUSTER ENERGIA)",c:"ES",y:"BADAJOZ",r:"Extremadura"},
{n:"Energy Cluster of the Valencia Region",c:"ES",y:"Paterna",r:"Valencia"},
{n:"Engineering Cluster of the Canary Islands",c:"ES",y:"S/C de Tenerife"},
{n:"Eraikune - Construction Cluster of the Basque Country",c:"ES",y:"Bilbao",r:"Basque Country"},
{n:"FACYL CASTILLA Y LEON AUTOMOTIVE CLUSTER",c:"ES",y:"Boecillo-Valladolid"},
{n:"FEDACOVA",c:"ES",y:"Valencia",r:"Valencia"},
{n:"FEMAC",c:"ES",e:"agri_food",y:"Lleida",r:"Catalonia"},
{n:"FEMETALiNDUSTRY. CLUSTER OF ADVANCED MANUFACTURING OF METAL INDUSTRY IN ASTURIAS.",c:"ES",e:"digital",y:"Gijón",r:"Asturias"},
{n:"FENIN - Spanish Innovation Platform of Medical Technologies",c:"ES",e:"digital",y:"Madrid",r:"Madrid"},
{n:"FLUIDEX",c:"ES",e:"energy_intensive_i",y:"España"},
{n:"FORO MARITIMO VASCO",c:"ES",y:"BILBAO",r:"Basque Country"},
{n:"FUNCTIONAL PRINT CLUSTER",c:"ES",y:"Pamplona",r:"Navarre"},
{n:"FUNDACIÓN BCD PARA LA PROMOCIÓN DEL DISEÑO INDUSTRIAL",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"Feeling Innovation by Stanpa",c:"ES",e:"digital",y:"Madrid",r:"Madrid"},
{n:"Food Industry Cluster of Castilla y León",c:"ES",e:"agri_food",y:"Valladolid",r:"Castile and León"},
{n:"Foodservice Cluster Association",c:"ES",e:"agri_food",y:"Barcelona",r:"Catalonia"},
{n:"GAIA.-Association of Knowledge and Applied Technologies industries in the Basque Country",c:"ES",y:"San Sebastian",r:"Basque Country"},
{n:"GALICIAN AUDIOVISUAL CLUSTER",c:"ES",y:"Santiago de Compostela",r:"Galicia"},
{n:"GEOPLAT",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Galicia Food Cluster",c:"ES",e:"agri_food",y:"Santiago de Compostela",r:"Galicia"},
{n:"Galician Automotive and Mobility Cluster (CEAGA)",c:"ES",e:"mobility_transport",y:"Vigo",r:"Galicia"},
{n:"Galician Cluster for Environmental Solutions and Circular Economy",c:"ES",e:"agri_food",y:"Santiago de Compostela",r:"Galicia"},
{n:"Galician Construction Cluster",c:"ES",e:"construction",y:"A CORUÑA",r:"Galicia"},
{n:"Galician Health Cluster",c:"ES",y:"Santiago de Compostela",r:"Galicia"},
{n:"Galician ICT Cluster",c:"ES",y:"Santiago de Compostela",r:"Galicia"},
{n:"Global Sports Innovation Center powered by Microsoft",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Granada Health Technology Park (PTS)",c:"ES",y:"Granada",r:"Andalusia"},
{n:"Gremi Textil de Terrassa",c:"ES",e:"textiles",y:"Terrassa - Barcelona",r:"Catalonia"},
{n:"HABIC BASQUE HABITAT, WOOD, OFFICE & HOSPITALITY CLUSTER",c:"ES",e:"construction",y:"Zarautz",r:"Basque Country"},
{n:"HEGAN - Basque Aerospace Cluster",c:"ES",e:"aerospace_and_defe",y:"Zamudio"},
{n:"HELICE CLUSTER",c:"ES",y:"La Rinconada",r:"Andalusia"},
{n:"Habitat Cluster Barcelona",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"Health Cluster of Castilla y León: BIOTECYL",c:"ES",y:"VALLADOLID",r:"Castile and León"},
{n:"Hub Foodtech & Nutrition",c:"ES",e:"agri_food",y:"Reus",r:"Catalonia"},
{n:"INDESCAT- Catalan Sports Cluster",c:"ES",e:"creative_and_cultu",y:"Barcelona",r:"Catalonia"},
{n:"INEUSTAR, the Spanish Science Industry Association",c:"ES",e:"electronics",y:"Donostia",r:"Basque Country"},
{n:"INNOVACC",c:"ES",e:"agri_food",y:"Olot",r:"Catalonia"},
{n:"INNOVALIMEN",c:"ES",y:"Zaragoza",r:"Aragon"},
{n:"INNOVI - Catalan Wine Cluster",c:"ES",e:"agri_food",y:"Vilafranca del Penedès",r:"Catalonia"},
{n:"ITECAM, Metal-Mechanical Cluster of Castilla-La Mancha",c:"ES",e:"agri_food",y:"Tomelloso",r:"Castile-La Mancha"},
{n:"Iberian Sustainable Mining Cluster",c:"ES",y:"León",r:"Castile and León"},
{n:"In-Move by Railgrup",c:"ES",e:"mobility_transport",y:"Barcelona",r:"Catalonia"},
{n:"Industrial Transformation Cluster ain",c:"ES",y:"Cordovilla"},
{n:"Industrialized Construction Cluster of Catalonia",c:"ES",e:"construction",y:"Martorell",r:"Catalonia"},
{n:"Innovasturias",c:"ES",e:"agri_food",y:"Gijón",r:"Asturias"},
{n:"Innovation Footwear Cluster",c:"ES",y:"Elda (Alicante)",r:"Valencia"},
{n:"Innovative Logistics Association of Aragon",c:"ES",e:"mobility_transport",y:"Zaragoza",r:"Aragon"},
{n:"KID'S CLUSTER",c:"ES",e:"creative_and_cultu",y:"Barcelona",r:"Catalonia"},
{n:"Leather Cluster Barcelona",c:"ES",y:"Igualada",r:"Catalonia"},
{n:"Light Mobility Cluster",c:"ES",e:"mobility_transport",y:"España"},
{n:"MADRID AEROSPACE CLUSTER",c:"ES",y:"MADRID",r:"Madrid"},
{n:"MADRID ICT-AUDIOVISUAL CLUSTER",c:"ES",y:"Madrid",r:"Madrid"},
{n:"MAFEX",c:"ES",y:"Leioa",r:"Basque Country"},
{n:"MARITIME CLUSTER OF BALEARIC ISLANDS",c:"ES",e:"energy_renewables",y:"PALMA",r:"Balearic Islands"},
{n:"MCA - Madrid Automotive Cluster",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Madrid Capital FinTech",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Madrid Sustainability and Renewable Energies Cluster",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Madrid World Capital of Engineering, Construction and Architecture",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Málaga TechPark",c:"ES",y:"Málaga",r:"Andalusia"},
{n:"NAGRIFOOD",c:"ES",e:"agri_food",y:"España"},
{n:"National Technological Centre for Food and Canning",c:"ES",e:"agri_food",y:"MOLINA DE SEGURA",r:"Murcia"},
{n:"Navarra Health Cluster",c:"ES",e:"health",y:"Navarra"},
{n:"New Hydrogen Technologies - Nuevas Tecnologías del Hidrógeno (NTH)",c:"ES",y:"Cuarte"},
{n:"PIMEC LOGISTICS",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"Packaging Cluster",c:"ES",e:"agri_food",y:"Sabadell",r:"Catalonia"},
{n:"Packaging Cluster of the Valencian Community",c:"ES",e:"textiles",y:"Valencia",r:"Valencia"},
{n:"Railway Innovation Hub",c:"ES",y:"Málaga",r:"Andalusia"},
{n:"SIDEREX BASQUE STEEL CLUSTER",c:"ES",y:"Leioa",r:"Basque Country"},
{n:"SMART CITY CLUSTER",c:"ES",e:"electronics",y:"MALAGA",r:"Andalusia"},
{n:"SOLARTYS - Spanish Solar Energy and Energy Efficiency Cluster",c:"ES",e:"energy_renewables",y:"Barcelona",r:"Catalonia"},
{n:"Smartech Cluster: Home Automation, Smart Cities, Smart Buildings, Digital Transformation and Industry 4.0",c:"ES",e:"digital",y:"Barcelona",r:"Catalonia"},
{n:"South Catalonia ICT Cluster",c:"ES",e:"agri_food",y:"Reus",r:"Catalonia"},
{n:"Spanish Association of Semiconductor Industry",c:"ES",e:"aerospace_and_defe",y:"Alcobendas",r:"Madrid"},
{n:"Spanish Building Cluster",c:"ES",e:"construction",y:"MADRID",r:"Madrid"},
{n:"Spanish Cluster of Pig Producers",c:"ES",e:"agri_food",y:"Zaragoza",r:"Aragon"},
{n:"Spanish Railways Technological Platform",c:"ES",y:"Madrid",r:"Madrid"},
{n:"Steel Innovation Cluster / Polo del Acero",c:"ES",y:"Aviles",r:"Asturias"},
{n:"TECNARA - Aragon IT Cluster",c:"ES",e:"digital",y:"Zaragoza",r:"Aragon"},
{n:"TSAC - SUSTAINABLE TOURISM CLUSTER OF ARAGON",c:"ES",y:"Huesca",r:"Aragon"},
{n:"Tech Tourism Cluster",c:"ES",e:"digital",y:"España"},
{n:"Technological and Business Pole of the Biomass of Asturias",c:"ES",e:"digital",y:"Ujo"},
{n:"Tecnova",c:"ES",e:"agri_food",y:"Almería",r:"Andalusia"},
{n:"Texfor",c:"ES",e:"textiles",y:"Sabadell",r:"Catalonia"},
{n:"The Automotive Cluster of Navarra",c:"ES",e:"mobility_transport",y:"Pamplona",r:"Navarre"},
{n:"Ticbiomed",c:"ES",y:"MURCIA",r:"Murcia"},
{n:"Turisfera - Cluster of Tourism Innovation of the Canary Islands",c:"ES",y:"Santa Cruz de Tenerife",r:"Canary Islands"},
{n:"Turistec International Cluster of Information and Communication technologies applied to tourism",c:"ES",y:"Palma",r:"Balearic Islands"},
{n:"Tèxtils.CAT",c:"ES",e:"textiles",y:"TERRASSA",r:"Catalonia"},
{n:"UNIPORTBILBAO",c:"ES",y:"Bilbao",r:"Basque Country"},
{n:"VALMETAL CLUSTER",c:"ES",y:"Valencia",r:"Valencia"},
{n:"WeMind Cluster",c:"ES",e:"health",y:"Sant Boi de Llobregat",r:"Catalonia"},
{n:"Wood and Design Cluster Galicia / Cluster da Madeira e o Deseño de Galicia (CMD)",c:"ES",e:"construction",y:"Santiago de Compostela",r:"Galicia"},
{n:"ZINNAE",c:"ES",y:"Zaragoza",r:"Aragon"},
{n:"amec urbis",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"i2CAT",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"secpho deep tech innovation cluster",c:"ES",y:"Barcelona",r:"Catalonia"},
{n:"AFDA - Association of Finnish Defence and Aerospace Industries",c:"FI",y:"Helsinki",r:"Helsinki Uusimaa"},
{n:"Agri-Food Cluster North Savo",c:"FI",e:"agri_food",y:"Iisalmi",r:"North Savo"},
{n:"Arctic Construction Cluster Finland",c:"FI",e:"construction",y:"Oulu",r:"North Ostrobothnia"},
{n:"Arctic Design & Development Environments Cluster, Lapland University of Applied Sciences",c:"FI",y:"Kemi",r:"Lapland"},
{n:"Arctic Design Cluster, University of Lapland",c:"FI",y:"Rovaniemi",r:"Lapland"},
{n:"Arctic Safety, Lapland University of Applied Sciences",c:"FI",y:"Rovaniemi",r:"Lapland"},
{n:"Arctic Smart Rural Community, ProAgria Lapland",c:"FI",y:"Saarenkylä"},
{n:"Arctic Sport Cluster",c:"FI",e:"digital",y:"Rovaniemi",r:"Lapland"},
{n:"Bio and Circular Cluster North Savo",c:"FI",e:"construction",y:"Kuopio",r:"North Savo"},
{n:"Biocluster Finland",c:"FI",e:"agri_food",y:"Suomi"},
{n:"Blue Economy Mikkeli",c:"FI",e:"agri_food",y:"Mikkeli",r:"South Savo"},
{n:"Business Joensuu",c:"FI",y:"Joensuu",r:"North Karelia"},
{n:"CLIC Innovation Oy",c:"FI",e:"energy_renewables",y:"Suomi"},
{n:"Circular Cluster Oulu",c:"FI",e:"agri_food",y:"Oulu",r:"North Ostrobothnia"},
{n:"DIMECC Ltd.",c:"FI",y:"Tampere",r:"Pirkanmaa"},
{n:"DigiCenterNS",c:"FI",e:"digital",y:"Kuopio",r:"North Savo"},
{n:"Energy Cluster North Savo",c:"FI",e:"energy_intensive_i",y:"Varkaus",r:"North Savo"},
{n:"EnergyVaasa (c/o Oy Merinova Ab)",c:"FI",e:"energy_renewables",y:"Vaasa",r:"Ostrobothnia"},
{n:"Finnish Water Forum",c:"FI",y:"Helsinki",r:"Helsinki Uusimaa"},
{n:"Green Net Finland",c:"FI",e:"energy_renewables",y:"Helsinki",r:"Helsinki Uusimaa"},
{n:"Greenreality Network",c:"FI",y:"Lappeenranta",r:"South Karelia"},
{n:"HealthTurku",c:"FI",y:"Turku",r:"Southwest Finland"},
{n:"IBC Finland ry",c:"FI",e:"agri_food",y:"Suomi"},
{n:"ITS Finland",c:"FI",e:"mobility_transport",y:"Suomi"},
{n:"Kuopio Health Co-op.",c:"FI",y:"Kuopio",r:"North Savo"},
{n:"Kuopio Water Cluster",c:"FI",e:"agri_food",y:"Kuopio",r:"North Savo"},
{n:"Lahti Mechatronics Network",c:"FI",y:"Lahti",r:"Päijät-Häme"},
{n:"Memory Campus",c:"FI",e:"creative_and_cultu",y:"Mikkeli",r:"South Savo"},
{n:"Mining Finland",c:"FI",e:"aerospace_and_defe",y:"Leppäkaarre"},
{n:"Nordic Innovation Accelerator",c:"FI",y:"Lahti",r:"Päijät-Häme"},
{n:"OIA/ Agile Commercialization",c:"FI",y:"Oulu",r:"North Ostrobothnia"},
{n:"OIA/ ICT & Digitalization",c:"FI",y:"Oulu",r:"North Ostrobothnia"},
{n:"OIA/ OuluHealth",c:"FI",y:"Oulu",r:"North Ostrobothnia"},
{n:"Oulu Automotive Cluster",c:"FI",e:"mobility_transport",y:"Oulu",r:"North Ostrobothnia"},
{n:"Oulu university - AIF Water Ecosystem",c:"FI",y:"Oulu",r:"North Ostrobothnia"},
{n:"Photonics Finland",c:"FI",e:"agri_food",y:"Joensuu",r:"North Karelia"},
{n:"Robocoast Cluster",c:"FI",y:"Pori",r:"Satakunta"},
{n:"Smart City Innovation Cluster",c:"FI",e:"construction",y:"Suomi"},
{n:"Smart and Sustainable Arctic Tourism",c:"FI",y:"Rovaniemi",r:"Lapland"},
{n:"South Savo Electric Mobility Cluster",c:"FI",e:"digital",y:"Suomi"},
{n:"South Savo Food Cluster",c:"FI",e:"agri_food",y:"Mikkeli",r:"South Savo"},
{n:"Tampere Imaging Ecosystem",c:"FI",y:"Tampere",r:"Pirkanmaa"},
{n:"Tampere Region Safety and Security Cluster",c:"FI",e:"aerospace_and_defe",y:"Tampere",r:"Pirkanmaa"},
{n:"The Arctic Industrial Circular Economy Cluster - Kiertotalouskeskus Digipolis Oy",c:"FI",e:"digital",y:"Kemi",r:"Lapland"},
{n:"The Food Province of Finland Cluster",c:"FI",e:"agri_food",y:"Seinajoki",r:"South Ostrobothnia"},
{n:"Water Cluster Finland",c:"FI",e:"energy_intensive_i",y:"Oulu",r:"North Ostrobothnia"},
{n:"ACD Nouvelle-Aquitaine",c:"FR",e:"aerospace_and_defe",y:"Bruges"},
{n:"AEROSPACE CLUSTER AUVERGNE-RHÔNE-ALPES",c:"FR",y:"LYON",r:"Auvergne-Rhône-Alpes"},
{n:"AFPG - GEODEEP",c:"FR",y:"Paris",r:"Île-de-France"},
{n:"AKTANTIS",c:"FR",e:"digital",y:"Valbonne Sophia-Antipolis"},
{n:"ALPHA-RLH Route des Lasers et des Hyperfréquences",c:"FR",y:"Talence",r:"Nouvelle-Aquitaine"},
{n:"AQM NORMANDY",c:"FR",e:"aerospace_and_defe",y:"CAEN",r:"Normandy"},
{n:"AQUIMER",c:"FR",y:"Boulogne-sur-Mer",r:"Hauts-de-France"},
{n:"ARIA NORMANDY",c:"FR",y:"COLOMBELLES"},
{n:"Aerospace Valley",c:"FR",e:"aerospace_and_defe",y:"Toulouse",r:"Occitanie"},
{n:"AgreenTech Valley",c:"FR",e:"agri_food",y:"Orléans Cedex",r:"Centre-Val de Loire"},
{n:"Agri Sud-Ouest Innovation",c:"FR",y:"Auzeville-Tolosane"},
{n:"Alliance Innovation Santé Nouvelle-Aquitaine",c:"FR",e:"health",y:"Pessac",r:"Nouvelle-Aquitaine"},
{n:"Aquanova Pole",c:"FR",e:"agri_food",y:"Courbevoie",r:"Île-de-France"},
{n:"Atlanpole Biotherapies",c:"FR",e:"health",y:"Nantes",r:"Pays de la Loire"},
{n:"Atlansun",c:"FR",y:"Nantes",r:"Pays de la Loire"},
{n:"BPN Brittany Naval Pole",c:"FR",y:"Lorient",r:"Brittany"},
{n:"BRETAGNE AEROSPACE",c:"FR",y:"SAINT-BRIEUC",r:"Brittany"},
{n:"BRIT'INOV",c:"FR",y:"PLOUFRAGAN"},
{n:"BioValley France",c:"FR",y:"ILLKIRCH",r:"Grand Est"},
{n:"Bioeconomy For Change (B4C)",c:"FR",e:"agri_food",y:"Barenton-Bugny"},
{n:"Biotech Sante Bretagne",c:"FR",e:"agri_food",y:"Rennes",r:"Brittany"},
{n:"CARA",c:"FR",e:"mobility_transport",y:"LYON",r:"Auvergne-Rhône-Alpes"},
{n:"CD2E",c:"FR",y:"Loos-en-Gohelle",r:"Hauts-de-France"},
{n:"CIMES, Creating Integrated MEchanical Systems",c:"FR",e:"aerospace_and_defe",y:"Clermont-Ferrand",r:"Auvergne-Rhône-Alpes"},
{n:"CLUSTER LUMIERE",c:"FR",e:"digital",y:"LYON",r:"Auvergne-Rhône-Alpes"},
{n:"COSMETIC VALLEY",c:"FR",e:"creative_and_cultu",y:"Chartres",r:"Centre-Val de Loire"},
{n:"Cap Digital",c:"FR",y:"Paris",r:"Île-de-France"},
{n:"Capenergies Association",c:"FR",e:"energy_intensive_i",y:"Aix en Provence",r:"Provence-Alpes-Côte d'Azur"},
{n:"Capital Games",c:"FR",y:"Paris",r:"Île-de-France"},
{n:"CleanTech Valley",c:"FR",e:"energy_renewables",y:"Aramon"},
{n:"Cluster Eco-Bâtiment",c:"FR",y:"Lyon",r:"Auvergne-Rhône-Alpes"},
{n:"Cluster GAT CARAIBES Logistique et Transports",c:"FR",y:"Fort de France"},
{n:"Cluster Montagne",c:"FR",e:"tourism",y:"PORTE-DE-SAVOIE"},
{n:"Cluster TIC SANTE",c:"FR",y:"PESSAC",r:"Nouvelle-Aquitaine"},
{n:"Competitiveness Cluster DERBI-CEMATER",c:"FR",e:"energy_renewables",y:"Perpignan",r:"Occitanie"},
{n:"Creative Factory by Samoa",c:"FR",y:"Nantes",r:"Pays de la Loire"},
{n:"Céréales Vallée",c:"FR",y:"Saint Beauzire"},
{n:"DIGITAL LEAGUE",c:"FR",y:"Lyon",r:"Auvergne-Rhône-Alpes"},
{n:"DREAM Cluster",c:"FR",y:"ORLEANS",r:"Centre-Val de Loire"},
{n:"Descartes Sustainable City cluster",c:"FR",e:"construction",y:"Champs-sur-Marne",r:"Île-de-France"},
{n:"Digital 113",c:"FR",e:"digital",y:"France"},
{n:"EMC2",c:"FR",e:"aerospace_and_defe",y:"Bouguenais",r:"Pays de la Loire"},
{n:"EUROBIOMED",c:"FR",e:"health",y:"MARSEILLE",r:"Provence-Alpes-Côte d'Azur"},
{n:"Elastopôle",c:"FR",y:"Orléans",r:"Centre-Val de Loire"},
{n:"Energeia",c:"FR",y:"Amiens",r:"Hauts-de-France"},
{n:"EuraMaterials",c:"FR",e:"aerospace_and_defe",y:"TOURCOING",r:"Hauts-de-France"},
{n:"EuraTechnologies",c:"FR",e:"aerospace_and_defe",y:"France"},
{n:"Eurasante / Clubster NHL",c:"FR",y:"Loos, Région Hauts-de-France",r:"Hauts-de-France"},
{n:"European Cluster of Ceramics",c:"FR",e:"aerospace_and_defe",y:"LIMOGES",r:"Nouvelle-Aquitaine"},
{n:"FASK - Fashion Skills",c:"FR",e:"textiles",y:"Marseille",r:"Provence-Alpes-Côte d'Azur"},
{n:"Finance Innovation",c:"FR",e:"digital",y:"Paris",r:"Île-de-France"},
{n:"France FinTech",c:"FR",y:"Paris",r:"Île-de-France"},
{n:"France Water Team",c:"FR",y:"Montpellier",r:"Occitanie"},
{n:"GENOPOLE",c:"FR",e:"agri_food",y:"Evry",r:"Île-de-France"},
{n:"HYDREOS",c:"FR",y:"Tomblaine"},
{n:"Hauts-de-France Automotive Cluster",c:"FR",e:"mobility_transport",y:"Famars"},
{n:"Hippolia cluster",c:"FR",e:"agri_food",y:"Colombelles"},
{n:"I-Care Cluster",c:"FR",y:"Lyon",r:"Auvergne-Rhône-Alpes"},
{n:"ID4Mobility",c:"FR",e:"mobility_transport",y:"Nantes",r:"Pays de la Loire"},
{n:"INDURA",c:"FR",y:"Villeurbanne",r:"Auvergne-Rhône-Alpes"},
{n:"INNO'VIN",c:"FR",e:"agri_food",y:"VILLENAVE d'ORNON",r:"Nouvelle-Aquitaine"},
{n:"INNOV'ALLIANCE - Natural solutions at the heart of your development",c:"FR",e:"agri_food",y:"Avignon Cedex 9",r:"Provence-Alpes-Côte d'Azur"},
{n:"INTERBIO Nouvelle-Aquitaine",c:"FR",y:"Bordeaux",r:"Nouvelle-Aquitaine"},
{n:"Images & Reseaux",c:"FR",e:"digital",y:"LANNION",r:"Brittany"},
{n:"Imaginove",c:"FR",y:"Lyon",r:"Auvergne-Rhône-Alpes"},
{n:"Invivolim",c:"FR",y:"Limoges",r:"Nouvelle-Aquitaine"},
{n:"LYONBIOPOLE",c:"FR",e:"health",y:"LYON",r:"Auvergne-Rhône-Alpes"},
{n:"La Mêlée",c:"FR",e:"digital",y:"Toulouse",r:"Occitanie"},
{n:"Lyon Auvergne Rhône-Alpes Cancer cluster",c:"FR",y:"Lyon",r:"Auvergne-Rhône-Alpes"},
{n:"MA Sphère",c:"FR",y:"Toulouse",r:"Occitanie"},
{n:"MATIKEM",c:"FR",y:"Villeneuve d'Ascq",r:"Hauts-de-France"},
{n:"MEDEE",c:"FR",e:"electronics",y:"Lille",r:"Hauts-de-France"},
{n:"MEDICEN PARIS REGION",c:"FR",y:"Paris",r:"Île-de-France"},
{n:"MONT BLANC INDUSTRIES",c:"FR",y:"cluses",r:"Auvergne-Rhône-Alpes"},
{n:"Materalia",c:"FR",e:"energy_intensive_i",y:"Metz",r:"Grand Est"},
{n:"Mecanic ValléeM",c:"FR",y:"Viviez"},
{n:"Minalogic",c:"FR",e:"aerospace_and_defe",y:"Grenoble",r:"Auvergne-Rhône-Alpes"},
{n:"NAE (Normandie AeroEspace - Defense)",c:"FR",y:"Saint Etienne du Rouvray",r:"Normandy"},
{n:"NOV@LOG",c:"FR",y:"LE HAVRE",r:"Normandy"},
{n:"NextMove",c:"FR",e:"mobility_transport",y:"SAINT-ETIENNE-DU-ROUVRAY",r:"Normandy"},
{n:"Nova CHILD",c:"FR",y:"CHOLET",r:"Pays de la Loire"},
{n:"Nutrition Health Longevity",c:"FR",y:"loos",r:"Hauts-de-France"},
{n:"OPTICSVALLEY",c:"FR",y:"PALAISEAU",r:"Île-de-France"},
{n:"POLE AVENIA",c:"FR",y:"PAU",r:"Nouvelle-Aquitaine"},
{n:"POLEPHARMA",c:"FR",e:"health",y:"CHARTRES",r:"Centre-Val de Loire"},
{n:"PRIMI Pôle Transmédia Méditerranée",c:"FR",y:"Marseille",r:"Provence-Alpes-Côte d'Azur"},
{n:"PRIMUS Défense & Sécurité",c:"FR",y:"Toulouse",r:"Occitanie"},
{n:"Photonics Bretagne",c:"FR",e:"aerospace_and_defe",y:"Lannion",r:"Brittany"},
{n:"Photonics cluster OPTITEC",c:"FR",y:"Marseille",r:"Provence-Alpes-Côte d'Azur"},
{n:"Pixel Players",c:"FR",e:"creative_and_cultu",y:"France"},
{n:"Pole Action Media",c:"FR",e:"creative_and_cultu",y:"Le Soler"},
{n:"Pole Culture et Patrimoines",c:"FR",y:"ARLES",r:"Provence-Alpes-Côte d'Azur"},
{n:"Pole Media Grand Paris",c:"FR",y:"Saint-Denis",r:"Île-de-France"},
{n:"Polymeris",c:"FR",y:"Bellignat"},
{n:"Pôle Aqua-Valley",c:"FR",y:"MONTPELLIER",r:"Occitanie"},
{n:"Pôle Fibres-Energivie",c:"FR",y:"ILLKIRCH-GRAFFENSTADEN",r:"Grand Est"},
{n:"Pôle Mer Bretagne Atlantique",c:"FR",y:"Plouzané"},
{n:"Pôle Mer Méditerranée - Business & Innovation Sea Cluster",c:"FR",y:"Ollioules"},
{n:"Pôle Véhicule du Futur",c:"FR",e:"mobility_transport",y:"Etupes"},
{n:"QUALITROPIC",c:"FR",e:"agri_food",y:"SAINTE-CLOTILDE",r:"Auvergne-Rhône-Alpes"},
{n:"Qualimediterranée",c:"FR",y:"Montpellier",r:"Occitanie"},
{n:"Riviera Yachting NETWORK",c:"FR",y:"La Seyne sur Mer",r:"Provence-Alpes-Côte d'Azur"},
{n:"Robotics Place",c:"FR",e:"aerospace_and_defe",y:"TOULOUSE",r:"Occitanie"},
{n:"Robotics Valley",c:"FR",e:"digital",y:"Dijon",r:"Bourgogne-Franche-Comté"},
{n:"S2E2 competitiveness cluster - Smart Electricity Cluster",c:"FR",y:"TOURS",r:"Centre-Val de Loire"},
{n:"SAFE",c:"FR",e:"aerospace_and_defe",y:"Aix-en-Provence",r:"Provence-Alpes-Côte d'Azur"},
{n:"SOLTENA",c:"FR",e:"energy_intensive_i",y:"Limoges",r:"Nouvelle-Aquitaine"},
{n:"SYSTEM FACTORY",c:"FR",y:"TOULON",r:"Provence-Alpes-Côte d'Azur"},
{n:"Shop Expert Valley",c:"FR",e:"retail",y:"BLOIS",r:"Centre-Val de Loire"},
{n:"Systematic Paris-Region",c:"FR",e:"aerospace_and_defe",y:"PALAISEAU",r:"Île-de-France"},
{n:"TEAM2",c:"FR",e:"construction",y:"LENS",r:"Hauts-de-France"},
{n:"TECHTERA",c:"FR",e:"textiles",y:"Ecully",r:"Auvergne-Rhône-Alpes"},
{n:"TEMERGIE",c:"FR",y:"Saint Denis",r:"Île-de-France"},
{n:"TENERRDIS",c:"FR",e:"energy_renewables",y:"GRENOBLE",r:"Auvergne-Rhône-Alpes"},
{n:"TES - Normandy Digital Cluster",c:"FR",e:"creative_and_cultu",y:"Colombelles"},
{n:"VALORIAL",c:"FR",e:"agri_food",y:"RENNES",r:"Brittany"},
{n:"VEGEPOLYS VALLEY",c:"FR",e:"agri_food",y:"Angers",r:"Pays de la Loire"},
{n:"VITAGORA",c:"FR",y:"DIJON",r:"Bourgogne-Franche-Comté"},
{n:"Vallée de l'énergie",c:"FR",y:"BELFORT",r:"Bourgogne-Franche-Comté"},
{n:"Xylofutur, innovation cluster for the forest- and wood-based sector",c:"FR",e:"construction",y:"GRADIGNAN",r:"Nouvelle-Aquitaine"},
{n:"cluster of tourism GOazen",c:"FR",y:"BAYONNE",r:"Nouvelle-Aquitaine"},
{n:"i-Trans",c:"FR",e:"mobility_transport",y:"Valenciennes",r:"Hauts-de-France"},
{n:"infra2050",c:"FR",e:"digital",y:"Lyon",r:"Auvergne-Rhône-Alpes"},
{n:"Éa éco-entreprises",c:"FR",e:"energy_renewables",y:"Aix en Provence",r:"Provence-Alpes-Côte d'Azur"},
{n:"Georgia Medical (Tuberculosis) R&D Cluster",c:"GE",y:"Tbilisi"},
{n:"Georgian Apparel and Fashion Association - GAFA",c:"GE",y:"Tbilisi"},
{n:"Georgian Construction Materials Cluster",c:"GE",y:"Tbilisi"},
{n:"Georgian Furniture Cluster",c:"GE",y:"Tbilisi"},
{n:"Georgian Tourism Association",c:"GE",y:"Tbilisi"},
{n:"ICT Cluster Georgia",c:"GE",y:"Tbilisi"},
{n:"PMAG Packaging Cluster",c:"GE",y:"Tbilisi"},
{n:"AgriDiverCluster",c:"GR",e:"agri_food",y:"Kozani"},
{n:"AgroTech Export Cluster NPO",c:"GR",e:"agri_food",y:"Thessaloniki"},
{n:"BIONIAN CLUSTER",c:"GR",y:"Kallithea"},
{n:"CHORUS Cluster",c:"GR",e:"construction",y:"Thessaloniki"},
{n:"CO-PROTECT: Interoperable and Holistic Civil Protection Systems Cluster",c:"GR",e:"digital",y:"Athens"},
{n:"Cluster of Bioeconomy and Environment of Western Macedonia (CluBE)",c:"GR",e:"agri_food",y:"Kozani"},
{n:"Hellenic Association of Innovative Small and Medium Enterprises Innovation Greece",c:"GR",y:"Heraklion"},
{n:"Hellenic BioCluster",c:"GR",y:"Athens"},
{n:"Hellenic Digital Health Cluster",c:"GR",e:"digital",y:"ATHENS"},
{n:"Hellenic Emerging Technologies Industry Association",c:"GR",e:"electronics",y:"Athens"},
{n:"Hellenic Mobile Cluster",c:"GR",y:"Thessaloniki"},
{n:"Hellenic Photonics Cluster-HPhos",c:"GR",y:"Athens"},
{n:"ITS Hellas",c:"GR",y:"Athens"},
{n:"Intelligent Solutions for Zero & Positive Energy Buildings",c:"GR",y:"Thessaloniki"},
{n:"Pleiades IoT Innovation Cluster",c:"GR",y:"Athens"},
{n:"Smart Mobility & Logistics Cluster",c:"GR",e:"digital",y:"Thessaloniki"},
{n:"Strategis Maritime ICT Cluster",c:"GR",e:"aerospace_and_defe",y:"Piraeus"},
{n:"TECHNOLOGICAL RESEARCH CENTRE OF WESTERN MACEDONIA",c:"GR",y:"KOZANI"},
{n:"e-CODOMH",c:"GR",e:"construction",y:"Schimatari"},
{n:"gi-Cluster",c:"GR",e:"creative_and_cultu",y:"Athens"},
{n:"mi-Cluster",c:"GR",y:"Maroussi, Athens"},
{n:"si-Cluster",c:"GR",y:"Maroussi, Athens"},
{n:"3D grupa",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"Cluster Inteligentna Energija",c:"HR",e:"energy_renewables",y:"Zagreb",r:"City of Zagreb"},
{n:"Cluster for Eco Social Innovation and Development CEDRA Split",c:"HR",y:"Split",r:"Adriatic Croatia"},
{n:"Croatian Competitiveness Cluster for Electro Energetic and Production Machinery and Technology Sector",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"Croatian Competitiveness Cluster for Personalised Medicine",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"Croatian Competitiveness Cluster of food-processing sector",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"Croatian Defense Industry Competitiveness Cluster",c:"HR",y:"Croatia"},
{n:"Croatian Maritime Industry Competitiveness Cluster",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"Croatian Wood Cluster",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"Croatian cluster of competitivenes of creative and cultural industries",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"EUVITA Cluster",c:"HR",y:"Varaždin",r:"Northern Croatia"},
{n:"ICT Cluster Croatia",c:"HR",y:"Zagreb",r:"City of Zagreb"},
{n:"Klaster poljomehanizacije d.o.o.",c:"HR",y:"Osijek",r:"Pannonian Croatia"},
{n:"Kvarner Health Tourism Cluster",c:"HR",e:"health",y:"Opatija"},
{n:"Wood Cluster SLAVONIAN OAK",c:"HR",y:"Vinkovci",r:"Pannonian Croatia"},
{n:"AI3PA SMART CLUSTER",c:"HU",y:"Kecskemét",r:"Southern Great Plain"},
{n:"Agro ICT Cluster",c:"HU",y:"Budapest",r:"Budapest"},
{n:"Alliance Informatics and Innovation Cluster",c:"HU",y:"Budapest",r:"Budapest"},
{n:"ArchEnerg Cluster – Renewable Energy & Building Trade",c:"HU",e:"energy_intensive_i",y:"Szeged",r:"Southern Great Plain"},
{n:"Bakony-Balaton Mechatronics and Automotive Cluster",c:"HU",e:"electronics",y:"Székesfehérvár",r:"Central Transdanubia"},
{n:"Biotechnology Innovation Base",c:"HU",y:"Pécs",r:"Southern Transdanubia"},
{n:"Cluster of Applied Earth Sciences",c:"HU",y:"Kozármisleny"},
{n:"Cluster of Hungarian Accredited Organizations",c:"HU",e:"health",y:"Budapest",r:"Budapest"},
{n:"Construction Technology Cluster",c:"HU",y:"Pécs",r:"Southern Transdanubia"},
{n:"Creative Industry Cluster Hungary, CICC Association",c:"HU",e:"creative_and_cultu",y:"Pécs",r:"Southern Transdanubia"},
{n:"Digital Export Innovation Cluster",c:"HU",e:"digital",y:"Magyarország"},
{n:"Green Current Renewable Energetis and Innovation Cluster",c:"HU",y:"Szolnok",r:"Northern Great Plain"},
{n:"Hungarian Cybersecurity Cluster",c:"HU",e:"digital",y:"Magyarország"},
{n:"Hungarian Medical Cluster",c:"HU",e:"health",y:"Győr",r:"Western Transdanubia"},
{n:"Hungarian Mobility and Multimedia Cluster",c:"HU",y:"Budapest",r:"Budapest"},
{n:"Hungarian Open Innovation Cluster for Construction Industry",c:"HU",y:"Kecskemét",r:"Southern Great Plain"},
{n:"Hírös Supplier Cluster",c:"HU",e:"energy_intensive_i",y:"KECSKEMÉT",r:"Southern Great Plain"},
{n:"Hód Industry Cluster",c:"HU",y:"Szeged",r:"Southern Great Plain"},
{n:"INNOSKART Digital Cluster",c:"HU",e:"digital",y:"Székesfehérvár",r:"Central Transdanubia"},
{n:"IT Cluster Eszak-Alfold Hungary",c:"HU",y:"Debrecen",r:"Northern Great Plain"},
{n:"Information Management Innovation Cluster",c:"HU",y:"Pécs",r:"Southern Transdanubia"},
{n:"KEXPORT Environmental Cluster",c:"HU",y:"Budapest",r:"Budapest"},
{n:"MSE Hungarian Sport and Lifestyle Development ClusterCo.",c:"HU",y:"Debrecen",r:"Northern Great Plain"},
{n:"North Hungarian Automotive Cluster",c:"HU",e:"mobility_transport",y:"Miskolc",r:"Northern Hungary"},
{n:"North Hungarian IT Cluster",c:"HU",y:"Miskolc",r:"Northern Hungary"},
{n:"OMNIPACK First Hungarian Cluster of Packaging Technology",c:"HU",y:"Budapest",r:"Budapest"},
{n:"PANNON WOOD AND FURNITURE INDUSTRY ACCREDITED INNOVATION CLUSTER",c:"HU",e:"construction",y:"Sopron",r:"Western Transdanubia"},
{n:"PharmAgora Quality of Life Cluster",c:"HU",y:"Balatonfüred"},
{n:"Pharmapolis Debrecen Innovative Pharmaceutial Cluster",c:"HU",y:"Debrecen",r:"Northern Great Plain"},
{n:"Professio Metalworking and Engineering Cluster",c:"HU",e:"mobility_transport",y:"Győr",r:"Western Transdanubia"},
{n:"Science, Technology and Educational Platform for Photonics (STEPP) Cluster",c:"HU",y:"Szeged",r:"Southern Great Plain"},
{n:"Software Innovation Pole Cluster (cluster management organisation is Porta Novum Nonprofit Ltd.).)",c:"HU",e:"digital",y:"Szeged",r:"Southern Great Plain"},
{n:"South West Hungarian Engineering Cluster",c:"HU",e:"mobility_transport",y:"Pécs",r:"Southern Transdanubia"},
{n:"System Science Innovation Cluster",c:"HU",y:"Balatonfüred"},
{n:"Thermal-Health Industrial Cluster",c:"HU",y:"Debrecen",r:"Northern Great Plain"},
{n:"ZONE Cluster",c:"HU",e:"mobility_transport",y:"Debrecen",r:"Northern Great Plain"},
{n:"iFood Cluster",c:"HU",e:"agri_food",y:"Kaposvár",r:"Southern Transdanubia"},
{n:"AgriTech Ireland",c:"IE",e:"agri_food",y:"Tralee",r:"Southern"},
{n:"Circular Bioeconomy Cluster",c:"IE",e:"agri_food",y:"Tralee",r:"Southern"},
{n:"Connected Health & Wellbeing Cluster - Dundalk IoT",c:"IE",e:"health",y:"Ireland"},
{n:"Cyber Ireland",c:"IE",e:"digital",y:"Cork",r:"Southern"},
{n:"IT@Cork",c:"IE",y:"Cork",r:"Southern"},
{n:"Ireland South East Financial Services Cluster at South East Economic Development Office",c:"IE",e:"digital",y:"Waterford",r:"Southern"},
{n:"Irish Bioeconomy Foundation",c:"IE",y:"Thurles"},
{n:"Irish Digital Engineering and Advanced Manufacturing",c:"IE",y:"Limerick",r:"Southern"},
{n:"Shannon International Aviation Services Centre (IASC)",c:"IE",y:"Shannon"},
{n:"Technology Ireland Innovation Forum (Formerly ISIN)",c:"IE",y:"Dublin 2",r:"Eastern & Midland"},
{n:"The Fintech Corridor",c:"IE",e:"digital",y:"Ireland"},
{n:"advanced technologies in manufacturing cluster",c:"IE",y:"Athlone",r:"Eastern & Midland"},
{n:"ACMM- Marche Manufacturing Cluster Association",c:"IT",y:"Ancona",r:"Marche"},
{n:"AFIL - Lombardy Intelligent Factory Association",c:"IT",e:"digital",y:"Milano",r:"Lombardy"},
{n:"AIR - Aerospace Innovation & Research",c:"IT",e:"aerospace_and_defe",y:"Mestre VENEZIA",r:"Veneto"},
{n:"Aerospace Technology District",c:"IT",y:"Brindisi",r:"Puglia"},
{n:"BION Cluster lombardo scienze della vita",c:"IT",e:"health",y:"Milano",r:"Lombardy"},
{n:"BIOTECNOMED, Calabria District for Life Sciences",c:"IT",y:"Catanzaro",r:"Calabria"},
{n:"Basilicata Aerospace Cluster",c:"IT",e:"aerospace_and_defe",y:"Tito Scalo Potenza PZ"},
{n:"Basilicata Creativa CCI",c:"IT",e:"creative_and_cultu",y:"Matera",r:"Basilicata"},
{n:"Blue Italian Growth Technology Cluster (BIG TC)",c:"IT",y:"Napoli",r:"Campania"},
{n:"Brianza Community Cluster",c:"IT",e:"proximity_and_soci",y:"Monza",r:"Lombardy"},
{n:"C.H.I.CO. Cluster of Health, Innovation and Community",c:"IT",y:"Latina",r:"Lazio"},
{n:"CAT.AL, High Technology Agrifood Lombardy Cluster (Parco Tecnologico Padano)",c:"IT",y:"Lodi",r:"Lombardy"},
{n:"CL.USTER A.GRIFOOD N.AZIONALE - CL.A.N.",c:"IT",y:"Roma",r:"Lazio"},
{n:"COMET SCRL - Mechanical Engineering Cluster Friuli Venezia Giulia",c:"IT",e:"aerospace_and_defe",y:"Pordenone",r:"Friuli-Venezia Giulia"},
{n:"CRIT",c:"IT",y:"Vignola",r:"Emilia-Romagna"},
{n:"Campania Bioscience - Cluster on Life Sciences",c:"IT",y:"Napoli",r:"Campania"},
{n:"Campania Food and Wine Tourism Cluster",c:"IT",e:"agri_food",y:"Caserta",r:"Campania"},
{n:"Cleantech and energy Innovation Cluster",c:"IT",e:"energy_renewables",y:"Torino",r:"Piedmont"},
{n:"Clust-ER Agroalimentare Emilia-Romagna",c:"IT",e:"agri_food",y:"Bologna",r:"Emilia-Romagna"},
{n:"Clust-ER Build - Emilia-Romagna",c:"IT",y:"Bologna",r:"Emilia-Romagna"},
{n:"Clust-ER Economia Urbana",c:"IT",e:"proximity_and_soci",y:"Bologna",r:"Emilia-Romagna"},
{n:"Clust-ER Energia e Sviluppo sostenibile",c:"IT",e:"energy_renewables",y:"Italia"},
{n:"Clust-ER Health | Emilia Romagna",c:"IT",e:"health",y:"Bologna",r:"Emilia-Romagna"},
{n:"Clust-ER Innovate - Emilia-Romagna",c:"IT",e:"aerospace_and_defe",y:"Bologna",r:"Emilia-Romagna"},
{n:"Clust-ER Meccatronica e Motoristica",c:"IT",e:"aerospace_and_defe",y:"Bologna",r:"Emilia-Romagna"},
{n:"Cluster Fabbrica Intelligente",c:"IT",y:"Bologna",r:"Emilia-Romagna"},
{n:"Cluster Lucano di Bioeconomia ETS",c:"IT",y:"Matera",r:"Basilicata"},
{n:"Cluster Tecnologico Nazionale \"Made in Italy\"",c:"IT",e:"construction",y:"Milano",r:"Lombardy"},
{n:"Confindustria Emilia Area Centro",c:"IT",e:"aerospace_and_defe",y:"Bologna",r:"Emilia-Romagna"},
{n:"Consorzio Italbiotec",c:"IT",e:"agri_food",y:"Milano",r:"Lombardy"},
{n:"Consorzio nazionale Idee in rete",c:"IT",y:"Rome",r:"Lazio"},
{n:"Create - Cultural and creative industries",c:"IT",y:"Bologna",r:"Emilia-Romagna"},
{n:"Creative Apulia Cluster Association",c:"IT",y:"Bari",r:"Puglia"},
{n:"DAC, Campania Aerospace District",c:"IT",y:"Napoli",r:"Campania"},
{n:"DES Social Agriculture",c:"IT",e:"proximity_and_soci",y:"TRENTO",r:"Trentino"},
{n:"DID: technological Cluster on Interiors and Design",c:"IT",e:"construction",y:"Poggibonsi",r:"Tuscany"},
{n:"DITECFER District for Rail Technologies, High Speed, Networks Safety and Security",c:"IT",e:"mobility_transport",y:"Pistoia",r:"Tuscany"},
{n:"DITEDI Distretto Industriale delle Tecnologie Digitale - Cluster ICT FVG",c:"IT",e:"digital",y:"Tavagnacco (Udine)",r:"Friuli-Venezia Giulia"},
{n:"Dhitech Scarl",c:"IT",y:"Lecce",r:"Puglia"},
{n:"DiTNE Scarl",c:"IT",y:"Brindisi",r:"Puglia"},
{n:"Distretto Ligure delle Tecnologie Marine",c:"IT",e:"mobility_transport",y:"La Spezia",r:"Liguria"},
{n:"Distretto Tecnologico Agroalimentare - D.A.Re. Puglia scrl",c:"IT",e:"agri_food",y:"Foggia",r:"Puglia"},
{n:"EUTEKNOS",c:"IT",e:"creative_and_cultu",y:"Este",r:"Veneto"},
{n:"Ecodomus District",c:"IT",y:"Licata (AG)",r:"Sicily"},
{n:"European Platform for Sport Innovation - EPSI",c:"IT",y:"Bergamo",r:"Lombardy"},
{n:"FVG LIFE SCIENCES CLUSTER",c:"IT",e:"health",y:"Pordenone",r:"Friuli-Venezia Giulia"},
{n:"Federation of the Sea",c:"IT",y:"Rome",r:"Lazio"},
{n:"Federcanapa",c:"IT",e:"agri_food",y:"ROMA",r:"Lazio"},
{n:"Fondazione Agrifood & Bioeconomy FVG",c:"IT",e:"agri_food",y:"Colloredo di Monte Albano"},
{n:"Fondazione Cluster Smart Cities & Communities (Cluster SCC)- Lombardia",c:"IT",e:"digital",y:"Milano",r:"Lombardy"},
{n:"Fondazione Distretto Green & High Tech Monza Brianza",c:"IT",y:"Monza",r:"Lombardy"},
{n:"Forest & Wood FVG Service Cluster",c:"IT",y:"Tolmezzo"},
{n:"Future Farming",c:"IT",e:"agri_food",y:"Venezia",r:"Veneto"},
{n:"GOEL Cooperative Group",c:"IT",e:"agri_food",y:"Gioiosa Ionica"},
{n:"Green HoMe - Pole of Innovation for Sustainable Building",c:"IT",y:"Rende"},
{n:"Habitech - Trentino Technological District SCARL SB",c:"IT",e:"construction",y:"Rovereto",r:"Trentino"},
{n:"ICT4SSL",c:"IT",e:"digital",y:"Mestre-Venezia (Ve)",r:"Veneto"},
{n:"IMAST Italian technological district for the engineering of polymeric and composite materials and structures",c:"IT",y:"Napoli",r:"Campania"},
{n:"INNOVAAL",c:"IT",y:"Lecce",r:"Puglia"},
{n:"IR4I Aerospace Cluster",c:"IT",y:"Imola",r:"Emilia-Romagna"},
{n:"Improvenet",c:"IT",e:"digital",y:"Venezia Mestre",r:"Veneto"},
{n:"IncrediBOL! Project - Municipality of Bologna",c:"IT",y:"Bologna",r:"Emilia-Romagna"},
{n:"Innovation Cassiodoro Tourism Pole",c:"IT",e:"creative_and_cultu",y:"Catanzaro",r:"Calabria"},
{n:"Italian Forest Wood Cluster",c:"IT",e:"construction",y:"Rome",r:"Lazio"},
{n:"Italian Technology Cluster for Smart Communities",c:"IT",y:"Turin",r:"Piedmont"},
{n:"LAZIO CONNECT",c:"IT",y:"Roma",r:"Lazio"},
{n:"Lame Bio District",c:"IT",e:"agri_food",y:"Ruvo di Puglia (BA)",r:"Puglia"},
{n:"Lombardia Aerospace Cluster",c:"IT",e:"aerospace_and_defe",y:"Varese",r:"Lombardy"},
{n:"Lombardy Cluster Technologies for Living Environments",c:"IT",y:"Lecco",r:"Lombardy"},
{n:"Lombardy Energy Cleantech Cluster (LE2C)",c:"IT",e:"energy_intensive_i",y:"Milan",r:"Lombardy"},
{n:"Lombardy Green Chemistry Cluster",c:"IT",y:"Milano",r:"Lombardy"},
{n:"Lombardy Life Sciences Cluster",c:"IT",y:"Milan",r:"Lombardy"},
{n:"Lombardy Mobility Cluster",c:"IT",y:"Milan",r:"Lombardy"},
{n:"MESAP Innovation Cluster - Smart Products and Manufacturing",c:"IT",e:"aerospace_and_defe",y:"Torino",r:"Piedmont"},
{n:"Maritime Technology Cluster FVG S.c.ar.l.",c:"IT",e:"energy_intensive_i",y:"Monfalcone",r:"Friuli-Venezia Giulia"},
{n:"MeSSInA Foundation",c:"IT",e:"proximity_and_soci",y:"Messina",r:"Sicily"},
{n:"NAVIGO",c:"IT",y:"VIAREGGIO",r:"Tuscany"},
{n:"NET - Polo Innovazione Ambiente e Rischi Naturali - Innovation Cluster for Environment and Natural Risks",c:"IT",y:"Crotone",r:"Calabria"},
{n:"National Energy Technology Cluster",c:"IT",y:"Rome",r:"Lazio"},
{n:"Optoscana",c:"IT",y:"Sesto Fiorentino",r:"Tuscany"},
{n:"POINTEX - Textile Innovation Cluster",c:"IT",e:"textiles",y:"Biella",r:"Piedmont"},
{n:"PROPLAST",c:"IT",e:"agri_food",y:"Alessandria",r:"Piedmont"},
{n:"Piedmont Aerospace Cluster",c:"IT",y:"Torino",r:"Piedmont"},
{n:"Piemonte Innova - Polo ICT",c:"IT",e:"digital",y:"Turin",r:"Piedmont"},
{n:"Polo AGRIFOOD - NEXO Agrifood Hub Scpa",c:"IT",e:"agri_food",y:"Cuneo",r:"Piedmont"},
{n:"Polo ICT Pitagora",c:"IT",e:"digital",y:"Catanzaro",r:"Calabria"},
{n:"Polo Meccatronica",c:"IT",e:"digital",y:"Rovereto",r:"Trentino"},
{n:"RETE DI IMPRESE LUCE IN VENETO",c:"IT",e:"construction",y:"Piombino Dese",r:"Tuscany"},
{n:"RIBES per l'Ecosistema Salute e l'Alimentazione Smart",c:"IT",e:"agri_food",y:"Padova",r:"Veneto"},
{n:"RIR FACE DESIGN Cluster",c:"IT",e:"creative_and_cultu",y:"Vigonza"},
{n:"Regional Innovative Cluster Tech4Life",c:"IT",e:"health",y:"Verona",r:"Veneto"},
{n:"Regional Innovative Cluster for Agrifood",c:"IT",e:"agri_food",y:"Verona",r:"Veneto"},
{n:"Regional Innovative Cluster for Logistics",c:"IT",e:"mobility_transport",y:"Verona",r:"Veneto"},
{n:"Regional Innovative Network M3NET",c:"IT",e:"digital",y:"Venezia Mestre",r:"Veneto"},
{n:"Rete Innovativa Regionale Foresta Oro Veneto",c:"IT",y:"Sedico"},
{n:"SIIT Scpa",c:"IT",y:"GENOVA",r:"Liguria"},
{n:"SINFONET",c:"IT",e:"digital",y:"PADOVA",r:"Veneto"},
{n:"SMARTLAND VENICE",c:"IT",e:"tourism",y:"Venice",r:"Veneto"},
{n:"SMILE _ National Technological Cluster on Smart Living Technologies",c:"IT",y:"Lecce",r:"Puglia"},
{n:"SPRING - Italian Circular Bioeconomy Cluster",c:"IT",e:"energy_intensive_i",y:"Milano",r:"Lombardy"},
{n:"STRESS Scarl - High Tecnology District on Sustainable Construction",c:"IT",y:"Napoli",r:"Campania"},
{n:"Sistema Cosmetico Lombardo",c:"IT",e:"health",y:"Crema",r:"Lombardy"},
{n:"TRIULZA",c:"IT",e:"proximity_and_soci",y:"Milano",r:"Lombardy"},
{n:"Technologies for Earth Observation and Natural Risks",c:"IT",y:"Tito (PZ)"},
{n:"Technology Cluster on Energy and Green Economy (DTE²V) of the Tuscany Region",c:"IT",y:"Firenze",r:"Tuscany"},
{n:"Tecnopolo SpA",c:"IT",y:"Roma",r:"Lazio"},
{n:"The Fisheries and Blue Growth District",c:"IT",y:"MAZARA DEL VALLO",r:"Sicily"},
{n:"Torino Social Impact",c:"IT",e:"proximity_and_soci",y:"Torino",r:"Piedmont"},
{n:"Tourism Clust-ER",c:"IT",e:"tourism",y:"Bologna",r:"Emilia-Romagna"},
{n:"Tuscany Fashion Cluster",c:"IT",e:"textiles",y:"Prato",r:"Tuscany"},
{n:"Tuscany Life Sciences Cluster",c:"IT",e:"health",y:"Siena",r:"Tuscany"},
{n:"VCE Regional Innovative Cluster for Energy Efficiency",c:"IT",e:"energy_renewables",y:"Verona",r:"Veneto"},
{n:"Venetian Cluster",c:"IT",y:"Vicenza",r:"Veneto"},
{n:"Venetian Green Building Cluster",c:"IT",e:"construction",y:"Mestre",r:"Veneto"},
{n:"Veneto Green Cluster",c:"IT",e:"agri_food",y:"GRISIGNANO DI ZOCCO (VI)"},
{n:"Wood Furniture Home Cluster FVG",c:"IT",e:"construction",y:"Manzano"},
{n:"bioPmed / Bioindustry Park",c:"IT",e:"digital",y:"Colleretto Giacosa"},
{n:"e-Living Association",c:"IT",y:"Ancona",r:"Marche"},
{n:"AgriFood Lithuania",c:"LT",e:"agri_food",y:"Vilnius",r:"Capital Region"},
{n:"Artificial Intelligence Technology Cluster (DI-TECH)",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Association of Lithuanian Printing Industries",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"BCCS (Blockchain Cybersecurity and Compliance Solutions) Cluster",c:"LT",e:"digital",y:"Kaunas",r:"Central & Western Lithuania"},
{n:"Baltic Automotive Components Cluster (BACC)",c:"LT",y:"Kaunas",r:"Central & Western Lithuania"},
{n:"Baltic Film & Creative Tech Cluster",c:"LT",e:"creative_and_cultu",y:"Vilnius",r:"Capital Region"},
{n:"Bleended",c:"LT",e:"digital",y:"Vilnius",r:"Capital Region"},
{n:"Business Hive Vilnius Cluster",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Cleantech Lithuania",c:"LT",e:"digital",y:"Vilnius",r:"Capital Region"},
{n:"Cluster of Manufacturing Innovators",c:"LT",e:"aerospace_and_defe",y:"Lithuania"},
{n:"Digital Rocket LT",c:"LT",e:"digital",y:"Kaunas",r:"Central & Western Lithuania"},
{n:"Health technology cluster iVita",c:"LT",e:"health",y:"Kaunas",r:"Central & Western Lithuania"},
{n:"Information Technologies in Medicine (MedIT)",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"LAuGEA cluster (Lithuanian Automotive Export Association)",c:"LT",y:"Siauliai",r:"Central & Western Lithuania"},
{n:"LITMEA | Smart Food Cluster",c:"LT",e:"agri_food",y:"Kaunas",r:"Central & Western Lithuania"},
{n:"Laser and Engineering Technologies Cluster (LITEK)",c:"LT",e:"aerospace_and_defe",y:"Vilnius",r:"Capital Region"},
{n:"Life Sciences Digital Innovation Hub",c:"LT",e:"digital",y:"Vilnius",r:"Capital Region"},
{n:"LithuaniaBIO",c:"LT",e:"agri_food",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Apparel and Textile Industry Association",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Laser Association",c:"LT",e:"aerospace_and_defe",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Medical Tourism Cluster",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Photovoltaic Industrial Technology Cluster",c:"LT",e:"energy_renewables",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Plastics Cluster",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Prefabricated Wooden House Cluster - PrefabLT",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Social Innovation Cluster (LSIC)",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Lithuanian Space Association (LSA)",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Maritime cluster",c:"LT",y:"Klaipeda",r:"Central & Western Lithuania"},
{n:"National Food Cluster Lithuania",c:"LT",y:"Babtai, Kauno r. sav.",r:"Central & Western Lithuania"},
{n:"NordClinic Life Sciences Cluster",c:"LT",e:"health",y:"Kaunas",r:"Central & Western Lithuania"},
{n:"Smart Digital Solutions cluster",c:"LT",y:"Vilnius",r:"Capital Region"},
{n:"Smart Energy",c:"LT",e:"digital",y:"Vilnius",r:"Capital Region"},
{n:"Toolas",c:"LT",e:"energy_intensive_i",y:"Vilnius",r:"Capital Region"},
{n:"Luxembourg Creative Industry Cluster",c:"LU",e:"creative_and_cultu",y:"Belval",r:"Luxembourg"},
{n:"Luxembourg Maritime Cluster",c:"LU",e:"mobility_transport",y:"Luxembourg",r:"Luxembourg"},
{n:"Luxembourg Wood Cluster",c:"LU",y:"Esch-sur-Alzette",r:"Luxembourg"},
{n:"CLEANTECH LATVIA",c:"LV",e:"digital",y:"Riga",r:"Latvia"},
{n:"EnterGauja (Gauja National park`s tourism cluster)",c:"LV",y:"Sigulda",r:"Latvia"},
{n:"Federation of Security and Defence Industries of Latvia",c:"LV",y:"Rīga",r:"Latvia"},
{n:"Green Tech HUB",c:"LV",y:"Liepaja",r:"Latvia"},
{n:"Green and Smart Technology Cluster",c:"LV",e:"digital",y:"Liepaja",r:"Latvia"},
{n:"LATVIAN FOOD BIOECONOMY CLUSTER",c:"LV",y:"Priekuļi, Cēsu novads",r:"Latvia"},
{n:"Latvian Electrical Engineering and Electronics Industry Association",c:"LV",e:"aerospace_and_defe",y:"Riga",r:"Latvia"},
{n:"Latvian Food Cluster",c:"LV",e:"agri_food",y:"Riga",r:"Latvia"},
{n:"Latvian Health tourism cluster",c:"LV",y:"Riga",r:"Latvia"},
{n:"Latvian Hydrogen Association",c:"LV",e:"energy_renewables",y:"Riga",r:"Latvia"},
{n:"Latvian IT Cluster",c:"LV",e:"digital",y:"Riga",r:"Latvia"},
{n:"Latvian logistics association/ Latvian Supply chain Cluster",c:"LV",y:"Riga",r:"Latvia"},
{n:"Latvian wood construction cluster",c:"LV",y:"Jurmala",r:"Latvia"},
{n:"Lifescience Cluster of Latvia",c:"LV",e:"health",y:"Riga",r:"Latvia"},
{n:"MASOC - Association of Mechanical Engineering and Metalworking Industries of Latvia / Latvian Metalworking Cluster",c:"LV",y:"Riga",r:"Latvia"},
{n:"Cahul Beekeeping Cluster",c:"MD",e:"agri_food",y:"Cahul"},
{n:"Cluster Furniture & More Moldova",c:"MD",y:"Ungheni"},
{n:"Cluster Golden Grapes Logistic",c:"MD",e:"agri_food",y:"v. Popeasca, Stefan Voda"},
{n:"Cluster Honey Trade Group",c:"MD",e:"agri_food",y:"Zaim"},
{n:"Digital Agro-Cluster Moldova",c:"MD",e:"agri_food",y:"Calarasi"},
{n:"Drumul Cucuteni Regional Tourism Cluster",c:"MD",e:"agri_food",y:"Mircești Village"},
{n:"Energy and Biomass Cluster",c:"MD",y:"Chisinau"},
{n:"Fruit Export HUB",c:"MD",e:"agri_food",y:"Parcani"},
{n:"Heart of Dniester Tourist Cluster",c:"MD",e:"tourism",y:"Dubasari rayon"},
{n:"HerbaFruct Cluster",c:"MD",e:"agri_food",y:"Chisinau municipality"},
{n:"Lower Dniester Vegetable Cluster",c:"MD",e:"agri_food",y:"Stefan Voda district"},
{n:"Moldova Automotive Cluster",c:"MD",y:"Chisinau"},
{n:"OviCaprin Shepherding Cluster",c:"MD",e:"agri_food",y:"Cimislia"},
{n:"SORINTEX",c:"MD",y:"Soroca"},
{n:"Southern Shepherds Cluster",c:"MD",e:"agri_food",y:"Slobozia Mare"},
{n:"Tourism cluster Dniester Riviera",c:"MD",e:"tourism",y:"Cocieri village, Dubasari District"},
{n:"VIA Cahul Tourism Cluster",c:"MD",e:"tourism",y:"Cahul"},
{n:"ICT Cortex - Cluster for Information Technologies, Innovation, Education, Design and Technology Development in Montenegro",c:"ME",e:"digital",y:"Podgorica"},
{n:"Wine Cluster Montenegro",c:"ME",y:"Podgorica"},
{n:"MASIT - ICT chamber of commerce",c:"MK",y:"Skopje"},
{n:"TTA-Textile Cluster Macedonia",c:"MK",e:"creative_and_cultu",y:"Skopje"},
{n:"Malta Marittima Agency",c:"MT",y:"Valletta",r:"Malta"},
{n:"3D Makers Zone",c:"NL",y:"Haarlem",r:"West Netherlands"},
{n:"AgriFood Capital",c:"NL",e:"agri_food",y:"s-Hertogenbosch",r:"South Netherlands"},
{n:"B'ROBOTICS",c:"NL",e:"aerospace_and_defe",y:"BREDA",r:"South Netherlands"},
{n:"Biobased Delta",c:"NL",y:"Bergen op Zoom",r:"South Netherlands"},
{n:"Brainport Industries",c:"NL",y:"Eindhoven",r:"South Netherlands"},
{n:"Business Cluster Semiconductors Netherlands",c:"NL",y:"Nijmegen",r:"East Netherlands"},
{n:"Chemical Cluster Delfzijl",c:"NL",y:"Delfzijl",r:"North Netherlands"},
{n:"Chemical Cluster Emmen",c:"NL",y:"Emmen",r:"North Netherlands"},
{n:"Cluster Sports & Technology",c:"NL",e:"health",y:"Eindhoven",r:"South Netherlands"},
{n:"Dutch Greenhouse Delta",c:"NL",e:"agri_food",y:"Naaldwijk",r:"West Netherlands"},
{n:"Dutch Sporting Goods Industry Association, FGHS",c:"NL",y:"Leusden",r:"West Netherlands"},
{n:"East Netherlands Development Agency (Oost NL)",c:"NL",e:"aerospace_and_defe",y:"Apeldoorn",r:"East Netherlands"},
{n:"FoodvalleyNL",c:"NL",e:"agri_food",y:"Nederland"},
{n:"Gebiedscoöperatie Westerkwartier",c:"NL",y:"Noordhorn"},
{n:"Greenport West-Holland",c:"NL",y:"Zoetermeer",r:"West Netherlands"},
{n:"Health Valley Netherlands",c:"NL",y:"Nijmegen",r:"East Netherlands"},
{n:"High Tech NL",c:"NL",e:"digital",y:"Eindhoven",r:"South Netherlands"},
{n:"ICT for Brain, Body & Behavior (i3B)",c:"NL",y:"Wageningen",r:"East Netherlands"},
{n:"Impact Noord",c:"NL",y:"Groningen",r:"North Netherlands"},
{n:"LifetecZONe",c:"NL",y:"Tilburg",r:"South Netherlands"},
{n:"NAG",c:"NL",y:"Delft",r:"West Netherlands"},
{n:"NL Robotics",c:"NL",e:"agri_food",y:"Eindhoven",r:"South Netherlands"},
{n:"Netherlands Industries for Defence and Security",c:"NL",y:"The Hague",r:"West Netherlands"},
{n:"North Sea Farmers",c:"NL",y:"The Hague",r:"West Netherlands"},
{n:"Orange Sports Forum",c:"NL",y:"Eindhoven",r:"South Netherlands"},
{n:"Photon Delta",c:"NL",y:"Eindhoven",r:"South Netherlands"},
{n:"Planet B.io",c:"NL",e:"agri_food",y:"Delft",r:"West Netherlands"},
{n:"Polymer Science Park",c:"NL",y:"Zwolle",r:"East Netherlands"},
{n:"Promotie Group Tuinbouw Emmen",c:"NL",y:"Erica"},
{n:"RAI Automotive Industry NL",c:"NL",y:"Helmond",r:"South Netherlands"},
{n:"Security Delta Cluster",c:"NL",e:"digital",y:"The Hague",r:"West Netherlands"},
{n:"SpaceNed",c:"NL",e:"aerospace_and_defe",y:"Noordwijk",r:"West Netherlands"},
{n:"Stichting New Energy Coalition",c:"NL",y:"Groningen",r:"North Netherlands"},
{n:"Task Force Health Care",c:"NL",y:"The Hague",r:"West Netherlands"},
{n:"Water Alliance",c:"NL",e:"agri_food",y:"Leeuwarden",r:"North Netherlands"},
{n:"WaterCampus Leeuwarden",c:"NL",e:"agri_food",y:"Leeuwarden",r:"North Netherlands"},
{n:"AgroBioCluster - Agri-Food and Bioeconomy Cluster",c:"PL",e:"agri_food",y:"Warsaw",r:"Masovia"},
{n:"Aviation Valley / Dolina Lotnicza",c:"PL",e:"aerospace_and_defe",y:"Rzeszow",r:"Subcarpathia"},
{n:"BALTIC SEA & SPACE CLUSTER",c:"PL",y:"GDYNIA",r:"Pomerania"},
{n:"BioTechMed Mazovia Cluster",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"Bioenergy for the Region - coordinated by Research and Innovation Centre Pro-Akademia (CENTRUM BADAN I INNOWACJI PRO-AKADEMIA)",c:"PL",y:"Konstantynów Łódzki",r:"Łódź"},
{n:"Bydgoszcz IT Cluster",c:"PL",y:"Bydgoszcz",r:"Kuyavia-Pomerania"},
{n:"Bydgoszcz Industrial Cluster Tool Valley (BIC)",c:"PL",e:"energy_intensive_i",y:"Bydgoszcz",r:"Kuyavia-Pomerania"},
{n:"COP Cluster",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"Centre for Energy Technologie Cluster - Free Enterprise Association",c:"PL",y:"Świdnica",r:"Lower Silesia"},
{n:"Centre for Transport Safety and Vehicle Diagnostics",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"Cluster Footwear Circle",c:"PL",y:"Łódź",r:"Łódź"},
{n:"Cluster for Photonics and Fiber Optics",c:"PL",e:"aerospace_and_defe",y:"Lublin",r:"Lublin"},
{n:"Cluster of Business Environment Institutions/Klaster Instytucji Otoczenia Biznesu",c:"PL",y:"Bialystok",r:"Podlasie"},
{n:"Cluster of Hydrogen Technologies / Regional Pomeranian Chamber of Commerce /",c:"PL",y:"Gdansk",r:"Pomerania"},
{n:"Cluster of Innovative Manufacturing Technologies Association CINNOMATECH / Klaster Innowacyjnych Technologii w Wytwarzaniu CINNOMATECH",c:"PL",e:"construction",y:"Wrocław",r:"Lower Silesia"},
{n:"Construction Cluster INNOWATOR",c:"PL",y:"Kielce",r:"Świętokrzyskie"},
{n:"Digital Knowledge Cluster",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"ECDF mKlaster",c:"PL",y:"Poznań",r:"Greater Poland"},
{n:"East Automotive Alliance",c:"PL",e:"mobility_transport",y:"Tarnobrzeg",r:"Subcarpathia"},
{n:"Evoluma Industry Cluster (formerly Metal Processing Cluster)",c:"PL",e:"construction",y:"Bialystok",r:"Podlasie"},
{n:"Food Cluster of Southern Greater Poland - association",c:"PL",y:"Kalisz",r:"Greater Poland"},
{n:"Innovative Food Cluster FOOD4GOOD",c:"PL",y:"Warsaw",r:"Masovia"},
{n:"Instytut Maszyn Przepływowych im Roberta Szewalskiego Polskiej Akademii Nauk - Baltic Eco-Energy Cluster",c:"PL",y:"Gdańsk",r:"Pomerania"},
{n:"Intelligent Lighting Systems Cluster",c:"PL",y:"Krakow",r:"Lesser Poland"},
{n:"Interizon Cluster",c:"PL",e:"digital",y:"Gdańsk",r:"Pomerania"},
{n:"Klaster B+R&I - Badań i Rozwoju oraz Innowacji (Research and Development and Innovation Cluster)",c:"PL",y:"Wrocław",r:"Lower Silesia"},
{n:"Klaster Innowacyjna Medycyna/ Innovative medicine Cluster",c:"PL",y:"Wrocław",r:"Lower Silesia"},
{n:"Klaster Inteligentnych Systemów Transportowych",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"Klaster LifeScience Krakow",c:"PL",e:"agri_food",y:"Krakow",r:"Lesser Poland"},
{n:"Klaster.info",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"LODZistics Logistics Business Network of Central Poland",c:"PL",y:"Kutno",r:"Łódź"},
{n:"Leszno Printing & Advertising Cluster",c:"PL",y:"Leszno",r:"Greater Poland"},
{n:"Lower Silesian Automotive Cluster DKM",c:"PL",e:"mobility_transport",y:"Legnica",r:"Lower Silesia"},
{n:"Lower Silesian Technological Park Cluster",c:"PL",y:"Szczawno-Zdrój"},
{n:"Lublin Eco-Energy Cluster",c:"PL",y:"Lublin",r:"Lublin"},
{n:"Lublin Enterprise Cluster",c:"PL",y:"Lublin",r:"Lublin"},
{n:"Lublin Medicine- Medical and Wellness Cluster",c:"PL",y:"Lublin",r:"Lublin"},
{n:"METALIKA Cluster for Industry",c:"PL",e:"agri_food",y:"Szczecin",r:"West Pomerania"},
{n:"Maritime Cluster of Western Pomerania",c:"PL",y:"Szczecin",r:"West Pomerania"},
{n:"Mazovia Cluster ICT",c:"PL",y:"Warsaw",r:"Masovia"},
{n:"MedSilesia - The Silesian Network of Medical Devices",c:"PL",e:"health",y:"Gliwice",r:"Silesia"},
{n:"Media Dizajn",c:"PL",y:"Szczecin",r:"West Pomerania"},
{n:"Metal Cluster of Lubuskie Voivodeship",c:"PL",e:"construction",y:"Gorzow Wielkopolski",r:"Lubusz"},
{n:"NUTRIBIOMED Cluster",c:"PL",y:"Wrocław",r:"Lower Silesia"},
{n:"Nationwide Centre for Research, Education and Monitoring Fertility Problems",c:"PL",y:"Białystok",r:"Podlasie"},
{n:"Natureef Association",c:"PL",e:"agri_food",y:"Szczecin",r:"West Pomerania"},
{n:"North South Logistics & Transport Cluster",c:"PL",y:"Gdańsk",r:"Pomerania"},
{n:"POLIGEN Plastic Processing Cluster",c:"PL",y:"Rzeszow",r:"Subcarpathia"},
{n:"Polbiom Cluster",c:"PL",e:"agri_food",y:"Polska"},
{n:"Polish Aluminium Cluster",c:"PL",y:"Dąbrowa Górnicza",r:"Silesia"},
{n:"Polish Automotive Group PGM",c:"PL",e:"mobility_transport",y:"Sedziszow Mlp."},
{n:"Polish Cluster of Composite Technologies",c:"PL",e:"aerospace_and_defe",y:"Zielonki/Krakow",r:"Lesser Poland"},
{n:"Polish Cluster of Construction Exporters",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"Polish Construction Cluster",c:"PL",e:"construction",y:"Bialystok",r:"Podlasie"},
{n:"Polish Construction Technology Platform",c:"PL",y:"Kutno",r:"Łódź"},
{n:"Polish Cybersecurity Cluster - #CyberMadeInPoland",c:"PL",e:"digital",y:"Krakow",r:"Lesser Poland"},
{n:"Polish Innovative Medical Cluster PIKMED",c:"PL",y:"Czeladź",r:"Silesia"},
{n:"Polish IoT & AI Cluster SINOTAIC",c:"PL",y:"Rzeszów",r:"Subcarpathia"},
{n:"Polish Technological Platform on Photonics - PPTF",c:"PL",e:"aerospace_and_defe",y:"Ożarów Mazowiecki"},
{n:"Poznan Science and Technology Park | Waste-Klaster",c:"PL",y:"Poznan",r:"Greater Poland"},
{n:"SIlesian Nano Cluster",c:"PL",e:"energy_renewables",y:"Katowice",r:"Silesia"},
{n:"Silesia Automotive & Advanced Manufacturing",c:"PL",e:"mobility_transport",y:"Katowice",r:"Silesia"},
{n:"Silesia ICT Cluster",c:"PL",y:"Katowice",r:"Silesia"},
{n:"Silesian Aviation Cluster",c:"PL",e:"aerospace_and_defe",y:"Kaniów"},
{n:"Silesian ICT & Multimedia Cluster",c:"PL",y:"Ruda Śląska",r:"Silesia"},
{n:"Silesian Water Cluster",c:"PL",y:"Katowice",r:"Silesia"},
{n:"Software Development Association Poland",c:"PL",y:"Krakow",r:"Lesser Poland"},
{n:"South Poland Cleantech Cluster",c:"PL",y:"Kraków",r:"Lesser Poland"},
{n:"Subcarpathian Flavours Cluster",c:"PL",y:"Rzeszów",r:"Subcarpathia"},
{n:"Subcarpathian Renewable Energy Cluster",c:"PL",y:"Rzeszów",r:"Subcarpathia"},
{n:"Sustainable Infrastructure Cluster",c:"PL",e:"construction",y:"Krakow",r:"Lesser Poland"},
{n:"The Association West Pomeranian Chemical Cluster \"Green Chemistry\"",c:"PL",e:"agri_food",y:"Szczecin",r:"West Pomerania"},
{n:"The Cluster of Tourist Brands of Eastern Poland / Klaster Marek Turystycznych Polski Wschodniej",c:"PL",y:"Białystok",r:"Podlasie"},
{n:"The Eastern Cluster ICT",c:"PL",y:"Lublin",r:"Lublin"},
{n:"The Eastern Metalworking Cluster",c:"PL",y:"Lublin",r:"Lublin"},
{n:"The Polish Research and Development Cluster of the Internet of Things - Lublin Science and Technology Park",c:"PL",y:"Lublin",r:"Lublin"},
{n:"Warsaw Collaboration Cluster Network",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"Waste Management and Recycling Cluster",c:"PL",y:"Kielce",r:"Świętokrzyskie"},
{n:"Westpomeranian MARITIME CLUSTER",c:"PL",y:"Szczecin",r:"West Pomerania"},
{n:"Wielkopolska ICT Cluster",c:"PL",y:"Poznan",r:"Greater Poland"},
{n:"ZIELONA KUZNIA Cluster",c:"PL",y:"Warszawa",r:"Masovia"},
{n:"sEaNERGIA Baltic Cluster",c:"PL",y:"Kołobrzeg",r:"West Pomerania"},
{n:"AEDCP- Cluster Português para as Indústrias de Aeronáutica, Espaço e Defesa",c:"PT",y:"ÉVORA",r:"Alentejo"},
{n:"AIPQR - ASSOCIAÇÃO DAS INDÚSTRIAS DA PETROQUÍMICA, QUÍMICA E REFINAÇÃO",c:"PT",y:"Estarreja"},
{n:"ASSOCIAÇÃO CLUSTER PORTUGAL MINERAL RESOURCES",c:"PT",e:"construction",y:"Estremoz"},
{n:"Aebb - Associação Empresarial da Beira Baixa",c:"PT",y:"Castelo Branco",r:"Centre"},
{n:"Animaforum - Associação para o Desenvolvimento da Agro-Industria",c:"PT",y:"Santarém",r:"Centre"},
{n:"Associação para o Pólo das Tecnologias de Informação, Comunicação e Electronica TICE.PT",c:"PT",e:"digital",y:"Aveiro",r:"Centre"},
{n:"B2E - Blue Bioeconomy CoLAB",c:"PT",y:"Leça da Palmeira",r:"North"},
{n:"BLUEBIO ALLIANCE",c:"PT",e:"agri_food",y:"Portugal"},
{n:"Battery Cluster Portugal",c:"PT",e:"energy_renewables",y:"Braga",r:"North"},
{n:"CATIM",c:"PT",y:"Porto",r:"North"},
{n:"CENTIMFE - Technological Center for the Mould Making, Special Tooling and Plastic Industries",c:"PT",e:"mobility_transport",y:"Marinha Grande",r:"Centre"},
{n:"Chemical, Petrochemical and Refining Cluster",c:"PT",y:"Estarreja"},
{n:"Cluster AEC, Arquitetura, Engenharia e Construção",c:"PT",y:"Porto",r:"North"},
{n:"Cluster Habitat Sustentável",c:"PT",e:"construction",y:"Aveiro",r:"Centre"},
{n:"EnergyIN - the Competitiveness and Technology Cluster for Energy | Portugal",c:"PT",y:"Torres Vedras",r:"Centre"},
{n:"Fórum Oceano - Association of Maritime Economy",c:"PT",y:"Matosinhos",r:"North"},
{n:"Health Cluster Portugal",c:"PT",e:"health",y:"Leça do Balio",r:"North"},
{n:"InovCluster - Associação do Cluster Agro-Industrial do Centro",c:"PT",e:"agri_food",y:"Castelo Branco",r:"Centre"},
{n:"Inova-Ria",c:"PT",e:"digital",y:"Aveiro",r:"Centre"},
{n:"MOBINOV - Portuguese Automotive Cluster",c:"PT",e:"mobility_transport",y:"Matosinhos",r:"North"},
{n:"Madan Parque",c:"PT",y:"Caparica",r:"Lisbon Metropolitan Area"},
{n:"PFP - Plataforma Ferroviaria Portuguesa",c:"PT",e:"construction",y:"Porto",r:"North"},
{n:"POOL-NET - Portuguese Tooling & Plastics Network",c:"PT",e:"aerospace_and_defe",y:"Marinha Grande",r:"Centre"},
{n:"PRODUTECH - Production Technologies Cluster",c:"PT",e:"aerospace_and_defe",y:"Porto",r:"North"},
{n:"PortugalFoods",c:"PT",y:"Maia",r:"North"},
{n:"Portuguese Shoes Cluster",c:"PT",y:"Porto",r:"North"},
{n:"Portuguese Textile Cluster",c:"PT",e:"textiles",y:"Portugal"},
{n:"Wine and Vine Cluster",c:"PT",y:"Vila Real",r:"North"},
{n:"\"Made in Neamt\" Cluster",c:"RO",e:"agri_food",y:"Piatra Neamt",r:"North-East"},
{n:"3D Edaphic BLOOM Danube",c:"RO",e:"agri_food",y:"TULCEA",r:"South-East"},
{n:"3R Green Cluster",c:"RO",e:"digital",y:"Romania"},
{n:"AGROFOOD REGIONAL INOVATIVE CLUSTER",c:"RO",e:"agri_food",y:"Sfântu Gheorghe",r:"Centre"},
{n:"AGROPRO Oltenia Cluster",c:"RO",y:"Craiova",r:"South-West Oltenia"},
{n:"ASTRICO NORD-EST TEXTILE CLUSTER",c:"RO",y:"Savinesti"},
{n:"AUTOMOTIVEST Cluster",c:"RO",y:"Timisoara",r:"West"},
{n:"AgroTransilvania Cluster",c:"RO",y:"Dezmir"},
{n:"Alaturi de Voi Romania Foundation (ADV Romania) / Accelerator of Social Enterprises Cluster",c:"RO",e:"proximity_and_soci",y:"Miroslava"},
{n:"Asociatia Cluster Pro-nZEB",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"Asociatia LifeTech City",c:"RO",y:"Tirgu Mures",r:"Centre"},
{n:"Banat Software Cluster by ARIES-TM",c:"RO",y:"Timisoara",r:"West"},
{n:"Bio Danubius Regional Cluster",c:"RO",y:"București",r:"Bucharest-Ilfov"},
{n:"Bionest Cluster",c:"RO",e:"agri_food",y:"Iasi",r:"North-East"},
{n:"CANEPARO",c:"RO",e:"textiles",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"CITI Cluster",c:"RO",e:"digital",y:"Bucuresti",r:"Bucharest-Ilfov"},
{n:"CONSTRUCT CLUSTER OLTENIA ASSOCIATION",c:"RO",y:"Craiova",r:"South-West Oltenia"},
{n:"Cloudimpuls",c:"RO",y:"Deva",r:"West"},
{n:"Cluj IT Cluster",c:"RO",e:"digital",y:"Cluj Napoca",r:"North-West"},
{n:"Cluster for Distributed Research Infrastructure for Future Materials, Applications and Technology",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"Cluster for Innovation and Technology",c:"RO",e:"creative_and_cultu",y:"Brasov",r:"Centre"},
{n:"Control & IT Cluster",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"Cyber Security Cluster of Excellence",c:"RO",e:"aerospace_and_defe",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"DANUBE FURNITURE CLUSTER",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"DISCOVER TRANSYLVANIA'S REACHES CLUSTER",c:"RO",y:"Floresti"},
{n:"Danube Engineering Hub",c:"RO",y:"Ploiesti",r:"South-Muntenia"},
{n:"Different Angle Cluster",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"ECO-INNOVATION CLUSTER FOR SUSTAINABLE ENVIRONMENT",c:"RO",e:"energy_renewables",y:"Bistrita",r:"North-West"},
{n:"ETREC Cluster - Electro-Technical Regional Cluster",c:"RO",y:"Sacele",r:"Centre"},
{n:"Electronic Innovation Cluster (ELINCLUS)",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"FreshBlood HealthTech",c:"RO",e:"health",y:"Cluj-Napoca",r:"North-West"},
{n:"Green Energy Romanian Innovative Biomass Cluster",c:"RO",e:"energy_renewables",y:"Sfantu Gheorghe",r:"Centre"},
{n:"Green Solutions Low Danube",c:"RO",y:"Galati",r:"South-East"},
{n:"Green Technology CLUSTER",c:"RO",e:"agri_food",y:"Romania"},
{n:"Health Romania The Medical Cluster",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"ICONIC Cluster",c:"RO",y:"Iasi",r:"North-East"},
{n:"ICT Oltenia Cluster",c:"RO",y:"Craiova",r:"South-West Oltenia"},
{n:"ICT Regional Cluster",c:"RO",e:"digital",y:"Timisoara",r:"West"},
{n:"IND-AGRO-POL",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"INNOVATIVE CLUSTER FOR HEALTH",c:"RO",y:"Galati",r:"South-East"},
{n:"INOMAR Cluster",c:"RO",y:"Constanta",r:"South-East"},
{n:"IT&C Cluster \"Lower Danube\"",c:"RO",y:"Galati",r:"South-East"},
{n:"North-East Innovative Regional Cluster for Structural and Molecular Imaging (IMAGO-MOL)",c:"RO",e:"health",y:"Iasi",r:"North-East"},
{n:"Oltenia Tourism Competitiveness Pole - Innovation and Tradition in Tourism TurOlt InoTT",c:"RO",y:"Craiova",r:"South-West Oltenia"},
{n:"Open Hub Creative Cluster",c:"RO",e:"creative_and_cultu",y:"Galati",r:"South-East"},
{n:"PRO WOOD Regional Wood Cluster",c:"RO",e:"construction",y:"Sfântu Gheorghe",r:"Centre"},
{n:"ROHEALTH- The Health and Bioeconomy Cluster",c:"RO",e:"agri_food",y:"Bucuresti",r:"Bucharest-Ilfov"},
{n:"ROMANIAN RIVER TRANSPORT CLUSTER",c:"RO",y:"Galati",r:"South-East"},
{n:"ROVEST Cluster",c:"RO",e:"digital",y:"Timisoara",r:"West"},
{n:"Romanian New Materials Cluster",c:"RO",y:"Cluj-Napoca",r:"North-West"},
{n:"Romanian Textile Concept",c:"RO",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"START INOVARE",c:"RO",y:"Voluntari",r:"Bucharest-Ilfov"},
{n:"Sibiu IT Cluster",c:"RO",e:"digital",y:"Sibiu",r:"Centre"},
{n:"Smart Alliance Cluster",c:"RO",y:"Bucuresti",r:"Bucharest-Ilfov"},
{n:"South-West Oltenia Automotive Competitiveness Pole",c:"RO",y:"Craiova",r:"South-West Oltenia"},
{n:"Spacetech Association",c:"RO",e:"aerospace_and_defe",y:"Romania"},
{n:"Strategic Innovative Cluster for Mechatronics Smart Specialization Domain - «MECHATREC»",c:"RO",y:"Bucuresti",r:"Bucharest-Ilfov"},
{n:"Technology Enabled Construction Cluster - TEC",c:"RO",e:"construction",y:"Bucharest",r:"Bucharest-Ilfov"},
{n:"The Danube Delta Cluster (Clusterul Delta Dunarii)",c:"RO",y:"Tulcea",r:"South-East"},
{n:"The Romanian Sustainable Energy Cluster - ROSENC",c:"RO",y:"Timisoara",r:"West"},
{n:"Transilvania Creative Industries Cluster",c:"RO",y:"Cluj-Napoca",r:"North-West"},
{n:"Transilvania IT Cluster",c:"RO",e:"digital",y:"Cluj-Napoca",r:"North-West"},
{n:"Transilvania LifeStyle",c:"RO",y:"Cluj Napoca",r:"North-West"},
{n:"Transylvania Energy Cluster",c:"RO",e:"digital",y:"Cluj-Napoca",r:"North-West"},
{n:"Transylvania Lands Cluster",c:"RO",y:"Alba Iulia",r:"Centre"},
{n:"Transylvania Regional Balneological Tourism Cluster",c:"RO",y:"Sfantu Gheorghe",r:"Centre"},
{n:"Transylvania Textile & Fashion Cluster",c:"RO",y:"Sfantu Gheorghe",r:"Centre"},
{n:"Transylvanian Furniture Cluster - legally represented by HYGIA SA",c:"RO",e:"construction",y:"Cluj-Napoca",r:"North-West"},
{n:"Urban Logistic Cluster Association",c:"RO",y:"Craiova",r:"South-West Oltenia"},
{n:"bioROne",c:"RO",y:"Iasi",r:"North-East"},
{n:"ASSOCIATION CLUSTER AGROINDUSTRY",c:"RS",y:"Subotica"},
{n:"Association \"Cluster for Energy Efficiency\"",c:"RS",y:"Novi Sad"},
{n:"CONSTRUCTION CLUSTER DUNDJER",c:"RS",y:"Nis"},
{n:"Center for organic production Selenča",c:"RS",y:"Selenča"},
{n:"Cluster AGRO START UP",c:"RS",y:"Niš"},
{n:"Cluster for Entrepreneurial employment of young people Activator",c:"RS",y:"Leskovac"},
{n:"Cluster for ecological culture and ecological energy Ecopanonia",c:"RS",y:"Novi Sad"},
{n:"Cluster of Cultural Routes",c:"RS",y:"Belgrade"},
{n:"Cluster of medical and health tourism",c:"RS",y:"Vrnjačka Banja"},
{n:"Fonund tourism microregional cluster Subotica-Palić",c:"RS",y:"Palić"},
{n:"ICT Cluster of Central Serbia",c:"RS",y:"Kragujevac"},
{n:"ICT Net",c:"RS",y:"Belgrade"},
{n:"Klaster FACTS",c:"RS",y:"Belgrade"},
{n:"Nis Cluster of Advanced Technologies / NiCAT",c:"RS",e:"digital",y:"Niš"},
{n:"Railway Cluster for South-East Europe",c:"RS",y:"Belgrade"},
{n:"Serbia Film Commission",c:"RS",y:"Belgrade"},
{n:"Serbian Automotive and Mobility Cluster / AC Serbia",c:"RS",e:"digital",y:"Beograd"},
{n:"Serbian Games Association",c:"RS",y:"Belgrade"},
{n:"Urban Planning Cluster",c:"RS",y:"Nis"},
{n:"Vojvodina ICT Cluster",c:"RS",e:"agri_food",y:"Novi Sad"},
{n:"Vojvodina Metal Cluster",c:"RS",y:"Temerin"},
{n:"Vojvodina organic cluster",c:"RS",y:"Novi Sad"},
{n:"Wellness Serbia",c:"RS",y:"Belgrade"},
{n:"eucaap",c:"RS",y:"Novi Sad"},
{n:"Кластер креативних инудстрија Војводине - Creative Industries Cluster of Vojvodina",c:"RS",y:"Novi Sad"},
{n:"AI and Big Data Innovations Sweden",c:"SE",y:"Luleå",r:"Norrbotten"},
{n:"Aerospace Cluster Sweden",c:"SE",y:"Älvängen"},
{n:"Agroväst Livsmedel AB",c:"SE",y:"Skara"},
{n:"Arctic Game",c:"SE",e:"creative_and_cultu",y:"Skellefteå",r:"Västerbotten"},
{n:"Automation Region",c:"SE",y:"Västerås",r:"Västmanland"},
{n:"Big Science Sweden",c:"SE",e:"construction",y:"Luleå",r:"Norrbotten"},
{n:"Bron Innovation / Govtech Sweden",c:"SE",e:"digital",y:"Sundsvall",r:"Västernorrland"},
{n:"Cleantech Scandinavia",c:"SE",y:"Lund",r:"Skåne"},
{n:"CoDest",c:"SE",y:"Malmö",r:"Skåne"},
{n:"Compare",c:"SE",y:"Sweden"},
{n:"Cyberly Cluster",c:"SE",e:"aerospace_and_defe",y:"Linköping",r:"Östergötland"},
{n:"Dalarna Science Park",c:"SE",y:"Borlange",r:"Dalarna"},
{n:"Findec (Findec & Decentralized AB)",c:"SE",y:"Stockholm",r:"Stockholm"},
{n:"Future Positon X",c:"SE",y:"Gävle",r:"Gävleborg"},
{n:"Game Habitat Southern Sweden AB",c:"SE",y:"Malmö",r:"Skåne"},
{n:"Hudiksvalls Hydraulikkluster",c:"SE",y:"Hudiksvall",r:"Gävleborg"},
{n:"IUC Syd",c:"SE",y:"Malmö",r:"Skåne"},
{n:"Interior Cluster Sweden",c:"SE",e:"creative_and_cultu",y:"Växjö",r:"Kronoberg"},
{n:"IoT World",c:"SE",e:"aerospace_and_defe",y:"Linköping",r:"Östergötland"},
{n:"Järnvägsklustret - Railway cluster of Sweden",c:"SE",e:"mobility_transport",y:"Västerås",r:"Västmanland"},
{n:"MITC - Malardalen Industrial Technology Center",c:"SE",y:"Eskilstuna",r:"Södermanland"},
{n:"Media Evolution Southern Sweden",c:"SE",y:"Malmö",r:"Skåne"},
{n:"NIFA- Nordic Innovation Food Arena",c:"SE",e:"agri_food",y:"Karlstad",r:"Värmland"},
{n:"NetPort Energy Cluster",c:"SE",y:"Karlshamn",r:"Blekinge"},
{n:"OffshoreVäst",c:"SE",y:"BORÅS",r:"Västra Götaland"},
{n:"OpenTech",c:"SE",e:"digital",y:"Lund",r:"Skåne"},
{n:"Packbridge AB",c:"SE",e:"agri_food",y:"Malmö",r:"Skåne"},
{n:"Paper Province Ekonomisk förening",c:"SE",e:"energy_renewables",y:"Karlstad",r:"Värmland"},
{n:"Peak Innovation",c:"SE",y:"Östersund",r:"Jämtland"},
{n:"PhotonicSweden",c:"SE",y:"Kista"},
{n:"ProcessIT Innovations",c:"SE",y:"Umeå",r:"Västerbotten"},
{n:"Processum Biorefinery Cluster",c:"SE",e:"energy_renewables",y:"Örnsköldsvik",r:"Västernorrland"},
{n:"PropTech Sweden",c:"SE",e:"construction",y:"Stockholm",r:"Stockholm"},
{n:"Propell",c:"SE",y:"Hudiksvall",r:"Gävleborg"},
{n:"STUNS Life science",c:"SE",y:"Uppsala",r:"Uppsala"},
{n:"Skane Food Innovation Network",c:"SE",y:"Malmö",r:"Skåne"},
{n:"Skelleftea Digital Alliance",c:"SE",y:"Skellefteå",r:"Västerbotten"},
{n:"Smart Housing Småland",c:"SE",y:"Växjö",r:"Kronoberg"},
{n:"Smart Textiles by Science Park Borås",c:"SE",e:"textiles",y:"Borås",r:"Västra Götaland"},
{n:"Sustainable Business Hub",c:"SE",e:"construction",y:"Malmö",r:"Skåne"},
{n:"Sustainable Steel Region",c:"SE",y:"Borlänge",r:"Dalarna"},
{n:"SwedenBIO",c:"SE",e:"health",y:"Sweden"},
{n:"Swedish Maritime Technology Forum",c:"SE",y:"Göteborg",r:"Västra Götaland"},
{n:"Swedish Proving Ground Association",c:"SE",e:"mobility_transport",y:"Älvsbyn"},
{n:"Techtank Advanced Engineering Alliance",c:"SE",y:"Olofström"},
{n:"Visit Dalarna",c:"SE",e:"tourism",y:"Rättvik"},
{n:"Visual Sweden",c:"SE",e:"aerospace_and_defe",y:"NORRKÖPING",r:"Östergötland"},
{n:"AE-ROBO-NET",c:"SI",y:"Portorož-Portorose"},
{n:"COBIK - Biopharma Global Connect Cluster",c:"SI",e:"health",y:"Ajdovščina"},
{n:"CONSTRUCTION CLUSTER OF SLOVENIA",c:"SI",e:"construction",y:"Medvode"},
{n:"GIZ ACS Automotive cluster of Slovenia",c:"SI",y:"Ljubljana",r:"Western Slovenia"},
{n:"GIZ-GOIS, g.i.z.",c:"SI",e:"aerospace_and_defe",y:"Slovenija"},
{n:"HealthDay",c:"SI",e:"health",y:"Ljubljana",r:"Western Slovenia"},
{n:"ICT Innovation network, Chamber of Commerce and Industry of Slovenia, ICT association of Slovenia",c:"SI",y:"Ljubljana",r:"Western Slovenia"},
{n:"ICT Techology Network Institute",c:"SI",y:"Ljubljana",r:"Western Slovenia"},
{n:"ITC - Innovation Technology Cluster Murska Sobota",c:"SI",e:"agri_food",y:"Murska Sobota"},
{n:"Poligon Creative Centre / Poligon Institute",c:"SI",y:"Ljubljana",r:"Western Slovenia"},
{n:"Poly4EmI hosted by Anteja ECG d.o.o.",c:"SI",y:"Ljubljana",r:"Western Slovenia"},
{n:"SRIP GoDigital",c:"SI",e:"digital",y:"Slovenia"},
{n:"SRIP HRANA - Strategic Research and Innovation Partnership for Sustainable Food Production",c:"SI",y:"Ljubljana",r:"Western Slovenia"},
{n:"SRIP PMiS",c:"SI",e:"construction",y:"Ljubljana",r:"Western Slovenia"},
{n:"SRIP PSIDL, Strategic Research and Innovation Partnership on Smart Buildings and Home with Wood Chain",c:"SI",y:"Maribor",r:"Eastern Slovenia"},
{n:"SRIPToP",c:"SI",y:"Lubljana",r:"Western Slovenia"},
{n:"SiEnE, Slovenian Energy and Environment Partnership in Defence",c:"SI",y:"Maribor",r:"Eastern Slovenia"},
{n:"Slovenian innovation hub,European Economic Interest Grouping, SIH EEIG",c:"SI",e:"health",y:"Slovenia"},
{n:"Strategic Research and Innovation Partnership - Networks for the Transition to the Circular Economy",c:"SI",y:"Maribor",r:"Eastern Slovenia"},
{n:"TCS - Toolmakers Cluster of Slovenia; Zavod C-TCS",c:"SI",y:"Celje",r:"Eastern Slovenia"},
{n:"TECES, Green Tech Cluster Maribor",c:"SI",e:"digital",y:"Maribor",r:"Eastern Slovenia"},
{n:"TECOS - Industrial Association of Slovenian Toolmakers",c:"SI",e:"construction",y:"Celje",r:"Eastern Slovenia"},
{n:"Turisticno gostinska zbornica Slovenije/Tourism and Hospitality Chamber of Slovenia",c:"SI",y:"Ljubljana",r:"Western Slovenia"},
{n:"Wood Industry Cluster Slovenia",c:"SI",e:"construction",y:"Ljubljana",r:"Western Slovenia"},
{n:"BITERAP",c:"SK",e:"digital",y:"Košice",r:"Eastern Slovakia"},
{n:"Bioeconomy Cluster",c:"SK",e:"agri_food",y:"Nitra",r:"Western Slovakia"},
{n:"Cassovia Medi Valley",c:"SK",e:"electronics",y:"Košice- Staré Mesto",r:"Eastern Slovakia"},
{n:"Cassovia New Industry Cluster (CNIC)",c:"SK",e:"proximity_and_soci",y:"Kosice",r:"Eastern Slovakia"},
{n:"Council of Slovak Exporters",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"Cybersecurity Cluster",c:"SK",y:"Liptovský Mikuláš",r:"Central Slovakia"},
{n:"Energy Cluster of Presov Region",c:"SK",e:"energy_intensive_i",y:"Prešov",r:"Eastern Slovakia"},
{n:"Envirocentrum Banska Stiavnica",c:"SK",e:"digital",y:"Banská Štiavnica"},
{n:"FINTECH & INSURTECH ASSOCIATION OF SLOVAKIA",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"Food Chamber of Slovakia",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"HEMP CLUSTER",c:"SK",y:"Badin"},
{n:"House of events innovation",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"INOVATO CLUSTER",c:"SK",e:"creative_and_cultu",y:"Vráble"},
{n:"Industry Innovation Cluster Slovakia",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"Ipel Energy Environmental Cluster",c:"SK",y:"Veľký Krtíš"},
{n:"Klaster AT+R",c:"SK",y:"Kosice",r:"Eastern Slovakia"},
{n:"Kosice IT Valley",c:"SK",e:"digital",y:"Kosice",r:"Eastern Slovakia"},
{n:"Národný energetický klaster NEK",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"REGIONALNY PRIEMYSELNY INOVACNY KLASTER RIMAVSKA KOTLINA REPRIK",c:"SK",y:"Jesenské"},
{n:"Regional Development Cluster",c:"SK",y:"Trnava",r:"Western Slovakia"},
{n:"SAPI - renewable energy cluster",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"SME BOOSTER & INNOVATIONS CLUSTER",c:"SK",y:"Banská Bystrica",r:"Central Slovakia"},
{n:"Slovak Battery Alliance",c:"SK",e:"electronics",y:"Bratislava",r:"Bratislava Region"},
{n:"Slovak Biogas Association",c:"SK",e:"energy_renewables",y:"Bratislava",r:"Bratislava Region"},
{n:"Slovak Electric Vehicle Association (SEVA)",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"Slovak Game Developers Association",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"Slovak National Hydrogen Association",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"Slovak Plastic Cluster",c:"SK",y:"Nitra",r:"Western Slovakia"},
{n:"Slovak Smart City Cluster",c:"SK",e:"digital",y:"Poprad",r:"Eastern Slovakia"},
{n:"Smart Cluster StartUP HUb",c:"SK",e:"agri_food",y:"Matúškovo"},
{n:"Smart Industry Association - Industry4UM",c:"SK",y:"Bratislava",r:"Bratislava Region"},
{n:"Adana Industrial Park Electromechanical Clustering",c:"TR",y:"Adana"},
{n:"Aerospace Cluster Association",c:"TR",e:"aerospace_and_defe",y:"Türkiye"},
{n:"Anatolian Rail Transportation Systems Cluster",c:"TR",e:"mobility_transport",y:"ANKARA"},
{n:"Ankara Chamber of Industry (ACI) Nuclear Industry Cluster - NÜKSAK Commercial Enterprise",c:"TR",y:"Ankara"},
{n:"Ankara Technopark",c:"TR",e:"aerospace_and_defe",y:"Ankara"},
{n:"Ankara Union of Tradesmen and Craftsmen",c:"TR",e:"retail",y:"ANKARA"},
{n:"Ankara Üniversitesi Teknokent",c:"TR",e:"agri_food",y:"Ankara"},
{n:"Automotive Suppliers Association of Turkey (TAYSAD)",c:"TR",y:"Kocaeli"},
{n:"BOIZ Smart Transportation and Mobility Cluster",c:"TR",e:"mobility_transport",y:"Bursa"},
{n:"BURSA AEROSPACE & DEFENCE CLUSTER",c:"TR",y:"BURSA"},
{n:"BURSA HOME TEXTILE CLUSTER (BURTEXHOME)",c:"TR",e:"textiles",y:"Bursa"},
{n:"BUTEXCOMP Cluster",c:"TR",e:"aerospace_and_defe",y:"Bursa"},
{n:"COMMUNICATION TECHNOLOGIES CLUSTER",c:"TR",y:"ANKARA"},
{n:"Construction Machinery Cluster",c:"TR",y:"Ankara"},
{n:"Denizli Chamber of Commerce Technical Textiles Cluster",c:"TR",e:"textiles",y:"Denizli"},
{n:"ENSIA Clean Energy Cluster",c:"TR",e:"energy_renewables",y:"İZMİR"},
{n:"Eskisehir Chamber of Industry - Automotive Cluster",c:"TR",y:"Eskişehir"},
{n:"Eskisehir Chamber of Industry - Aviation Cluster",c:"TR",y:"Eskisehir"},
{n:"ICI-ICT Industry 4.0 Cluster",c:"TR",e:"digital",y:"Istanbul"},
{n:"ISKID AIR-CONDITIONING AND REFRIGERATION MANUFACTURERS' ASSOCIATION (ISKID)",c:"TR",y:"ISTANBUL"},
{n:"ISTANBUL HEALTH INDUSTRY CLUSTER",c:"TR",e:"digital",y:"ISTANBUL"},
{n:"Inegol Furniture Cluster",c:"TR",e:"construction",y:"Bursa"},
{n:"Istanbul Chemicals and Chemical Products Exporters' Association / Turkish Cosmetics Cluster",c:"TR",y:"İstanbul"},
{n:"Jeotermal Elektrik Santral Yatırımcıları Derneği",c:"TR",y:"İZMİR"},
{n:"MEDIKUM - Medical Industry Innovation Cluster",c:"TR",y:"Samsun"},
{n:"MIP Automotive Sub-Industry Cluster",c:"TR",y:"Manisa"},
{n:"Mersin Logistic Cluster",c:"TR",y:"Mersin"},
{n:"OSTIM DEFENSE AND AVIATION CLUSTER",c:"TR",y:"Ankara"},
{n:"OSTIM MEDICAL INDUSTRY CLUSTER",c:"TR",y:"Ankara"},
{n:"OSTIM RENEWABLE ENERGY AND ENVIRONMENTAL TECHNOLOGIES CLUSTER",c:"TR",y:"ANKARA"},
{n:"OSTIM RUBBER TECHNOLOGIES CLUSTER",c:"TR",y:"ANKARA"},
{n:"SAHA Istanbul Aerospace Cluster",c:"TR",y:"Istanbul"},
{n:"Samsun Chamber of Commerce and Industry-Samsun Food Cluster",c:"TR",y:"Samsun"},
{n:"Solar Cluster-TR",c:"TR",y:"Ankara"},
{n:"Trabzon Health Tourism",c:"TR",e:"health",y:"Trabzon"},
{n:"Turkish Association of Ship Industrialists",c:"TR",y:"istanbul"},
{n:"Turkish Salmon From Black Sea",c:"TR",y:"Ortahisar"},
{n:"YABISAK Software and IT Industrialists Cluster Association",c:"TR",e:"digital",y:"İzmir"},
{n:"e-hike",c:"TR",y:"Istanbul"},
{n:"iztocluster",c:"TR",y:"İzmir"},
{n:"\"International Medical Cluster\"",c:"UA",e:"digital",y:"Kharkiv"},
{n:"\"Zaporizhzhia Cluster \"Engineering - Automation - Machinery\"",c:"UA",y:"Zaporizhzhia"},
{n:"ASSOCIATION «UKRAINIAN LOGISTICS ALLIANCE»",c:"UA",y:"Kyiv"},
{n:"Agrofoodcluster Kharkiv",c:"UA",y:"Kharkiv"},
{n:"Association of Industrial Automation of Ukraine",c:"UA",e:"agri_food",y:"Kyiv"},
{n:"CBIT - Cluster of Bukovina innovation technologies",c:"UA",y:"Chernivtsi"},
{n:"Cherkasy IT Cluster",c:"UA",y:"Cherkasy"},
{n:"Chernihiv IT Cluster",c:"UA",e:"digital",y:"Chernihiv"},
{n:"Circular Economy Cluster",c:"UA",e:"construction",y:"Irpin"},
{n:"Cluster of Manufacturers of Medical Products",c:"UA",e:"health",y:"Украина"},
{n:"Cybersecurity Cluster of Ukraine",c:"UA",e:"aerospace_and_defe",y:"Kyiv"},
{n:"Dnipro Medical Cluster",c:"UA",e:"digital",y:"Dnipro"},
{n:"IT Association of Vinnytsia",c:"UA",e:"digital",y:"Vinnytsia"},
{n:"IT Cluster Khmelnytskyi",c:"UA",e:"digital",y:"Khmelnytskyi"},
{n:"IT Cluster Transcarpathia",c:"UA",e:"digital",y:"Uzhhorod"},
{n:"IT Dnipro Community",c:"UA",e:"digital",y:"Dnipro"},
{n:"IT Family Odesa",c:"UA",e:"digital",y:"Odesa"},
{n:"International Agrocluster \"Dnister\"",c:"UA",e:"agri_food",y:"Vinnytsia"},
{n:"International Cluster of Innovations and Creative Industries",c:"UA",e:"creative_and_cultu",y:"Польша"},
{n:"International Interregional Agro Industrial Cluster of Kherson Region \"Eastern Food Technologies Plus\" Ukraine.",c:"UA",y:"Каховка"},
{n:"Ivano-Frankivsk IT Cluster",c:"UA",e:"digital",y:"Ivano-Frankivsk"},
{n:"Kharkiv Cluster EAM",c:"UA",e:"construction",y:"Kharkiv"},
{n:"Kharkiv Fashion Cluster",c:"UA",y:"Kharkiv"},
{n:"Kharkiv IT Cluster",c:"UA",e:"digital",y:"Kharkiv"},
{n:"Konotop IT cluster",c:"UA",y:"Konotop"},
{n:"Kyiv IT Cluster",c:"UA",e:"digital",y:"Kyiv"},
{n:"Lviv Cluster of Medical Business",c:"UA",e:"health",y:"Lviv"},
{n:"Lviv Furniture Cluster",c:"UA",e:"creative_and_cultu",y:"Lviv"},
{n:"Lviv IT Cluster",c:"UA",e:"digital",y:"Lviv"},
{n:"Lviv Tech Cluster",c:"UA",e:"aerospace_and_defe",y:"Львів"},
{n:"Printing industry, Publishing houses and digital technologies printing: Logistics, Service, Quality",c:"UA",e:"creative_and_cultu",y:"Dnipro"},
{n:"Public Union \"Ukrainian Maritime Cluster\"",c:"UA",y:"Mykolaiv"},
{n:"Publishing and Printing Cluster",c:"UA",y:"Lviv"},
{n:"Rivne IT Cluster",c:"UA",e:"creative_and_cultu",y:"Rivne"},
{n:"Rivne Interregional Medical Cluster",c:"UA",e:"digital",y:"Rivne"},
{n:"Science Cluster \"Science Parks of Ukraine\"",c:"UA",e:"aerospace_and_defe",y:"Kyiv"},
{n:"Sumy Machine-Building and Energy Equipment Cluster",c:"UA",e:"energy_intensive_i",y:"Sumy"},
{n:"Ukrainian Association of Furniture Manufacturers",c:"UA",e:"construction",y:"Kyiv"},
{n:"Ukrainian Association of Startups",c:"UA",e:"creative_and_cultu",y:"Petropavlivska Borshchahivka"},
{n:"Ukrainian Automotive and Mobility Cluster",c:"UA",e:"electronics",y:"Kyiv"},
{n:"Ukrainian Interior Design and Furniture Cluster",c:"UA",e:"creative_and_cultu",y:"Kyiv"},
{n:"Ukrainian Organic Cluster",c:"UA",y:"Khmilnyk"},
{n:"Ukrainian Wooden Houses Cluster",c:"UA",e:"construction",y:"Kyiv"},
{n:"Vinnytsia Automation and Instrument Making Cluster",c:"UA",e:"aerospace_and_defe",y:"Vinnytsia"},
{n:"STIKK - Kosovo ICT Association",c:"XK",y:"Prishtina"}
];

// A registry profile in the given ecosystem, outside the player's own country and
// not already on the board. Seeding a rival this way keeps its name, home country
// and ecosystem consistent with each other, which picking a name alone does not.
function registrySeed(ecoId, excludeCountry, takenNames) {
  const used = new Set(takenNames || []);
  const exISO = NAME_TO_ISO[excludeCountry] || null;
  const usable = c => !used.has(c.n) && c.c !== exISO && ISO_TO_NAME[c.c];
  // Only ever return a profile from the right ecosystem. A real name attached to
  // the wrong sector reads as a bug, so thin ecosystems fall back to an invented
  // name at the call site instead.
  const pool = ECCP_CLUSTERS.filter(c => c.e === ecoId && usable(c));
  if (!pool.length) return null;
  const pickd = pool[Math.floor(Math.random() * pool.length)];
  return { name: pickd.n, country: ISO_TO_NAME[pickd.c] };
}

// Names available for a given country and ecosystem, widening the search when a
// combination is thin: the registry has only one or two profiles for many pairs.
function clusterPicks(countryISO, ecoId) {
  const all = ECCP_CLUSTERS;
  const inCountry = countryISO ? all.filter(c => c.c === countryISO) : all;
  const exact = ecoId ? inCountry.filter(c => c.e === ecoId) : [];
  if (exact.length) return exact;
  if (inCountry.length) return inCountry;
  return ecoId ? all.filter(c => c.e === ecoId) : all;
}

// A registry name for a rival, preferring one that matches its country and
// ecosystem, and never reusing a name already on the board.
function rivalRegistryName(countryName, ecoId, taken) {
  const iso = NAME_TO_ISO[countryName] || null;
  const used = new Set(taken || []);
  for (const pool of [clusterPicks(iso, ecoId), clusterPicks(iso, null), ECCP_CLUSTERS]) {
    const free = pool.filter(c => !used.has(c.n));
    if (free.length) return free[Math.floor(Math.random() * free.length)].n;
  }
  return null;
}


const STAGES = [
  {id:0,name:"Cluster Initiative",        color:"#506880",short:"CI"},
  {id:1,name:"Cluster Organisation",      color:"#28a0e8",short:"CO"},
  {id:2,name:"National Association",      color:"#8050f0",short:"NA"},
  {id:3,name:"Cross-Border Metacluster",  color:"#f0a020",short:"CBM"},
  {id:4,name:"EU Platform",               color:"#f04848",short:"EUP"},
  {id:5,name:"Pan-European Cluster Network", color:"#00e5b0",short:"PCN"},
];

const STAFF_ROLES = [
  {id:"manager",  name:"General Manager",    icon:"user-tie",cost:7000, desc:"THE boss: the cluster cannot operate a single quarter without its General Manager, and there is never more than one. -0.5% churn. Unlocks network projects and EU lobbying."},
  {id:"comms",    name:"Communications Director",     icon:"bullhorn",cost:4500, desc:"+4 members/quarter, +2 influence/quarter. Slows influence decay. Needed for the Regional S3 Committee seat."},
  {id:"lobbyist", name:"Policy Lobbyist",    icon:"landmark",cost:6200, desc:"+3 influence/quarter. Bad events weakened by 55%. Opens political seats (national: 1, EU: 2). 2 required to evolve to EU Platform."},
  {id:"trainer",  name:"Training Coordinator", icon:"graduation-cap",cost:4200, desc:"+5 members/quarter. Churn -0.8%/quarter per hire."},
  {id:"pm",       name:"Project Manager",    icon:"diagram-project",cost:5800, desc:"+18% project income. Project failure risk -14% per hire."},
  {id:"analyst",  name:"Research Analyst",   icon:"magnifying-glass-chart",cost:4800, desc:"+4 influence/quarter. Unlocks Horizon Europe RIA/KIC. 1 required to evolve to National Association."},
  {id:"finance",  name:"Finance Director",   icon:"briefcase",cost:7500, desc:"Overhead -20%. Unlocks the largest EU calls. 1 required to evolve to Cross-Border Metacluster."},
  {id:"legal",    name:"Legal Counsel",      icon:"scale-balanced",cost:5200, desc:"Failure risk -8% per hire. Audit events negated. Evolution demands 1/2/3 Legal Counsel from Stage 3 up."},
  {id:"hr",       name:"Human Resources Manager",         icon:"users-gear",cost:3800, desc:"Churn -1%/quarter. Salary inflation events negated."},
  {id:"director", name:"Executive Director", icon:"award",cost:9500, desc:"Governance role. Extends management capacity by +7 staff (span of control). Board +4/quarter (first hire), +2/quarter each extra. Halves the board penalty from failed projects. Income +10%. 2 required for Stage 5."},
  {id:"coordinator", name:"Regional Coordinator", icon:"map", cost:3200, hidden:true, desc:"Runs one regional office. Hired automatically with every regional expansion and cannot be dismissed while the office is open."},
  {id:"countrymgr",  name:"Country Manager", icon:"earth-europe", cost:8500, hidden:true, desc:"Leads a national office. Hired automatically with every country expansion and cannot be dismissed while the office is open."},
];

/* ═══════════════════════════════════════════════════════════
   RIVAL CLUSTERS · three AI clusters race you to the Alliance.
   They progress every quarter, poach members (same sector),
   outcompete you for funding when ahead, and win if they
   reach Stage 5 first.
═══════════════════════════════════════════════════════════ */
const RIVAL_COLORS = ["#f04040","#f0a030","#c084fc"];
const RIVAL_PREFIX = ["Polaris","Vanguard","Meridian","Atlas","Helios","Danubia","Baltica","Carpathia","Adriatica","Boreas","Iberis","Vectis"];
const RIVAL_PACE   = { aggressive:1.25, steady:1.0, cautious:0.8 };
// Every rival gets a distinct personality that changes what you must defend against
const RIVAL_ARCHETYPES = [
  { id:"poacher",      label:"The Poacher",          icon:"users",        poach:2.2, prog:0.90, expand:1.0, seatBias:0.6, health:55, blurb:"aggressive member raids, fragile delivery" },
  { id:"insider",      label:"The Brussels Insider", icon:"landmark",     poach:0.8, prog:1.00, expand:0.8, seatBias:2.6, health:70, blurb:"races for political seats and drains your influence" },
  { id:"expansionist", label:"The Expansionist",     icon:"earth-europe", poach:1.0, prog:1.05, expand:2.6, seatBias:0.8, health:55, blurb:"claims territory fast, finances stretched thin" },
  { id:"deliverer",    label:"The Deliverer",        icon:"award",        poach:0.5, prog:1.18, expand:0.9, seatBias:1.0, health:75, blurb:"quiet and methodical, dangerously fast to evolve" },
  { id:"discounter",   label:"The Discounter",       icon:"coins",        poach:1.5, prog:0.95, expand:1.3, seatBias:0.5, health:60, blurb:"undercuts fees wherever your networks overlap" },
];
const archOf = rv => RIVAL_ARCHETYPES.find(a => a.id === rv?.arch) || RIVAL_ARCHETYPES[3];
const sharedCountries = (gs, rv) => (rv?.countries||[]).filter(c => (gs?.countries||[]).includes(c));

// Finite member market: you and rivals recruit from the same pool in your countries
const marketPool  = gs => (gs?.countries||[]).reduce((t,c) => t + 40 + (EU_COUNTRIES[c]||[]).length*45, 0);
const rivalPressure = gs => (gs?.rivals||[]).reduce((t,rv) => t + (sharedCountries(gs,rv).length > 0 ? (rv.members||0)*0.5 : 0), 0);
const marketShare = gs => Math.min(1, (((gs?.members||0) + rivalPressure(gs)) / Math.max(1, marketPool(gs))));

// Head-to-head bidding: rivals ahead of you (or holding the funder's seat) contest your calls
const FUND_SEAT = { local:"regional", regional:"regional", national:"national", eu:"eu" };
function projContest(p, gs) {
  if (!gs) return { rivals:[], failPen:0, marginMul:1 };
  const seatId  = FUND_SEAT[p.fund] || "regional";
  const mySeat  = !!(gs.seats||{})[seatId];
  const rivals  = (gs.rivals||[]).filter(rv => rv.stage >= p.s && ((rv.stage > (gs.stage||0) && rv.stage >= 2) || (gs.rivalSeats||{})[seatId] === rv.id));
  const n = Math.min(2, rivals.length);
  const soften = (mySeat ? 0.5 : 1) * (diffOf(gs).pressure||1); // your own seat halves the damage; easier tiers face gentler bidding wars
  return { rivals, failPen: n * 0.04 * soften, marginMul: 1 - n * 0.075 * soften };
}

function makeRivals(playerCountry, playerSector) {
  const pool = DATA_COUNTRIES.filter(c => c !== playerCountry);
  const pick = () => pool.splice(Math.floor(Math.random()*pool.length), 1)[0];
  const others = ECOSYSTEMS.filter(e => e.id !== playerSector?.id);
  const o1 = others[Math.floor(Math.random()*others.length)];
  let o2 = others[Math.floor(Math.random()*others.length)];
  if (o2 === o1) o2 = others[(others.indexOf(o1)+1) % others.length];
  const archPool = [...RIVAL_ARCHETYPES];
  const pickArch = () => archPool.splice(Math.floor(Math.random()*archPool.length), 1)[0];
  const namePool = [...RIVAL_PREFIX];
  const pickName = () => namePool.splice(Math.floor(Math.random()*namePool.length), 1)[0];
  const usedNames = [];
  const mk = (i, sec, pace) => {
    const seed = registrySeed(sec.id, playerCountry, usedNames);
    const c = seed ? seed.country : pick();
    const arch = pickArch();
    const name = seed ? seed.name : `${pickName()} ${String(sec.name).split(/[ ,]/)[0]}`;
    usedNames.push(name);
    return { id:"rv"+i, name,
      country:c, countries:[c], sectorId:sec.id, sectorName:sec.name, icon:sec.icon,
      color:RIVAL_COLORS[i], pace, stage:0, progress:Math.random()*25,
      arch: arch.id, health: Math.max(30, Math.min(90, arch.health + Math.floor(Math.random()*17) - 8)),
      truce: 0,
      members:5+Math.floor(Math.random()*6), prestige:8+Math.floor(Math.random()*8) };
  };
  // rival 0 always shares your sector (the direct competitor); rival 1 does half the time
  const r1sec = Math.random() < 0.5 ? (playerSector||ECOSYSTEMS[0]) : o1;
  return [ mk(0, playerSector||ECOSYSTEMS[0], "aggressive"), mk(1, r1sec, "steady"), mk(2, o2, "cautious") ];
}

// A collapsed or acquired rival is eventually replaced by a fresh entrant:
// success attracts imitators. Spawns only while >=1 rival remains, so
// delivering the killing blow to the LAST rival still wins instantly.
function spawnRival(s) {
  const existing = s.rivals||[];
  const usedColors = new Set(existing.map(r=>r.color));
  const color = RIVAL_COLORS.find(c=>!usedColors.has(c)) || RIVAL_COLORS[0];
  const usedNames = new Set(existing.map(r=>String(r.name).split(" ")[0]));
  const namePool = RIVAL_PREFIX.filter(n=>!usedNames.has(n));
  const name = namePool[Math.floor(Math.random()*namePool.length)] || "Nova";
  const usedArch = new Set(existing.map(r=>r.arch));
  const archPool = RIVAL_ARCHETYPES.filter(a=>!usedArch.has(a.id));
  const arch = archPool[Math.floor(Math.random()*archPool.length)] || RIVAL_ARCHETYPES[3];
  const sec = Math.random() < 0.5 ? s.sector : ECOSYSTEMS[Math.floor(Math.random()*ECOSYSTEMS.length)];
  const country = DATA_COUNTRIES[Math.floor(Math.random()*DATA_COUNTRIES.length)];
  const ids = new Set(existing.map(r=>r.id)); let n=0; while(ids.has("rv"+n)) n++;
  const seed = registrySeed(sec?.id, s.country, existing.map(r=>r.name));
  const rvName = seed ? seed.name : `${name} ${String(sec?.name||"Cluster").split(/[ ,]/)[0]}`;
  const rvCountry = seed ? seed.country : country;
  return { id:"rv"+n, name: rvName,
    country: rvCountry, countries:[rvCountry], sectorId:sec?.id, sectorName:sec?.name, icon:sec?.icon||"industry",
    color, pace:["aggressive","steady","cautious"][Math.floor(Math.random()*3)],
    stage: Math.max(0, (s.stage||0) - 1), progress: Math.random()*30,
    arch: arch.id, health: Math.max(30, Math.min(90, arch.health + Math.floor(Math.random()*17) - 8)),
    truce: 0, members: 5 + Math.floor(Math.random()*6) + (s.stage||0)*8,
    prestige: 8 + Math.floor(Math.random()*8) };
}

function tickRivals(s) {
  const logs = []; let poached = 0, prestigeHit = 0, defeatedBy = null;
  const rivalSeats = { ...(s.rivalSeats||{}) };
  const SEAT_MIN_STAGE = { regional:1, national:2, eu:3 };
  let rivals = (s.rivals||[]).map(rv => {
    const r = { ...rv, countries:[...(rv.countries||[rv.country])] };
    const arch = archOf(r);
    if (r.stage >= 5) return r;
    const pace = RIVAL_PACE[r.pace] || 1;
    const rate = [3.8,3.4,3.0,2.7,2.5][Math.min(4, r.stage)] || 2.5;
    const euBrake   = (s.seats||{}).eu ? 0.85 : 1;         // your EU seat: you shape the rules they play by
    const seatBoost = Object.values(rivalSeats).filter(id => id === r.id).length > 0 ? 1.08 : 1; // their seats help them
    const coalition = (s.coalitionUntil||0) > (s.turn||0) ? 1.12 : 1;
    r.progress = (r.progress||0) + rate * pace * arch.prog * seatBoost * coalition * diffOf(s).rival * euBrake * (0.7 + Math.random()*0.6);
    r.members  = Math.max(3, Math.round((r.members||5) + (r.stage+1)*pace*(0.4+Math.random())));
    r.prestige = Math.min(100, Math.max(0, (r.prestige||10) + (20 + r.stage*14 - (r.prestige||10))*0.08 + (Math.random()*4 - 2)));
    if (r.progress >= 100) {
      r.stage = Math.min(5, r.stage + 1); r.progress = 0;
      logs.push({ t:"bad", txt:`${r.name} (${NAME_TO_ISO[r.country]||r.country}) evolved to ${STAGES[r.stage].name}` });
      if (r.stage > s.stage) prestigeHit += 2;
      if (r.stage === 5) defeatedBy = r.name;
    }
    // Territorial expansion: bordering countries only, expansionists much faster
    if (r.stage >= 2 && Math.random() < 0.05 * pace * arch.expand && r.countries.length < r.stage*4 + 1) {
      const borders = new Set();
      r.countries.forEach(c => { const nk=(NAME_TO_ISO[c]==="GR")?"EL":NAME_TO_ISO[c]; (NUTS_BORDERS[nk]||[]).forEach(b=>{const iso=b==="EL"?"GR":b; const nm=ISO_TO_NAME[iso]; if(nm) borders.add(nm);}); });
      const options = DATA_COUNTRIES.filter(c => !r.countries.includes(c) && borders.has(c));
      if (options.length) {
        const c = options[Math.floor(Math.random()*options.length)];
        r.countries.push(c);
        logs.push({ t:"bad", txt:`${r.name} expanded into ${c}${(s.countries||[]).includes(c) ? " — your territory is now contested" : ""}` });
      }
    }
    // Insiders erode your political standing while they outrank you
    if (arch.id === "insider" && r.stage >= 3 && r.stage >= s.stage) prestigeHit += 1;
    // Poaching: needs overlap (same sector or shared country), scaled by archetype; truce suspends it
    const shared = sharedCountries(s, r).length;
    const overlap = r.sectorId === s.sector?.id || shared > 0 || (s.stage||0) >= 2; // cross-ecosystem clusters compete with everyone
    const inTruce = (r.truce||0) > (s.turn||0);
    if (overlap && !inTruce && r.stage >= Math.max(2, s.stage) && Math.random() < 0.6) {
      const coalPoach = (s.coalitionUntil||0) > (s.turn||0) ? 1.25 : 1;
      const scouted = (r.scoutedUntil||0) > (s.turn||0) ? 0.85 : 1; // counter-intelligence
      poached += Math.max(1, Math.round((s.members||1) * 0.012 * pace * arch.poach * coalPoach * scouted * (0.6 + 0.25*Math.min(3,shared)) * (diffOf(s).pressure||1) * ((s.seats||{}).national ? 0.5 : 1)));
    }
    // Rivals race for the political seats you have not secured
    for (const [seatId, minStage] of Object.entries(SEAT_MIN_STAGE)) {
      if ((s.seats||{})[seatId] || rivalSeats[seatId]) continue;
      if (r.stage >= minStage && Math.random() < 0.014 * arch.seatBias * (diffOf(s).pressure||1)) {
        rivalSeats[seatId] = r.id;
        logs.push({ t:"bad", txt:`${r.name} took the ${SEATS.find(x=>x.id===seatId)?.label} chair — displace them with enough influence` });
      }
    }
    // Fragility: health regenerates slowly, market squeeze and scandals wear it down
    r.health = Math.min(100, (r.health ?? archOf(r).health) + 2);
    const squeezed = sharedCountries(s, r).filter(c => (s.fullCountries||[]).includes(c)).length;
    r.health -= 2 * squeezed;
    if (Math.random() < 0.04) { r.health -= 10; logs.push({ t:"good", txt:`${r.name} is in trouble: a funding audit went badly (health −10)` }); }
    return r;
  });
  // Collapse: a rival at zero health folds; nearby members defect to you
  let defectors = 0;
  rivals = rivals.filter(r => {
    if ((r.health ?? 100) > 0) return true;
    const near = sharedCountries(s, r).length > 0;
    if (near) defectors += Math.round((r.members||0) * 0.25);
    for (const k of Object.keys(rivalSeats)) if (rivalSeats[k] === r.id) delete rivalSeats[k];
    logs.push({ t:"good", txt:`${r.name} has collapsed${near ? ` · ${Math.round((r.members||0)*0.25)} of their members joined you` : ""} — one less rival in the race` });
    s.rivalsGone = (s.rivalsGone||0) + 1;
    return false;
  });
  if (poached > 0) logs.push({ t:"bad", txt:`Rival recruiters poached ${poached} member${poached!==1?"s":""} this quarter` });
  const competition = rivals.filter(r => r.stage > s.stage).length;
  s.rivals = rivals;
  s.rivalSeats = rivalSeats;
  return { logs, poached, prestigeHit, defeatedBy, competition, defectors };
}

const PROJECTS = [
  {id:"vshop",name:"Vocational Skills Workshops",   cat:"training", s:0,dur:2,mem:10, part:2,  base:24000,  pb:5000,  pres:4, mg:4,  sr:0,fund:"local",    cofin:0.10, desc:"Hands-on upskilling for member company staff"},
  {id:"nlab", name:"Regional Living Lab",           cat:"research", s:1,dur:3,mem:30, part:4,  base:120000, pb:16000, pres:9, mg:7,  sr:0,fund:"regional", cofin:0.15, reg:2, desc:"Open test environment where members pilot new products with citizens"},
  {id:"iexp", name:"Internationalisation Mission",  cat:"comms",    s:1,dur:2,mem:35, part:4,  base:95000,  pb:14000, pres:8, mg:6,  sr:0,fund:"national", cofin:0.15, preq:25, desc:"Joint trade mission and matchmaking in a target export market"},
  {id:"circ", name:"Circular Economy Audit Scheme", cat:"research", s:2,dur:3,mem:60, part:6,  base:260000, pb:30000, pres:12,mg:9,  sr:0,fund:"national", cofin:0.15, brd:45, desc:"Resource-efficiency audits and green transition roadmaps for members"},
  {id:"dtwin",name:"Industrial Digital Twin Pilot", cat:"research", s:2,dur:4,mem:80, part:7,  base:420000, pb:45000, pres:15,mg:10, sr:0,fund:"eu",       cofin:0.20, preq:40, s3:1, desc:"Shared digital-twin infrastructure for member factories"},
  {id:"wstd", name:"Standardisation Task Force",    cat:"lobbying", s:3,dur:4,mem:120,part:9,  base:520000, pb:50000, pres:20,mg:6,  sr:0,fund:"eu",       cofin:0.20, preq:50, desc:"Represent members in European standard-setting committees"},
  {id:"vcrp", name:"Investor Readiness Programme",  cat:"network",  s:3,dur:3,mem:140,part:8,  base:480000, pb:48000, pres:16,mg:14, sr:0,fund:"national", cofin:0.15, brd:55, desc:"Prepare member scale-ups for venture and growth capital"},
  {id:"gdeal",name:"Green Deal Flagship Consortium",cat:"research", s:4,dur:6,mem:260,part:16, base:3200000,pb:210000,pres:38,mg:20, sr:4,fund:"eu",       cofin:0.25, ctr:6, reg:8, s3:1, desc:"Continent-scale decarbonisation demonstrator led by your network"},

  {id:"net",  name:"Networking Event Series",      cat:"comms",    s:0,dur:1,mem:6,  part:2,  base:10000, pb:2000,  pres:3, mg:3,  sr:0,fund:"local",    cofin:0.10, desc:"Quarterly business-to-business matchmaking events"},
  {id:"jm",   name:"Joint Marketing Campaign",     cat:"comms",    s:0,dur:1,mem:8,  part:2,  base:16000, pb:3500,  pres:4, mg:2,  sr:0,fund:"local",    cofin:0.10, desc:"Shared trade fair presence and branding"},
  {id:"bs",   name:"Sector Benchmarking Study",    cat:"research", s:0,dur:2,mem:7,  part:0,  base:12000, pb:0,     pres:6, mg:0,  sr:0,fund:"local",    preq:15,cofin:0.10, desc:"Competitiveness analysis vs EU sector peers"},
  {id:"lr",   name:"Local R&D Consortium",         cat:"research", s:0,dur:2,mem:10, part:3,  base:32000, pb:5500,  pres:7, mg:1,  sr:0,fund:"local",    brd:40,cofin:0.15, desc:"Pool resources for applied research"},
  {id:"vt",   name:"Vocational Training",          cat:"training", s:1,dur:2,mem:22, part:3,  base:82000, pb:13000, pres:9, mg:5,  sr:1,fund:"regional", reg:2,cofin:0.15, desc:"Upskill workers via ESF co-funding"},
  {id:"ih",   name:"Regional Innovation Hub",      cat:"research", s:1,dur:5,mem:35, part:5,  base:290000,pb:38000, pres:14,mg:7,  sr:1,fund:"regional", preq:35,reg:2,cofin:0.20, desc:"Shared open-innovation facility with test beds"},
  {id:"digi", name:"SME Digitalisation",           cat:"training", s:1,dur:3,mem:28, part:4,  base:155000,pb:24000, pres:11,mg:6,  sr:1,fund:"regional", brd:50,cofin:0.15, desc:"Industry 4.0 tools adoption programme"},
  {id:"lbl",  name:"Excellence Label Audit",       cat:"comms",    s:1,dur:2,mem:25, part:0,  base:25000, pb:0,     pres:24,mg:2,  sr:1,fund:"local",    preq:30,s3:1, desc:"Apply for EU Cluster Excellence Label"},
  {id:"erdf", name:"ERDF Innovation Action",       cat:"research", s:1,dur:5,mem:40, part:6,  base:420000,pb:50000, pres:18,mg:8,  sr:2,fund:"regional", preq:40,reg:3,cofin:0.20, desc:"ERDF-funded regional innovation project"},
  {id:"npa",  name:"National Policy Advocacy",     cat:"lobbying", s:2,dur:3,mem:70, part:6,  base:210000,pb:28000, pres:22,mg:5,  sr:2,fund:"national", preq:50,brd:55, desc:"Lobby at ministry level for cluster policy"},
  {id:"conf", name:"National Sector Conference",   cat:"comms",    s:2,dur:1,mem:65, part:10, base:105000,pb:10000, pres:18,mg:14, sr:2,fund:"national", reg:4,cofin:0.15, desc:"Host the national annual sector conference"},
  {id:"grd",  name:"Green Transition Roadmap",     cat:"research", s:2,dur:5,mem:85, part:8,  base:540000,pb:65000, pres:26,mg:9,  sr:3,fund:"national", preq:55,s3:1,cofin:0.20, desc:"Sector decarbonisation strategy"},
  {id:"esf",  name:"ESF+ Skills Programme",        cat:"training", s:2,dur:4,mem:75, part:7,  base:720000,pb:78000, pres:20,mg:12, sr:2,fund:"national", reg:4,brd:50,cofin:0.20, desc:"European Social Fund+ workforce reskilling"},
  {id:"irr",  name:"INTERREG Cross-Border",        cat:"network",  s:2,dur:7,mem:95, part:9,  base:1100000,pb:105000,pres:30,mg:14,sr:3,fund:"eu",       ctr:2,cofin:0.25, desc:"Cross-border EU cluster innovation project"},
  {id:"hia",  name:"Horizon Europe IA",            cat:"research", s:3,dur:7,mem:120,part:10, base:2600000,pb:210000,pres:38,mg:18,sr:4,fund:"eu",       ctr:3,preq:65,cofin:0.30, desc:"Innovation Action at EU scale · 70% EU funding rate"},
  {id:"hria", name:"Horizon Europe RIA",           cat:"research", s:3,dur:9,mem:150,part:13, base:4200000,pb:280000,pres:48,mg:25,sr:5,fund:"eu",       ctr:4,reg:6,preq:75,cofin:0.10, desc:"Research & Innovation Action · 100% EU-funded, own overheads only"},
  {id:"twin", name:"Twin Transition Accelerator",  cat:"research", s:3,dur:7,mem:130,part:11, base:2900000,pb:220000,pres:42,mg:20,sr:4,fund:"eu",       ctr:3,preq:70,s3:1,cofin:0.30, desc:"Green + digital transformation accelerator · IA funding rules"},
  {id:"cep",  name:"Cluster Ecosystem Partnership",cat:"network",  s:3,dur:6,mem:170,part:15, base:2100000,pb:165000,pres:34,mg:22,sr:4,fund:"eu",       ctr:4,reg:6,cofin:0.20, desc:"EU cluster-to-cluster collaboration framework"},
  {id:"slvr", name:"Silver Label Campaign",        cat:"comms",    s:3,dur:3,mem:100,part:0,  base:48000, pb:0,     pres:30,mg:5,  sr:2,fund:"national", preq:60,s3:1, desc:"Upgrade to EU Cluster Excellence Silver Label"},
  {id:"eccp", name:"ECCP Alliance Formation",      cat:"network",  s:4,dur:7,mem:280,part:22, base:8500000,pb:420000,pres:65,mg:45,sr:6,fund:"eu",       ctr:8,preq:80,cofin:0.25, desc:"Formal European Cluster Collaboration Platform"},
  {id:"eul",  name:"EU Council Policy Drive",      cat:"lobbying", s:4,dur:5,mem:310,part:20, base:5200000,pb:310000,pres:55,mg:28,sr:6,fund:"eu",       ctr:10,preq:85,brd:60, desc:"Shape EU industrial policy at Council level"},
  {id:"flag", name:"EU Flagship Initiative",       cat:"research", s:4,dur:12,mem:350,part:28,base:14000000,pb:600000,pres:78,mg:55,sr:7,fund:"eu",      ctr:12,preq:90,cofin:0.30, desc:"Landmark pan-European sector initiative"},
  {id:"gold", name:"Gold Label + EEN Integration", cat:"comms",    s:4,dur:4,mem:260,part:0,  base:110000,pb:0,     pres:40,mg:10, sr:4,fund:"eu",       preq:85,s3:1, desc:"Gold Excellence Label and EEN integration"},
  {id:"kic",  name:"Knowledge & Innovation Community", cat:"research", s:4,dur:10,mem:300,part:25,base:10500000,pb:500000,pres:72,mg:40,sr:7,fund:"eu",      ctr:10,reg:14,preq:88,cofin:0.30, desc:"EIT Knowledge and Innovation Community"},
  {id:"unify",name:"EU Cluster Unification Treaty",cat:"network",  s:4,dur:8,mem:400,part:30, base:18000000,pb:750000,pres:90,mg:80,sr:8,fund:"eu",      ctr:15,preq:95,brd:70,cofin:0.30, desc:"Final merger of all EU sector clusters"},
  /* Fields: s=min stage, dur=quarters, mem=min members, part=max partners,
     base=budget, pb=per-partner top-up, pres=influence, mg=member gain,
     sr=min staff, cofin=own contribution, reg/preq/brd=extra gates. */
  {id:"opendoor",name:"Open Doors Week",              cat:"comms",    s:0,dur:1,mem:8,  part:2,  base:14000,   pb:3000,  pres:3, mg:5,  sr:0, fund:"local",    cofin:0.05, desc:"Member sites open to schools, press and the public for a week"},
  {id:"mentor",  name:"SME Mentoring Exchange",       cat:"training", s:1,dur:3,mem:25, part:3,  base:70000,   pb:11000, pres:6, mg:6,  sr:2, fund:"regional", cofin:0.10, desc:"Experienced member firms coach newcomers through scale-up decisions"},
  {id:"procure", name:"Joint Procurement Framework",  cat:"network",  s:2,dur:3,mem:55, part:5,  base:210000,  pb:26000, pres:9, mg:8,  sr:5, fund:"regional", cofin:0.12, reg:2, desc:"Pooled buying power for energy, logistics and certification services"},
  {id:"datasp",  name:"Sectoral Data Space",          cat:"research", s:3,dur:4,mem:120,part:7,  base:640000,  pb:70000, pres:14,mg:11, sr:9, fund:"eu",       cofin:0.20, preq:60, desc:"Shared data infrastructure so members can trade information without losing control of it"},
  {id:"posit",   name:"Position Paper Campaign",      cat:"lobbying", s:2,dur:2,mem:70, part:4,  base:120000,  pb:18000, pres:16,mg:3,  sr:6, fund:"national", cofin:0.10, brd:50, desc:"Evidence-backed sector position taken to national and EU consultations"},
  {id:"flagship",name:"Pan-European Flagship Alliance",cat:"network", s:4,dur:5,mem:300,part:9,  base:1900000, pb:180000,pres:22,mg:18, sr:16,fund:"eu",       cofin:0.25, preq:82, desc:"A standing alliance of national clusters with a joint work programme and shared secretariat"},

];

const EVENTS = [
  {id:"labshort",n:"Skilled Labour Shortage",           t:"bad", p:.06,bfx:0,   mfx:-5, pfx: 0, sfx:0, d:"Member companies cannot fill vacancies; several question the value of local growth strategies.", minS:1},
  {id:"nrg",  n:"Energy Price Shock",                t:"bad", p:.06,bfx:-.10,mfx:-3, pfx: 0, sfx:0, d:"Spiking energy costs squeeze industrial members. Energy-intensive firms pause cluster activities."},
  {id:"dpaudit", n:"Data Protection Audit",             t:"bad", p:.05,bfx:-.08,mfx: 0, pfx:-3, sfx:0, d:"The data protection authority audits your member database. Fines and remediation follow.", minS:1},
  {id:"succ", n:"Member Scale-Up Makes Headlines",   t:"good",p:.07,bfx:0,   mfx: 6, pfx: 5, sfx:0, d:"A member start-up closes a record funding round and credits the cluster ecosystem publicly."},
  {id:"tvdoc",n:"Documentary Features Your Cluster", t:"good",p:.05,bfx:0,   mfx: 4, pfx: 7, sfx:0, d:"A prime-time documentary on regional innovation showcases your work. Applications surge.", minS:1},
  {id:"twin2",n:"Twinning Request From Abroad",      t:"good",p:.05,bfx:.05, mfx: 0, pfx: 4, sfx:0, d:"A foreign region requests a paid twinning arrangement to learn from your model.", minS:2},
  {id:"elec", n:"Regional Elections",                t:"bad", p:.05,bfx:0,   mfx:0,  pfx:0,  sfx:0, d:"A new regional government reviews all cluster support programmes.", minS:1,
    choices:[{label:"Court the new administration", fx:{bfx:-30000, pfx:6}},{label:"Stay neutral and wait", fx:{pfx:-5}}]},
  {id:"gala", n:"Brussels Networking Gala",          t:"good",p:.05,bfx:0,   mfx:0,  pfx:0,  sfx:0, d:"An invitation to the European Cluster Gala arrives. Attendance is costly but visible.", minS:2,
    choices:[{label:"Send a delegation", fx:{bfx:-45000, pfx:8}},{label:"Decline politely", fx:{pfx:-2}}]},
  {id:"esgw", n:"Greenwashing Allegation",           t:"bad", p:.04,bfx:0,   mfx:0,  pfx:0,  sfx:0, d:"A journalist questions the substance of a member's sustainability claims made under your banner.", minS:2,
    choices:[{label:"Commission an independent audit", fx:{bfx:-60000, pfx:3}},{label:"Issue a statement and move on", fx:{pfx:-7}}]},
  {id:"aiact",n:"New EU Regulation Hits Members",    t:"bad", p:.05,bfx:0,   mfx:0,  pfx:0,  sfx:0, d:"Sweeping new EU compliance rules alarm your members. They look to the cluster for guidance.", minS:1,
    choices:[{label:"Run compliance workshops", fx:{bfx:-35000, mfx:4, pfx:4}},{label:"Leave it to each firm", fx:{mfx:-6}}]},

  {id:"rcut", n:"Regional Support Suspended",       t:"bad", p:.08,bfx:-.20,mfx: 0, pfx:-7,  sfx:0, d:"Your regional authority has frozen all cluster development grants."},
  {id:"war",  n:"Geopolitical Crisis",               t:"bad", p:.06,bfx:-.15,mfx:-4, pfx:-5,  sfx:0, d:"Armed conflict disrupts supply chains. Several member companies halt innovation spending."},
  {id:"bcut", n:"National Budget Slashes Clusters",  t:"bad", p:.07,bfx:-.25,mfx: 0, pfx:-6,  sfx:0, d:"New national budget cuts cluster support by 25%. Ministry apologises for fiscal constraints."},
  {id:"s3m",  n:"New Smart Specialisation Strategy · Sector Excluded",          t:"bad", p:.07,bfx:-.12,mfx: 0, pfx:-11, sfx:0, d:"Updated Smart Specialisation Strategy excludes your domain entirely."},
  {id:"res",  n:"Key Staff Resigns",                 t:"bad", p:.09,bfx: 0,  mfx: 0, pfx:-5,  sfx:-1,d:"A senior team member accepted an offer from a rival cluster."},
  {id:"ai",   n:"AI Displaces Member Jobs",          t:"bad", p:.07,bfx:-.08,mfx:-5, pfx:-4,  sfx:0, d:"Automation threatens member companies. Three SMEs pause contributions."},
  {id:"aud",  n:"EU Audit · Funds Frozen",           t:"bad", p:.05,bfx:-.14,mfx: 0, pfx:-7,  sfx:0, d:"An active project is flagged. Funds frozen pending audit outcome."},
  {id:"mrg",  n:"Anchor Members Merge",              t:"bad", p:.06,bfx:-30000,mfx:-3,pfx: 0, sfx:0, d:"Two founding anchor members merged, slashing combined membership fee."},
  {id:"enrg", n:"Energy Price Shock",                t:"bad", p:.07,bfx:-.09,mfx:-4, pfx:-4,  sfx:0, d:"Energy costs surge. SMEs cut R&D budgets. Two companies consider leaving."},
  {id:"reg",  n:"Burdensome New Regulation",         t:"bad", p:.06,bfx:-20000,mfx:0,pfx:-5,  sfx:0, d:"New EU regulation: €20k emergency compliance overhead."},
  {id:"poach",n:"Rival Cluster Poaches Members",     t:"bad", p:.07,bfx: 0,  mfx:-7, pfx:-7,  sfx:0, d:"A well-funded rival lured seven members with lower fees."},
  {id:"min",  n:"Government Reshuffle",              t:"bad", p:.05,bfx:-.09,mfx: 0, pfx:-8,  sfx:0, d:"New minister deprioritises clusters. Three pending grants rescinded."},
  {id:"inf",  n:"Staff Salary Inflation",            t:"bad", p:.06,bfx:-28000,mfx:0,pfx: 0,  sfx:0, d:"Wage growth forces emergency salary top-ups. €28k extra cost."},
  {id:"mff",  n:"MFF · EU Budget Cuts",              t:"bad", p:.05,bfx:-.18,mfx: 0, pfx:-8,  sfx:0, d:"Multiannual Financial Framework reduces cohesion spending EU-wide."},
  {id:"hlth", n:"Health Crisis Disrupts Operations", t:"bad", p:.04,bfx:-.12,mfx:-5, pfx:-6,  sfx:0, d:"Pandemic-like conditions disrupt member operations and cluster events."},
  {id:"mfup", n:"New MFF · More Cohesion Funding",   t:"good",p:.07,bfx:.16, mfx: 0, pfx: 5,  sfx:0, d:"New MFF allocates 18% more to cluster development across member states!"},
  {id:"s3h",  n:"New Smart Specialisation Strategy · Sector Is a Priority",     t:"good",p:.08,bfx:.10, mfx: 0, pfx:12,  sfx:0, d:"Updated Smart Specialisation Strategy names your sector a priority domain!"},
  {id:"anch", n:"Large Corporation Joins",           t:"good",p:.08,bfx:30000,mfx: 5, pfx: 7,  sfx:0, d:"A major European industrial group requests anchor membership."},
  {id:"univ", n:"University Research Partnership",   t:"good",p:.08,bfx:20000,mfx: 1, pfx:10,  sfx:0, d:"A leading technical university proposes a formal research partnership."},
  {id:"inv",  n:"EU Consortium Invitation",          t:"good",p:.07,bfx:62000,mfx: 0, pfx: 8,  sfx:0, d:"A top European cluster invites you into their Horizon Europe proposal."},
  {id:"lbl2", n:"Excellence Label Awarded",          t:"good",p:.05,bfx: 0,  mfx: 5, pfx:18,  sfx:0, d:"Your cluster receives the EU Cluster Excellence Label. Influence soars!"},
  {id:"media",n:"Major Media Feature",               t:"good",p:.08,bfx: 0,  mfx: 4, pfx: 8,  sfx:0, d:"FT and Euractiv feature your cluster as a model for EU industrial policy."},
  {id:"grn",  n:"Green Deal Funding Unlocked",       t:"good",p:.07,bfx:50000,mfx: 0, pfx: 7,  sfx:0, d:"Your cluster qualifies for European Green Deal implementation funding."},
  {id:"key",  n:"Keynote at EU Conference",          t:"good",p:.06,bfx: 7000,mfx: 0, pfx:12,  sfx:0, d:"Your Director keynoted the European Cluster Conference. Profile raised."},
  {id:"brd",  n:"Board Approves Strategic Plan",     t:"good",p:.05,bfx:15000,mfx: 0, pfx:10,  sfx:0, d:"Board unanimously endorses a bold 3-year transformation plan."},
  /* ── expanded pool: EU-grounded, stage-gated (minS/maxS), state-conditional (req), tokenised ── */
  {id:"chip", n:"Supply Chain Disruption",        t:"bad", p:.06,bfx:-.08, mfx:-3, pfx:-2, sfx:0, d:"A critical components shortage halts member production lines for the quarter."},
  {id:"skill",n:"Skilled Labour Shortage",        t:"bad", p:.06,bfx:0,    mfx:-4, pfx:-3, sfx:0, minS:1, d:"Members cannot fill technical vacancies; two scale back operations."},
  {id:"gdpr", n:"Member Hit by GDPR Fine",        t:"bad", p:.05,bfx:-12000,mfx:0, pfx:-6, sfx:0, d:"A member's data breach makes headlines; association by name costs you."},
  {id:"staid",n:"State Aid Investigation",        t:"bad", p:.04,bfx:-.10, mfx:0,  pfx:-5, sfx:0, minS:2, d:"DG COMP opens a state aid inquiry into a regional grant you brokered."},
  {id:"elect",n:"Regional Elections Reshuffle",   t:"bad", p:.06,bfx:-.06, mfx:0,  pfx:-4, sfx:0, maxS:3, d:"A new regional council questions every line of cluster spending in {REGION}."},
  {id:"call", n:"Horizon Call Postponed",         t:"bad", p:.06,bfx:-.04, mfx:0,  pfx:-2, sfx:0, minS:2, d:"The work programme slips six months; planned consortium work stalls."},
  {id:"aud2", n:"ERDF Second-Level Audit",        t:"bad", p:.04,bfx:-.12, mfx:0,  pfx:0,  sfx:0, minS:1, d:"Auditors flag ineligible costs from a closed project; the clawback hits now."},
  {id:"press",n:"Critical Investigative Piece",   t:"bad", p:.05,bfx:0,    mfx:-2, pfx:-7, sfx:0, d:"A journalist asks what clusters actually deliver. Your name appears twice."},
  {id:"vat",  n:"Unexpected VAT Ruling",          t:"bad", p:.04,bfx:-18000,mfx:0, pfx:0,  sfx:0, minS:1, d:"The tax authority reclassifies membership fees; a back payment is due."},
  {id:"defect",n:"Founding Member Defects",       t:"bad", p:.04,bfx:0,    mfx:-5, pfx:-5, sfx:0, minS:1, d:"A founding member joins {RIVAL}, taking two suppliers along."},
  {id:"s3rev",n:"Smart Specialisation Mid-term Review",             t:"bad", p:.07,bfx:-.05, mfx:0,  pfx:-6, sfx:0, req:"misaligned", d:"The managing authority asks why your {SECTOR} focus sits outside the priorities of {REGION}."},
  {id:"board2",n:"Emergency Board Session",       t:"bad", p:.08,bfx:-10000,mfx:0, pfx:-3, sfx:0, req:"lowBoard", d:"Directors demand a turnaround plan and an external consultant within two quarters."},
  {id:"idle2",n:"Members Question Value",         t:"bad", p:.08,bfx:0,    mfx:-3, pfx:-4, sfx:0, req:"idle", d:"No live projects this quarter; renewal letters go unanswered."},
  {id:"sprawl",n:"Coordination Overhead",         t:"bad", p:.06,bfx:-.06, mfx:0,  pfx:0,  sfx:0, req:"multiCountry", d:"Cross-border coordination costs balloon across your international offices."},
  {id:"burn", n:"Team Burnout",                   t:"bad", p:.05,bfx:0,    mfx:0,  pfx:-2, sfx:-1, req:"manyProjects", d:"Overload claims a team member; HR flags chronic overtime across the portfolio."},
  {id:"ipcei",n:"IPCEI Invitation",               t:"good",p:.05,bfx:45000, mfx:0, pfx:9,  sfx:0, minS:2, d:"Your members join an Important Project of Common European Interest pre-consortium."},
  {id:"een",  n:"EEN Partnership Formalised",     t:"good",p:.06,bfx:0,     mfx:3, pfx:5,  sfx:0, d:"Enterprise Europe Network signs a cooperation agreement with your cluster."},
  {id:"alum", n:"Alumni Start-up Exit",           t:"good",p:.05,bfx:25000, mfx:0, pfx:6,  sfx:0, d:"A spin-off from your incubation programme is acquired; the founder credits the cluster."},
  {id:"fdi",  n:"Foreign Investor Lands",         t:"good",p:.05,bfx:20000, mfx:4, pfx:4,  sfx:0, minS:1, d:"An overseas investor opens a {SECTOR} facility in {REGION}, citing your ecosystem."},
  {id:"cosme",n:"SME Voucher Scheme Approved",    t:"good",p:.06,bfx:30000, mfx:0, pfx:0,  sfx:0, maxS:3, d:"Your innovation voucher application clears; members queue for services."},
  {id:"jrc",  n:"Joint Research Centre Study Features You",         t:"good",p:.05,bfx:0,     mfx:0, pfx:8,  sfx:0, d:"A Joint Research Centre report cites your cluster as a Smart Specialisation implementation example."},
  {id:"award",n:"European Cluster Awards Shortlist",t:"good",p:.04,bfx:0,   mfx:2, pfx:10, sfx:0, minS:1, d:"Shortlisted at the European Cluster Conference; the jury visit goes well."},
  {id:"erasm",n:"Erasmus+ Skills Alliance",       t:"good",p:.05,bfx:38000, mfx:2, pfx:0,  sfx:0, minS:1, d:"A sector skills alliance is funded with your cluster as the training hub."},
  {id:"reshor",n:"Reshoring Wave",                t:"good",p:.04,bfx:0,     mfx:6, pfx:4,  sfx:0, minS:2, d:"Nearshoring brings {SECTOR} production back to {COUNTRY}; new members arrive."},
  {id:"exodus",n:"Departure at {RIVAL}",          t:"good",p:.04,bfx:0,     mfx:0, pfx:3,  sfx:0, minS:1, d:"A senior figure leaves {RIVAL} and publicly praises your governance model."},
  /* ── decision events: two options, real trade-offs ── */
  {id:"jointbid",n:"Joint Bid Proposal",          t:"choice",p:.06, minS:2, d:"{RIVAL} offers to co-lead a Horizon consortium with you. Money now, but you would be feeding their momentum.",
    choices:[{label:"Accept the partnership", fx:{bfx:60000,pfx:4,brd:3,rvProg:8}},{label:"Decline and go alone", fx:{pfx:-2,brd:-2}}]},
  {id:"poachst",n:"Recruiter Targets Your Team",  t:"choice",p:.06, minS:1, d:"{RIVAL} makes an offer to one of your senior staff.",
    choices:[{label:"Counter-offer (€15k)", fx:{bfx:-15000,brd:2}},{label:"Let them go", fx:{sfx:-1,pfx:-3,brd:-3}}]},
  {id:"anchor2",n:"Anchor Demands a Board Seat",  t:"choice",p:.05, minS:1, d:"Your largest member wants a permanent board seat and a fee discount.",
    choices:[{label:"Grant it", fx:{bfx:-20000,brd:6,mfx:2}},{label:"Refuse", fx:{mfx:-4,pfx:2,brd:-4}}]},
  {id:"tvdeb",n:"TV Debate Invitation",           t:"choice",p:.05, d:"A national broadcaster wants you opposite a cluster-sceptic economist.",
    choices:[{label:"Take the stage (prep €8k)", fx:{bfx:-8000,pfx:9,brd:2}},{label:"Send a written statement", fx:{pfx:1}}]},
  {id:"fees",n:"Fee Restructure Window",          t:"choice",p:.05, minS:1, d:"The AGM opens the floor on membership fees.",
    choices:[{label:"Raise fees 10%", fx:{bfx:15000,mfx:-3,brd:2}},{label:"Hold fees steady", fx:{mfx:1}}]},
  {id:"consort",n:"Struggling Consortium Partner",t:"choice",p:.05, minS:2, d:"A partner in one of your projects is close to insolvency.",
    choices:[{label:"Bail them out (€40k)", fx:{bfx:-40000,pfx:3,brd:2}},{label:"Replace them", fx:{pfx:-4,brd:-3}}]},
  {id:"cabinet",n:"Closed-door Policy Briefing",  t:"choice",p:.05, minS:3, d:"A Commission cabinet offers an off-record slot before the work programme is drafted.",
    choices:[{label:"Send your lobbyist", fx:{pfx:6,brd:2}},{label:"Decline on transparency grounds", fx:{pfx:2,mfx:1}}]},
  {id:"rstumble",n:"{RIVAL} Stumbles",            t:"choice",p:.05, minS:2, d:"An audit scandal hits {RIVAL}. Their members are looking around.",
    choices:[{label:"Poach openly", fx:{mfx:6,pfx:-2,brd:1,rvProg:-6}},{label:"Stay above it", fx:{pfx:4}}]},
  /* Effect conventions: bfx below 1 is a share of the treasury and 1 or more is
     euros; mfx members; pfx influence (0-100); brd board confidence; sfx -1 costs
     a staff member. Gates: minS/maxS stage window, req predicate, eco ecosystem. */

  // ── EU policy cycle ──
  {id:"midterm", n:"Cohesion Mid-Term Review",        t:"choice",p:.05, minS:2, d:"The managing authority reopens the {COUNTRY} programme. Reallocating means new money, but a rewritten smart-specialisation strategy may leave {SECTOR} outside the priority list.",
    choices:[{label:"Lobby to keep the current priorities", fx:{bfx:-30000,pfx:5,brd:3}},{label:"Bid for the new thematic envelope", fx:{bfx:180000,pfx:-2,brd:-2}}]},
  {id:"cbam",    n:"Carbon Border Adjustment Kicks In", t:"bad", p:.05, minS:2, eco:["energy_intensive_i","construction","electronics"], bfx:-.06, mfx:-4, pfx:0, d:"CBAM reporting duties land on your members' supply chains. Compliance costs bite before the free-allowance phase-out is even complete."},
  {id:"nzia",    n:"Net-Zero Industry Act Windfall",   t:"good",p:.05, minS:2, eco:["energy_renewables","energy_intensive_i","electronics"], bfx:140000, mfx:7, pfx:6, d:"Your {SECTOR} members qualify as a strategic net-zero technology. Permitting is fast-tracked and a national allocation follows."},
  {id:"aiconf",  n:"AI Act Conformity Scramble",        t:"choice",p:.05, minS:1, eco:["digital","electronics","health"], d:"High-risk classification lands on several member products. They want the cluster to run conformity support.",
    choices:[{label:"Set up a shared compliance desk (€45k)", fx:{bfx:-45000,mfx:6,pfx:5,brd:4}},{label:"Point them to national authorities", fx:{mfx:-5,brd:-3}}]},
  {id:"stateaid",n:"State Aid Investigation",          t:"bad", p:.04, minS:3, req:"flush", bfx:-.09, mfx:0, pfx:-5, d:"DG COMP queries whether your member support scheme constitutes selective advantage. Legal fees mount and disbursements freeze."},
  {id:"jtf",     n:"Just Transition Fund Allocation",  t:"good",p:.05, minS:1, eco:["energy_intensive_i","energy_renewables","construction"], bfx:110000, mfx:5, pfx:4, d:"Your region qualifies for Just Transition support. Reskilling money arrives with reporting duties attached."},
  {id:"interreg",n:"Interreg Partner Search",          t:"choice",p:.06, minS:1, d:"A cross-border programme wants a {SECTOR} partner. Modest money, real visibility, and a great deal of coordination.",
    choices:[{label:"Join the consortium", fx:{bfx:55000,pfx:6,brd:2,mfx:3}},{label:"Stay focused at home", fx:{pfx:-1,brd:1}}]},
  {id:"eukic",   n:"EIT Innovation Community Call",    t:"choice",p:.05, minS:2, req:"researchHeavy", d:"An EIT Knowledge and Innovation Community invites your research members into a co-location centre. Prestigious, and expensive to co-finance.",
    choices:[{label:"Commit the co-financing (€90k)", fx:{bfx:-90000,pfx:11,mfx:8,brd:5}},{label:"Send observers only", fx:{pfx:1}}]},
  {id:"omnibus", n:"Simplification Omnibus",           t:"good",p:.05, minS:2, req:"highBoard", bfx:.04, pfx:3, mfx:2, d:"A reporting-burden reduction package lands. Fewer templates, faster payment claims, and members notice the difference."},
  {id:"audittr", n:"Managing Authority Spot Check",    t:"bad", p:.05, minS:1, req:"manyProjects", bfx:-.05, pfx:-2, d:"An on-the-spot verification arrives mid-delivery. Timesheets and procurement files consume a fortnight of staff time."},

  // ── membership and governance ──
  {id:"anchoutx",n:"Anchor Firm Relocates",            t:"bad", p:.05, minS:2, req:"corpHeavy", bfx:-.07, mfx:-11, pfx:-4, d:"Your largest corporate member shifts production out of {REGION}. Fee income and credibility go with it."},
  {id:"smerev",  n:"SME Fee Revolt",                   t:"choice",p:.05, minS:2, req:"smeHeavy", d:"Small members argue the fee schedule favours large firms and threaten a collective exit.",
    choices:[{label:"Introduce a tiered fee (costly but fair)", fx:{bfx:-.05,mfx:5,brd:5}},{label:"Hold the line on pricing", fx:{mfx:-9,brd:-5,pfx:1}}]},
  {id:"univspin",n:"University Spin-Out Wave",         t:"good",p:.06, minS:1, req:"researchHeavy", mfx:9, pfx:4, bfx:0, d:"A partner faculty spins out several ventures and all of them join the cluster on research-rate membership."},
  {id:"govchg",  n:"Regional Government Changes Hands",t:"choice",p:.05, minS:1, req:"aligned", d:"A new coalition takes office in {REGION} with different industrial priorities. Your standing invitation to the S3 working group is suddenly informal.",
    choices:[{label:"Court the new administration hard", fx:{bfx:-25000,pfx:7,brd:2}},{label:"Keep your head down and deliver", fx:{pfx:-4,brd:3,bfx:15000}}]},
  {id:"boardsplit",n:"Board Splits Over Strategy",     t:"choice",p:.05, minS:2, req:"lowBoard", d:"Half the board wants consolidation, half wants expansion. Someone will be unhappy.",
    choices:[{label:"Consolidate: pause expansion, fix delivery", fx:{brd:9,pfx:-3,bfx:40000}},{label:"Expand: press on regardless", fx:{brd:-6,pfx:5,mfx:4}}]},
  {id:"succplan",n:"Succession Planning Pressure",     t:"choice",p:.04, minS:3, req:"bigTeam", d:"The board wants a documented succession plan for your senior team. It is sensible, and it is a quarter of somebody's life.",
    choices:[{label:"Do it properly", fx:{bfx:-20000,brd:7}},{label:"Promise it for next year", fx:{brd:-4}}]},

  // ── ecosystem-specific news ──
  {id:"gigafab", n:"Battery Gigafactory Announcement", t:"good",p:.05, minS:2, eco:["mobility_transport","energy_renewables","electronics"], bfx:120000, mfx:12, pfx:7, d:"A gigafactory picks a site within your footprint. Suppliers rush to join anything that looks like a local cluster."},
  {id:"chipact", n:"Chips Act Pilot Line",             t:"good",p:.05, minS:3, eco:["electronics","digital"], bfx:260000, mfx:9, pfx:8, d:"A Chips Act pilot line lands in your network. Your members gain access to fabrication capacity they could never finance alone."},
  {id:"farm2f",  n:"Farm to Fork Reformulation Push",  t:"choice",p:.05, minS:1, eco:["agri_food"], d:"Reformulation targets arrive. Members can lead the transition or resist it.",
    choices:[{label:"Run a joint reformulation programme", fx:{bfx:-35000,mfx:7,pfx:6,brd:3}},{label:"Lobby for a longer transition", fx:{pfx:-3,brd:2,bfx:20000}}]},
  {id:"textrec", n:"Textile Recycling Mandate",        t:"bad", p:.05, minS:1, eco:["textiles"], bfx:-.05, mfx:-3, pfx:2, d:"Separate collection duties arrive before the sorting infrastructure does. Members absorb the cost and the confusion."},
  {id:"overtour",n:"Overtourism Backlash",             t:"bad", p:.05, minS:1, eco:["tourism"], mfx:-6, pfx:-3, bfx:-.03, d:"Residents in {REGION} campaign against visitor pressure. Several members quietly distance themselves from growth messaging."},
  {id:"edfbid",  n:"European Defence Fund Consortium", t:"choice",p:.04, minS:3, eco:["aerospace_and_defe","electronics"], d:"An EDF call needs a cluster to assemble the supply chain. The money is substantial and the paperwork is formidable.",
    choices:[{label:"Lead the consortium", fx:{bfx:220000,pfx:9,brd:3,sfx:0}},{label:"Participate as a partner", fx:{bfx:70000,pfx:3}}]},
  {id:"careint", n:"Care Sector Integration Pilot",    t:"good",p:.05, minS:1, eco:["health","proximity_and_soci"], bfx:80000, mfx:8, pfx:5, d:"A regional health authority contracts your members for an integrated-care pilot. Social innovation with an invoice attached."},
  {id:"herit",   n:"Cultural Heritage Fund Award",     t:"good",p:.05, minS:1, eco:["creative_and_cultu","tourism"], bfx:70000, mfx:5, pfx:6, d:"A heritage-led regeneration award names your cluster as delivery partner. Visibility far beyond the sector follows."},

  {id:"bridge",  n:"Bridge Financing Offer",            t:"choice",p:.06, minS:1, req:"thin", d:"With the treasury nearly empty, a regional development bank offers bridge financing against future claims. It costs, and it buys time.",
    choices:[{label:"Take the bridge loan", fx:{bfx:120000,pfx:-2,brd:2}},{label:"Cut costs and ride it out", fx:{sfx:-1,brd:-3,pfx:1}}]},

  // ── late game and rivalry ──
  {id:"monopoly",n:"Competition Concerns Raised",      t:"bad", p:.05, minS:4, req:"lastRival", pfx:-6, brd:-4, bfx:-.04, d:"With the field nearly cleared, a national authority asks whether one cluster should represent an entire ecosystem. Scrutiny is not the same as praise."},
  {id:"poachwar",n:"Talent War Escalates",             t:"bad", p:.06, minS:2, req:"crowded", sfx:-1, bfx:-.03, pfx:-2, d:"Four clusters chasing the same specialists in {COUNTRY}. Someone leaves for a competitor's offer you could not match."},
  {id:"seatlev", n:"Seat Brings Leverage",             t:"good",p:.06, minS:2, req:"hasSeat", pfx:5, bfx:.05, brd:5, d:"Your committee seat pays off: a programme amendment lands in your members' favour before the call text is even published."},
  {id:"outsider",n:"Shut Out of the Room",             t:"bad", p:.06, minS:2, req:"noSeat", pfx:-4, brd:-3, d:"The call text is written without you. Two eligibility criteria fit a rival's membership almost exactly."},
  {id:"kingmkr", n:"Kingmaker in the Consultation",    t:"good",p:.05, minS:4, req:"allSeats", pfx:4, bfx:.07, brd:6, d:"Holding all three chairs, your response to the consultation is treated as the sector position. Members notice who opens doors."},
  {id:"borderfx",n:"Cross-Border Cluster Bonus",       t:"good",p:.05, minS:2, req:"fullCoverage", bfx:.06, mfx:6, pfx:4, d:"Complete national coverage makes you the obvious counterpart for a neighbouring country's cluster programme."},

];

/* ── event selection: stage gates, state conditions, tokens, no repeat ── */
const EVENT_REQ = {
  misaligned:   s => !s.s3Aligned,
  lowBoard:     s => (s.boardConf||0) < 40,
  idle:         s => (s.activeProjects||[]).length === 0,
  manyProjects: s => (s.activeProjects||[]).length >= 3,
  multiCountry: s => (s.countries||[]).length >= 4,
  // added gates: let events respond to the shape of the cluster, not just its stage
  highBoard:    s => (s.boardConf||0) >= 75,
  flush:        s => (s.budget||0) > 1500000,
  thin:         s => (s.budget||0) < 120000,
  bigTeam:      s => staffTotal(s.roster) >= 12,
  hasSeat:      s => seatsHeld(s) >= 1,
  noSeat:       s => seatsHeld(s) === 0,
  allSeats:     s => seatsHeld(s) === 3,
  researchHeavy:s => resShare(s) > 0.18,
  corpHeavy:    s => corpShare(s) > 0.30,
  smeHeavy:     s => mixOf(s).sme / Math.max(1, s.members||1) > 0.78,
  fullCoverage: s => (s.fullCountries||[]).length >= 1,
  crowded:      s => (s.rivals||[]).length >= 3, // a full field — the engine caps rivals at 3
  lastRival:    s => (s.rivals||[]).length === 1,
  aligned:      s => !!s.s3Aligned,
};
function fillTokens(text, s) {
  return String(text)
    .replaceAll("{SECTOR}",  s.sector?.name || "your sector")
    .replaceAll("{REGION}",  s.region || "your region")
    .replaceAll("{COUNTRY}", s.country || "your country")
    .replaceAll("{RIVAL}",   s.rivals?.[0]?.name || "a rival cluster");
}
// Rival storylines: targeted decision events built from the live rival roster
function pickRivalEvent(s) {
  const cands = [];
  const shared = rv => sharedCountries(s, rv);
  for (const rv of (s.rivals||[])) {
    const overlap = rv.sectorId === s.sector?.id || shared(rv).length > 0;
    // 1. Headhunt: they come for your senior people
    const seniors = (s.roster||[]).map((r,i)=>({r,i})).filter(x => ["manager","pm"].includes(x.r?.role) && ((s.turn||0)-(x.r?.hiredTurn||0)) >= 6);
    if (rv.stage >= 2 && overlap && seniors.length) {
      const tgt = seniors[Math.floor(Math.random()*seniors.length)];
      const roleName = STAFF_ROLES.find(d=>d.id===tgt.r.role)?.name || tgt.r.role;
      const keep = Math.round(roleCost(STAFF_ROLES.find(d=>d.id===tgt.r.role), s.turn) * 2.5);
      cands.push({ id:"rv_hh", t:"bad", n:`${rv.name} Headhunts Your ${roleName}`,
        d:`${rv.name} has made your ${roleName} a generous offer. Match it with a retention package, or watch them walk across the street.`,
        choices:[
          { label:`Match the offer (${fmt(-keep)})`, fx:{ bfx:-keep } },
          { label:`Let them go`, fx:{ loseRole: tgt.r.role, rvHealth:{ rid:rv.id, d:+5 } } },
        ]});
    }
    // 2. Fee war: discounters undercut you where you overlap
    if (((archOf(rv).id === "discounter" && shared(rv).length >= 1) || shared(rv).length >= 2) && rv.stage >= 1) {
      const holdLoss = Math.max(2, Math.ceil((s.members||0)*0.06));
      const matchCost = Math.round(Math.max(20000, (s.qMember||0)*0.6));
      cands.push({ id:"rv_fee", t:"bad", n:`${rv.name} Undercuts Your Fees`,
        d:`${rv.name} slashed membership fees in ${shared(rv)[0]||"your shared markets"}. Members are comparing invoices.`,
        choices:[
          { label:`Match their fees (${fmt(-matchCost)})`, fx:{ bfx:-matchCost } },
          { label:`Hold firm (−${holdLoss} members)`, fx:{ mfx:-holdLoss } },
        ]});
    }
    // Staff storyline: a top performer demands a raise
    const stars = (s.roster||[]).map((r,i)=>({r,i})).filter(x => skillOf(x.r) >= 4 && !STAFF_ROLES.find(d=>d.id===x.r?.role)?.hidden);
    if (stars.length && Math.random() < 0.5) {
      const st = stars[Math.floor(Math.random()*stars.length)];
      const roleName = STAFF_ROLES.find(d=>d.id===st.r.role)?.name || st.r.role;
      const cost2 = Math.round(roleCost(STAFF_ROLES.find(d=>d.id===st.r.role), s.turn) * 3);
      cands.push({ id:"st_raise", t:"bad", n:`${st.r.name || "Your top " + roleName} Demands a Raise`,
        d:`Your level-${skillOf(st.r)} ${roleName} has an outside offer on the table and wants recognition.`,
        choices:[
          { label:`Pay the retention bonus (${fmt(-cost2)})`, fx:{ bfx:-cost2, pfx:1 } },
          { label:`Refuse`, fx:{ loseRole: st.r.role } },
        ]});
    }
    // 3. Scandal: their audit failure is your recruitment drive
    if (rv.stage >= 1 && Math.random() < 0.5) {
      cands.push({ id:"rv_scandal", t:"good", n:`${rv.name} Fails an Audit`,
        d:`Auditors flagged serious irregularities at ${rv.name}. Their members are quietly shopping for a new home.`,
        stealPct:{ rid:rv.id, pct:0.08 }, rvHealth:{ rid:rv.id, d:-12 }, pfx:3, bfx:0, mfx:0, sfx:0 });
    }
  }
  return cands.length ? cands[Math.floor(Math.random()*cands.length)] : null;
}

function pickEvent(s) {
  const pool = EVENTS.filter(ev =>
    (ev.minS ?? 0) <= s.stage && s.stage <= (ev.maxS ?? 5) &&
    (!ev.req || (EVENT_REQ[ev.req] && EVENT_REQ[ev.req](s))) &&
    // `eco` restricts an event to one or more industrial ecosystems, so a
    // textiles cluster doesn't get battery-gigafactory news
    (!ev.eco || (Array.isArray(ev.eco) ? ev.eco : [ev.eco]).includes(s.sector?.id)) &&
    ev.id !== s.lastEventId
  );
  if (!pool.length) return null;
  const total = pool.reduce((a,e) => a + (e.p||0), 0);
  let roll = Math.random() * total;
  let chosen = pool[pool.length-1];
  for (const ev of pool) { roll -= ev.p||0; if (roll <= 0) { chosen = ev; break; } }
  return { ...chosen, n: fillTokens(chosen.n, s), d: fillTokens(chosen.d, s) };
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const LOCALE = (typeof navigator !== "undefined" && navigator.language) || "en-GB";
const grp = x => { try { return x.toLocaleString(LOCALE); } catch(e) { return "" + x; } };
const fmt  = n => { if(typeof n!=="number"||isNaN(n)) return "€0"; const a=Math.abs(n); const s=a>=1e6?`€${(a/1e6).toFixed(2)}M`:a>=1000?`€${grp(Math.round(a/1000))}k`:`€${grp(Math.round(a))}`; return n<0?`-${s}`:s; };
const fmtN = n => { if(typeof n!=="number"||isNaN(n)) return "0"; const a=Math.abs(n); const s=a>=1e6?(a/1e6).toFixed(1)+"M":a>=1000?(a/1000).toFixed(0)+"k":""+Math.round(a); return (n<0?"-":"")+s; };

const byRole     = (roster, id) => Array.isArray(roster) ? roster.filter(r => r && r.role===id).length : 0;
const staffTotal = roster => Array.isArray(roster) ? roster.length : 0;
// Salary inflation: labour costs rise ~1% every quarter (≈4%/year), for new hires and the whole payroll
const salaryInfl = turn => 1 + 0.01 * Math.max(0, turn||0);
const roleCost   = (def, turn) => Math.round((def?.cost||0) * salaryInfl(turn));
const staffCostQ = (roster, turn) => Array.isArray(roster) ? roster.reduce((s,r) => {
  if (!r || !r.role) return s;
  const d = STAFF_ROLES.find(x => x.id===r.role);
  return s + (d ? roleCost(d, turn) : 0);
}, 0) : 0;

// Parenthesised so the Finance Director discount applies to the whole overhead.
const memberFee  = stage => ([500,1500,3000,5500,9000,16000][stage] ?? 500);
// Members pay more as the cluster matures, but they also expect more for it:
// account management, events, brokerage, reporting. Servicing takes a rising
// share of the fee, so a bigger cluster is richer without being effortless.
const SERVICING_SHARE = [0.20, 0.30, 0.42, 0.55, 0.65, 0.74];
const servicingCost = (members, stage) =>
  Math.round((members||0) * memberFee(stage) * (SERVICING_SHARE[stage] ?? 0.2));
// Costs drift upward over a long campaign, at the same 1% a quarter that
// salaries already carry, so a late treasury does not go as far as an early one.
const costIndex = turn => Math.pow(1.01, Math.max(0, turn||0));
const calcOverhead = (stage, hasFin, regionCount=1, turn=0) => {
  const base  = [2000,9000,30000,90000,280000,800000][stage] ?? 2000;
  const coord = 1 + 0.04 * Math.max(0, (regionCount||1) - 1); // every extra regional office adds 4% coordination overhead
  return Math.round(base * coord * costIndex(turn) * (hasFin ? 0.80 : 1));
};
const evolveCost = stage => ([20000,100000,400000,1500000,6000000,0][stage] ?? 0);
// Co-financing and delivery costs: the cluster retains only a share of each budget
// Project economics: the cluster FINANCES delivery out of its own treasury (equal quarterly
// instalments over the project's duration) and, on success, is reimbursed its costs plus a
// margin. Failed projects recover only part of the audited costs. Projects are investments.
const projBudget  = (p, partners) => Math.round((p.base||0) + (partners||0) * (p.pb||0)); // total delivery cost ("volume")
const FUND_MARGIN = { local: 0.15, regional: 0.20, national: 0.25, eu: 0.32 };            // cost-plus margin by funder
const SEAT_MARGIN = { regional:["regional",0.03], national:["national",0.04], eu:["eu",0.05] };
const projMargin  = (p, gs) => {
  let m = (FUND_MARGIN[p.fund] ?? 0.15) + (p.cofin||0) * 0.25; // demanding calls pay slightly better
  if (gs) {
    for (const [seat,[fund,bonus]] of Object.entries(SEAT_MARGIN))
      if ((gs.seats||{})[seat] && p.fund === fund) m += bonus; // political seats improve terms with "their" funder
    const truces = (gs.rivals||[]).filter(rv => (rv.truce||0) > (gs.turn||0)).length;
    m += Math.min(0.04, truces * 0.02); // consortium pacts open doors
    if (p.cat === "research" && resShare(gs) >= 0.20) m += 0.02; // research institutes strengthen research bids
    if (p.fund === "regional" || p.fund === "national") m += 0.03 * cohesionShare(gs); // cohesion-fund intensity
    m *= diffOf(gs).margin;
  }
  return m;
};
const projSpendQ  = (p, partners) => Math.ceil(projBudget(p, partners) / Math.max(1, p.dur||1)); // delivery cost per quarter
const INTERIM_RATE  = 0.70; // pre-financing & interim payments reimburse 70% of costs as you deliver
const FAIL_RECOVERY = 0.60; // audited total cost recovery on failure (interim above this is clawed back)
// Own net exposure ≈ 30% of each instalment; liquidity for two instalments' exposure is required at launch
const projNeed    = (p, partners) => Math.round(projSpendQ(p, partners) * (1 - INTERIM_RATE) * 2);
// Each project category needs at least one matching specialist on staff
const CAT_ROLE = { research:"analyst", comms:"comms", training:"trainer", lobbying:"lobbyist", network:"manager" };

// Difficulty tiers: "Expert" is the original calibration; Junior and Officer soften it.
const DIFFICULTIES = {
  junior:  { id:"junior",  label:"Junior",  fail:0.60, margin:1.42, seed:1.50, rival:0.75, pressure:0.55, desc:"Learn the ropes: fewer failures, richer margins, more seed capital, gentler rivals." },
  officer: { id:"officer", label:"Officer", fail:0.86, margin:1.16, seed:1.25, rival:0.90, pressure:0.82, desc:"A fair fight with a modest safety net. Recommended first campaign." },
  expert:  { id:"expert",  label:"Expert",  fail:1.05, margin:0.97, seed:1.00, rival:1.05, pressure:1.05, desc:"No safety net: rivals at full strength, delivery risk is real, and nobody is waiting for you." },
};
const diffOf = gs => DIFFICULTIES[gs?.difficulty] || DIFFICULTIES.expert;

/* ── POLITICAL INTEGRATION ─────────────────────────────────────
   Influence (formerly "prestige") is your political standing with public
   authorities: earned through delivered projects, communications and policy
   staff; it fades every quarter without visibility work. Sustained influence
   converts into formal SEATS in cluster policy bodies — permanent positions
   that give structural competitive advantages. */
const SEATS = [
  { id:"regional", short:"REG", infl:35, label:"Regional S3 Committee",
    effects:"regional-call margins +3pp · region expansion −25% · board +1/Q · influence +1/Q",
    reqs: gs => [
      {l:"Stage 1+",              ok:(gs.stage||0) >= 1},
      {l:"influence 35+",         ok:(gs.prestige||0) >= 35},
      {l:"6 projects delivered",  ok:(gs.completedProjects||[]).length >= 6},
      {l:"Communications Director", ok:byRole(gs.roster,"comms") >= 1},
    ]},
  { id:"national", short:"NAT", infl:60, label:"National Cluster Platform",
    effects:"national-call margins +4pp · country expansion −20% · rival poaching −50% · influence +1/Q",
    reqs: gs => [
      {l:"Stage 2+",              ok:(gs.stage||0) >= 2},
      {l:"influence 60+",         ok:(gs.prestige||0) >= 60},
      {l:"Policy Lobbyist",       ok:byRole(gs.roster,"lobbyist") >= 1},
      {l:"full coverage of a country", ok:(gs.fullCountries||[]).length >= 1},
    ]},
  { id:"eu", short:"EU", infl:80, label:"EU High-Level Group",
    effects:"EU-call margins +5pp · rivals 15% slower · failure risk −3pp · influence +1/Q",
    reqs: gs => [
      {l:"Stage 3+",              ok:(gs.stage||0) >= 3},
      {l:"influence 80+",         ok:(gs.prestige||0) >= 80},
      {l:"2 Policy Lobbyists",    ok:byRole(gs.roster,"lobbyist") >= 2},
      {l:"EU-funded project delivered", ok:(gs.completedProjects||[]).some(p=>p.fund==="eu")},
    ]},
];
const seatStatus = gs => SEATS.map(st => {
  const heldBy = (gs?.rivalSeats||{})[st.id] || null;
  const reqs = st.reqs(gs||{});
  if (heldBy) reqs.push({ l:`influence ${(st.infl||0)+15}+ to displace the holder`, ok:(gs?.prestige||0) >= (st.infl||0)+15 });
  return {...st, held:!!(gs?.seats||{})[st.id], heldBy, holderName: heldBy ? ((gs?.rivals||[]).find(r=>r.id===heldBy)?.name || "a rival") : null, reqs};
});
const seatsHeld  = gs => SEATS.filter(st => (gs?.seats||{})[st.id]).length;

// How many countries each maturity stage can credibly operate in.
// Matches the evolution requirements exactly (3 → 9 → 19), so the caps never block progress.
const COUNTRY_CAP = [1, 1, 3, 9, 19, 27];
const countryCap  = gs => COUNTRY_CAP[Math.min(5, gs?.stage||0)] ?? 27;

/* ── STAT TRENDS ──────────────────────────────────────────────
   Deterministic per-quarter deltas for tooltips, mirroring advanceTurn's
   formulas exactly. Random components (events, project outcomes, rival
   actions) are excluded and noted as such in the UI. */
function statTrends(gs) {
  if (!gs) return null;
  const r = gs.roster||[];
  const comms=byRole(r,"comms"), train=byRole(r,"trainer"), lobby=byRole(r,"lobbyist"),
        anl=byRole(r,"analyst"), mgr=byRole(r,"manager"), hr=byRole(r,"hr"),
        dir=byRole(r,"director"), pm=byRole(r,"pm");
  const F = (l,v) => ({l, v});
  const nz = a => a.filter(x => Math.abs(x.v) >= 0.05);

  // Influence
  const decay = ([2,3,4,5,6,8][gs.stage] ?? 2) + (gs.s3Aligned ? -1 : 1);
  const infFactors = nz([
    F("Communications Directors", byRoleEff(r,"comms")*2), F("Policy Lobbyists", byRoleEff(r,"lobbyist")*3),
    F("Research Analysts", byRoleEff(r,"analyst")*4), F("General Manager", byRoleEff(r,"manager")*0.5),
    F("Executive Directors", byRoleEff(r,"director")*2), F("Project Managers", pm>0?1:0),
    F("political seats", seatsHeld(gs)),
    F(`visibility fade (stage ${gs.stage}${gs.s3Aligned?", S3-aligned":", not S3-aligned"})`, -decay),
  ]);
  const infDelta = infFactors.reduce((t,x)=>t+x.v,0);

  // Members
  const mktFree = Math.max(0.15, 1 - Math.pow(marketShare(gs), 1.6));
  const seniorBonus = r.reduce((b,x) => b + (((gs.turn||0) - (x.hiredTurn||0)) >= 12 ? 1 : 0), 0) * 0.3;
  const growthRaw = byRoleEff(r,"comms")*4 + byRoleEff(r,"trainer")*5 + byRoleEff(r,"manager")*1 + seniorBonus;
  const churnRate = Math.max(0.01, 0.06 - byRoleEff(r,"trainer")*0.008 - byRoleEff(r,"hr")*0.01 - byRoleEff(r,"manager")*0.003 + (mixOf(gs).sme/Math.max(1,gs.members||1) > 0.75 ? 0.005 : 0));
  const extraChurn = (gs.boardConf||0) < 25 ? 0.03 : (gs.boardConf||0) < 45 ? 0.01 : 0;
  const churned = Math.floor((gs.members||1) * (churnRate + extraChurn));
  const memFactors = nz([
    F("staff-driven recruitment", growthRaw),
    F(`market saturation (${Math.round(marketShare(gs)*100)}% claimed)`, -growthRaw*(1-mktFree)),
    F(`churn ${Math.round((churnRate+extraChurn)*100)}%/Q${extraChurn?" (board crisis)":""}`, -churned),
  ]);
  const memDelta = Math.floor(growthRaw*mktFree) - churned;

  // Board confidence
  const burn  = (gs.qStaff||0) + (gs.qOverhead||0) + (gs.qServicing||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
  const runway = burn > 0 ? (gs.budget||0)/burn : 99;
  const brdFactors = nz([
    F("Executive Directors", dir > 0 ? 4 + (dir-1)*2 : 0),
    F(`runway ${runway>90?"9+":runway.toFixed(1)} quarters`, runway>6?2:runway<2?-10:runway<3?-4:runway<4?-2:0),
    F(`influence ${Math.round(gs.prestige||0)}`, (gs.prestige||0)>70?2:(gs.prestige||0)<20?-4:(gs.prestige||0)<30?-2:0),
    F("Regional S3 Committee seat", (gs.seats||{}).regional?1:0),
    F("corporate anchor members (35%+)", corpShare(gs)>=0.35?1:0),
    F(`churn above 4%`, churned > (gs.members||1)*0.04 ? -3 : 0),
  ]);
  const brdDelta = brdFactors.reduce((t,x)=>t+x.v,0);

  // Budget: last quarter's actual cashflow
  const budFactors = nz([
    F("membership fees", gs.qMember||0), F("project payouts & interim", (gs.qProj||0)+(gs.qInterim||0)),
    F("salaries", -(gs.qStaff||0)), F("overheads", -(gs.qOverhead||0)),
    F("member servicing", -(gs.qServicing||0)), F("project delivery costs", -(gs.qDelivery||0)),
  ]);
  return {
    influence:{delta:infDelta, factors:infFactors},
    members:{delta:memDelta, factors:memFactors},
    board:{delta:brdDelta, factors:brdFactors},
    budget:{delta:gs.qNet||0, factors:budFactors},
  };
}
/* ── MEMBER COMPOSITION ── SMEs pay 1× fee but churn easily; corporates pay 2.2×;
   research institutes pay 0.6× but unlock better research margins. */
const MIX_FOCUS = {
  balanced:  { label:"Balanced",  sme:0.60, corp:0.25, res:0.15 },
  sme:       { label:"SME drive", sme:0.85, corp:0.10, res:0.05 },
  corporate: { label:"Corporate", sme:0.35, corp:0.50, res:0.15 },
  research:  { label:"Research",  sme:0.40, corp:0.15, res:0.45 },
};
// Membership composition is calibrated against the European Cluster Collaboration
// Platform registry: across 1,300 profiles reporting a usable split, the median
// cluster is 81.5% SME, 9.3% corporate, 9.2% research. Fee weights are scaled so
// that median mix earns a 1.0x multiplier, which keeps the economy where the
// balance tests expect it while the relative fee gap between segments is unchanged.
const FEE_W = { sme:0.90, corp:2.35, res:0.56 };
const BASE_MIX = { sme:0.815, corp:0.093, res:0.092 };

// Ecosystems recruit differently, so each starts from its own observed median.
// Mobility runs corporate-heavy (richer fees), textiles almost entirely SME.
// Ecosystems with too few profiles to be meaningful fall back to BASE_MIX.
const ECO_MIX = {
  aerospace_and_defe:{ sme:0.842, corp:0.081, res:0.078 },
  agri_food:         { sme:0.820, corp:0.097, res:0.084 },
  construction:      { sme:0.835, corp:0.094, res:0.071 },
  creative_and_cultu:{ sme:0.872, corp:0.060, res:0.068 },
  digital:           { sme:0.816, corp:0.082, res:0.102 },
  electronics:       { sme:0.674, corp:0.139, res:0.187 },
  energy_intensive_i:{ sme:0.757, corp:0.127, res:0.116 },
  energy_renewables: { sme:0.786, corp:0.149, res:0.065 },
  health:            { sme:0.806, corp:0.090, res:0.104 },
  mobility_transport:{ sme:0.730, corp:0.201, res:0.069 },
  textiles:          { sme:0.879, corp:0.048, res:0.073 },
};
const mixFor = ecoId => ECO_MIX[ecoId] || BASE_MIX;
// Split m members by a share table, giving research the exact remainder so the
// ledger always reconciles.
const splitMix = (m, sh) => {
  const sme = Math.round(m * sh.sme), corp = Math.round(m * sh.corp);
  return { sme, corp, res: Math.max(0, m - sme - corp) };
};
const defaultMix = (m, ecoId) => splitMix(m, mixFor(ecoId));
const mixOf = gs => {
  const mx = gs?.mix; const m = gs?.members||0;
  if (!mx) return defaultMix(m, gs?.sector?.id);
  const tot = (mx.sme||0)+(mx.corp||0)+(mx.res||0);
  if (tot === m) return mx;
  if (tot <= 0) return defaultMix(m, gs?.sector?.id);
  const f = m/tot; // reconcile drift proportionally; res takes the exact remainder
  let sme = Math.round((mx.sme||0)*f), corp = Math.round((mx.corp||0)*f);
  if (sme + corp > m) { const over = sme + corp - m; const dc = Math.min(corp, over); corp -= dc; sme -= (over - dc); }
  return { sme: Math.max(0,sme), corp: Math.max(0,corp), res: Math.max(0, m - Math.max(0,sme) - Math.max(0,corp)) };
};
const feeMult = gs => { const mx=mixOf(gs), m=Math.max(1,gs?.members||1);
  return (mx.sme*FEE_W.sme + mx.corp*FEE_W.corp + mx.res*FEE_W.res)/m; };
const resShare = gs => mixOf(gs).res/Math.max(1, gs?.members||1);
const corpShare = gs => mixOf(gs).corp/Math.max(1, gs?.members||1);

/* ── STAFF INDIVIDUALITY ── every hire gets a name and a skill (1–5) that grows
   with tenure; ~12% are star performers. Skill boosts soft outputs by 10%/level. */
const STAFF_FIRST = ["Anna","Marek","Sofia","Luca","Ines","Tomas","Greta","Pavel","Maren","Diego","Eszter","Nikos","Aino","Jules","Petra","Oskar","Lena","Mateo","Ruta","Bram"];
const STAFF_LAST  = ["Kova\u010d","Meier","Rossi","Novak","Dubois","Lindqvist","Papadopoulos","Silva","Horv\u00e1th","Janssens","Petrov","Keller","Virtanen","Moreau","Zieli\u0144ski","Andersen","Farkas","Costa","Ozols","Brandt"];
const staffName = () => `${STAFF_FIRST[Math.floor(Math.random()*STAFF_FIRST.length)]} ${STAFF_LAST[Math.floor(Math.random()*STAFF_LAST.length)]}`;
const skillOf = r => Math.min(5, r?.skill || 1);
const byRoleEff = (roster, id) => (roster||[]).reduce((t,r) => t + (r?.role===id ? 1 + (skillOf(r)-1)*0.08 : 0), 0);

/* ── COHESION PORTFOLIO ── emerging (cohesion-fund) regions in your network give
   richer regional/national margins but slightly riskier delivery. */
const regionRecOf = (gs, label) => {
  const bare = String(label).replace(/ \((..)\)$/, "");
  for (const c of (gs?.countries||[])) { const r = getRegion(c, bare); if (r) return r; }
  return getRegion(gs?.country, bare);
};
const cohesionShare = gs => {
  const regs = gs?.regions||[]; if (!regs.length) return 0;
  const n = regs.filter(l => /Emerging/i.test(regionRecOf(gs, l)?.ris || "")).length;
  return n/regs.length;
};

/* ── SCENARIOS ── */
const SCENARIOS = [
  { id:"classic", name:"Classic Campaign", desc:"The standard start: a young initiative, three rivals, an open map." },
  { id:"rescue",  name:"Rescue Mission",   desc:"Take over a collapsing cluster: board at 25, thin reserves, restless members — but an established base.",
    apply: gs => ({ ...gs, stage:1, boardConf:25, budget:Math.round(gs.budget*0.45), members:45, prestige:30,
      roster:[...gs.roster, {role:"comms",hiredTurn:0,name:staffName(),skill:2}, {role:"pm",hiredTurn:0,name:staffName(),skill:2}],
      completedProjects:[...Array(4)].map((_,i)=>({id:"leg"+i,fund:"local"})) }) },
  { id:"late",    name:"Late Entrant",     desc:"The race started without you: every rival is already established at Stage 2. Extra seed capital is your only edge.",
    apply: gs => ({ ...gs, budget:Math.round(gs.budget*1.5), rivals:(gs.rivals||[]).map(rv=>({ ...rv, stage:2, progress:Math.random()*40, members:rv.members+30 })) }) },
  { id:"merger",  name:"Merger Aftermath", desc:"Two clusters just became one. Plenty of members and a corporate-heavy roll, but a duplicated payroll, a sceptical board and integration nobody has actually done yet.",
    apply: gs => {
      const members = 210;
      const sme  = Math.round(members * 0.50);
      const corp = Math.round(members * 0.38);
      return { ...gs, stage:2, members, boardConf:30, prestige:44,
        budget: Math.round(gs.budget * 2.4),
        // corporate-heavy composition: strong fee income, weaker cohesion
        mix: { sme, corp, res: members - sme - corp },
        // the duplicated payroll is the whole problem: two of several roles
        roster: [...gs.roster,
          {role:"comms",  hiredTurn:0, name:staffName(), skill:3},
          {role:"comms",  hiredTurn:0, name:staffName(), skill:2},
          {role:"pm",     hiredTurn:0, name:staffName(), skill:3},
          {role:"pm",     hiredTurn:0, name:staffName(), skill:2},
          {role:"analyst",hiredTurn:0, name:staffName(), skill:2},
          {role:"trainer",hiredTurn:0, name:staffName(), skill:2},
          {role:"finance",hiredTurn:0, name:staffName(), skill:3}],
        completedProjects: [...Array(14)].map((_,i)=>({ id:"mrg"+i, fund: i%3===0 ? "regional" : "local" })),
        focus: "balanced" };
    } },
];
const scenarioOf = gs => SCENARIOS.find(x => x.id === (gs?.scenario||"classic")) || SCENARIOS[0];

/* ── ACHIEVEMENTS ── persisted across runs in the browser */
const ACHIEVEMENTS = [
  { id:"first_seat",  name:"A Seat at the Table",  desc:"Hold your first political seat",             check:gs => seatsHeld(gs) >= 1 },
  { id:"all_seats",   name:"Triple Chair",         desc:"Hold all three political seats at once",     check:gs => seatsHeld(gs) === 3 },
  { id:"eu_money",    name:"Brussels Calling",     desc:"Deliver an EU-funded project",               check:gs => (gs.completedProjects||[]).some(p=>p.fund==="eu") },
  { id:"coverage3",   name:"Wall to Wall",         desc:"Full national coverage of 3 countries",      check:gs => (gs.fullCountries||[]).length >= 3 },
  { id:"team20",      name:"Institution",          desc:"Employ a team of 20",                        check:gs => (gs.roster||[]).length >= 20 },
  { id:"lazarus",     name:"Lazarus",              desc:"Win after surviving near-bankruptcy",        check:gs => gs.gameWon && gs.wasBroke },
  { id:"pecn",        name:"Pan-European",         desc:"Build the Pan-European Cluster Network",     check:gs => gs.gameWon && gs.winType!=="consolidation" },
  { id:"consolidate", name:"Last One Standing",    desc:"Win by market consolidation",                check:gs => gs.gameWon && gs.winType==="consolidation" },
  { id:"pacifist",    name:"Clean Hands",          desc:"Win without acquiring a single rival",       check:gs => gs.gameWon && !(gs.acqCount>0) },
  { id:"expert_win",  name:"The Unforgiving",      desc:"Win on Expert difficulty",                   check:gs => gs.gameWon && gs.difficulty==="expert" },
];
function checkAchievements(gs) {
  let achv = gs.achv || {}; const won = [];
  for (const a of ACHIEVEMENTS) if (!achv[a.id] && a.check(gs)) { achv = { ...achv, [a.id]: Math.max(1, gs.turn||0) }; won.push(a); } // min 1: a turn-0 unlock must still be truthy
  return { achv, won };
}

/* ── SCORE (report card) ── */
function runScore(gs) {
  return Math.max(0, Math.round(
    (gs.stage||0)*2000 + (gs.members||0) + (gs.prestige||0)*10 + (gs.budget||0)/10000
    + (gs.rivalsGone||0)*1500 + seatsHeld(gs)*800 + (gs.gameWon ? 4000 : 0) - (gs.turn||0)*5 ));
}
const scoreGrade = s => s>=16000?"S":s>=12000?"A":s>=8000?"B":s>=5000?"C":s>=2500?"D":"E";

/* ── SEEDED RUNS ── identical campaign starts for shared challenges */
const hashSeed = str => { let h = 2166136261; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry32 = a => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const challengeCode = gs => `CM1|${gs.seedStr||""}|${gs.difficulty||"expert"}|${gs.scenario||"classic"}`;
const parseChallenge = code => { const p = String(code||"").trim().split("|"); return (p[0]==="CM1" && p.length>=4) ? { seed:p[1], difficulty:p[2], scenario:p[3] } : null; };

/* ── Sharing a run ────────────────────────────────────────────
   Three things are worth passing on: what happened, the exact starting
   conditions so someone can race the same campaign, and a link that loads
   those conditions without anyone retyping a code. ─────────────────── */
// A link that reopens the game already set to this challenge.
const challengeURL = gs => {
  const code = challengeCode(gs);
  try {
    const base = `${location.origin}${location.pathname}`;
    return `${base}?cm=${encodeURIComponent(code)}`;
  } catch (e) { return code; }
};
// A short, readable result summary for pasting into a message or a post.
const shareSummary = (gs, score, grade) => {
  const stage = STAGES[gs.stage]?.name || "Cluster Initiative";
  const name  = gs.clusterName || `${gs.sector?.name || "a"} cluster`;
  const yrs   = Math.floor((gs.turn||0)/4);
  const won   = !!gs.gameWon;
  const head  = won
    ? (gs.winType === "consolidation" ? "Consolidated the market" : "Built the Pan-European Cluster Network")
    : `Ran aground as ${stage}`;
  const lines = [
    `Cluster Manager — ${head}`,
    `${name} in ${gs.region || gs.country || "Europe"}`,
    `Grade ${grade} · ${Math.round(score).toLocaleString()} points · ${yrs} years`,
    `${(gs.members||0).toLocaleString()} members · ${(gs.countries||[]).length} countries · ${seatsHeld(gs)}/3 seats · ${(gs.completedProjects||[]).length} projects delivered`,
    `Difficulty: ${DIFFICULTIES[gs.difficulty]?.label || gs.difficulty || "Expert"}${gs.scenario && gs.scenario!=="classic" ? ` · ${(SCENARIOS.find(s=>s.id===gs.scenario)||{}).name||""}` : ""}`,
  ];
  if (gs.seedStr) lines.push(`Race the same start: ${challengeURL(gs)}`);
  return lines.join("\n");
};

/* ── Attention queue ──────────────────────────────────────────
   What still wants a decision before the quarter is closed. Each entry names
   the panel that deals with it, so the interface can take the player there.
   Urgent entries are things that will cost the cluster if ignored; the others
   are opportunities currently left on the table. ─────────────────────── */
function attentionItems(gs) {
  if (!gs || gs.gameOver || gs.gameWon) return [];
  const items = [];
  const add = (id, urgent, text, go) => items.push({ id, urgent, text, go });
  const roster = gs.roster || [];

  if (gs.pendingEvent) add("event", true, "An event needs a decision", "event");
  if (byRole(roster, "manager") < 1) add("gm", true, "Hire a General Manager to continue", "staff");

  const burn = (gs.qStaff||0) + (gs.qOverhead||0) + (gs.qServicing||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
  if ((gs.turn||0) > 0 && burn > 0 && (gs.budget||0) / burn < 3 && (gs.qNet||0) < 0)
    add("runway", true, `Cash for under ${Math.max(1, Math.ceil((gs.budget||0) / burn))} quarters`, "stats");
  if ((gs.boardConf||0) < 35) add("board", true, `Board confidence at ${Math.round(gs.boardConf||0)}%`, "stats");

  if (canEvolve(gs)) add("evolve", false, `Ready to become ${STAGES[(gs.stage||0)+1]?.name || "the next stage"}`, "evolve");

  const calls = availableProjects(gs);
  if (calls.length) {
    const running = (gs.activeProjects||[]).length;
    add("projects", running === 0, running === 0
      ? `No project running, ${calls.length} call${calls.length===1?"":"s"} open`
      : `A project slot is free`, "projects");
  }

  // Unused management capacity only counts when a hire is comfortably affordable.
  const room = staffSpan(roster) - visibleStaff(roster);
  if (room > 0 && byRole(roster, "manager") >= 1) {
    const cheapest = Math.min(...STAFF_ROLES.filter(r => !r.hidden && r.id !== "manager" && !hireBlockReason(gs, r.id)).map(r => roleCost(r, gs.turn||0)).concat([Infinity]));
    if (Number.isFinite(cheapest) && (gs.budget||0) - cheapest > staffCostQ(roster, gs.turn||0) * 3 + 40000)
      add("staff", false, `Room for ${room} more staff`, "staff");
  }

  // A region gate is the usual thing holding back the next stage.
  const needRegion = evolveReqs(gs).find(r => /region/i.test(r.l) && !r.ok);
  if (needRegion) {
    const cost = Math.round((gs.prestige||0) * 1400 + 30000);
    if ((gs.budget||0) - cost > staffCostQ(roster, gs.turn||0) * 3)
      add("region", false, `Next stage needs more regions`, "network");
  }
  return items.sort((a, b) => (b.urgent?1:0) - (a.urgent?1:0));
}

const trendTitle = (t, extra) => {
  if (!t) return "";
  const round1 = v => Math.round(v*10)/10;
  const sorted = [...(t.factors||[])].sort((a,b) => Math.abs(b.v) - Math.abs(a.v));
  const ups   = sorted.filter(f => f.v > 0);
  const downs = sorted.filter(f => f.v < 0);
  const dir = t.delta > 0 ? "rising" : t.delta < 0 ? "falling" : "flat";
  const lead = sorted.length
    ? `Mostly ${sorted[0].v >= 0 ? "because of" : "down to"} ${sorted[0].l}.`
    : "Nothing is moving this quarter.";
  const line = f => `   ${f.v>=0?"+":"\u2212"}${Math.abs(round1(f.v))}  ${f.l}`;
  const block = (title, rows) => rows.length ? `\n${title}\n${rows.map(line).join("\n")}` : "";
  return `${dir === "flat" ? "Holding steady" : `Currently ${dir}`}: ${t.delta>=0?"+":"\u2212"}${Math.abs(round1(t.delta))} per quarter\n${lead}`
    + block("Pushing it up", ups)
    + block("Pulling it down", downs)
    + (extra ? `\n\nAlso: ${extra}` : "");
};

/* ── TEAM BALANCE ──────────────────────────────────────────────
   1. Exactly one General Manager, and the cluster cannot operate without one.
   2. Span of control: the GM manages 7 staff; each Executive Director adds 7.
   3. Balanced teams: no role may exceed a third of the visible team (min 2). */
const visibleStaff = roster => (roster||[]).filter(r => !STAFF_ROLES.find(d=>d.id===r?.role)?.hidden).length;
const staffSpan    = roster => 7 + 7 * byRole(roster, "director");
const roleCap      = roster => Math.max(2, Math.ceil((visibleStaff(roster)+1) / 3));
function hireBlockReason(gs, roleId) {
  if (!gs) return null;
  if (roleId === "manager" && byRole(gs.roster,"manager") >= 1) return "the cluster already has its General Manager (max 1)";
  const vis = visibleStaff(gs.roster);
  if (!["manager","director"].includes(roleId) && vis + 1 > staffSpan(gs.roster)) return `management capacity full (${vis}/${staffSpan(gs.roster)}) — hire an Executive Director to grow further`;
  if (!["manager","director"].includes(roleId) && byRole(gs.roster, roleId) + 1 > roleCap(gs.roster)) return `team balance: max ${roleCap(gs.roster)} per role at this team size`;
  return null;
}

// Rivalry operations: costs, cooldowns and preconditions
const RIVAL_OPS = {
  raid:    { label:"Talent Raid",      icon:"users",    cd:4, cost: gs => 40000 + (gs.stage||0)*30000,  desc:"Recruit their members away. 75% success; backfires hurt your influence and board." },
  pr:      { label:"PR Campaign",      icon:"bullhorn", cd:4, cost: gs => 60000 + (gs.stage||0)*40000,  desc:"Discredit their progress (−15–25). 20% risk it backfires on your influence." },
  pact:    { label:"Joint Consortium", icon:"handshake",cd:12,cost: gs => 100000 + (gs.stage||0)*50000, desc:"A 12-quarter truce: they stop poaching you and shared bids lift your margins (+2pp)." },
  acquire: { label:"Acquire Rival",    icon:"coins",    cd:0, cost: (gs,rv) => (rv?.members||0)*2500 + ((rv?.stage||0)+1)*250000, desc:"Buy out a collapsing rival (health ≤ 25): absorb 60% of their members, +8 influence." },
  scout:   { label:"Scout",            icon:"magnifying-glass-chart", cd:3, cost: gs => 30000 + (gs.stage||0)*10000, desc:"Counter-intelligence for 4 quarters: see their exact plans and blunt their poaching by 15%." },
};
const opReady = (gs, rid, op) => ((gs?.rivalOps||{})[`${rid}:${op}`]||0) <= (gs?.turn||0);

// Failure risk rises with scale: bigger calls at higher stages, more countries to coordinate.
// Legal Counsel still helps (-8%/hire) but can no longer trivialise risk on its own.
const FAIL_BASE = [0.42,0.46,0.50,0.54,0.58,0.60];
function calcFailRate(gs) {
  if (!gs) return 0.42;
  const pm    = byRole(gs.roster,"pm");
  const leg   = byRole(gs.roster,"legal");
  const coord = 0.015 * Math.min(4, Math.max(0, (gs.countries||[]).length - 1));
  const euSeat = (gs.seats||{}).eu ? 0.03 : 0; // EU High-Level Group: regulatory foresight
  const cohesion = 0.02 * cohesionShare(gs); // emerging regions: richer calls, riskier delivery
  return Math.max(0.06, ((FAIL_BASE[gs.stage] ?? 0.42) - pm*0.12 - leg*0.08 + coord - euSeat + cohesion) * diffOf(gs).fail);
}
const failPct = gs => Math.round(calcFailRate(gs)*100);

// Region labels ("Name" at home, "Name (ISO)" abroad) + national coverage detection
const regionLabelFor  = (gs, country, name) => country===gs.country ? name : `${name} (${NAME_TO_ISO[country]||country})`;
const hasRegionActive = (gs, country, name) => (gs.regions||[]).includes(regionLabelFor(gs, country, name));
const isCountryFull   = (gs, country) => {
  const all = EU_COUNTRIES[country]||[];
  return all.length>0 && all.every(n => hasRegionActive(gs, country, n));
};
/* ── Expansion rules, shared by the map and the Network panel ───────────── */
const regionExpansionCost = gs =>
  Math.round(((gs?.prestige||0) * 1400 + 30000) * ((gs?.seats||{}).regional ? 0.75 : 1));
const countryExpansionCost = (gs, country) => {
  const base = Math.round(((gs?.prestige||0) * 7000 + 150000) * ((gs?.seats||{}).national ? 0.80 : 1));
  const contested = (gs?.rivals||[]).some(rv => (rv.countries||[]).includes(country));
  return contested ? Math.round(base * 1.5) : base;
};
// Countries you can enter next: those bordering your network, by land or ferry.
const reachableCountries = gs => {
  const out = new Set();
  (gs?.countries||[]).forEach(c => {
    const nk = (NAME_TO_ISO[c]||c)==="GR" ? "EL" : (NAME_TO_ISO[c]||c);
    (NUTS_BORDERS[nk]||[]).forEach(b => { const nm = ISO_TO_NAME[b==="EL" ? "GR" : b]; if (nm) out.add(nm); });
  });
  return out;
};
// What clicking a region on the map can do: already yours, open an office in a
// country you hold, enter a new country here, or a plain reason it is not yet possible.
function expansionOption(gs, country, regionName) {
  if (!gs || !country || !(EU_COUNTRIES[country]||[]).includes(regionName)) return { state:"none" };
  const label = regionLabelFor(gs, country, regionName);
  if ((gs.regions||[]).includes(label) || (country===gs.country && regionName===gs.region))
    return { state:"held", text:"Your office is here" };
  const budget = gs.budget||0;
  if ((gs.countries||[]).includes(country)) {
    const cost = regionExpansionCost(gs);
    return { state: budget >= cost ? "region" : "short", cost, kind:"region",
      text: budget >= cost ? "Open a regional office here" : `Needs ${fmt(cost)}; you have ${fmt(budget)}`,
      action: { type:"expandRegion", region: label, cost } };
  }
  if ((gs.stage||0) < 2) return { state:"blocked", text:`Other countries open up at ${STAGES[2].name}` };
  if ((gs.countries||[]).length >= countryCap(gs))
    return { state:"blocked", text:`Your stage allows ${countryCap(gs)} countr${countryCap(gs)===1?"y":"ies"}; evolve to hold more` };
  if (!reachableCountries(gs).has(country))
    return { state:"blocked", text:"Out of reach: hold a neighbouring country first" };
  const cost = countryExpansionCost(gs, country);
  return { state: budget >= cost ? "country" : "short", cost, kind:"country",
    text: budget >= cost ? `Enter ${country} with an office here` : `Needs ${fmt(cost)}; you have ${fmt(budget)}`,
    action: { type:"expandCountry", country, region: regionName, cost } };
}
// The playable region a NUTS-2 polygon belongs to (some countries plan at a coarser level).
function regionAt(code) {
  const country = ISO_TO_NAME[nutsToIso(String(code).slice(0,2))];
  const recs = (country && REGION_RECORDS[country]) || [];
  const rec = recs.find(r => r.nuts && nutsMatch(code, r.nuts)) || (recs.length === 1 ? recs[0] : null);
  return rec ? { code, country, name: rec.name, rec } : null;
}

const computeFullCountries = gs => (gs.countries||[]).filter(c => isCountryFull(gs, c));

// Enabling conditions: every call now has its own gates and an upfront own-contribution
function projectConditions(p, gs) {
  const list = [{l:`${p.mem} members`, ok:(gs.members||0) >= p.mem}];
  if (p.preq)  list.push({l:`influence ${p.preq}+`, ok:(gs.prestige||0) >= p.preq});
  if (p.reg)   list.push({l:`${p.reg}+ regions`, ok:(gs.regions||[]).length >= p.reg});
  if (p.ctr)   list.push({l:`${p.ctr}+ countries`, ok:(gs.countries||[]).length >= p.ctr});
  if (p.brd)   list.push({l:`board ${p.brd}+`, ok:(gs.boardConf||0) >= p.brd});
  if (p.s3)    list.push({l:"S3-aligned sector", ok:!!gs.s3Aligned});
  list.push({l:`${fmt(projNeed(p, p.part||0))} liquidity`, ok:(gs.budget||0) >= projNeed(p, p.part||0)});
  return list;
}

function evolveReqs(gs) {
  if (!gs) return [];
  const done  = (gs.completedProjects||[]).length;
  const staff = staffTotal(gs.roster);
  const mgr   = byRole(gs.roster,"manager");
  const anl   = byRole(gs.roster,"analyst");
  const fin   = byRole(gs.roster,"finance");
  const lob   = byRole(gs.roster,"lobbyist");
  const leg   = byRole(gs.roster,"legal");
  const dir   = byRole(gs.roster,"director");
  const R = (l,cur,req,money=false) => ({l, cur: cur||0, req, money, ok: (cur||0)>=req});
  switch(gs.stage) {
    case 0: return [R("Members",gs.members,20),R("Budget",gs.budget,70000,true),R("Influence",Math.round(gs.prestige),20),R("Projects done",done,4)];
    case 1: return [R("Staff",staff,5),R("Managers",mgr,1),R("Members",gs.members,80),R("Budget",gs.budget,360000,true),R("Influence",Math.round(gs.prestige),50),R("Regions",gs.regions.length,Math.min(3,(EU_COUNTRIES[gs.country]||[""]).length)),R("Projects done",done,12)];
    case 2: return [R("Staff",staff,11),R("Analysts",anl,1),R("Legal Counsel",leg,1),R("Members",gs.members,190),R("Budget",gs.budget,1300000,true),R("Influence",Math.round(gs.prestige),72),R("Regions",gs.regions.length,5),R("Countries",gs.countries.length,3),R("Projects done",done,26)];
    case 3: return [R("Staff",staff,19),R("Lobbyists",lob,2),R("Legal Counsel",leg,2),R("Finance Director",fin,1),R("Members",gs.members,360),R("Budget",gs.budget,5000000,true),R("Influence",Math.round(gs.prestige),87),R("Countries",gs.countries.length,9),R("Projects done",done,44)];
    case 4: return [R("Staff",staff,34),R("Executive Director",dir,2),R("Legal Counsel",leg,3),R("Members",gs.members,680),R("Budget",gs.budget,18000000,true),R("Influence",Math.round(gs.prestige),96),R("Countries",gs.countries.length,19),R("Projects done",done,66)];
    default: return [];
  }
}
const canEvolve = gs => gs && gs.stage < 5 && evolveReqs(gs).every(r => r.ok);

function availableProjects(gs) {
  if (!gs) return [];
  const pm   = byRole(gs.roster,"pm");
  const anl  = byRole(gs.roster,"analyst");
  const fin  = byRole(gs.roster,"finance");
  const stf  = staffTotal(gs.roster);
  const cap  = Math.min(1 + pm, 1 + (gs.stage||0));
  if ((gs.activeProjects||[]).length >= cap) return [];
  return PROJECTS.filter(p => {
    if (p.s > gs.stage) return false;
    if ((gs.members||0) < p.mem) return false;
    if ((gs.activeProjects||[]).some(a => a && a.id===p.id)) return false;
    if (((gs.projCooldown||{})[p.id]||0) > (gs.turn||0)) return false;
    if (p.sr > 0 && stf < p.sr) return false;
    const needRole = CAT_ROLE[p.cat];
    if (needRole && byRole(gs.roster, needRole) < 1) return false;
    if (p.fund==="eu" && pm < 1) return false;
    if (["hria","kic"].includes(p.id) && anl < 1) return false;
    if (["flag","eccp","kic","unify"].includes(p.id) && fin < 1) return false;
    if (projectConditions(p, gs).some(c => !c.ok)) return false;
    return true;
  });
}

// Calls at the current stage whose enabling conditions are not yet met (shown greyed out)
function lockedProjects(gs) {
  if (!gs) return [];
  const availIds = new Set(availableProjects(gs).map(p => p.id));
  return PROJECTS.filter(p => p.s <= gs.stage && !availIds.has(p.id) && projectConditions(p, gs).some(c => !c.ok));
}

/* ═══════════════════════════════════════════════════════════
   INIT STATE  ·  starting conditions scale with the region's innovation
   tier and how well its priorities fit the chosen ecosystem.
═══════════════════════════════════════════════════════════ */
function initState(country, region, sector, difficulty="expert") {
  const rec   = getRegion(country, region);
  const ris   = rec?.ris || "";
  const mod   = RIS_MODIFIER[ris] || RIS_MODIFIER[""];
  // Does the chosen sector match the region's actual S3 priorities?
  const aligned = rec ? ecosystemAligns(rec, sector?.name) : false;

  // Founding seed capital: regional development agencies typically co-fund cluster start-ups.
  // Raised for the investment economy (projects now yield only margins, not full grants).
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.expert;
  const baseBudget = Math.round(70000 * diff.seed), baseMembers = 6, basePrestige = 10; // seed capital sized so the mandatory founding GM does not sink the runway
  return {
    country, region, sector,
    regionNuts: rec?.nuts || "",
    regionRis:  ris,
    s3Aligned:  aligned,                       // drives an ongoing bonus/penalty
    stage:0, year:2024, quarter:1, turn:0,
    budget:   Math.round(baseBudget  * mod.budget),
    members:  Math.max(3, Math.round(baseMembers * mod.members)),
    prestige: Math.min(100, Math.max(0, basePrestige + mod.prestige + (aligned ? 4 : -3))),
    boardConf:65,
    roster:[{role:"manager", hiredTurn:0, name: staffName(), skill: 2}], activeProjects:[], completedProjects:[], // the founding General Manager: the cluster cannot operate without one
    regions:[region], countries:[country],
    fullCountries: (EU_COUNTRIES[country]||[]).length===1 ? [country] : [],
    difficulty: diff.id, seats: {}, rivalSeats: {}, rivalOps: {}, history: [],
    mix: defaultMix(Math.max(3, Math.round(baseMembers * mod.members)), sector?.id), focus: "balanced", peak: { budget: 0, members: 0 },
    rivalsGone: 0, acqCount: 0, achv: {}, wasBroke: false, coalitionUntil: 0, scenario: "classic", seedStr: "",
    rivals: makeRivals(country, sector), rivalDefeat: null,
    projCooldown: {},
    log:[
      {t: aligned ? "good" : "bad",
       txt: aligned
         ? `${sector?.name} is a Smart Specialisation priority in ${region} · aligned funding and influence bonus active.`
         : `${sector?.name} is not a Smart Specialisation priority in ${region} · expect harder funding and slower prestige.`},
      {t:"good", txt:`Cluster founded in ${region} (${rec?.nuts||"NUTS"}) · Regional Innovation Scoreboard tier: ${ris||"not rated"}.`},
      {t:"bad",  txt:"Three rival clusters are forming across Europe. First to form a Pan-European Cluster Network wins. Track them on the map."},
    ],
    pendingEvent:null,
    qMember:0, qProj:0, qStaff:0, qOverhead:0, qServicing:0, qDelivery:0, qInterim:0, qNet:0,
    streak:0,
    gameOver:false, gameWon:false,
  };
}

/* ═══════════════════════════════════════════════════════════
   TURN ENGINE
═══════════════════════════════════════════════════════════ */
function advanceTurn(prev) {
  if (!prev) return prev;
  const _snap = { budget:prev.budget||0, members:prev.members||0, prestige:prev.prestige||0, boardConf:prev.boardConf||0, stage:prev.stage||0, logLen:(prev.log||[]).length };
  // The General Manager runs the cluster: without one, operations halt
  if (byRole(prev.roster, "manager") < 1) {
    const msg = "Operations halted: the cluster has no General Manager. Hire one to resume.";
    if (((prev.log||[])[0]||{}).txt === msg) return prev;
    return { ...prev, log: [{t:"bad",txt:msg}, ...(prev.log||[])].slice(0,120) };
  }
  // Safe deep-copy (no circular refs in state)
  let s;
  try { s = JSON.parse(JSON.stringify(prev)); }
  catch(e) { return prev; }

  s.turn++;
  s.quarter = s.quarter===4 ? 1 : s.quarter+1;
  if (s.quarter===1) s.year++;

  const pm    = byRole(s.roster,"pm");
  const comms = byRole(s.roster,"comms");
  const train = byRole(s.roster,"trainer");
  const lobby = byRole(s.roster,"lobbyist");
  const anl   = byRole(s.roster,"analyst");
  const mgr   = byRole(s.roster,"manager");
  const fin   = byRole(s.roster,"finance");
  const leg   = byRole(s.roster,"legal");
  const hr    = byRole(s.roster,"hr");
  const dir   = byRole(s.roster,"director");

  const newLog = [];

  // Rival clusters advance in parallel (self-heals saves made before rivals existed)
  if (!Array.isArray(s.rivals)) s.rivals = makeRivals(s.country, s.sector); // pre-rivals saves only: an EMPTY array is a legitimate consolidation state
  // Same for national coverage tracking (no retroactive bonus, just consistency)
  if (!Array.isArray(s.fullCountries)) s.fullCountries = computeFullCountries(s);
  if (!s.seats || typeof s.seats !== "object") s.seats = {}; // pre-politics saves
  if (!s.rivalSeats || typeof s.rivalSeats !== "object") s.rivalSeats = {};
  if (!s.rivalOps || typeof s.rivalOps !== "object") s.rivalOps = {};
  // Saves from before national-S3 countries had NUTS-2 regions used the country
  // name as its own single region; map those onto the first real region.
  const NATSPLIT = {"Bulgaria":"Severozapaden","Czechia":"Prague","Greece":"Attica","Croatia":"Pannonian Croatia","Hungary":"Budapest","Ireland":"Northern & Western","Lithuania":"Capital Region","Slovenia":"Eastern Slovenia","Slovakia":"Bratislava Region","Denmark":"Capital Region","Spain":"Andalusia","Italy":"Abruzzo","Poland":"Greater Poland","Portugal":"Alentejo","Romania":"Bucharest-Ilfov"};
  if (Array.isArray(s.regions)) s.regions = s.regions.map(rg => NATSPLIT[rg] || rg);
  if (s.region && NATSPLIT[s.region]) s.region = NATSPLIT[s.region];
  const rt = tickRivals(s);
  rt.logs.forEach(l => newLog.push(l));

  // Member churn (hard: 6% base; skilled staff retain better; SME-heavy books are more volatile)
  const churnRate = Math.max(0.01, 0.06 - byRoleEff(s.roster,"trainer")*0.008 - byRoleEff(s.roster,"hr")*0.01 - byRoleEff(s.roster,"manager")*0.003 + (mixOf(s).sme/Math.max(1,s.members) > 0.75 ? 0.005 : 0));
  const extraChurn = s.boardConf < 25 ? 0.03 : s.boardConf < 45 ? 0.01 : 0;
  const totalChurn = churnRate + extraChurn;
  const churned = Math.max(0, Math.floor((s.members||1) * totalChurn));
  { const mx = mixOf(s), m = Math.max(1, s.members||1); // churn removes proportionally; exact remainder keeps the ledger reconciled
    const loseS = Math.min(mx.sme, Math.round(churned*mx.sme/m));
    const loseC = Math.min(mx.corp, Math.round(churned*mx.corp/m));
    const loseR = Math.min(mx.res, Math.max(0, churned - loseS - loseC));
    s.mix = { sme: mx.sme - loseS, corp: mx.corp - loseC, res: mx.res - loseR }; }
  s.members = Math.max(1, (s.members||1) - churned);
  if (churned > 0) newLog.push({t:"bad",txt:`${churned} member${churned!==1?"s":""} churned (${Math.round(totalChurn*100)}%/quarter)`});
  if (rt.poached > 0) s.members = Math.max(1, s.members - rt.poached);
  if (rt.defectors > 0) s.members = s.members + rt.defectors;
  s.mix = mixOf(s); // keep the composition ledger in sync after rival-driven member changes
  // the field refills: imitators enter the race (never on an empty field)
  if ((s.rivals||[]).length >= 1 && (s.rivals||[]).length < 3 &&
      Math.random() < 0.05 * (diffOf(s).pressure || 1)) {
    const nr = spawnRival(s);
    s.rivals = [...s.rivals, nr];
    s.log = [{t:"bad", txt:`NEW ENTRANT: ${nr.name} (${NAME_TO_ISO[nr.country]||nr.country}) has entered the race — ${archOf(nr).label.toLowerCase()}, already a ${STAGES[nr.stage].name}`}, ...(s.log||[])].slice(0,120);
  }
  if (rt.prestigeHit > 0) s.prestige = Math.max(0, (s.prestige||0) - rt.prestigeHit);

  // Prestige decay (S3-aligned clusters lose less prestige; misaligned lose more)
  const decay = ([2,3,4,5,6,8][s.stage] ?? 2) + (s.s3Aligned ? -1 : 1);
  const pregain = byRoleEff(s.roster,"comms")*2 + byRoleEff(s.roster,"lobbyist")*3 + byRoleEff(s.roster,"analyst")*4 + byRoleEff(s.roster,"manager")*0.5 + byRoleEff(s.roster,"director")*2 + (pm>0?1:0) + seatsHeld(s); // seats + skilled staff sustain influence
  s.prestige = Math.min(100, Math.max(0, (s.prestige||0) - decay + pregain));

  // Staff-driven member growth (+ seniority bonus: staff retained 12+ quarters are 30% more effective)
  const seniorBonus = (s.roster||[]).reduce((b,r) => b + ((s.turn - (r.hiredTurn||0)) >= 12 ? 1 : 0), 0) * 0.3;
  const mktFree = Math.max(0.15, 1 - Math.pow(marketShare(s), 1.6)); // crowded markets slow recruitment
  const grown = Math.max(0, Math.floor((byRoleEff(s.roster,"comms")*4 + byRoleEff(s.roster,"trainer")*5 + byRoleEff(s.roster,"manager")*1 + seniorBonus) * mktFree));
  { const fo = MIX_FOCUS[s.focus] || MIX_FOCUS.balanced, mx = mixOf(s); // recruitment focus decides who joins
    const gS = Math.round(grown*fo.sme), gC = Math.round(grown*fo.corp);
    s.mix = { sme: mx.sme + gS, corp: mx.corp + gC, res: mx.res + Math.max(0, grown-gS-gC) }; }
  s.members = Math.floor(s.members + grown);
  // staff grow: +1 skill every 10 quarters of tenure (cap 5)
  s.roster = (s.roster||[]).map(r => r && !STAFF_ROLES.find(d=>d.id===r.role)?.hidden && ((s.turn - (r.hiredTurn||0)) % 12 === 0) && (s.turn > (r.hiredTurn||0)) && skillOf(r) < 5
    ? { ...r, skill: skillOf(r) + 1 } : r);

  // Project completions
  const failRate = calcFailRate(s);
  const finishing = (s.activeProjects||[]).filter(p => p && p.endTurn <= s.turn);
  s.activeProjects = (s.activeProjects||[]).filter(p => p && p.endTurn > s.turn);

  let qProj = 0;
  for (const p of finishing) {
    // the same call cannot be reapplied to immediately
    s.projCooldown = { ...(s.projCooldown||{}), [p.id]: s.turn + Math.max(4, (p.dur||1)*3) };
    const volume = projBudget(p, p.partners);
    const interimPaid = Math.round(volume * INTERIM_RATE); // received across the delivery quarters
    const contest = projContest(p, s);
    if (Math.random() < Math.min(0.90, failRate + contest.failPen)) {
      const clawback = interimPaid - Math.round(volume * FAIL_RECOVERY); // recover down to 60% of costs
      qProj -= clawback;
      s.prestige = Math.max(0, s.prestige - 8);
      s.boardConf = Math.max(0, s.boardConf - (15 - 4 * Math.min(2, dir)));
      newLog.push({t:"bad",txt:`FAILED: "${p.name}" · audit clawed back ${fmt(clawback)}; only ${Math.round(FAIL_RECOVERY*100)}% of ${fmt(volume)} costs stand (net ${fmt(Math.round(volume*FAIL_RECOVERY)-volume)}) · influence -8, board hit`});
    } else {
      const multiplier = (pm>0 ? 1.12 : 1) * (dir>0 ? 1.10 : 1) * (s.s3Aligned ? 1.12 : 0.92) * (1 - 0.06*Math.min(3, rt.competition));
      const gain  = Math.round(volume * projMargin(p, s) * multiplier * contest.marginMul);
      const final = volume + gain - interimPaid; // balance payment + margin
      if (contest.rivals.length > 0) {
        s.rivals = (s.rivals||[]).map(rv => contest.rivals.some(c => c.id===rv.id) ? { ...rv, health:(rv.health??70)-3 } : rv);
        newLog.push({t:"good",txt:`You outbid ${contest.rivals.map(r=>r.name).join(" and ")} on "${p.name}" · their standing suffers`});
      }
      qProj += final;
      s.prestige = Math.min(100, s.prestige + (p.pres||0));
      s.members  = Math.floor(s.members + (p.mg||0));
      s.boardConf = Math.min(100, s.boardConf + 10);
      s.completedProjects = [...(s.completedProjects||[]), {...p, completedTurn:s.turn}];
      newLog.push({t:"project",txt:`"${p.name}" complete · final payment ${fmt(final)} incl. ${fmt(gain)} margin · +${p.pres} influence · +${p.mg} members`});
    }
  }

  // Delivery costs: every active project (incl. those finishing this quarter) consumes own funds,
  // while interim payments reimburse most of it in the same quarter
  const qDelivery = [...finishing, ...(s.activeProjects||[])].reduce((sum,p) => sum + projSpendQ(p, p.partners), 0);
  const qInterim  = Math.round(qDelivery * INTERIM_RATE);
  qProj += qInterim;

  // Inactivity streak penalty
  if (finishing.length===0 && (s.activeProjects||[]).length===0) {
    s.streak = (s.streak||0) + 1;
    if (s.streak >= 3) {
      const lost = Math.ceil(s.members * 0.025);
      s.members = Math.max(1, s.members - lost);
      newLog.push({t:"bad",txt:`Inactivity: ${lost} members left (${s.streak} quarters idle)`});
    }
  } else { s.streak = 0; }

  s.mix = mixOf(s); // final reconciliation: all member changes this quarter are now folded into the composition ledger

  // Finances
  const qMember   = Math.round(s.members * memberFee(s.stage) * feeMult(s));
  const qStaff    = staffCostQ(s.roster, s.turn);
  const qOverhead = calcOverhead(s.stage, fin > 0, (s.regions||[]).length, s.turn);
  const qServicing = servicingCost(s.members, s.stage);
  const qNet      = qMember + qProj - qStaff - qOverhead - qServicing - qDelivery;
  s.budget    = Math.max(0, Math.round((s.budget||0) + qNet));
  s.qMember   = qMember;
  s.qProj     = qProj;
  s.qStaff    = qStaff;
  s.qOverhead = qOverhead;
  s.qServicing = qServicing;
  s.qDelivery = qDelivery;
  s.qInterim  = qInterim;
  s.qNet      = qNet;

  // Board confidence
  const burnRate = qStaff + qOverhead + qServicing + Math.max(0, qDelivery - qInterim); // only the un-reimbursed exposure burns
  const runway   = burnRate > 0 ? s.budget / burnRate : 99;
  const dirBoard = dir > 0 ? 4 + (dir - 1) * 2 : 0;
  const bdelta   = dirBoard
    + (runway > 6 ? 2 : runway < 2 ? -10 : runway < 3 ? -4 : runway < 4 ? -2 : 0)
    + (s.prestige > 70 ? 2 : s.prestige < 20 ? -4 : s.prestige < 30 ? -2 : 0)
    + ((s.seats||{}).regional ? 1 : 0)
    + (corpShare(s) >= 0.35 ? 1 : 0)
    + (finishing.length > 0 && qProj > 0 ? 3 : 0)
    - (churned > (s.members||1) * 0.04 ? 3 : 0);
  s.boardConf = Math.min(100, Math.max(0, (s.boardConf||0) + bdelta));

  // Random events: base 45% chance, +2% for every country in the network (coordination risk)
  const evChance = Math.min(0.65, 0.45 + 0.02 * Math.max(0, (s.countries||[]).length - 1));
  if (!s.pendingEvent && Math.random() < evChance) {
    let chosen = Math.random() < 0.22 ? pickRivalEvent(s) : null; // roughly 1 in 5 events is a rival storyline
    if (!chosen) chosen = pickEvent(s);
    if (!chosen) chosen = null;
    // Lobbyists soften simple bad events (decision events keep their trade-offs)
    if (chosen && !chosen.choices && chosen.t==="bad" && lobby > 0) {
      const d = 0.55;
      chosen = {
        ...chosen,
        bfx: Math.abs(chosen.bfx)<1 ? chosen.bfx*(1-d) : Math.round(chosen.bfx*(1-d*0.5)),
        pfx: Math.round((chosen.pfx||0)*(1-d)),
        mfx: Math.round((chosen.mfx||0)*(1-d)),
      };
    }
    if (chosen) { s.pendingEvent = chosen; s.lastEventId = chosen.id; }
  }

  s.log = [...newLog, ...(s.log||[])].slice(0, 120);

  // From National Association onward the cluster works across every industrial
  // ecosystem: S3 alignment is guaranteed, but so is overlap with every rival.
  if (s.stage >= 2 && !s.crossEco) {
    s.crossEco = true;
    if (!s.s3Aligned) s.s3Aligned = true;
    s.log = [{t:"good",txt:"CROSS-ECOSYSTEM: as a national body your cluster now spans every industrial ecosystem · permanently S3-aligned, but you now compete with every rival for members"}, ...(s.log||[])].slice(0,120);
  }

  // Rivals gang up on a runaway leader: a temporary coalition
  if ((s.stage||0) >= 3 && (s.rivals||[]).length >= 2 && (s.rivals||[]).every(rv => rv.stage < s.stage)
      && !((s.coalitionUntil||0) > s.turn) && Math.random() < 0.05) {
    s.coalitionUntil = s.turn + 8;
    s.log = [{t:"bad",txt:"RIVAL COALITION: your rivals have joined forces against the front-runner — their progress and poaching intensify for 8 quarters. A consortium pact with any of them breaks it."}, ...(s.log||[])].slice(0,120);
  }

  // Records and hardship flag (achievement check runs at end of turn, after win flags)
  s.peak = { budget: Math.max(s.peak?.budget||0, s.budget||0), members: Math.max(s.peak?.members||0, s.members||0) };
  if ((s.budget||0) < 10000) s.wasBroke = true;

  // Record history for the dashboard sparklines (kept small)
  s.history = [...(s.history||[]), { t:s.turn, b:Math.round(s.budget||0), m:s.members||0, p:Math.round(s.prestige||0), bc:Math.round(s.boardConf||0) }].slice(-160);
  // Quarter digest: headline deltas + the new log lines this quarter produced
  const _newLogs = (s.log||[]).slice(0, Math.max(0, (s.log||[]).length - _snap.logLen));
  s.digest = {
    turn: s.turn,
    dBudget: Math.round((s.budget||0) - _snap.budget),
    dMembers: (s.members||0) - _snap.members,
    dInfluence: Math.round((s.prestige||0) - _snap.prestige),
    dBoard: Math.round((s.boardConf||0) - _snap.boardConf),
    evolved: (s.stage||0) > _snap.stage ? STAGES[s.stage]?.name : null,
    qMember: s.qMember||0, qProj: (s.qProj||0)+(s.qInterim||0), qStaff: s.qStaff||0, qOverhead: s.qOverhead||0, qDelivery: s.qDelivery||0,
    events: _newLogs.filter(l => l && (l.t==="good"||l.t==="bad")).slice(0,6).map(l => ({ t:l.t, txt:l.txt })),
  };

  // Political integration: one chair per seat. Vacant chairs are claimed on merit;
  // rival-held chairs can be taken by out-influencing the holder (threshold + 15).
  for (const st of SEATS) {
    if ((s.seats||{})[st.id]) continue;
    if (!st.reqs(s).every(r => r.ok)) continue;
    const holder = (s.rivalSeats||{})[st.id];
    if (holder) {
      if ((s.prestige||0) >= (st.infl||0) + 15) {
        const rvName = (s.rivals||[]).find(r=>r.id===holder)?.name || "a rival";
        s.rivalSeats = { ...(s.rivalSeats||{}) }; delete s.rivalSeats[st.id];
        s.rivals = (s.rivals||[]).map(rv => rv.id===holder ? { ...rv, health:(rv.health??70)-10 } : rv);
        s.seats = { ...(s.seats||{}), [st.id]: true };
        s.log = [{t:"good",txt:`POLITICAL COUP: you displaced ${rvName} from the ${st.label} · ${st.effects}`}, ...s.log].slice(0,120);
      }
    } else {
      s.seats = { ...(s.seats||{}), [st.id]: true };
      s.log = [{t:"good",txt:`POLITICAL SEAT: your cluster now sits on the ${st.label} · ${st.effects}`}, ...s.log].slice(0, 120);
    }
  }

  // Alternative victory: consolidate the market by outlasting every rival
  if ((s.rivals||[]).length === 0 && !s.gameWon) {
    s.gameWon = true; s.winType = "consolidation";
    s.log = [{t:"good",txt:"MARKET CONSOLIDATION: every rival has folded. Your cluster stands alone at the top of European industry."}, ...s.log];
  }

  if (s.budget <= 0 && qNet < 0) s.gameOver = true;
  if ((s.boardConf||0) <= 0) { s.gameOver = true; s.log = [{t:"bad",txt:"Board dissolved the cluster. Game over."},...s.log]; }
  if (s.stage === 5) s.gameWon = true;
  // Achievements: checked after every win/lose flag is settled so victory feats register
  { const res = checkAchievements(s);
    s.achv = res.achv;
    res.won.forEach(a => { s.log = [{t:"good",txt:`ACHIEVEMENT UNLOCKED: ${a.name} — ${a.desc}`}, ...(s.log||[])].slice(0,120); }); }

  if (rt.defeatedBy && !s.gameWon) {
    s.log = [{t:"bad",txt:`${rt.defeatedBy} has formed a Pan-European Cluster Network. The race is over.`}, ...s.log];
  }

  return s;
}

function applyEvent(state, ev, choiceIdx) {
  if (!state || !ev) return state;
  // For choice events, pull the chosen effect block; fall back to whole ev for simple events
  const fx = (ev.choices && choiceIdx != null) ? (ev.choices[choiceIdx]?.fx || {}) : ev;
  let { budget, members, prestige, roster, boardConf, rivals } = state;
  // Rival-event extensions
  if (fx.loseRole && Array.isArray(roster)) {
    // headhunts and refused raises take your BEST person of that role, not a random one
    let idx = -1, best = -1;
    roster.forEach((r, i) => { if (r?.role === fx.loseRole && (r.skill||1) > best) { best = r.skill||1; idx = i; } });
    if (idx >= 0) roster = roster.filter((_, i) => i !== idx);
  }
  if (fx.rvHealth && Array.isArray(rivals)) {
    rivals = rivals.map(rv => rv.id === fx.rvHealth.rid ? { ...rv, health: Math.min(100,(rv.health??70) + fx.rvHealth.d) } : rv);
  }
  if (fx.stealPct && Array.isArray(rivals)) {
    const rv = rivals.find(r => r.id === fx.stealPct.rid);
    if (rv) {
      const won = Math.max(1, Math.round((rv.members||0) * fx.stealPct.pct));
      members = (members||0) + won;
      rivals = rivals.map(r => r.id === rv.id ? { ...r, members: Math.max(3,(r.members||0)-won) } : r);
    }
  }
  const bfx = fx.bfx ?? 0;
  if (bfx !== 0) {
    if (Math.abs(bfx) < 1) budget = Math.max(0, Math.round((budget||0) * (1 + bfx)));
    else budget = Math.max(0, (budget||0) + bfx);
  }
  members   = Math.max(1, (members||1) + (fx.mfx||0));
  prestige  = Math.min(100, Math.max(0, (prestige||0) + (fx.pfx||0)));
  if (fx.rvHealth === undefined && ev && ev.rvHealth && Array.isArray(rivals))
    rivals = rivals.map(rv => rv.id === ev.rvHealth.rid ? { ...rv, health: Math.min(100,(rv.health??70) + ev.rvHealth.d) } : rv);
  if (fx.stealPct === undefined && ev && ev.stealPct && Array.isArray(rivals)) {
    const rv2 = rivals.find(r => r.id === ev.stealPct.rid);
    if (rv2) {
      const won2 = Math.max(1, Math.round((rv2.members||0) * ev.stealPct.pct));
      members = (members||0) + won2;
      rivals = rivals.map(r => r.id === rv2.id ? { ...r, members: Math.max(3,(r.members||0)-won2) } : r);
    }
  }
  // brd: explicit board delta from the effect (overrides the blanket good/bad swing for choice events)
  const brdDelta = fx.brd != null ? fx.brd : (ev.t==="good" ? 8 : ev.t==="bad" ? -8 : 0);
  boardConf = Math.min(100, Math.max(0, (boardConf||0) + brdDelta));
  if ((fx.sfx||0) < 0 && Array.isArray(roster) && roster.length > 0) {
    // Mandatory office staff (regional coordinators, country managers) never quit through events
    const eligible = roster.map((r, i) => ({r, i})).filter(x => !STAFF_ROLES.find(d => d.id===x.r?.role)?.hidden);
    if (eligible.length > 0) {
      const idx = eligible[Math.floor(Math.random() * eligible.length)].i;
      roster = roster.filter((_, i) => i !== idx);
    }
  }
  // rvProg: adjust progress of the primary rival (positive helps them, negative slows them)
  if (fx.rvProg && Array.isArray(rivals) && rivals.length > 0) {
    rivals = rivals.map((rv, i) => i === 0 ? { ...rv, progress: Math.min(99, Math.max(0, (rv.progress||0) + fx.rvProg)) } : rv);
  }
  { // events change membership (member deltas, poaching, steals) — keep the
    // SME/corporate/research ledger reconciled so composition never drifts.
    const out = { ...state, budget, members, prestige, roster, boardConf, rivals };
    return { ...out, mix: mixOf(out) };
  }
}

// National coverage: activating every region of a country grants a one-time bonus
function applyCoverage(state) {
  const full = computeFullCountries(state);
  const prev = new Set(state.fullCountries||[]);
  const gained = full.filter(c => !prev.has(c));
  if (gained.length === 0) return { ...state, fullCountries: full };
  let { prestige, members, boardConf, log } = state;
  gained.forEach(c => {
    const contested = (state.rivals||[]).some(rv => (rv.countries||[]).includes(c));
    const mul = contested ? 0.5 : 1; // a rival presence dilutes the political win
    prestige  = Math.min(100, (prestige||0) + Math.round(10*mul));
    members   = Math.floor((members||1) * (1 + 0.05*mul)) + Math.round(3*mul);
    boardConf = Math.min(100, (boardConf||0) + Math.round(5*mul));
    log = [{t:"good",txt:`National coverage of ${c}: every region is active · +${Math.round(10*mul)} influence, +${Math.round(5*mul)}% members, board +${Math.round(5*mul)}${contested ? " (halved: a rival still operates there)" : ""}`}, ...(log||[])];
  });
  { const out = { ...state, fullCountries: full, prestige, members, boardConf, log };
    return { ...out, mix: mixOf(out) }; }
}

function reducer(state, action) {
  if (!state) return state;
  switch (action.type) {
    case "nextTurn": return advanceTurn(state);

    case "dismissEvent": {
      if (!state.pendingEvent) return state;
      const ev = state.pendingEvent;
      const ci = action.choiceIdx;
      const applied = applyEvent(state, ev, ci);
      const label = (ev.choices && ci != null) ? ev.choices[ci]?.label : null;
      const fxApplied = (ev.choices && ci != null) ? (ev.choices[ci]?.fx || {}) : ev;
      const extraLogs = [];
      if (fxApplied.loseRole && (applied.roster||[]).length < (state.roster||[]).length) {
        const rn = STAFF_ROLES.find(d=>d.id===fxApplied.loseRole)?.name || fxApplied.loseRole;
        extraLogs.push({t:"bad", txt:`Your ${rn} resigned and joined the rival — the office feels their absence`});
      }
      return {
        ...applied, pendingEvent: null,
        log: [...extraLogs,
              {t: ev.t==="choice" ? (ci===0?"good":"bad") : ev.t,
               txt:`${ev.n}${label ? ` · ${label}` : ""}`},
              ...(applied.log||[])],
      };
    }

    case "evolve": {
      if (!canEvolve(state)) return state;
      const cost = evolveCost(state.stage);
      const next = state.stage + 1;
      return {
        ...state, stage:next, budget:(state.budget||0)-cost,
        prestige:Math.min(100,(state.prestige||0)+6),
        boardConf:Math.min(100,(state.boardConf||0)+18),
        gameWon: next===5,
        log:[{t:"good",txt:`Evolved to ${STAGES[next].name}! Cost: ${fmt(cost)}`},...(state.log||[])],
      };
    }

    case "rivalRaid": case "rivalPR": case "rivalPact": case "rivalAcquire": case "rivalScout": {
      const opId = { rivalRaid:"raid", rivalPR:"pr", rivalPact:"pact", rivalAcquire:"acquire", rivalScout:"scout" }[action.type];
      const op = RIVAL_OPS[opId];
      const rv = (state.rivals||[]).find(r => r.id === action.rid);
      if (!rv || !op) return state;
      const cost = op.cost(state, rv);
      if ((state.budget||0) < cost) return state;
      if (!opReady(state, rv.id, opId)) return state;
      if (opId === "pact" && ((state.prestige||0) < 50 || (rv.truce||0) > (state.turn||0))) return state;
      if (opId === "acquire" && (rv.health ?? 100) > 25) return state;

      let next = { ...state, budget:(state.budget||0)-cost,
        rivalOps: { ...(state.rivalOps||{}), [`${rv.id}:${opId}`]: (state.turn||0) + op.cd } };
      const upd = fn => { next.rivals = (next.rivals||[]).map(r => r.id===rv.id ? fn({...r}) : r); };
      const logAdd = (t,txt) => { next.log = [{t,txt}, ...(next.log||[])].slice(0,120); };

      if (opId === "raid") {
        if (Math.random() < 0.75) {
          const stolen = Math.min(rv.members||0, Math.ceil((rv.members||0)*0.05) + 2);
          next.members = (next.members||0) + stolen;
          upd(r => ({ ...r, members: Math.max(3,(r.members||0)-stolen), health:(r.health??70)-5 }));
          logAdd("good", `Talent raid on ${rv.name}: ${stolen} members switched to your cluster (${fmt(-cost)})`);
        } else {
          next.prestige = Math.max(0,(next.prestige||0)-5); next.boardConf = Math.max(0,(next.boardConf||0)-5);
          logAdd("bad", `Talent raid on ${rv.name} exposed in the press · influence −5, board −5 (${fmt(-cost)})`);
        }
      }
      if (opId === "pr") {
        if (Math.random() < 0.80) {
          const hit = 15 + Math.round(Math.random()*10);
          upd(r => ({ ...r, progress: Math.max(0,(r.progress||0)-hit), health:(r.health??70)-3 }));
          logAdd("good", `PR campaign lands: ${rv.name} loses ${hit} progress (${fmt(-cost)})`);
        } else {
          next.prestige = Math.max(0,(next.prestige||0)-6);
          logAdd("bad", `PR campaign against ${rv.name} backfires · influence −6 (${fmt(-cost)})`);
        }
      }
      if (opId === "pact") {
        upd(r => ({ ...r, truce:(state.turn||0)+12 }));
        if ((next.coalitionUntil||0) > (state.turn||0)) { next.coalitionUntil = 0; logAdd("good","The consortium pact splits the rival coalition"); }
        logAdd("good", `Joint consortium signed with ${rv.name}: 12 quarters of truce, shared bids lift your margins (${fmt(-cost)})`);
      }
      if (opId === "scout") {
        upd(r => ({ ...r, scoutedUntil:(state.turn||0)+4 }));
        logAdd("good", `Scouts embedded at ${rv.name}: their plans are visible and their recruiters cautious for 4 quarters (${fmt(-cost)})`);
      }
      if (opId === "acquire") {
        const absorbed = Math.round((rv.members||0)*0.6);
        next.members  = (next.members||0) + absorbed;
        next.prestige = Math.min(100,(next.prestige||0)+8);
        next.boardConf = Math.min(100,(next.boardConf||0)+5);
        next.rivals = (next.rivals||[]).filter(r => r.id !== rv.id);
        next.rivalsGone = (next.rivalsGone||0) + 1; next.acqCount = (next.acqCount||0) + 1;
        next.rivalSeats = Object.fromEntries(Object.entries(next.rivalSeats||{}).filter(([,v]) => v !== rv.id));
        logAdd("good", `ACQUISITION: ${rv.name} absorbed for ${fmt(cost)} · ${absorbed} members join, +8 influence`);
        if ((next.rivals||[]).length === 0) {
          next.gameWon = true; next.winType = "consolidation";
          logAdd("good", "MARKET CONSOLIDATION: every rival has folded. Your cluster stands alone at the top of European industry.");
        }
      }
      return next;
    }

    case "loadState": return action.state ? migrateSave(action.state) : state;

    case "setFocus": {
      if (!MIX_FOCUS[action.focus]) return state;
      return { ...state, focus: action.focus, log: [{t:"info",txt:`Recruitment focus: ${MIX_FOCUS[action.focus].label} — new members will follow this profile`}, ...(state.log||[])].slice(0,120) };
    }

    case "startProject": {
      const { p, n } = action;
      if (!p) return state;
      const cap = Math.min(1 + byRole(state.roster,"pm"), 1 + (state.stage||0));
      if ((state.activeProjects||[]).length >= cap) return state; // capacity is enforced here, not only in the UI
      if ((state.budget||0) < projNeed(p, n)) return state;
      return {
        ...state,
        activeProjects: [...(state.activeProjects||[]), {...p, partners:n, endTurn:(state.turn||0)+p.dur}],
        log: [{t:"good",txt:`"${p.name}" launched · investing ${fmt(projSpendQ(p, n))}/quarter of own funds for ${p.dur}Q`}, ...(state.log||[])],
      };
    }

    case "hire": {
      if (!action.roleId) return state;
      if (hireBlockReason(state, action.roleId)) return state; // GM cap · span of control · role balance
      const star = Math.random() < 0.12; // occasional star performer
      return {
        ...state,
        roster: [...(state.roster||[]), {role: action.roleId, hiredTurn: state.turn||0, name: staffName(), skill: star ? 3 : 1}],
        log: star ? [{t:"good",txt:`Star hire: your new ${STAFF_ROLES.find(x=>x.id===action.roleId)?.name} joins at skill level 3`}, ...(state.log||[])].slice(0,120) : state.log,
      };
    }

    case "fire": {
      if (typeof action.idx !== "number") return state;
      const gone = (state.roster||[])[action.idx];
      if (!gone) return state;
      const def = STAFF_ROLES.find(x => x.id === gone.role);
      if (def?.hidden) return state; // mandatory office staff cannot be dismissed
      const senior = ((state.turn||0) - (gone.hiredTurn||0)) >= 12;
      const severance = Math.round(roleCost(def, state.turn) * (senior ? 2 : 1));
      return {
        ...state,
        roster: (state.roster||[]).filter((_, i) => i !== action.idx),
        budget: Math.max(0, (state.budget||0) - severance),
        boardConf: Math.max(0, (state.boardConf||0) - 4),
        log: [{t:"bad", txt:`${def?.name||gone.role} let go · severance ${fmt(severance)} · board -4${senior?" (senior hire)":""}`}, ...(state.log||[])],
      };
    }

    case "expandRegion": {
      if ((state.budget||0) < (action.cost||0) || (state.regions||[]).includes(action.region)) return state;
      const coordSalary = roleCost(STAFF_ROLES.find(x => x.id==="coordinator"), state.turn);
      return applyCoverage({
        ...state,
        regions: [...(state.regions||[]), action.region],
        roster:  [...(state.roster||[]), {role:"coordinator", hiredTurn: state.turn||0}],
        budget:  (state.budget||0) - action.cost,
        log: [{t:"good",txt:`Expanded to ${action.region} (${fmt(-action.cost)}) · mandatory Regional Coordinator hired, ${fmt(coordSalary)}/quarter`},...(state.log||[])],
      });
    }

    case "expandCountry": {
      if ((state.budget||0) < (action.cost||0) || (state.countries||[]).includes(action.country)) return state;
      if ((state.countries||[]).length >= countryCap(state)) return state; // international reach is stage-capped
      const pickedOk = action.region && (EU_COUNTRIES[action.country]||[]).includes(action.region);
      const firstRegion = pickedOk ? action.region : ((EU_COUNTRIES[action.country]||[])[0] || action.country);
      const label = `${firstRegion} (${NAME_TO_ISO[action.country]||action.country})`;
      const mgrSalary = roleCost(STAFF_ROLES.find(x => x.id==="countrymgr"), state.turn);
      return applyCoverage({
        ...state,
        countries: [...(state.countries||[]), action.country],
        regions: [...(state.regions||[]), label],
        roster:  [...(state.roster||[]), {role:"countrymgr", hiredTurn: state.turn||0}],
        budget:  (state.budget||0) - action.cost,
        log: [{t:"good",txt:`Expanded to ${action.country} (${fmt(-action.cost)}) · mandatory Country Manager hired, ${fmt(mgrSalary)}/quarter`},...(state.log||[])],
      });
    }

    default: return state;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EU MAP · NUTS-2 basemap with an interactive overlay.
   Coordinate space is 609×600; country centroids are calibrated to it.
═══════════════════════════════════════════════════════════════ */
const MAP_W = 609, MAP_H = 600;
// Land around the Union, in the same coordinate space as the regions. It is
// drawn beyond the map frame on purpose: on a wide or tall screen the space
// either side of Europe shows its neighbours instead of empty sea. Candidate
// countries are kept apart so they can be tinted as places the Union may reach.
const NEIGHBOUR_LAND = "M944.8,563.6L943.2,569.1L938.3,568.8L942.6,579.9L946.5,580.3L941.2,586.5L945.8,607.6L943.6,610.3L909.0,626.1L889.4,617.2L887.4,614.8L894.2,615.8L917.5,599.6L924.0,591.0L933.2,550.2L940.1,554.8ZM1017.0,216.3L1019.7,218.2L1018.1,225.7L1006.2,240.8L1002.3,256.2L1003.2,265.4L1016.2,272.4L1017.7,286.7L1023.0,292.7L1013.3,305.8L1023.7,310.5L1020.0,322.1L1029.2,340.6L1028.3,348.1L1019.4,353.1L1016.7,362.7L1019.6,364.5L1011.1,375.6L1010.2,383.8L1018.4,400.0L999.9,427.1L982.3,442.9L959.9,451.6L959.9,425.4L956.2,422.4L945.3,427.9L928.1,407.4L927.6,399.2L924.5,400.6L918.6,395.1L920.2,387.9L912.6,366.3L922.1,361.9L927.5,363.4L930.4,359.2L932.7,352.3L929.1,346.3L938.4,327.1L932.7,314.2L938.4,305.2L937.4,299.8L956.6,286.4L964.7,285.4L968.2,273.2L974.0,271.0L971.6,262.6L977.1,256.3L973.4,251.2L973.7,237.2L985.4,238.5L993.4,250.0L999.7,252.5L1004.8,226.2L1008.4,222.2L1010.5,224.3L1013.7,215.5L1019.9,212.3ZM724.7,428.3L720.3,431.3L711.1,422.8L683.0,426.1L679.9,416.0L674.4,411.8L690.4,400.5L707.6,411.6L708.0,416.9L719.1,418.9ZM486.0,288.0L478.1,291.0L475.9,299.0L478.3,303.5L477.5,305.2L473.1,302.6L469.8,304.4L468.1,303.7L465.1,306.7L461.8,303.3L458.5,307.3L457.0,305.8L454.6,306.6L453.0,305.2L451.2,307.4L449.4,307.1L448.6,309.3L447.7,307.6L443.6,308.3L441.8,306.2L439.0,307.2L427.2,306.5L421.2,307.4L413.4,310.5L410.4,316.1L406.5,316.1L406.7,318.2L405.3,314.8L405.4,309.2L399.8,306.3L401.9,301.5L405.8,298.1L403.8,289.8L398.0,278.0L406.8,277.2L410.1,275.0L410.1,272.3L412.4,271.9L415.8,268.6L417.0,270.7L418.9,270.0L416.4,267.4L416.4,259.7L420.4,253.1L423.6,251.9L423.6,249.3L421.5,248.7L421.2,243.5L424.9,239.8L429.5,239.5L429.7,237.0L433.1,232.1L434.9,233.2L437.6,232.4L439.7,233.8L441.9,232.3L444.8,232.5L447.2,236.2L450.4,233.1L455.7,232.4L460.5,234.6L461.6,239.6L463.9,242.9L463.8,247.5L466.7,249.2L471.5,255.0L476.5,256.6L477.8,260.5L484.1,260.2L488.2,264.1L486.7,268.3L484.2,271.1L479.1,270.7L477.0,272.4L477.0,274.9L480.2,277.5ZM873.9,-434.2L873.5,-453.3L876.9,-460.9L912.5,-480.0L1056.3,-480.0L1053.6,-475.8L1057.6,-471.5L1072.0,-463.3L1097.3,-438.4L1105.9,-419.7L1124.3,-395.3L1116.8,-400.9L1111.2,-399.2L1094.1,-411.2L1090.2,-408.1L1095.2,-394.7L1123.6,-365.9L1130.0,-348.9L1130.0,236.6L1121.6,236.3L1121.8,240.7L1103.3,231.2L1104.0,225.2L1109.7,226.6L1111.1,216.9L1103.4,211.7L1097.5,214.2L1089.9,207.1L1093.2,201.2L1089.1,194.5L1090.0,185.8L1082.4,173.4L1080.6,177.1L1068.9,178.6L1062.6,203.8L1053.1,211.2L1048.7,210.6L1046.5,215.6L1034.1,208.9L1017.9,218.1L1019.4,207.6L1004.7,197.8L995.8,206.4L985.9,201.0L979.5,186.7L980.4,172.8L984.1,163.7L989.3,166.5L993.1,158.4L988.7,146.1L996.8,132.6L994.2,125.0L997.5,99.0L988.9,92.1L985.7,81.4L963.0,67.7L957.5,70.3L961.7,48.9L968.8,42.0L961.2,39.3L943.3,15.9L956.8,1.4L956.7,-7.6L939.3,-22.2L939.8,-32.3L933.2,-40.1L935.5,-50.5L945.6,-47.1L953.7,-50.0L968.4,-62.5L985.5,-61.7L1000.4,-48.7L1006.4,-48.1L1019.9,-75.3L1033.0,-84.0L1035.8,-91.0L1039.3,-88.5L1062.4,-91.1L1072.8,-126.1L1074.2,-144.0L1090.9,-171.1L1092.4,-183.7L1096.8,-188.6L1085.3,-224.5L1085.1,-250.3L1063.2,-288.2L1053.1,-284.4L1042.2,-291.8L1040.5,-299.4L1044.4,-312.8L1031.8,-328.3L1029.4,-340.6L1014.0,-353.6L1007.1,-364.9L998.9,-393.8L991.9,-392.5L981.3,-380.3L982.6,-371.4L989.3,-365.8L986.7,-359.8L991.7,-349.3L985.3,-345.9L954.2,-362.8L956.9,-374.0L945.0,-389.8L906.0,-407.9L899.1,-406.9L898.2,-401.2L886.1,-410.0ZM365.3,1039.9L345.6,1067.6L348.9,1070.1L349.1,1080.0L244.3,1080.0L245.7,1071.9L266.0,1055.6L276.5,1053.8L289.8,1061.7L298.6,1052.2L305.8,1033.0L315.1,1026.0L316.6,1017.1L322.2,1013.4L334.8,986.9L346.3,981.5L346.4,972.4L338.2,969.0L336.0,958.5L342.4,958.7L349.1,965.5L354.2,977.4L355.9,996.5L364.6,1004.8L340.6,1006.7L337.0,1011.9L358.9,1029.3ZM721.6,384.8L725.3,371.0L745.1,382.5L755.8,381.0L748.3,390.2L754.4,420.1L742.0,419.6L741.3,409.3L735.5,406.9L724.7,428.3L719.1,418.9L708.0,416.9L707.6,411.6L690.4,400.5L692.7,396.2L709.3,393.8L700.8,387.9L701.5,383.0ZM698.6,426.2L711.1,422.8L720.3,431.3L711.8,433.1ZM98.0,927.6L104.9,941.2L113.1,947.1L111.1,953.1L120.0,959.7L129.9,961.3L128.8,966.1L133.2,972.8L126.2,978.9L99.4,984.3L86.1,979.7L80.2,982.0L41.5,976.2L39.6,1000.2L33.1,992.2L7.1,990.8L-6.1,976.8L-4.5,967.4L1.2,961.8L-0.2,956.1L12.1,953.9L15.9,944.7L20.1,943.9L19.2,938.2L24.4,934.7L34.0,940.2L38.2,932.5L44.4,934.1L46.5,927.9L52.7,925.4L58.8,928.0L61.9,923.9L83.5,917.3L99.3,920.4ZM153.0,976.3L156.9,995.8L142.8,1016.4L137.5,1018.6L134.1,1058.8L114.6,1059.2L117.3,1057.9L114.3,1051.9L116.8,1017.1L112.4,1000.6L103.8,993.3L106.3,984.3L115.9,978.6L126.2,978.9L133.2,972.8L133.4,967.5L141.1,965.7ZM-367.8,42.1L-322.2,31.6L-312.0,38.9L-315.1,40.8L-318.3,37.1L-319.3,42.1L-344.0,47.9L-335.0,49.4L-333.8,56.0L-339.9,55.1L-341.2,60.8L-337.4,64.3L-338.9,68.5L-332.1,67.9L-335.0,72.7L-331.2,75.1L-330.7,81.7L-338.0,82.9L-337.0,86.0L-342.4,88.3L-336.4,93.9L-352.4,97.0L-352.5,100.7L-342.2,100.1L-349.7,104.0L-350.7,106.4L-345.2,106.3L-347.3,109.7L-360.6,115.8L-364.2,112.2L-359.0,106.2L-365.9,104.3L-357.6,100.5L-352.8,93.9L-371.6,93.1L-375.6,89.6L-373.8,86.2L-361.0,88.3L-362.5,83.4L-366.6,84.6L-367.1,76.5L-386.4,48.6L-383.4,44.4L-370.7,46.5ZM-12.4,-349.8L-10.5,-342.3L-17.9,-329.8L-35.4,-337.4L-34.8,-345.0L-49.5,-349.6L-79.9,-337.1L-89.1,-341.2L-96.6,-328.7L-114.1,-328.4L-100.6,-323.0L-106.9,-316.4L-123.8,-315.7L-135.8,-308.2L-131.2,-304.9L-120.4,-307.4L-123.7,-303.2L-108.0,-298.3L-91.9,-301.3L-92.0,-287.4L-88.4,-289.9L-87.3,-304.2L-81.2,-310.3L-82.1,-316.3L-72.7,-323.4L-69.3,-323.4L-69.4,-314.5L-62.6,-325.8L-43.4,-326.7L-26.8,-321.1L-20.5,-312.0L-22.5,-305.3L-39.6,-311.5L-69.3,-300.8L-38.2,-306.5L-29.7,-303.8L-23.3,-290.5L-38.2,-282.3L-52.5,-281.8L-44.9,-279.0L-46.5,-271.5L-39.0,-268.4L-41.7,-257.2L-48.3,-254.5L-49.9,-249.8L-58.3,-250.0L-54.1,-247.0L-60.3,-243.1L-54.7,-240.8L-56.2,-234.1L-65.2,-231.0L-63.4,-227.2L-73.4,-226.9L-65.3,-223.5L-65.1,-218.8L-68.2,-213.3L-76.4,-217.4L-77.2,-212.0L-74.9,-210.5L-71.4,-210.0L-73.9,-205.2L-78.2,-203.0L-80.1,-206.4L-82.8,-206.4L-85.8,-197.1L-89.3,-204.8L-99.3,-200.7L-106.7,-183.3L-103.3,-178.1L-112.7,-166.6L-110.8,-162.3L-116.0,-160.7L-112.1,-154.1L-115.1,-148.5L-134.8,-147.3L-136.6,-151.5L-148.0,-147.8L-143.8,-160.5L-133.2,-164.3L-136.7,-168.5L-136.3,-181.4L-154.9,-167.4L-157.0,-156.6L-165.8,-149.3L-168.7,-141.4L-171.5,-140.7L-174.3,-139.3L-175.8,-144.7L-190.8,-133.7L-187.0,-152.1L-181.0,-162.3L-180.0,-170.2L-184.7,-167.4L-197.6,-142.3L-202.8,-140.1L-203.1,-160.5L-198.2,-171.9L-202.3,-178.0L-191.7,-192.0L-187.5,-191.5L-186.0,-198.3L-180.2,-204.8L-176.4,-215.6L-178.8,-223.2L-184.3,-228.8L-183.4,-236.9L-175.6,-241.6L-164.6,-238.6L-164.9,-225.0L-159.3,-215.6L-149.3,-223.0L-126.4,-217.3L-107.3,-232.5L-111.3,-233.6L-108.6,-236.2L-111.3,-237.7L-102.8,-242.8L-107.2,-248.0L-98.8,-245.6L-83.4,-261.0L-79.8,-268.4L-87.4,-265.7L-88.1,-277.7L-91.9,-269.1L-94.9,-270.7L-89.4,-280.7L-94.8,-284.6L-100.1,-282.5L-103.3,-278.0L-112.0,-276.2L-116.7,-281.3L-134.4,-272.1L-150.2,-280.9L-147.3,-286.9L-154.5,-287.6L-162.6,-282.3L-148.9,-296.8L-149.8,-302.9L-156.6,-299.2L-168.5,-306.0L-159.0,-323.4L-167.8,-317.4L-172.0,-304.1L-175.7,-303.9L-191.2,-312.3L-189.2,-321.7L-198.9,-327.2L-196.1,-332.4L-207.3,-327.0L-209.6,-338.0L-213.6,-336.5L-230.1,-349.6L-246.0,-355.5L-269.3,-355.2L-275.2,-352.6L-279.9,-341.1L-308.3,-333.4L-306.2,-320.9L-314.7,-299.6L-329.6,-283.7L-341.7,-258.9L-343.4,-232.1L-379.7,-220.6L-405.3,-187.7L-397.8,-185.2L-400.6,-179.0L-392.8,-182.8L-385.8,-180.9L-346.1,-205.0L-335.7,-191.4L-316.5,-186.7L-292.2,-199.1L-279.6,-217.1L-258.6,-213.6L-242.7,-223.1L-217.5,-229.8L-213.6,-223.1L-215.9,-205.5L-211.0,-198.4L-220.2,-178.9L-227.3,-173.8L-226.2,-158.7L-252.2,-148.2L-258.4,-141.4L-263.6,-122.8L-252.3,-115.7L-222.3,-117.4L-245.7,-89.8L-252.9,-74.6L-276.1,-55.9L-282.7,-31.6L-280.4,-8.6L-287.2,-10.5L-287.7,15.7L-301.4,28.5L-312.6,30.6L-320.9,28.3L-331.1,18.5L-355.0,13.6L-364.2,-0.1L-383.7,-46.3L-398.6,-47.4L-416.1,-58.7L-442.3,-62.2L-448.9,-61.5L-413.6,-48.5L-394.3,-28.1L-393.7,-13.7L-399.8,-9.3L-411.1,-15.2L-414.8,-24.0L-416.9,-14.4L-411.3,-6.4L-424.0,-4.9L-433.9,20.4L-425.8,45.9L-418.7,42.8L-401.9,44.2L-410.3,50.2L-412.2,59.3L-419.7,57.7L-426.3,51.1L-429.3,55.3L-446.0,43.3L-453.4,37.3L-454.2,32.0L-476.4,27.8L-475.2,17.3L-463.1,12.3L-446.8,20.8L-447.2,24.6L-441.8,27.6L-447.4,15.6L-439.7,14.5L-454.1,6.4L-461.6,-2.9L-461.8,-8.9L-455.5,-18.9L-436.1,-31.6L-436.1,-48.9L-474.6,-48.0L-476.6,-52.9L-481.7,-54.0L-492.5,-90.2L-518.9,-102.6L-520.0,-172.4L-504.5,-181.4L-497.6,-196.2L-493.0,-198.3L-458.9,-264.6L-463.6,-275.0L-458.8,-293.2L-460.9,-299.6L-450.1,-318.0L-446.1,-336.5L-434.4,-344.2L-440.4,-344.5L-398.6,-480.0L-38.9,-480.0L-48.1,-469.0L-59.0,-464.4L-64.3,-465.7L-62.6,-471.4L-67.8,-473.6L-77.7,-461.7L-83.2,-445.1L-95.4,-437.1L-110.3,-437.1L-91.0,-432.9L-85.7,-419.1L-85.4,-433.5L-80.9,-435.0L-77.8,-431.2L-78.5,-419.6L-97.2,-411.7L-106.4,-400.9L-113.7,-379.5L-100.3,-373.6L-90.5,-380.6L-79.8,-370.7L-100.5,-358.6L-104.9,-368.3L-111.4,-363.3L-124.9,-364.0L-126.9,-359.6L-116.5,-359.5L-108.1,-349.0L-101.5,-348.8L-101.2,-352.8L-93.4,-347.4L-83.0,-360.1L-75.8,-362.3L-59.0,-360.8L-56.2,-356.4L-46.2,-353.6L-29.2,-354.2ZM143.3,-292.0L143.9,-288.3L139.0,-285.3L143.8,-285.1L145.2,-279.7L139.3,-273.2L143.3,-266.7L134.9,-258.6L114.3,-270.2L121.4,-261.7L86.2,-270.6L87.0,-278.0L81.1,-275.6L78.6,-285.5L74.1,-277.8L73.7,-282.9L65.5,-276.6L53.6,-278.3L51.4,-285.0L41.2,-285.9L43.1,-295.9L38.9,-295.8L38.2,-287.5L31.3,-286.6L35.2,-283.6L32.3,-281.7L27.1,-282.5L20.5,-290.7L26.0,-293.5L26.5,-306.7L22.8,-307.8L25.8,-319.0L30.2,-320.4L26.9,-322.1L31.5,-323.7L39.6,-315.7L50.4,-317.5L49.8,-312.7L41.1,-306.5L42.4,-303.3L50.4,-300.5L43.8,-307.7L57.9,-308.2L55.0,-310.2L57.1,-315.8L66.0,-313.7L68.7,-308.4L64.2,-301.0L67.7,-300.4L71.2,-306.9L92.8,-312.3L92.1,-305.6L80.9,-296.4L92.1,-301.9L102.2,-291.5L109.1,-292.6L99.6,-298.2L97.4,-309.1L104.8,-311.1L100.3,-314.8L104.0,-317.9L108.5,-311.8L107.8,-320.5L118.9,-320.7L119.4,-323.8L126.1,-315.5L124.3,-311.9L131.4,-310.1L128.5,-303.6L140.2,-297.7L136.0,-291.0ZM-378.1,9.4L-383.6,-5.5L-380.9,-24.3L-375.8,-3.7ZM-419.7,8.2L-426.5,15.9L-417.6,33.8L-428.1,31.7L-428.9,12.9L-425.7,7.1ZM-133.7,-242.7L-124.3,-248.6L-115.8,-247.1L-113.6,-242.5L-115.7,-237.2L-127.8,-234.7ZM-24.8,-285.9L-23.1,-273.9L-35.6,-262.3L-39.5,-277.3ZM-232.3,-240.2L-225.7,-245.4L-218.1,-242.1L-220.9,-239.0ZM41.3,-349.1L41.7,-345.0L37.5,-338.9L31.1,-337.9L31.4,-330.1L23.8,-323.7L20.0,-327.7L9.5,-322.4L12.1,-321.3L7.3,-311.1L14.1,-296.3L10.9,-287.8L-1.1,-282.7L-7.2,-285.6L-8.3,-296.4L-2.9,-299.4L-8.5,-301.0L-9.1,-313.6L-7.7,-320.1L-2.3,-321.0L-6.2,-325.1L-1.0,-330.7L-3.1,-333.5L26.5,-337.5L27.7,-345.4ZM-159.8,-295.5L-159.5,-290.1L-171.0,-289.5L-167.6,-287.0L-183.2,-266.2L-191.2,-264.0L-191.8,-255.8L-195.7,-253.0L-200.7,-256.2L-197.7,-267.6L-189.8,-274.2L-207.8,-287.0L-198.4,-291.0L-198.9,-301.6L-190.5,-296.3ZM-375.4,-209.5L-381.5,-204.8L-377.9,-219.5L-374.7,-216.1ZM-212.8,-273.1L-210.3,-261.3L-214.4,-260.9L-223.7,-267.4L-224.7,-272.2ZM115.2,-329.7L91.7,-318.4L95.6,-316.0L81.8,-314.6L75.8,-308.9L65.7,-316.4L69.6,-317.8L57.7,-320.9L63.7,-323.8L57.8,-326.4L60.4,-331.4L72.9,-335.3L80.6,-330.6L82.6,-339.1L94.4,-340.2L93.9,-335.5L98.7,-338.0ZM13.7,-350.6L14.9,-343.7L0.1,-341.6L-0.8,-346.1L5.9,-352.7L17.8,-351.5ZM74.3,-349.2L64.7,-339.9L57.2,-341.6L56.5,-348.4ZM-7.3,-375.5L-6.1,-371.2L-10.9,-368.0L-11.1,-359.2L-14.8,-358.4L-24.8,-366.1L-26.6,-361.7L-33.3,-361.4L-29.1,-359.1L-47.5,-360.5L-48.0,-368.8L-53.5,-371.7L-22.3,-387.1L-17.0,-383.8L-24.7,-380.5L-25.2,-376.2L-15.4,-374.2L-12.0,-379.2L-12.5,-374.9ZM39.6,-363.5L36.0,-359.6L37.9,-356.6L33.8,-354.8L10.0,-360.1L12.8,-368.4L21.8,-365.9L24.6,-375.3L29.1,-374.2L36.5,-379.2L37.9,-373.9L29.7,-371.3L38.2,-368.6L28.7,-364.7ZM91.9,-367.2L90.5,-362.7L81.1,-361.3L83.4,-358.9L77.2,-355.2L59.4,-355.1L70.4,-362.9L69.1,-366.4L72.6,-364.5L73.2,-369.7L77.5,-370.4L76.1,-366.0L80.0,-364.8L84.4,-365.5L82.8,-368.6ZM-5.5,-392.2L-46.6,-401.6L-56.1,-398.6L-68.6,-387.5L-73.7,-387.2L-76.6,-388.6L-71.6,-394.2L-74.2,-399.9L-79.5,-400.3L-79.5,-394.6L-86.7,-395.7L-86.8,-404.1L-81.5,-412.5L-68.4,-419.2L-73.1,-425.7L-73.1,-436.7L-64.7,-459.1L-51.3,-457.9L-38.2,-470.1L-26.5,-470.3L-37.6,-442.6L-28.2,-448.7L-17.0,-466.4L-8.4,-467.2L-8.5,-455.9L-3.1,-463.0L4.5,-465.3L14.9,-455.7L15.4,-435.3L3.7,-438.6L4.3,-430.5L-2.7,-425.6L-8.5,-426.8L-9.2,-420.9L-1.1,-420.7L-4.1,-417.3L-28.6,-415.3L-2.6,-408.5L-8.2,-401.0L-0.3,-401.0L-0.7,-394.0ZM56.9,-393.4L36.1,-390.9L39.8,-388.0L35.8,-385.2L22.8,-392.1L28.0,-402.1L26.0,-415.7L30.3,-423.7L35.1,-424.0L33.8,-412.8L36.7,-409.3L40.2,-420.0L45.5,-418.2L42.0,-425.0L51.4,-431.8L53.7,-425.7L61.9,-421.9L63.8,-413.2L41.3,-407.6L36.7,-399.8L52.5,-399.3ZM87.7,-395.3L91.2,-385.0L81.8,-384.5ZM71.0,-398.6L76.5,-400.8L82.3,-397.8L78.7,-386.7L76.6,-391.3L70.5,-391.8ZM55.0,-453.3L41.9,-445.9L38.6,-447.4L40.6,-444.4L36.9,-439.5L20.0,-437.1L17.2,-465.7L8.0,-472.8L8.6,-477.4L10.6,-480.0L43.0,-479.0L50.6,-466.2L61.4,-463.8ZM83.6,-412.4L78.3,-409.2L67.0,-421.7L69.1,-424.2L76.5,-421.9L67.6,-434.3L75.3,-434.9L70.8,-437.5L69.3,-439.5L72.9,-437.1L75.7,-442.7L82.1,-438.6L80.6,-434.3L86.8,-420.0L81.7,-414.6ZM573.6,1052.1L598.3,1061.2L604.4,1055.9L612.8,1056.8L617.0,1051.4L622.7,1051.6L638.3,1062.6L644.6,1063.1L645.3,1080.0L493.4,1080.0L499.6,1070.9L508.5,1072.6L525.5,1062.4L540.5,1061.2L545.6,1054.7L563.1,1056.2ZM429.1,1080.0L441.2,1073.5L455.2,1080.0ZM483.8,976.8L505.4,990.3L505.6,1008.9L516.3,1007.9L517.8,1013.5L535.9,1017.4L536.7,1023.2L558.1,1032.1L562.0,1040.2L574.2,1043.7L580.1,1053.6L545.6,1054.7L540.5,1061.2L525.5,1062.4L508.5,1072.6L499.6,1070.9L493.4,1080.0L455.2,1080.0L441.2,1073.5L429.1,1080.0L347.9,1078.9L348.9,1070.1L345.6,1067.6L364.0,1043.4L371.6,1043.7L382.6,1037.3L388.0,1041.4L402.5,1033.6L418.3,1030.9L426.9,1020.5L423.7,1016.8L449.2,1010.4L471.0,989.2L473.0,980.8ZM250.3,395.2L258.2,396.3L260.4,397.7L261.6,400.1L259.4,405.9L263.7,406.6L267.1,409.3L269.9,407.1L270.8,407.9L270.6,414.6L267.9,413.1L266.6,413.8L266.5,419.5L264.4,417.3L260.4,418.4L258.9,415.5L257.5,415.2L256.7,419.6L254.1,423.1L254.2,425.6L252.7,426.2L251.8,422.3L247.6,419.1L246.7,415.7L243.5,418.8L243.7,420.7L240.5,424.5L237.2,423.6L232.1,425.2L228.4,420.1L228.6,415.6L225.0,415.0L221.6,417.2L221.7,419.1L218.4,420.0L220.5,417.0L220.8,413.0L224.1,409.9L224.9,406.9L231.6,400.6L230.7,398.8L232.9,397.8L235.7,399.1L238.1,396.5L247.6,397.1L249.7,395.5L247.6,395.5L249.8,393.3ZM-10.4,976.0L0.2,980.2L7.1,990.8L12.7,993.2L25.3,989.9L41.7,999.6L43.0,1019.4L28.0,1042.2L34.9,1065.6L-19.0,1058.9L-51.8,1063.3L-47.8,1041.4L-66.1,1026.9L-60.6,1019.8L-62.8,1010.9L-57.9,1011.8L-53.2,1005.1L-56.5,997.8L-47.1,1001.0L-51.2,993.4L-48.1,989.5L-52.9,982.1L-52.3,974.9L-44.1,969.4L-32.7,975.6L-25.9,973.6L-25.2,969.8L-18.4,970.0L-17.2,978.1ZM828.1,871.3L828.0,881.4L809.3,888.9L806.9,878.1L813.1,862.5L818.5,861.8L823.7,854.0L830.7,862.1L821.4,874.2ZM246.8,576.0L241.4,581.2L243.4,583.5L241.7,592.4L243.7,602.5L241.1,611.2L231.5,620.5L230.7,625.2L234.3,634.7L238.5,637.5L240.9,641.2L242.3,647.2L252.0,654.5L258.8,684.4L256.6,686.5L262.4,698.7L263.9,708.3L263.1,716.6L264.7,723.3L262.2,732.4L263.9,743.7L258.2,747.5L256.5,750.8L265.5,764.0L266.3,772.0L269.7,776.4L272.5,778.2L277.2,777.1L287.6,782.4L290.6,781.9L297.1,793.5L224.8,835.9L196.3,857.6L155.3,861.9L152.8,859.1L154.6,854.0L154.2,848.5L146.3,844.5L141.4,843.5L138.7,840.1L132.2,838.8L128.6,834.1L122.9,830.7L121.5,824.6L67.0,778.0L-16.1,699.1L-11.2,676.6L6.0,669.8L12.5,668.8L18.0,670.6L32.4,671.4L36.0,673.6L40.9,668.3L46.3,665.4L56.7,660.6L66.3,659.6L68.7,655.2L66.1,650.5L68.5,644.9L80.6,643.6L81.0,638.5L93.6,639.6L104.5,642.6L104.7,638.4L108.0,636.1L101.9,628.2L102.6,626.1L100.6,621.8L102.1,617.6L100.8,615.1L102.4,608.8L101.5,603.8L102.4,602.2L101.2,599.9L102.2,598.0L96.9,591.5L101.1,592.1L109.0,589.4L112.0,585.7L115.5,583.7L119.9,584.4L123.8,581.7L125.1,583.4L127.8,583.9L134.1,578.2L144.4,574.6L161.7,573.9L164.6,575.0L170.5,571.9L172.7,573.3L182.7,571.3L194.8,572.6L201.9,577.1L213.8,573.5L217.5,570.7L224.1,574.1L227.5,573.3L228.3,571.3L236.7,575.3L247.1,574.0ZM488.0,641.5L495.2,638.5L514.1,638.4L518.0,640.1L522.3,639.0L525.2,640.4L532.0,639.3L541.6,641.0L545.5,638.9L558.0,626.2L566.9,621.5L574.1,621.6L579.0,619.5L591.8,623.5L596.3,620.6L598.5,621.1L605.2,618.0L611.5,612.6L628.8,638.6L627.5,642.2L627.1,660.6L628.2,664.8L626.2,669.1L619.8,667.7L609.1,660.9L606.2,654.2L598.3,648.8L594.9,642.5L593.3,642.0L592.6,648.5L596.8,651.4L599.5,657.9L609.1,666.2L616.3,670.5L616.6,674.4L622.8,679.4L626.4,684.5L626.6,687.7L653.3,716.9L663.6,722.2L660.2,724.5L662.0,730.7L665.3,735.7L660.6,743.0L656.4,743.8L654.4,753.4L647.1,757.5L646.3,761.2L606.6,772.7L604.9,770.9L601.7,774.1L505.0,796.1L487.6,680.4L481.0,665.5L483.7,655.7L480.2,645.1L483.6,640.0L484.1,641.6ZM-161.4,757.6L-165.7,763.8L-159.8,749.8L-155.6,744.8L-150.5,743.8L-133.1,722.4L-117.4,714.5L-105.1,693.0L-90.1,688.5L-80.7,675.5L-15.0,693.5L-20.6,719.9L-69.6,707.4L-78.5,746.9L-97.4,751.9L-101.4,776.5ZM760.1,838.1L761.8,832.4L767.8,837.3L784.7,837.6L823.7,854.0L818.5,861.8L813.1,862.5L782.1,846.9L768.7,845.5L755.6,851.4L752.6,849.5L743.3,856.5L732.3,853.3L728.2,865.0L723.2,863.4L711.6,868.8L707.7,856.8L711.5,836.3L710.0,823.8L727.3,809.1L730.7,800.4ZM701.5,383.0L700.8,387.9L708.6,390.5L709.3,393.8L708.2,395.0L701.0,396.7L692.7,396.2L690.4,400.5L677.5,410.3L671.2,412.0L663.7,408.3L661.7,409.4L661.5,412.1L657.2,412.8L653.5,415.6L650.0,415.9L650.6,410.4L649.3,407.6L640.9,397.8L637.3,397.7L633.0,395.4L626.2,396.3L621.0,394.4L621.6,390.9L626.9,388.8L640.1,388.8L653.6,383.6L659.0,385.1L665.8,385.0L668.0,387.1L669.6,387.0L675.3,380.6L678.8,381.1L679.4,378.7L682.2,378.2L685.3,379.5L689.9,378.0L690.8,382.7ZM806.9,878.1L809.3,888.9L828.0,881.4L825.3,889.6L829.2,893.8L854.1,904.7L904.0,898.4L920.0,891.4L883.5,959.6L861.3,970.3L834.7,995.5L822.8,1000.6L814.1,998.8L794.7,1019.3L770.8,1024.3L747.1,1019.4L733.6,1023.1L727.9,1019.1L726.2,1011.6L718.1,1013.4L713.7,1009.9L708.6,997.8L685.1,986.8L671.9,986.5L674.5,977.2L688.6,970.4L686.9,938.2L696.1,931.5L696.3,916.2L703.1,900.5L710.8,895.4L712.5,869.9L723.2,863.4L728.2,865.0L732.3,853.3L743.3,856.5L760.0,847.6L782.1,846.9L813.1,862.5ZM134.0,134.3L135.3,138.5L135.0,139.5L134.4,138.4L134.1,141.3L132.6,137.8L131.0,139.1L129.3,137.6L132.0,134.6ZM91.0,982.0L89.2,987.2L96.2,997.7L93.5,1006.3L98.2,1008.9L95.4,1018.8L100.0,1025.3L95.9,1048.3L106.8,1060.3L101.2,1064.7L87.5,1064.2L47.5,1074.1L28.3,1066.2L34.9,1065.6L29.1,1038.8L43.0,1019.4L39.1,981.6L41.5,976.2ZM-140.6,915.1L-145.0,915.5L-143.3,924.0L-159.3,922.9L-165.9,927.9L-170.5,923.7L-170.3,912.7L-182.4,909.9L-184.2,906.4L-180.6,902.8L-190.4,898.9L-139.8,909.1ZM194.4,-220.4L197.3,-218.5L196.6,-214.9L194.5,-214.5L187.5,-218.7L183.0,-219.2L183.0,-217.5L188.7,-217.0L193.2,-213.2L197.9,-212.0L195.8,-207.5L197.9,-206.9L198.0,-205.3L200.2,-203.4L200.1,-199.5L195.5,-196.4L189.2,-197.2L177.7,-204.0L167.5,-201.6L174.9,-201.2L182.0,-198.6L185.6,-195.7L183.4,-192.3L179.3,-191.6L177.8,-190.0L185.5,-190.0L190.0,-193.3L193.0,-191.9L188.1,-184.0L176.9,-176.0L188.0,-180.8L193.4,-184.9L192.9,-180.8L194.9,-180.7L196.7,-178.6L201.9,-181.8L207.8,-180.0L210.4,-175.8L210.2,-173.1L208.5,-171.1L201.3,-168.7L198.8,-166.1L195.2,-165.6L191.9,-168.1L187.3,-168.1L188.5,-165.9L191.4,-165.1L191.4,-162.5L188.9,-160.4L184.1,-162.9L181.5,-161.8L181.5,-163.5L178.2,-161.3L176.4,-158.9L181.8,-160.6L185.2,-159.6L185.1,-158.0L182.0,-155.0L179.5,-156.0L177.4,-155.0L170.4,-142.3L167.2,-145.3L165.6,-144.8L153.9,-130.4L154.6,-129.5L159.1,-132.3L162.5,-128.9L161.5,-125.5L159.6,-125.2L158.4,-126.7L157.0,-123.3L157.8,-120.3L161.1,-118.8L159.5,-114.7L156.2,-113.1L151.5,-117.7L146.0,-114.6L145.0,-118.8L142.8,-117.6L142.6,-110.4L146.2,-111.7L145.6,-109.4L147.3,-108.9L147.3,-106.2L141.6,-91.7L139.8,-91.3L139.0,-93.7L136.1,-94.7L133.3,-86.2L136.6,-88.7L135.1,-83.3L138.5,-80.9L138.2,-79.9L133.6,-77.2L131.6,-78.4L130.8,-80.8L128.6,-78.0L125.7,-78.2L123.5,-81.5L121.8,-80.3L121.4,-78.0L123.3,-77.4L126.3,-72.7L122.4,-68.0L113.2,-68.9L110.0,-75.3L110.2,-79.6L106.1,-77.7L99.1,-76.7L95.9,-77.6L97.8,-75.0L102.8,-76.3L107.2,-73.5L111.2,-62.4L103.8,-52.6L99.5,-62.4L100.9,-70.7L92.1,-69.7L98.6,-68.8L96.5,-64.0L91.9,-61.4L95.6,-60.7L99.7,-50.3L98.1,-47.1L99.9,-44.9L97.3,-40.9L100.6,-40.9L92.7,-26.4L90.4,-27.6L90.8,-31.5L87.7,-29.1L84.8,-31.1L83.5,-35.0L85.4,-45.7L82.4,-52.2L78.2,-55.6L76.5,-62.8L76.2,-55.5L81.3,-51.3L81.3,-48.3L77.3,-46.3L73.3,-46.4L68.3,-49.8L60.9,-44.0L62.2,-42.9L68.0,-46.9L78.0,-44.8L77.5,-40.3L75.9,-38.9L69.1,-39.6L67.4,-38.0L58.7,-37.9L61.0,-35.2L65.1,-36.3L68.5,-34.7L74.6,-34.4L79.5,-27.2L85.4,-22.5L85.1,-21.3L54.6,-14.2L45.7,-15.3L34.4,-17.5L32.4,-19.9L29.1,-18.9L25.9,-19.7L21.9,-22.2L20.7,-25.2L21.0,-31.5L19.2,-26.2L16.6,-23.1L8.7,-22.4L-6.8,-13.8L-12.9,-12.0L-18.0,-13.0L-25.6,-12.1L-27.2,-13.4L-33.8,-11.3L-31.4,-14.3L-35.6,-13.9L-36.8,-15.4L-29.1,-21.1L-29.6,-23.2L-38.9,-17.6L-42.4,-18.5L-46.8,-22.8L-55.7,-19.1L-58.0,-21.5L-60.6,-21.9L-63.0,-13.8L-68.3,-11.4L-73.8,-4.6L-92.3,1.4L-97.0,-0.8L-104.9,9.9L-122.9,21.3L-128.5,22.3L-132.3,27.4L-137.4,27.1L-140.0,24.8L-142.9,14.7L-138.8,9.5L-142.2,0.1L-140.7,-2.5L-148.9,-8.4L-149.5,-10.4L-145.2,-19.5L-142.8,-29.1L-138.2,-34.3L-138.0,-39.6L-126.8,-61.1L-119.3,-68.1L-115.0,-69.1L-117.2,-66.9L-113.2,-66.2L-111.7,-68.0L-109.7,-68.0L-108.4,-67.5L-108.3,-64.1L-106.9,-65.4L-106.8,-69.1L-110.3,-70.1L-111.0,-71.5L-121.1,-70.7L-108.6,-81.4L-106.5,-86.6L-108.1,-86.3L-106.3,-87.7L-106.0,-90.7L-99.1,-98.9L-89.5,-104.8L-85.6,-110.1L-70.9,-117.3L-70.9,-115.8L-66.8,-115.8L-64.7,-118.9L-59.7,-120.8L-57.7,-118.3L-57.6,-113.6L-54.2,-111.7L-48.7,-115.2L-44.5,-114.1L-44.6,-117.4L-34.7,-121.3L-33.8,-123.0L-37.6,-131.1L-36.5,-136.9L-37.1,-142.4L-34.6,-146.1L-31.6,-145.8L-29.6,-140.9L-29.9,-133.0L-28.2,-132.9L-29.2,-131.1L-28.1,-129.1L-23.1,-133.2L-18.0,-143.3L-22.8,-145.0L-18.9,-146.9L-13.9,-145.4L-17.9,-150.1L-14.3,-152.0L-13.5,-153.8L-22.4,-152.6L-25.1,-154.8L-24.6,-159.3L-19.9,-161.9L-20.0,-163.2L-18.5,-162.4L-13.8,-164.0L-13.7,-165.2L-8.8,-168.3L-9.7,-170.1L-7.7,-172.0L-3.4,-168.3L-2.1,-168.5L-2.2,-172.2L2.5,-174.6L4.3,-176.6L3.8,-177.9L9.1,-180.5L14.7,-186.5L19.5,-189.4L23.0,-193.8L24.8,-199.0L33.1,-205.8L36.2,-217.7L35.2,-220.8L36.1,-226.7L32.1,-227.9L33.8,-230.3L29.1,-232.9L31.4,-235.6L29.3,-238.4L25.5,-237.3L26.2,-243.7L30.8,-248.5L36.2,-246.2L35.3,-250.2L38.2,-253.7L36.9,-255.5L40.2,-257.8L42.7,-257.3L44.3,-251.5L47.6,-250.1L48.7,-244.6L52.9,-244.4L54.5,-246.5L50.9,-249.9L51.6,-252.2L49.8,-252.8L49.4,-256.0L53.3,-259.4L52.8,-261.7L55.1,-265.7L60.4,-268.5L65.0,-267.7L71.0,-260.7L76.2,-258.5L80.3,-252.3L84.0,-251.2L88.7,-251.2L96.9,-253.5L95.1,-259.1L98.1,-261.5L113.7,-258.4L114.1,-257.0L116.4,-256.6L116.3,-254.1L117.6,-253.4L127.0,-256.4L129.6,-255.9L130.5,-253.1L128.3,-250.2L132.9,-253.1L136.8,-252.3L142.5,-247.5L139.3,-244.2L133.0,-241.0L138.5,-241.3L137.8,-236.4L140.9,-236.4L147.6,-241.2L149.6,-240.2L145.3,-226.6L146.0,-224.9L149.4,-228.3L151.0,-233.0L153.1,-235.0L155.9,-234.9L153.8,-227.2L158.6,-232.9L163.1,-229.4L161.1,-226.2L163.9,-227.4L164.0,-224.4L162.2,-221.5L165.7,-225.4L161.7,-234.5L165.7,-237.2L170.0,-235.4L169.5,-233.1L172.0,-229.7L169.8,-225.2L177.0,-231.7L180.1,-232.1L180.7,-230.5L182.5,-230.8L188.5,-227.6L193.5,-223.3ZM148.6,-91.1L146.7,-87.6L147.0,-85.8L149.0,-86.0L147.0,-83.6L146.2,-85.2L142.3,-86.4L144.9,-91.4L147.2,-90.1ZM151.2,-100.7L152.9,-109.1L155.0,-112.3L155.3,-110.6ZM159.1,-237.1L161.8,-239.2L163.1,-238.6L161.1,-235.4ZM-36.0,-122.1L-41.1,-120.4L-41.8,-121.4L-37.1,-124.1L-37.3,-125.1ZM-45.9,-125.0L-53.4,-129.3L-54.0,-132.9L-52.8,-134.4L-51.8,-132.7L-49.6,-134.5L-51.7,-134.4L-51.0,-139.9L-46.3,-141.1L-42.7,-144.2L-39.9,-143.1L-38.6,-137.9L-41.1,-131.5L-40.7,-127.3L-42.5,-125.2ZM139.3,-238.8L140.0,-243.1L143.8,-244.5L140.3,-238.9ZM-27.3,-146.2L-27.0,-149.0L-23.3,-148.9L-25.4,-146.3ZM-188.5,882.8L-183.6,880.4L-166.9,885.9L-157.8,885.0L-139.5,896.9L-148.3,897.4L-160.0,888.1L-173.3,890.7L-188.7,887.4ZM-139.8,909.1L-101.6,923.9L-101.6,930.1L-95.0,928.8L-91.2,934.6L-83.6,931.8L-74.6,936.7L-67.7,934.7L-67.2,931.3L-62.5,933.3L-60.6,946.4L-53.8,953.1L-59.1,957.3L-53.0,958.2L-53.3,966.2L-48.8,970.3L-52.9,982.1L-48.9,984.6L-51.2,993.4L-47.1,1001.0L-56.5,997.8L-53.2,1005.1L-57.9,1011.8L-65.8,1008.3L-74.0,1013.6L-79.9,1009.1L-79.2,994.2L-99.1,989.8L-95.4,985.6L-97.4,974.9L-104.6,962.5L-126.5,958.6L-137.9,967.8L-142.9,967.3L-143.6,958.8L-158.7,943.2L-160.2,932.5L-164.3,927.6L-159.3,922.9L-143.3,924.0L-145.0,915.5L-140.6,915.1ZM96.1,53.9L99.2,54.5L98.7,62.7L102.5,69.6L100.7,76.2L97.3,79.9L87.5,85.5L83.0,84.9L72.6,88.2L66.0,87.2L57.8,88.9L52.8,87.2L47.6,82.8L42.1,73.8L32.3,69.7L34.6,66.2L35.2,68.2L37.8,68.3L40.7,67.7L42.5,65.3L45.4,65.7L41.7,64.1L40.7,56.0L34.0,51.7L36.8,50.8L45.7,53.4L45.9,50.1L48.8,46.9L45.3,43.0L38.8,41.8L37.8,38.8L40.4,37.2L42.3,38.2L44.0,34.4L46.7,32.8L51.2,37.7L51.6,31.7L53.0,30.5L55.3,32.4L57.3,40.9L55.0,47.0L55.0,51.2L61.9,48.7L65.5,43.8L68.0,49.5L70.8,46.9L74.7,46.8L76.6,52.8L78.6,49.0L82.9,51.7L88.9,51.5L91.9,48.1L93.9,48.3ZM672.5,578.9L649.1,596.6L666.7,607.7L663.5,611.8L662.3,618.0L653.0,623.9L651.0,630.8L645.8,638.1L630.1,640.5L628.3,620.9L629.4,612.2L624.2,585.5L626.6,582.7L628.4,582.5L631.9,584.8L637.2,585.5L642.6,584.3L663.3,558.0L671.2,569.6L671.6,572.8L675.3,572.5ZM794.7,1019.3L814.1,998.8L822.8,1000.6L834.7,995.5L822.6,1019.6L832.0,1073.4L840.2,1080.0L716.5,1080.0L720.8,1067.7L717.8,1059.4L706.7,1048.8L706.6,1043.9L697.4,1037.8L703.2,1029.7L747.1,1019.4L770.8,1024.3ZM997.5,99.0L994.2,125.0L996.8,132.6L988.7,146.1L993.1,158.4L989.3,166.5L984.1,163.7L980.4,172.8L979.5,186.7L985.1,195.8L975.8,214.9L965.2,217.7L962.4,225.9L947.3,238.2L943.9,229.1L946.2,223.8L953.1,221.7L955.0,210.8L960.8,206.8L962.8,187.8L950.1,193.1L945.0,191.5L945.4,200.2L932.8,204.9L932.8,188.0L928.5,188.7L926.5,179.7L946.6,163.1L940.7,154.9L942.8,146.0L956.0,139.1L976.4,107.1L990.6,98.4ZM622.7,575.8L625.2,584.2L624.2,585.5L625.0,589.5L620.0,588.7L618.2,591.1L618.1,595.5L619.6,600.8L623.1,600.8L620.7,604.3L620.5,608.4L624.3,607.7L628.0,604.2L629.4,612.2L628.3,620.9L629.6,627.6L628.8,638.6L612.6,614.0L615.0,607.9L614.1,607.0L615.6,600.0L615.7,580.4L620.4,579.0L621.2,575.9ZM122.1,271.5L124.4,269.3L126.2,268.8L126.3,270.8L124.3,273.2L122.0,274.1ZM704.4,469.8L707.5,466.9L711.2,471.0L715.9,465.1L719.2,470.1L722.1,471.2L723.3,474.0L726.7,474.6L730.6,479.4L736.6,479.8L742.7,477.3L740.9,481.7L745.9,488.4L743.5,491.0L742.7,496.8L744.1,499.5L741.9,502.3L744.6,505.7L744.9,510.4L757.7,516.2L759.9,521.1L765.1,520.1L775.7,522.0L779.6,521.4L788.8,527.9L789.8,535.3L791.9,540.2L796.5,539.5L800.1,546.3L805.8,548.1L809.6,551.7L797.7,555.1L792.1,559.4L791.6,570.8L789.6,578.0L787.4,579.8L764.6,588.5L721.4,576.0L692.3,571.8L675.0,575.0L674.4,571.9L671.6,572.8L671.2,569.6L663.3,558.0L686.2,529.4L686.8,522.7L683.8,513.0L683.8,508.1L678.9,499.1L679.5,494.3L684.0,490.5L687.0,480.2L689.3,478.2L690.6,473.7ZM1100.0,448.4L1112.6,436.3L1111.3,442.4L1120.4,445.3L1121.1,434.4L1127.9,432.7L1126.5,425.4L1120.9,426.5L1118.5,418.4L1104.7,409.7L1096.6,412.4L1091.3,403.5L1082.4,407.6L1078.8,385.0L1081.4,379.0L1087.0,379.9L1094.7,364.9L1091.7,349.8L1093.9,338.5L1089.0,321.7L1091.3,312.7L1088.1,292.6L1079.1,284.5L1082.2,262.5L1078.8,255.6L1080.7,244.7L1090.8,239.7L1093.2,233.4L1098.6,234.1L1100.8,229.3L1108.0,234.9L1113.1,234.0L1120.2,241.3L1126.3,241.7L1130.0,236.6L1130.0,437.6L1125.0,448.2L1122.0,460.3L1115.8,465.1L1106.6,466.8L1101.1,461.7L1111.8,447.4L1110.9,444.7ZM1129.3,478.1L1117.7,474.9L1128.5,458.4L1130.0,443.4ZM720.3,431.3L735.5,406.9L741.3,409.3L742.0,419.6L754.4,420.1L763.1,430.7L777.0,427.3L792.9,430.6L802.7,427.1L823.8,408.8L818.9,401.2L826.5,393.6L827.1,383.1L846.2,362.3L851.7,365.1L875.0,355.8L893.5,359.7L901.0,353.3L912.6,366.3L920.2,387.9L918.6,395.1L924.5,400.6L927.6,399.2L928.1,407.4L945.3,427.9L956.2,422.4L959.9,425.4L959.9,451.6L980.8,460.2L995.3,456.4L1004.5,470.7L1010.9,467.0L1013.5,475.6L1002.2,494.2L1007.7,511.8L974.9,532.6L951.0,542.7L932.7,528.7L925.7,533.7L912.9,554.8L898.1,560.3L875.3,557.0L860.2,560.1L827.8,536.9L822.7,542.3L812.3,542.1L813.9,547.3L809.1,551.2L800.1,546.3L796.5,539.5L791.9,540.2L788.8,527.9L779.6,521.4L759.9,521.1L757.7,516.2L744.9,510.4L741.9,502.3L745.9,488.4L740.9,481.7L742.7,477.3L730.6,479.4L710.0,458.0L704.4,456.9L704.3,449.3L692.7,435.7L695.5,427.7L711.8,433.1ZM1128.9,-468.6L1122.1,-463.9L1107.0,-480.0L1130.0,-480.0ZM803.0,554.4L809.3,555.8L803.6,565.3L808.3,563.7L817.9,573.6L808.5,578.7L802.7,573.6L789.6,578.0L792.1,559.4ZM764.4,40.4L767.4,35.0L770.3,35.5L777.6,38.7L783.5,44.2L786.4,41.5L787.5,35.5L793.8,36.5L793.1,33.5L797.7,30.6L799.5,27.5L802.4,33.6L805.0,34.4L806.2,29.8L809.8,26.8L808.3,10.5L810.8,-1.5L814.2,3.8L834.8,1.1L876.1,6.9L876.8,4.0L874.1,-2.9L876.7,-4.9L880.0,-4.2L885.5,-6.4L889.2,-13.9L889.2,-21.7L890.8,-24.8L895.8,-27.4L905.3,-26.8L911.2,-30.1L918.7,-29.9L923.7,-36.6L922.5,-44.3L926.4,-43.0L934.8,-44.6L933.2,-40.1L939.8,-32.3L939.3,-22.2L944.4,-16.5L954.4,-11.6L956.7,-7.6L956.8,1.4L953.9,1.9L951.0,8.5L943.3,15.9L961.2,39.3L962.8,40.0L965.9,38.8L968.8,42.0L965.5,47.5L961.7,48.9L957.1,67.5L957.5,70.3L959.4,70.9L960.9,68.4L963.0,67.7L970.5,74.0L981.1,78.1L985.7,81.4L985.9,85.7L988.2,87.1L988.9,92.1L995.5,97.1L990.6,98.4L987.2,102.1L981.1,102.8L976.4,107.1L972.9,113.3L964.3,122.8L961.7,129.3L958.1,133.1L957.8,136.6L956.0,139.1L952.6,142.0L942.8,146.0L940.7,154.9L946.6,163.1L930.2,173.7L926.5,179.7L926.9,184.2L929.8,189.3L930.0,195.4L927.6,196.4L928.0,205.3L925.2,218.7L926.5,228.6L929.7,231.6L928.7,233.5L923.2,234.4L921.2,231.1L917.8,231.0L905.9,241.7L898.1,234.5L892.7,237.4L883.1,224.8L880.8,226.9L875.2,223.6L866.0,221.9L862.2,228.9L851.9,237.6L841.7,250.6L825.8,247.6L790.2,248.6L772.6,275.3L806.3,327.8L803.0,331.6L800.9,332.2L789.0,326.6L779.1,326.3L772.4,332.5L766.3,346.8L760.3,331.4L752.2,333.7L746.7,332.1L743.3,332.9L731.2,323.1L723.8,322.3L722.0,320.7L722.9,317.2L731.0,313.5L725.8,309.3L726.8,299.9L739.3,290.2L736.8,287.8L734.8,279.1L729.1,269.7L724.5,269.0L718.8,274.6L708.3,277.2L696.7,296.2L695.9,299.8L687.0,298.7L689.4,294.5L681.2,288.0L672.5,285.9L665.4,289.9L660.0,284.3L653.2,282.2L651.8,270.8L648.3,267.6L646.0,261.7L646.8,256.5L645.9,251.5L646.4,249.2L649.7,248.6L658.0,252.3L660.6,250.1L660.6,246.4L655.0,239.5L658.3,233.6L658.2,227.9L662.8,220.6L664.7,211.2L668.2,210.0L671.5,210.8L676.1,203.7L681.7,204.3L688.5,200.1L700.7,202.1L706.0,205.4L706.0,199.8L715.3,198.1L718.0,187.1L722.3,182.8L727.3,181.9L728.1,177.5L730.6,175.0L734.0,174.0L738.8,175.6L746.9,173.3L748.5,171.0L748.8,166.6L752.6,165.5L757.0,161.1L758.1,156.4L753.6,149.5L742.8,152.0L736.9,150.7L738.6,140.4L733.4,136.5L732.6,131.8L738.4,123.6L735.0,123.4L729.7,125.1L728.3,121.8L724.7,122.3L722.2,117.3L722.8,114.7L731.4,108.3L734.1,99.5L743.5,85.8L743.4,79.8L747.4,74.6L754.9,58.0L754.0,53.7L755.5,45.8L760.0,42.1ZM625.9,568.8L620.4,579.0L615.7,580.4L618.5,563.6L617.7,559.1L620.5,553.8L620.1,551.9L625.2,549.8L630.4,555.3L627.9,561.3L628.8,562.8L625.3,564.4L624.5,567.6ZM212.5,960.5L228.7,955.8L246.7,963.6L258.4,964.4L277.7,955.7L307.9,959.6L315.1,952.9L327.9,948.9L336.0,958.5L338.2,969.0L346.4,972.4L346.3,981.5L334.8,986.9L322.2,1013.4L316.6,1017.1L315.1,1026.0L305.8,1033.0L292.0,1060.4L286.5,1061.6L276.5,1053.8L266.0,1055.6L245.7,1071.9L244.3,1080.0L181.1,1080.0L167.4,1062.4L134.1,1058.8L137.5,1018.6L142.8,1016.4L156.9,995.8L151.7,981.4L155.7,964.9L163.1,958.4L164.6,950.8L189.0,945.5L203.2,949.8ZM1107.0,-480.0L1119.8,-467.3L1120.5,-455.1L1125.5,-451.6L1124.5,-446.4L1121.9,-447.7L1122.9,-442.0L1111.4,-451.1L1097.6,-453.3L1096.7,-446.2L1098.8,-443.4L1091.5,-441.0L1072.0,-463.3L1053.6,-475.8L1056.3,-480.0ZM953.0,-361.2L985.3,-345.9L991.7,-349.3L986.7,-359.8L989.3,-365.8L982.6,-371.4L981.3,-380.3L991.9,-392.5L998.9,-393.8L1007.1,-364.9L1014.0,-353.6L1029.4,-340.6L1031.8,-328.3L1044.4,-312.8L1040.5,-299.4L1042.2,-291.8L1053.1,-284.4L1063.2,-288.2L1080.3,-263.3L1085.1,-250.3L1085.3,-224.5L1096.8,-188.6L1092.4,-183.7L1090.9,-171.1L1074.2,-144.0L1072.8,-126.1L1062.4,-91.1L1039.3,-88.5L1035.8,-91.0L1033.0,-84.0L1019.9,-75.3L1006.4,-48.1L1000.4,-48.7L985.5,-61.7L968.4,-62.5L953.7,-50.0L939.9,-47.6L932.7,-57.5L934.3,-73.6L930.9,-75.5L925.2,-109.6L931.9,-114.9L935.1,-126.1L944.3,-126.7L954.8,-152.8L948.7,-165.0L931.7,-168.6L919.7,-183.9L935.9,-211.6L948.9,-210.1L957.4,-221.8L953.2,-241.4L955.9,-255.0L962.8,-266.6L972.0,-271.3L974.1,-295.0L966.0,-319.0L951.9,-336.6L955.6,-348.5ZM10.0,744.0L4.2,879.6L7.9,885.8L3.9,896.7L-59.6,881.8L-67.2,884.4L-82.0,880.0L-86.6,883.4L-94.5,873.4L-106.6,884.5L-117.0,875.1L-124.6,857.8L-131.5,854.7L-138.3,844.3L-167.3,836.5L-174.6,842.2L-160.0,813.4L-162.1,791.1L-155.1,778.8L-161.9,761.4L-165.4,765.1L-161.4,757.6L-101.4,776.5L-97.4,751.9L-78.5,746.9L-69.6,707.4L-20.6,719.9L-16.1,699.1L35.3,748.6ZM344.9,799.8L349.4,823.5L362.8,841.2L359.5,848.9L357.7,896.6L325.3,937.3L327.9,948.9L315.1,952.9L307.9,959.6L277.7,955.7L258.4,964.4L246.7,963.6L228.7,955.8L212.5,960.5L203.2,949.8L189.0,945.5L173.1,946.9L164.6,950.8L163.1,958.4L155.7,964.9L153.9,977.6L141.1,965.7L133.4,967.5L133.2,972.8L128.8,966.1L129.9,961.3L120.0,959.7L111.1,953.1L113.1,947.1L101.3,936.0L99.3,920.4L154.2,919.8L162.1,913.4L168.7,893.2L170.6,860.9L196.3,857.6L224.8,835.9L297.1,793.5L320.0,797.8L332.2,805.9ZM944.8,563.6L963.7,571.6L985.7,563.8L1006.5,568.7L1008.6,572.2L1005.2,612.0L999.1,612.7L997.9,621.1L1005.8,639.7L994.1,652.0L992.9,668.9L981.3,678.7L980.2,694.9L955.3,717.0L925.7,690.8L961.0,649.3L956.7,614.5L945.8,607.6L941.2,586.5L946.5,580.3L942.6,579.9L938.3,568.8L943.2,569.1ZM621.6,608.8L620.5,608.4L620.7,604.3L623.1,600.8L619.6,600.8L618.1,595.5L618.2,591.1L620.0,588.7L625.0,589.5L627.8,599.5L628.0,604.2ZM612.6,614.0L611.5,612.6L614.1,607.0L615.0,607.9ZM879.4,615.1L873.8,613.4L868.8,603.0L870.4,588.9L876.5,590.4L882.5,602.4ZM1017.9,253.3L1030.5,246.1L1033.5,249.3L1038.0,247.5L1039.9,263.1L1056.7,277.5L1069.0,270.4L1072.5,273.5L1081.3,269.7L1079.1,284.5L1088.1,292.6L1094.7,364.9L1087.0,379.9L1079.3,381.0L1079.4,401.5L1082.4,407.6L1091.3,403.5L1096.6,412.4L1104.7,409.7L1121.6,422.2L1112.1,438.0L1096.1,450.2L1087.2,466.7L1079.3,458.0L1069.7,464.9L1067.0,459.7L1061.7,457.1L1059.1,457.7L1042.9,481.5L1034.8,482.9L1028.9,493.4L1011.4,511.8L1007.7,511.8L1002.2,494.2L1013.5,475.6L1010.9,467.0L1004.5,470.7L995.3,456.4L980.8,460.2L959.9,451.6L982.3,442.9L999.9,427.1L1018.4,400.0L1010.2,383.8L1011.1,375.6L1019.6,364.5L1016.7,362.7L1019.4,353.1L1029.4,345.7L1020.0,322.1L1023.7,310.5L1013.3,305.8L1023.0,292.7L1017.7,286.7L1016.2,272.4L1002.8,264.5L1004.2,245.5L1013.7,229.6L1016.8,230.2L1011.9,237.6L1012.7,249.3ZM-60.4,1017.6L-66.1,1026.9L-47.8,1041.4L-51.8,1063.3L-81.4,1044.9L-116.9,1008.1L-89.4,989.8L-79.2,994.2L-79.9,1009.1L-70.0,1013.5L-64.5,1008.5ZM480.2,645.1L483.7,655.7L481.0,665.5L487.6,680.4L509.4,828.1L493.3,830.9L494.3,838.9L433.5,819.4L361.0,791.9L332.2,805.9L320.0,797.8L297.1,793.5L290.6,781.9L287.6,782.4L277.2,777.1L272.5,778.2L266.3,772.0L265.5,764.0L256.5,750.8L258.2,747.5L263.9,743.7L262.2,732.4L264.7,723.3L263.1,716.6L263.9,708.3L262.4,698.7L256.6,686.5L264.6,681.9L268.7,676.3L269.5,671.9L267.8,663.5L270.0,660.5L273.3,659.4L278.5,653.2L287.4,648.5L287.7,636.2L299.1,641.5L304.7,641.8L313.0,639.8L340.5,647.3L345.3,658.9L349.7,662.9L375.2,666.7L384.7,669.3L395.7,675.8L400.0,676.1L408.1,671.3L413.0,662.4L413.0,659.3L408.6,650.2L410.3,643.7L416.6,636.4L431.3,627.8L437.9,627.1L451.6,629.5L452.7,634.4L455.4,635.8L462.3,635.5L468.0,637.1L479.8,635.5L483.4,640.2ZM56.1,570.2L57.0,576.5L62.7,583.1L67.9,585.4L74.0,584.6L75.3,585.9L77.0,584.7L81.8,587.3L85.5,586.3L87.3,584.2L88.5,589.5L96.9,591.5L102.2,598.0L101.2,599.9L102.4,602.2L101.5,603.8L102.4,608.8L100.8,615.1L102.1,617.6L100.6,621.8L103.4,631.3L108.0,636.1L104.7,638.4L104.5,642.6L93.6,639.6L81.0,638.5L80.6,643.6L68.5,644.9L66.1,650.5L68.7,655.2L66.3,659.6L56.7,660.6L46.3,665.4L40.9,668.3L36.0,673.6L32.4,671.4L18.0,670.6L12.5,668.8L6.0,669.8L-11.2,676.6L-15.0,693.5L-80.7,675.5L-75.7,672.2L-63.6,673.4L-54.1,672.1L-46.0,667.0L-37.7,664.8L-31.8,661.0L-24.1,653.9L-20.7,649.0L-19.8,646.0L-22.6,641.0L-19.2,629.0L-8.9,618.6L-7.4,612.6L4.2,604.3L28.7,597.9L39.8,585.8L48.5,571.0ZM168.7,893.2L162.1,913.4L154.2,919.8L120.5,918.3L110.6,921.7L83.5,917.3L61.9,923.9L58.8,928.0L52.7,925.4L46.5,927.9L44.4,934.1L38.2,932.5L34.0,940.2L24.4,934.7L19.2,938.2L20.1,943.9L15.9,944.7L12.1,953.9L-0.2,956.1L1.2,961.8L-4.5,967.4L-6.1,976.8L-15.1,978.5L-18.4,977.0L-18.4,970.0L-25.2,969.8L-25.9,973.6L-32.7,975.6L-39.8,969.7L-49.0,972.3L-53.3,966.2L-53.0,958.2L-59.1,957.3L-53.8,953.1L-60.6,946.4L-62.5,933.3L-67.2,931.3L-67.7,934.7L-74.6,936.7L-83.6,931.8L-91.2,934.6L-95.0,928.8L-101.6,930.1L-103.9,926.9L-100.7,914.3L-109.5,901.6L-107.0,898.3L-109.8,888.8L-109.5,883.5L-102.8,883.3L-98.9,874.6L-94.5,873.4L-86.6,883.4L-82.0,880.0L-67.2,884.4L-59.6,881.8L3.9,896.7L7.9,885.8L4.2,879.6L10.0,744.0L35.3,748.6L121.5,824.6L122.9,830.7L132.2,838.8L154.2,848.5L155.3,861.9L170.6,860.9ZM841.7,250.6L866.0,221.9L880.8,226.9L883.1,224.8L892.7,237.4L898.1,234.5L905.9,241.7L917.8,231.0L928.7,233.5L925.2,218.7L930.9,187.5L932.8,204.9L945.4,200.2L945.0,191.5L950.1,193.1L962.8,187.8L960.8,206.8L951.6,218.0L946.7,217.9L946.1,210.5L940.6,209.6L938.7,220.9L935.0,222.5L939.5,230.8L940.6,246.4L932.2,256.9L934.9,260.6L944.3,258.0L954.6,265.9L960.0,284.9L946.9,294.2L940.5,285.5L925.6,291.2L884.2,295.2L864.5,285.0L849.5,294.3L835.9,284.8L818.9,288.1L811.9,307.5L817.1,320.6L806.3,327.8L772.6,275.3L790.2,248.6L825.8,247.6ZM946.7,217.9L953.6,214.6L953.1,221.7L946.2,223.8L943.9,229.1L947.3,238.2L962.4,225.9L965.2,217.7L975.8,214.9L983.9,197.5L995.8,206.4L1004.7,197.8L1020.3,209.2L1010.5,224.3L1008.4,222.2L1004.8,226.2L999.7,252.5L993.4,250.0L985.4,238.5L973.7,237.2L973.4,251.2L977.1,256.3L971.6,262.6L974.0,271.0L968.2,273.2L964.7,285.4L960.0,284.9L954.6,265.9L944.3,258.0L934.9,260.6L932.2,256.9L940.6,246.4L939.5,230.8L935.0,222.5L938.7,220.9L940.6,209.6L946.1,210.5ZM946.9,294.2L937.4,299.8L938.4,305.2L933.4,311.2L938.4,327.1L929.1,346.3L932.7,352.3L927.5,363.4L922.1,361.9L912.6,366.3L901.0,353.3L893.5,359.7L875.0,355.8L851.7,365.1L846.2,362.3L829.4,378.7L826.5,393.6L818.9,401.2L806.2,377.9L793.6,377.2L797.6,371.3L793.0,365.8L786.1,370.2L781.5,366.4L777.9,354.4L790.1,353.7L796.9,343.4L794.8,340.3L775.4,333.1L770.4,338.6L774.0,350.9L766.3,346.8L772.4,332.5L779.1,326.3L800.9,332.2L817.1,320.6L811.9,307.5L818.9,288.1L835.9,284.8L849.5,294.3L864.5,285.0L884.2,295.2L925.6,291.2L940.5,285.5ZM263.1,570.5L265.4,569.0L267.7,569.7L269.7,576.8L271.0,577.6L279.3,572.0L280.5,575.5L276.5,581.7L273.3,583.3L272.4,589.4L274.5,592.8L279.5,595.9L281.0,602.5L275.4,611.8L267.0,617.9L266.0,621.9L267.7,625.2L272.2,628.5L275.2,627.4L276.3,624.7L278.6,624.6L280.0,626.3L278.7,627.7L276.3,627.7L275.6,630.6L277.5,630.8L279.8,628.8L282.2,635.3L287.7,636.2L286.8,644.5L288.1,646.8L287.4,648.5L274.9,656.2L273.3,659.4L270.0,660.5L267.8,663.5L269.5,671.9L268.7,676.3L264.6,681.9L258.8,684.4L252.0,654.5L242.3,647.2L240.9,641.2L238.5,637.5L234.3,634.7L230.7,625.2L231.5,620.5L241.1,611.2L243.7,602.5L241.7,592.4L243.4,583.5L241.4,581.2L246.8,576.0L247.1,574.0L254.6,569.5L263.0,567.7ZM716.5,1080.0L643.4,1079.2L645.3,1060.0L660.3,1054.5L666.7,1057.1L680.8,1048.0L689.6,1047.2L697.4,1037.8L706.6,1043.9L720.8,1067.7ZM682.1,947.3L688.6,970.4L674.5,977.2L671.9,986.5L685.1,986.8L708.6,997.8L713.7,1009.9L718.1,1013.4L726.2,1011.6L730.5,1021.5L722.9,1023.8L718.4,1019.1L705.4,1027.1L689.6,1047.2L680.8,1048.0L666.7,1057.1L660.3,1054.5L649.2,1057.2L643.5,1063.4L618.2,1051.0L612.8,1056.8L592.3,1060.2L580.1,1053.6L574.2,1043.7L562.0,1040.2L558.1,1032.1L536.7,1023.2L535.9,1017.4L516.7,1011.4L531.6,979.4L542.3,976.2L556.3,987.5L579.8,981.4L583.6,984.8L594.5,982.3L613.8,963.0L629.5,967.8L638.1,964.7L654.0,940.4L647.3,928.0L656.1,924.9L657.3,920.2L664.6,918.6L668.2,941.1ZM687.3,481.4L684.0,490.5L679.5,494.3L678.9,499.1L683.8,508.1L683.8,513.0L686.8,522.7L686.2,529.4L642.6,584.3L637.2,585.5L631.9,584.8L628.4,582.5L625.2,584.2L622.0,575.6L625.9,568.8L624.5,567.6L625.3,564.4L628.8,562.8L627.9,561.3L630.4,555.3L625.2,549.8L620.1,551.9L617.5,548.0L615.5,540.1L612.7,538.0L613.1,531.5L616.0,531.7L618.4,528.2L618.0,524.8L621.1,522.9L618.3,519.0L618.0,513.7L625.2,514.1L639.3,504.5L644.9,505.7L651.3,503.7L658.0,499.4L667.9,488.6L678.6,484.2L684.2,478.4L685.9,478.4ZM494.3,838.9L501.4,898.3L484.2,904.1L485.4,909.3L476.7,921.3L479.8,927.4L472.6,934.1L476.3,940.7L469.7,950.0L480.0,951.6L484.4,966.7L491.1,970.3L490.4,976.8L473.0,980.8L471.0,989.2L449.2,1010.4L423.7,1016.8L426.9,1020.5L418.3,1030.9L402.5,1033.6L388.0,1041.4L382.6,1037.3L371.6,1043.7L364.0,1043.4L365.3,1039.9L357.5,1027.1L337.0,1011.9L340.6,1006.7L364.6,1004.8L355.9,996.5L354.2,977.4L349.1,965.5L342.4,958.7L336.0,958.5L327.9,948.9L325.3,937.3L357.7,896.6L359.5,848.9L362.8,841.2L349.4,823.5L344.9,799.8L361.0,791.9ZM103.8,993.3L112.4,1000.6L116.8,1017.1L114.3,1051.9L117.3,1057.9L106.8,1060.3L95.9,1048.3L100.0,1025.3L95.4,1018.8L98.2,1008.9L93.5,1006.3L95.8,994.2L89.2,987.2L91.0,982.0L88.2,980.0L106.3,984.3ZM169.9,324.9L162.4,324.3L160.2,324.1L158.8,324.3L168.2,326.1L167.6,327.4L169.4,326.6L170.9,328.3L175.7,328.7L174.8,332.1L171.2,333.3L170.0,335.3L162.4,337.2L157.6,335.3L151.3,335.9L150.1,333.9L147.1,334.0L144.8,331.9L145.7,333.9L138.3,334.2L138.1,336.1L132.9,335.1L128.7,332.5L125.2,332.8L122.2,334.8L119.6,339.3L115.6,337.2L114.7,334.0L113.7,335.5L108.8,335.5L104.8,337.0L102.8,340.0L100.6,337.3L98.0,337.6L98.5,336.2L102.9,335.1L106.8,331.0L111.4,328.8L113.5,324.7L115.5,325.1L117.6,322.3L128.9,324.5L135.7,317.4L126.2,320.7L121.8,315.9L117.6,315.8L120.3,314.1L115.7,312.6L110.6,313.6L109.1,308.4L119.8,304.8L124.3,300.4L122.9,299.4L122.9,294.3L118.2,294.1L124.0,289.2L132.4,288.3L134.7,290.2L134.4,288.2L135.7,287.6L136.6,289.8L138.3,290.0L136.6,288.8L135.8,285.4L138.7,283.1L136.7,281.8L139.8,275.6L136.8,276.4L133.7,268.4L137.2,262.9L140.4,261.9L136.1,261.4L131.1,263.6L127.6,261.8L126.5,264.0L123.2,260.7L121.5,262.8L120.9,258.2L127.2,251.0L125.7,246.6L126.3,243.9L127.0,242.7L130.9,244.6L127.1,242.0L128.8,238.8L124.6,244.6L122.0,243.2L121.3,245.6L123.0,246.7L122.7,250.2L121.3,249.9L120.5,247.3L118.4,250.4L116.8,250.5L123.6,232.0L119.3,234.3L115.8,233.7L116.7,229.7L121.4,226.0L122.6,222.6L118.4,219.0L116.2,214.4L120.3,212.4L122.3,218.4L126.2,218.2L123.7,217.0L125.4,210.5L129.9,209.4L131.0,204.6L135.1,199.2L141.3,201.4L151.6,201.7L150.2,206.2L142.0,211.3L141.4,215.0L138.2,217.9L136.1,218.2L138.2,218.7L145.9,216.3L157.4,218.8L159.3,222.4L149.6,236.9L142.9,239.0L146.7,238.2L148.0,241.4L140.6,244.0L136.7,241.8L143.2,246.0L146.6,244.7L152.5,250.0L155.5,254.9L157.5,269.7L156.7,271.5L157.7,270.7L162.8,274.5L166.0,280.7L165.2,283.4L167.2,288.5L165.3,288.7L164.0,287.0L159.5,287.2L163.4,287.4L167.6,292.1L168.3,298.2L165.5,300.8L167.0,303.0L170.6,300.9L175.3,301.6L181.1,305.9L181.3,309.5L178.5,316.7L173.7,318.6L175.0,319.9L173.4,321.2L170.7,320.9L171.0,323.1L167.7,323.1ZM173.4,175.1L173.8,176.7L170.6,183.2L171.2,179.0L168.6,177.0L171.4,172.0L172.1,174.2L173.0,174.0L174.2,170.5L176.6,169.0L176.2,172.1ZM145.5,337.8L143.6,335.6L146.0,334.6L147.8,336.2ZM154.4,196.3L155.3,194.7L155.3,197.6L151.2,196.2L150.8,199.1L150.1,198.7L149.7,197.1L151.8,193.0L154.3,192.8L153.4,195.7ZM122.2,290.2L120.1,286.8L121.0,285.2L122.4,285.1L125.0,287.8ZM112.7,252.5L114.8,259.9L112.3,261.9L115.7,263.0L115.9,265.3L114.9,266.9L114.6,264.7L113.7,269.0L111.4,268.9L108.8,271.6L106.9,270.1L103.5,270.3L103.6,268.0L100.9,263.4L97.2,267.3L94.3,266.3L90.6,260.2L95.3,258.6L94.6,256.8L104.8,251.0L109.3,251.0ZM119.7,237.8L115.1,243.1L114.9,245.0L112.1,245.5L113.4,242.7L110.7,243.5L112.4,240.9L115.4,241.0ZM114.8,209.2L116.0,201.4L124.1,198.0L123.9,200.9L120.4,206.5ZM108.8,218.7L110.5,211.9L109.4,210.3L112.9,208.9L113.8,209.8L109.9,219.0ZM-444.8,-337.8L-450.7,-326.6L-450.1,-318.0L-460.9,-299.6L-458.8,-293.2L-463.6,-275.0L-458.9,-264.6L-493.0,-198.3L-497.6,-196.2L-504.5,-181.4L-520.0,-172.4L-520.0,-480.0L-398.6,-480.0L-440.4,-344.5L-434.4,-344.2ZM-518.9,-102.6L-492.5,-90.2L-481.7,-54.0L-476.6,-52.9L-474.6,-48.0L-436.1,-48.9L-436.1,-31.6L-455.5,-18.9L-465.1,-1.2L-481.0,-10.2L-479.3,-18.7L-488.0,-18.0L-493.7,-25.2L-509.0,-25.7L-520.0,-19.6L-520.0,-107.5ZM495.3,-311.4L494.8,-314.2L496.5,-315.6L503.9,-314.1L503.0,-317.5L499.5,-319.7L497.8,-330.0L500.1,-334.9L506.3,-337.0L506.3,-338.8L511.6,-341.0L520.5,-341.1L526.7,-338.8L539.8,-327.9L552.7,-319.4L555.2,-314.3L563.0,-309.4L566.5,-308.7L563.3,-311.2L561.9,-318.6L556.2,-326.6L551.7,-329.8L550.8,-329.5L551.4,-326.4L547.0,-328.2L546.4,-332.6L548.8,-334.2L549.9,-337.6L546.8,-340.7L555.3,-343.8L551.9,-344.7L547.3,-352.2L545.9,-365.1L547.2,-366.5L551.7,-367.3L552.3,-370.9L550.8,-373.6L552.3,-376.2L552.2,-379.2L548.9,-384.3L547.8,-388.7L544.6,-389.3L536.3,-387.5L533.5,-388.9L534.4,-389.6L532.5,-391.1L533.8,-401.4L530.2,-406.1L533.9,-414.6L546.8,-419.7L555.0,-419.0L562.4,-427.0L565.5,-435.3L561.2,-437.3L543.8,-436.8L546.1,-440.6L546.7,-445.5L544.3,-448.7L538.2,-452.4L536.2,-458.2L532.5,-461.1L533.3,-461.9L536.0,-461.0L536.5,-464.2L532.0,-463.2L527.9,-464.4L528.6,-468.5L526.5,-470.3L516.6,-465.4L517.8,-462.9L516.6,-461.9L512.3,-462.1L507.3,-466.3L503.1,-464.2L492.8,-480.0L912.5,-480.0L911.0,-477.9L905.6,-476.7L900.9,-472.5L885.8,-466.8L879.3,-461.4L876.9,-460.9L876.2,-458.1L874.0,-456.7L873.5,-453.3L875.5,-448.5L873.4,-439.2L873.9,-434.2L886.1,-410.0L896.4,-401.7L899.4,-401.7L899.1,-406.9L906.0,-407.9L909.7,-406.5L916.7,-400.6L936.3,-391.5L939.1,-390.7L941.2,-391.8L945.0,-389.8L948.7,-383.3L956.9,-374.0L956.2,-367.0L953.0,-361.2L952.4,-357.6L955.1,-352.4L955.6,-348.5L951.8,-343.9L951.9,-336.6L957.1,-328.4L966.0,-319.0L970.2,-302.7L974.1,-295.0L973.1,-291.4L974.2,-288.4L973.7,-282.5L971.7,-278.3L972.0,-271.3L967.5,-266.7L962.8,-266.6L961.0,-259.0L955.9,-255.0L956.1,-250.4L954.3,-247.6L953.2,-241.4L957.4,-226.5L957.4,-221.8L953.9,-214.6L948.9,-210.1L935.9,-211.6L933.3,-204.4L928.3,-197.9L927.0,-192.1L919.7,-183.9L931.7,-168.6L936.2,-165.9L941.6,-165.7L944.4,-167.4L948.7,-165.0L952.4,-160.0L954.8,-152.8L951.7,-149.3L950.5,-144.0L948.7,-142.0L947.5,-138.8L948.0,-133.8L944.3,-126.7L940.9,-125.6L935.1,-126.1L931.9,-114.9L928.6,-114.9L928.2,-111.3L925.2,-109.6L927.2,-106.7L925.9,-102.4L928.4,-97.0L927.8,-92.1L929.6,-87.7L930.9,-75.5L934.3,-73.6L934.9,-62.6L932.7,-57.5L935.6,-54.0L934.8,-44.6L926.4,-43.0L922.5,-44.3L923.7,-36.6L918.7,-29.9L911.2,-30.1L905.3,-26.8L895.8,-27.4L890.8,-24.8L889.2,-21.7L889.2,-13.9L885.5,-6.4L880.0,-4.2L876.7,-4.9L874.1,-2.9L876.8,4.0L876.1,6.9L834.8,1.1L814.2,3.8L810.8,-1.5L808.3,10.5L809.8,26.8L806.2,29.8L805.0,34.4L802.4,33.6L799.5,27.5L797.7,30.6L793.1,33.5L793.8,36.5L787.5,35.5L786.4,41.5L783.5,44.2L777.6,38.7L767.4,35.0L764.4,40.4L760.0,42.1L755.5,45.8L754.0,53.7L754.9,58.0L747.4,74.6L743.4,79.8L743.5,85.8L734.1,99.5L731.4,108.3L722.8,114.7L722.2,117.3L724.7,122.3L728.3,121.8L729.7,125.1L735.0,123.4L738.4,123.6L732.6,131.8L733.4,136.5L738.6,140.4L736.9,150.7L742.8,152.0L753.6,149.5L758.1,156.4L757.0,161.1L752.6,165.5L748.8,166.6L748.5,171.0L746.9,173.3L738.8,175.6L734.0,174.0L730.6,175.0L728.1,177.5L727.3,181.9L722.3,182.8L718.0,187.1L715.3,198.1L706.0,199.8L706.0,205.4L700.7,202.1L688.5,200.1L681.7,204.3L676.1,203.7L671.5,210.8L668.2,210.0L664.7,211.2L662.8,220.6L658.2,227.9L658.3,233.6L655.0,239.5L660.6,246.4L660.6,250.1L658.0,252.3L649.7,248.6L646.4,249.2L646.0,261.7L648.3,267.6L651.8,270.8L653.2,282.2L660.0,284.3L665.4,289.9L672.5,285.9L681.2,288.0L689.4,294.5L687.0,298.7L695.9,299.8L695.9,307.1L695.0,305.2L693.1,306.8L694.8,309.6L692.3,309.9L692.2,313.1L687.6,318.4L685.7,318.9L686.5,334.2L684.7,338.8L685.4,342.0L693.2,343.7L698.5,347.6L700.0,345.9L704.4,359.5L710.5,363.9L725.3,371.0L721.6,384.8L716.2,386.4L706.1,382.3L690.8,382.7L689.9,378.0L685.3,379.5L682.2,378.2L679.4,378.7L678.8,381.1L675.3,380.6L669.6,387.0L668.0,387.1L665.8,385.0L659.0,385.1L653.6,383.6L640.1,388.8L626.9,388.8L621.6,390.9L621.0,394.4L602.0,386.4L595.2,386.4L589.3,384.0L585.7,385.0L580.9,382.1L574.4,381.0L574.5,376.8L579.0,376.2L581.4,374.1L582.9,363.2L584.6,361.1L584.0,357.5L579.4,355.7L577.8,353.2L584.6,349.6L583.5,347.1L589.8,339.8L587.4,337.7L579.0,343.9L577.8,340.0L577.3,336.8L580.7,332.5L581.3,329.4L588.6,326.8L590.2,325.0L589.8,318.5L584.4,313.1L586.0,308.8L582.5,307.8L585.2,302.0L582.3,297.4L579.3,298.7L576.1,297.3L571.4,297.0L569.5,298.4L561.2,297.3L559.7,300.2L550.9,295.2L544.1,301.0L537.0,300.1L533.4,302.9L530.1,300.5L526.8,293.4L523.5,291.5L520.3,293.1L515.0,293.3L511.3,287.6L513.2,285.8L513.0,284.4L504.5,277.8L498.5,279.5L495.0,282.5L491.2,282.7L490.0,287.4L486.0,288.0L480.2,277.5L477.0,274.9L477.0,272.4L479.1,270.7L484.2,271.1L486.7,268.3L488.2,264.1L484.1,260.2L477.8,260.5L476.5,256.6L471.5,255.0L466.7,249.2L463.8,247.5L463.9,242.9L461.6,239.6L460.5,234.6L453.1,232.1L447.2,236.2L444.8,232.5L441.9,232.3L439.7,233.8L437.6,232.4L434.9,233.2L433.1,232.1L431.0,225.7L427.6,221.6L425.8,222.0L425.7,215.0L421.7,211.5L420.2,212.0L420.7,206.9L422.0,205.2L414.9,191.3L419.3,180.8L417.7,178.8L417.1,174.1L419.2,174.5L420.3,172.1L423.4,171.1L425.0,168.0L432.2,167.8L432.9,166.5L429.0,163.7L423.3,164.9L418.5,163.7L416.9,158.0L412.4,162.2L411.0,161.8L418.5,147.7L423.0,135.7L427.5,123.4L427.9,115.7L423.5,111.3L412.1,105.6L413.9,102.9L413.7,97.9L409.5,94.5L407.5,89.9L404.2,88.0L403.9,83.4L402.3,81.9L401.0,75.9L403.1,74.0L390.1,56.2L391.9,43.4L385.9,38.0L380.5,35.6L378.6,31.9L378.6,26.7L377.5,25.4L379.8,22.2L379.9,18.1L382.8,15.0L382.6,11.3L386.9,11.8L385.9,8.4L390.2,8.0L391.9,3.9L398.2,5.7L397.9,7.2L394.3,7.5L394.3,8.3L400.3,10.9L402.1,9.9L403.9,11.8L406.5,8.5L420.5,8.1L437.4,13.9L446.0,15.4L448.0,14.8L457.4,18.3L463.3,24.9L464.8,30.1L462.3,41.2L454.0,48.9L434.5,51.3L429.4,50.2L418.7,50.5L412.5,47.5L410.9,47.9L418.2,54.8L428.5,58.6L433.4,62.1L434.2,70.1L442.0,82.0L446.4,83.9L449.7,82.3L455.1,86.3L462.8,86.5L466.2,82.2L463.4,77.1L461.6,76.1L457.3,77.4L452.0,74.3L450.6,72.0L451.9,67.4L456.7,67.1L462.2,70.1L465.0,68.2L472.6,68.2L473.7,65.2L475.8,65.9L475.7,62.2L466.8,53.6L469.2,43.7L472.4,38.9L473.9,32.1L480.8,30.0L488.2,32.0L485.1,21.7L482.3,17.8L476.6,15.3L470.5,0.5L463.5,-3.7L476.0,-7.8L482.8,-5.6L486.3,-1.8L481.8,3.2L482.2,9.9L492.8,14.0L500.2,7.8L496.5,-3.1L499.0,-6.4L498.7,-9.8L502.1,-15.5L503.8,-26.2L507.9,-29.9L511.1,-29.2L508.7,-33.5L510.7,-40.3L512.9,-40.5L517.9,-35.0L516.4,-31.7L519.9,-32.6L521.0,-35.2L524.1,-35.7L523.5,-43.0L525.4,-46.3L531.4,-49.8L531.3,-54.4L534.2,-61.5L538.4,-60.8L541.5,-56.3L544.5,-57.5L542.1,-61.9L543.6,-64.8L543.0,-68.9L532.5,-74.2L531.7,-80.2L542.5,-87.3L548.9,-89.8L568.1,-94.4L581.3,-94.3L575.0,-104.1L570.8,-103.0L562.5,-106.1L559.3,-104.5L560.6,-100.7L558.3,-104.0L556.8,-102.6L554.4,-104.2L552.8,-106.3L552.8,-109.0L543.6,-115.9L541.6,-116.5L540.2,-115.0L537.1,-117.2L534.7,-121.5L532.8,-130.3L519.3,-146.8L525.5,-155.1L532.3,-156.9L538.8,-152.9L547.5,-143.3L558.9,-140.5L584.4,-122.6L595.1,-121.4L603.9,-113.2L614.8,-92.8L613.2,-87.5L607.8,-86.7L610.7,-84.2L607.2,-81.9L609.9,-81.6L615.2,-84.9L622.3,-93.4L620.0,-98.2L618.3,-108.0L610.3,-120.3L596.5,-128.3L596.0,-138.2L597.7,-140.6L605.8,-140.3L616.5,-134.8L621.9,-134.4L623.7,-139.1L617.4,-136.5L613.8,-138.8L610.8,-142.9L599.9,-145.1L591.8,-140.8L588.4,-131.3L585.7,-130.8L575.7,-135.6L566.4,-144.8L550.8,-148.6L546.8,-153.9L544.6,-162.0L535.5,-168.0L536.5,-169.0L540.9,-167.9L557.2,-157.7L560.4,-157.8L566.8,-164.5L570.9,-167.0L566.9,-168.2L559.3,-164.0L553.5,-164.8L551.2,-168.5L555.9,-171.2L555.7,-173.8L554.1,-174.6L547.5,-172.9L545.2,-177.4L546.5,-178.9L549.7,-178.7L554.0,-184.1L566.4,-188.1L569.8,-194.5L572.7,-193.4L576.2,-188.3L579.5,-186.3L584.1,-185.0L582.8,-187.3L583.6,-188.7L593.9,-182.6L598.1,-183.9L593.9,-184.1L591.3,-187.1L589.2,-186.8L586.7,-188.4L588.7,-189.5L579.0,-192.1L570.8,-196.5L559.8,-194.5L553.3,-190.9L541.6,-194.7L536.4,-198.1L540.6,-218.2L539.1,-226.1L534.8,-226.6L531.6,-225.7L528.7,-227.9L528.2,-225.4L522.1,-230.3L522.9,-233.1L520.2,-234.6L520.4,-238.6L516.5,-243.7L513.5,-260.7L509.7,-262.5L509.7,-266.9L507.7,-271.6L508.9,-273.5L513.8,-271.7L512.2,-276.5L513.1,-278.1L509.5,-282.8L510.8,-286.0L506.4,-285.4L504.2,-292.1L496.8,-293.9L490.2,-297.5L483.4,-304.8L485.9,-310.3L487.5,-310.9L493.9,-307.7ZM449.0,-460.4L448.4,-461.9L445.2,-462.2L443.1,-464.8L444.7,-467.7L441.5,-469.1L438.3,-475.2L441.9,-476.9L448.5,-474.2L451.5,-470.8L452.7,-460.3L447.1,-457.5ZM468.6,-426.4L460.9,-428.8L463.3,-439.9L456.9,-436.4L456.0,-438.3L454.6,-437.4L455.3,-443.4L451.9,-447.8L452.0,-454.5L454.7,-454.3L458.8,-456.4L462.4,-455.6L463.4,-453.5L465.9,-454.8L470.3,-452.4L469.1,-449.1L477.4,-444.5L476.6,-441.6L480.8,-442.9L482.9,-442.2L483.7,-438.0L479.7,-429.9ZM488.0,-456.0L483.5,-461.3L484.0,-465.7L485.2,-468.3L488.4,-470.1L489.9,-469.7L494.0,-463.0L495.0,-458.6L498.9,-456.1L498.2,-455.3L494.6,-457.0ZM489.0,-453.5L485.5,-449.8L483.0,-451.4L483.0,-452.8L486.2,-454.4ZM481.8,-424.3L481.1,-423.7L474.6,-421.6L477.1,-424.6L479.9,-425.4ZM543.1,-339.5L540.4,-334.0L538.6,-335.7L535.6,-335.9L536.2,-341.5ZM455.7,-302.8L464.0,-300.9L456.7,-303.7L464.2,-307.3L463.2,-307.9L464.1,-309.0L468.1,-309.4L472.6,-307.7L474.6,-301.8L476.0,-301.2L474.7,-300.7L475.1,-296.6L479.3,-290.3L455.2,-298.7L457.0,-300.3L453.5,-301.0ZM441.1,-279.7L439.9,-283.9L440.5,-289.0L446.8,-288.3L442.8,-290.1L444.7,-290.3L442.0,-290.9L442.0,-292.6L446.3,-294.7L456.3,-292.0L461.3,-293.1L463.7,-291.4L464.1,-286.4L460.0,-283.7L459.6,-280.5L458.0,-280.1L458.8,-278.6L448.3,-276.5L450.1,-274.9L444.8,-279.2L441.8,-279.1L438.2,-274.4L435.1,-274.1L432.0,-276.9L424.8,-279.3L422.3,-283.9L420.0,-285.2L420.2,-286.6L426.3,-288.2L428.6,-290.4L430.7,-290.4L432.2,-288.4L437.4,-288.2L439.3,-280.4ZM490.8,-277.6L497.0,-274.4L494.1,-273.8ZM446.2,-272.8L443.7,-272.7L442.9,-270.4L438.9,-271.2L441.2,-276.6L442.8,-277.4L446.0,-274.9ZM419.2,-272.6L419.0,-275.0L420.8,-276.1L422.1,-274.8L421.0,-272.4ZM506.3,-217.6L509.6,-216.0L513.8,-214.4L510.5,-215.5L512.1,-214.5L508.6,-214.1L506.9,-215.5L508.6,-215.7ZM543.7,-183.5L540.1,-188.1L543.3,-188.0L546.6,-185.9ZM530.0,-169.6L533.5,-167.0L530.1,-166.2L528.8,-168.4ZM519.3,-150.4L513.8,-154.3L514.2,-157.3L516.4,-159.3L520.9,-158.2ZM467.9,-176.6L463.6,-149.4L464.4,-140.0L467.2,-132.6L465.0,-131.5L469.3,-120.8L467.9,-119.8L471.0,-116.7L477.2,-97.3L484.6,-86.3L496.6,-79.5L507.0,-77.4L507.5,-76.2L504.9,-72.8L502.6,-73.6L502.1,-71.2L499.2,-70.2L498.6,-68.1L490.3,-66.7L486.8,-70.4L482.0,-72.6L481.6,-71.2L484.6,-66.6L480.4,-67.8L479.5,-70.6L477.3,-72.2L475.3,-69.3L473.6,-69.4L469.7,-72.9L468.3,-75.6L469.9,-79.3L468.3,-83.9L463.9,-88.6L464.4,-91.3L462.5,-96.0L464.1,-99.8L461.7,-103.9L458.1,-105.2L458.5,-114.0L454.4,-120.7L455.4,-124.0L449.1,-127.9L451.3,-129.1L449.9,-133.0L451.6,-135.0L449.5,-140.5L451.0,-149.5L449.5,-151.6L452.2,-151.6L450.6,-156.1L454.9,-159.1L457.4,-164.9L458.3,-172.2L456.4,-174.7L456.2,-181.9L459.4,-184.1L463.0,-183.1L465.8,-180.3ZM396.4,-215.4L397.5,-211.6L396.2,-208.4L393.7,-208.6L392.2,-211.6L393.2,-213.9L391.0,-216.9L392.9,-217.5ZM388.8,-202.0L388.0,-204.0L391.2,-208.5L394.9,-205.6L396.4,-201.3L393.6,-200.8L392.9,-198.9ZM388.6,-206.5L386.1,-206.3L387.1,-210.3L388.3,-209.4ZM516.0,-79.2L516.5,-80.2L528.4,-79.3L531.2,-76.9L527.8,-73.5L526.4,-75.0L523.6,-73.3L517.7,-75.4L518.2,-76.4ZM393.5,-192.0L391.4,-191.7L387.3,-194.8L389.5,-197.1L392.5,-197.4L391.8,-194.8L393.4,-193.8ZM384.2,-201.6L386.0,-202.4L386.4,-200.3L384.0,-200.2L384.9,-198.9L383.2,-194.5L380.7,-195.6L379.6,-193.8L376.7,-193.7L378.1,-196.2L381.5,-196.7L375.5,-196.8L374.7,-198.3L382.6,-199.7L378.5,-201.1L383.2,-202.1L381.3,-205.0L382.6,-204.9ZM377.5,-207.1L374.2,-206.2L373.5,-207.1L374.7,-208.7L377.2,-208.5ZM374.4,-205.1L377.5,-205.0L377.1,-201.8L373.9,-201.8L373.4,-202.8L375.9,-203.0ZM386.1,-192.3L388.9,-193.2L391.5,-189.2L389.5,-188.2ZM379.5,-186.6L383.0,-186.4L383.2,-184.1L379.6,-183.4ZM367.0,-188.7L368.6,-189.8L370.1,-187.4L371.1,-188.7L372.8,-187.8L373.0,-184.9L371.3,-182.5L372.2,-180.5L370.2,-179.4L372.5,-177.0L370.9,-173.6L369.6,-175.6L368.3,-174.1L366.2,-175.5L366.5,-176.8L368.9,-177.1L366.6,-180.0L369.3,-181.8L366.4,-185.1ZM482.0,-32.1L484.0,-33.8L492.6,-32.1L492.1,-25.0L489.9,-21.1L485.1,-21.8L483.2,-24.4L481.5,-29.3ZM359.7,-177.3L362.5,-183.7L365.8,-183.6L365.7,-182.2L363.5,-182.6L364.2,-179.9L363.2,-176.6ZM372.3,265.7L373.7,259.8L381.0,262.6L385.7,261.3L389.1,265.0L388.2,269.4L389.8,272.6L378.0,275.3L360.8,275.9L364.0,272.1L362.0,270.4L361.8,268.0ZM764.6,588.5L802.7,573.6L808.5,578.7L817.9,573.6L823.5,578.9L827.8,581.0L827.9,583.1L829.7,584.2L835.3,583.2L838.4,586.9L841.6,586.3L844.7,588.2L850.9,588.9L850.9,591.0L856.2,595.1L856.3,598.2L854.3,597.8L854.6,599.9L861.0,604.9L865.4,606.2L868.2,609.7L873.8,613.4L877.5,615.4L879.4,615.1L882.1,613.1L883.1,610.3L883.3,616.5L885.1,614.8L887.4,614.8L889.4,617.2L909.0,626.1L943.6,610.3L945.8,607.6L956.7,614.5L961.0,649.3L925.7,690.8L909.6,704.0L886.2,720.4L875.5,734.1L870.8,748.8L870.2,755.3L867.0,759.9L864.0,761.2L858.6,758.4L850.4,762.9L833.0,767.9L814.6,777.9L807.0,777.6L805.1,779.5L806.7,782.0L805.1,785.3L806.7,786.5L806.4,789.2L808.0,790.3L808.3,792.4L804.9,798.4L802.4,799.5L800.2,795.3L793.1,790.8L790.2,786.2L777.4,781.2L772.3,775.5L768.9,774.1L765.9,768.6L756.9,760.4L750.7,758.0L738.6,756.4L726.3,746.7L725.0,742.5L720.3,736.5L718.9,726.4L704.8,711.3L687.5,707.0L682.2,701.8L680.2,695.1L675.2,693.3L675.4,691.1L670.7,688.5L668.9,685.2L665.7,683.7L639.6,661.1L636.2,660.3L630.9,661.8L630.1,640.5L645.8,638.1L651.0,630.8L653.0,623.9L662.3,618.0L663.5,611.8L666.7,607.7L649.1,596.6L672.5,578.9L675.0,575.0L692.3,571.8L721.4,576.0ZM787.5,799.7L790.0,797.6L792.4,800.2L785.4,799.6L786.9,796.8ZM639.9,767.7L646.3,761.2L688.8,747.1L710.4,794.3L730.7,800.4L727.3,809.1L710.0,823.8L711.5,836.3L707.7,856.8L712.5,869.9L710.8,895.4L703.1,900.5L696.3,916.2L696.1,931.5L686.9,938.2L686.3,956.3L682.6,956.3L682.1,947.3L668.2,941.1L664.6,918.6L657.3,920.2L656.1,924.9L647.3,928.0L654.0,940.4L638.1,964.7L629.5,967.8L613.8,963.0L607.2,967.7L607.1,972.8L598.2,976.8L597.1,969.4L577.1,973.4L579.8,981.4L559.6,987.3L552.2,986.5L542.3,976.2L531.6,979.4L524.6,989.7L522.8,1003.6L517.3,1008.5L505.6,1008.9L505.4,990.3L490.4,976.8L491.1,970.3L484.4,966.7L480.0,951.6L469.7,950.0L476.3,940.7L472.6,934.1L479.8,927.4L476.7,921.3L485.4,909.3L484.2,904.1L501.4,898.3L493.3,830.9L509.4,828.1L505.0,796.1L604.9,770.9L632.4,765.4ZM297.4,-147.5L299.8,-148.5L302.2,-145.2L301.0,-151.1L302.0,-150.8L302.0,-152.9L304.0,-147.4L306.6,-150.1L306.1,-152.7L307.5,-150.4L308.1,-151.5L311.9,-149.7L314.5,-150.2L316.4,-146.0L313.4,-136.2L311.9,-136.3L310.3,-133.8L306.7,-133.8L305.2,-135.3L300.2,-133.8L297.1,-135.2L295.9,-137.1L298.9,-137.2L298.6,-138.6L300.8,-140.8L292.5,-138.7L290.6,-140.9L291.3,-143.3L289.3,-145.3L291.3,-146.3L293.0,-145.0L291.9,-148.2L293.8,-147.4L292.9,-151.0L293.8,-152.0ZM286.1,-140.6L286.8,-141.7L289.8,-138.9L290.2,-133.4L291.4,-136.7L294.5,-129.9L296.7,-130.0L298.3,-127.7L298.5,-129.5L299.9,-129.3L299.9,-127.3L303.9,-125.0L304.2,-122.2L306.4,-121.4L307.7,-116.2L311.3,-116.5L317.4,-109.1L313.2,-101.2L311.6,-106.5L305.9,-103.6L306.6,-110.7L304.3,-113.4L304.9,-115.8L303.0,-115.6L301.0,-119.1L302.3,-122.4L299.0,-121.0L298.7,-119.2L296.6,-118.5L297.4,-112.7L295.8,-110.4L296.0,-103.3L294.2,-101.4L293.5,-88.4L292.3,-87.1L290.8,-87.0L289.9,-89.6L287.3,-91.1L287.3,-93.3L285.4,-93.4L282.0,-96.2L280.5,-99.3L280.1,-101.7L281.4,-102.9L283.3,-102.5L283.1,-104.5L286.4,-107.3L279.5,-105.2L278.2,-109.1L278.7,-110.5L282.3,-111.4L285.7,-115.4L288.3,-115.9L287.8,-120.8L285.1,-117.2L283.6,-118.0L283.5,-120.9L281.4,-119.4L280.2,-113.9L278.6,-112.4L275.9,-112.5L271.5,-120.1L271.3,-128.5L269.4,-127.2L267.8,-134.1L267.9,-137.5L269.3,-135.6L269.5,-138.7L270.9,-138.8L272.4,-136.3L272.3,-138.4L273.5,-137.8L276.9,-139.6L276.9,-136.9L275.0,-136.7L274.3,-134.9L275.9,-134.8L278.4,-130.3L277.8,-134.9L280.0,-138.3L283.9,-128.2L286.2,-125.4L282.8,-139.8L284.3,-143.3ZM268.6,-122.7L272.8,-112.4L269.0,-116.6L267.2,-123.4ZM167.1,-7.0L160.6,-5.2L160.5,-6.2L167.8,-9.2ZM-93.5,993.5L-116.9,1008.1L-138.4,992.5L-134.7,991.4L-143.6,978.0L-140.8,976.2L-142.9,967.3L-137.9,967.8L-126.5,958.6L-104.6,962.5L-97.4,974.9L-95.4,985.6L-99.1,989.8L-92.3,989.3ZM-108.6,885.6L-109.5,901.6L-102.1,910.0L-101.6,923.9L-118.2,920.7L-130.4,912.5L-163.6,901.9L-190.4,898.9L-187.0,886.4L-173.3,890.7L-160.0,888.1L-148.3,897.4L-139.5,896.9L-157.8,885.0L-166.9,885.9L-183.6,880.4L-190.6,860.3L-195.2,857.3L-181.5,851.5L-169.5,836.7L-148.2,840.5L-138.3,844.3L-131.5,854.7L-124.6,857.8ZM953.9,805.8L957.6,853.1L933.8,944.7L908.9,989.9L872.3,1034.0L845.3,1080.0L840.2,1080.0L832.0,1073.4L822.6,1019.6L837.3,991.4L850.0,984.2L861.3,970.3L883.5,959.6L920.0,891.4L904.0,898.4L853.4,904.6L839.7,900.6L825.3,889.6L830.8,872.3L854.3,880.4L873.9,863.7L885.9,860.6L898.2,846.5L928.3,828.4L946.0,807.8ZM351.0,5.6L352.1,9.4L356.4,-2.4L358.9,3.1L360.0,3.2L360.6,-5.7L362.8,-7.7L365.6,-6.1L367.5,0.2L370.0,-5.4L376.7,-4.5L382.0,-2.1L382.5,0.1L376.7,6.6L379.4,8.3L385.9,8.4L386.9,11.8L382.6,11.3L382.8,15.0L379.9,18.1L379.8,22.2L378.6,22.9L377.4,19.8L378.6,15.4L376.5,12.4L371.7,11.4L367.9,8.1L366.4,8.6L363.9,12.0L360.5,12.5L358.6,17.0L360.1,29.9L357.9,32.0L356.7,36.5L350.1,33.7L346.4,37.7L341.3,37.2L335.4,29.6L332.8,28.8L331.6,30.2L332.0,33.1L330.1,32.7L327.2,34.5L328.4,38.0L327.3,45.3L317.6,43.4L315.7,44.2L316.5,50.3L315.5,53.5L311.4,51.9L308.3,55.7L307.1,61.3L305.1,63.3L307.4,69.9L301.9,79.9L302.7,83.2L299.8,85.5L296.3,86.1L297.2,99.9L292.2,111.7L295.2,114.5L294.9,121.2L289.0,120.6L285.3,122.7L281.7,129.1L280.7,134.3L282.2,139.0L281.4,145.4L283.4,151.2L282.6,160.3L286.4,163.4L288.4,167.6L287.2,171.3L283.9,172.5L286.9,180.7L286.2,187.3L284.0,190.5L281.0,191.8L281.6,194.3L280.1,196.3L281.1,201.9L279.6,207.4L278.3,207.8L277.1,204.2L273.1,204.9L271.2,200.5L271.3,197.9L270.3,193.9L271.9,192.2L270.8,190.8L269.6,192.9L270.0,197.4L268.1,194.5L269.4,204.2L268.4,203.4L264.7,206.4L264.0,205.4L254.8,215.9L249.3,220.2L244.3,222.6L235.7,220.7L235.7,218.8L227.7,212.5L226.4,209.6L227.5,204.5L229.1,202.6L230.1,205.0L231.8,199.9L230.3,197.9L226.3,201.6L224.2,202.1L225.4,194.9L227.4,193.0L226.7,196.5L228.0,193.9L229.9,194.3L229.2,191.4L232.5,185.5L226.6,192.4L224.3,193.4L224.4,189.8L229.3,186.1L228.6,184.8L225.8,184.5L225.2,187.2L222.9,179.6L223.4,175.5L225.6,174.0L224.5,172.2L226.6,169.9L224.5,167.9L226.3,162.0L225.7,156.5L227.8,153.3L229.8,154.5L230.6,148.6L236.9,149.5L235.4,147.4L236.3,144.9L239.6,144.6L242.2,140.1L246.7,137.7L251.1,137.9L250.9,135.4L256.0,132.1L253.4,131.1L255.4,125.4L259.6,130.4L263.4,129.0L265.4,132.8L271.9,131.9L272.5,127.3L265.2,130.7L262.7,126.7L269.1,115.5L273.7,111.3L271.6,107.0L276.2,106.8L279.2,103.3L280.0,104.7L280.3,98.4L283.0,92.1L282.6,87.1L285.9,85.3L287.7,77.0L296.3,63.7L298.7,61.9L299.3,59.9L297.0,59.8L296.7,56.7L299.9,55.8L300.2,53.0L302.8,51.3L304.8,54.0L304.8,49.0L302.9,47.2L295.1,52.3L294.3,51.4L288.1,52.9L289.5,50.3L292.4,49.9L297.9,45.7L299.0,42.7L299.3,37.0L301.7,33.6L301.0,38.2L302.3,41.9L304.4,38.4L306.8,41.9L310.6,38.9L310.5,35.7L307.6,35.6L307.7,31.2L311.3,28.1L315.5,29.5L314.1,25.7L316.6,17.9L318.3,17.0L320.2,18.5L322.6,23.2L325.0,20.7L326.4,25.4L327.5,19.7L326.3,15.7L329.6,19.3L333.6,17.8L331.0,14.1L332.4,11.9L336.0,12.1L340.5,6.5L342.1,6.5L342.6,4.0L345.1,4.7L346.1,-1.4L349.2,-1.4L350.2,-5.2L352.1,-5.0L352.6,-2.8ZM339.4,1.5L337.4,7.7L334.3,8.3L334.7,5.0L336.5,5.7L336.6,4.0L337.9,4.8ZM296.6,38.2L298.4,43.5L294.8,46.8L295.4,45.0L294.9,44.0L293.2,45.2L293.0,42.0L294.6,41.0L295.6,42.0L295.1,39.5L296.3,40.0ZM283.6,58.4L284.8,54.4L286.9,53.2L286.9,54.9ZM250.7,134.4L248.9,133.5L248.8,131.6L250.2,131.0L252.0,132.6ZM1097.5,214.2L1087.2,209.3L1086.1,202.1L1077.3,206.6L1065.9,198.4L1064.3,200.4L1068.9,178.6L1080.6,177.1L1082.4,173.4L1088.7,182.3L1093.2,201.2L1089.9,207.1ZM688.8,747.1L646.3,761.2L665.3,735.7ZM703.2,1029.7L718.4,1019.1L721.3,1019.8L722.9,1023.8ZM1065.9,198.4L1077.3,206.6L1086.1,202.1L1087.2,209.3L1092.1,213.4L1107.9,218.3L1109.7,226.6L1104.0,225.2L1103.3,231.2L1093.2,233.4L1090.8,239.7L1080.7,244.7L1078.8,255.6L1081.9,267.3L1056.7,277.5L1039.9,263.1L1038.0,247.5L1033.5,249.3L1030.5,246.1L1016.3,253.6L1011.9,237.6L1024.4,212.5L1036.2,209.1L1046.5,215.6ZM595.0,981.7L582.2,984.5L577.1,973.4L597.1,969.4ZM981.7,777.5L991.9,768.1L998.4,767.3L988.8,777.4ZM955.3,717.0L946.0,729.5L946.8,742.1L913.9,775.8L903.8,793.1L860.9,826.9L853.5,839.9L838.6,849.3L829.1,850.8L809.8,819.5L806.0,818.4L802.4,799.5L808.3,792.4L805.1,785.3L807.0,777.6L814.6,777.9L858.6,758.4L867.0,759.9L875.5,734.1L886.2,720.4L925.7,690.8Z";
const CANDIDATE_LAND = "M387.0,474.5L389.9,472.6L395.6,477.5L397.7,482.9L397.7,492.3L401.5,498.3L404.7,499.1L406.2,502.9L401.8,512.6L398.7,514.6L399.6,517.8L398.4,517.5L397.7,520.1L394.8,520.0L392.5,515.0L385.8,510.8L386.5,508.6L384.2,505.4L385.4,486.2L382.6,485.5L381.3,479.4L385.5,471.8ZM347.4,432.3L358.2,434.3L360.2,432.9L366.3,433.0L369.1,433.8L370.7,436.4L376.4,435.1L374.9,443.9L380.6,449.6L377.8,450.9L380.6,455.6L375.0,458.1L374.5,459.3L376.0,461.7L373.8,461.4L371.6,463.3L371.4,466.6L369.8,468.0L369.7,470.9L371.1,473.2L369.7,475.1L361.8,470.4L358.5,470.1L359.4,468.3L354.4,463.6L354.2,461.6L350.7,460.0L339.7,450.3L338.8,445.6L334.3,441.4L334.4,433.7L340.1,437.0L342.9,433.1ZM475.9,404.5L473.3,387.5L470.1,382.0L459.2,373.2L454.2,366.2L449.4,364.9L450.9,362.1L460.0,359.0L469.9,362.5L472.5,361.3L475.7,363.3L477.9,363.0L479.7,365.6L480.1,370.4L483.4,372.5L485.0,372.1L487.0,377.5L491.5,379.8L494.2,385.6L489.6,387.3L484.3,386.2L482.3,387.7L483.9,394.6L480.3,401.5L480.3,404.6L477.5,406.3ZM377.5,457.8L392.7,467.5L389.3,469.5L389.9,472.6L387.0,474.5L385.5,471.8L384.2,473.0L381.3,479.4L382.6,485.5L373.0,477.3L371.0,477.2L369.7,475.1L371.1,473.2L369.7,470.9L369.8,468.0L371.4,466.6L371.6,463.3L373.8,461.4L376.0,461.7L374.5,459.3L375.0,458.1ZM417.1,472.0L425.4,476.1L427.8,480.5L427.9,487.2L426.1,488.1L425.9,490.6L416.1,493.2L414.7,496.3L404.7,499.1L401.5,498.3L399.4,495.9L396.9,488.6L397.9,487.9L397.4,483.5L399.5,482.4L399.5,480.1L403.2,476.9L404.8,477.9L407.6,474.8ZM384.4,413.2L391.6,418.4L392.3,422.8L395.0,425.2L400.7,426.5L400.3,429.8L402.2,431.5L400.2,432.9L408.4,435.3L410.3,437.0L413.0,433.0L416.6,434.1L417.1,435.0L414.3,436.9L417.3,440.4L416.9,442.7L414.8,444.7L414.8,448.0L417.3,452.3L424.0,456.5L421.7,462.1L418.1,463.8L420.2,469.9L418.4,472.4L407.6,474.8L404.8,477.9L403.2,476.9L399.5,480.1L399.5,482.4L397.7,482.9L395.6,477.5L389.9,472.6L389.3,469.5L392.7,467.5L392.2,466.4L383.6,462.7L377.5,457.8L380.6,455.6L377.8,450.9L380.6,449.6L374.9,443.9L376.4,435.1L372.3,435.6L373.7,434.3L373.1,431.4L376.7,430.3L371.3,427.3L371.8,425.0L370.0,424.2L369.0,418.6L371.4,416.7L373.6,416.9L377.8,413.0ZM575.1,441.3L579.5,442.4L584.0,439.3L586.6,440.0L588.1,442.7L591.8,444.5L595.0,441.4L606.6,443.0L608.6,440.9L610.8,442.1L618.4,440.5L628.5,433.1L637.4,432.5L642.8,427.4L650.0,415.9L653.5,415.6L657.2,412.8L661.5,412.1L661.7,409.4L663.7,408.3L677.7,413.7L679.9,416.0L680.2,421.2L683.0,426.1L686.8,426.3L691.5,423.9L699.6,427.2L696.4,426.5L695.5,427.7L696.3,432.6L692.7,435.7L695.8,438.2L702.1,448.8L704.3,449.3L704.4,456.9L710.0,458.0L711.7,461.8L715.0,463.0L715.9,465.1L711.2,471.0L707.5,466.9L704.4,469.8L690.6,473.7L689.3,478.2L687.0,480.2L685.9,478.4L684.2,478.4L678.6,484.2L667.9,488.6L658.0,499.4L651.3,503.7L644.9,505.7L639.3,504.5L625.2,514.1L618.0,513.7L618.3,519.0L621.1,522.9L618.0,524.8L618.4,528.2L616.0,531.7L613.1,531.5L609.9,525.6L613.0,518.3L611.3,515.8L608.9,515.8L606.1,519.4L605.2,522.9L602.5,524.1L592.4,523.5L587.0,534.0L584.9,534.7L583.7,537.2L572.2,543.4L565.5,542.2L560.4,538.2L549.3,536.5L541.1,537.8L540.7,548.5L537.3,548.6L532.2,552.9L524.9,551.9L520.4,546.5L517.7,547.4L510.8,546.5L508.0,550.2L507.8,544.1L496.6,547.0L496.5,545.2L499.0,544.4L499.7,542.5L496.9,540.6L494.6,541.0L491.9,537.0L493.4,532.8L486.1,529.7L482.9,530.2L480.5,529.1L480.4,523.1L484.2,525.8L487.2,524.4L484.6,521.4L486.1,517.6L481.4,511.0L483.0,507.0L474.4,509.9L473.0,509.3L472.7,502.2L483.9,491.3L488.1,492.5L491.5,490.9L490.6,488.5L493.4,488.3L493.5,490.2L505.8,487.2L506.9,486.1L504.0,484.2L511.9,479.8L512.0,478.7L504.8,476.9L505.2,472.3L514.1,471.5L519.9,469.2L527.9,468.8L531.6,467.0L532.5,463.1L543.0,451.7L551.9,445.1L568.6,440.5L571.2,437.5ZM483.0,465.6L488.6,463.6L488.7,466.3L491.5,469.8L502.5,472.5L501.9,477.4L494.3,477.9L486.4,481.5L484.1,486.7L478.3,492.1L473.6,499.9L472.6,495.9L478.1,490.3L477.4,489.2L470.3,491.6L468.4,489.7L471.5,485.0L470.5,480.6L473.5,477.6L472.2,474.0L469.1,472.8L469.0,471.3L476.4,464.7L479.0,464.0ZM502.8,551.3L500.3,552.1L499.1,551.7L501.9,549.1L502.9,549.2ZM504.5,277.8L513.0,284.4L513.2,285.8L511.3,287.6L515.0,293.3L520.3,293.1L523.5,291.5L526.8,293.4L530.1,300.5L533.4,302.9L537.0,300.1L544.1,301.0L550.9,295.2L559.7,300.2L561.2,297.3L569.5,298.4L571.4,297.0L576.1,297.3L579.3,298.7L582.3,297.4L585.2,302.0L582.5,307.8L586.0,308.8L584.4,313.1L589.8,318.5L590.2,325.0L588.6,326.8L581.3,329.4L580.7,332.5L577.3,336.8L579.0,343.9L573.0,347.3L566.5,355.2L557.2,361.4L547.4,373.0L547.9,378.5L556.7,384.2L559.6,384.0L566.8,379.0L570.8,380.2L569.7,384.4L561.2,387.9L548.1,403.4L545.1,404.6L542.2,403.7L540.4,397.6L538.0,394.7L527.5,393.2L528.4,390.2L535.2,382.4L534.7,379.6L529.9,379.8L526.2,382.0L517.0,381.8L514.8,378.9L516.5,376.1L513.9,374.7L502.3,381.9L499.2,392.0L494.9,399.9L495.2,406.1L493.9,404.0L491.5,403.3L484.5,408.3L480.4,408.3L477.5,406.3L480.3,404.6L480.3,401.5L483.9,394.6L482.3,387.7L484.3,386.2L489.6,387.3L494.2,385.6L491.5,379.8L487.0,377.5L485.0,372.1L483.4,372.5L480.1,370.4L479.7,365.6L477.9,363.0L475.7,363.3L472.5,361.3L469.9,362.5L460.0,359.0L450.9,362.1L450.8,363.7L446.7,366.8L444.6,370.8L436.0,373.9L432.9,377.6L427.9,374.7L424.2,376.4L416.1,376.8L412.4,375.1L409.5,378.2L408.4,376.0L406.0,376.2L400.1,372.2L399.8,369.5L402.7,360.1L405.7,360.0L402.7,351.9L411.3,336.6L414.4,334.6L414.3,331.5L412.6,329.1L413.6,328.0L408.3,321.8L406.5,316.1L410.4,316.1L413.4,310.5L421.2,307.4L427.2,306.5L439.0,307.2L441.8,306.2L443.6,308.3L447.7,307.6L448.6,309.3L449.4,307.1L451.2,307.4L453.0,305.2L454.6,306.6L457.0,305.8L458.5,307.3L461.8,303.3L465.1,306.7L468.1,303.7L469.8,304.4L473.1,302.6L477.5,305.2L478.3,303.5L475.9,299.0L478.1,291.0L490.0,287.4L491.2,282.7L495.0,282.5L498.5,279.5Z";

// ── Administrative boundaries © EuroGeographics.
// Projected into the 609×600 viewBox at build time. Overseas territories clipped.
const NUTS2_PATHS = {"AT11":"M344.5,384.3L343.7,385.7L342.1,385.6L337.3,389.0L336.5,391.2L337.4,393.0L336.6,396.2L334.0,397.9L335.3,403.9L334.2,406.8L334.9,406.7L339.2,403.2L338.5,397.7L340.7,396.0L341.0,393.9L337.9,392.5L339.4,391.3L344.7,391.1L345.7,386.1Z","AT21":"M295.7,404.6L299.2,409.4L296.9,410.7L296.4,412.0L296.9,412.3L305.8,413.1L312.8,414.2L313.4,414.9L316.7,414.6L318.3,415.7L321.0,413.2L321.7,411.4L323.7,410.6L322.8,408.3L322.7,406.1L320.8,404.2L316.0,405.4L313.1,404.4L310.6,406.6L308.8,406.6L307.3,405.1L303.7,404.3L300.6,405.6Z","AT12":"M320.6,371.5L320.1,374.9L318.7,375.6L317.4,378.7L319.4,379.8L320.7,381.9L320.9,384.1L317.8,385.6L315.9,384.6L315.6,386.8L315.9,388.5L318.7,390.0L318.8,392.6L322.8,392.4L325.6,391.0L328.9,392.0L331.6,394.7L334.5,395.7L335.4,396.8L336.6,396.2L337.4,393.0L336.5,391.2L337.3,389.0L342.1,385.6L343.7,385.7L344.5,384.3L343.4,383.5L341.5,380.2L341.6,379.2L342.5,377.5L342.3,376.2L341.5,374.7L337.7,373.4L335.0,374.9ZM334.5,384.3L335.1,383.0L336.8,382.1L338.2,382.6L339.0,384.4L335.4,384.9Z","AT32":"M305.2,394.0L302.6,391.9L302.5,389.1L298.9,388.8L297.5,389.5L299.0,391.8L298.5,393.9L300.2,394.9L299.9,397.4L298.4,397.8L295.9,394.8L294.5,395.7L295.7,398.5L293.2,400.9L289.3,402.0L289.8,405.1L291.0,405.3L293.5,403.8L300.6,405.6L303.7,404.3L307.3,405.1L308.8,406.6L310.1,403.1L309.4,401.4L306.5,401.1L306.1,397.9L305.3,397.6Z","AT22":"M325.6,391.0L322.8,392.4L318.8,392.6L314.3,395.0L311.5,395.0L310.7,393.9L307.9,394.0L307.3,395.4L307.7,397.5L306.1,397.9L306.5,401.1L309.4,401.4L310.1,403.1L308.8,406.6L310.6,406.6L313.1,404.4L316.0,405.4L320.8,404.2L322.7,406.1L322.8,408.3L323.9,410.7L327.6,410.3L329.0,410.8L329.4,409.8L332.8,408.8L334.9,409.7L334.2,406.8L335.3,403.9L334.0,397.9L335.4,396.8L334.5,395.7L331.6,394.7L328.9,392.0Z","AT33":"M296.4,412.0L296.9,410.7L299.2,409.4L295.7,404.6L293.5,403.8L291.0,405.3L289.9,406.5L290.2,407.9L293.9,411.7ZM293.2,400.9L295.7,398.5L294.5,395.7L291.8,394.7L288.7,396.1L283.9,396.7L283.1,397.9L281.4,398.4L281.5,399.2L276.9,400.1L275.4,397.8L274.6,398.1L270.5,397.5L270.3,400.2L267.4,402.3L267.8,404.2L266.7,407.9L267.1,409.3L269.9,407.1L270.8,407.8L270.8,409.2L273.1,409.0L274.7,410.4L277.2,410.4L278.7,407.3L284.0,406.4L285.4,406.8L289.8,405.1L289.3,402.0Z","AT31":"M311.0,378.9L307.8,376.1L307.4,377.1L307.7,378.7L306.8,380.5L304.4,379.3L303.6,380.0L303.4,382.9L296.2,387.6L297.5,389.5L298.9,388.8L302.5,389.1L302.6,391.9L305.2,394.0L305.3,397.6L306.1,397.9L307.7,397.5L307.3,395.4L307.9,394.0L310.7,393.9L311.5,395.0L314.3,395.0L318.8,392.6L318.7,390.0L315.9,388.5L315.6,386.8L315.9,384.6L317.8,385.6L319.1,385.3L320.9,384.1L320.7,381.9L319.4,379.8L317.4,378.7L315.2,378.0L313.6,379.3Z","AT13":"M334.5,384.3L335.4,384.9L339.0,384.4L338.2,382.6L336.8,382.1L335.1,383.0Z","AT34":"M266.7,407.9L267.8,404.2L267.4,402.3L267.7,400.9L265.4,398.7L265.0,397.7L260.4,397.7L261.5,400.0L260.0,402.3L260.4,403.9L261.1,404.3L260.9,405.8L263.3,406.3L264.3,407.9L267.1,409.3Z","BE1":"M204.7,339.7L205.5,341.5L207.2,341.4L206.3,339.1Z","BE2":"M221.0,343.4L221.8,342.8L220.5,342.4L219.6,342.6ZM211.9,330.9L210.7,329.6L209.7,330.8L207.8,329.9L207.0,330.3L206.8,331.5L205.2,331.3L205.2,331.6L202.2,333.6L200.9,333.7L198.5,332.1L196.0,332.2L196.0,330.6L193.2,331.3L187.0,334.4L187.6,338.9L189.7,341.1L189.7,340.5L190.8,339.7L195.0,341.3L196.1,340.7L196.9,341.4L199.8,341.3L201.1,342.4L208.1,341.8L209.5,341.2L212.5,342.3L213.4,343.1L216.9,343.1L219.7,341.7L219.6,340.7L221.1,337.7L221.1,336.0L218.8,334.8L218.1,333.7L215.4,333.9L214.1,332.2L214.2,331.0L213.6,330.3ZM205.5,341.5L204.7,339.7L206.3,339.1L207.2,341.4Z","BE3":"M221.0,343.4L219.6,342.6L219.7,341.7L216.9,343.1L213.4,343.1L212.5,342.3L209.5,341.2L208.1,341.8L201.1,342.4L199.8,341.3L196.9,341.4L196.1,340.7L195.0,341.3L193.1,340.6L194.1,344.7L197.3,345.5L198.0,348.3L201.5,348.1L203.1,350.0L202.7,351.3L203.1,352.9L202.2,354.5L205.3,355.4L207.9,354.6L209.5,352.2L210.2,352.6L209.4,355.1L209.9,357.9L210.9,358.1L215.3,361.5L216.0,363.5L219.9,362.9L220.8,361.0L219.4,357.8L221.3,353.7L222.7,352.4L223.9,353.4L224.6,351.8L226.9,350.3L226.1,347.4L224.8,346.9L224.9,344.9L223.2,342.9L221.8,342.8ZM189.7,341.1L191.4,340.2L190.8,339.7L189.7,340.5Z","BG31":"M420.3,445.2L420.5,443.9L421.9,442.6L421.1,441.7L417.3,440.4L416.1,443.5L414.9,444.3L414.7,447.6L417.6,452.7L419.4,453.8L420.4,453.9L424.0,456.5L426.0,457.3L429.0,456.2L431.2,458.3L436.0,456.6L439.0,459.5L439.4,460.6L441.9,460.7L443.6,459.8L446.4,460.5L449.5,459.5L447.2,455.7L447.7,452.3L448.9,452.1L450.3,448.8L449.4,447.3L449.2,444.7L450.1,443.7L440.2,444.0L438.4,445.3L435.8,445.8L427.0,444.9L422.2,446.4Z","BG32":"M472.8,436.5L477.2,431.9L473.6,432.2L471.7,430.8L467.9,431.5L461.3,434.7L458.8,436.5L454.4,442.2L453.0,443.3L450.1,443.7L449.2,444.7L449.4,447.3L450.3,448.8L448.9,452.1L447.7,452.3L447.2,455.7L449.5,459.3L456.7,457.1L459.4,456.7L461.7,454.8L462.7,453.0L461.1,451.1L460.6,447.9L459.6,447.4L459.0,446.2L459.5,444.4L460.9,443.3L462.1,443.2L465.9,445.5L467.9,444.0L468.3,441.6L470.1,438.6L472.7,438.5Z","BG33":"M488.5,433.4L482.8,433.8L481.3,433.2L479.9,431.2L477.2,431.9L472.8,436.5L472.7,438.5L470.1,438.6L468.3,441.6L467.9,444.0L465.9,445.5L462.1,443.2L460.9,443.3L459.5,444.4L459.0,446.2L459.6,447.4L460.6,447.9L461.1,451.1L462.7,453.0L464.3,451.3L467.6,451.3L467.9,452.4L469.3,452.4L475.9,449.7L483.7,450.1L483.2,444.5L484.4,440.5L488.8,439.3L489.5,437.0Z","BG34":"M467.9,452.4L467.6,451.3L464.3,451.3L461.7,454.8L459.4,456.7L456.7,457.1L449.5,459.3L450.3,462.5L452.2,463.3L452.2,468.2L455.6,468.8L458.3,467.1L460.6,468.4L462.2,467.4L464.9,468.3L465.5,465.1L469.5,465.5L471.2,469.2L471.4,468.5L475.6,466.4L476.7,464.9L478.3,464.3L481.0,464.9L483.1,465.9L488.7,463.6L482.8,457.8L480.6,456.8L483.9,452.0L483.7,450.1L475.9,449.7L469.3,452.4Z","BG41":"M424.0,456.5L421.7,462.1L418.9,462.9L418.2,463.8L418.8,466.6L420.3,469.8L418.5,472.4L420.7,474.7L422.8,475.7L425.4,476.1L426.2,478.4L428.1,481.2L428.0,487.2L436.5,485.1L441.2,482.9L441.3,479.2L437.3,476.9L436.1,471.5L438.1,469.1L438.6,467.0L436.9,465.0L440.5,463.2L442.9,463.9L443.3,463.2L442.0,462.0L441.9,460.7L439.4,460.6L439.0,459.5L436.0,456.6L431.2,458.3L429.0,456.2L426.0,457.3Z","BG42":"M443.6,459.8L441.9,460.7L442.0,462.0L443.3,463.2L442.9,463.9L440.5,463.2L436.9,465.0L438.6,467.0L438.1,469.1L436.1,471.5L437.3,476.9L441.3,479.2L441.5,481.7L447.2,480.2L450.9,482.6L452.1,481.9L456.0,482.4L456.7,483.1L465.0,480.6L467.4,479.2L467.8,477.9L465.9,473.6L469.2,472.8L469.0,471.3L470.9,470.2L471.2,469.2L469.5,465.5L465.5,465.1L464.9,468.3L462.2,467.4L460.6,468.4L458.3,467.1L455.6,468.8L452.2,468.2L452.2,463.3L450.3,462.5L449.5,459.5L446.4,460.5Z","CY":"M597.2,541.2L589.0,548.8L584.5,551.6L578.5,552.9L575.6,556.9L569.4,560.7L570.9,563.1L573.2,565.1L581.5,565.0L591.9,554.9L593.9,555.0L591.1,553.3L590.7,550.3L591.9,549.3L592.3,547.5L595.2,544.7L597.1,542.2Z","CZ01":"M311.1,353.6L312.5,356.1L315.5,355.0L315.9,353.8L313.8,352.2Z","CZ02":"M323.9,352.7L323.1,352.0L322.9,350.0L320.5,349.0L320.3,346.0L318.0,344.8L315.2,346.9L313.2,346.7L311.6,349.5L308.5,349.8L302.1,354.3L306.5,357.1L306.9,360.5L306.4,363.7L311.8,362.8L316.1,363.1L317.4,361.7L319.1,362.4L322.0,361.2L322.1,359.0L324.8,356.8L324.9,355.3L323.8,353.9ZM311.1,353.6L313.8,352.2L315.9,353.8L315.5,355.0L312.5,356.1Z","CZ03":"M302.1,354.3L300.9,354.2L300.1,355.7L298.7,355.6L297.0,357.2L293.0,357.8L291.4,360.3L294.1,364.2L294.1,364.9L295.9,366.8L298.0,367.3L303.0,372.8L304.5,373.0L311.0,378.9L313.6,379.3L315.2,378.0L317.4,378.7L318.7,375.6L320.1,374.9L320.6,371.5L326.5,372.6L326.9,371.9L326.2,369.3L319.5,366.3L318.9,365.1L319.1,362.4L317.4,361.7L316.1,363.1L311.8,362.8L306.4,363.7L306.9,360.5L306.5,357.1Z","CZ04":"M313.2,346.7L311.8,343.7L312.5,342.0L314.3,340.8L313.8,338.7L312.8,337.7L310.9,337.7L310.6,338.6L311.5,340.2L306.1,343.3L304.2,343.5L302.7,345.2L297.9,347.6L296.9,349.3L295.4,348.6L293.0,349.4L291.2,350.9L290.3,353.2L288.7,351.1L287.9,351.0L289.7,355.3L293.0,357.8L297.0,357.2L298.7,355.6L300.1,355.7L300.9,354.2L302.1,354.3L308.5,349.8L311.6,349.5Z","CZ05":"M320.7,338.2L318.9,337.9L318.0,340.2L316.4,340.4L315.8,341.2L314.3,340.8L312.5,342.0L311.8,343.7L313.2,346.7L315.2,346.9L318.0,344.8L320.3,346.0L320.5,349.0L322.9,350.0L323.1,352.0L323.9,352.7L323.8,353.9L324.9,355.3L324.8,356.8L334.9,360.6L337.1,359.7L339.3,359.9L339.4,358.1L338.4,356.2L338.1,353.8L339.0,349.9L337.5,351.4L336.1,351.1L335.1,349.2L332.1,346.6L333.6,343.6L330.3,342.9L329.5,343.4L327.0,341.8L322.4,341.2Z","CZ06":"M324.8,356.8L322.1,359.0L322.0,361.2L319.1,362.4L318.9,365.1L319.5,366.3L326.2,369.3L326.9,371.9L326.5,372.6L335.0,374.9L337.7,373.4L341.5,374.7L342.3,376.2L344.5,372.0L347.0,372.4L349.7,371.4L344.1,368.0L343.7,365.0L341.0,361.8L339.9,363.0L339.3,359.9L337.1,359.7L334.9,360.6Z","CZ07":"M355.3,360.1L351.4,359.7L348.0,356.4L342.9,355.2L343.3,350.5L345.0,348.4L339.1,345.7L338.9,346.4L340.3,348.6L339.0,349.9L338.1,353.8L338.4,356.2L339.4,358.1L339.3,359.9L339.9,363.0L341.0,361.8L343.7,365.0L344.1,368.0L349.7,371.4L353.9,367.7L354.7,364.0L356.2,363.0L357.0,361.5Z","CZ08":"M351.8,350.8L349.8,352.3L347.6,350.1L348.3,348.7L348.1,347.5L345.0,348.4L343.3,350.5L342.9,355.2L348.0,356.4L351.4,359.7L355.3,360.1L357.0,361.5L358.7,359.6L361.6,358.9L360.7,356.6L358.5,355.3L357.8,352.7L355.1,352.8Z","DE1":"M263.2,361.8L261.5,361.3L261.6,360.1L258.5,360.7L259.0,362.3L255.6,363.7L255.4,364.5L252.6,365.8L250.8,363.4L249.9,364.5L248.2,363.4L249.0,366.3L248.8,368.4L248.0,369.0L246.4,373.3L241.2,379.5L239.5,385.4L238.2,387.7L238.5,390.2L237.7,393.9L238.1,396.5L238.6,397.0L239.5,397.4L241.5,396.7L242.9,397.2L245.3,396.3L247.6,397.1L249.6,395.5L247.7,395.3L248.6,393.7L249.8,393.3L250.9,394.1L250.3,395.2L251.8,395.4L252.4,394.9L252.7,395.8L256.1,395.8L260.4,397.7L263.8,395.6L266.3,396.1L266.9,393.1L266.6,390.5L266.9,388.3L265.2,383.7L265.8,382.5L266.9,382.5L268.5,381.5L268.5,378.7L270.8,378.4L270.1,377.6L269.9,373.7L268.2,372.4L266.9,369.9L266.3,364.3L264.7,365.0Z","DE2":"M271.7,351.2L267.5,347.5L265.8,348.0L264.7,349.6L263.0,349.8L261.3,352.8L260.4,352.9L260.0,354.7L259.0,355.2L257.4,354.2L254.5,355.5L255.0,359.2L255.9,360.9L255.6,363.7L259.0,362.3L258.5,360.7L261.6,360.1L261.5,361.3L263.2,361.8L264.7,365.0L266.3,364.3L266.9,369.9L268.2,372.4L269.9,373.7L270.1,377.6L270.8,378.4L268.5,378.7L268.5,381.5L266.9,382.5L265.8,382.5L265.2,383.7L266.9,388.3L266.6,390.5L266.9,393.1L266.3,396.1L263.8,395.6L260.4,397.7L265.0,397.7L265.4,398.7L267.7,400.9L267.4,402.3L270.3,400.2L270.5,397.5L274.6,398.1L275.4,397.8L276.9,400.1L281.5,399.2L281.4,398.4L283.1,397.9L283.9,396.7L288.7,396.1L291.8,394.7L294.5,395.7L295.9,394.8L298.4,397.8L299.9,397.4L300.2,394.9L298.5,393.9L299.0,391.8L296.2,387.6L303.4,382.9L303.6,380.0L304.4,379.3L306.8,380.5L307.7,378.7L307.4,377.1L307.8,376.1L304.5,373.0L303.0,372.8L298.0,367.3L295.9,366.8L294.1,364.9L294.1,364.2L291.4,360.3L293.0,357.8L289.7,355.3L287.9,351.0L285.9,349.3L282.5,349.8L281.2,349.3L280.2,348.0L278.9,348.5L279.0,351.0L278.2,352.0L277.3,350.7L275.5,350.1L273.5,350.7L274.0,352.1L273.2,352.8L271.9,352.8Z","DE3":"M302.2,313.2L300.0,311.5L297.6,312.5L297.2,315.4L297.8,315.9L303.3,315.9L303.5,314.9Z","DE4":"M307.4,298.1L302.4,297.5L299.6,301.1L295.4,303.1L286.4,300.3L283.3,302.3L281.5,302.5L280.6,304.1L278.1,304.3L281.5,305.7L284.8,308.0L286.9,308.0L288.2,309.6L287.6,314.4L288.7,314.4L289.1,315.2L288.4,320.0L288.9,321.1L289.9,322.0L294.0,323.0L298.0,324.8L298.2,327.3L297.2,328.4L298.6,330.3L299.0,332.4L300.9,331.7L304.0,332.7L305.5,332.6L307.5,331.7L308.8,329.6L311.8,329.4L314.7,328.6L314.7,327.2L313.2,324.5L314.4,320.4L313.6,317.8L312.6,317.2L311.8,315.1L312.6,313.0L311.9,311.3L307.6,308.1L307.3,305.9L309.2,303.9L309.6,299.6L307.3,300.8ZM297.2,315.4L297.6,312.5L300.0,311.5L302.2,313.2L303.5,314.9L303.3,315.9L297.8,315.9Z","DE5":"M254.4,306.2L255.2,304.3L250.2,302.5L252.4,305.6ZM250.3,298.4L251.5,298.1L251.9,297.7L251.5,296.5L250.7,296.2L251.1,297.1Z","DE6":"M264.6,299.4L268.5,299.2L267.0,297.3L267.3,295.7L266.1,294.6L262.7,297.0L263.1,298.0ZM250.1,291.0L250.7,289.4L250.1,289.3L249.2,290.7Z","DE7":"M261.7,330.7L261.3,329.5L259.6,329.0L256.6,332.5L254.6,331.4L254.1,331.8L254.0,333.2L251.9,333.6L250.6,334.8L251.9,335.5L252.1,336.7L251.3,338.0L250.1,338.1L249.3,340.3L248.0,342.0L246.0,342.8L245.5,344.9L245.7,346.4L244.2,347.5L243.7,349.6L245.2,351.8L241.4,355.2L242.9,356.7L245.9,355.8L246.9,356.5L248.6,360.9L247.8,361.7L248.2,363.4L249.9,364.5L250.8,363.4L252.6,365.8L255.4,364.5L255.6,363.7L255.9,360.9L255.0,359.2L254.5,355.5L257.4,354.2L259.0,355.2L260.0,354.7L260.4,352.9L261.3,352.8L263.0,349.8L264.7,349.6L265.8,348.0L266.0,345.5L264.3,345.7L264.6,343.8L265.8,342.2L265.6,340.0L267.3,339.7L267.6,336.7L265.1,334.8L264.6,333.7L263.3,333.5L262.6,335.0L261.1,333.7Z","DE9":"M255.8,292.6L252.0,291.6L250.7,293.8L250.7,296.2L251.5,296.5L251.9,297.7L251.5,298.1L250.3,298.4L250.9,297.7L248.4,296.2L247.9,297.1L248.4,298.5L247.3,299.4L246.0,297.7L247.0,297.3L246.9,296.3L245.7,294.5L243.6,294.3L237.6,295.1L236.0,297.5L235.3,299.8L235.7,300.2L238.3,300.5L237.4,301.9L237.0,306.3L234.9,311.9L231.9,311.9L231.6,314.3L234.7,315.1L235.2,318.6L237.9,318.0L240.2,316.6L240.9,314.9L244.5,317.5L244.0,319.3L244.7,320.8L243.6,321.5L245.7,322.0L249.0,321.1L249.6,318.6L248.0,315.4L252.1,314.7L252.5,316.4L254.4,316.3L255.9,315.0L256.4,316.3L255.1,318.1L255.0,319.9L256.7,321.5L258.2,324.5L258.4,325.6L259.5,326.1L259.3,329.1L261.3,329.5L261.7,330.7L261.1,333.7L262.6,335.0L263.3,333.5L264.6,333.7L272.7,329.2L271.5,326.5L271.9,324.8L271.2,323.1L275.3,322.2L276.0,320.7L276.1,316.9L274.9,315.2L275.7,314.8L273.1,309.8L273.6,308.9L280.6,307.3L281.5,305.7L277.2,303.8L275.1,300.9L273.5,301.2L268.5,299.2L264.6,299.4L263.1,298.0L263.0,297.3L261.1,296.4L258.1,292.1ZM254.4,306.2L252.4,305.6L250.2,302.5L255.2,304.3ZM232.4,296.6L233.3,296.6L232.8,295.1L231.7,295.7Z","DE8":"M297.5,279.0L296.1,284.1L294.6,282.5L292.7,282.9L290.5,282.0L286.2,286.5L281.8,287.2L279.8,291.3L278.9,290.2L276.6,289.6L274.3,290.4L273.0,292.9L274.9,295.6L274.4,296.7L271.8,299.0L271.4,300.4L273.5,301.2L275.1,300.9L277.2,303.8L278.1,304.3L280.6,304.1L281.5,302.5L283.3,302.3L286.4,300.3L295.4,303.1L299.6,301.1L302.4,297.5L307.4,298.1L307.3,300.8L309.6,299.6L307.7,292.7L306.0,292.7L305.3,292.0L305.5,291.4L307.1,290.8L307.1,289.7L305.8,288.6L304.6,288.9L302.9,286.2L299.6,287.0L298.0,285.7L300.6,283.0L300.1,281.4L300.8,279.3L299.5,279.4L299.1,280.3Z","DEA":"M252.1,314.7L248.0,315.4L249.6,318.6L249.0,321.1L245.7,322.0L243.6,321.5L244.7,320.8L244.0,319.3L244.5,317.5L240.9,314.9L240.2,316.6L237.9,318.0L235.2,318.6L232.0,320.5L232.1,323.5L228.1,325.2L225.7,323.8L223.8,325.0L223.4,326.3L225.6,330.2L225.8,332.8L224.1,334.8L225.2,335.8L221.9,338.2L224.0,340.3L223.2,342.9L224.9,344.9L224.8,346.9L226.1,347.4L226.9,350.3L231.1,349.9L230.9,348.3L232.2,347.8L232.6,346.6L235.7,345.7L238.2,344.3L240.6,342.5L242.0,340.6L242.7,340.8L244.6,344.7L245.5,344.9L246.0,342.8L248.0,342.0L249.3,340.3L250.1,338.1L251.3,338.0L252.1,336.7L251.9,335.5L250.6,334.8L251.9,333.6L254.0,333.2L254.1,331.8L254.6,331.4L256.6,332.5L259.6,329.0L259.5,326.1L258.4,325.6L258.2,324.5L256.7,321.5L255.0,319.9L255.1,318.1L256.4,316.3L255.9,315.0L254.4,316.3L252.5,316.4Z","DEB":"M243.7,349.6L244.2,347.5L245.7,346.4L245.5,344.9L244.6,344.7L242.7,340.8L242.0,340.6L240.6,342.5L238.2,344.3L235.7,345.7L232.6,346.6L232.2,347.8L230.9,348.3L231.1,349.9L226.9,350.3L224.6,351.8L223.9,353.4L223.7,355.3L225.4,358.0L227.2,358.7L227.4,360.3L226.0,363.2L228.2,363.7L233.1,362.0L235.7,363.7L235.4,365.6L237.0,366.7L236.9,367.6L235.9,368.7L236.0,369.7L236.5,370.2L237.7,370.3L239.4,372.1L242.4,372.3L245.9,373.7L247.1,371.8L248.0,369.0L248.8,368.4L249.0,366.3L247.8,361.7L248.6,360.9L246.9,356.5L245.9,355.8L242.9,356.7L241.4,355.2L245.2,351.8Z","DEC":"M235.7,363.7L233.1,362.0L228.2,363.7L226.0,363.2L225.8,364.5L227.8,365.5L230.1,369.9L231.7,369.1L235.2,370.8L236.5,370.2L236.0,369.7L235.9,368.7L236.9,367.6L237.0,366.7L235.4,365.6Z","DED":"M298.6,330.3L297.2,328.4L292.3,329.0L288.3,330.7L288.2,335.0L289.5,338.0L291.1,338.2L293.0,339.8L293.5,340.7L289.2,342.6L289.3,344.1L290.0,345.0L287.4,346.8L286.1,346.5L285.6,347.4L285.9,349.3L287.9,351.0L288.7,351.1L290.3,353.2L291.2,350.9L293.0,349.4L295.4,348.6L296.9,349.3L297.9,347.6L302.7,345.2L304.2,343.5L306.1,343.3L311.5,340.2L310.6,338.6L310.9,337.7L312.8,337.7L313.8,338.7L314.3,340.8L315.8,341.2L316.4,340.4L318.0,335.8L318.1,333.5L316.9,330.4L314.7,328.6L311.8,329.4L308.8,329.6L307.5,331.7L305.5,332.6L304.0,332.7L300.9,331.7L299.0,332.4Z","DEE":"M289.5,338.0L288.2,335.0L288.3,330.7L292.3,329.0L297.2,328.4L298.2,327.3L298.0,324.8L294.0,323.0L289.9,322.0L288.9,321.1L288.4,320.0L289.1,315.2L288.7,314.4L287.6,314.4L288.2,309.6L286.9,308.0L284.8,308.0L281.5,305.7L280.6,307.3L273.6,308.9L273.1,309.8L275.7,314.8L274.9,315.2L276.1,316.9L276.0,320.7L275.3,322.2L271.2,323.1L271.9,324.8L271.5,326.5L272.7,329.2L274.9,329.6L275.6,332.7L280.0,333.8L280.8,334.8L279.9,335.7L281.0,338.0L283.3,338.3L286.7,340.2L288.9,340.5Z","DEF":"M259.8,275.8L258.6,276.2L256.8,275.1L252.2,274.4L252.3,275.8L254.3,279.9L254.3,282.3L252.6,284.1L254.1,285.2L253.9,286.9L254.9,288.4L254.1,289.4L254.4,290.4L255.4,291.4L257.5,291.5L260.6,294.5L261.2,296.1L262.7,297.0L266.1,294.6L267.3,295.7L267.0,297.3L268.5,299.2L271.4,300.4L271.8,299.0L274.4,296.7L274.9,295.6L273.0,292.9L274.3,290.4L273.1,288.6L275.8,286.5L275.9,284.4L274.7,283.4L272.5,284.5L268.7,282.6L267.1,283.9L267.0,282.5L265.2,281.7L265.7,279.1L264.9,276.9ZM276.7,281.0L275.1,281.9L276.7,283.1L277.8,282.4ZM251.4,280.9L251.8,281.5L252.8,281.1L253.0,280.3ZM248.4,278.3L249.1,279.3L249.7,279.0L249.4,277.4ZM251.3,276.9L250.3,277.7L251.2,278.4L252.1,277.7ZM248.7,275.1L249.1,275.4L249.7,274.8L249.5,273.2Z","DEG":"M286.7,340.2L283.3,338.3L281.0,338.0L279.9,335.7L280.8,334.8L280.0,333.8L275.6,332.7L274.9,329.6L273.8,329.2L272.4,329.2L264.6,333.7L265.1,334.8L267.6,336.7L267.6,337.5L267.3,339.7L265.6,340.0L265.8,342.2L264.6,343.8L264.3,345.7L266.0,345.5L265.8,348.0L267.5,347.5L271.7,351.2L271.9,352.8L273.2,352.8L274.0,352.1L273.5,350.7L275.5,350.1L277.3,350.7L278.2,352.0L279.0,351.0L278.9,348.5L280.2,348.0L281.2,349.3L282.5,349.8L285.9,349.3L285.6,347.4L286.1,346.5L287.4,346.8L290.0,345.0L289.3,344.1L289.2,342.6L293.5,340.7L293.0,339.8L291.1,338.2L289.5,338.0L288.9,340.5Z","DK01":"M314.0,271.4L314.6,270.9L314.8,269.2L311.0,266.7L310.5,269.5L311.2,270.5ZM290.8,262.5L292.1,262.6L291.7,260.9L291.3,261.1ZM290.6,262.7L289.3,257.2L289.7,255.1L286.6,253.9L283.1,256.4L283.6,258.4L283.1,260.4L284.1,260.5L285.1,259.6L286.7,260.8L286.0,262.1L287.8,262.7L289.1,261.9L289.8,263.1Z","DK02":"M281.6,258.2L280.9,257.3L275.8,261.2L277.1,268.1L281.7,270.7L283.1,273.0L280.4,275.1L276.3,274.3L275.7,275.3L276.0,276.8L279.8,279.1L282.5,278.6L283.7,277.4L284.6,278.5L288.0,273.6L286.2,271.2L286.2,269.5L288.0,267.3L286.5,265.5L286.6,263.9L287.8,262.7L286.0,262.1L286.7,260.8L285.1,259.6L284.1,260.5L283.1,260.4L282.3,261.8Z","DK03":"M270.8,278.6L272.0,278.7L272.9,275.7L269.6,277.4ZM268.7,275.2L269.7,276.0L270.5,275.1L269.7,274.4ZM251.0,269.5L250.5,271.5L251.6,271.2L251.8,269.4ZM272.9,267.7L271.6,263.4L270.2,264.6L267.8,262.8L262.6,264.5L264.9,269.6L266.2,270.1L266.9,272.0L271.1,273.6L272.8,271.0ZM261.6,266.3L263.3,262.9L259.6,257.5L258.2,257.2L256.5,258.7L254.9,258.1L250.9,259.7L248.1,259.1L247.4,263.4L248.3,264.1L249.2,263.4L250.4,266.7L251.0,265.4L252.0,265.7L252.7,270.1L252.2,274.4L256.8,275.1L258.6,276.2L261.4,274.8L262.6,275.4L263.6,274.6L265.7,274.9L265.2,273.2L263.8,272.1L261.2,272.4L260.9,270.2L262.5,269.2Z","DK04":"M271.2,259.8L271.7,257.6L270.7,256.1L269.9,256.9L270.4,259.4ZM259.1,245.0L257.1,246.4L257.4,244.1L256.2,242.5L254.0,245.3L253.2,248.1L252.3,247.0L252.1,245.0L251.6,245.1L251.4,246.9L248.7,245.2L248.2,246.7L248.6,249.7L247.9,253.5L249.8,257.2L248.1,259.1L250.9,259.7L254.9,258.1L256.5,258.7L258.2,257.2L259.6,257.5L262.3,261.1L264.9,261.4L267.2,258.5L267.9,256.7L267.6,253.5L269.0,251.6L269.6,252.0L268.9,253.1L270.2,254.2L271.1,252.6L272.2,253.6L274.1,249.7L273.0,247.3L270.1,247.6L268.7,246.9L268.4,244.8L267.2,244.8L264.3,246.9ZM279.1,244.3L280.1,245.0L280.7,244.1L280.0,243.5Z","DK05":"M268.1,240.5L270.2,235.3L269.7,227.9L264.8,230.0L259.8,236.6L252.4,237.8L250.5,240.0L249.5,242.4L250.5,244.3L252.6,241.9L252.5,244.2L253.6,244.6L254.7,243.2L255.9,239.8L257.4,239.2L258.1,240.0L258.1,242.8L259.1,245.0L264.3,246.9L268.0,244.1ZM274.7,235.8L275.5,234.6L274.7,234.1L273.5,235.3Z","EE":"M388.1,209.1L388.9,209.3L389.1,207.8L388.2,207.9ZM368.8,208.0L371.9,211.3L372.8,213.4L374.3,210.6L379.3,206.2L381.0,201.9L380.0,201.4L374.7,202.9ZM372.9,198.9L373.7,201.0L374.7,201.5L375.9,199.4L378.1,198.3L376.8,196.5L374.1,195.1L372.6,197.3L370.3,198.3L370.8,198.9ZM400.5,180.5L399.0,181.7L397.9,180.8L395.9,183.3L391.0,183.7L390.5,185.3L387.7,185.9L385.3,188.0L385.4,189.4L384.1,188.3L382.7,190.8L381.1,191.5L381.4,193.3L380.9,194.2L381.7,195.9L381.4,196.8L383.5,198.8L382.8,200.0L383.1,201.3L385.7,205.1L389.4,206.6L390.8,203.9L392.7,204.0L393.0,209.0L392.7,212.0L398.2,208.1L400.6,207.4L407.3,209.4L410.6,212.8L413.2,213.5L416.1,211.1L420.2,212.0L420.1,209.5L420.7,207.0L422.0,205.6L421.2,203.4L418.5,199.9L418.1,197.3L415.0,191.3L417.3,187.4L417.5,184.2L419.3,180.5L417.7,178.8L416.5,180.3L408.9,181.6L406.1,180.5L404.6,181.1ZM379.2,194.6L378.6,196.0L379.5,196.3L379.8,194.6ZM387.9,183.0L387.4,184.0L388.3,184.7L388.9,184.6Z","EL30":"M446.7,576.9L447.8,577.2L447.3,575.5L445.8,575.7ZM440.1,569.6L441.1,572.1L442.7,572.4L442.8,570.3L440.9,568.7ZM440.9,553.0L440.2,554.0L441.5,554.7L442.3,553.7ZM444.6,550.6L445.4,549.6L443.7,547.1L442.9,547.2L442.8,548.5L441.2,548.1L441.3,549.2L444.5,549.9ZM443.6,545.2L444.0,546.0L444.8,546.1L445.3,544.8L444.8,544.4ZM452.2,543.2L450.3,538.1L450.7,536.1L445.6,534.8L445.2,537.0L443.7,538.1L441.2,537.4L438.7,538.9L439.9,539.3L438.9,540.7L438.9,541.7L440.0,542.3L443.0,541.5L443.4,542.7L446.5,541.3L447.6,542.6L449.7,543.6L450.8,545.3L451.9,545.0Z","EL41":"M479.5,539.5L477.7,541.2L480.2,541.5L481.3,540.1ZM484.3,538.8L483.4,540.4L484.7,540.4L485.2,538.8ZM487.6,535.0L484.8,537.0L488.4,538.2L490.5,536.4ZM475.2,528.6L474.4,530.9L476.3,531.8L477.6,528.8L476.8,525.2L474.6,524.5L472.6,525.9ZM469.8,525.5L468.3,525.8L469.3,527.1L470.2,526.8ZM470.4,515.1L476.5,517.6L479.6,517.4L480.8,516.1L479.2,515.4L479.0,513.4L476.2,511.0L473.9,511.8ZM459.0,511.3L458.4,512.6L459.3,513.4L459.9,511.6ZM460.5,507.1L461.1,505.5L462.5,506.8L463.2,503.7L459.9,503.9L458.3,504.9L459.0,506.7Z","EL42":"M474.4,563.1L474.8,561.9L473.8,561.3L472.7,562.8ZM466.5,560.7L467.5,560.3L466.7,559.0L465.4,560.0ZM460.0,560.7L461.1,559.6L459.4,558.9L457.7,560.2ZM469.4,559.0L469.9,557.5L468.7,557.7L468.0,559.0ZM461.4,558.7L462.2,557.7L461.2,556.9L460.2,558.1ZM472.2,558.3L472.8,557.5L471.0,556.1L470.4,557.2ZM462.8,555.7L463.7,555.0L462.5,553.7L461.7,554.6ZM459.7,552.9L459.9,551.5L459.0,551.3L458.2,552.6ZM469.2,552.9L470.1,550.9L468.4,550.9L466.8,552.8ZM474.1,552.2L474.0,549.6L472.7,548.7L470.8,551.4L473.1,553.6ZM457.7,549.9L458.3,548.1L457.5,547.4L456.8,548.1ZM463.8,548.1L465.1,546.8L464.2,545.6L463.7,546.1ZM467.9,547.8L469.1,546.5L468.8,545.3L467.8,546.0ZM456.0,546.6L456.9,543.9L455.5,544.1L454.9,546.0ZM470.3,545.9L471.0,544.6L469.6,544.3L468.9,545.5ZM467.3,544.4L468.6,543.1L467.1,542.5L465.2,543.6ZM463.8,540.1L461.7,538.4L459.6,538.6L460.5,539.9L464.2,541.6ZM496.2,575.1L497.1,574.9L497.3,573.7L495.6,573.5ZM500.0,573.0L499.6,568.7L497.5,570.4L498.7,572.5ZM499.4,566.6L500.3,565.9L499.4,565.0L498.1,565.9ZM478.9,562.3L479.4,561.3L478.4,560.8L477.4,562.1ZM505.3,559.4L506.0,563.0L506.9,563.5L510.1,559.5L511.0,553.7L507.1,555.9ZM485.3,557.8L486.2,557.1L485.6,556.1L484.2,556.7ZM499.6,556.7L500.3,556.1L499.2,555.0L498.2,556.4ZM497.0,554.6L497.3,553.6L496.0,553.4L495.3,554.8ZM479.0,554.6L479.8,552.2L478.5,552.4L476.7,554.8ZM493.7,553.1L493.3,551.4L492.6,551.5L492.4,552.8L493.1,553.4ZM505.5,552.6L506.2,551.7L505.2,551.0L504.1,552.1ZM484.3,550.8L485.2,549.8L484.1,549.1L483.1,550.4ZM496.0,550.9L497.1,548.9L495.5,548.8L493.7,550.8ZM493.1,549.0L493.7,547.9L492.4,547.4L491.7,549.0ZM488.6,545.6L490.0,546.2L490.8,545.4L489.8,544.6ZM489.8,540.3L491.3,541.3L491.9,540.2L491.0,539.7Z","EL43":"M460.4,591.7L461.3,590.8L460.2,590.2L458.9,591.1ZM455.1,580.3L453.4,578.6L453.2,580.9L451.5,581.1L451.4,584.4L452.7,585.8L462.0,585.1L468.2,585.3L469.3,587.6L472.0,587.3L488.0,582.6L489.0,581.4L489.1,579.2L488.2,578.4L482.3,581.9L480.8,578.7L478.0,579.9L472.4,580.3L470.6,579.2L462.0,582.1L459.3,578.9Z","EL51":"M464.1,496.4L465.5,495.3L463.9,494.5L462.1,495.6ZM449.3,494.9L451.8,495.9L453.1,495.0L453.1,493.7L450.9,491.9ZM470.6,480.6L473.6,477.6L472.3,474.0L469.2,472.7L465.9,473.6L467.8,477.9L467.4,479.2L465.0,480.6L456.7,483.1L456.0,482.4L452.1,481.9L450.9,482.6L447.2,480.2L441.5,481.7L441.2,482.9L436.5,485.1L439.3,488.4L443.7,490.0L441.2,494.3L444.5,494.5L448.6,490.1L450.7,491.1L452.8,490.8L456.5,487.8L463.0,488.6L466.9,488.2L468.9,490.1L471.4,485.1Z","EL52":"M437.5,508.9L439.7,508.4L437.5,506.0L434.9,506.8ZM439.3,488.4L436.5,485.1L426.4,487.5L426.0,488.2L426.2,490.3L425.1,490.3L424.5,491.4L421.1,492.1L419.5,491.5L416.1,493.2L414.8,496.3L414.4,498.3L415.7,500.1L416.8,500.2L417.5,503.0L419.8,503.9L421.3,505.9L420.7,507.8L421.5,507.8L422.3,508.9L423.4,507.7L424.1,508.8L426.6,510.7L428.2,510.2L426.6,508.4L427.0,504.0L426.3,502.5L427.0,501.1L430.0,499.1L430.4,499.9L429.5,501.7L431.5,503.3L435.9,504.8L436.9,503.9L439.6,504.0L444.4,507.6L445.0,506.7L444.6,505.2L440.7,503.0L440.9,501.9L442.7,501.0L444.3,501.6L444.1,500.4L442.1,499.7L439.6,496.3L440.0,494.9L441.2,494.3L443.7,490.0Z","EL53":"M414.8,496.3L404.8,499.1L406.3,502.9L405.2,505.3L403.4,506.4L403.3,507.8L404.7,508.0L406.6,510.6L406.5,511.6L407.9,512.7L408.6,514.9L411.0,515.0L413.7,513.9L419.0,513.8L418.7,511.8L421.3,505.9L419.8,503.9L417.5,503.0L416.8,500.2L415.7,500.1L414.4,498.3Z","EL54":"M411.0,515.0L408.6,514.9L407.9,512.7L406.5,511.6L406.6,510.6L404.7,508.0L403.3,507.8L401.8,512.6L399.2,513.9L398.6,515.2L399.6,517.8L398.4,517.5L398.6,519.0L397.5,520.3L394.9,520.0L397.0,521.1L399.4,525.7L400.0,526.1L401.8,526.1L405.7,530.6L406.5,529.0L410.4,528.7L410.8,527.5L413.5,526.1L413.6,523.6L410.3,521.0L409.5,518.2Z","EL61":"M434.8,522.5L435.5,524.1L436.5,523.6L435.9,522.2ZM442.7,521.6L443.4,522.6L444.3,522.6L444.9,521.9L443.3,521.3ZM440.5,521.0L439.5,521.9L441.0,522.6L441.6,521.7ZM446.2,518.7L445.2,520.5L446.3,520.8L446.8,518.5ZM448.5,516.9L447.5,516.7L447.0,518.4L448.4,518.1ZM424.1,508.8L423.4,507.7L422.3,508.9L421.5,507.8L420.7,507.8L418.7,511.8L419.0,513.8L413.7,513.9L411.0,515.0L409.5,518.2L410.3,521.0L413.6,523.6L413.5,526.1L417.1,524.4L418.6,526.2L419.9,525.7L421.1,526.7L423.0,525.9L424.7,522.7L428.2,524.5L428.7,525.7L435.2,525.4L432.2,521.6L433.8,520.0L435.9,520.4L437.6,522.6L438.4,522.4L438.5,521.0L434.8,517.1L432.3,515.8L431.0,512.8L429.4,511.8L428.7,510.5L428.2,510.2L426.6,510.7ZM448.3,514.1L448.0,515.2L449.1,515.5L449.4,514.6L449.1,513.5Z","EL62":"M406.1,548.9L409.3,551.9L410.6,550.7L407.8,548.2ZM402.3,543.9L405.1,545.1L408.2,544.8L404.8,540.5L402.8,542.0ZM404.9,539.3L406.6,541.7L407.8,541.7L406.3,539.3ZM406.4,536.9L407.4,537.6L408.6,536.8L407.4,536.1ZM405.5,532.9L404.3,534.2L403.9,537.3L406.2,536.1ZM389.5,519.4L393.2,523.6L394.8,524.1L393.1,518.7Z","EL63":"M428.9,541.0L421.7,539.0L419.2,542.3L415.9,542.1L415.6,543.7L413.4,547.0L413.5,548.3L419.4,552.4L421.6,555.0L425.1,552.7L424.6,551.5L422.7,550.8L422.4,548.1L423.3,546.5L425.0,547.5L428.2,546.2L427.7,544.8L428.8,543.4ZM416.9,530.7L414.2,528.5L413.9,526.2L413.5,526.1L410.8,527.5L410.4,528.7L411.1,529.8L410.5,531.2L407.3,531.2L406.2,533.1L407.8,533.6L410.2,536.1L412.8,540.7L415.4,539.0L417.3,540.0L421.6,538.3L423.1,535.4L422.5,534.2L422.6,531.5L421.9,531.3L419.9,533.1L417.3,532.8Z","EL64":"M428.7,525.7L428.2,524.5L424.7,522.7L423.0,525.9L421.1,526.7L419.9,525.7L418.6,526.2L417.1,524.4L413.9,526.2L414.2,528.5L416.9,530.7L417.3,532.8L419.9,533.1L421.9,531.3L422.6,531.5L422.5,534.2L423.1,535.4L421.6,538.3L428.2,537.7L429.3,536.4L431.2,537.9L431.5,536.9L436.1,539.0L438.7,538.9L441.2,537.4L443.7,538.1L445.2,537.0L445.6,534.8L445.1,534.7L449.5,533.6L454.1,538.5L456.4,538.7L457.4,537.8L456.6,536.1L453.4,534.4L450.3,529.1L443.4,527.8L438.7,525.1L436.1,527.3L442.5,531.3L440.5,533.0L438.6,530.7L432.6,528.7L435.2,525.4ZM456.1,525.7L457.1,525.1L454.6,522.5L453.5,524.1Z","EL65":"M431.0,541.0L428.9,541.0L428.8,543.4L427.7,544.8L428.2,546.2L425.0,547.5L423.3,546.5L422.4,548.1L422.7,550.8L424.6,551.5L425.1,552.7L421.6,555.0L420.8,559.9L423.6,564.2L426.1,564.8L426.0,561.2L427.9,559.9L431.4,563.5L433.3,568.3L434.4,568.4L434.7,563.8L436.6,562.3L443.0,567.2L443.3,566.1L441.4,564.0L441.6,561.3L435.2,550.8L435.4,549.5L440.0,550.9L441.1,553.0L441.9,552.9L443.0,551.2L444.6,550.6L444.5,549.9L441.3,549.2L441.2,548.1L439.8,546.1L439.7,544.8L438.6,543.6L440.0,542.3L438.9,541.7L438.9,540.7L436.6,541.0L437.1,542.7L436.2,543.3Z","ES61":"M68.7,525.0L67.2,525.0L61.3,528.5L60.8,532.2L59.9,533.4L58.4,533.6L58.3,532.2L56.9,532.1L54.7,534.4L51.6,534.9L49.1,532.5L47.1,532.5L42.8,528.4L41.1,530.9L38.0,531.4L33.0,537.7L33.2,543.8L37.8,544.4L40.0,545.8L44.0,549.5L45.9,553.0L44.7,553.7L44.6,554.7L46.7,557.2L46.2,559.6L48.1,563.7L53.5,567.9L55.6,567.4L56.3,566.1L57.3,566.4L58.9,564.0L61.0,562.4L67.4,562.4L71.4,559.7L79.8,560.8L84.1,562.1L88.4,562.1L93.5,564.0L96.6,562.3L98.8,562.5L101.6,564.5L109.8,555.1L107.2,553.1L106.1,550.9L105.9,546.5L103.5,545.1L102.0,543.0L99.4,541.6L101.0,539.7L100.9,536.9L99.9,534.9L97.7,533.7L95.9,534.6L90.0,533.5L77.7,533.3Z","ES24":"M133.8,465.5L131.2,468.1L127.8,469.7L125.2,473.2L123.3,480.0L121.4,480.3L117.9,478.4L117.7,483.7L115.3,485.4L115.0,487.9L113.3,487.6L112.5,488.6L112.3,491.0L113.2,492.2L115.9,493.5L118.2,496.4L118.1,502.1L116.5,502.7L114.5,505.1L118.5,509.9L122.1,511.1L122.6,512.2L121.8,512.7L122.0,513.4L124.1,513.7L125.1,515.6L126.2,515.5L125.9,514.4L126.4,513.7L127.1,513.0L128.4,512.8L130.2,510.3L133.5,508.4L134.0,505.0L133.5,503.4L135.9,502.0L138.8,503.4L140.3,503.1L141.6,501.8L142.1,499.3L141.6,497.6L144.1,494.5L143.7,492.2L145.2,489.8L144.4,487.6L147.6,485.0L150.6,477.9L150.4,475.1L151.1,473.2L150.3,471.7L142.3,470.4L138.6,467.3L135.6,467.8ZM127.1,472.2L128.3,471.4L129.2,472.0L128.4,473.0Z","ES12":"M89.3,449.9L79.4,445.2L75.8,444.4L74.2,442.6L70.7,443.1L59.8,441.0L57.8,443.4L59.4,447.5L60.5,447.9L59.0,449.5L60.0,451.8L63.6,452.5L65.9,451.0L69.7,451.4L71.9,453.2L72.8,453.4L73.9,452.9L80.7,453.2L83.8,451.7L84.7,452.6L88.3,451.4Z","ES53":"M152.3,537.9L151.7,539.4L153.1,539.3L153.5,538.0ZM149.9,534.1L152.5,536.3L155.8,532.8L154.9,531.9L152.9,532.2ZM175.2,531.2L177.7,529.6L180.6,524.5L177.4,523.2L177.3,521.4L174.5,520.7L166.0,525.3L167.7,527.1L170.3,526.8L171.6,529.3ZM184.2,520.2L187.1,522.4L191.7,521.4L189.6,519.0Z","ES21":"M114.3,455.7L110.0,453.2L105.4,453.6L101.9,454.9L101.7,456.6L103.7,456.1L105.1,456.8L105.3,460.1L103.7,461.6L107.1,466.0L108.8,466.9L109.2,468.8L112.0,469.3L112.2,467.0L113.5,466.7L115.1,463.0L117.7,461.8L120.2,458.5L122.5,457.4L121.9,456.4L117.4,456.6ZM106.6,464.1L109.1,463.6L110.1,465.4L108.6,465.8Z","ES70":"M-96.8,663.2L-94.9,663.9L-89.5,662.5L-86.9,658.6L-86.8,655.9L-88.8,655.9ZM-118.0,658.3L-117.8,660.6L-115.8,663.1L-112.7,662.9L-111.3,661.0L-111.4,658.0L-112.9,656.7L-115.0,656.3ZM-84.2,650.7L-86.5,653.0L-85.1,654.0L-80.2,652.9L-78.5,649.1L-79.0,648.4L-80.3,650.3ZM-151.7,650.4L-149.7,652.5L-147.8,650.4L-148.4,649.7L-150.4,650.4L-151.2,650.0ZM-131.5,647.0L-130.1,652.7L-128.2,653.8L-125.8,652.7L-120.4,647.6L-122.3,646.6L-125.8,647.6ZM-137.2,646.9L-139.2,648.6L-137.3,650.8L-134.9,650.0ZM-142.7,633.4L-145.6,633.7L-143.3,640.0L-140.9,635.2Z","ES13":"M105.4,453.6L100.6,450.2L97.9,450.9L97.3,449.9L92.7,450.5L89.3,449.9L88.3,451.4L84.7,452.6L85.4,455.5L89.2,455.8L92.6,461.3L95.4,460.8L96.1,458.9L94.7,458.5L96.0,457.1L99.0,455.8L101.7,456.6L101.9,454.9Z","ES41":"M85.4,455.5L84.7,452.6L83.8,451.7L80.7,453.2L73.9,452.9L72.8,453.4L71.9,453.2L69.7,451.4L65.9,451.0L63.6,452.5L60.0,451.8L55.6,457.8L58.4,459.4L58.8,461.2L58.2,462.8L55.5,464.2L54.8,466.8L59.7,468.5L59.5,472.8L62.9,475.0L60.9,478.0L58.7,479.3L55.8,480.1L53.8,482.3L52.2,482.3L53.1,485.4L51.6,493.6L50.5,494.9L53.7,495.5L59.2,493.4L61.8,496.9L63.9,496.7L66.8,499.6L69.2,499.3L69.2,501.6L73.8,502.4L77.3,500.7L79.0,501.9L82.7,499.1L83.5,496.8L88.2,493.6L89.6,491.4L94.7,488.7L99.2,487.2L105.5,489.0L108.5,492.7L113.2,492.2L112.3,491.0L112.5,488.6L113.3,487.6L115.0,487.9L115.3,485.4L117.7,483.7L117.7,479.1L115.2,479.2L114.1,476.5L111.9,475.3L110.3,475.4L108.5,477.0L107.1,476.5L106.9,475.0L104.8,476.0L102.9,473.2L104.6,465.7L107.1,466.0L103.7,461.6L105.3,460.1L105.1,456.8L103.7,456.1L101.7,456.6L99.0,455.8L96.0,457.1L94.7,458.5L96.1,458.9L95.4,460.8L92.6,461.3L89.2,455.8ZM108.6,465.8L110.1,465.4L109.1,463.6L106.6,464.1Z","ES42":"M105.5,489.0L99.2,487.2L94.7,488.7L96.0,491.4L94.3,495.2L97.0,500.2L97.5,502.2L97.0,504.0L97.9,506.4L96.5,507.7L89.6,508.0L90.3,505.7L85.4,502.4L79.0,501.9L77.3,500.7L73.8,502.4L69.2,501.6L67.8,505.1L68.7,507.4L70.3,507.7L69.5,510.7L71.9,514.4L74.4,514.5L75.4,514.2L74.2,517.8L70.9,520.2L71.7,522.7L68.7,525.0L77.7,533.3L90.0,533.5L95.9,534.6L97.7,533.7L99.9,534.9L100.9,536.9L101.0,539.7L99.4,541.6L102.0,543.0L104.0,540.6L106.4,539.3L110.4,538.6L111.9,539.7L113.4,539.3L115.8,534.1L118.8,533.6L120.6,535.3L122.1,533.3L121.9,531.2L119.8,530.2L118.9,528.7L119.6,524.3L116.1,521.8L116.5,519.7L119.6,517.3L122.0,513.4L121.8,512.7L119.3,512.1L118.5,509.9L114.5,505.1L116.5,502.7L118.1,502.1L118.2,496.4L115.9,493.5L113.2,492.2L108.5,492.7ZM86.9,508.3L88.3,507.7L89.2,508.6L88.2,509.3Z","ES51":"M159.6,474.1L158.6,472.2L151.2,469.1L150.3,471.7L151.1,473.2L150.4,475.1L150.6,477.9L147.6,485.0L144.4,487.6L145.2,489.8L143.7,492.2L144.1,494.5L141.6,497.6L142.1,499.3L141.6,501.8L140.3,503.1L144.2,507.2L145.6,505.8L148.7,504.9L147.5,502.7L151.0,499.5L165.6,496.7L168.3,494.1L174.7,491.7L180.4,487.7L180.6,486.3L179.9,483.3L181.6,481.2L180.7,479.1L177.2,478.3L172.8,479.9L169.2,478.0L166.6,478.9L165.3,477.3L163.0,476.1L159.7,476.8Z","ES43":"M59.2,493.4L53.7,495.5L49.4,494.9L48.3,496.3L49.3,499.7L46.5,504.0L39.9,502.9L42.1,506.9L42.4,511.2L44.9,515.0L41.1,518.7L38.7,523.2L40.4,528.2L42.8,528.4L47.1,532.5L49.1,532.5L51.6,534.9L54.7,534.4L56.9,532.1L58.3,532.2L58.4,533.6L59.9,533.4L60.8,532.2L61.3,528.5L67.2,525.0L68.7,525.0L71.7,522.7L70.9,520.2L74.2,517.8L75.4,514.2L74.4,514.5L71.9,514.4L69.5,510.7L70.3,507.7L68.7,507.4L67.8,505.1L69.2,501.6L69.2,499.3L66.8,499.6L63.9,496.7L61.8,496.9Z","ES11":"M58.0,454.2L59.1,453.6L60.0,451.8L59.0,449.5L60.5,447.9L59.4,447.5L57.8,443.4L59.8,441.0L57.2,439.7L55.3,437.0L52.6,436.0L47.3,436.4L43.9,440.0L37.5,439.6L33.6,441.4L31.8,444.3L33.1,448.1L32.6,450.8L36.1,450.6L34.1,453.6L34.8,457.0L32.3,459.0L31.7,462.9L35.5,460.7L40.8,460.3L41.5,462.5L39.9,464.1L39.9,465.9L41.3,466.2L45.5,465.8L49.1,467.9L51.9,467.7L52.7,466.3L54.8,466.8L55.5,464.2L58.2,462.8L58.8,461.2L58.4,459.4L55.6,457.8Z","ES23":"M117.7,477.0L119.9,476.4L120.0,475.6L117.4,472.8L112.0,469.3L109.2,468.8L108.8,466.9L107.1,466.0L104.6,465.7L102.9,473.2L104.8,476.0L106.9,475.0L107.1,476.5L108.5,477.0L110.3,475.4L111.9,475.3L114.1,476.5L115.2,479.2L117.7,479.1Z","ES30":"M88.2,509.3L89.2,508.6L88.3,507.7L86.9,508.3ZM97.0,504.0L97.5,502.2L97.0,500.2L94.3,495.2L96.0,491.4L94.7,488.7L89.6,491.4L88.2,493.6L83.5,496.8L82.7,499.1L79.0,501.9L85.4,502.4L90.3,505.7L89.6,508.0L96.5,507.7L97.9,506.4Z","ES62":"M109.8,555.1L114.4,552.9L122.0,553.0L121.2,550.9L122.3,549.1L119.6,544.5L120.2,541.8L119.5,539.4L120.6,535.3L118.8,533.6L115.8,534.1L113.4,539.3L111.9,539.7L110.4,538.6L106.4,539.3L104.0,540.6L102.0,543.0L103.5,545.1L105.9,546.5L106.1,550.9L107.2,553.1Z","ES22":"M128.4,473.0L129.2,472.0L128.3,471.4L127.1,472.2ZM125.8,461.8L125.9,458.7L122.5,457.4L120.2,458.5L117.7,461.8L115.1,463.0L113.5,466.7L112.2,467.0L112.0,469.3L117.4,472.8L120.0,475.6L119.9,476.4L117.7,477.0L117.9,478.4L121.4,480.3L123.3,480.0L125.2,473.2L127.8,469.7L131.2,468.1L133.8,465.5L133.5,464.7Z","ES52":"M138.8,503.4L135.9,502.0L133.5,503.4L134.0,505.0L133.5,508.4L130.2,510.3L128.4,512.8L127.1,513.0L125.9,514.4L126.2,515.5L125.1,515.6L124.1,513.7L122.0,513.4L119.6,517.3L116.5,519.7L116.1,521.8L119.6,524.3L118.9,528.7L119.8,530.2L121.9,531.2L122.1,533.3L120.6,535.3L119.5,539.4L120.2,541.8L119.6,544.5L122.3,549.1L127.0,541.7L135.2,537.1L136.7,535.3L133.9,533.3L132.2,529.7L131.3,524.0L133.7,519.2L144.2,507.2L140.3,503.1ZM121.8,512.7L122.6,512.2L122.1,511.1L118.5,509.9L119.3,512.1Z","FI193":"M385.9,117.7L384.4,118.4L378.8,116.8L377.8,119.5L376.4,121.3L376.6,124.9L374.1,126.2L374.1,128.0L377.2,133.4L377.5,134.8L377.2,136.2L375.1,137.1L374.2,139.0L377.3,141.5L378.9,141.2L380.6,143.1L380.0,145.3L381.7,146.9L382.6,149.0L383.9,149.3L383.9,147.1L386.0,147.3L387.7,146.6L388.2,147.8L390.1,147.0L390.9,145.5L393.2,147.3L394.8,147.5L396.1,145.9L394.4,143.8L393.8,141.2L392.1,138.8L394.5,136.4L394.3,133.0L392.8,132.2L392.4,130.3L391.4,128.8L388.1,126.9L388.8,125.1L386.2,119.9Z","FI1D5":"M365.3,112.0L363.9,112.0L363.9,114.3L362.0,115.8L360.7,115.7L360.6,116.5L363.1,117.8L366.1,117.3L366.4,117.9L366.1,119.2L368.2,122.9L374.1,126.2L376.6,124.9L376.4,121.3L377.8,119.5L370.3,113.7L368.4,111.0L367.6,111.1L367.2,112.8Z","FI1B1":"M373.4,183.2L373.7,181.9L372.7,182.0L372.6,183.3ZM392.8,163.9L391.4,162.6L388.4,162.5L388.7,164.8L385.1,166.0L384.1,167.7L379.3,167.3L378.5,174.8L374.0,177.7L373.4,180.3L374.7,181.7L375.4,179.8L376.3,181.3L380.6,179.9L384.2,177.1L386.1,177.1L387.8,175.1L393.3,171.7L393.9,170.1L394.9,171.3L396.9,170.8L396.8,169.2L397.8,170.0L398.0,167.6L399.7,167.0L400.5,165.4L400.6,163.9L398.9,162.7L398.2,161.5L397.0,162.7Z","FI1D8":"M413.7,103.7L414.3,99.5L414.1,98.4L412.8,96.4L409.5,95.1L408.3,92.8L408.5,91.0L407.3,89.0L405.1,89.3L403.9,87.7L403.3,85.6L404.3,84.2L404.1,82.9L402.2,82.3L402.4,80.6L401.8,78.1L398.1,79.1L395.4,81.7L394.6,83.9L391.5,85.7L391.0,88.1L387.5,89.6L387.5,90.5L388.5,92.6L387.5,94.1L389.8,97.9L389.5,101.9L387.2,103.5L387.9,106.3L388.7,107.0L394.2,107.2L400.3,110.2L401.4,106.5L404.2,106.4L409.2,104.4L410.9,106.5Z","FI1C2":"M372.4,162.6L373.1,163.6L372.7,165.2L373.4,166.5L384.1,167.7L385.1,166.0L388.7,164.8L388.4,162.5L387.3,159.7L388.1,156.4L384.9,154.6L380.6,157.0L380.2,158.4L377.3,160.5L377.2,161.7Z","FI1C4":"M400.5,165.4L402.9,166.2L405.1,165.4L405.4,163.9L410.3,163.3L412.0,159.4L410.3,158.3L404.9,157.1L403.8,155.3L403.6,153.0L401.7,153.4L400.3,151.9L399.3,152.9L397.7,152.5L396.3,155.2L396.9,156.8L398.6,157.0L399.3,158.4L398.2,161.5L398.9,162.7L400.6,163.9Z","FI1D7":"M363.2,83.3L365.3,83.3L365.8,84.3L369.2,84.3L369.9,84.8L371.6,81.9L376.0,79.6L377.0,80.8L381.6,79.9L382.8,78.9L384.2,75.4L385.6,74.9L386.9,76.4L387.8,76.4L391.5,75.1L391.6,74.5L390.5,72.9L392.4,71.9L391.3,70.5L391.7,69.4L391.5,68.4L389.7,66.9L390.1,64.5L395.8,63.6L391.0,58.2L390.1,55.9L392.2,46.3L392.0,43.5L385.9,38.0L380.4,35.5L378.6,31.9L378.6,26.7L377.5,25.4L378.7,22.9L377.8,21.9L377.4,20.6L378.6,16.5L378.4,15.2L376.3,12.4L372.0,11.5L367.7,8.2L363.8,11.9L360.7,12.4L358.8,17.0L359.0,24.2L360.2,29.0L358.0,31.9L357.8,35.2L356.9,36.3L350.1,33.8L348.7,36.1L346.5,37.6L341.7,37.2L337.7,31.9L335.0,29.1L332.9,28.8L331.5,30.7L332.3,32.4L332.2,33.3L330.1,32.6L329.2,33.6L330.7,34.0L331.7,35.8L335.0,37.7L335.5,38.7L336.8,39.1L337.7,40.0L338.8,40.1L340.0,41.5L346.7,43.4L348.1,45.7L351.4,48.1L351.1,50.4L352.2,54.0L351.9,56.2L354.1,56.7L354.4,58.2L353.7,60.0L354.1,61.4L357.8,66.1L357.9,70.7L357.2,72.6L357.7,75.4L358.5,76.7L359.9,77.4Z","FI1D3":"M423.0,135.7L427.6,123.1L428.0,115.4L423.7,111.3L417.3,109.0L412.1,105.5L410.9,106.5L409.2,104.4L404.2,106.4L401.4,106.5L400.6,108.8L402.5,109.7L403.9,112.7L405.2,114.2L405.5,117.3L409.2,119.8L409.1,120.8L409.9,122.6L408.2,123.0L407.6,124.2L407.9,126.6L406.7,127.9L406.3,130.1L406.8,131.3L409.9,132.8L411.8,131.7L413.5,128.8L417.2,134.0L418.5,134.8L419.5,136.7L419.2,139.1Z","FI1D9":"M370.2,95.9L371.2,94.8L369.7,93.2L368.4,94.3ZM403.1,73.9L399.8,68.1L395.8,63.6L390.1,64.5L389.7,66.9L391.5,68.4L391.7,69.4L391.3,70.5L392.4,71.9L390.5,72.9L391.6,74.5L391.5,75.1L386.9,76.4L385.6,74.9L384.2,75.4L382.8,78.9L381.6,79.9L377.0,80.8L376.0,79.6L371.6,81.9L369.9,84.8L371.9,86.9L372.8,91.5L374.6,94.0L373.8,94.6L374.4,96.1L371.9,96.0L369.7,97.9L368.5,103.2L365.2,109.8L365.3,112.0L367.2,112.8L367.6,111.1L368.4,111.0L370.3,113.7L377.8,119.5L378.8,116.8L384.4,118.4L385.9,117.7L386.3,115.0L385.1,111.3L388.7,107.0L387.9,106.3L387.2,103.5L389.5,101.9L389.8,97.9L387.5,94.1L388.5,92.6L387.5,90.5L387.5,89.6L391.0,88.1L391.5,85.7L394.6,83.9L395.4,81.7L398.1,79.1L401.8,78.1L402.0,77.0L401.1,75.9Z","FI1D2":"M409.9,132.8L406.8,131.3L406.3,130.1L406.7,127.9L407.9,126.6L407.6,124.2L408.2,123.0L409.9,122.6L409.1,120.8L409.2,119.8L405.5,117.3L405.2,114.2L403.9,112.7L402.5,109.7L400.6,108.8L400.3,110.2L394.2,107.2L388.7,107.0L385.1,111.3L386.3,115.0L385.9,117.7L386.2,119.9L388.8,125.1L388.1,126.9L391.4,128.8L392.4,130.3L392.8,132.2L394.3,133.0L399.1,131.1L400.6,131.5L401.8,132.7L401.6,134.9L402.7,137.3L404.3,138.3L405.7,136.2L405.8,134.0L409.5,134.0Z","FI195":"M347.4,133.3L348.3,134.1L348.8,133.6L348.1,132.5ZM366.4,117.9L366.1,117.3L363.1,117.8L360.6,116.5L359.3,116.8L359.2,118.5L358.3,118.2L358.8,119.3L358.7,121.1L357.6,122.0L357.3,123.3L358.0,125.4L355.9,125.2L354.9,126.9L352.9,127.4L352.1,131.7L352.4,133.4L350.9,135.4L351.0,138.5L354.1,145.1L354.8,149.5L357.0,148.1L356.8,144.3L355.1,140.7L355.2,138.3L355.9,136.7L355.6,134.7L359.2,134.7L358.2,130.7L360.8,128.8L360.5,126.3L361.3,124.7L364.0,123.9L365.6,121.7L368.2,122.9L366.1,119.2ZM350.1,132.8L350.7,133.8L351.3,133.1L350.6,132.0ZM349.3,127.2L349.4,128.6L351.3,129.6L351.9,128.1L351.2,126.2L349.9,126.1ZM353.9,124.7L352.9,124.5L353.8,126.3L354.1,125.6Z","FI197":"M365.4,142.3L365.6,144.0L364.6,147.2L366.6,150.3L366.2,153.8L365.2,155.9L367.1,158.9L369.4,160.0L370.5,162.3L372.4,162.6L377.2,161.7L377.3,160.5L380.2,158.4L380.6,157.0L384.9,154.6L384.5,152.5L388.3,150.8L388.2,147.8L387.7,146.6L386.0,147.3L383.9,147.1L383.9,149.3L382.6,149.0L381.7,146.9L380.0,145.3L380.6,143.1L378.9,141.2L377.3,141.5L372.6,137.5L370.1,139.5L368.6,139.5L367.9,140.9Z","FI1C3":"M388.4,162.5L391.4,162.6L392.8,163.9L397.0,162.7L398.2,161.5L399.3,158.4L398.6,157.0L396.9,156.8L396.3,155.2L397.7,152.5L395.1,150.2L394.8,147.5L393.2,147.3L390.9,145.5L390.1,147.0L388.2,147.8L388.3,150.8L384.5,152.5L384.9,154.6L388.1,156.4L387.3,159.7Z","FI196":"M354.8,149.5L357.3,154.9L358.1,164.4L358.9,164.9L361.3,164.3L364.4,166.0L369.2,163.3L369.5,162.0L370.5,162.3L369.4,160.0L367.1,158.9L365.2,155.9L366.2,153.8L366.6,150.3L364.6,147.2L365.6,144.0L365.4,142.3L363.6,142.2L362.0,145.6L361.1,146.0L359.6,148.2L357.0,148.1Z","FI1C5":"M419.2,146.0L423.0,135.7L419.2,139.1L417.5,142.5L414.7,143.6L413.9,145.0L411.9,145.1L411.0,147.1L406.3,149.4L403.6,153.0L403.8,155.3L404.9,157.1L410.3,158.3L412.0,159.4Z","FI194":"M374.1,126.2L365.6,121.7L364.0,123.9L361.3,124.7L360.5,126.3L360.8,128.8L358.2,130.7L359.2,134.7L355.6,134.7L355.9,136.7L355.2,138.3L355.1,140.7L356.8,144.3L357.0,148.1L359.6,148.2L361.1,146.0L362.0,145.6L363.6,142.2L365.4,142.3L367.9,140.9L368.6,139.5L370.1,139.5L372.6,137.5L374.2,139.0L375.1,137.1L377.2,136.2L377.5,134.8L377.2,133.4L374.1,128.0Z","FI1D1":"M403.6,153.0L406.3,149.4L411.0,147.1L411.9,145.1L413.9,145.0L414.7,143.6L417.5,142.5L419.2,139.1L419.5,136.7L418.5,134.8L417.2,134.0L413.5,128.8L411.8,131.7L409.9,132.8L409.5,134.0L405.8,134.0L405.7,136.2L404.3,138.3L402.7,137.3L401.6,134.9L401.8,132.7L400.6,131.5L399.1,131.1L394.3,133.0L394.5,136.4L392.1,138.8L393.8,141.2L394.4,143.8L396.1,145.9L394.8,147.5L395.1,150.2L397.7,152.5L399.3,152.9L400.3,151.9L401.7,153.4Z","FI1C1":"M359.5,182.6L360.4,183.2L360.9,182.2L360.2,181.6ZM365.0,180.6L363.6,182.4L364.5,183.1L365.4,181.0ZM361.2,179.2L362.5,182.3L363.1,182.4L362.5,177.6ZM366.1,179.0L365.2,179.5L366.1,180.7L366.5,180.6ZM360.7,175.5L360.2,176.7L360.9,177.3L361.3,175.6ZM362.5,174.9L361.9,175.7L362.8,176.9L363.1,175.8ZM379.3,167.3L373.4,166.5L372.7,165.2L373.1,163.6L372.4,162.6L369.5,162.0L369.2,163.3L364.4,166.0L361.3,164.3L358.9,164.9L358.1,164.4L356.9,167.9L358.7,173.7L358.8,175.1L358.1,175.9L359.0,178.2L360.0,178.2L359.7,176.2L360.0,174.5L361.9,174.8L362.4,173.4L363.6,176.2L363.7,178.9L365.9,178.0L365.2,175.9L365.3,174.4L367.3,177.6L368.5,177.2L369.6,182.1L374.0,177.7L378.5,174.8Z","FRK":"M187.1,408.3L185.4,406.5L181.4,407.5L179.7,410.0L176.2,411.8L179.0,416.8L179.1,419.5L176.9,422.1L177.5,423.4L177.3,427.8L176.8,429.1L175.8,429.1L173.5,431.5L171.2,435.6L172.3,441.7L175.8,441.2L179.0,437.3L180.5,438.6L181.6,442.2L183.3,438.7L186.6,437.2L187.7,439.5L189.6,439.2L192.2,441.5L194.3,448.5L195.7,449.4L199.4,448.9L201.0,450.1L201.1,449.1L203.7,450.6L204.1,448.7L205.2,448.0L207.3,451.0L211.1,453.3L213.3,452.2L213.0,450.4L210.9,449.2L210.9,447.6L212.7,447.2L213.3,444.9L215.3,443.7L219.4,441.4L221.8,441.3L221.9,439.7L220.5,438.6L221.1,437.0L223.1,438.1L231.0,435.7L231.9,432.9L231.3,431.7L230.2,430.9L229.9,429.0L227.9,426.4L230.9,424.1L228.4,420.1L228.6,415.6L225.0,415.0L221.5,417.2L222.0,418.3L221.4,419.1L218.3,420.0L220.7,416.2L219.8,415.3L217.8,417.4L216.4,417.7L214.9,416.7L212.7,417.2L211.2,414.3L209.4,413.2L207.0,413.2L204.7,418.4L203.5,416.5L201.0,416.2L200.2,417.4L199.2,418.0L195.5,417.7L194.6,416.0L195.7,415.1L195.9,413.2L193.4,411.4L192.2,407.8L190.5,409.0Z","FRC":"M197.0,388.3L195.5,384.7L194.3,384.1L193.7,381.8L192.1,380.5L188.2,380.7L186.4,383.6L188.2,386.4L186.8,389.5L185.2,390.6L186.0,393.5L184.7,394.2L184.6,397.3L185.6,399.0L186.1,402.9L185.4,406.5L187.1,408.3L190.5,409.0L192.2,407.8L193.4,411.4L195.9,413.2L195.7,415.1L194.6,416.0L195.5,417.7L199.2,418.0L200.2,417.4L201.0,416.2L203.5,416.5L204.7,418.4L207.0,413.2L209.4,413.2L211.2,414.3L212.7,417.2L214.9,416.7L216.4,417.7L217.8,417.4L219.8,415.3L220.8,413.0L224.2,409.8L224.9,406.9L229.5,403.3L231.5,400.6L230.6,399.8L230.6,398.8L232.8,397.8L231.7,394.1L229.8,392.3L229.6,392.4L227.3,390.4L222.9,390.0L221.8,388.8L219.1,390.0L217.1,391.6L216.5,393.8L213.7,394.1L213.1,395.1L211.8,395.2L208.7,393.0L208.5,390.4L206.0,387.6L201.3,388.9Z","FRH":"M115.8,388.5L116.7,388.5L116.3,387.1L115.0,387.1ZM129.0,367.6L125.0,368.8L121.1,363.0L117.0,362.9L114.9,365.1L108.6,363.7L104.5,364.5L103.0,366.5L103.6,368.0L105.5,368.9L104.8,369.8L104.9,371.8L103.7,373.7L104.9,376.4L113.8,379.3L114.6,381.1L117.5,383.5L121.9,385.9L123.7,385.9L124.7,387.4L128.5,386.8L129.2,385.1L134.0,384.5L136.8,383.1L139.1,384.2L141.9,380.7L142.8,372.4L138.9,372.1L137.6,369.6L135.5,369.4L133.6,368.0L131.5,368.9ZM133.0,370.3L132.7,369.8L133.1,369.7ZM99.1,372.6L99.9,373.5L101.0,373.3L100.3,372.1Z","FRB":"M171.9,369.0L169.4,371.6L167.6,371.2L163.9,372.6L165.0,375.2L164.4,377.5L162.8,378.3L163.0,382.0L162.6,384.5L159.6,388.5L156.6,390.0L155.2,389.3L152.2,396.5L155.3,400.5L158.8,400.6L160.6,404.5L161.1,407.2L163.2,409.1L163.4,411.0L166.1,412.0L170.6,411.0L176.2,411.8L179.7,410.0L181.4,407.5L185.4,406.5L186.1,402.9L185.6,399.0L184.6,397.3L184.7,394.2L186.0,393.5L185.2,390.6L186.8,389.5L188.2,386.4L186.4,383.6L182.1,383.5L180.7,380.4L176.2,380.5L175.7,377.5L174.6,377.1L172.7,373.6Z","FRM0":"M259.0,475.8L258.1,473.5L257.4,473.9L256.8,478.5L254.8,478.0L250.9,480.1L249.1,481.3L247.9,483.8L248.7,485.5L247.7,487.2L249.3,489.0L248.2,491.3L250.1,491.7L249.3,494.2L251.0,495.4L250.3,496.7L250.7,497.8L255.4,500.3L257.3,497.2L257.9,492.5L259.8,487.2L259.5,481.1L258.7,478.9Z","FRF":"M209.4,355.1L210.2,352.6L209.5,352.2L207.9,354.6L205.3,355.4L203.2,354.9L202.6,358.7L200.7,360.6L200.5,364.0L196.2,365.2L195.6,370.2L192.6,374.0L193.1,376.2L194.0,376.6L192.1,378.7L192.1,380.5L193.7,381.8L194.3,384.1L195.5,384.7L197.0,388.3L201.3,388.9L206.0,387.6L208.5,390.4L208.7,393.0L211.8,395.2L213.1,395.1L213.7,394.1L216.5,393.8L217.1,391.6L219.1,390.0L221.8,388.8L222.9,390.0L227.3,390.4L229.6,392.4L229.8,392.3L231.7,394.1L232.8,397.8L233.9,399.0L235.6,399.1L237.2,397.9L238.1,396.5L237.7,393.9L238.5,390.2L238.2,387.7L239.5,385.4L241.2,379.5L245.9,373.7L242.4,372.3L239.4,372.1L237.7,370.3L236.5,370.2L235.2,370.8L231.7,369.1L230.1,369.9L227.8,365.5L225.8,364.5L220.6,363.8L219.9,362.9L216.0,363.5L215.3,361.5L210.9,358.1L209.9,357.9Z","FRY1":"M-777.4,408.7L-776.0,409.3L-776.0,407.1L-777.5,406.7ZM-776.8,400.0L-773.1,403.6L-773.0,397.5L-775.7,399.0L-777.2,395.7L-778.7,395.6L-780.5,399.4L-780.6,401.9L-778.7,402.4Z","FRY3":"M-758.9,705.3L-758.8,696.3L-764.1,684.4L-767.9,670.5L-779.0,652.1L-780.6,653.1L-781.9,654.7L-786.7,655.3L-791.3,658.2L-794.1,665.6L-795.3,672.6L-794.5,684.8L-798.9,687.5L-802.5,693.2L-806.1,694.9L-809.7,694.4L-808.3,698.4L-805.2,703.2L-799.0,705.2L-796.3,709.5L-793.2,711.7L-791.6,715.3L-788.2,718.6L-782.0,718.3L-774.5,711.8L-760.3,706.9Z","FRE":"M187.6,338.9L187.0,334.4L181.8,335.3L176.6,337.1L175.5,344.3L176.1,345.7L175.1,346.0L175.4,347.9L172.8,350.1L175.8,353.4L176.5,355.7L175.6,356.6L175.1,361.4L175.4,363.3L174.7,364.4L175.5,365.4L179.1,365.4L184.1,368.0L189.4,367.8L193.5,372.7L195.6,370.2L196.2,365.2L200.5,364.0L200.7,360.6L202.6,358.7L203.2,354.9L202.2,354.5L203.1,352.9L202.7,351.3L203.1,350.0L201.5,348.1L198.0,348.3L197.3,345.5L194.1,344.7L193.1,340.6L191.4,340.2L189.7,341.1Z","FRY2":"M-787.7,424.1L-788.3,430.4L-786.0,434.4L-784.7,429.2Z","FRY5":"M926.6,1223.3L928.4,1226.2L929.8,1224.7L929.9,1222.7L927.6,1222.2Z","FRD":"M175.6,356.6L176.5,355.7L175.8,353.4L172.8,350.1L169.3,351.9L163.8,352.7L159.6,354.4L157.6,357.4L158.0,358.3L160.8,359.0L162.2,358.6L163.3,359.6L162.9,359.6L162.1,358.7L154.0,360.9L145.5,357.8L144.3,358.8L143.0,355.1L143.7,353.5L143.0,352.4L139.8,352.5L136.6,351.0L137.0,355.3L138.6,360.1L138.6,363.7L137.9,366.4L138.7,369.5L138.2,369.8L137.6,369.6L138.9,372.1L142.8,372.4L145.1,372.8L146.1,373.5L152.2,373.2L153.7,376.1L157.5,375.0L158.3,375.7L158.5,376.8L160.0,378.9L162.7,380.4L162.8,378.3L164.4,377.5L165.0,375.2L163.9,372.6L167.6,371.2L169.4,371.6L171.9,369.0L171.9,367.5L173.4,366.8L175.4,363.3L175.1,361.4Z","FRI":"M155.3,400.5L152.2,396.5L150.2,397.9L148.2,397.1L141.1,398.1L143.1,403.4L143.5,408.4L141.1,409.4L137.4,408.6L135.8,410.8L136.6,413.3L135.8,416.0L135.0,416.4L134.2,413.7L133.3,413.9L134.5,418.7L138.7,423.1L139.3,425.6L138.4,425.5L135.5,421.9L134.8,422.3L132.0,433.6L133.1,435.6L131.0,438.9L126.8,452.0L125.5,453.9L121.9,456.4L122.5,457.4L125.9,458.7L125.8,461.8L133.5,464.7L135.6,467.8L138.6,467.3L139.4,465.1L141.9,462.2L141.7,460.5L143.2,459.5L142.8,455.6L141.0,455.3L142.3,450.2L144.2,449.4L145.3,450.1L145.7,449.2L153.9,448.9L155.8,447.4L156.5,445.9L156.2,444.3L158.3,444.1L158.1,441.9L163.1,436.7L164.0,434.1L166.0,434.1L167.8,435.8L171.2,435.6L173.5,431.5L175.8,429.1L176.8,429.1L177.3,427.8L177.5,423.4L176.9,422.1L179.1,419.5L179.0,416.8L176.2,411.8L170.6,411.0L166.1,412.0L163.4,411.0L163.2,409.1L161.1,407.2L160.6,404.5L158.8,400.6ZM134.4,411.4L135.4,410.7L134.7,409.9L133.3,410.6Z","FRJ":"M166.0,434.1L164.0,434.1L163.1,436.7L158.1,441.9L158.3,444.1L156.2,444.3L156.5,445.9L155.8,447.4L153.9,448.9L145.7,449.2L145.3,450.1L144.2,449.4L142.3,450.2L141.0,455.3L142.8,455.6L143.2,459.5L141.7,460.5L141.9,462.2L139.4,465.1L138.6,467.3L142.3,470.4L150.3,471.7L151.2,469.1L152.9,469.6L158.6,472.2L159.6,474.1L160.9,473.6L163.8,475.1L163.0,476.4L165.3,477.3L166.6,478.9L169.2,478.0L172.8,479.9L177.2,478.3L180.7,479.1L179.4,476.5L179.8,471.9L180.5,468.9L182.6,466.3L193.6,461.5L195.0,463.2L198.4,459.7L200.1,459.4L202.5,454.3L201.0,450.1L199.4,448.9L195.7,449.4L194.3,448.5L192.2,441.5L189.6,439.2L187.7,439.5L186.6,437.2L183.3,438.7L181.6,442.2L180.5,438.6L179.0,437.3L175.8,441.2L172.3,441.7L171.2,435.6L167.8,435.8Z","FRG":"M125.9,396.0L126.1,394.5L124.9,394.2L125.0,395.6ZM153.7,376.1L152.2,373.2L146.1,373.5L145.1,372.8L142.8,372.4L141.9,380.7L139.1,384.2L136.8,383.1L134.0,384.5L129.2,385.1L128.5,386.8L124.7,387.4L123.8,388.7L124.1,389.9L127.2,391.2L127.1,393.1L128.9,395.3L126.7,397.6L130.0,404.8L135.5,408.9L137.4,408.6L141.1,409.4L143.5,408.4L143.1,403.4L141.1,398.1L148.2,397.1L150.2,397.9L152.2,396.5L155.2,389.3L156.6,390.0L159.6,388.5L162.6,384.5L163.0,382.0L162.7,380.4L160.0,378.9L158.5,376.8L158.3,375.7L157.5,375.0Z","FRL":"M221.1,437.0L220.5,438.6L221.9,439.7L221.8,441.3L219.4,441.4L215.3,443.7L213.3,444.9L212.7,447.2L210.9,447.6L210.9,449.2L213.0,450.4L213.3,452.2L211.1,453.3L207.3,451.0L205.2,448.0L204.1,448.7L203.7,450.6L201.1,449.1L201.0,450.1L202.5,454.3L200.1,459.4L198.4,459.7L195.0,463.2L198.6,463.7L199.9,465.2L202.4,465.4L203.3,464.4L205.3,466.0L208.1,466.0L208.7,468.1L212.3,469.0L214.2,471.1L215.3,470.3L220.5,470.7L224.2,469.6L225.6,466.1L227.9,464.8L231.2,461.9L235.4,460.0L235.4,458.2L237.8,455.4L237.2,453.7L233.0,454.0L229.5,452.2L228.0,450.1L228.9,445.2L230.4,444.3L229.5,442.2L227.0,441.0L225.4,437.5L223.1,438.1Z","FRY4":"M1112.9,1266.0L1114.5,1268.1L1116.4,1268.5L1120.5,1267.5L1123.3,1265.0L1123.6,1262.6L1120.2,1260.4L1116.5,1261.8L1114.3,1263.7Z","FR1":"M174.7,364.4L173.4,366.8L171.9,367.5L171.9,369.0L172.7,373.6L174.6,377.1L175.7,377.5L176.2,380.5L180.7,380.4L182.1,383.5L186.4,383.6L188.2,380.7L192.1,380.5L192.1,378.7L194.0,376.6L193.1,376.2L192.6,374.0L193.5,372.7L189.4,367.8L184.1,368.0L179.1,365.4L175.5,365.4Z","HR02":"M345.0,418.7L343.8,419.4L343.6,421.3L341.7,424.1L342.9,425.6L341.5,426.9L337.7,426.9L336.7,429.0L335.1,429.4L330.1,427.3L327.7,425.3L327.0,425.9L327.9,426.8L327.6,428.2L328.5,429.9L327.0,430.9L326.4,432.7L325.7,433.4L324.2,433.4L324.4,435.5L324.8,436.1L326.0,436.6L327.3,436.5L330.5,439.0L333.6,438.6L334.4,433.7L336.5,434.1L340.0,437.1L342.7,433.0L345.8,433.3L347.4,432.3L349.9,433.4L356.3,433.5L358.3,434.3L360.3,432.7L362.4,433.5L363.3,432.7L365.9,433.4L366.3,432.9L368.5,433.5L370.3,436.1L372.4,436.2L372.4,435.4L373.7,434.5L373.0,431.7L374.4,430.4L376.7,430.3L376.3,429.4L371.4,427.6L371.3,426.5L371.8,424.9L370.2,424.4L370.2,421.7L369.0,420.3L369.0,418.6L366.5,419.3L364.1,422.0L357.9,422.1L354.8,421.4L353.6,420.2L350.4,419.5L348.5,421.5Z","HR03":"M328.0,456.1L327.4,455.0L326.5,455.3L327.2,456.3ZM325.1,451.6L323.8,451.5L324.5,453.0L325.3,453.3ZM322.7,449.3L323.6,448.6L323.0,447.5L321.9,447.7ZM320.1,448.1L320.6,446.6L319.8,446.2L319.0,447.3ZM324.9,446.0L323.6,446.3L324.3,447.3L325.6,447.3ZM318.2,444.8L317.2,445.5L317.6,446.3L318.9,446.6ZM321.5,441.0L320.7,442.0L322.2,442.6L322.6,442.3ZM318.6,439.2L317.9,438.7L316.6,440.1L317.5,443.9L318.9,444.8ZM316.6,437.7L317.3,437.5L316.9,435.7L315.9,436.7ZM344.1,480.8L343.2,479.6L342.0,480.2L343.2,481.2ZM359.4,470.7L359.0,471.5L361.2,472.0L371.1,477.2L369.7,475.1L368.2,474.2L367.2,474.3L362.2,470.8ZM351.5,473.5L350.4,473.0L349.3,473.9L350.5,474.5ZM340.8,470.4L341.7,469.5L340.7,468.9L339.5,469.7ZM346.8,468.3L348.0,467.6L346.8,466.5L345.1,467.2ZM350.7,467.4L349.8,466.6L348.6,467.5L350.0,468.2ZM347.9,464.7L345.6,463.2L343.4,464.7L346.0,466.0ZM343.5,464.5L342.7,463.1L341.8,464.1L342.6,465.1ZM330.5,457.3L329.8,456.5L329.0,456.6L328.6,457.4L329.9,458.5L330.5,458.2ZM326.4,432.7L327.0,430.9L323.8,429.7L322.4,430.5L319.0,427.3L318.3,428.9L316.7,430.6L313.9,430.8L312.5,430.2L311.6,431.7L307.6,431.2L307.1,432.4L308.1,436.5L311.8,442.0L312.6,441.8L316.3,433.8L317.5,433.5L318.7,434.5L319.4,438.1L321.5,438.9L322.0,436.9L323.3,437.8L324.5,445.5L328.9,448.6L327.1,449.3L330.2,455.2L332.7,456.5L338.7,462.2L340.3,462.8L342.7,461.3L348.6,463.0L355.6,467.7L354.4,470.3L357.9,471.2L358.5,469.9L359.8,469.1L359.7,468.3L354.8,464.2L353.8,461.5L350.7,459.9L344.5,453.8L339.7,450.3L339.9,449.4L338.9,446.3L337.2,443.0L334.2,441.2L333.6,438.6L330.5,439.0L327.3,436.5L326.0,436.6L324.8,436.1L324.4,435.5L324.2,433.4L325.7,433.4Z","HR05":"M334.9,422.4L333.9,423.5L333.6,425.7L334.7,426.7L337.8,423.6L337.2,421.0Z","HR06":"M341.6,412.2L338.6,411.3L337.5,412.3L338.3,414.1L335.5,414.1L335.7,414.8L334.6,415.6L332.6,416.6L332.4,417.2L331.3,417.2L330.9,417.9L330.9,419.6L332.0,420.0L331.6,423.5L329.5,424.0L327.8,425.2L330.1,427.3L335.1,429.4L336.7,429.0L337.7,426.9L341.5,426.9L342.9,425.6L341.7,424.1L343.6,421.3L343.8,419.4L345.0,418.7L348.5,421.5L350.4,419.5L348.3,416.7ZM333.6,425.7L333.9,423.5L334.9,422.4L337.2,421.0L337.8,423.6L334.7,426.7Z","HU11":"M366.1,391.1L367.3,394.1L369.3,394.3L371.0,392.2L368.1,390.3Z","HU12":"M367.7,400.1L370.8,398.2L372.0,399.6L374.2,397.8L377.2,400.1L380.6,398.8L380.0,395.6L378.7,393.6L374.5,389.8L373.1,387.5L372.0,387.8L370.9,386.4L367.3,386.2L365.3,383.1L363.9,384.9L364.0,386.3L365.6,388.0L365.2,389.6L363.5,391.4L366.5,396.0L366.6,398.6ZM366.1,391.1L368.1,390.3L371.0,392.2L369.3,394.3L367.3,394.1Z","HU21":"M363.5,391.4L365.2,389.6L365.6,388.0L364.9,387.2L354.3,389.7L354.8,395.5L353.7,396.6L352.7,394.6L346.7,395.6L347.6,397.1L347.6,401.0L346.2,402.1L350.6,406.7L359.2,402.1L359.6,405.3L363.6,405.0L364.9,405.9L367.6,403.0L367.7,400.1L366.6,398.6L366.5,396.0Z","HU22":"M354.3,389.7L352.2,389.6L346.6,385.9L345.7,386.1L344.7,391.1L339.4,391.3L337.9,392.5L341.0,393.9L340.7,396.0L338.5,397.7L339.2,403.2L335.5,406.1L337.6,406.0L338.2,406.4L337.9,407.4L338.6,408.3L339.0,409.7L340.4,410.8L340.9,411.8L345.0,414.5L346.5,414.4L348.3,412.1L348.7,407.8L350.6,406.7L346.2,402.1L347.6,401.0L347.6,397.1L346.7,395.6L352.7,394.6L353.7,396.6L354.8,395.5Z","HU23":"M363.6,405.0L359.6,405.3L359.2,402.1L348.7,407.8L348.3,412.1L346.5,414.4L345.0,414.5L348.3,416.7L350.4,419.5L353.6,420.2L354.8,421.4L357.9,422.1L364.1,422.0L366.5,419.3L368.2,418.8L368.3,417.1L367.2,416.6L368.5,412.5L367.8,407.0L368.6,405.4L367.6,403.0L364.9,405.9Z","HU31":"M391.6,370.8L388.5,372.3L383.7,372.1L381.4,374.1L380.3,377.2L377.5,379.6L376.0,380.2L372.6,379.2L371.1,381.6L365.3,383.1L367.3,386.2L370.9,386.4L372.0,387.8L373.1,387.5L374.5,389.8L377.7,388.2L379.0,389.5L380.7,389.0L383.1,391.3L386.7,387.0L389.4,384.9L389.8,380.2L392.6,379.6L393.6,377.1L397.9,375.2L400.0,372.6L396.0,373.8L393.9,371.7Z","HU32":"M402.0,385.6L402.6,385.4L403.3,383.3L407.7,381.1L409.6,378.2L408.4,376.0L406.2,376.3L404.8,374.6L402.9,374.3L400.7,371.9L397.9,375.2L393.6,377.1L392.6,379.6L389.8,380.2L389.4,384.9L386.7,387.0L383.1,391.3L380.7,389.0L379.0,389.5L377.7,388.2L374.5,389.8L378.7,393.6L380.0,395.6L380.6,398.8L381.3,400.0L380.6,402.2L381.9,402.7L384.8,401.7L385.0,400.1L387.6,399.2L387.7,397.5L390.2,393.6L393.7,394.7L393.6,396.4L394.3,396.9L396.7,397.4L398.2,396.0L399.5,393.9Z","HU33":"M394.3,396.9L393.6,396.4L393.7,394.7L390.2,393.6L387.7,397.5L387.6,399.2L385.0,400.1L384.8,401.7L381.9,402.7L380.6,402.2L381.3,400.0L380.6,398.8L377.2,400.1L374.2,397.8L372.0,399.6L370.8,398.2L367.7,400.1L367.6,403.0L368.6,405.4L367.8,407.0L368.5,412.5L367.2,416.6L368.3,417.1L368.2,418.8L370.5,418.2L371.4,416.7L373.6,416.9L376.4,413.5L377.8,413.0L379.8,413.4L384.5,413.2L389.5,411.9L390.0,409.8L393.1,409.8L394.3,408.7L395.6,406.4L395.4,403.6L396.7,402.5L398.2,396.0L396.7,397.4Z","IE04":"M104.0,249.8L101.7,247.6L99.9,248.6L98.8,250.7L97.7,248.3L91.5,249.2L90.2,250.3L89.1,252.8L86.5,254.8L88.0,256.7L90.0,257.3L89.9,258.2L84.7,261.4L81.6,260.8L79.9,262.2L77.9,259.1L74.8,258.0L71.9,258.4L71.4,259.2L71.8,260.9L71.1,262.7L71.9,263.2L72.2,266.3L67.5,270.8L69.9,275.3L75.9,277.2L77.4,282.2L80.1,282.0L81.1,283.2L82.5,283.3L86.6,280.5L86.6,279.2L87.9,278.1L88.2,273.7L89.9,270.9L91.0,271.1L92.9,269.8L95.3,272.6L98.7,273.7L99.5,272.5L103.2,271.4L103.5,268.0L102.3,267.1L102.0,265.0L100.9,263.4L99.0,264.2L98.6,266.1L96.7,267.0L94.9,266.7L92.4,264.5L90.4,260.4L92.2,259.1L95.2,258.5L94.5,256.8L97.1,256.3L99.9,252.8ZM89.2,251.1L89.8,250.4L89.3,249.4L88.2,250.6Z","IE05":"M61.9,304.7L62.8,304.1L62.2,303.2L61.0,303.6ZM85.1,285.9L86.7,282.7L85.6,281.1L82.5,283.3L81.1,283.2L80.1,282.0L77.4,282.2L76.5,279.2L73.6,279.2L70.3,283.4L68.0,285.4L70.5,287.5L66.8,287.8L63.4,290.7L59.3,290.9L59.0,292.0L60.7,293.5L58.2,296.3L60.6,298.8L60.9,300.8L63.1,301.5L64.0,303.7L66.0,305.1L73.6,304.9L83.0,301.5L85.2,301.5L86.1,300.2L87.6,299.7L91.8,300.4L92.8,299.3L98.6,301.2L99.1,300.4L98.5,298.7L101.4,295.7L102.9,292.7L101.0,291.4L98.7,292.5L97.9,290.6L99.3,290.4L99.2,289.5L95.6,288.6L94.7,289.4L93.0,288.0L88.0,288.4L87.7,285.2Z","IE06":"M106.8,270.1L103.5,270.3L103.2,271.4L99.5,272.5L98.7,273.7L95.3,272.6L92.9,269.8L91.0,271.1L89.9,270.9L88.2,273.7L87.9,278.1L86.6,279.2L86.6,280.5L85.6,281.1L86.7,282.7L85.1,285.9L87.7,285.2L88.0,288.4L93.0,288.0L94.7,289.4L95.6,288.6L99.2,289.5L99.3,290.4L97.9,290.6L98.7,292.5L101.0,291.4L102.9,292.7L104.9,289.6L105.0,285.0L104.6,282.7L106.4,279.7L105.6,277.9L106.0,274.3L105.2,273.1L105.3,272.2L105.9,271.6L107.6,272.3L107.9,272.1Z","ITF1":"M316.8,479.9L313.6,474.0L306.9,477.7L307.4,479.4L304.9,479.8L304.4,481.9L306.7,486.5L304.1,486.6L303.2,487.5L303.8,488.9L306.7,490.1L309.7,492.8L311.5,492.5L314.9,494.1L317.3,492.9L318.4,490.7L320.0,490.7L321.7,492.5L325.1,487.1Z","ITC2":"M231.3,431.7L236.1,430.0L240.7,430.0L241.2,427.8L240.4,424.5L237.3,423.4L232.2,425.2L230.9,424.1L227.9,426.4L229.9,429.0L230.2,430.9Z","ITF5":"M344.9,506.2L344.3,505.0L342.3,504.8L341.6,502.8L339.8,501.6L335.7,503.3L335.6,505.4L333.3,507.2L336.5,512.7L339.8,516.2L338.2,520.0L339.7,521.9L341.2,520.5L343.9,521.8L346.6,521.2L347.8,519.7L348.2,517.7L350.9,517.7L353.4,512.8L351.5,511.2L351.2,507.8L348.3,507.5L347.5,508.2Z","ITF6":"M350.9,517.7L348.2,517.7L347.8,519.7L346.6,521.2L343.9,521.8L341.2,520.5L339.7,521.9L341.3,527.0L343.8,530.7L345.1,536.0L346.8,538.2L347.0,539.8L346.1,541.3L342.6,542.8L343.5,545.2L342.3,548.5L340.3,550.4L340.5,553.7L341.8,554.9L346.0,554.5L347.8,550.2L351.9,546.2L352.3,545.1L351.5,541.2L352.2,539.5L355.7,537.2L358.4,537.2L359.3,535.8L358.6,534.0L358.3,529.2L356.7,527.8L350.1,525.1L349.5,523.2Z","ITF3":"M315.7,510.7L316.3,510.1L314.6,509.3L314.1,510.5ZM322.3,498.8L320.7,497.8L317.7,497.0L316.6,498.7L315.6,497.8L313.0,501.9L317.7,508.2L321.4,509.1L322.5,511.4L326.6,510.6L329.3,514.5L329.1,517.6L331.7,518.7L334.2,520.8L336.9,519.7L338.2,520.0L339.8,516.2L336.5,512.7L333.3,507.2L335.6,505.4L335.7,503.3L332.2,502.6L331.7,500.4L330.5,499.9L328.5,496.6Z","ITH5":"M260.0,438.0L257.8,439.6L257.0,441.6L257.5,443.1L257.1,444.8L255.8,445.4L255.9,446.6L259.3,447.6L259.1,450.0L260.5,449.8L261.6,450.8L264.2,449.1L267.1,451.0L268.4,452.4L271.1,453.1L272.9,454.8L273.8,454.2L275.2,454.9L278.1,455.3L279.9,455.1L282.4,453.0L283.8,454.0L286.1,454.6L285.6,456.9L286.1,458.7L291.0,460.6L293.1,460.4L295.2,458.1L294.6,457.9L294.6,457.2L295.7,456.6L295.5,458.1L297.7,459.0L298.7,456.7L294.9,453.7L293.8,452.0L292.5,445.9L292.6,443.1L294.0,443.2L292.3,440.9L289.6,440.2L287.1,440.3L284.8,441.6L282.4,440.9L276.0,441.6L273.7,440.6L271.4,441.5L266.4,439.5L264.1,438.0L262.2,439.1Z","ITH4":"M306.1,421.7L308.0,419.6L305.6,418.8L304.9,417.6L308.0,415.1L308.3,413.7L305.8,413.1L296.9,412.3L292.7,418.4L294.2,420.6L293.4,422.3L296.6,426.4L300.3,425.6L301.8,428.7L302.2,426.7L305.3,427.2L307.3,426.0L309.5,428.5L309.1,429.2L310.4,429.3L311.2,428.3L308.8,426.2L307.5,425.7L307.6,422.7L306.4,422.9Z","ITI4":"M293.8,481.2L292.5,478.9L289.7,478.5L288.8,476.0L287.0,476.8L287.6,477.7L287.1,479.2L285.1,480.9L285.3,482.5L283.4,483.7L285.8,485.3L288.3,489.1L291.9,491.1L293.6,494.0L298.3,498.4L300.4,499.2L304.2,502.0L307.0,501.1L313.0,501.9L315.6,497.8L315.9,496.1L314.9,494.1L311.5,492.5L309.7,492.8L306.7,490.1L303.8,488.9L303.2,487.5L304.1,486.6L306.7,486.5L304.4,481.9L304.9,479.8L307.4,479.4L306.9,477.7L304.8,477.1L303.9,478.7L301.2,479.2L298.7,482.2L296.3,483.0ZM295.4,491.2L296.6,490.4L297.6,491.1L296.8,491.9Z","ITC3":"M252.8,445.7L252.0,447.3L249.3,447.0L248.3,448.2L244.5,447.8L241.4,454.7L238.6,454.3L235.4,458.2L235.4,460.0L240.6,459.0L242.8,457.6L244.6,454.5L249.0,450.4L250.7,449.8L254.3,450.6L259.5,453.2L262.9,455.7L265.6,456.1L265.9,455.4L261.6,450.8L260.5,449.8L259.1,450.0L259.3,447.6L255.9,446.6L254.9,447.0Z","ITC4":"M271.9,419.2L271.4,417.7L272.6,416.0L267.8,413.1L266.4,414.0L265.9,415.6L266.9,416.9L267.2,419.0L266.5,419.5L264.4,417.3L261.9,418.5L260.1,418.2L258.9,415.5L257.5,415.2L256.9,415.9L256.7,419.6L253.9,423.2L254.4,425.8L252.7,426.2L252.7,424.8L251.5,423.5L251.7,422.2L250.4,421.7L248.7,427.2L251.7,433.5L250.0,434.9L247.8,434.8L248.2,437.2L249.6,439.5L252.2,439.5L255.6,443.8L255.8,445.4L257.1,444.8L257.5,443.1L257.0,441.6L257.8,439.6L260.0,438.0L262.2,439.1L264.1,438.0L266.4,439.5L271.4,441.5L273.7,440.6L276.0,441.6L282.4,440.9L279.8,439.3L279.7,438.2L277.9,438.1L275.0,435.1L274.0,435.0L273.1,433.2L273.1,429.9L275.2,426.2L271.4,425.9L271.0,423.3Z","ITI3":"M298.7,456.7L297.7,459.0L295.2,458.1L293.1,460.4L293.6,461.1L292.3,463.0L293.9,463.1L297.6,465.8L299.2,465.2L301.4,473.4L304.3,475.2L305.2,475.0L304.8,477.1L306.9,477.7L313.6,474.0L311.2,467.5L308.6,462.5L303.9,460.2Z","ITF2":"M329.7,489.2L325.1,487.1L321.7,492.5L320.0,490.7L318.4,490.7L317.3,492.9L314.9,494.1L315.9,496.1L315.6,497.8L316.6,498.7L317.7,497.0L320.7,497.8L322.3,498.8L328.5,496.6L327.6,494.9L329.7,493.0Z","ITC1":"M251.7,433.5L248.7,427.2L250.4,421.7L247.5,419.1L247.5,416.3L246.7,415.7L243.7,418.6L243.7,420.7L240.4,424.5L241.2,427.8L240.7,430.0L236.1,430.0L231.3,431.7L231.9,432.9L231.0,435.7L225.4,437.5L227.0,441.0L229.5,442.2L230.4,444.3L228.9,445.2L228.0,450.1L229.5,452.2L233.0,454.0L237.2,453.7L237.8,455.4L238.6,454.3L241.4,454.7L244.5,447.8L248.3,448.2L249.3,447.0L252.0,447.3L252.8,445.7L254.9,447.0L255.9,446.6L255.6,443.8L252.2,439.5L249.6,439.5L248.2,437.2L247.8,434.8L250.0,434.9Z","ITF4":"M348.2,499.4L341.4,496.7L339.7,494.1L342.8,490.8L342.1,488.5L329.7,489.2L329.7,493.0L327.6,494.9L330.5,499.9L331.7,500.4L332.2,502.6L335.7,503.3L339.8,501.6L341.6,502.8L342.3,504.8L344.3,505.0L344.9,506.2L347.5,508.2L348.3,507.5L351.2,507.8L351.5,511.2L353.4,512.8L356.3,510.7L361.4,513.6L365.0,513.4L366.8,514.1L369.6,519.3L373.1,520.8L374.8,515.4L373.6,512.9L368.9,509.3L367.2,507.2L359.3,504.0L355.4,501.6Z","ITG2":"M241.7,537.3L242.6,538.2L243.4,538.1L243.4,536.5ZM261.5,510.3L261.8,508.8L260.4,508.4L259.6,504.8L258.4,504.2L258.5,502.9L255.4,502.7L250.1,507.7L247.1,509.3L242.6,508.9L241.9,513.2L243.7,513.7L244.9,516.4L245.7,518.9L245.5,522.3L244.8,524.3L246.5,525.5L244.5,532.0L244.3,539.7L244.7,540.2L246.0,539.1L247.4,541.4L251.1,541.3L252.5,539.9L253.5,536.7L255.8,536.4L258.1,537.9L259.7,537.1L261.8,522.5L260.8,519.4L262.9,515.3ZM241.5,507.7L242.8,508.5L243.3,507.3L242.6,506.6ZM242.9,504.7L243.9,506.0L244.8,505.4L244.2,504.3Z","ITG1":"M292.8,577.4L293.8,576.7L293.0,575.9L291.5,576.6ZM333.7,563.1L335.5,557.4L338.9,551.5L339.1,549.3L333.2,552.2L330.2,551.6L325.4,554.1L315.1,555.7L309.2,552.2L306.5,552.9L305.0,555.2L303.5,555.1L302.0,553.4L299.1,555.4L298.0,557.9L298.1,559.8L299.2,561.6L301.5,563.1L304.2,562.9L317.8,570.0L319.8,570.0L323.9,571.5L326.5,574.9L334.7,576.2L334.6,573.4L336.8,570.2L335.4,567.6L335.9,566.6L333.7,565.0ZM328.3,545.0L330.0,546.8L331.2,546.6L329.7,544.6Z","ITH1":"M288.4,413.9L289.4,412.2L292.3,412.6L293.9,411.7L290.2,407.9L289.9,406.5L291.0,405.3L289.8,405.1L285.4,406.8L284.0,406.4L278.7,407.3L277.2,410.4L274.7,410.4L273.1,409.0L270.8,409.2L270.0,412.1L270.8,413.4L270.6,414.6L272.6,416.0L274.8,416.1L279.1,415.2L278.9,418.6L279.9,419.3L283.4,417.2L284.8,415.0Z","ITH2":"M275.2,426.2L275.8,428.3L278.7,428.5L279.9,425.3L281.6,423.7L285.1,423.5L285.3,421.9L287.8,420.0L286.5,418.0L286.5,414.7L284.8,415.0L283.4,417.2L279.9,419.3L278.9,418.6L279.1,415.2L274.8,416.1L272.6,416.0L271.4,417.7L271.9,419.2L271.0,423.3L271.4,425.9Z","ITI1":"M275.5,484.1L276.6,484.9L277.3,484.2L276.4,483.1ZM270.4,478.0L270.7,475.9L268.1,476.9L267.5,477.4ZM262.4,473.3L263.4,473.7L263.9,472.4L263.1,471.7ZM273.8,454.2L272.9,454.8L271.1,453.1L268.4,452.4L267.1,451.0L264.2,449.1L261.6,450.8L265.9,455.4L265.6,456.1L267.1,457.3L268.5,459.9L269.0,463.8L271.7,469.4L271.7,474.3L274.1,474.5L275.2,477.0L279.4,480.7L279.7,483.5L283.4,483.7L285.3,482.5L285.1,480.9L287.1,479.2L287.6,477.7L287.0,476.8L288.8,476.0L289.4,474.9L289.5,470.4L291.5,468.6L290.8,466.2L293.6,461.1L293.1,460.4L291.0,460.6L286.1,458.7L285.6,456.9L286.1,454.6L283.8,454.0L282.4,453.0L279.9,455.1L278.1,455.3L275.2,454.9Z","ITI2":"M293.9,463.1L292.3,463.0L290.8,466.2L291.5,468.6L289.5,470.4L289.4,474.9L288.8,476.0L289.7,478.5L292.5,478.9L293.8,481.2L296.3,483.0L298.7,482.2L301.2,479.2L303.9,478.7L304.8,477.1L305.2,475.0L304.3,475.2L301.4,473.4L299.2,465.2L297.6,465.8Z","ITH3":"M296.9,412.3L293.9,411.7L292.3,412.6L289.4,412.2L288.4,413.9L286.5,414.7L286.5,418.0L287.8,420.0L285.3,421.9L285.1,423.5L281.6,423.7L279.9,425.3L278.7,428.5L275.8,428.3L275.2,426.2L273.1,429.9L273.1,433.2L274.0,435.0L275.0,435.1L277.9,438.1L279.7,438.2L279.8,439.3L282.4,440.9L284.8,441.6L287.1,440.3L289.6,440.2L292.3,440.9L294.0,443.2L294.7,440.8L293.0,437.1L290.6,434.8L293.3,432.6L293.8,430.8L295.1,431.5L301.8,428.7L300.3,425.6L296.6,426.4L293.4,422.3L294.2,420.6L292.7,418.4Z","LT01":"M410.6,256.9L409.7,255.2L410.1,254.4L408.2,252.7L405.7,252.4L403.6,250.2L402.0,252.7L401.9,254.3L404.9,258.0L404.5,259.1L407.3,260.3L405.7,261.9L404.8,265.1L404.8,266.8L405.3,268.6L410.8,267.2L409.5,271.3L410.1,272.3L412.4,271.9L413.6,269.8L415.8,268.6L416.7,269.2L417.1,270.8L418.8,270.1L418.3,268.6L416.5,267.6L416.6,265.3L417.2,263.3L416.4,259.4L417.3,257.3L420.0,255.6L420.1,253.4L423.5,252.0L424.0,250.2L421.1,251.6L414.4,251.5L414.2,253.3L415.4,255.5Z","LT02":"M406.1,238.4L402.5,234.8L400.7,235.9L399.6,238.0L396.5,239.1L394.5,238.1L388.7,238.5L386.6,240.1L384.8,238.8L382.3,239.8L380.3,239.5L377.1,239.7L376.2,240.6L372.4,242.6L368.7,247.1L369.6,252.0L372.0,256.8L372.8,260.5L373.7,259.8L381.0,262.6L385.7,261.3L388.7,264.3L389.1,265.8L388.4,266.7L388.2,269.5L389.8,272.6L391.7,271.9L395.2,273.5L397.2,275.2L398.0,278.0L404.6,276.5L406.6,277.3L408.6,275.2L409.9,275.2L410.1,272.3L409.5,271.3L410.8,267.2L405.3,268.6L404.8,266.8L405.7,261.9L407.3,260.3L404.5,259.1L404.9,258.0L401.9,254.3L402.0,252.7L403.6,250.2L405.7,252.4L408.2,252.7L410.1,254.4L409.7,255.2L410.6,256.9L415.4,255.5L414.2,253.3L414.4,251.5L421.1,251.6L424.0,250.2L423.6,249.4L421.6,248.9L421.3,243.5L418.7,243.5L414.9,240.4L410.5,238.3Z","LU":"M222.7,352.4L221.3,353.7L219.4,357.8L220.8,361.0L219.9,362.9L220.6,363.8L225.8,364.5L226.0,363.2L227.4,360.3L227.2,358.7L225.4,358.0L223.7,355.3L223.9,353.4Z","LV":"M410.6,212.8L407.3,209.4L400.6,207.4L398.2,208.1L392.7,212.0L395.2,221.4L395.0,223.2L391.7,227.2L388.7,228.2L385.8,226.8L383.6,222.8L379.0,220.0L377.6,217.2L370.4,221.7L368.7,226.6L369.0,231.1L366.8,234.5L366.9,240.2L367.5,244.4L368.7,247.1L372.4,242.6L376.2,240.6L377.1,239.7L380.3,239.5L382.3,239.8L384.8,238.8L386.6,240.1L388.7,238.5L394.5,238.1L396.5,239.1L399.6,238.0L400.7,235.9L402.5,234.8L406.1,238.4L410.5,238.3L414.9,240.4L418.7,243.5L421.3,243.5L422.9,242.9L424.9,239.8L429.5,239.5L429.8,237.0L433.1,232.1L433.2,230.1L431.1,225.8L427.6,221.6L425.9,222.1L425.7,214.9L422.3,213.0L421.8,211.5L420.2,212.0L416.1,211.1L413.2,213.5Z","MT":"M327.0,589.3L325.0,588.7L324.9,589.6L325.6,590.5L327.1,591.0L328.0,590.4L328.0,589.9L327.1,589.9L327.3,589.5L326.9,589.7Z","NL2":"M226.6,310.7L226.1,307.9L218.5,308.9L218.1,310.1L215.1,311.8L215.9,314.3L215.0,315.0L218.2,317.5L220.0,322.8L215.9,322.2L213.6,324.4L214.8,325.9L219.8,324.7L223.4,326.3L223.8,325.0L225.7,323.8L228.1,325.2L232.1,323.5L232.0,320.5L235.2,318.6L234.7,315.1L231.6,314.3L231.9,311.9L231.1,311.2L229.0,312.0Z","NL1":"M237.0,306.3L237.4,301.9L236.2,301.6L236.1,300.9L234.5,300.2L234.1,299.0L232.9,298.0L227.3,298.6L221.5,300.0L216.6,304.8L218.5,308.9L226.1,307.9L226.6,310.7L229.0,312.0L231.1,311.2L231.9,311.9L234.9,311.9ZM217.9,298.1L218.9,299.0L219.7,298.4L218.9,297.5ZM221.2,297.6L222.2,298.4L223.0,297.5L222.3,296.9Z","NL4":"M223.4,326.3L219.8,324.7L214.8,325.9L213.6,324.4L210.1,325.8L205.5,326.7L205.1,327.7L205.5,331.3L206.8,331.5L207.0,330.3L207.8,329.9L209.7,330.8L210.7,329.6L211.9,330.9L213.6,330.3L214.2,331.0L214.1,332.2L215.4,333.9L218.1,333.7L218.8,334.8L221.1,336.0L221.1,337.7L219.6,340.7L219.6,342.6L220.5,342.4L223.2,342.9L224.0,340.3L221.9,338.2L225.2,335.8L224.1,334.8L225.8,332.8L225.6,330.2Z","NL3":"M202.2,333.6L205.0,331.7L196.0,330.6L196.0,332.2L198.5,332.1L200.9,333.7ZM213.1,306.1L212.8,304.6L214.0,302.8L213.4,301.9L212.3,303.6L210.5,311.6L209.0,315.6L207.6,317.8L204.8,320.7L203.4,321.1L203.7,323.1L201.5,324.5L201.3,327.3L199.7,327.4L198.8,329.0L205.5,331.3L205.1,327.7L205.5,326.7L210.1,325.8L213.6,324.4L215.9,322.2L220.0,322.8L218.2,317.5L215.0,315.0L215.9,314.3L215.1,311.8L218.1,310.1L218.5,308.9L216.6,304.8Z","PL41":"M341.0,307.0L341.2,304.0L339.2,302.4L339.2,299.5L339.9,298.2L338.1,296.4L339.1,294.5L335.0,294.2L333.8,292.2L332.7,293.0L331.9,295.0L330.1,295.9L330.4,297.0L332.0,298.2L331.9,299.3L328.7,302.9L325.5,303.3L325.7,308.1L324.3,309.8L325.5,313.4L325.8,319.1L329.2,322.3L331.0,322.5L331.9,323.9L334.0,324.2L336.5,327.0L339.9,326.8L340.8,325.4L343.8,326.1L344.1,328.3L346.0,329.4L347.2,332.3L348.9,333.6L351.1,332.3L350.1,329.4L352.6,327.3L352.3,324.0L353.0,320.6L355.2,320.5L355.7,319.2L355.2,317.1L356.2,316.6L358.3,313.6L357.9,311.9L354.9,312.0L353.3,310.3L351.1,310.1L350.7,309.3L348.7,310.1Z","PL61":"M361.6,304.3L360.6,301.3L363.0,300.6L362.4,298.3L363.3,297.3L362.2,294.7L358.0,293.7L356.1,290.9L352.4,291.1L351.5,289.9L348.1,290.0L345.3,288.9L343.3,290.0L341.7,292.3L339.7,292.8L338.1,296.4L339.9,298.2L339.2,299.5L339.2,302.4L341.2,304.0L341.0,307.0L348.7,310.1L350.7,309.3L351.1,310.1L353.3,310.3L354.9,312.0L357.9,311.9L360.2,310.6Z","PL21":"M374.1,341.1L371.2,341.0L370.3,342.3L366.9,343.5L365.8,345.3L365.6,347.4L364.6,348.1L363.3,351.3L367.1,353.9L368.0,356.5L370.5,359.6L371.9,359.8L372.3,362.6L373.4,362.7L375.5,362.5L376.5,360.1L380.8,358.0L384.6,359.3L386.0,357.2L389.2,356.5L387.9,352.3L386.7,351.1L387.1,349.9L385.4,348.0L384.7,343.6L384.9,341.6L380.9,343.3L379.7,344.9L376.9,345.3Z","PL51":"M334.0,324.2L331.9,323.9L330.6,325.7L327.8,324.4L326.5,325.5L325.0,328.9L324.0,329.7L321.8,329.1L321.0,330.8L319.4,330.5L317.5,332.1L318.1,333.5L318.0,335.8L316.4,340.4L318.0,340.2L318.9,337.9L320.7,338.2L322.4,341.2L327.0,341.8L329.5,343.4L330.3,342.9L333.6,343.6L332.1,346.6L335.1,349.2L336.1,351.1L337.5,351.4L340.3,348.6L338.9,346.4L339.1,345.7L340.5,344.9L341.6,342.7L342.2,342.3L345.1,333.1L347.2,332.3L346.0,329.4L344.1,328.3L343.8,326.1L340.8,325.4L339.9,326.8L336.5,327.0Z","PL81":"M403.2,307.5L399.3,306.3L397.4,310.1L395.4,310.1L395.0,311.6L393.7,311.3L393.1,312.0L388.0,313.4L388.6,316.4L388.3,318.2L385.9,320.0L388.6,321.6L389.2,328.7L390.6,333.1L393.5,332.7L394.7,335.0L397.1,335.7L398.1,335.5L398.6,337.1L397.8,338.6L400.1,339.9L404.0,339.4L405.5,337.7L407.4,337.2L409.8,339.1L411.3,336.6L414.0,335.2L414.4,331.6L412.7,329.2L413.6,327.7L408.4,321.8L405.3,314.9L405.8,313.4L405.5,309.3Z","PL43":"M325.3,302.3L324.5,302.2L323.3,304.2L320.3,304.7L317.5,307.1L315.2,306.9L313.7,310.6L311.9,311.3L312.6,313.0L311.8,315.1L312.6,317.2L313.6,317.8L314.4,320.4L313.2,324.5L314.7,327.2L314.7,328.6L316.9,330.4L317.5,332.1L319.4,330.5L321.0,330.8L321.8,329.1L324.0,329.7L325.0,328.9L326.5,325.5L327.8,324.4L330.6,325.7L331.9,323.9L331.0,322.5L329.2,322.3L325.8,319.1L325.5,313.4L324.3,309.8L325.7,308.1Z","PL92":"M382.8,294.4L380.8,289.2L369.6,295.4L368.6,296.6L364.6,296.4L363.3,297.3L362.4,298.3L363.0,300.6L360.6,301.3L361.6,304.3L360.2,310.6L364.2,312.2L367.0,311.2L370.5,314.0L370.6,315.5L371.7,316.6L374.6,317.6L375.6,320.4L373.1,321.5L374.8,324.0L374.4,326.5L378.3,328.9L380.2,328.3L385.6,330.1L389.2,328.7L388.6,321.6L385.9,320.0L388.3,318.2L388.6,316.4L388.0,313.4L393.1,312.0L393.7,311.3L395.0,311.6L395.4,310.1L397.4,310.1L399.3,306.3L393.9,305.3L391.4,302.1L390.8,299.5L386.6,298.3ZM371.6,309.2L374.5,304.6L376.4,305.5L378.4,305.3L381.7,306.1L383.2,304.5L384.5,305.6L386.1,308.9L387.3,309.7L388.0,311.6L387.2,313.5L384.4,313.3L383.3,315.3L381.7,316.2L381.3,315.9L375.2,316.1L374.5,314.7L373.3,314.6L372.4,313.4L372.6,311.7L371.3,311.3Z","PL52":"M347.2,332.3L345.1,333.1L342.2,342.3L341.6,342.7L340.5,344.9L339.1,345.7L345.0,348.4L348.1,347.5L348.3,348.7L347.6,350.1L349.8,352.3L351.8,350.8L351.8,349.0L355.6,347.3L354.8,343.7L355.5,342.4L356.9,342.1L355.6,339.9L356.4,337.0L356.6,333.6L351.1,332.3L348.9,333.6Z","PL84":"M399.5,282.2L397.2,275.2L395.2,273.5L391.7,271.9L389.8,272.6L387.9,275.7L390.6,279.9L390.6,282.0L385.8,287.2L383.3,288.9L380.8,289.2L382.8,294.4L386.6,298.3L390.8,299.5L391.4,302.1L393.9,305.3L399.3,306.3L399.9,306.2L401.6,302.0L405.0,299.2L405.9,296.7L404.2,290.4Z","PL63":"M357.7,287.1L359.0,286.7L359.4,284.9L357.9,284.6L355.8,282.0L356.4,280.6L355.9,279.3L355.0,278.2L352.7,278.3L349.2,277.5L348.3,275.0L345.8,271.3L335.5,274.0L330.5,277.2L332.1,279.7L332.4,282.0L331.5,283.3L332.3,286.8L334.3,288.0L333.5,288.8L333.4,290.8L335.0,294.2L339.1,294.5L339.7,292.8L341.7,292.3L343.3,290.0L345.3,288.9L348.1,290.0L351.5,289.9L352.4,291.1L356.1,290.9Z","PL22":"M359.3,332.7L356.6,333.6L356.4,337.0L355.6,339.9L356.9,342.1L355.5,342.4L354.8,343.7L355.6,347.3L351.8,349.0L351.8,350.8L355.1,352.8L357.8,352.7L358.5,355.3L360.7,356.6L361.6,358.9L362.7,359.1L363.6,360.5L364.9,360.3L368.0,356.5L367.1,353.9L363.3,351.3L364.6,348.1L365.6,347.4L365.8,345.3L366.9,343.5L370.3,342.3L371.2,341.0L370.0,340.0L369.8,338.1L368.2,337.6L369.0,336.0L368.3,335.3L365.5,335.1L363.7,333.2L362.6,333.2L362.1,333.9Z","PL82":"M394.7,335.0L393.5,332.7L390.6,333.1L388.6,338.0L384.9,341.6L384.7,343.6L385.4,348.0L387.1,349.9L386.7,351.1L387.9,352.3L389.2,356.5L394.5,356.7L397.3,358.9L406.3,361.0L404.3,357.6L402.7,351.9L407.2,342.8L409.8,339.1L407.4,337.2L405.5,337.7L404.0,339.4L400.1,339.9L397.8,338.6L398.6,337.1L398.1,335.5L397.1,335.7Z","PL62":"M360.8,275.9L357.4,279.1L355.9,279.3L356.4,280.6L355.8,282.0L357.9,284.6L359.4,284.9L359.0,286.7L357.7,287.1L356.1,290.9L358.0,293.7L362.2,294.7L363.3,297.3L364.6,296.4L368.6,296.6L369.6,295.4L380.2,289.3L383.3,288.9L385.8,287.2L390.6,282.0L390.6,279.9L387.9,275.7L389.8,272.6L378.0,275.3Z","PL42":"M333.4,290.8L333.5,288.8L334.3,288.0L332.3,286.8L331.5,283.3L332.4,282.0L332.1,279.7L330.5,277.2L325.5,282.3L307.1,289.7L307.1,290.8L310.4,290.9L310.9,291.8L310.0,293.8L307.8,293.5L309.6,299.6L309.2,303.9L307.3,305.9L307.6,308.1L311.9,311.3L313.7,310.6L315.2,306.9L317.5,307.1L320.3,304.7L323.3,304.2L324.5,302.2L325.3,302.3L325.5,303.3L328.7,302.9L331.9,299.3L332.0,298.2L330.4,297.0L330.1,295.9L331.9,295.0L332.7,293.0L333.8,292.2Z","PL71":"M360.2,310.6L357.9,311.9L358.3,313.6L356.2,316.6L355.2,317.1L355.7,319.2L355.2,320.5L353.0,320.6L352.3,324.0L352.6,327.3L350.1,329.4L351.1,332.3L356.6,333.6L359.3,332.7L362.1,333.9L362.6,333.2L363.7,333.2L365.5,335.1L368.3,335.3L369.4,332.4L371.1,332.8L370.3,329.8L373.7,328.1L374.4,326.5L374.8,324.0L373.1,321.5L375.6,320.4L374.6,317.6L371.7,316.6L370.6,315.5L370.5,314.0L367.0,311.2L364.2,312.2Z","PL72":"M374.4,326.5L373.7,328.1L370.3,329.8L371.1,332.8L369.4,332.4L368.3,335.3L369.0,336.0L368.2,337.6L369.8,338.1L370.0,340.0L371.2,341.0L374.1,341.1L376.9,345.3L379.7,344.9L380.9,343.3L384.9,341.6L388.6,338.0L390.6,333.1L389.2,328.7L385.6,330.1L380.2,328.3L378.3,328.9Z","PT18":"M44.9,515.0L42.4,511.2L42.1,506.9L39.9,502.9L35.9,504.1L34.1,503.6L33.6,505.8L28.1,509.4L28.8,511.8L28.4,514.1L26.5,513.5L24.0,514.4L24.0,515.4L22.0,517.6L20.7,517.8L17.1,526.1L17.5,528.3L16.0,535.0L20.0,537.0L21.4,536.6L24.9,539.2L29.3,537.7L33.0,537.7L38.0,531.4L41.1,530.9L42.8,528.4L40.4,528.2L38.7,523.2L41.1,518.7Z","PT15":"M16.0,535.0L12.4,541.4L17.6,541.1L22.8,542.9L26.5,545.4L33.2,543.8L33.0,537.7L29.3,537.7L24.9,539.2L21.4,536.6L20.0,537.0Z","PT20":"M-189.5,465.9L-191.3,465.8L-190.8,466.8L-189.2,467.4ZM-184.9,453.6L-185.5,452.1L-190.5,450.2L-192.4,447.8L-193.5,447.8L-192.6,450.5L-189.9,452.8ZM-203.4,424.6L-204.9,424.8L-204.0,427.5L-200.9,428.3L-201.4,425.7ZM-212.2,421.9L-214.0,421.6L-213.2,423.5L-211.8,423.8ZM-219.4,418.6L-222.2,417.5L-219.4,423.7L-217.7,424.3ZM-208.8,416.0L-210.4,416.1L-209.6,417.4L-208.5,417.2ZM-241.2,388.2L-242.6,388.7L-242.5,390.7L-240.8,390.0ZM-238.2,385.4L-239.3,385.7L-239.2,387.4L-238.0,386.6Z","PT16":"M34.1,503.6L35.9,504.1L39.9,502.9L46.5,504.0L49.3,499.7L48.3,496.3L49.4,494.9L50.5,494.9L51.6,493.6L53.1,485.4L52.2,482.3L49.3,483.2L48.8,481.7L47.5,481.5L45.0,484.4L42.6,482.8L42.1,481.3L40.1,479.6L37.8,479.6L37.0,481.3L34.7,482.7L31.9,481.7L30.8,478.3L29.3,482.7L27.5,485.1L24.3,492.5L20.1,499.4L16.1,502.3L14.0,506.8L17.1,509.5L20.1,509.0L20.4,510.0L18.9,512.0L19.2,513.3L21.0,513.9L22.6,512.9L24.0,514.4L26.5,513.5L28.4,514.1L28.8,511.8L28.1,509.4L33.6,505.8Z","PT17":"M21.0,513.9L19.2,513.3L17.0,514.5L14.9,513.8L14.6,517.4L22.0,517.6L24.0,515.4L24.0,514.4L22.6,512.9ZM17.1,509.5L14.0,506.8L12.0,511.1L12.2,512.4L16.0,513.3L18.1,511.3L18.9,512.0L20.4,510.0L20.1,509.0Z","PT30":"M-109.2,624.3L-108.2,624.7L-108.1,623.0L-109.0,622.8L-109.7,623.4ZM-114.7,576.3L-111.9,578.9L-110.3,579.4L-109.0,578.3L-110.4,576.1L-114.0,574.2L-115.4,574.5ZM-102.4,574.5L-101.1,575.7L-100.1,575.1L-100.9,574.2Z","PT11":"M39.9,464.1L41.5,462.5L40.8,460.3L35.5,460.7L31.5,463.0L30.8,478.3L31.9,481.7L34.7,482.7L37.0,481.3L37.8,479.6L40.1,479.6L42.1,481.3L42.6,482.8L45.0,484.4L47.5,481.5L48.8,481.7L49.3,483.2L53.8,482.3L55.8,480.1L58.7,479.3L60.9,478.0L62.9,475.0L59.5,472.8L59.7,468.5L52.7,466.3L51.9,467.7L49.1,467.9L45.5,465.8L41.3,466.2L39.9,465.9Z","RO32":"M459.3,430.8L460.4,426.6L458.2,422.9L454.5,424.7L454.9,426.2L454.2,427.7L454.7,430.6L458.0,431.8Z","RO12":"M439.7,385.7L438.3,387.3L436.1,387.1L433.8,388.5L433.0,391.2L431.3,391.7L429.8,394.8L427.3,394.5L426.5,395.8L426.2,401.1L422.1,401.8L419.3,400.8L415.6,402.2L412.5,401.3L411.3,402.2L411.4,404.2L412.4,405.0L414.4,405.2L416.5,407.1L417.2,409.0L418.8,409.6L422.2,415.6L424.6,417.7L436.7,413.1L441.3,412.6L443.3,413.3L444.8,415.3L446.1,414.0L448.5,412.7L450.8,413.0L451.4,411.8L453.0,411.4L455.3,408.6L455.6,405.7L455.3,401.7L452.6,398.8L452.4,397.5L449.2,396.6L449.2,394.9L447.8,392.1L446.2,392.6L444.7,387.8L442.9,386.4Z","RO21":"M465.4,378.2L463.2,376.9L460.3,373.9L454.2,365.9L451.4,364.7L449.5,364.9L446.7,366.9L445.8,369.8L444.7,370.8L436.2,373.8L434.4,376.9L432.9,377.6L433.8,378.6L433.5,379.8L435.1,381.3L436.1,387.1L438.3,387.3L439.7,385.7L442.9,386.4L444.7,387.8L446.2,392.6L447.8,392.1L449.2,394.9L449.2,396.6L452.4,397.5L452.6,398.8L455.3,401.7L460.5,400.0L464.4,396.9L466.8,397.0L468.1,399.1L468.3,397.0L474.0,396.1L473.6,393.8L474.2,391.2L473.4,387.1L469.5,381.3L466.9,380.4Z","RO11":"M412.6,375.3L409.6,378.2L407.7,381.1L403.3,383.3L402.6,385.4L402.0,385.6L399.5,393.9L398.2,396.0L396.7,402.5L403.9,401.6L408.6,404.9L411.4,404.2L411.3,402.2L412.5,401.3L415.6,402.2L419.3,400.8L422.1,401.8L426.2,401.1L426.5,395.8L427.3,394.5L429.8,394.8L431.3,391.7L433.0,391.2L433.8,388.5L436.1,387.1L435.1,381.3L433.5,379.8L433.8,378.6L432.9,377.6L427.9,374.5L424.3,376.4L416.8,376.0L416.1,376.8Z","RO22":"M467.0,397.3L464.4,396.9L460.5,400.0L455.3,401.7L455.6,405.7L455.3,408.6L453.0,411.4L456.0,415.6L458.5,415.8L461.4,420.7L468.6,420.2L475.6,418.2L476.5,418.7L480.1,423.1L479.7,425.2L479.0,426.8L471.7,430.8L473.6,432.2L479.9,431.2L481.3,433.2L482.8,433.8L488.5,433.4L488.5,429.1L487.0,424.0L489.6,416.8L491.3,414.7L495.7,412.6L495.3,406.1L494.2,404.0L491.6,403.2L489.3,404.0L484.0,408.7L480.0,408.3L477.6,406.3L475.9,404.3L476.0,402.4L474.0,396.0L468.3,397.0L468.1,399.1Z","RO31":"M443.3,413.3L441.3,412.6L436.7,413.1L435.0,413.9L436.4,423.2L436.2,426.2L437.5,426.1L439.5,427.7L441.3,432.5L442.9,432.7L442.4,433.6L443.1,437.6L441.0,439.8L442.8,442.3L442.2,444.1L453.0,443.3L454.4,442.2L458.8,436.5L461.3,434.7L467.9,431.5L471.7,430.8L479.0,426.8L479.7,425.2L480.1,423.1L476.5,418.7L475.6,418.2L468.6,420.2L461.4,420.7L458.5,415.8L456.0,415.6L453.0,411.4L451.4,411.8L450.8,413.0L448.5,412.7L446.1,414.0L444.8,415.3ZM454.7,430.6L454.2,427.7L454.9,426.2L454.5,424.7L458.2,422.9L460.4,426.6L459.3,430.8L458.0,431.8Z","RO41":"M439.5,427.7L437.5,426.1L436.2,426.2L436.4,423.2L435.0,413.9L424.6,417.7L424.9,419.7L414.6,423.2L413.7,424.9L414.7,425.7L413.3,428.0L412.9,431.1L410.3,431.7L409.9,435.0L408.5,435.3L410.4,436.6L413.1,433.0L416.0,434.0L416.5,434.9L414.6,437.0L417.3,440.4L421.1,441.7L421.9,442.6L420.5,443.9L420.3,445.2L422.2,446.4L427.0,444.9L435.8,445.8L438.4,445.3L440.2,444.0L442.2,444.1L442.8,442.3L441.0,439.8L443.1,437.6L442.4,433.6L442.9,432.7L441.3,432.5Z","RO42":"M403.9,401.6L396.7,402.5L395.4,403.6L395.6,406.4L394.3,408.7L393.1,409.8L390.0,409.8L389.5,411.9L384.5,413.2L389.8,418.0L391.6,418.4L391.6,420.5L392.3,422.8L395.0,425.2L400.7,426.5L401.2,427.5L400.3,429.8L402.2,431.3L400.2,432.9L402.9,433.7L404.2,434.9L408.5,435.3L409.9,435.0L410.3,431.7L412.9,431.1L413.3,428.0L414.7,425.7L413.7,424.9L414.6,423.2L424.9,419.7L424.6,417.7L422.2,415.6L418.8,409.6L417.2,409.0L416.5,407.1L414.4,405.2L412.4,405.0L411.4,404.2L408.6,404.9Z","SE221":"M308.0,253.9L309.6,254.8L310.0,254.3L309.8,252.2L315.4,252.1L317.6,251.1L319.2,251.8L319.8,253.1L321.7,248.5L319.8,248.4L317.1,246.1L315.1,246.2L310.7,248.6L307.3,247.3L306.4,249.9L308.0,251.6Z","SE312":"M294.0,161.0L291.2,156.8L291.4,154.7L290.0,154.8L287.4,152.0L283.4,151.2L282.7,160.4L284.7,162.7L286.2,163.1L288.4,166.2L287.2,171.3L291.1,175.8L294.4,181.1L295.9,182.0L298.3,185.2L299.9,184.7L300.9,186.7L302.7,187.8L305.1,188.0L305.8,186.4L309.0,187.9L311.2,190.1L312.0,188.5L313.3,188.1L313.8,184.6L315.6,184.4L317.9,185.8L320.1,184.0L321.4,183.5L316.3,177.3L317.6,174.9L317.5,173.6L315.4,170.8L312.2,169.7L311.0,167.0L306.8,161.7L306.1,163.0L303.4,163.2L302.4,161.7Z","SE214":"M340.4,235.4L342.1,234.6L344.9,228.7L345.4,220.0L340.7,222.4L338.9,226.3L338.6,231.5ZM347.4,218.2L348.2,219.0L348.6,217.9L348.0,217.0ZM345.9,211.6L346.9,212.2L347.5,211.5L346.7,210.8Z","SE313":"M326.1,175.3L325.0,174.5L325.0,172.5L324.0,170.2L322.5,159.5L323.2,158.2L324.5,158.0L323.7,154.5L324.3,150.6L309.2,148.5L307.1,149.9L308.0,152.2L305.8,154.7L305.7,157.2L302.2,157.0L301.0,161.6L302.4,161.7L303.4,163.2L306.1,163.0L306.8,161.7L311.0,167.0L312.2,169.7L315.4,170.8L317.5,173.6L317.6,174.9L316.3,177.3L321.4,183.5L323.3,181.7L325.1,181.4Z","SE231":"M293.7,236.5L289.6,233.5L287.5,234.3L286.1,229.5L282.7,229.9L283.0,233.2L284.4,232.7L284.6,235.5L285.3,235.8L287.2,240.4L289.0,241.8L290.6,244.8L292.2,245.3L292.6,247.5L292.3,248.2L293.4,249.6L295.2,249.9L297.5,248.3L295.8,242.1L298.8,240.2L299.1,239.1L297.1,237.0L294.0,238.1Z","SE322":"M296.1,103.0L292.8,110.0L292.1,112.3L295.4,114.7L295.8,118.4L294.9,121.2L289.2,120.5L287.0,121.3L285.2,122.9L281.7,129.1L281.9,131.3L280.5,134.6L282.2,138.7L281.5,140.7L281.8,143.2L281.5,145.5L283.4,151.2L287.4,152.0L290.0,154.8L291.4,154.7L291.2,156.8L294.0,161.0L301.0,161.6L302.2,157.0L305.7,157.2L305.8,154.7L308.0,152.2L307.1,149.9L305.5,150.0L304.0,149.0L303.0,147.6L302.8,145.5L314.1,142.1L318.0,137.5L314.9,133.6L310.8,130.0L309.5,127.0L314.3,125.0L315.0,119.8L311.2,116.6L309.7,116.3L309.2,115.1L307.4,114.1L306.7,112.3L306.1,113.4L303.2,109.3L301.9,108.7L298.9,105.0Z","SE211":"M304.5,218.5L302.3,219.6L301.2,221.3L298.7,221.9L299.0,224.2L298.6,228.3L296.8,232.4L293.7,236.5L294.0,238.1L297.1,237.0L299.1,239.1L299.4,238.3L302.8,237.8L304.9,240.1L305.4,239.2L305.4,235.9L308.3,234.5L310.5,235.6L312.8,234.1L315.6,234.2L315.2,230.5L316.2,229.2L315.7,227.1L314.0,225.9L311.5,225.7L310.0,222.3L310.4,221.0L309.6,219.2L306.2,219.8Z","SE213":"M325.4,249.6L329.3,234.4L329.4,231.1L328.5,232.0L324.2,245.9ZM324.6,226.8L325.7,222.4L325.5,220.8L323.4,218.7L320.8,218.3L319.1,219.7L318.9,223.3L315.8,223.5L314.0,225.9L315.7,227.1L316.2,229.2L315.2,230.5L315.6,234.2L318.4,238.2L316.6,239.1L315.2,241.4L315.1,246.2L317.1,246.1L319.8,248.4L321.7,248.5L324.7,239.7L324.6,232.7L325.9,227.9Z","SE212":"M315.6,234.2L312.8,234.1L310.5,235.6L308.3,234.5L305.4,235.9L305.4,239.2L304.9,240.1L302.8,237.8L299.4,238.3L298.8,240.2L295.8,242.1L297.5,248.3L298.2,248.7L301.3,247.9L303.2,246.4L304.1,246.8L307.3,247.3L310.7,248.6L315.1,246.2L315.2,241.4L316.6,239.1L318.4,238.2Z","SE332":"M351.7,93.3L352.5,93.8L352.8,92.6L352.2,92.3ZM352.7,87.9L352.6,90.0L354.0,89.2L353.4,88.2ZM362.3,85.3L363.0,85.6L363.0,83.8L362.5,83.9ZM348.1,45.7L346.7,43.4L340.0,41.5L338.8,40.1L337.7,40.0L336.8,39.1L335.5,38.7L335.0,37.7L331.7,35.8L330.7,34.0L329.2,33.6L327.1,34.5L328.3,37.7L328.2,39.9L327.4,42.2L328.2,43.8L327.3,45.3L317.4,43.4L315.7,44.2L316.4,49.6L315.6,53.0L311.1,52.2L308.5,55.3L307.4,60.4L305.2,62.7L305.2,63.9L307.3,67.5L307.4,69.7L302.2,79.2L302.4,82.1L304.6,82.8L308.9,85.6L312.2,86.7L318.9,92.1L326.6,95.0L330.4,97.2L331.8,98.9L333.2,97.9L335.0,94.8L344.9,96.8L347.0,98.0L346.9,92.8L347.9,92.4L348.8,93.1L348.9,90.4L350.6,91.1L351.2,89.0L350.9,84.7L354.0,84.9L354.9,86.3L357.6,84.0L359.3,83.4L360.3,84.5L362.7,82.4L359.9,77.4L358.5,76.7L357.7,75.4L357.2,72.6L357.9,70.7L357.8,66.1L354.1,61.4L353.7,60.0L354.4,58.2L354.1,56.7L351.9,56.2L352.2,54.0L351.1,50.4L351.4,48.1Z","SE224":"M292.7,266.6L293.1,265.5L292.6,264.3L292.0,265.8ZM306.4,249.9L307.3,247.3L304.1,246.8L303.2,246.4L301.3,247.9L298.2,248.7L297.5,248.3L295.2,249.9L293.4,249.6L292.3,248.2L290.4,248.9L291.3,251.7L289.3,252.2L293.8,260.5L293.2,263.4L294.3,265.6L297.4,266.4L300.9,265.0L305.4,264.9L306.5,262.7L305.4,259.9L305.4,258.0L308.0,253.9L308.0,251.6Z","SE110":"M336.6,202.9L337.3,203.8L337.8,202.7L337.2,201.8ZM340.9,194.1L341.4,195.7L342.0,195.3L341.8,194.0ZM338.1,201.2L339.1,200.5L339.2,198.0L340.4,197.0L340.8,190.3L342.3,188.3L338.6,182.0L336.5,182.6L335.9,187.1L332.8,190.3L329.7,191.6L327.9,199.3L328.8,202.3L333.7,204.7L336.1,200.7L337.3,200.3ZM345.8,193.4L346.7,194.0L347.0,193.0L346.3,192.4Z","SE122":"M328.3,209.3L328.6,208.4L327.7,208.0L327.3,209.3ZM331.0,203.4L328.8,202.3L327.9,199.3L328.8,196.4L326.2,194.5L324.7,194.5L319.1,196.2L318.6,197.8L316.3,198.3L315.8,200.1L315.0,200.8L315.2,202.1L314.3,203.7L314.6,204.4L315.9,204.0L319.9,206.7L321.3,208.4L323.5,208.7L324.4,209.5L326.2,209.5L327.2,207.5L329.7,207.0L331.4,204.9Z","SE121":"M336.6,179.2L335.4,177.9L334.2,179.2L331.0,175.6L328.8,176.5L326.1,175.3L325.1,181.4L323.3,181.7L321.4,183.5L321.8,186.4L322.7,188.4L322.6,190.7L324.7,194.5L326.2,194.5L328.8,196.4L329.7,191.6L332.8,190.3L335.9,187.1Z","SE311":"M280.9,191.8L281.7,192.9L281.7,194.2L279.9,196.2L281.1,201.9L283.2,202.6L284.4,201.6L287.1,203.6L288.7,203.2L290.7,208.5L293.7,209.9L294.7,209.6L294.7,207.8L295.4,205.6L297.5,204.4L302.6,204.8L302.4,201.3L303.4,195.7L302.7,190.5L302.2,189.2L302.7,187.8L300.9,186.7L299.9,184.7L298.3,185.2L295.9,182.0L294.4,181.1L291.1,175.8L287.2,171.3L283.7,172.3L287.0,180.8L286.1,187.8L284.0,190.6Z","SE331":"M346.4,121.6L346.7,121.0L346.4,119.5L345.7,120.0ZM331.8,98.9L330.4,97.2L326.6,95.0L318.9,92.1L312.2,86.7L308.9,85.6L304.6,82.8L302.4,82.1L302.2,83.5L299.8,85.5L296.6,86.1L297.3,91.5L296.9,95.0L297.1,99.5L296.1,103.0L298.9,105.0L301.9,108.7L303.2,109.3L306.1,113.4L306.7,112.3L307.4,114.1L309.2,115.1L309.7,116.3L311.2,116.6L316.6,121.0L322.4,121.4L327.5,119.1L328.5,121.3L332.3,122.6L335.2,126.8L336.7,127.1L336.5,125.3L338.2,126.5L340.2,123.2L342.8,122.2L344.9,118.7L346.0,114.0L349.1,108.6L347.6,106.2L346.6,105.7L346.1,104.2L345.0,103.0L347.0,98.0L344.9,96.8L335.0,94.8L333.2,97.9Z","SE321":"M324.3,148.7L325.0,150.0L325.4,149.0L324.8,148.1ZM327.5,119.1L322.4,121.4L316.6,121.0L315.0,119.8L314.3,125.0L309.5,127.0L310.8,130.0L314.9,133.6L318.0,137.5L314.1,142.1L302.8,145.5L303.0,147.6L304.0,149.0L305.5,150.0L307.1,149.9L309.2,148.5L324.3,150.6L323.7,147.7L323.8,145.2L324.9,145.4L327.5,142.6L328.6,138.0L329.8,137.8L330.6,135.3L331.5,134.8L330.9,132.8L333.9,131.3L335.0,128.8L335.2,126.8L332.3,122.6L328.5,121.3Z","SE125":"M311.2,190.1L312.2,191.5L312.5,193.5L314.1,195.8L314.3,196.9L313.6,198.5L315.0,200.8L315.8,200.1L316.3,198.3L318.6,197.8L319.1,196.2L324.7,194.5L322.6,190.7L322.7,188.4L321.8,186.4L321.4,183.5L320.1,184.0L317.9,185.8L315.6,184.4L313.8,184.6L313.3,188.1L312.0,188.5Z","SE232":"M278.1,206.2L276.9,204.1L276.1,204.5L275.3,208.1L276.3,215.2L278.5,218.5L278.5,221.1L279.9,221.2L280.0,226.4L281.1,227.6L281.2,229.5L282.7,229.9L286.1,229.5L287.5,234.3L289.6,233.5L293.7,236.5L296.8,232.4L298.6,228.3L299.0,224.2L298.7,221.9L301.2,221.3L302.3,219.6L304.5,218.5L307.2,210.6L306.1,209.3L304.6,209.6L302.6,204.8L297.5,204.4L295.4,205.6L294.7,207.8L294.7,209.6L293.7,209.9L290.7,208.5L288.7,203.2L287.1,203.6L284.4,201.6L283.2,202.6L281.1,201.9L279.6,207.4L278.3,207.8Z","SE124":"M302.6,204.8L304.6,209.6L306.1,209.3L307.2,210.6L311.1,206.9L313.5,206.3L313.8,204.9L314.6,204.4L314.3,203.7L315.2,202.1L315.0,200.8L313.6,198.5L314.3,196.9L314.1,195.8L312.5,193.5L312.2,191.5L309.0,187.9L305.8,186.4L305.1,188.0L302.7,187.8L302.2,189.2L302.7,190.5L303.4,195.7L302.4,201.3Z","SE123":"M307.2,210.6L304.5,218.5L306.2,219.8L309.6,219.2L310.4,221.0L310.0,222.3L311.5,225.7L314.0,225.9L315.8,223.5L318.9,223.3L319.1,219.7L320.8,218.3L323.4,218.7L324.7,220.1L326.8,217.0L326.0,215.4L326.2,213.1L324.4,209.5L323.5,208.7L321.3,208.4L319.9,206.7L315.9,204.0L313.8,204.9L313.5,206.3L311.1,206.9Z","SI03":"M335.5,406.1L334.2,406.8L334.9,409.7L332.8,408.8L329.4,409.8L329.0,410.8L327.6,410.3L324.8,410.5L321.7,411.4L321.0,413.2L318.3,415.7L319.1,415.7L320.3,417.5L321.7,417.5L322.4,418.1L321.5,419.0L321.6,419.4L320.3,420.5L322.6,421.0L323.1,421.9L321.6,425.0L321.9,426.2L320.2,424.8L318.8,425.3L317.9,423.9L315.7,423.9L315.4,424.6L313.7,424.3L312.8,424.9L312.7,426.2L313.5,426.9L313.9,430.8L316.7,430.6L318.3,428.9L319.0,427.3L322.4,430.5L323.8,429.7L327.0,430.9L328.5,429.9L327.6,428.2L327.9,426.8L327.0,425.9L329.5,424.0L331.6,423.5L332.0,420.0L330.9,419.6L330.9,417.9L331.3,417.2L332.4,417.2L332.6,416.6L334.6,415.6L335.7,414.8L335.5,414.1L338.3,414.1L337.5,412.3L338.6,411.3L341.6,412.2L339.0,409.7L338.6,408.3L337.9,407.4L338.2,406.4L337.6,406.0Z","SI04":"M313.4,414.9L312.8,414.2L308.3,413.7L308.0,415.1L304.9,417.6L305.6,418.8L308.0,419.6L306.1,421.7L306.4,422.9L307.6,422.7L307.5,425.7L308.8,426.2L311.2,428.3L310.4,429.3L309.1,429.2L309.3,429.5L308.8,430.0L307.9,430.1L307.6,431.2L311.6,431.7L312.5,430.2L313.9,430.8L313.5,426.9L312.7,426.2L312.8,424.9L313.7,424.3L315.4,424.6L315.7,423.9L317.9,423.9L318.8,425.3L320.2,424.8L321.9,426.2L321.6,425.0L323.1,421.9L322.6,421.0L320.3,420.5L321.6,419.4L321.5,419.0L322.4,418.1L322.1,417.7L320.3,417.5L319.1,415.7L318.3,415.7L317.7,415.0L316.7,414.6Z","SK01":"M343.4,383.5L344.5,384.3L345.7,386.1L346.6,385.9L349.1,382.8L348.1,379.6L346.8,378.0L346.6,375.5L342.5,377.5L341.6,379.2L341.5,380.2Z","SK02":"M360.8,368.7L359.2,368.7L359.1,365.6L356.2,363.0L354.7,364.0L353.9,367.7L349.7,371.4L347.0,372.4L344.5,372.0L342.3,376.2L342.5,377.5L346.6,375.5L346.8,378.0L348.1,379.6L349.1,382.8L346.6,385.9L352.2,389.6L354.3,389.7L364.9,387.2L364.0,386.3L363.9,384.9L365.3,383.1L366.2,382.6L366.2,381.3L364.1,380.8L362.8,377.8L361.1,378.4L359.4,375.5L362.8,371.8Z","SK03":"M370.5,359.6L368.0,356.5L364.9,360.3L363.6,360.5L362.7,359.1L361.6,358.9L358.7,359.6L356.2,363.0L359.1,365.6L359.2,368.7L360.8,368.7L362.8,371.8L359.4,375.5L361.1,378.4L362.8,377.8L364.1,380.8L366.2,381.3L366.2,382.6L371.1,381.6L372.6,379.2L376.0,380.2L377.5,379.6L380.3,377.2L381.4,374.1L380.0,374.0L379.7,372.1L377.9,370.0L378.3,367.6L375.3,367.5L375.1,364.3L373.4,362.7L372.3,362.6L371.9,359.8Z","SK04":"M394.5,356.7L389.2,356.5L386.0,357.2L384.6,359.3L380.8,358.0L376.5,360.1L375.5,362.5L373.4,362.7L375.1,364.3L375.3,367.5L378.3,367.6L377.9,370.0L379.7,372.1L380.0,374.0L381.4,374.1L383.7,372.1L388.5,372.3L391.6,370.8L393.9,371.7L396.0,373.8L400.0,372.6L399.9,369.4L401.2,367.2L401.4,364.2L402.8,360.1L397.3,358.9Z"};
const NUTS0_PATHS = {"ES":"M191.4 521.3L191.4 523.8L187.4 521.4L185.7 521.4L185.4 519.9L190.3 519.6ZM166.0 525.5L174.4 520.6L177.7 521.6L176.7 523.2L178.1 524.1L179.4 523.2L180.7 524.1L177.3 530.2L174.8 531.5L173.8 529.8L171.6 529.6L171.3 527.2L169.8 526.0L168.2 527.7ZM89.4 449.9L100.7 450.2L105.6 453.6L110.5 453.0L117.2 456.6L122.0 456.4L126.6 458.7L125.5 462.1L127.1 461.8L133.8 465.5L135.5 467.5L138.7 467.4L142.1 470.3L150.3 471.5L151.3 468.9L158.5 472.2L159.8 476.8L163.0 476.2L166.6 478.9L169.2 478.1L173.0 479.9L177.2 478.4L180.8 479.1L181.9 481.6L179.9 483.0L180.5 487.7L165.5 496.7L151.1 499.6L147.5 502.7L148.7 505.1L144.3 507.2L133.8 519.3L131.4 524.1L132.3 529.8L134.1 533.3L136.9 535.8L127.0 541.9L121.1 551.0L122.4 552.2L122.0 553.2L114.5 552.8L109.9 555.2L107.1 557.8L105.3 561.7L101.7 564.6L99.0 562.6L93.4 564.0L88.6 562.2L84.3 562.3L71.6 559.8L67.6 562.4L60.6 562.7L57.4 566.5L53.6 567.8L48.4 563.9L46.6 560.0L46.7 557.0L44.9 555.5L44.7 554.0L46.0 553.1L44.0 549.5L38.1 544.4L33.4 543.8L33.1 537.8L38.1 531.5L41.3 530.9L42.9 528.4L40.5 528.2L38.9 523.2L41.2 518.8L45.2 514.9L43.5 513.0L42.2 507.0L40.0 502.9L46.6 504.0L49.5 499.7L48.5 496.4L51.7 493.7L53.2 485.9L52.4 482.4L59.3 479.3L63.1 475.6L59.7 472.5L59.5 468.6L52.8 466.3L52.0 467.7L49.2 468.0L45.6 465.8L40.1 465.9L40.1 464.1L41.6 462.5L40.9 460.4L35.6 460.8L31.8 462.9L34.4 453.6L36.6 450.1L32.8 451.2L33.8 448.0L32.0 446.9L31.6 443.5L33.6 440.9L37.5 439.5L44.6 440.2L45.7 437.2L50.2 435.3L55.4 437.0L57.3 439.7L59.9 441.0L74.3 442.6L76.2 444.5ZM153.1 537.7L155.2 539.9L154.0 540.2L153.4 539.0L152.1 539.8ZM153.3 535.2L152.7 536.4L150.8 535.8L150.2 534.1L151.7 534.1L152.6 532.5L155.6 532.5L155.8 533.5Z","FR":"M247.9 483.8L251.9 479.6L256.7 478.2L258.2 474.1L259.7 486.4L257.7 495.7L255.4 500.2L250.6 497.7L251.0 495.6L248.8 490.9ZM187.0 334.4L187.7 339.0L189.8 341.1L193.1 340.7L194.2 344.7L197.4 345.5L198.2 348.3L201.6 348.1L203.1 350.2L202.3 354.5L205.4 355.4L207.9 354.7L209.6 352.2L210.0 357.9L215.4 361.5L216.1 363.6L219.9 363.0L225.8 364.7L227.8 365.5L230.2 370.0L231.8 369.1L235.2 370.9L237.8 370.3L239.5 372.1L246.0 373.7L241.3 379.6L238.3 387.6L237.4 395.2L238.1 396.5L235.7 399.1L233.9 399.1L232.9 397.8L230.7 398.9L231.6 400.6L224.9 407.0L224.2 410.0L220.9 413.1L219.9 415.4L220.5 417.1L218.4 420.1L221.7 419.1L221.6 417.2L225.0 415.1L228.7 415.6L228.4 420.1L230.9 424.2L228.0 426.4L232.0 432.8L231.1 435.7L225.5 437.5L227.1 441.1L229.8 442.3L230.4 444.3L228.0 447.4L228.0 450.1L229.8 452.3L233.9 454.3L236.5 454.1L237.8 455.5L235.4 458.2L235.4 460.0L225.4 466.3L224.2 469.7L214.2 471.1L212.4 469.0L209.1 468.3L208.1 466.2L205.2 466.0L203.1 464.4L200.3 465.2L198.7 463.8L195.1 463.2L193.6 461.5L191.8 461.8L182.7 466.3L180.3 469.7L179.5 476.5L180.8 479.1L177.2 478.4L173.0 479.9L169.2 478.1L166.6 478.9L163.1 476.4L163.9 475.1L160.9 473.6L159.7 474.2L158.5 472.2L151.3 468.9L150.3 471.5L142.1 470.3L138.7 467.4L135.5 467.5L133.8 465.5L127.1 461.8L125.5 462.1L126.6 458.7L122.5 457.4L122.0 456.4L125.6 454.0L131.9 436.7L133.2 435.6L132.1 433.6L134.8 422.4L135.9 421.9L138.6 426.1L139.4 425.7L138.3 422.8L134.7 418.7L133.6 414.4L134.1 413.7L135.7 415.7L136.7 413.2L136.0 410.7L137.6 408.6L135.7 409.1L129.8 404.5L126.7 398.1L129.0 395.3L127.2 393.2L127.3 391.2L124.1 389.9L124.3 386.3L121.0 386.0L115.2 381.7L114.0 379.4L105.3 377.3L103.3 373.7L106.1 372.3L104.9 370.3L105.6 369.1L102.4 366.7L103.6 364.7L107.8 363.7L115.0 365.1L116.8 362.9L121.0 362.7L125.1 368.8L129.3 367.6L131.9 369.2L133.8 368.1L137.7 369.6L138.6 368.8L138.6 360.9L137.2 351.8L143.3 352.8L144.3 358.8L146.3 358.0L154.4 360.9L162.2 358.7L163.3 359.7L157.8 357.4L159.0 355.0L172.8 350.1L175.5 348.0L175.2 346.0L176.2 345.7L176.7 337.5ZM126.1 395.8L125.1 394.4L126.2 394.5ZM116.8 387.5L117.0 388.7L115.9 388.5L115.8 386.9Z","PT":"M41.5 466.2L45.6 465.8L49.2 468.0L52.0 467.7L52.8 466.3L59.5 468.6L59.7 472.5L63.1 475.6L59.3 479.3L52.4 482.4L53.2 485.9L51.7 493.7L48.5 496.4L49.5 499.7L46.6 504.0L40.0 502.9L42.2 507.0L43.5 513.0L45.2 514.9L41.2 518.8L38.9 523.2L40.5 528.2L42.9 528.4L41.3 530.9L38.1 531.5L33.1 537.8L33.4 543.8L26.3 545.6L22.9 543.0L17.8 541.1L12.5 541.5L16.2 535.1L17.2 526.2L20.8 517.9L14.8 517.7L14.7 514.2L12.1 511.7L16.2 502.4L19.5 500.2L29.5 482.7L30.9 478.3L31.8 462.9L35.6 460.8L40.9 460.4L41.6 462.5L40.1 464.1L40.1 465.9Z","IT":"M294.0 411.7L308.3 413.7L308.0 415.2L304.8 417.4L307.8 419.7L306.2 421.7L307.7 423.1L307.5 425.7L311.2 428.4L309.2 429.2L309.1 427.6L307.3 426.1L305.3 427.2L302.2 426.7L301.8 428.7L296.9 431.1L294.9 430.8L290.6 434.9L294.7 440.6L294.0 443.2L292.6 442.8L294.1 452.7L298.7 456.8L308.8 462.6L316.8 480.0L324.9 487.1L329.7 489.2L342.1 488.6L342.8 490.8L339.7 494.2L341.4 496.7L367.2 507.2L374.6 514.9L373.6 520.6L369.5 519.2L367.7 515.4L365.0 513.5L361.4 513.6L356.4 510.7L353.4 512.9L349.5 523.2L350.1 525.2L358.3 529.3L359.0 536.7L355.7 537.2L351.8 540.4L352.3 545.1L347.8 550.4L346.2 554.4L341.9 555.0L340.5 553.6L340.3 550.4L342.3 548.6L343.5 545.2L342.6 542.8L347.0 539.9L339.7 521.9L338.2 520.0L334.4 521.0L329.0 517.6L329.4 514.7L326.5 510.6L322.5 511.5L321.5 509.4L316.7 507.2L313.0 501.9L307.1 501.1L304.2 502.1L298.4 498.5L289.9 489.6L288.4 489.2L285.9 485.3L283.5 483.8L279.7 483.4L279.6 481.3L275.2 477.1L274.1 474.5L271.8 474.2L271.6 469.2L267.2 457.3L255.0 450.8L250.6 449.8L244.6 454.5L242.9 457.6L235.4 460.0L235.4 458.2L237.8 455.5L236.5 454.1L233.9 454.3L229.8 452.3L228.0 450.1L228.0 447.4L230.4 444.3L229.8 442.3L227.1 441.1L225.5 437.5L231.1 435.7L232.0 432.8L228.0 426.4L230.9 424.2L232.2 425.2L237.2 423.6L240.5 424.6L243.8 420.7L243.5 418.8L246.7 415.8L247.6 419.1L251.8 422.3L252.7 426.3L254.2 425.6L254.1 423.1L256.7 419.6L257.5 415.2L258.9 415.5L260.4 418.4L264.4 417.4L266.5 419.5L267.3 419.0L266.0 415.7L266.7 413.8L267.9 413.1L270.7 414.7L270.8 409.2L276.9 410.6L278.8 407.3L285.7 406.9L291.1 405.3L290.2 407.9ZM295.0 491.7L297.0 491.7L296.6 490.4ZM335.2 485.1L334.2 486.2L333.6 484.8ZM333.7 565.0L335.6 566.5L336.8 570.0L334.7 573.3L334.7 576.2L326.7 574.8L324.0 571.5L315.0 568.9L304.2 562.9L301.2 563.0L298.0 559.6L298.8 555.9L302.0 553.5L305.0 555.2L306.5 553.0L309.2 552.2L315.0 555.8L323.6 554.7L328.6 552.1L333.1 552.2L339.1 549.3L338.9 551.6L335.5 557.5ZM330.0 544.5L330.8 547.2L328.5 545.4ZM316.1 509.7L315.6 510.8L314.3 510.5L314.4 509.4ZM305.3 590.6L305.6 592.0L304.3 592.0L303.7 591.1ZM293.2 577.0L291.4 575.9L293.2 576.2ZM277.5 484.1L276.4 485.2L275.9 484.2L276.4 483.5ZM270.9 476.1L270.7 478.2L267.0 478.0L266.6 477.2ZM264.0 472.8L263.2 473.9L262.6 472.9L263.3 471.6ZM263.0 515.3L260.6 519.7L261.8 522.4L259.5 537.8L253.5 536.6L252.6 539.8L250.7 541.8L247.5 541.4L246.0 539.1L244.5 540.1L244.5 532.5L246.5 525.6L244.9 524.3L245.8 519.1L244.9 516.5L243.8 513.8L241.9 513.3L242.7 508.9L246.5 509.5L250.2 507.9L255.3 502.8L259.3 504.5ZM244.5 505.9L243.2 504.8L244.1 504.2ZM243.6 536.6L243.0 538.7L242.2 537.6ZM243.4 507.2L242.9 508.6L241.8 507.7L242.5 506.6Z","SI":"M337.5 412.3L338.3 414.1L336.4 414.0L330.9 418.0L332.0 421.4L331.5 423.7L327.3 425.9L328.5 429.8L327.0 430.9L324.0 429.7L322.4 430.5L319.0 427.3L317.0 430.4L308.4 431.6L307.9 430.6L311.2 428.4L307.5 425.7L307.7 423.1L306.2 421.7L307.8 419.7L304.8 417.4L308.0 415.2L308.3 413.7L316.7 414.6L318.3 415.7L323.7 410.6L334.6 409.5L334.2 406.8L335.5 406.1L337.8 406.2L341.6 412.2L338.9 411.4Z","AT":"M342.3 376.2L341.6 379.3L345.7 386.1L344.7 391.1L339.8 391.1L337.9 392.6L340.7 393.4L340.7 396.0L338.5 397.8L339.0 403.4L334.2 406.8L334.6 409.5L323.7 410.6L318.3 415.7L316.7 414.6L294.0 411.7L290.2 407.9L291.1 405.3L285.7 406.9L278.8 407.3L276.9 410.6L270.8 409.2L269.9 407.1L267.1 409.3L260.9 405.8L260.1 402.3L261.6 400.1L260.4 397.8L265.1 397.7L267.7 400.7L267.5 402.3L270.3 400.2L270.6 397.5L275.5 397.8L277.0 400.1L281.5 399.3L283.9 396.7L290.0 396.1L290.3 394.7L293.7 395.8L295.9 394.9L298.6 397.8L299.9 397.4L300.2 395.0L298.5 393.9L299.0 391.7L296.2 387.6L303.2 383.0L304.4 379.3L306.8 380.5L307.8 376.1L311.0 378.9L317.4 378.7L320.0 375.1L320.7 371.5L335.0 374.9L337.8 373.4L341.5 374.7Z","LU":"M227.3 358.8L225.8 364.7L219.9 363.0L220.9 361.0L219.4 357.8L222.7 352.5L223.9 353.4L224.2 356.2Z","CZ":"M316.4 340.4L318.1 340.2L318.8 337.9L320.8 338.2L322.4 341.2L333.4 343.6L332.2 346.2L336.1 351.1L337.6 351.4L340.3 348.6L339.1 345.7L345.0 348.4L348.1 347.5L347.5 350.0L349.8 352.4L351.8 350.8L355.1 352.8L357.9 352.8L358.6 355.4L360.8 356.7L361.6 359.0L358.6 359.6L354.7 364.0L353.9 367.7L349.7 371.5L344.5 372.0L342.3 376.2L341.5 374.7L337.8 373.4L335.0 374.9L320.7 371.5L320.0 375.1L317.4 378.7L311.0 378.9L294.1 364.9L291.5 360.3L293.0 357.8L289.8 355.3L287.9 351.0L290.4 352.8L293.1 349.4L295.5 348.6L296.9 349.3L304.2 343.5L311.6 340.2L310.9 337.7L313.8 338.7L314.3 340.8L315.9 341.3Z","MT":"M328.0 590.4L325.5 590.6L324.7 588.6ZM324.5 587.2L323.8 588.1L322.4 587.1Z","CY":"M569.5 560.9L571.4 560.8L573.9 557.3L577.2 556.7L576.6 552.9L586.3 550.6L596.5 541.6L590.1 551.2L593.0 554.4L590.9 556.4L588.6 556.5L588.1 559.5L582.6 563.0L581.0 564.6L581.2 565.8L580.4 566.2L579.1 564.9L574.0 565.8Z","EL":"M508.0 562.1L506.2 563.2L505.2 559.6L506.7 556.1L511.0 553.8L510.0 559.6ZM506.0 551.8L504.8 552.6L503.9 551.2ZM499.9 555.7L498.3 556.4L499.3 555.0ZM495.7 550.6L494.9 551.6L493.6 551.4L496.8 548.4L498.0 549.1ZM497.2 554.1L495.6 554.7L495.5 553.7ZM500.3 572.4L498.9 573.0L498.1 570.5L499.5 566.7ZM493.4 548.5L492.2 549.3L491.6 548.6L492.5 547.5ZM492.0 540.5L491.0 541.2L489.7 540.3L491.0 539.6ZM493.8 552.6L493.4 553.4L492.4 551.8L493.1 551.4ZM497.7 573.9L495.7 575.2L496.6 573.6ZM490.2 536.3L488.5 537.8L485.2 537.1L487.2 535.4ZM489.1 544.6L487.9 545.2L488.1 543.4L489.4 543.5ZM471.5 485.1L468.3 489.8L467.0 488.3L456.4 487.8L452.8 490.8L448.5 490.1L444.5 494.5L439.9 495.0L439.6 496.3L442.0 499.7L444.1 500.4L444.2 501.7L442.2 501.0L440.6 502.9L444.5 505.2L444.5 507.7L439.9 504.1L435.3 504.7L431.5 503.4L429.7 501.8L429.7 499.2L427.0 501.1L426.4 507.8L432.3 515.9L438.7 521.6L437.4 522.8L435.5 520.5L432.8 520.9L432.3 522.5L435.1 525.5L434.4 526.8L429.9 528.9L439.6 530.8L440.4 533.0L442.6 531.7L436.8 527.4L437.5 525.3L439.1 525.1L443.1 527.6L449.9 529.0L453.3 534.5L457.1 537.5L456.3 538.6L454.2 538.5L449.3 533.7L445.1 534.7L450.5 536.4L452.0 544.2L451.1 545.1L446.4 541.4L443.7 542.2L445.2 540.4L438.7 543.7L441.1 548.2L442.7 548.5L443.6 547.1L445.0 549.8L444.5 550.7L440.8 552.7L439.9 550.9L435.3 549.6L439.6 557.7L441.9 565.5L436.4 563.0L433.7 567.8L428.3 560.9L426.4 561.6L425.2 564.2L423.1 563.3L421.2 559.7L421.6 555.0L413.1 547.4L415.9 542.1L419.0 542.4L421.8 539.0L435.9 543.1L436.9 542.5L436.4 541.1L438.9 540.7L439.9 539.4L431.4 537.0L431.1 537.9L429.1 536.2L426.0 538.2L423.3 537.6L412.7 540.4L406.2 532.4L407.5 531.0L410.3 531.4L410.4 528.7L405.5 530.3L401.7 526.1L399.4 525.8L396.9 521.0L394.9 520.1L397.7 520.2L398.4 517.5L399.5 517.8L398.7 514.7L401.8 512.6L406.2 502.9L404.8 499.1L414.7 496.3L416.1 493.3L419.5 491.5L421.1 492.1L425.9 490.6L426.2 488.1L427.3 487.3L436.5 485.1L441.3 482.9L441.5 481.7L447.0 480.2L450.9 482.6L452.3 482.0L456.6 483.1L464.9 480.7L467.7 478.0L465.9 473.6L469.2 472.8L472.2 474.0L473.5 477.6L470.5 480.6ZM477.8 512.6L480.9 515.8L480.1 517.1L475.5 517.2L475.1 515.2L473.6 516.4L471.1 515.5L471.3 513.9L474.7 511.5L476.6 510.9ZM487.3 556.1L486.2 557.9L484.2 556.8L486.0 556.5L486.3 555.0ZM479.4 541.5L477.6 542.5L478.5 540.4L482.2 539.1ZM461.9 582.2L470.0 579.7L477.9 580.0L480.6 579.1L482.4 582.0L488.0 578.8L488.8 579.8L487.2 582.9L469.4 587.7L468.1 585.4L452.6 585.9L451.3 584.4L451.5 581.2L453.1 581.0L453.4 578.6L455.0 580.3L459.2 578.9ZM474.7 524.6L477.0 524.9L477.7 529.0L476.3 532.0L474.1 530.9L475.4 528.9L472.7 526.0ZM480.9 551.9L477.9 555.3L477.1 554.9L480.3 551.2ZM479.4 561.3L478.9 562.4L477.5 562.0L478.2 560.7ZM465.2 495.7L463.5 496.5L461.8 495.5L464.5 494.6ZM470.1 525.7L470.1 527.1L469.0 526.9L469.4 525.3ZM473.8 552.7L472.7 553.6L471.0 551.5L472.8 548.8L474.0 550.0ZM474.9 562.7L473.7 563.0L474.0 561.2ZM471.0 544.9L469.2 545.6L469.1 544.6ZM459.8 504.1L462.7 503.5L462.6 506.7L460.9 505.6L460.4 507.3L458.6 505.8ZM472.7 557.1L472.3 558.4L470.7 556.2ZM469.0 546.7L468.1 547.7L468.5 545.2ZM469.8 551.9L468.8 553.4L467.0 553.3L468.3 551.0ZM467.9 544.1L464.5 542.7L467.7 542.7ZM469.8 558.3L469.1 559.4L468.2 558.9L469.5 557.5ZM460.1 511.8L459.1 513.6L459.0 511.2ZM464.1 541.3L463.6 541.9L460.2 539.6L460.1 538.3L463.1 539.1ZM467.3 560.5L466.3 561.0L465.7 560.0L466.5 558.8ZM464.7 547.3L463.8 547.8L463.5 545.4ZM463.7 555.0L462.9 555.8L461.8 554.7L462.3 553.7ZM452.9 494.7L451.2 496.2L449.7 494.4L450.0 493.0L451.0 492.2ZM457.3 525.0L456.6 526.0L453.6 524.2L454.1 522.4ZM462.6 558.0L460.5 558.1L461.0 557.0ZM460.1 552.4L458.5 552.6L458.8 551.4ZM461.2 559.5L458.4 560.8L459.3 558.8ZM458.0 549.5L457.3 549.8L457.3 547.4ZM456.9 544.2L455.7 546.8L455.3 544.5ZM461.1 590.6L460.6 591.8L458.9 590.9ZM448.5 517.0L448.4 518.2L447.0 518.3L447.8 516.4ZM448.0 521.5L447.5 522.2L446.4 521.4L446.4 518.8ZM452.1 548.7L450.8 549.2L450.0 548.2L451.3 547.7ZM453.6 559.1L452.4 559.8L451.4 558.9L452.5 558.1ZM444.6 521.6L444.1 522.7L442.6 521.6ZM441.0 508.1L441.1 509.0L437.0 509.0L436.0 505.7ZM445.2 545.9L444.6 546.3L443.5 544.9L445.2 544.5ZM446.8 558.3L447.5 559.9L445.6 558.4ZM445.9 550.9L446.3 552.5L444.5 552.1ZM441.2 521.1L440.9 522.8L439.9 522.3L439.9 521.1ZM442.0 553.4L440.9 554.7L440.7 553.2ZM435.9 522.4L436.5 524.0L435.2 524.1ZM442.6 571.1L442.7 572.5L441.3 572.3L440.2 569.8L440.9 568.7ZM435.5 527.7L434.9 528.7L433.5 528.2L434.2 527.1ZM409.3 536.4L408.7 537.8L408.4 535.6ZM408.3 548.9L410.4 550.6L409.6 552.0L406.7 549.8L407.4 548.1ZM405.6 541.5L408.4 545.5L402.1 544.3L402.7 541.9L404.4 541.4L404.2 539.3ZM407.6 541.5L406.6 541.7L405.3 539.3L406.5 539.4ZM406.6 536.2L404.1 536.7L404.9 533.1L405.7 532.8ZM394.4 523.3L395.0 524.6L390.0 519.6L390.7 518.8L393.6 518.6L393.0 520.3Z","BG":"M429.8 445.4L435.8 445.8L440.0 444.1L453.0 443.3L458.7 436.5L467.9 431.5L471.7 430.8L473.5 432.2L479.8 431.2L481.4 433.4L488.5 433.4L489.4 437.1L488.8 439.2L485.2 439.9L484.0 441.8L483.0 444.3L483.8 452.0L480.5 456.9L483.0 457.8L488.6 463.6L482.9 465.6L479.0 464.1L476.4 464.7L475.3 466.5L470.9 468.7L470.9 470.3L468.9 471.4L469.2 472.8L465.9 473.6L467.7 478.0L464.9 480.7L456.6 483.1L452.3 482.0L450.9 482.6L447.0 480.2L441.5 481.7L441.3 482.9L436.5 485.1L427.9 487.3L427.8 480.5L425.4 476.1L420.7 474.7L418.4 472.5L420.2 470.0L418.1 463.8L421.7 462.1L424.0 456.6L417.3 452.3L414.8 448.1L414.8 444.7L416.9 442.7L417.3 440.4L421.9 442.6L420.3 445.6L422.2 446.5L427.0 444.9Z","HR":"M345.0 414.5L350.4 419.6L357.9 422.1L364.1 422.0L366.4 419.3L369.0 418.6L370.1 424.3L371.8 425.0L371.3 427.4L376.7 430.4L373.1 431.4L373.6 434.4L372.6 436.1L370.7 436.4L369.1 433.8L366.3 433.0L360.2 432.9L358.2 434.4L347.4 432.3L342.9 433.1L340.2 437.0L336.6 434.1L334.4 433.8L333.6 438.7L334.4 441.4L336.3 442.3L338.8 445.6L339.7 450.3L350.8 460.0L354.2 461.6L354.4 463.6L359.4 468.4L358.3 471.2L356.2 470.6L356.9 469.3L355.6 467.8L350.5 464.8L345.7 465.1L346.7 463.2L344.7 462.0L338.7 462.3L336.2 458.8L330.6 455.8L327.9 452.2L328.2 450.5L329.7 449.6L324.6 445.6L323.3 437.8L321.8 436.7L321.7 438.5L319.3 437.9L318.7 434.6L317.3 433.5L312.4 442.6L308.0 436.3L306.9 431.5L317.0 430.4L319.0 427.3L322.4 430.5L324.0 429.7L327.0 430.9L328.5 429.8L327.3 425.9L331.5 423.7L332.0 421.4L330.9 418.0L336.4 414.0L338.3 414.1L337.5 412.3L338.9 411.4ZM369.7 475.1L371.1 477.2L359.2 470.8L361.8 470.4ZM354.2 469.4L353.4 470.8L347.6 471.4L347.3 470.7L350.8 470.1L352.0 468.9ZM351.0 467.0L351.2 467.7L348.5 467.4ZM346.9 466.3L347.4 467.9L344.0 467.2ZM345.0 481.0L343.0 480.6L344.6 479.8ZM342.0 470.1L339.7 469.7L342.0 469.2ZM329.9 456.4L330.2 458.5L328.8 457.6ZM329.1 456.4L328.4 457.1L327.1 456.0L326.0 454.4L326.6 453.4ZM327.5 448.1L327.7 449.5L325.9 446.9ZM324.9 451.6L325.2 453.6L323.8 452.5ZM322.6 442.1L321.8 442.6L321.1 441.4L322.5 440.7ZM321.1 449.0L320.0 449.2L320.2 447.3ZM318.4 445.1L318.8 446.4L317.2 446.2L316.8 440.2L317.6 438.9L319.2 444.9ZM317.3 436.2L317.1 437.9L316.0 436.8L316.6 435.7Z","RO":"M460.2 373.9L470.1 382.1L473.3 387.5L473.9 396.1L475.9 404.5L477.5 406.3L480.4 408.3L484.5 408.3L491.5 403.4L493.9 404.1L495.2 406.1L495.9 412.1L491.2 414.7L489.5 416.8L487.0 423.9L488.5 433.4L481.4 433.4L479.8 431.2L473.5 432.2L471.7 430.8L467.9 431.5L458.7 436.5L453.0 443.3L440.0 444.1L435.8 445.8L427.0 444.9L422.2 446.5L420.3 445.6L421.9 442.6L417.3 440.4L414.3 436.9L417.1 435.0L416.6 434.1L413.0 433.0L410.3 437.0L408.4 435.3L404.0 434.9L400.2 432.9L402.3 431.5L400.3 429.9L400.7 426.6L395.0 425.2L392.3 422.8L391.6 418.5L389.8 418.0L384.4 413.2L389.4 411.9L390.0 409.9L393.0 409.8L394.3 408.6L402.0 385.6L405.2 381.8L407.5 381.3L412.4 375.1L416.1 376.8L416.8 376.0L424.2 376.4L427.9 374.7L432.8 377.6L434.3 377.0L436.0 373.9L444.6 370.8L446.6 366.8L451.4 364.7L454.1 366.2Z","HU":"M399.8 372.7L404.5 374.4L406.0 376.3L408.4 376.0L409.5 378.3L407.5 381.3L405.2 381.8L402.0 385.6L396.7 402.5L395.4 403.6L395.6 406.4L393.0 409.8L390.0 409.9L389.4 411.9L384.4 413.2L377.8 413.0L373.6 416.9L371.4 416.8L370.6 418.2L366.4 419.3L364.1 422.0L357.9 422.1L350.4 419.6L348.5 416.9L341.6 412.2L337.8 406.2L335.5 406.1L339.0 403.4L338.5 397.8L340.7 396.0L340.7 393.4L337.9 392.6L339.8 391.1L344.7 391.1L345.7 386.1L352.2 389.6L359.0 389.2L364.9 387.2L363.9 384.9L365.3 383.1L371.0 381.7L372.6 379.2L376.1 380.2L377.5 379.7L380.0 377.3L382.1 372.8L384.6 371.8L388.6 372.4L391.7 370.7L395.8 373.8Z","SK":"M373.4 362.7L375.5 362.5L376.2 360.3L378.7 358.6L380.8 358.1L384.6 359.3L386.3 357.2L389.2 356.5L394.5 356.6L397.0 358.9L402.7 360.2L399.8 372.7L395.8 373.8L391.7 370.7L388.6 372.4L384.6 371.8L382.1 372.8L380.0 377.3L377.5 379.7L376.1 380.2L372.6 379.2L371.0 381.7L365.3 383.1L363.9 384.9L364.9 387.2L359.0 389.2L352.2 389.6L345.7 386.1L343.4 383.5L341.6 379.3L344.5 372.0L349.7 371.5L353.9 367.7L354.7 364.0L358.6 359.6L361.6 359.0L363.4 360.5L365.1 360.2L368.0 356.5L370.5 359.6L371.9 359.8L372.3 362.6Z","PL":"M359.1 275.8L355.8 278.3L355.9 279.3L357.4 279.1L360.8 275.8L378.0 275.3L391.3 271.9L397.3 275.3L399.5 282.2L403.8 289.8L405.8 298.1L401.9 301.5L399.8 306.3L405.4 309.2L405.3 314.8L408.3 321.8L413.6 328.0L412.6 329.1L414.3 331.5L414.4 334.6L411.3 336.6L402.7 351.9L405.7 360.0L397.0 358.9L394.5 356.6L389.2 356.5L386.3 357.2L384.6 359.3L380.8 358.1L378.7 358.6L376.2 360.3L375.5 362.5L372.3 362.6L371.9 359.8L370.5 359.6L368.0 356.5L365.1 360.2L363.4 360.5L360.8 356.7L358.6 355.4L357.9 352.8L355.1 352.8L351.8 350.8L349.8 352.4L347.5 350.0L348.1 347.5L345.0 348.4L339.1 345.7L340.3 348.6L337.6 351.4L336.1 351.1L332.2 346.2L333.4 343.6L322.4 341.2L320.8 338.2L318.8 337.9L318.1 340.2L316.4 340.4L318.1 333.5L316.9 330.4L315.2 329.7L313.2 324.6L314.4 320.4L311.8 315.2L312.7 313.0L307.5 308.0L307.3 305.9L309.2 304.1L309.9 300.8L307.8 293.5L310.2 293.5L310.8 291.3L307.1 291.2L307.2 289.7L311.2 288.3L312.2 289.2L313.2 287.4L325.2 282.5L328.5 278.2L339.5 272.7L345.8 271.3L349.3 277.7L352.7 278.4L356.5 277.7Z","LT":"M402.5 234.9L405.4 238.3L410.5 238.3L418.7 243.5L421.2 243.5L421.5 248.7L424.0 250.2L423.6 251.9L420.4 253.1L419.7 255.6L417.3 257.3L416.4 259.7L417.1 263.3L416.4 267.4L418.9 270.0L417.0 270.7L415.8 268.6L412.4 271.9L410.0 272.4L410.1 275.0L406.8 277.2L404.5 276.7L398.0 278.0L397.3 275.3L395.2 273.5L391.3 271.9L389.8 272.6L388.2 269.4L389.1 265.0L385.7 261.3L381.0 262.6L373.7 259.8L372.8 260.5L368.6 247.2L372.3 242.6L377.3 239.6L382.2 239.8L384.7 238.8L386.3 239.9L392.4 238.0L396.4 239.1L399.8 237.9Z","LV":"M420.2 211.9L421.7 211.5L422.3 213.0L425.7 214.9L425.8 222.0L427.6 221.6L433.2 230.1L429.5 239.5L424.9 239.8L422.9 242.9L418.7 243.5L410.5 238.3L405.4 238.3L402.5 234.9L399.8 237.9L396.4 239.1L392.4 238.0L386.3 239.9L384.7 238.8L382.2 239.8L377.3 239.6L372.3 242.6L368.6 247.2L367.1 242.8L366.7 234.9L369.0 231.1L368.8 226.1L370.6 221.4L377.6 217.4L378.7 219.8L383.9 223.3L385.9 227.0L389.0 228.2L392.0 227.1L394.9 223.2L392.7 212.0L398.1 208.1L400.8 207.4L407.4 209.4L410.6 212.8L413.0 213.6L416.0 211.2Z","EE":"M408.9 181.5L416.2 180.4L417.6 178.7L419.2 179.6L417.1 187.7L414.9 191.3L418.9 200.7L422.0 205.2L420.7 206.9L420.2 211.9L416.0 211.2L413.0 213.6L410.6 212.8L407.4 209.4L400.8 207.4L398.1 208.1L392.7 212.0L392.4 204.3L391.0 204.2L388.6 206.0L386.3 205.2L383.2 201.4L383.2 198.7L381.7 199.3L381.1 192.1L385.4 189.2L385.0 187.9L386.4 188.0L387.7 185.7L390.7 185.4L390.8 183.6L393.4 184.3L395.9 183.4L397.9 180.6L399.0 181.7L399.4 180.7ZM381.6 201.5L382.1 203.1L380.1 203.5L381.2 204.7L377.1 209.1L373.8 210.2L373.3 213.9L372.2 215.0L372.9 211.4L369.9 209.5L369.6 205.9L371.1 206.4L374.6 202.8L378.3 202.4L380.5 200.9ZM378.4 194.7L380.4 195.5L378.8 196.1ZM373.8 195.0L378.3 198.3L374.5 201.6L371.9 198.3Z","FI":"M378.7 22.9L377.5 25.3L378.6 26.7L378.6 31.9L380.5 35.6L385.9 38.0L391.9 43.4L390.1 56.2L399.7 67.9L403.1 73.9L401.0 75.8L402.0 77.0L402.3 81.9L403.9 83.3L404.2 87.9L407.5 89.9L409.5 94.5L413.7 97.9L413.9 102.8L412.1 105.5L417.0 108.8L423.5 111.3L427.8 115.6L427.5 123.4L418.5 147.7L411.0 161.8L408.1 164.1L405.5 163.6L402.0 166.2L400.4 165.5L400.4 167.5L397.9 167.6L398.3 169.2L397.3 170.5L391.5 171.7L386.2 177.0L382.9 177.5L381.5 179.4L377.3 180.4L376.0 181.8L373.3 180.6L374.0 177.7L373.1 179.0L369.5 180.1L368.6 176.5L367.0 177.5L365.7 173.8L364.0 176.1L362.1 172.1L358.4 173.2L358.5 170.0L357.1 167.3L358.0 164.4L357.4 154.3L354.8 149.5L353.9 143.6L350.6 137.3L350.6 133.1L352.0 133.8L352.9 128.5L356.0 125.4L358.3 125.9L357.4 123.1L359.2 119.5L359.2 116.6L363.8 114.4L363.8 112.1L365.3 112.0L369.5 98.1L373.7 95.8L371.7 86.6L369.9 84.7L363.0 83.1L357.7 75.4L357.7 66.0L353.9 60.8L354.1 56.8L351.9 56.2L351.3 48.0L347.9 45.6L346.7 43.3L340.1 41.4L329.1 33.5L330.1 32.6L332.0 33.1L331.6 30.2L332.8 28.8L334.8 28.9L341.3 37.1L346.4 37.6L348.9 36.0L350.1 33.7L356.7 36.5L357.9 35.2L357.9 31.9L360.1 29.9L358.6 17.0L360.5 12.4L363.9 11.9L368.0 8.0L371.6 11.3L376.5 12.4L378.7 15.3L377.4 19.8ZM370.7 94.9L370.3 95.7L368.5 94.3L370.2 93.2ZM365.8 176.8L366.4 178.2L365.3 179.3L364.6 177.0ZM364.2 178.4L363.0 179.1L363.0 177.9L364.0 177.5ZM362.8 177.2L361.5 177.7L361.9 174.1ZM362.8 179.6L361.8 179.9L361.9 178.4ZM351.9 128.9L350.9 129.6L349.4 128.0L349.9 126.0L351.2 126.3ZM358.2 175.2L359.1 177.6L357.9 176.9ZM354.2 182.0L353.6 183.3L352.3 182.7L352.8 180.7ZM350.5 178.5L350.2 180.3L349.1 180.1L350.4 181.8L351.0 180.4L350.6 183.0L345.0 180.5L345.8 177.7L347.2 179.5L347.1 176.8Z","BE":"M214.2 331.1L215.5 333.9L218.2 333.7L221.2 336.0L219.6 342.7L223.2 342.9L225.1 345.0L224.8 346.9L226.1 347.4L226.9 350.3L223.9 353.4L222.7 352.5L221.3 353.7L219.4 357.8L220.9 361.0L219.9 363.0L216.1 363.6L215.4 361.5L210.0 357.9L210.1 352.6L205.4 355.4L202.3 354.5L203.1 350.2L201.6 348.1L198.2 348.3L197.4 345.5L194.2 344.7L193.1 340.7L189.8 341.1L187.7 339.0L187.0 334.4L196.0 330.6L196.1 332.2L201.0 333.7L205.2 331.3L206.7 331.6L207.9 329.9L209.7 330.8L210.8 329.6L211.8 330.8Z","DE":"M259.8 275.8L264.7 276.7L265.8 279.1L265.2 281.3L267.1 282.5L267.1 283.9L268.8 282.6L272.4 284.6L274.6 283.4L275.9 284.4L275.9 286.4L273.1 288.6L274.4 290.4L276.8 289.5L278.5 290.5L281.7 287.4L289.5 284.0L290.2 281.9L292.5 283.1L294.4 282.0L296.5 282.6L297.7 278.1L299.1 280.7L300.8 279.5L300.2 281.2L301.2 282.9L298.6 284.2L298.0 285.8L299.6 287.0L302.9 286.1L304.5 288.8L307.2 289.7L307.1 290.8L304.1 291.3L307.8 293.5L309.9 300.8L309.2 304.1L307.3 305.9L307.5 308.0L312.7 313.0L311.8 315.2L314.4 320.4L313.2 324.6L315.2 329.7L316.9 330.4L318.0 335.8L315.9 341.3L314.3 340.8L312.8 337.8L310.9 337.7L311.6 340.2L304.2 343.5L296.9 349.3L295.5 348.6L293.1 349.4L290.4 352.8L287.9 351.0L289.8 355.3L293.0 357.8L291.5 360.3L294.1 364.9L307.8 376.1L306.8 380.5L304.4 379.3L303.2 383.0L296.2 387.6L299.0 391.7L298.5 393.9L300.2 395.0L299.9 397.4L298.6 397.8L295.9 394.9L293.7 395.8L290.3 394.7L290.0 396.1L283.9 396.7L281.5 399.3L277.0 400.1L275.5 397.8L270.6 397.5L270.3 400.2L267.5 402.3L267.7 400.7L265.1 397.7L260.4 397.8L258.2 396.3L250.3 395.2L249.8 393.3L247.6 395.5L249.7 395.5L247.6 397.2L239.5 397.4L237.4 395.2L238.3 387.6L241.3 379.6L246.0 373.7L239.5 372.1L237.8 370.3L235.2 370.9L231.8 369.1L230.2 370.0L227.8 365.5L225.8 364.7L227.3 358.8L224.2 356.2L223.9 353.4L226.9 350.3L226.1 347.4L224.8 346.9L225.1 345.0L223.2 342.9L224.1 340.3L222.0 338.2L225.2 335.8L224.2 334.8L225.9 332.8L225.7 330.2L223.4 326.3L225.8 323.9L228.2 325.2L232.1 323.5L232.1 320.5L235.3 318.6L234.9 315.2L231.7 314.3L231.9 311.9L234.9 311.9L237.1 306.2L238.0 300.5L235.4 299.8L238.3 294.3L245.5 294.4L247.4 299.4L248.4 298.7L248.4 296.3L251.0 297.6L250.9 293.1L252.5 291.4L253.6 292.4L258.2 291.9L255.8 291.7L253.9 289.2L255.1 288.5L254.1 285.2L252.6 284.2L254.5 282.3L254.3 280.2L252.3 274.4ZM277.9 282.7L276.4 282.8L275.4 281.2L277.2 281.2ZM252.8 280.3L252.6 281.7L251.3 281.2ZM251.6 278.3L249.8 277.6L251.8 277.2ZM250.9 289.6L250.1 291.1L249.4 290.7ZM249.7 278.7L249.2 279.4L248.6 278.4L249.5 277.2ZM249.7 275.0L248.7 275.0L249.4 273.1ZM245.2 286.0L245.0 287.5L243.9 285.9ZM234.9 294.4L234.6 296.0L233.7 294.4ZM233.1 295.1L233.4 296.7L232.1 296.4Z","NL":"M236.3 301.6L237.4 301.9L237.1 306.2L234.9 311.9L231.9 311.9L231.7 314.3L234.9 315.2L235.3 318.6L232.1 320.5L232.1 323.5L228.2 325.2L225.8 323.9L223.4 326.3L225.7 330.2L225.9 332.8L224.2 334.8L225.2 335.8L222.0 338.2L224.1 340.3L223.2 342.9L219.6 342.7L221.2 336.0L218.2 333.7L215.5 333.9L213.6 330.4L211.8 330.8L210.8 329.6L209.7 330.8L207.9 329.9L206.7 331.6L200.4 330.2L198.4 328.6L199.2 327.5L201.5 327.5L201.5 324.6L203.8 323.1L203.5 321.1L204.9 320.8L209.1 315.6L213.4 302.0L214.1 302.8L213.2 306.1L216.7 304.8L223.7 299.1L233.0 298.0ZM222.7 297.9L221.7 298.4L221.1 297.6L222.1 296.8ZM217.7 299.3L216.8 298.7L217.7 297.8L218.7 298.5ZM205.1 331.7L201.0 333.7L196.1 332.2L196.0 330.6Z","IE":"M95.3 258.5L90.6 260.2L92.4 264.4L97.2 267.3L98.9 265.9L99.1 264.2L100.9 263.4L103.6 268.0L103.6 270.3L106.9 270.1L107.3 271.7L105.5 272.4L106.5 279.5L104.9 282.9L104.9 289.4L98.6 298.9L98.6 301.3L92.9 299.4L92.0 300.4L88.0 299.8L85.3 301.5L73.1 305.0L66.3 305.1L63.9 303.5L63.8 301.2L60.2 300.7L60.6 298.7L58.3 296.4L61.6 293.5L59.6 291.8L60.0 290.7L63.7 290.9L66.0 287.9L70.7 287.5L68.2 285.4L73.6 279.4L76.6 279.2L77.0 278.2L76.8 277.2L70.3 275.6L69.5 272.6L67.5 271.7L68.5 269.2L70.2 269.0L70.9 266.9L73.3 266.2L70.3 263.1L72.3 263.1L71.9 258.3L78.6 259.3L80.0 262.3L81.9 260.9L84.9 261.5L89.7 258.3L89.9 257.2L85.9 254.7L89.2 252.8L92.1 248.7L98.1 248.5L98.9 251.4L101.3 247.8L104.0 249.6L96.8 256.4L94.7 256.8ZM89.8 250.5L88.9 251.1L88.8 249.3ZM62.6 304.5L61.3 303.9L62.8 303.4ZM70.1 261.8L69.4 263.4L68.9 262.3L69.3 261.3Z","DK":"M314.9 269.9L314.3 271.5L310.4 269.9L311.0 266.5ZM291.9 261.3L291.9 263.1L291.0 262.5L291.3 260.9ZM290.6 262.7L289.1 262.0L286.5 264.0L286.5 265.6L288.6 267.3L286.1 269.5L286.1 271.1L287.2 272.7L289.1 273.2L287.0 274.6L284.4 279.4L279.7 279.3L275.3 276.6L276.1 273.9L280.3 275.5L284.1 273.4L281.5 270.0L277.6 269.1L275.5 261.0L280.9 257.0L282.4 261.7L283.7 258.6L283.3 256.4L286.8 254.0L289.5 255.1ZM282.0 252.1L282.1 253.6L281.1 253.5ZM280.1 243.7L280.2 245.0L279.4 244.9L278.8 243.9ZM276.5 234.9L276.0 235.5L275.8 233.6ZM275.4 235.1L274.9 236.1L273.4 235.2L275.2 234.1ZM272.5 277.2L271.8 275.7L274.0 271.3ZM267.2 244.8L268.3 244.9L269.7 247.4L273.1 247.6L273.9 250.0L272.1 253.2L270.2 254.0L269.5 251.7L268.1 253.2L267.5 258.2L265.2 258.8L265.3 261.0L262.3 261.1L263.3 263.0L261.7 266.1L262.5 268.7L261.2 270.0L261.2 272.3L263.6 271.9L265.8 274.9L261.4 274.8L258.6 276.1L252.3 274.4L252.6 266.7L251.4 265.3L250.4 266.7L249.2 263.3L248.5 264.1L247.4 263.4L248.4 258.9L249.9 257.1L248.0 253.3L248.1 247.4L248.8 245.1L253.1 248.1L256.3 242.4L257.3 245.9L259.2 245.0L257.3 239.5L255.8 239.9L253.6 244.5L250.5 244.5L249.6 242.3L252.5 237.8L259.9 236.6L265.0 230.0L269.5 228.2L270.2 234.8ZM269.3 263.1L270.7 265.3L271.8 263.7L273.1 270.0L271.6 273.8L266.7 272.0L266.6 270.0L264.4 268.8L263.2 264.2ZM271.4 259.8L270.4 258.9L271.2 257.9ZM271.1 257.1L270.2 257.7L270.8 255.6ZM269.9 274.9L269.4 276.1L268.3 274.7ZM251.7 271.5L250.6 271.1L250.9 269.5L252.0 269.6ZM252.4 246.1L251.1 244.9L252.4 244.5Z","SE":"M362.7 82.4L356.1 85.1L353.5 84.0L353.4 85.5L350.8 84.7L350.4 90.6L349.0 90.8L348.9 94.3L347.4 93.7L345.2 102.8L348.6 109.1L343.9 120.9L340.2 123.1L338.3 126.5L336.8 125.7L336.6 127.1L335.2 126.8L333.6 131.3L331.6 130.7L327.8 142.1L323.8 146.9L324.8 149.1L323.8 155.3L325.1 158.3L323.3 158.2L322.4 160.7L326.1 175.3L328.8 176.8L331.1 175.4L334.5 179.3L335.3 177.3L337.0 179.8L336.6 182.6L338.5 181.4L342.5 188.8L340.2 190.4L340.5 195.6L341.5 193.8L341.9 195.2L339.0 201.0L336.7 200.8L333.7 205.0L331.0 203.4L330.7 206.6L328.3 207.6L328.5 209.1L324.4 209.5L326.0 211.1L327.3 215.8L324.7 220.1L326.0 221.0L326.1 227.9L324.4 233.7L325.1 235.0L324.0 242.2L321.5 250.1L319.6 253.0L317.8 251.1L315.4 252.3L309.9 252.5L309.3 254.7L308.0 253.9L305.3 257.9L306.4 262.5L305.4 264.9L297.3 266.4L294.2 265.6L293.2 263.4L293.9 260.6L289.2 252.1L291.3 251.7L290.6 248.8L292.3 248.2L292.2 245.4L287.2 240.4L284.4 232.4L282.9 233.0L282.8 229.9L282.1 229.0L281.3 229.9L281.0 227.2L279.6 227.2L280.2 225.0L276.3 216.1L275.2 206.5L276.5 204.7L278.3 207.8L279.6 207.4L281.1 201.9L280.1 196.3L281.6 194.3L281.0 191.8L284.0 190.5L286.2 187.3L286.9 180.7L284.0 172.5L287.2 171.3L288.4 166.1L282.6 160.3L283.5 151.2L281.4 145.4L282.2 138.9L280.7 134.3L281.7 129.0L285.3 122.6L289.0 120.5L294.9 121.2L295.8 118.4L295.2 114.5L292.2 111.7L297.2 99.8L297.4 91.3L296.3 86.1L299.8 85.5L302.7 83.1L301.9 79.8L307.4 69.9L305.1 63.3L307.1 61.2L308.3 55.7L311.4 51.8L315.5 53.4L316.5 50.3L315.8 44.2L317.6 43.4L327.4 45.3L328.4 38.0L327.2 34.5L329.1 33.5L340.1 41.4L346.7 43.3L347.9 45.6L351.3 48.0L351.9 56.2L354.1 56.8L353.9 60.8L357.7 66.0L357.7 75.4ZM354.4 89.8L352.7 89.4L352.9 87.8ZM347.1 218.5L344.2 223.8L344.4 226.4L345.7 227.5L340.6 236.6L338.5 226.6L342.9 219.6ZM337.6 203.4L336.3 203.1L337.2 202.0ZM326.0 249.0L325.3 250.0L324.5 245.0L329.4 230.6ZM293.1 266.2L292.0 265.6L292.9 264.5Z"};
const MAP_CENT = {"ES":[92.5,501.8],"FR":[178.7,409.5],"PT":[34.6,501.8],"IT":[293.6,465.0],"SI":[321.5,419.6],"AT":[312.1,395.6],"LU":[223.2,359.3],"CZ":[323.2,358.9],"MT":[326.1,589.9],"CY":[582.1,557.3],"EL":[428.7,519.4],"BG":[452.1,458.6],"HR":[341.3,435.0],"RO":[439.5,408.6],"HU":[372.4,397.2],"SK":[370.0,371.5],"PL":[362.2,315.1],"LT":[397.3,254.6],"LV":[401.4,227.6],"EE":[402.5,196.1],"FI":[382.7,105.0],"BE":[208.8,343.9],"DE":[269.4,339.1],"NL":[220.4,317.3],"IE":[85.1,281.0],"DK":[259.5,252.7],"SE":[314.2,146.9]};
// Expansion adjacency: shared land borders, plus five maritime links (IE-FR, MT-IT, CY-EL, DK-SE, EE-FI).
const NUTS_BORDERS = {"ES":["FR","PT"],"FR":["BE","DE","ES","IE","IT","LU"],"PT":["ES"],"BE":["DE","FR","LU","NL"],"LU":["BE","DE","FR"],"DE":["AT","BE","CZ","DK","FR","LU","NL","PL"],"IT":["AT","FR","MT","SI"],"AT":["CZ","DE","HU","IT","SI","SK"],"SI":["AT","HR","HU","IT"],"HR":["HU","SI"],"HU":["AT","HR","RO","SI","SK"],"SK":["AT","CZ","HU","PL"],"CZ":["AT","DE","PL","SK"],"PL":["CZ","DE","LT","SK"],"BG":["EL","RO"],"EL":["BG","CY"],"RO":["BG","HU"],"LT":["LV","PL"],"LV":["EE","LT"],"EE":["FI","LV"],"SE":["DK","FI"],"FI":["EE","SE"],"NL":["BE","DE"],"DK":["DE","SE"],"IE":["FR"],"MT":["IT"],"CY":["EL"]};

// Game ISO ⇄ NUTS country code (Greece is GR in the game, EL in NUTS)
const isoToNuts = i => i==="GR" ? "EL" : i;
const nutsToIso = n => n==="EL" ? "GR" : n;
const NUTS0_KEYS = Object.keys(NUTS0_PATHS);
const nutsMatch  = (key, code) => key.startsWith(code) || code.startsWith(key);

// NUTS codes of every currently active region
function activeNutsCodes(gs) {
  const out = [];
  (gs?.countries||[]).forEach(c => (REGION_RECORDS[c]||[]).forEach(rec => {
    if (rec.nuts && hasRegionActive(gs, c, rec.name)) out.push(rec.nuts);
  }));
  return out;
}

/* ── Map pan & zoom ───────────────────────────────────────────
   Zoom is a factor on the base viewBox; panning is clamped so the
   visible rectangle always stays inside the map bounds.
─────────────────────────────────────────────────────────────── */
const MAP_ZOOM_MIN = 1;
const MAP_ZOOM_MAX = 7;
const DRAG_SLOP = 6; // px of movement before a tap becomes a drag

function clampMapView(v) {
  const z = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, v.z));
  const w = MAP_W / z, h = MAP_H / z;
  return {
    z,
    x: Math.max(0, Math.min(MAP_W - w, v.x)),
    y: Math.max(0, Math.min(MAP_H - h, v.y)),
  };
}

// Zoom by `factor` while keeping the SVG point (px,py) pinned under the finger.
function zoomMapAt(v, factor, px, py) {
  const z2 = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, v.z * factor));
  const w1 = MAP_W / v.z, h1 = MAP_H / v.z;
  const w2 = MAP_W / z2,  h2 = MAP_H / z2;
  const rx = w1 ? (px - v.x) / w1 : 0.5;
  const ry = h1 ? (py - v.y) / h1 : 0.5;
  return clampMapView({ x: px - rx * w2, y: py - ry * h2, z: z2 });
}

function useMapView() {
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const svgRef = useRef(null);
  const pointers = useRef(new Map());   // pointerId → {x,y} in client px
  const pinch = useRef(null);           // {dist, cx, cy} at gesture start
  const dragged = useRef(false);        // did this gesture move far enough to be a pan?
  const last = useRef(null);            // last single-pointer position
  const lastTap = useRef(0);
  const lastTapPos = useRef(null);

  // client px → SVG user units, accounting for the letterbox fit
  const toSvg = (cx, cy) => {
    const el = svgRef.current;
    if (!el) return { x: MAP_W / 2, y: MAP_H / 2 };
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return { x: MAP_W / 2, y: MAP_H / 2 };
    const vw = MAP_W / view.z, vh = MAP_H / view.z;
    // preserveAspectRatio="xMidYMid meet": the viewBox is scaled uniformly and centred
    const scale = Math.min(r.width / vw, r.height / vh);
    const drawW = vw * scale, drawH = vh * scale;
    const offX = r.left + (r.width - drawW) / 2;
    const offY = r.top + (r.height - drawH) / 2;
    return {
      x: view.x + (cx - offX) / scale,
      y: view.y + (cy - offY) / scale,
    };
  };

  const onPointerDown = (e) => {
    // ignore the secondary mouse buttons so right-click menus still work
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    if (pointers.current.size === 1) {
      last.current = { x: e.clientX, y: e.clientY };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    }
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.dist > 0 && dist > 0) {
        const factor = dist / pinch.current.dist;
        if (Math.abs(factor - 1) > 0.01) {
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const p = toSvg(mid.x, mid.y);
          setView((v) => zoomMapAt(v, factor, p.x, p.y));
          pinch.current = { dist, mid };
          dragged.current = true;
        }
      }
      return;
    }

    if (last.current) {
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      if (!dragged.current && Math.hypot(dx, dy) < DRAG_SLOP) return;
      dragged.current = true;
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = MAP_W / view.z, vh = MAP_H / view.z;
      const scale = Math.min(r.width / vw, r.height / vh) || 1;
      setView((v) => clampMapView({ ...v, x: v.x - dx / scale, y: v.y - dy / scale }));
      last.current = { x: e.clientX, y: e.clientY };
    }
  };

  // `countAsTap` is false for cancel/leave: those are cleanup, not a deliberate tap.
  const endPointer = (countAsTap) => (e) => {
    // A pointer we never saw go down on the map is not ours. This happens when
    // an overlay (an event modal, say) closes on pointerdown and the matching
    // pointerup lands on the map underneath. That must not count as a tap,
    // or dismissing two events quickly reads as a double-tap and zooms.
    const ours = pointers.current.has(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!ours) { if (pointers.current.size === 0) last.current = null; return; }

    if (pointers.current.size === 0) {
      last.current = null;
      if (!countAsTap || dragged.current) { lastTap.current = 0; return; }
      // Double-tap toggles between the fitted view and a 2.5x look. Both taps
      // must be close together in space as well as time, so two unrelated
      // clicks in different places never zoom.
      const now = Date.now();
      const prev = lastTapPos.current;
      const near = prev && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40;
      if (now - lastTap.current < 300 && near) {
        const p = toSvg(e.clientX, e.clientY);
        if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
          setView((v) => (v.z > 1.2 ? { x: 0, y: 0, z: 1 } : zoomMapAt(v, 2.5, p.x, p.y)));
        }
        lastTap.current = 0;
        lastTapPos.current = null;
      } else {
        lastTap.current = now;
        lastTapPos.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const p = toSvg(e.clientX, e.clientY);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setView((v) => zoomMapAt(v, factor, p.x, p.y));
  };

  // Suppress the click that follows a pan, so dragging across the map doesn't
  // also select whatever region happened to be under the finger.
  const onClickCapture = (e) => {
    if (dragged.current) { e.stopPropagation(); e.preventDefault(); }
  };

  const zoomBy = (factor) =>
    setView((v) => zoomMapAt(v, factor, v.x + MAP_W / v.z / 2, v.y + MAP_H / v.z / 2));
  const reset = () => setView({ x: 0, y: 0, z: 1 });

  return {
    view, svgRef, zoomBy, reset,
    zoomed: view.z > 1.02,
    handlers: {
      onPointerDown, onPointerMove,
      onPointerUp: endPointer(true),
      onPointerCancel: endPointer(false), onPointerLeave: endPointer(false),
      onWheel, onClickCapture,
    },
  };
}

function EUMap({ gs, sel, setSel, lift=0, dispatch }) {
  const [hov, setHov] = useState(null);
  const [pick, setPick] = useState(null);   // the region clicked: {code, country, name, rec}
  const [hovR, setHovR] = useState(null);   // NUTS-2 code under the pointer
  const [hovXY, setHovXY] = useState(null); // pointer position inside the map, for the hover label
  const track = e => { const r = map.svgRef.current && map.svgRef.current.getBoundingClientRect(); if (r) setHovXY({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }); };
  const choose = code => { const r = regionAt(code); setPick(r); if (r) setSel && setSel(null); };
  const map = useMapView();
  const sc      = gs?.sector?.color || P.accent;
  const homeISO = NAME_TO_ISO[gs?.country] || "";
  const activeSet = new Set((gs?.countries||[]).map(c => NAME_TO_ISO[c]).filter(Boolean));
  const fullSet   = new Set((gs?.fullCountries||[]).map(c => NAME_TO_ISO[c]).filter(Boolean));
  const rivals = gs?.rivals || [];
  const rivalsByISO = {};
  rivals.forEach(rv => (rv.countries||[]).forEach(c => {
    const iso = NAME_TO_ISO[c]; if (iso) (rivalsByISO[iso] = rivalsByISO[iso] || []).push(rv);
  }));
  // Newly acquired region flashes for a moment
  const prevCodes = useRef(null);
  const [popCode, setPopCode] = useState(null);
  const codesNow = activeNutsCodes(gs).join("|");
  useEffect(() => {
    const before = prevCodes.current;
    prevCodes.current = codesNow;
    if (before == null || before === codesNow) return;
    const added = codesNow.split("|").filter(c => c && !before.split("|").includes(c));
    if (added.length) {
      setPopCode(added[added.length-1]);
      const t = setTimeout(() => setPopCode(null), 1700);
      return () => clearTimeout(t);
    }
  }, [codesNow]);
  const codes    = activeNutsCodes(gs);
  const homeNuts = gs?.regionNuts || "";
  const home     = MAP_CENT[isoToNuts(homeISO)];
  const focus    = pick ? null : (sel || hov);

  // Tooltip
  let tip = null;
  if (focus && MAP_CENT[isoToNuts(focus)]) {
    const [cx, cy] = MAP_CENT[isoToNuts(focus)];
    const name = ISO_TO_NAME[focus] || focus;
    const isH = focus === homeISO;
    const isA = activeSet.has(focus);
    const isF = fullSet.has(focus);
    const rCnt = (REGION_RECORDS[name]||[]).filter(rec => hasRegionActive(gs, name, rec.name)).length;
    const rivHere = rivals.filter(rv => (rv.countries||[]).includes(name));
    const tw = 200, th = (isA ? 60 : 48) + rivHere.length*11;
    const tx = cx > MAP_W*0.62 ? cx - tw - 10 : cx + 12;
    const ty = Math.max(4, Math.min(cy - 12, MAP_H - th - 4));
    tip = (
      <g pointerEvents="none">
        <rect x={tx} y={ty} width={tw} height={th} rx={4} fill={P.panel} stroke={isH||isF?P.gold:isA?sc:P.border} strokeWidth={1} opacity={0.97}/>
        <text x={tx+8} y={ty+15} fontSize={11} fill={P.text} fontFamily="Helvetica, Arial, sans-serif" fontWeight={700}>{name}</text>
        <FAGlyph name={isH?"star":isA?"diamond":"circle-outline"} x={tx+8} y={ty+20.5} size={9} color={isH||isF?P.gold:isA?sc:P.muted}/>
        <text x={tx+21} y={ty+29} fontSize={10} fill={isH||isF?P.goldText:isA?darkHex(sc):P.muted} fontFamily="Helvetica, Arial, sans-serif">{isH?"HOME COUNTRY":isF?"FULL NATIONAL COVERAGE":isA?"ACTIVE":"UNEXPLORED"}</text>
        {isA && <text x={tx+8} y={ty+42} fontSize={9} fill={P.muted} fontFamily="Helvetica, Arial, sans-serif">{rCnt} region{rCnt!==1?"s":""} active</text>}
        <text x={tx+8} y={isA?ty+53:ty+41} fontSize={9} fill={P.muted} fontFamily="Helvetica, Arial, sans-serif">{(EU_COUNTRIES[name]||[]).length} regions available</text>
        {rivHere.map((rv, k) => (
          <text key={`rt-${rv.id}`} x={tx+20} y={(isA?ty+65:ty+53)+k*11} fontSize={9} fill={rv.color} fontFamily="Helvetica, Arial, sans-serif">{rv.name} · {STAGES[rv.stage]?.name}</text>
        ))}
        {sel && (
          <g pointerEvents="auto" style={{cursor:"pointer"}} onClick={(e) => { e.stopPropagation(); setSel && setSel(null); }}>
            <circle cx={tx+tw-11} cy={ty+11} r={8} fill={P.card} stroke={P.border} strokeWidth={1}/>
            <text x={tx+tw-11} y={ty+14.5} textAnchor="middle" fontSize={11} fill={P.muted} fontFamily="Helvetica, Arial, sans-serif">×</text>
          </g>
        )}
      </g>
    );
  }

  const coverageLabel = `Map of Europe. Your cluster is active in ${(gs.regions||[]).length} region${(gs.regions||[]).length===1?"":"s"} across ${(gs.countries||[]).length} countr${(gs.countries||[]).length===1?"y":"ies"}. ${(gs.rivals||[]).length} rival${(gs.rivals||[]).length===1?"":"s"} on the board.`;
  const vb = `${map.view.x} ${map.view.y} ${MAP_W / map.view.z} ${MAP_H / map.view.z}`;
  return (
    <>
    <svg ref={map.svgRef} viewBox={vb} role="img" aria-label={coverageLabel}
      style={{width:"100%",height:"100%",display:"block",touchAction:"none",cursor:map.zoomed?"grab":"default"}}
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" {...map.handlers}>
      {/* Clicking open water / background closes a pinned tooltip. The sea + dot texture
          now lives on the map panel (see .map-sea) so it fills the whole window rather
          than a letterboxed square. */}
      <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="transparent" onClick={() => { setPick(null); setSel && setSel(null); }}/>

      {/* Neighbouring land, then candidate countries, then the Union on top */}
      <path d={NEIGHBOUR_LAND} fill={THEME_DARK ? "#182234" : "#EDF0F4"} stroke={THEME_DARK ? "#263247" : "#D3D9E2"} strokeWidth={0.5} strokeLinejoin="round" pointerEvents="none"/>
      <path d={CANDIDATE_LAND} fill={THEME_DARK ? "#1E2C48" : "#E2EAF7"} stroke={THEME_DARK ? "#34466D" : "#B8C8E2"} strokeWidth={0.5} strokeLinejoin="round" pointerEvents="none"/>

      {/* Region basemap: one polygon per playable region, at that region's own NUTS level. Active regions fill with the sector colour. */}
      <g stroke={THEME_DARK ? "#3A4A68" : "#C6D0DE"} strokeWidth={0.4} strokeLinejoin="round">
        {Object.entries(NUTS2_PATHS).map(([k, d]) => {
          const isHome = homeNuts && nutsMatch(k, homeNuts);
          const active = isHome || codes.some(c => nutsMatch(k, c));
          const iso    = nutsToIso(k.slice(0,2));
          const full   = fullSet.has(iso);
          const fill   = isHome ? `${P.gold}B0` : active ? (full ? `${sc}A8` : `${sc}66`) : (THEME_DARK ? "#1F2A40" : "#FFFFFF");
          const pop    = popCode && nutsMatch(k, popCode);
          return <path key={k} d={d} fill={fill} data-nuts={k} style={{cursor:"pointer"}}
            onMouseEnter={(e)=>{ setHov(iso); setHovR(k); track(e); }} onMouseMove={track} onMouseLeave={()=>{ setHov(null); setHovR(null); setHovXY(null); }}
            onClick={(e)=>{ e.stopPropagation(); choose(k); }}
            className={pop ? "map-new" : isHome ? "map-home" : undefined}
            {...(pop || isHome ? {style:{cursor:"pointer",color: isHome ? P.gold : sc, stroke: isHome ? P.gold : "none"}} : {})}/>;
        })}
      </g>

      {/* Rival territory: diagonal stripes (also colour-blind friendly), shimmer where contested */}
      <defs>
        {rivals.map(rv => (
          <pattern key={`pt-${rv.id}`} id={`rvp-${rv.id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill={`${rv.color}10`}/>
            <line x1="0" y1="0" x2="0" y2="7" stroke={rv.color} strokeWidth="2.2" opacity="0.38"/>
          </pattern>
        ))}
      </defs>
      {Object.entries(rivalsByISO).map(([iso, rvs]) => {
        const d = NUTS0_PATHS[isoToNuts(iso)]; if (!d) return null;
        const rv = rvs[0];
        const contested = activeSet.has(iso);
        return <path key={`rv-${iso}`} d={d} fill={`url(#rvp-${rv.id})`} stroke={rv.color} strokeWidth={0.9} strokeDasharray="3 2.5" strokeLinejoin="round" pointerEvents="none" className={contested ? "map-contested" : undefined}/>;
      })}

      {/* Connection lines home → active; the newest link carries a travelling pulse */}
      {home && NUTS0_KEYS.filter(k => activeSet.has(nutsToIso(k)) && nutsToIso(k)!==homeISO).map(k => {
        const [cx,cy] = MAP_CENT[k]||[0,0];
        const fresh = popCode && nutsToIso(k) === nutsToIso(popCode.slice(0,2));
        return (
          <g key={`ln-${k}`} pointerEvents="none">
            <line x1={home[0]} y1={home[1]} x2={cx} y2={cy} stroke={sc} strokeWidth={fresh?1.8:1.2} strokeOpacity={fresh?0.7:0.35} strokeDasharray="5 4">
              <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.6s" repeatCount="indefinite"/>
            </line>
            {fresh && (
              <circle r="3.4" fill={sc}>
                <animateMotion dur="0.9s" repeatCount="2" path={`M${home[0]},${home[1]} L${cx},${cy}`}/>
                <animate attributeName="opacity" from="1" to="0.2" dur="0.9s" repeatCount="2"/>
              </circle>
            )}
          </g>
        );
      })}

      {/* Country borders: gold for home / fully covered, sector colour for active */}
      <g fill="none" strokeLinejoin="round" pointerEvents="none">
        {NUTS0_KEYS.map(k => {
          const iso = nutsToIso(k);
          const isH = iso===homeISO, isA = activeSet.has(iso), isF = fullSet.has(iso);
          return <path key={`b-${k}`} d={NUTS0_PATHS[k]}
            stroke={isH||isF ? P.gold : isA ? sc : "#8FA2C6"}
            strokeWidth={isH||isF ? 1.8 : isA ? 1.4 : 0.7}
            opacity={isH||isA||isF ? 0.95 : 0.8}/>;
        })}
      </g>

      {/* Political seat markers: pins on your home capital + Brussels for the EU chair */}
      {(() => {
        const seats = gs?.seats || {};
        const pins = [];
        if (home && seats.regional) pins.push({ key:"reg", x:home[0]-9, y:home[1]-2, label:"S3", col:P.purple });
        if (home && seats.national) pins.push({ key:"nat", x:home[0]+9, y:home[1]-2, label:"NAT", col:P.blue });
        const bxl = MAP_CENT["BE"];
        if (bxl && seats.eu) pins.push({ key:"eu", x:bxl[0], y:bxl[1], label:"EU", col:P.gold });
        return pins.map(p => (
          <g key={`seat-${p.key}`} pointerEvents="none" className="map-home">
            <circle cx={p.x} cy={p.y} r={7} fill={P.panel} stroke={p.col} strokeWidth={1.6}/>
            <text x={p.x} y={p.y+2.6} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={darkHex(p.col,0.7)} fontFamily="Helvetica, Arial, sans-serif">{p.label}</text>
          </g>
        ));
      })()}

      {/* Focus outline */}
      {focus && NUTS0_PATHS[isoToNuts(focus)] && (
        <path d={NUTS0_PATHS[isoToNuts(focus)]} fill="none" stroke={P.accent} strokeWidth={2} strokeLinejoin="round" pointerEvents="none"/>
      )}

      {/* Banners: a plate on each country you operate in, showing how much of it
          you hold, and one on each rival's home ground. They replace the corner
          legend, so who is where reads straight off the map. */}
      {NUTS0_KEYS.filter(k => activeSet.has(nutsToIso(k))).map(k => {
        const iso = nutsToIso(k); const c = MAP_CENT[k]; if (!c) return null;
        const cname = ISO_TO_NAME[iso] || iso;
        const recs = REGION_RECORDS[cname] || [];
        const held = recs.filter(rec => hasRegionActive(gs, cname, rec.name)).length;
        const label = `${iso} ${held}/${recs.length || 1}`;
        const w = label.length * 4.1 + 9, h = 11;
        const strong = iso === homeISO || fullSet.has(iso);
        return (
          <g key={`ban-${k}`} pointerEvents="none" className="map-banner">
            <rect x={c[0]-w/2} y={c[1]-h-6} width={w} height={h} fill={P.panel} stroke={strong ? P.goldText : darkHex(sc)} strokeWidth={0.7}/>
            <rect x={c[0]-w/2} y={c[1]-h-6} width={3} height={h} fill={strong ? P.gold : sc}/>
            <text x={c[0]+1.5} y={c[1]-h-6+7.9} textAnchor="middle" fontSize={7} fontWeight="700" fontFamily="Helvetica, Arial, sans-serif" fill={P.text}>{label}</text>
          </g>
        );
      })}
      {rivals.map(rv => {
        const iso = NAME_TO_ISO[rv.country]; const c = iso && MAP_CENT[isoToNuts(iso)]; if (!c) return null;
        const full = String(rv.name || "Rival");
        const label = full.length > 17 ? full.slice(0, 16).trimEnd() + "…" : full;
        const w = label.length * 3.5 + 10, h = 10;
        const ahead = (rv.stage||0) > (gs?.stage||0);
        const dy = activeSet.has(iso) ? 8 : -3;
        return (
          <g key={`rban-${rv.id}`} pointerEvents="none" className="map-banner">
            <rect x={c[0]-w/2} y={c[1]+dy} width={w} height={h} fill={P.panel} stroke={rv.color} strokeWidth={ahead ? 1 : 0.6}/>
            <rect x={c[0]-w/2} y={c[1]+dy} width={3} height={h} fill={rv.color}/>
            <text x={c[0]+1.5} y={c[1]+dy+7.2} textAnchor="middle" fontSize={6.2} fontWeight={ahead ? "700" : "400"} fontFamily="Helvetica, Arial, sans-serif" fill={P.text}>{label}</text>
          </g>
        );
      })}

      {/* Outline the region under the pointer and the one picked */}
      {hovR && NUTS2_PATHS[hovR] && hovR !== pick?.code && <path d={NUTS2_PATHS[hovR]} fill="none" stroke={P.accent} strokeWidth={1} pointerEvents="none"/>}
      {pick && NUTS2_PATHS[pick.code] && <path className="map-pick" d={NUTS2_PATHS[pick.code]} fill={`${P.accent}22`} stroke={P.accent} strokeWidth={1.8} pointerEvents="none"/>}

      {/* Enlarged tap targets: these countries' polygons are below comfortable touch size */}
      {["MT","LU","CY","SI","BE","EE","SK"].map(k => {
        const c = MAP_CENT[k]; if (!c) return null;
        const iso = nutsToIso(k);
        return <circle key={`hitc-${k}`} cx={c[0]} cy={c[1]} r={14} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHov(iso)} onMouseLeave={()=>setHov(null)}
          onClick={(e)=>{ e.stopPropagation(); const code = Object.keys(NUTS2_PATHS).find(c => nutsMatch(c, k)); if (code) choose(code); }}/>;
      })}



    </svg>

    {!pick && hov && hovXY && (() => {
      const name = ISO_TO_NAME[hov] || hov;
      const recs = REGION_RECORDS[name] || [];
      const held = recs.filter(rec => hasRegionActive(gs, name, rec.name)).length;
      const r = hovR && regionAt(hovR);
      const here = rivals.filter(rv => (rv.countries||[]).includes(name));
      const status = hov === homeISO ? "Your home country" : fullSet.has(hov) ? "Fully covered" : activeSet.has(hov) ? `You hold ${held} of ${recs.length} regions` : "Not in your network";
      const left = hovXY.x + 14 + 240 > hovXY.w ? Math.max(6, hovXY.x - 254) : hovXY.x + 14;
      const top  = Math.min(hovXY.y + 14, Math.max(6, hovXY.h - 140));
      return (
        <div className="map-hover" style={{left, top}}>
          <div style={{fontWeight:600}}>{r && r.name !== name ? r.name : name}</div>
          <div style={{color:P.muted}}>{r && r.name !== name ? `${name}. ` : ""}{status}</div>
          {here.map(rv => (
            <div key={rv.id} style={{display:"flex",gap:7,alignItems:"baseline",marginTop:3}}>
              <span aria-hidden="true" style={{width:8,height:8,borderRadius:2,background:rv.color,flexShrink:0,transform:"translateY(1px)"}}/>
              <span>{rv.name}, {(STAGES[rv.stage]?.name || "").toLowerCase()}</span>
            </div>
          ))}
          <div style={{color:P.muted,marginTop:4,fontSize:11}}>Click for options</div>
        </div>
      );
    })()}

    {pick && (() => {
      const opt = expansionOption(gs, pick.country, pick.name);
      const rec = pick.rec || {};
      const aligned = ecosystemAligns(rec, gs.sector?.name);
      const go = opt.action && (opt.state === "region" || opt.state === "country");
      return (
        <div className="glass region-card" role="dialog" aria-label={`Region ${pick.name}`}
          style={{position:"absolute",left:12,bottom:48,zIndex:46,width:"min(300px, calc(100% - 24px))",padding:"14px 16px 14px"}}>
          <button className="btn" onClick={() => setPick(null)} aria-label="Close region card"
            style={{position:"absolute",top:8,right:8,background:"transparent",border:"none",padding:4,display:"flex"}}><Icon name="xmark" size={12} color={P.muted}/></button>
          <div className="title-caps" style={{fontSize:16,lineHeight:1.25,paddingRight:22}}>{pick.name}</div>
          <div style={{fontSize:12,color:P.muted,marginTop:2,lineHeight:1.45}}>{pick.country}, {rec.nuts || pick.code}{rec.ris ? `. Innovation: ${rec.ris.toLowerCase()}` : ""}{rec.coh ? `. Cohesion: ${rec.coh.toLowerCase()}` : ""}</div>
          <div style={{fontSize:11.5,marginTop:8,color:aligned?P.greenText:P.muted}}>
            {aligned ? `${gs.sector?.name} is a smart-specialisation priority here` : `${gs.sector?.name} is not a priority here`}
          </div>
          {opt.state === "held" && <div style={{fontSize:12.5,fontWeight:600,color:P.accent,marginTop:10}}>{opt.text}</div>}
          {opt.state === "blocked" && <div style={{fontSize:12,color:P.muted,marginTop:10,lineHeight:1.45}}>{opt.text}</div>}
          {(opt.state === "region" || opt.state === "country" || opt.state === "short") && (
            <>
              <button className="btn" disabled={!go || !dispatch} onClick={() => dispatch && dispatch(opt.action)}
                style={{marginTop:12,width:"100%",padding:"10px 12px",border:"none",borderRadius:6,background:go?P.accent:P.bright,color:go?P.onAccent:P.muted,fontSize:13,fontWeight:600}}>
                {opt.kind === "country" ? `Enter ${pick.country} for ${fmt(opt.cost)}` : `Open an office for ${fmt(opt.cost)}`}
              </button>
              <div style={{fontSize:11.5,color:P.muted,marginTop:6,lineHeight:1.45}}>
                {opt.state === "short" ? opt.text
                  : opt.kind === "country" ? `Adds a mandatory Country Manager on the payroll.`
                  : `Adds a mandatory Regional Coordinator on the payroll.`}
              </div>
            </>
          )}
        </div>
      );
    })()}

    {/* Watermark — HTML, not SVG, so zooming the map doesn't magnify it */}
    <div style={{position:"absolute",...(lift ? {left:"50%",transform:"translateX(-50%)"} : {right:8}),bottom:6,pointerEvents:"none",fontSize:11.5,color:P.muted,opacity:0.55,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',whiteSpace:"nowrap"}}>
      {diffOf(gs).label} difficulty
    </div>

    {/* Zoom controls: buttons matter for anyone who can't pinch (desktop, or
        assistive input), and give a visible way back to the full view. */}
    <div style={{position:"absolute",right:lift?12:8,bottom:26+lift,zIndex:36,display:"flex",flexDirection:"column",gap:4}}>
      <button className="btn" onClick={()=>map.zoomBy(1.5)} title="Zoom in" aria-label="Zoom in on the map"
        style={{width:30,height:30,borderRadius:0,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontSize:15,fontWeight:700,lineHeight:1,boxShadow:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      <button className="btn" onClick={()=>map.zoomBy(1/1.5)} title="Zoom out" aria-label="Zoom out of the map"
        style={{width:30,height:30,borderRadius:0,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontSize:17,fontWeight:700,lineHeight:1,boxShadow:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      {map.zoomed && (
        <button className="btn" onClick={map.reset} title="Fit the whole map" aria-label="Reset the map to fit the whole of Europe"
          style={{width:30,height:30,borderRadius:0,border:`1px solid ${P.accent}`,background:"transparent",color:P.accent,boxShadow:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="rotate-left" size={12} color={P.accent}/>
        </button>
      )}
    </div>

    {map.zoomed && (
      <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",top:8,zIndex:36,pointerEvents:"none",
        fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:P.muted,background:P.panel,border:`1px solid ${P.border}`,
        borderRadius:0,padding:"3px 10px",boxShadow:"none",whiteSpace:"nowrap"}}>
        {map.view.z.toFixed(1)}× · drag to pan
      </div>
    )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════ */
/* Menu language: a deep-blue title band closed by a yellow rule, a diamond as
   the recurring mark, tabs as solid blocks, and section headings that sit on a
   hairline. The band stays flag blue in both themes so menus read as one family. */
const BAND = "#003399";
const Diamond = ({ size=7, color }) => (
  <span aria-hidden="true" style={{display:"inline-block",width:size,height:size,background:color||P.gold,transform:"rotate(45deg)",flexShrink:0}}/>
);
const Lbl = ({ t }) => (
  <div className="menu-heading" style={{fontSize:13,fontWeight:600,color:P.text,margin:"6px 0 8px"}}>{t}</div>
)

// Animates a displayed number toward its new value (SSR-safe: effects only)
function useTicker(value, dur=550) {
  const [disp, setDisp] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    const from = prevRef.current, to = value;
    if (from === to) return;
    prevRef.current = to;
    if (Math.abs(to - from) < 0.6) { setDisp(to); return; }
    let raf; const t0 = (typeof performance !== "undefined" ? performance.now() : 0);
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      setDisp(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return disp;
}
// Flashes a card green/red when its value changes
function usePulse(value) {
  const prev = useRef(value);
  const [cls, setCls] = useState("");
  useEffect(() => {
    if (prev.current === value) return;
    const up = value > prev.current; prev.current = value;
    setCls("");
    const raf = requestAnimationFrame(() => setCls(up ? "pulse-good" : "pulse-bad"));
    const t = setTimeout(() => setCls(""), 900);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [value]);
  return cls;
}
const EmptyState = ({ icon, title, hint }) => (
  <div style={{textAlign:"center",padding:"20px 16px",color:P.muted}}>
    <div style={{marginBottom:8,display:"flex",justifyContent:"center",opacity:0.55}}><Icon name={icon} size={26} color={P.muted}/></div>
    <div style={{fontSize:12,fontWeight:700,color:P.text,marginBottom:3}}>{title}</div>
    <div style={{fontSize:11.5,lineHeight:1.5,maxWidth:280,margin:"0 auto"}}>{hint}</div>
  </div>
);
const ProgressRing = ({ pct, color, size=30, stroke=3.5, label }) => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0,transform:"rotate(-90deg)"}} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={P.bright} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{transition:"stroke-dashoffset .65s cubic-bezier(.22,1,.36,1)"}}/>
      {label != null && <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fontSize={8.5} fontWeight={700} fill={darkHex(color,0.65)} fontFamily="Helvetica, Arial, sans-serif" transform={`rotate(90 ${size/2} ${size/2})`}>{label}</text>}
    </svg>
  );
};
const Sparkline = ({ data, color, w=132, h=28 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v,i) => `${((i/(data.length-1))*w).toFixed(1)},${(h-3-((v-min)/Math.max(1e-9,(max-min)))*(h-6)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{display:"block",marginTop:4}} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" opacity={0.9}/>
    </svg>
  );
};
/* ── SOUND: a tiny WebAudio synth, no assets, toggleable ── */
const sfx = {
  on: true, ctx: null,
  ensure() { if (typeof window === "undefined") return null;
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; } }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(()=>{});
    return this.ctx; },
  tone(freq, t0, dur, type="sine", gain=0.08) { const c = this.ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + t0 + dur);
    o.connect(g).connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05); },
  play(name) { if (!this.on) return;
    if (name === "quarter") { this.tone(523, 0, .12, "sine", .05); this.tone(784, .09, .16, "sine", .05); }
    if (name === "fanfare") { [523,659,784,1047].forEach((f,i)=>this.tone(f, i*.10, .28, "triangle", .07)); }
    if (name === "gold")    { [784,988,1175,1568].forEach((f,i)=>this.tone(f, i*.09, .3, "triangle", .07)); }
    if (name === "alert")   { this.tone(196, 0, .22, "sawtooth", .045); this.tone(147, .14, .3, "sawtooth", .045); }
    if (name === "cash")    { this.tone(880, 0, .08, "square", .03); this.tone(1319, .06, .1, "square", .03); } },
};

const CONFETTI_COLORS = ["#FF9D0A","#3860ED","#24A148","#DA1E28","#5B4B8A","#F39811"];
function Confetti({ burst }) {
  if (!burst) return null;
  const bits = Array.from({length:46}, (_,i) => i);
  return (
    <div key={burst.key} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:3000,overflow:"hidden"}} aria-hidden="true">
      {bits.map(i => {
        const left = (i*97 % 100), delay = (i*53 % 40)/100, dur = 1.9 + (i*31 % 90)/100;
        const col = burst.gold ? [P.gold,"#FFD37A","#FFB042"][i%3] : CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return <span key={i} className="confetti-bit" style={{left:`${left}%`,background:col,"--dur":`${dur}s`,"--delay":`${delay}s`,"--spin":`${360+(i*67%540)}deg`}}/>;
      })}
    </div>
  );
}
// Floating "+€84k / −3 members" deltas after each quarter
function FloatingDeltas({ gs }) {
  const prev = useRef(null);
  const [items, setItems] = useState([]);
  useEffect(() => {
    const p = prev.current;
    prev.current = { turn:gs.turn, b:gs.budget||0, m:gs.members||0, p:gs.prestige||0, bc:gs.boardConf||0 };
    if (!p || p.turn === gs.turn) return;
    const out = [];
    const add = (v, fmtFn, label) => { if (Math.round(v) !== 0) out.push({ label:`${v>0?"+":""}${fmtFn(v)}${label}`, good:v>0 }); };
    add((gs.budget||0)-p.b, v=>fmtN(Math.round(v)), "");
    add((gs.members||0)-p.m, v=>Math.round(v), " members");
    add(Math.round((gs.prestige||0)-p.p), v=>v, " influence");
    add(Math.round((gs.boardConf||0)-p.bc), v=>v, " board");
    if (!out.length) return;
    setItems(out.map((o,i) => ({...o, id:`${gs.turn}-${i}`})));
    const t = setTimeout(() => setItems([]), 1500);
    return () => clearTimeout(t);
  }, [gs.turn]);
  if (!items.length) return null;
  return (
    <div style={{position:"fixed",top:"22%",left:"50%",transform:"translateX(-50%)",zIndex:2500,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:5}} aria-hidden="true">
      {items.map((it,i) => (
        <span key={it.id} className="float-delta" style={{position:"relative",color:it.good?P.greenText:P.redText,animationDelay:`${i*0.12}s`,background:THEME_DARK?"rgba(11,18,32,.82)":"rgba(255,255,255,.82)",padding:"2px 10px",borderRadius:0,border:`1px solid ${it.good?P.green:P.red}44`}}>{it.label}</span>
      ))}
    </div>
  );
}

const Bar = ({ val, max=100, color, h=4 }) => (
  <div style={{height:h,background:P.bright,overflow:"hidden",marginTop:3}}>
    <div className="bar-fill" style={{width:`${Math.min(100,Math.max(0,(val/max)*100))}%`,height:"100%",background:color}}/>
  </div>
);

const MiniStat = ({ l, v, c=P.text }) => (
  <div style={{background:P.card,borderRadius:0,padding:"7px 10px",border:`1px solid ${P.border}`}}>
    <div style={{fontSize:11.5,color:P.muted,marginBottom:3,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',letterSpacing:0.3}}>{l}</div>
    <div style={{fontSize:16,fontWeight:700,color:c,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{v}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   LEFT PANEL
═══════════════════════════════════════════════════════════ */
// Tap-or-hover popover: makes the hover-only tooltips reachable on touch screens
function InfoDot({ text, label, children, style }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false); // opened by a click: stays open when the pointer leaves
  const [pos, setPos] = useState(null); // viewport coordinates, once measured
  const ref = useRef(null);
  const btnRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setPinned(false); } };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);

  // The panel is placed in viewport coordinates rather than relative to the dot,
  // so it can neither run off the edge of the screen nor be clipped by a parent
  // that hides its overflow. It is measured first, then clamped, then shown.
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const b = btnRef.current && btnRef.current.getBoundingClientRect();
      const tip = tipRef.current;
      if (!b || !tip) return;
      const M = 8;
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = Math.min(260, vw - M * 2);
      const h = tip.offsetHeight || 0;
      let left = b.left + b.width / 2 - w / 2;
      left = Math.max(M, Math.min(left, vw - w - M));
      let top = b.top - h - 6;               // above the dot by preference
      if (top < M) top = b.bottom + 6;       // not enough room, so drop below
      if (top + h > vh - M) top = Math.max(M, vh - h - M);
      setPos({ left, top, w });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, text]);

  if (!text) return children || null;
  return (
    <span ref={ref} style={{position:"relative",display:"inline-flex",alignItems:"center",...style}}>
      {children}
      <button ref={btnRef} className="btn dot" aria-label={label||"More information"} aria-expanded={open}
        onClick={e => { e.stopPropagation(); if (pinned) { setPinned(false); setOpen(false); } else { setPinned(true); setOpen(true); } }}
        onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>{ if (!pinned) setOpen(false); }}
        style={{marginLeft:4,width:14,height:14,minWidth:14,borderRadius:"50%",border:`1px solid ${P.border}`,background:P.card,color:P.muted,fontSize:11,fontWeight:700,lineHeight:1,padding:0,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"help",flexShrink:0}}>i</button>
      {open && (typeof document !== "undefined" ? createPortal(
        <span ref={tipRef} role="tooltip"
          style={{position:"fixed",
            left: pos ? pos.left : 0, top: pos ? pos.top : 0,
            width: pos ? pos.w : Math.min(260, (typeof window !== "undefined" ? window.innerWidth : 320) - 16),
            visibility: pos ? "visible" : "hidden",
            zIndex:2000,maxHeight:"70vh",overflowY:"auto",boxSizing:"border-box",
            padding:"8px 10px",borderRadius:0,background:THEME_DARK?"#0b1220":"#1B2740",color:"#fff",
            fontSize:11.5,lineHeight:1.5,fontWeight:400,whiteSpace:"pre-wrap",overflowWrap:"anywhere",
            boxShadow:"none",fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',textAlign:"left",
            pointerEvents:"none"}}>{text}</span>, document.body) : null)}
    </span>
  );
}

const Trend = ({ t }) => !t ? null : (
  <span style={{fontSize:11.5,fontWeight:700,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:t.delta>0.05?P.greenText:t.delta<-0.05?P.redText:P.muted}}>
    {t.delta>0.05?"▲":t.delta<-0.05?"▼":"■"} {t.delta>=0?"+":""}{Math.round(t.delta*10)/10}/Q
  </span>
);

// A row of compact facts. The icon says what each one is, the text says how
// much; the full name sits in the tooltip and is read out by screen readers.
const Facts = ({ items, size=12, style }) => (
  <div className="facts" style={style}>
    {items.filter(Boolean).map((f, i) => (
      <span key={i} className="fact" title={f.tip||undefined} style={f.color ? {color:f.color} : undefined}>
        <Icon name={f.i} size={size} color={f.color || P.muted}/>
        <span>{f.t}</span>
        {f.tip && <span className="sr">{f.tip}</span>}
      </span>
    ))}
  </div>
);

function LeftPanel({ gs, dispatch }) {
  const trends = statTrends(gs);
  const tBudget = useTicker(gs.budget||0), tMembers = useTicker(gs.members||0);
  const tInfl = useTicker(gs.prestige||0), tBoard = useTicker(gs.boardConf||0);
  const pBudget = usePulse(Math.round(gs.budget||0)), pMembers = usePulse(gs.members||0);
  const pInfl = usePulse(Math.round(gs.prestige||0)), pBoard = usePulse(Math.round(gs.boardConf||0));
  if (!gs) return null;
  const stage    = STAGES[gs.stage] || STAGES[0];
  const reqs     = evolveReqs(gs);
  const burnRate = (gs.qStaff||0) + (gs.qOverhead||0) + (gs.qServicing||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
  const runway   = burnRate > 0 ? Math.round((gs.budget||0) / Math.max(1,burnRate)) : 99;
  const failRate = failPct(gs);
  const decay    = [2,3,4,5,6,8][gs.stage] ?? 2;

  return (
    <div style={{width:"100%",flexShrink:0,display:"flex",flexDirection:"column",gap:0,padding:"6px 14px 14px 14px",overflowY:"auto",background:P.panel}}>
      {/* Where the cluster stands */}
      <div style={{padding:"12px 6px 14px"}}>
        <div style={{fontSize:15,fontWeight:600,color:P.text,lineHeight:1.25,marginBottom:8}}>{stage.name}</div>
        <Facts items={[
          {i:"location-dot", t:`${gs.region||""}${gs.regionNuts ? `, ${gs.regionNuts}` : ""}`, tip:"Home region"},
          {i:"chart-line", t:(gs.regionRis||"not rated").toLowerCase(), tip:"Regional innovation tier"},
          {i:"bullseye", t:gs.s3Aligned ? "priority" : "not a priority", tip:"Is your ecosystem a smart-specialisation priority here?", color:gs.s3Aligned?P.greenText:undefined},
          (gs.stage||0)>=2 && {i:"circle-nodes", t:"cross-ecosystem", tip:"As a national body you work across ecosystems"},
        ]} style={{flexDirection:"column",gap:6}}/>
      </div>

      {/* Budget */}
      <div className={pBudget} style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
        <Lbl t="Treasury"/>
        <div className="tnum" style={{fontSize:26,fontWeight:600,letterSpacing:-.5,color:(gs.budget||0)<20000?P.redText:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{fmt(Math.round(tBudget))}</div>
        <div style={{fontSize:12,color:P.muted,marginTop:2}}>
          <span style={{color:(gs.qNet||0)>=0?P.greenText:P.redText}}>{(gs.qNet||0)>=0?"+":"−"}{fmt(Math.abs(gs.qNet||0))}</span> a quarter{runway>=99 ? "" : `, ${runway} quarters of runway`}
        </div>
        {(gs.rivals||[]).filter(r=>r.stage>gs.stage).length>0 && (
          <div style={{fontSize:12,color:P.redText,marginTop:2}}>Rivals ahead of you cut income by {Math.min(3,(gs.rivals||[]).filter(r=>r.stage>gs.stage).length)*6}%</div>
        )}
        <dl className="rows">
          <dt><Icon name="users" size={11} color={P.muted}/> Fees</dt><dd>+{fmt(gs.qMember||0)}</dd>
          <dt><Icon name="folder-open" size={11} color={P.muted}/> Projects</dt><dd>+{fmt(gs.qProj||0)}</dd>
          <dt><Icon name="user-tie" size={11} color={P.muted}/> Salaries</dt><dd>−{fmt(gs.qStaff||0)}</dd>
          <dt><Icon name="city" size={11} color={P.muted}/> Overheads</dt><dd>−{fmt(gs.qOverhead||0)}</dd>
          <dt><Icon name="handshake" size={11} color={P.muted}/> Servicing</dt><dd>−{fmt(gs.qServicing||0)}</dd>
          {(gs.qDelivery||0) > 0 && <><dt><Icon name="hourglass-half" size={11} color={P.muted}/> Delivery</dt><dd>−{fmt(Math.max(0,(gs.qDelivery||0)-(gs.qInterim||0)))}</dd></>}
        </dl>
      </div>

      {/* Members */}
      <div className={pMembers} style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
        <div style={{display:"flex",alignItems:"center"}}><Lbl t="Members"/><InfoDot label="Members trend" text={trendTitle(trends?.members, "Plus rival poaching, defections and event effects.")}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span className="tnum" style={{fontSize:26,fontWeight:600,letterSpacing:-.5,color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{Math.round(tMembers)}</span>
          <Trend t={trends?.members}/>
        </div>
        <div style={{fontSize:11,color:P.muted}}>fee {fmt(memberFee(gs.stage))}/quarter · mix ×{(Math.round(feeMult(gs)*100)/100).toFixed(2)}</div>
        {(() => { const mx = mixOf(gs), m = Math.max(1, gs.members||1); return (
          <div style={{marginTop:6}} title={`Member composition\nSMEs ${mx.sme} (fee ×0.8, volatile)\nCorporates ${mx.corp} (fee ×2.1, board +1 at 35%+)\nResearch ${mx.res} (fee ×0.5, research margins +2pp at 20%+)`}>
            <div style={{display:"flex",height:5,borderRadius:0,overflow:"hidden",border:`1px solid ${P.border}`}}>
              <div style={{width:`${Math.round(mx.sme/m*100)}%`,background:P.accent}}/>
              <div style={{width:`${Math.round(mx.corp/m*100)}%`,background:P.gold}}/>
              <div style={{flex:1,background:P.purple}}/>
            </div>
            <Facts style={{marginTop:6}} items={[
              {i:"briefcase", t:`${Math.round(mx.sme/m*100)}%`, tip:"Small and medium firms"},
              {i:"industry", t:`${Math.round(mx.corp/m*100)}%`, tip:"Large companies"},
              {i:"graduation-cap", t:`${Math.round(mx.res/m*100)}%`, tip:"Research organisations"},
            ]}/>
            <div className="seg" role="group" aria-label="Recruitment focus" style={{marginTop:8}}>
              {Object.entries(MIX_FOCUS).map(([fid, fo]) => (
                <button key={fid} className="btn" title={`Recruitment focus: ${fo.label} — new members join ${Math.round(fo.sme*100)}% SME / ${Math.round(fo.corp*100)}% corporate / ${Math.round(fo.res*100)}% research`}
                  onClick={() => dispatch({type:"setFocus", focus:fid})}
                  aria-pressed={(gs.focus||"balanced")===fid}>
                  {fo.label}
                </button>
              ))}
            </div>
          </div>
        ); })()}
        <div style={{marginTop:6}}>
          <div style={{display:"flex",height:5,borderRadius:0,overflow:"hidden",border:`1px solid ${P.border}`}}>
            <div style={{width:`${Math.min(100,Math.round(((gs.members||0)/Math.max(1,marketPool(gs)))*100))}%`,background:gs.sector?.color||P.accent}}/>
            <div style={{width:`${Math.min(100,Math.round((rivalPressure(gs)/Math.max(1,marketPool(gs)))*100))}%`,background:P.red,opacity:.6}}/>
            <div style={{flex:1,background:P.bg}}/>
          </div>
          <div style={{fontSize:11,color:P.muted,marginTop:2,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>market {Math.round(marketShare(gs)*100)}% claimed (you + rivals)</div>
        </div>
      </div>

      {/* Influence + Political Integration */}
      <div className={pInfl} style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
        <div style={{display:"flex",alignItems:"center"}}><Lbl t="Influence"/><InfoDot label="Influence trend" text={trendTitle(trends?.influence, "Plus one-off effects: project deliveries, events, coups.")}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:20,fontWeight:700,color:P.purple,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{Math.round(tInfl)}</span>
          <span style={{display:"inline-flex",alignItems:"baseline",gap:8}}><Trend t={trends?.influence}/><span style={{fontSize:11,color:P.muted}}>/ 100</span></span>
        </div>
        <Bar val={gs.prestige||0} color={P.purple}/>
        <div style={{fontSize:12,color:P.muted,marginTop:4}} title="Your political standing with public authorities. It fades each quarter unless you keep earning it.">Fades {decay} a quarter</div>
        <div className="seats" style={{marginTop:12}}>
          <div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:6}}>Seats</div>
          {seatStatus(gs).map(st => {
            const rv = st.heldBy ? (gs.rivals||[]).find(r=>r.id===st.heldBy) : null;
            const missing = st.reqs.filter(r=>!r.ok).map(r=>r.l).join(", ");
            const tip = st.held ? `${st.label}: ${st.effects}` : rv ? `${st.label}, chaired by ${st.holderName}. Needs: ${missing || "displacement next quarter"}` : `${st.label}. Needs: ${missing}`;
            return (
              <div key={st.id} className="seat-row" title={tip}>
                <Icon name={({regional:"building-columns",national:"landmark",eu:"earth-europe"})[st.id]||"landmark"} size={12} color={st.held?P.accent:P.muted}/>
                <span style={{flex:1,color:P.text}}>{({regional:"Regional",national:"National",eu:"EU"})[st.id]||st.short}</span>
                {st.held
                  ? <span style={{color:P.accent,fontWeight:600}}>Yours</span>
                  : rv ? <span style={{display:"inline-flex",alignItems:"center",gap:5,color:P.muted,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{width:7,height:7,borderRadius:2,background:rv.color,flexShrink:0}}/>{rv.name}</span>
                  : <span style={{color:P.muted}}>Open</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Board Confidence */}
      <div className={pBoard} style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
        <div style={{display:"flex",alignItems:"center"}}><Lbl t="Board confidence"/><InfoDot label="Board confidence trend" text={trendTitle(trends?.board, "Plus one-off effects: project completions +3, failures −8..−15, events.")}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:20,fontWeight:700,color:(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{Math.round(tBoard)}</span>
          <span style={{display:"inline-flex",alignItems:"baseline",gap:8}}><Trend t={trends?.board}/><span style={{fontSize:11,color:P.muted}}>/ 100</span></span>
        </div>
        <Bar val={gs.boardConf||0} color={(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green}/>
        {(gs.boardConf||0)<30 && <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:P.red,marginTop:4}}><Icon name="triangle-exclamation" size={9} color={P.red}/>Crisis: +3% extra churn</div>}
      </div>

      {/* Staff summary */}
      <div style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
        <Lbl t="Staff"/>
        <div style={{fontSize:18,fontWeight:700,color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{staffTotal(gs.roster)}</div>
        <div style={{fontSize:11,color:P.muted}}>cost {fmt(staffCostQ(gs.roster, gs.turn))}/quarter · salaries +1%/Q</div>
        <div style={{fontSize:11,color:P.muted,marginTop:2}}>fail risk: <span style={{color:failRate>25?P.red:failRate>15?P.orange:P.green}}>{failRate}%</span></div>
      </div>

      {/* Evolution requirements */}
      {gs.stage < 5 && (
        <div style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
          <Lbl t={<>{STAGES[Math.min(5,gs.stage+1)]?.name||""}</>}/>
          {reqs.map((r,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',lineHeight:1.9,color:r.ok?P.green:P.muted}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4}}>{r.ok?<Icon name="check" size={9} color={P.green}/>:<Icon name="circle" size={4} color={P.muted}/>} {r.l}</span>
              <span>{r.money?fmt(r.cur):r.cur}/{r.money?fmt(r.req):r.req}</span>
            </div>
          ))}
          <div style={{marginTop:4,fontSize:11,color:P.muted}}>Cost: <span style={{color:P.red}}>{fmt(evolveCost(gs.stage))}</span></div>
        </div>
      )}

      {/* Network */}
      <div style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
        <Lbl t="Network"/>
        <div style={{fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:P.blue}}>{(gs.countries||[]).length} countr{(gs.countries||[]).length===1?"y":"ies"}</div>
        <div style={{fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:P.teal}}>{(gs.regions||[]).length} region{(gs.regions||[]).length!==1?"s":""}</div>
        <div style={{fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:P.muted,marginTop:2}}>{(gs.completedProjects||[]).length} projects done</div>
        {(gs.fullCountries||[]).length > 0 && <div style={{fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:P.goldText,marginTop:2}}>{(gs.fullCountries||[]).length} countr{(gs.fullCountries||[]).length===1?"y":"ies"} fully covered</div>}
      </div>

      {/* Director governance panel */}
      {byRole(gs.roster,"director") > 0 && (
        <div style={{background:P.card,borderRadius:0,padding:"10px 12px",border:`1px solid ${P.accent}`}}>
          <Lbl t={<>Governance · {byRole(gs.roster,"director")} Director{byRole(gs.roster,"director")>1?"s":""}</>}/>
          <div style={{fontSize:11.5,color:P.text,lineHeight:1.7}}>
            <div>Board +{4+(byRole(gs.roster,"director")-1)*2}/quarter</div>
            <div>Influence +{byRole(gs.roster,"director")*2}/quarter</div>
            <div>Project income +10%</div>
            <div>Failure board hit reduced by {Math.min(8,byRole(gs.roster,"director")*4)}</div>
            {byRole(gs.roster,"director")>=2 && <div style={{color:P.green,fontWeight:700,marginTop:2,display:"flex",alignItems:"center",gap:4}}><Icon name="check" size={10} color={P.green}/> Stage 5 unlocked</div>}
          </div>
        </div>
      )}

      {/* Rival race */}
      {(gs.rivals||[]).length > 0 && (
        <div style={{padding:"14px 6px 12px",borderTop:`1px solid ${P.border}`}}>
          <Lbl t={<>Rival Race · first to Pan-European Cluster Network</>}/>
          {(gs.rivals||[]).map(rv => (
            <div key={rv.id} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
                <span style={{color:rv.color,display:"inline-flex",alignItems:"center",gap:5}}><Icon name="square" size={7} color={rv.color}/> {rv.name} · {NAME_TO_ISO[rv.country]||""}</span>
                <span style={{color:rv.stage>gs.stage?P.red:P.muted}}>{STAGES[rv.stage]?.name} · {rv.members} members</span>
              </div>
              <Bar val={rv.stage*100+(rv.progress||0)} max={500} color={rv.color} h={3}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RIGHT PANEL
═══════════════════════════════════════════════════════════ */
const LOG_ICON = { project:"diagram-project", good:"circle-check", bad:"triangle-exclamation" };
// One running project: name and status, a slim progress bar, then time left and volume.
function ActiveProjectRow({ p, gs }) {
  const left = Math.max(0, (p.endTurn||0) - (gs.turn||0));
  const prog = Math.min(1, 1 - left / Math.max(1, p.dur||1));
  const st = projectStatus(p, gs);
  return (
    <div className="ap-row">
      <div className="ap-top">
        <span className="nm" title={p.name}>{p.name||""}</span>
        <span className="st" style={{color:st.color}}><span className="dot" style={{background:st.color}}/>{st.label}</span>
      </div>
      <div className="ap-bar"><span style={{width:`${prog*100}%`,background:st.color}}/></div>
      <Facts style={{marginTop:6}} size={11} items={[
        {i:"hourglass-half", t:`${left} q left`, tip:"Quarters until delivery"},
        {i:"coins", t:fmt(projBudget(p, p.partners||0)), tip:"Project volume"},
      ]}/>
    </div>
  );
}

function RightPanel({ gs, compact, height }) {
  if (!gs) return null;
  const logColors = { project:P.blue, good:P.green, bad:P.red };
  const active = gs.activeProjects || [];
  const log    = gs.log || [];

  return (
    <div style={{width:compact?"auto":230,height:compact?(height||212):"auto",flexShrink:0,display:"flex",flexDirection:"column",background:P.panel,borderLeft:compact?"none":`1px solid ${P.border}`,borderTop:compact?`1px solid ${P.border}`:"none",overflow:"hidden"}}>
      {/* Active projects */}
      <div style={{padding:compact?"10px 14px 6px":"10px 10px 8px",borderBottom:`1px solid ${P.border}`,flexShrink:0,maxHeight:compact?"45%":"none",overflowY:compact?"auto":"visible"}}>
        <Lbl t={`Active projects (${active.length})`}/>
        {active.length===0 && <div style={{fontSize:12,color:P.muted}}>None running</div>}
        {active.map((p, i) => {
          if (!p) return null;
          return <ActiveProjectRow key={`ap-${i}`} p={p} gs={gs}/>;
        })}
      </div>

      {/* Event log */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        <Lbl t="Event log"/>
        {log.slice(0,40).map((e, i) => (
          <div key={`log-${i}-${(e?.txt||"").slice(0,18)}`} className={i===0?"log-in":undefined} style={{fontSize:12,lineHeight:1.5,padding:"6px 0 6px 10px",borderLeft:`2px solid ${logColors[e?.t]||P.border}`,marginBottom:4,color:P.text}}>
            <span>{e?.txt||""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL WRAPPER  (full-screen sheet on phones)
═══════════════════════════════════════════════════════════ */
const isPhone = () => (typeof window !== "undefined" && window.innerWidth < 820);

function Modal({ title, icon, iconColor, onClose, children, width=600 }) {
  const phone = isPhone();
  return (
    <div
      className="backdrop-in"
      style={{position:"fixed",inset:0,background:THEME_DARK?"rgba(2,6,16,.7)":"rgba(15,30,60,.55)",display:"flex",alignItems:phone?"stretch":"center",justifyContent:"center",zIndex:1000,padding:phone?0:20}}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div className="modal-in glass" style={{background:P.panel,maxWidth:phone?"100%":width,width:"100%",border:phone?"none":`1px solid ${P.border}`,maxHeight:phone?"100%":"92vh",height:phone?"100%":"auto",display:"flex",flexDirection:"column",boxShadow:phone?"none":"0 18px 50px rgba(8,20,50,.25)"}}>
        {/* Header: the title on the left, close on the right, a hairline beneath */}
        <div className="menu-band" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:phone?"16px 16px 14px 18px":"18px 18px 14px 22px",borderBottom:`1px solid ${P.border}`,textAlign:"left",flexShrink:0}}>
          <div className="title-caps" style={{fontSize:phone?18:19,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</div>
          <button className="btn" onClick={onClose} aria-label="Close" style={{background:"transparent",border:"none",borderRadius:8,color:P.muted,padding:"6px",display:"flex",alignItems:"center",flexShrink:0}}><Icon name="xmark" size={14} color={P.muted}/></button>
        </div>
        <div className="menu-scope" style={{padding:"16px 18px",overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROJECTS MODAL
═══════════════════════════════════════════════════════════ */
// Status of a running project call: remaining time vs cash runway, used by every HUD view.
function projectStatus(p, gs) {
  const left    = Math.max(0, (p.endTurn||0) - (gs.turn||0));
  const burn    = (gs.qStaff||0) + (gs.qOverhead||0) + (gs.qServicing||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
  const runway  = burn > 0 ? (gs.budget||0) / burn : 99;
  if (left <= 1) return { label:"Wrapping up", color:P.blue };
  if (runway < left) return { label:"At risk", color:P.red };
  return { label:"On track", color:P.green };
}

const FUND_C = {local:"#607080",regional:P.blue,national:P.orange,eu:P.green};
const CAT_C  = {research:P.blue,comms:P.purple,training:P.green,lobbying:P.gold,network:P.teal};

function ProjCard({ p, gs, failRate, onStart }) {
  const [partners, setPartners] = useState(p.part||0);
  const budget  = projBudget(p, partners);
  const spendQ  = projSpendQ(p, partners);
  const need    = projNeed(p, partners);
  const margin  = projMargin(p, gs);
  const expGain = Math.round(budget * margin * (gs ? projContest(p, gs).marginMul : 1));
  const cc = CAT_C[p.cat] || P.muted;
  const fc = FUND_C[p.fund] || P.muted;
  const reqDef = STAFF_ROLES.find(s => s.id === CAT_ROLE[p.cat]);
  const conds  = gs ? projectConditions(p, gs) : [];
  const contest = gs ? projContest(p, gs) : { rivals:[], failPen:0, marginMul:1 };
  const shownFail = Math.min(90, failRate + Math.round(contest.failPen*100));
  return (
    <div className="proj" style={{padding:"16px 0",borderTop:`1px solid ${P.border}`}}>
      <div style={{fontWeight:600,fontSize:15,color:P.text,lineHeight:1.3}}>{p.name}</div>
      <Facts style={{marginTop:6}} items={[
        {i:({research:"magnifying-glass-chart",comms:"bullhorn",training:"graduation-cap",lobbying:"landmark",network:"circle-nodes"}[p.cat]||"folder-open"), t:({research:"Research",comms:"Communications",training:"Training",lobbying:"Lobbying",network:"Networking"}[p.cat]||p.cat), tip:"Type of project"},
        {i:p.fund==="eu"?"earth-europe":"building-columns", t:({local:"Local",regional:"Regional",national:"National",eu:"EU"}[p.fund]||p.fund), tip:"Who funds it"},
        {i:"hourglass-half", t:`${p.dur} q`, tip:`Runs for ${p.dur} quarter${p.dur===1?"":"s"}`},
        reqDef && {i:reqDef.icon||"user-tie", t:reqDef.name, tip:"Specialist who runs it"},
      ]}/>
      <div style={{fontSize:12.5,color:P.text,marginTop:8,lineHeight:1.5,maxWidth:"62ch"}}>{p.desc}</div>
      <dl className="figs">
        <div><dt><Icon name="coins" size={11} color={P.muted}/> Volume</dt><dd>{fmt(budget)}</dd></div>
        <div><dt><Icon name="arrow-trend-up" size={11} color={P.muted}/> Margin</dt><dd style={{color:P.greenText}}>{Math.round(margin*100)}%</dd></div>
        <div><dt><Icon name="triangle-exclamation" size={11} color={P.muted}/> Risk</dt><dd style={{color:shownFail>25?P.redText:P.text}}>{shownFail}%</dd></div>
      </dl>
      {contest.rivals.length>0 && <div style={{fontSize:12,color:P.redText,marginTop:4}}>Contested by {contest.rivals.map(r=>r.name).join(" and ")}, which raises the risk.</div>}
      {conds.length > 0 && (
        <ul className="conds">
          {conds.map((c,i) => <li key={i} className={c.ok?"met":"unmet"}>{c.l}</li>)}
        </ul>
      )}
      <Facts style={{marginTop:8}} items={[
        {i:"landmark", t:`+${p.pres}`, tip:"Influence gained on delivery"},
        {i:"user-plus", t:`+${p.mg}`, tip:"Members gained on delivery"},
        {i:"users", t:`min ${p.mem}`, tip:"Members needed to apply"},
        p.sr>0 && {i:"user-tie", t:`min ${p.sr}`, tip:"Staff needed to apply"},
      ]}/>
      {(p.part||0) > 0 && (
        <label className="partners">
          <span>Partners</span>
          <input type="range" min={p.part} max={(p.part||0)+10} value={partners} onChange={e => setPartners(Number(e.target.value))} aria-label="Number of partners"/>
          <span className="tnum">{partners}</span>
        </label>
      )}
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
        <button className="btn act" style={{marginTop:0}} disabled={gs && (gs.budget||0) < need} onClick={() => onStart(p, partners)}>
          {gs && (gs.budget||0) < need ? `Needs ${fmt(need)} to start` : `Start project, ${fmt(spendQ)} a quarter`}
        </button>
        <InfoDot label="How payment works" text={`You pay ${fmt(spendQ)} a quarter for ${p.dur} quarter${p.dur===1?"":"s"}; interim payments return ${Math.round(INTERIM_RATE*100)}% as you go.\n\nSuccess pays the balance plus about ${fmt(expGain)}. A failed project is clawed back to ${Math.round(FAIL_RECOVERY*100)}% of its costs.`}/>
      </div>
    </div>
  );
}

function ProjectsModal({ gs, dispatch, onClose, panel }) {
  if (!gs) return null;
  const avail    = availableProjects(gs);
  const locked   = lockedProjects(gs);
  const pm       = byRole(gs.roster,"pm");
  const failRate = failPct(gs);
  const cap      = Math.min(1 + pm, 1 + (gs.stage||0));
  const atCap    = (gs.activeProjects||[]).length >= cap;
  const body = (
    <>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <Facts items={[
          {i:"triangle-exclamation", t:`${failRate}% risk`, tip:"Failure risk for a new project", color:failRate>25?P.redText:undefined},
          {i:"folder-open", t:`${(gs.activeProjects||[]).length} of ${cap} slots`, tip:"Projects running, out of the slots you have", color:atCap?P.redText:undefined},
          {i:"check-double", t:`${(gs.completedProjects||[]).length} done`, tip:"Projects completed"},
        ]}/>
        <InfoDot label="How project risk and slots work" text={`Each Project Manager cuts failure risk by 12%, each Legal Counsel by 8%. Risk rises with your stage and the size of your network.\n\nEach Project Manager adds a slot, up to ${1+(gs.stage||0)} at this stage.`}/>
      </div>
      {avail.length===0 && (
        <div style={{textAlign:"center",padding:32,color:P.muted}}>
          <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}><Icon name="folder-open" size={22} color={P.muted}/></div>
          {atCap
            ? `All ${cap} project slot${cap!==1?"s":""} in use, or recent calls are on cooldown. Hire Project Managers (up to the stage cap) and wait for new call rounds.`
            : <>
                <div style={{fontSize:13,color:P.text,fontWeight:600,marginBottom:10}}>No call is open to you yet</div>
                <div style={{fontSize:12,marginBottom:10}}>Each kind of project needs its specialist:</div>
                <Facts style={{justifyContent:"center",gap:"8px 16px"}} items={[
                  {i:"magnifying-glass-chart", t:"Analyst", tip:"Research projects"},
                  {i:"bullhorn", t:"Communications", tip:"Communications projects"},
                  {i:"graduation-cap", t:"Training", tip:"Training projects"},
                  {i:"landmark", t:"Lobbyist", tip:"Lobbying projects"},
                  {i:"circle-nodes", t:"General Manager", tip:"Networking projects"},
                ]}/>
              </>}
        </div>
      )}
      <div style={{display:"grid",gap:10,maxHeight:panel?"none":"52vh",overflowY:panel?"visible":"auto",paddingRight:panel?0:4}}>
        {avail.map(p => (
          <ProjCard key={p.id} p={p} gs={gs} failRate={failRate} onStart={(pp,n) => { dispatch({type:"startProject",p:pp,n}); onClose(); }}/>
        ))}
      </div>
      {locked.length > 0 && (
        <>
          <div style={{display:"flex",alignItems:"center",gap:6,margin:"18px 0 4px"}}>
            <span style={{fontSize:13,fontWeight:600,color:P.text}}>Not yet available</span>
            <InfoDot label="Why some calls are locked" text="These calls exist at your stage, but you do not yet meet their conditions. The red line under each says what is missing."/>
          </div>
          <ul className="locked">
            {locked.map(p => (
              <li key={p.id}>
                <Icon name="lock" size={11} color={P.muted}/>
                <span style={{color:P.text}}>{p.name}</span>
                <span className="tnum" style={{color:P.muted,display:"inline-flex",alignItems:"center",gap:5}}>
                  <Icon name={p.fund==="eu"?"earth-europe":"building-columns"} size={11} color={P.muted}/>{fmt(projBudget(p, p.part||0))}
                </span>
                <span className="need">Needs {projectConditions(p, gs).filter(c => !c.ok).map(c => c.l).join(", ")}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
  if (panel) return <div style={{padding:"12px 14px 18px"}}>{body}</div>;
  return (
    <Modal title="Available Projects" icon="folder-open" iconColor={P.accent} onClose={onClose} width={720}>{body}</Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   STAFF MODAL
═══════════════════════════════════════════════════════════ */
function StaffModal({ gs, dispatch, onClose, panel }) {
  if (!gs) return null;
  const roster   = gs.roster || [];
  const train    = byRole(roster,"trainer");
  const hr       = byRole(roster,"hr");
  const failRate = failPct(gs);
  const churnPct = Math.max(1, Math.round((6 - train*0.8 - hr*1)*10)/10);
  const infl     = Math.round((salaryInfl(gs.turn)-1)*100);

  const [hoverRole, setHoverRole] = useState(null);
  const detailRole = STAFF_ROLES.find(r => r.id === hoverRole);
  const body = (
    <>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <Facts items={[
          {i:"users", t:`${staffTotal(roster)}`, tip:"Staff on the payroll"},
          {i:"coins", t:`−${fmt(staffCostQ(roster, gs.turn))}/q`, tip:"Salaries a quarter"},
          {i:"sitemap", t:`${visibleStaff(roster)}/${staffSpan(roster)}`, tip:"Management capacity: staff led, out of the most your managers can lead", color:visibleStaff(roster)>=staffSpan(roster)?P.redText:undefined},
          {i:"user-minus", t:`${churnPct}%`, tip:"Members lost each quarter"},
          {i:"triangle-exclamation", t:`${failRate}%`, tip:"Project failure risk"},
        ]}/>
        <InfoDot label="How staffing works" text={`Salaries are up ${infl}% since founding and rise 1% every quarter, for new hires and the whole payroll.\n\nThe General Manager leads 7 people; each Executive Director adds 7. At most 2 of each role, and exactly one General Manager.`}/>
      </div>

      {roster.length > 0 && (
        <>
          <Lbl t={`Team (${roster.length})`}/>
          <ul className="team">
            {STAFF_ROLES.filter(def => byRole(roster, def.id) > 0).map(def => {
              const idxs = roster.map((r,i)=>({r,i})).filter(x => x.r?.role === def.id);
              const count = idxs.length;
              // Firing releases the most recent hire of that role (cheapest severance first)
              const newest = idxs.reduce((a,b) => ((b.r.hiredTurn||0) >= (a.r.hiredTurn||0) ? b : a), idxs[0]);
              return (
                <li key={`team-${def.id}`} title={idxs.map(x => `${x.r.name||"—"}, level ${skillOf(x.r)}`).join("\n")}>
                  <Icon name={def.icon||"user"} size={13} color={P.accent}/>
                  <span className="nm">{def.name}{count>1 ? ` ×${count}` : ""}</span>
                  <span className="tnum mu">−{fmt(roleCost(def, gs.turn)*count)}/q</span>
                  {def.hidden || def.id === "manager"
                    ? <span className="mu" style={{fontSize:11.5}}>required</span>
                    : <button className="btn fire" onClick={() => dispatch({type:"fire",idx:newest.i})} title="Release the most recent hire">Release</button>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginTop:18}}>
        <Lbl t="Hire"/>
        <span style={{fontSize:11.5,color:P.muted}}>Point at a role for details</span>
      </div>
      <div className="hire-grid" onMouseLeave={() => setHoverRole(null)}>
        {STAFF_ROLES.filter(r => !r.hidden).map(staffRole => {
          const price   = roleCost(staffRole, gs.turn);
          const blockReason = hireBlockReason(gs, staffRole.id);
          const afford  = (gs.budget||0) >= price * 3 && !blockReason;
          const count   = byRole(roster, staffRole.id);
          // Capture roleId in a stable variable so the handler dispatches the right role.
          const roleId  = staffRole.id;
          return (
            <button key={`hire-${roleId}`} className="btn hire-tile" disabled={!afford}
              onMouseEnter={() => setHoverRole(roleId)} onFocus={() => setHoverRole(roleId)}
              onClick={() => dispatch({type:"hire",roleId})}
              aria-label={`Hire ${staffRole.name} for ${fmt(price)} a quarter${blockReason ? `. ${blockReason}` : ""}`}>
              {count > 0 && <span className="cnt">{count}</span>}
              <Icon name={staffRole.icon} size={18} color={afford?P.accent:P.muted}/>
              <span className="nm">{staffRole.name}</span>
              <span className="tnum pr">{fmt(price)}/q</span>
            </button>
          );
        })}
      </div>
      {detailRole && <div className="hire-detail" aria-live="polite">
        {(() => {
          const why = hireBlockReason(gs, detailRole.id);
          const price = roleCost(detailRole, gs.turn);
          return (
            <>
              <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                <span style={{fontWeight:600,color:P.text}}>{detailRole.name}</span>
                <span className="tnum" style={{color:P.text,fontWeight:600}}>{fmt(price)} a quarter</span>
              </div>
              <div style={{marginTop:4}}>{detailRole.desc}</div>
              {why ? <div style={{marginTop:4,color:P.redText}}>{why}</div>
                : (gs.budget||0) < price*3 ? <div style={{marginTop:4,color:P.redText}}>Not enough money yet</div> : null}
            </>
          );
        })()}
      </div>}
    </>
  );
  if (panel) return <div style={{padding:"12px 14px 18px"}}>{body}</div>;
  return (
    <Modal title="Staff Management" icon="users" iconColor={P.purple} onClose={onClose} width={740}>{body}</Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   NETWORK MODAL
═══════════════════════════════════════════════════════════ */
function RivalsModal({ gs, dispatch, onClose, panel }) {
  if (!gs) return null;
  const share = marketShare(gs);
  const youPct = Math.min(100, Math.round(((gs.members||0)/Math.max(1,marketPool(gs)))*100));
  const rvPct  = Math.min(100-youPct, Math.round((rivalPressure(gs)/Math.max(1,marketPool(gs)))*100));
  const body = (
    <>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:600,color:P.text}}>Member market</span>
        <InfoDot label="How the rivalry works" text="Rival clusters race you to the Pan-European Cluster Network. Contain them, outmanoeuvre them politically, or buy them out. If every rival folds you win by market consolidation. Collapsed rivals are eventually replaced by new entrants.\n\nRecruitment slows as the member pool in your territory empties; expanding grows the pool."/>
      </div>
      {(gs.coalitionUntil||0) > (gs.turn||0) && (
        <div style={{fontSize:12.5,color:P.redText,margin:"4px 0 8px",display:"flex",gap:7,alignItems:"center"}}>
          <Icon name="triangle-exclamation" size={12} color={P.redText}/> Rivals have formed a coalition for {(gs.coalitionUntil||0)-(gs.turn||0)} more quarters
        </div>
      )}
      <div className="mkt" title={`You ${youPct}%, rivals ${rvPct}%, open ${Math.max(0,100-youPct-rvPct)}%`}>
        <span style={{width:`${youPct}%`,background:P.accent}}/><span style={{width:`${rvPct}%`,background:P.red,opacity:.75}}/>
      </div>
      <Facts style={{marginTop:6}} items={[
        {i:"users", t:`you ${youPct}%`, tip:"Share of the member market you hold"},
        {i:"chess-knight", t:`rivals ${rvPct}%`, tip:"Share pressed by rivals"},
        {i:"seedling", t:`open ${Math.max(0,100-youPct-rvPct)}%`, tip:"Members nobody has recruited yet"},
      ]}/>
      {(gs.rivals||[]).length===0 && <div style={{padding:"24px 0",color:P.accent,fontWeight:600}}>No rivals remain. The market is yours.</div>}
      <div style={{marginTop:14}}>
        {(gs.rivals||[]).map(rv => {
          const arch = archOf(rv);
          const shared = sharedCountries(gs, rv);
          const truce = (rv.truce||0) > (gs.turn||0);
          const hp = Math.max(0, Math.min(100, rv.health ?? 70));
          // Threat: rival is at/above your stage, or close behind and near a stage-up
          const rvRank = (rv.stage||0)*100 + (rv.progress||0);
          const myRank = (gs.stage||0)*100 + (gs.stageProgress||0);
          const ahead = rvRank >= myRank;
          const closing = !ahead && (rv.stage||0) >= (gs.stage||0) && (rv.progress||0) >= 75;
          const status = truce ? ["Truce", P.greenText] : ahead ? ["Ahead of you", P.redText] : closing ? ["Closing in", P.orange] : null;
          return (
            <section key={rv.id} className="rival">
              <div className="rv-head">
                <span className="sw" style={{background:rv.color}}/>
                <span className="nm" title={rv.name}>{rv.name}</span>
                {status && <span className="tag" style={{color:status[1]}}>{status[0]}</span>}
              </div>
              <Facts style={{marginTop:6}} items={[
                {i:"chess-knight", t:arch.label, tip:arch.blurb},
                {i:"flag", t:STAGES[rv.stage]?.name, tip:"Stage"},
                {i:"users", t:`${rv.members||0}`, tip:"Members"},
                {i:"earth-europe", t:`${(rv.countries||[]).length}`, tip:"Countries"},
                shared.length>0 && {i:"triangle-exclamation", t:shared.map(c=>NAME_TO_ISO[c]||c).join(", "), tip:`Contests you in ${shared.join(", ")}`, color:P.redText},
              ]}/>
              <div className="rv-bars">
                <span title={`Progress to their next stage: ${Math.round(rv.progress||0)}%`}><Icon name="arrow-up-right-dots" size={11} color={P.muted}/><span className="bar"><span style={{width:`${Math.min(100,rv.progress||0)}%`,background:rv.color}}/></span></span>
                <span title={`Health ${Math.round(hp)}${hp<=25?", weak enough to buy out":""}`}><Icon name="heart-pulse" size={11} color={P.muted}/><span className="bar"><span style={{width:`${hp}%`,background:hp>60?P.green:hp>30?P.orange:P.red}}/></span></span>
              </div>
              {(rv.scoutedUntil||0) > (gs.turn||0) && (
                <div style={{fontSize:12,color:P.muted,marginTop:6}}>
                  <Icon name="magnifying-glass-chart" size={11} color={P.muted}/> Intel for {(rv.scoutedUntil||0)-(gs.turn||0)} q: {Math.round(rv.progress||0)}% to {STAGES[Math.min(5,(rv.stage||0)+1)]?.name}
                </div>
              )}
              <div className="ops">
                {Object.entries(RIVAL_OPS).map(([opId, op]) => {
                  const cost = op.cost(gs, rv);
                  const ready = opReady(gs, rv.id, opId);
                  const cdLeft = Math.max(0, ((gs.rivalOps||{})[`${rv.id}:${opId}`]||0) - (gs.turn||0));
                  const blocked = !ready ? `available in ${cdLeft} quarters`
                    : (gs.budget||0) < cost ? "not enough money"
                    : opId==="pact" && (gs.prestige||0) < 50 ? "needs influence 50+"
                    : opId==="pact" && truce ? "truce already active"
                    : opId==="acquire" && hp > 25 ? "only when their health is 25 or less"
                    : null;
                  const type = { raid:"rivalRaid", pr:"rivalPR", pact:"rivalPact", acquire:"rivalAcquire", scout:"rivalScout" }[opId];
                  return (
                    <button key={opId} className="btn op" disabled={!!blocked} title={`${op.label}: ${blocked || op.desc}`}
                      aria-label={`${op.label}, ${fmt(cost)}${blocked ? `, ${blocked}` : ""}`}
                      onClick={() => dispatch({type, rid:rv.id})}>
                      <Icon name={op.icon} size={13} color={blocked?P.muted:P.accent}/>
                      <span className="tnum">{fmt(cost)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
  if (panel) return <div style={{padding:"12px 14px 18px"}}>{body}</div>;
  return (
    <Modal title="Rivals" icon="chess-knight" onClose={onClose} width={700}>{body}</Modal>
  );
}

function NetworkModal({ gs, dispatch, onClose, panel }) {
  const [regCountry, setRegCountry] = useState(null);
  if (!gs) return null;
  const sc       = gs.sector?.color || P.accent;
  const prestige = gs.prestige || 0;
  const regDisc0 = (gs.seats||{}).regional ? 0.75 : 1; // Regional S3 Committee seat
  const natDisc0 = (gs.seats||{}).national ? 0.80 : 1; // National Cluster Platform seat
  const rCost    = regionExpansionCost(gs);
  const cCost    = Math.round((prestige*7000 + 150000) * natDisc0);
  const regionLabel = o => regionLabelFor(gs, o.c, o.n);
  const avR      = (gs.countries||[]).flatMap(c => (EU_COUNTRIES[c]||[]).map(n => ({c, n})))
                   .filter(o => !(gs.regions||[]).includes(regionLabel(o)));
  // Only countries that border the existing network can be entered (land borders + ferry links)
  const borderSet = new Set();
  (gs.countries||[]).forEach(c => {
    const nk = (NAME_TO_ISO[c]||c)==="GR" ? "EL" : (NAME_TO_ISO[c]||c);
    (NUTS_BORDERS[nk]||[]).forEach(b => {
      const iso = b==="EL" ? "GR" : b;
      const nm = ISO_TO_NAME[iso];
      if (nm) borderSet.add(nm);
    });
  });
  const capC     = countryCap(gs);
  const atCap    = (gs.countries||[]).length >= capC;
  const avC      = atCap ? [] : Object.keys(EU_COUNTRIES).sort().filter(c => !(gs.countries||[]).includes(c) && borderSet.has(c));
  const coordSalary = roleCost(STAFF_ROLES.find(x => x.id==="coordinator"), gs.turn);
  const mgrSalary   = roleCost(STAFF_ROLES.find(x => x.id==="countrymgr"), gs.turn);
  const occupied = new Set((gs.rivals||[]).flatMap(rv => rv.countries||[]));
  const budget   = gs.budget || 0;

  const body = (
    <>
      <Facts items={[
        {i:"location-dot", t:`${(gs.regions||[]).length} regions`, tip:"Regions with an office"},
        {i:"earth-europe", t:`${(gs.countries||[]).length}/${countryCap(gs)} countries`, tip:"Countries held, out of the most your stage allows"},
        gs.stage >= 1 && {i:"building", t:`${fmt(rCost)}/office`, tip:"Cost of a new regional office"},
        gs.stage >= 2 && {i:"flag", t:`${fmt(cCost)}/country`, tip:"Cost of entering a new country"},
      ]}/>
      <div style={{fontSize:12,color:P.muted,margin:"8px 0 2px",display:"flex",alignItems:"center",gap:7}}>
        <Icon name="map-location-dot" size={12} color={P.accent}/> Or click any region on the map
      </div>

      <ul className="net-list">
        {(gs.countries||[]).map(c => {
          const total  = (EU_COUNTRIES[c]||[]).length;
          const active = (EU_COUNTRIES[c]||[]).filter(n => (gs.regions||[]).includes(regionLabelFor(gs, c, n))).length;
          const full   = (gs.fullCountries||[]).includes(c);
          const home   = c === gs.country;
          return (
            <li key={c} title={full ? "Every region held: national coverage bonus" : "Hold every region for a national coverage bonus"}>
              <Icon name={home ? "star" : full ? "check" : "location-dot"} size={11} color={home||full ? P.accent : P.muted}/>
              <span className="nm">{c}</span>
              <span className="bar"><span style={{width:`${total ? active/total*100 : 0}%`}}/></span>
              <span className="tnum mu">{active}/{total}</span>
            </li>
          );
        })}
      </ul>

      {gs.stage >= 1 && avR.length > 0 && (
        <div style={{marginTop:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:P.text}}>Open an office</span>
            <span className="tnum" style={{fontSize:12,color:P.muted}}>{fmt(rCost)}</span>
            <InfoDot label="About regional offices" text={`Cost rises with influence. Each new region adds a Regional Coordinator at ${fmt(coordSalary)} a quarter.${(gs.seats||{}).regional ? "\n\nYour Regional seat gives 25% off." : ""}`}/>
          </div>
          {(() => {
            const byCountry = {};
            avR.forEach(o => { (byCountry[o.c] = byCountry[o.c] || []).push(o); });
            const cs = Object.keys(byCountry).sort((a,b) => (a===gs.country?-1:b===gs.country?1:a.localeCompare(b)));
            const selC = byCountry[regCountry] ? regCountry : cs[0];
            return (
              <>
                {cs.length > 1 && (
                  <div className="seg" role="group" aria-label="Country" style={{gridTemplateColumns:`repeat(${Math.min(cs.length,4)},1fr)`,marginBottom:8}}>
                    {cs.map(c => (
                      <button key={c} className="btn" onClick={() => setRegCountry(c)} aria-pressed={selC===c}>{c}</button>
                    ))}
                  </div>
                )}
                <div className="ops">
                  {(byCountry[selC]||[]).map(o => (
                    <button key={`${o.c}-${o.n}`} className="btn op" disabled={budget<rCost} title={budget<rCost ? `Needs ${fmt(rCost)}` : `Open an office in ${o.n}`}
                      onClick={() => dispatch({type:"expandRegion",region:regionLabel(o),cost:rCost})}>
                      <Icon name="plus" size={10} color={budget<rCost?P.muted:P.accent}/>{o.n}
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {gs.stage >= 2 && avC.length > 0 && (
        <div style={{marginTop:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:P.text}}>Enter a country</span>
            <span className="tnum" style={{fontSize:12,color:P.muted}}>{fmt(cCost)}</span>
            <InfoDot label="About entering a country" text={`Only countries bordering your network, including ferry links. Each adds a Country Manager to the payroll. Countries where a rival operates cost half as much again.${(gs.seats||{}).national ? "\n\nYour National seat gives 20% off." : ""}`}/>
          </div>
          <div className="ops">
            {avC.map(c => {
              const contested = occupied.has(c);
              const cost = contested ? Math.round(cCost*1.5) : cCost;
              return (
                <button key={c} className="btn op" disabled={budget<cost} onClick={() => dispatch({type:"expandCountry",country:c,cost})}
                  title={`${c}: ${fmt(cost)}${contested ? ", contested by a rival" : ""}`}>
                  <Icon name={contested ? "triangle-exclamation" : "plus"} size={10} color={budget<cost ? P.muted : contested ? P.redText : P.accent}/>{c}
                  {contested && <span className="tnum" style={{color:P.muted}}>{fmt(cost)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {gs.stage >= 2 && atCap && (gs.countries||[]).length < 27 && (
        <div style={{fontSize:12,color:P.muted,marginTop:12,display:"flex",gap:7,alignItems:"center"}}><Icon name="lock" size={11} color={P.muted}/> Your stage allows {capC} countries; evolve to hold more</div>
      )}
      {gs.stage >= 2 && !atCap && avC.length===0 && Object.keys(EU_COUNTRIES).some(c => !(gs.countries||[]).includes(c)) && (
        <div style={{fontSize:12,color:P.muted,marginTop:12}}>No unclaimed country borders your network yet.</div>
      )}
      {gs.stage < 1 && (
        <div style={{textAlign:"center",padding:"28px 8px",color:P.muted,fontSize:12.5}}>
          <div style={{marginBottom:8}}><Icon name="lock" size={18} color={P.muted}/></div>
          Expansion opens at {STAGES[1].name}
        </div>
      )}
    </>
  );
  if (panel) return <div style={{padding:"12px 14px 18px"}}>{body}</div>;
  return (
    <Modal title="Network" icon="earth-europe" onClose={onClose} width={680}>{body}</Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVOLVE MODAL
═══════════════════════════════════════════════════════════ */
function EvolveModal({ gs, dispatch, onClose }) {
  if (!gs) return null;
  const reqs  = evolveReqs(gs);
  const ok    = canEvolve(gs);
  const cost  = evolveCost(gs.stage);
  const stage = STAGES[gs.stage] || STAGES[0];
  const next  = STAGES[Math.min(5, gs.stage+1)];
  const met   = reqs.filter(r => r.ok).length;
  const num   = v => typeof v === "number" ? v : parseFloat(v) || 0;
  return (
    <Modal title="Next stage" icon="arrow-up-right-dots" onClose={onClose} width={520}>
      <div className="evo-head">
        <div><div className="mu">Now</div><div className="st">{stage.name}</div></div>
        <Icon name="arrow-right" size={16} color={P.muted}/>
        <div><div className="mu">Next</div><div className="st" style={{color:P.accent}}>{next.name}</div></div>
        <div style={{marginLeft:"auto",textAlign:"right"}}><div className="mu">Goals met</div><div className="st tnum">{met}/{reqs.length}</div></div>
      </div>
      <ul className="evo-reqs">
        {reqs.map((r,i) => {
          const pct = r.ok ? 100 : Math.max(0, Math.min(100, num(r.req) > 0 ? num(r.cur) / num(r.req) * 100 : 0));
          return (
            <li key={i} className={r.ok ? "ok" : ""}>
              <Icon name={r.ok ? "check" : "circle"} size={11} color={r.ok ? P.greenText : P.muted}/>
              <span className="nm">{r.l}</span>
              <span className="tnum v">{r.money ? fmt(r.cur) : r.cur} / {r.money ? fmt(r.req) : r.req}</span>
              <span className="bar"><span style={{width:`${pct}%`,background:r.ok ? P.green : P.accent}}/></span>
            </li>
          );
        })}
      </ul>
      <button className="btn evo-go" disabled={!ok} onClick={() => { dispatch({type:"evolve"}); onClose(); }}>
        {ok ? `Become ${next.name} for ${fmt(cost)}` : `Costs ${fmt(cost)} once every goal is met`}
      </button>
    </Modal>
  );
}


/* ═══════════════════════════════════════════════════════════
   LOG MODAL
═══════════════════════════════════════════════════════════ */
function LogModal({ gs, onClose }) {
  if (!gs) return null;
  const cols = {project:P.blue, good:P.green, bad:P.red};
  return (
    <Modal title="Event History" icon="clipboard-list" onClose={onClose} width={560}>
      <div style={{maxHeight:"70vh",overflowY:"auto"}}>
        {(gs.log||[]).length===0 && <div style={{textAlign:"center",padding:24,color:P.muted}}>Advance quarters to see history.</div>}
        {(gs.log||[]).map((e,i) => (
          <div key={i} style={{padding:"7px 10px",borderRadius:0,marginBottom:4,background:P.card,border:`1px solid ${(cols[e?.t]||P.border)}22`,display:"flex",gap:7,alignItems:"flex-start"}}>
            <Icon name={LOG_ICON[e?.t]||"circle-info"} size={11} color={cols[e?.t]||P.muted} style={{marginTop:2}}/>
            <div style={{fontSize:11.5,color:cols[e?.t]||P.text,lineHeight:1.5}}>{e?.txt||""}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVENT MODAL
═══════════════════════════════════════════════════════════ */
function EventModal({ ev, onDismiss }) {
  if (!ev) return null;
  const isChoice = ev.t === "choice" || (Array.isArray(ev.choices) && ev.choices.length > 0);
  const isGood   = ev.t === "good";
  const col      = isChoice ? P.blue : isGood ? P.green : P.red;
  const heading  = isChoice ? "DECISION" : isGood ? "OPPORTUNITY" : "ALERT";
  const headingIcon = isChoice ? "scale-balanced" : isGood ? "circle-info" : "triangle-exclamation";
  const headAnim = isChoice ? "" : isGood ? "glow-good" : "wiggle";
  // Build impact lines for simple events
  const lines = [];
  if (!isChoice) {
    if (ev.bfx && ev.bfx!==0) lines.push(`Budget ${ev.bfx>0?"+":""}${Math.abs(ev.bfx)<1?Math.round(ev.bfx*100)+"%":fmt(ev.bfx)}`);
    if (ev.mfx && ev.mfx!==0) lines.push(`Members ${ev.mfx>0?"+":""}${ev.mfx}`);
    if (ev.pfx && ev.pfx!==0) lines.push(`Influence ${ev.pfx>0?"+":""}${ev.pfx}`);
    if (ev.sfx && ev.sfx < 0) lines.push("Staff -1");
  }
  const fxLine = (fx) => {
    const parts = [];
    if (fx.bfx) parts.push(`${fx.bfx>0?"+":""}${Math.abs(fx.bfx)<1?Math.round(fx.bfx*100)+"%":fmt(fx.bfx)} budget`);
    if (fx.mfx) parts.push(`${fx.mfx>0?"+":""}${fx.mfx} members`);
    if (fx.pfx) parts.push(`${fx.pfx>0?"+":""}${fx.pfx} influence`);
    if (fx.loseRole) parts.push(`lose your ${STAFF_ROLES.find(d=>d.id===fx.loseRole)?.name || fx.loseRole}`);
    if (fx.rvHealth && fx.rvHealth.d>0) parts.push(`rival strengthened`);
    if (fx.stealPct) parts.push(`gain ${Math.round(fx.stealPct.pct*100)}% of their members`);
    if (fx.brd) parts.push(`board ${fx.brd>0?"+":""}${fx.brd}`);
    if (fx.sfx < 0) parts.push("lose staff");
    if (fx.rvProg) parts.push(fx.rvProg>0?`rival +${fx.rvProg}% progress`:`rival ${fx.rvProg}% progress`);
    return parts.join(" · ") || "No direct effect";
  };
  return (
    <div className="backdrop-in" style={{position:"fixed",inset:0,background:THEME_DARK?"rgba(2,6,16,.72)":"rgba(15,30,60,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}}>
      <div className="event-in menu-scope glass" style={{padding:"26px 30px 28px",maxWidth:520,width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:700,color:col,letterSpacing:0,marginBottom:10,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}><span className={headAnim} style={{display:"inline-flex"}}><Icon name={headingIcon} size={11} color={col}/></span>{heading}</div>
        <h2 className="title-caps" style={{fontSize:21,marginBottom:10,lineHeight:1.25}}>{ev.n}</h2>
        <p style={{fontSize:13,color:P.muted,lineHeight:1.75,marginBottom:16}}>{ev.d}</p>
        {!isChoice && lines.length > 0 && (
          <div style={{background:P.bright,borderRadius:0,padding:"10px 14px",marginBottom:20,display:"flex",gap:14,flexWrap:"wrap"}}>
            {lines.map((l,i) => {
              const neg = l.startsWith("Budget -")||l.startsWith("Members -")||l.startsWith("Influence -")||l.startsWith("Staff");
              return <span key={i} style={{fontSize:12,fontWeight:700,color:neg?P.red:P.green,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{l}</span>;
            })}
          </div>
        )}
        {isChoice ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {(ev.choices||[]).map((ch, i) => (
              <button key={i} className="btn card-btn" onClick={()=>onDismiss(i)} style={{width:"100%",padding:"13px 16px",color:P.text,fontWeight:500,fontSize:14,textAlign:"left",display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",columnGap:12,rowGap:4,minWidth:0}}>
                <span style={{flexShrink:0}}>{ch.label}</span>
                <span style={{fontSize:11.5,opacity:0.75,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',textAlign:"right",flex:"1 1 auto",minWidth:0,overflowWrap:"anywhere",lineHeight:1.5}}>{fxLine(ch.fx||{})}</span>
              </button>
            ))}
          </div>
        ) : (
          <button className="btn card-btn" onClick={()=>onDismiss(null)} style={{display:"block",width:"100%",padding:"12px 20px",color:P.accent,fontWeight:600,fontSize:14}}>
            {isGood ? "Accept" : "Acknowledge"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATS MODAL  (mobile: full cluster dashboard)
═══════════════════════════════════════════════════════════ */
function csvOfHistory(gs) {
  const rows = [["quarter","turn","budget","members","influence","board"], ...(gs.history||[]).map(h => [`Q${(h.t%4)+1} ${2024+Math.floor(h.t/4)}`, h.t, h.b, h.m, h.p, h.bc])];
  return rows.map(r => r.join(",")).join("\n");
}
function downloadCSV(gs) {
  try {
    const blob = new Blob([csvOfHistory(gs)], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cluster-manager-run-Q${gs.turn||0}.csv`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
  } catch(e) {}
}
function StatsModal({ gs, onClose, dispatch }) {
  if (!gs) return null;
  const stage    = STAGES[gs.stage] || STAGES[0];
  const reqs     = evolveReqs(gs);
  const burnRate = (gs.qStaff||0) + (gs.qOverhead||0) + (gs.qServicing||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
  const runway   = burnRate > 0 ? Math.round((gs.budget||0) / Math.max(1,burnRate)) : 99;
  const failRate = failPct(gs);
  const decay    = [2,3,4,5,6,8][gs.stage] ?? 2;
  const next     = STAGES[Math.min(5,gs.stage+1)];

  const Card = ({children, title}) => <div title={title||undefined} style={{background:"transparent",padding:"14px 0",border:"none",borderTop:`1px solid ${P.border}`,borderRadius:0,cursor:title?"help":"default"}}>{children}</div>;

  return (
    <Modal title="Cluster Dashboard" icon="gauge-high" iconColor={P.accent} onClose={onClose} width={560}>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Card>
          <Lbl t="Treasury"/>
          <div style={{fontSize:26,fontWeight:700,color:(gs.budget||0)<20000?P.red:P.accent,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{fmt(gs.budget||0)}</div>
          <div style={{fontSize:11,color:P.muted,marginTop:4}}>
            <span style={{color:(gs.qNet||0)>=0?P.accent:P.red}}>{(gs.qNet||0)>=0?"+":""}{fmt(gs.qNet||0)}/quarter</span>
            {" · runway "}<span style={{color:runway<3?P.red:runway<6?P.orange:P.green}}>{runway>=99?"∞":runway+"Q"}</span>
          </div>
          <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            <div style={{color:P.accent}}>+{fmt(gs.qMember||0)} <span style={{color:P.muted}}>members</span></div>
            <div style={{color:(gs.qProj||0)>0?P.blue:P.muted}}>+{fmt(gs.qProj||0)} <span style={{color:P.muted}}>projects</span></div>
            <div style={{color:P.red}}>-{fmt(gs.qStaff||0)} <span style={{color:P.muted}}>staff</span></div>
            <div style={{color:P.orange}}>-{fmt(gs.qOverhead||0)} <span style={{color:P.muted}}>overhead</span></div>
            {(gs.qDelivery||0) > 0 && <div style={{color:P.purple,gridColumn:"1 / -1"}}>-{fmt(gs.qDelivery||0)} <span style={{color:P.muted}}>delivery ({fmt(gs.qInterim||0)} interim-covered)</span></div>}
          </div>
        </Card>

        {(gs.activeProjects||[]).length === 0 && (
          <Card><EmptyState icon="folder-open" title="No project running" hint=""/></Card>
        )}
        {(gs.activeProjects||[]).length > 0 && (
          <Card>
            <Lbl t={`Active projects (${gs.activeProjects.length})`}/>
            {gs.activeProjects.map((p, i) => p ? <ActiveProjectRow key={`spr-${i}`} p={p} gs={gs}/> : null)}
          </Card>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Card title={trendTitle(statTrends(gs)?.members, "Plus rival poaching, defections and events.")}>
            <Lbl t="Members"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span className="tnum" style={{fontSize:26,fontWeight:600,letterSpacing:-.5,color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{gs.members||0}</span>
              <Trend t={statTrends(gs)?.members}/>
            </div>
            <div style={{fontSize:11.5,color:P.muted}}>fee {fmt(memberFee(gs.stage))}/quarter · mix ×{(Math.round(feeMult(gs)*100)/100).toFixed(2)}</div>
            {(() => { const mx = mixOf(gs), m = Math.max(1, gs.members||1); return (
              <div style={{marginTop:5}}>
                <div style={{display:"flex",height:5,borderRadius:0,overflow:"hidden",border:`1px solid ${P.border}`}}>
                  <div style={{width:`${Math.round(mx.sme/m*100)}%`,background:P.accent}} title={`SMEs ${mx.sme}`}/>
                  <div style={{width:`${Math.round(mx.corp/m*100)}%`,background:P.gold}} title={`Corporates ${mx.corp}`}/>
                  <div style={{flex:1,background:P.purple}} title={`Research ${mx.res}`}/>
                </div>
                <div style={{fontSize:11,color:P.muted,marginTop:2,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>SME {Math.round(mx.sme/m*100)}% · corp {Math.round(mx.corp/m*100)}% · res {Math.round(mx.res/m*100)}%{cohesionShare(gs)>0?` · cohesion regions ${Math.round(cohesionShare(gs)*100)}%`:""}</div>
                {dispatch && (
                  <div style={{display:"flex",gap:3,marginTop:5,flexWrap:"wrap"}}>
                    {Object.entries(MIX_FOCUS).map(([fid, fo]) => (
                      <button key={fid} className="btn" onClick={() => dispatch({type:"setFocus", focus:fid})}
                        aria-pressed={(gs.focus||"balanced")===fid}>
                        {fo.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ); })()}
          </Card>
          {(gs.history||[]).length >= 3 && (
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Lbl t={`History · last ${Math.min(60,(gs.history||[]).length)} quarters`}/>
                <button className="btn" onClick={() => downloadCSV(gs)} title="Export the full run history as CSV" style={{padding:"2px 8px",borderRadius:0,border:`1px solid ${P.border}`,background:"transparent",color:P.muted,fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>CSV ⬇</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"6px 14px",marginTop:2}}>
                {[["Treasury","b",P.accent],["Members","m",P.gold],["Influence","p",P.purple],["Board","bc",P.green]].map(([lbl,k,col]) => (
                  <div key={k}>
                    <div style={{fontSize:11,color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{lbl}</div>
                    <Sparkline data={(gs.history||[]).slice(-60).map(x=>x[k]||0)} color={col}/>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card>
            <Lbl t="Staff"/>
            <div style={{fontSize:22,fontWeight:700,color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{staffTotal(gs.roster)}</div>
            <div style={{fontSize:11.5,color:P.muted}}>fail risk <span style={{color:failRate>25?P.red:failRate>15?P.orange:P.green}}>{failRate}%</span></div>
          </Card>
        </div>

        <Card>
          <Lbl t="Influence"/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:22,fontWeight:700,color:P.purple,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{Math.round(gs.prestige||0)}</span>
            <span style={{fontSize:11.5,color:P.muted}}>fades -{decay}/quarter</span>
          </div>
          <Bar val={gs.prestige||0} color={P.purple}/>
          
          <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${P.border}`}}>
            <div style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:4}}>Seats</div>
            {seatStatus(gs).map(st => (
              <div key={st.id} className="seat-full">
                <div className="seat-row" style={{cursor:"default"}}>
                  <Icon name={({regional:"building-columns",national:"landmark",eu:"earth-europe"})[st.id]||"landmark"} size={13} color={st.held?P.accent:P.muted}/>
                  <span style={{flex:1,color:P.text,fontWeight:500}}>{st.label}</span>
                  {st.held ? <span style={{color:P.accent,fontWeight:600}}>Yours</span>
                    : st.heldBy ? <span style={{color:P.redText,fontWeight:600,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{st.holderName}</span>
                    : <span style={{color:P.muted}}>Open</span>}
                </div>
                <div style={{fontSize:12,color:P.muted,margin:"0 0 0 21px"}}>{String(st.effects||"").replace(/ · /g, ", ")}</div>
                {!st.held && <ul className="conds" style={{margin:"6px 0 0 21px"}}>{st.reqs.map((c,i) => <li key={i} className={c.ok?"met":"unmet"}>{c.l}</li>)}</ul>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Lbl t="Board confidence"/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:22,fontWeight:700,color:(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{Math.round(gs.boardConf||0)}</span>
            <span style={{fontSize:11.5,color:P.muted}}>/ 100</span>
          </div>
          <Bar val={gs.boardConf||0} color={(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green}/>
          {(gs.boardConf||0)<30 && <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11.5,color:P.red,marginTop:4}}><Icon name="triangle-exclamation" size={10} color={P.red}/>Crisis: +3% extra member churn</div>}
        </Card>

        {gs.stage < 5 && (
          <Card>
            <Lbl t={<>Evolve <Icon name="arrow-right" size={10} color={P.muted} style={{margin:"0 4px"}}/>{next?.name||""}</>}/>
            <div style={{display:"grid",gap:4,marginTop:2}}>
              {reqs.map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:r.ok?P.green:P.muted}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>{r.ok?<Icon name="check" size={9} color={P.green}/>:<Icon name="circle" size={4} color={P.muted}/>} {r.l}</span>
                  <span>{r.money?fmt(r.cur):r.cur} / {r.money?fmt(r.req):r.req}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:6,fontSize:11.5,color:P.muted}}>Evolution cost: <span style={{color:P.red}}>{fmt(evolveCost(gs.stage))}</span></div>
          </Card>
        )}

        {(gs.rivals||[]).length > 0 && (
          <Card>
            <Lbl t={<>Rival Race · first to a Pan-European Cluster Network</>}/>
            {(gs.rivals||[]).map(rv => (
              <div key={rv.id} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
                  <span style={{color:rv.color,display:"inline-flex",alignItems:"center",gap:5}}><Icon name="square" size={7} color={rv.color}/> {rv.name} · {NAME_TO_ISO[rv.country]||""}</span>
                  <span style={{color:rv.stage>gs.stage?P.red:P.muted}}>{STAGES[rv.stage]?.name} · {rv.members} members</span>
                </div>
                <Bar val={rv.stage*100+(rv.progress||0)} max={500} color={rv.color} h={3}/>
              </div>
            ))}
          </Card>
        )}

        <Card>
          <Lbl t="Network"/>
          <div style={{display:"flex",gap:16,fontSize:12,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            <span style={{color:P.blue}}>{(gs.countries||[]).length} countries</span>
            <span style={{color:P.teal}}>{(gs.regions||[]).length} regions</span>
            <span style={{color:P.muted}}>{(gs.completedProjects||[]).length} projects done</span>
          </div>
        </Card>
      </div>
    </Modal>
  );
}


/* ═══════════════════════════════════════════════════════════
   SETUP SCREEN
═══════════════════════════════════════════════════════════ */
function RulesModal({ onClose }) {
  const H = ({t}) => <div style={{fontSize:12,fontWeight:700,color:P.blue,letterSpacing:0,margin:"16px 0 6px",fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{t}</div>;
  const T = ({children}) => <div style={{fontSize:11.5,color:P.text,lineHeight:1.65,marginBottom:6}}>{children}</div>;
  const B = ({children}) => <strong style={{color:P.blue}}>{children}</strong>;
  return (
    <Modal title="How to Play" icon="circle-question" iconColor={P.accent} onClose={onClose} width={760}>
      <div style={{maxHeight:"68vh",overflowY:"auto",paddingRight:8}}>
        <T>You run a <B>cluster organisation</B>: a body that connects companies, universities and public authorities in one industrial ecosystem. Starting as a small regional initiative, grow it into the <B>Pan-European Cluster Network</B> — or outlast every rival and win by <B>market consolidation</B>. You lose if the board's confidence hits zero, the money runs out, or a rival builds the Network first.</T>

        <H t="The quarterly loop"/>
        <T>Each turn is one quarter. Hire staff, launch projects, expand the network, run rivalry operations, then press <B>Next Quarter</B>: salaries and overheads are paid, projects progress, members pay fees, rivals move, and events may demand decisions. Nothing advances without a <B>General Manager</B> — the cluster has exactly one boss, and losing them halts operations until you rehire.</T>

        <H t="Money: projects are investments"/>
        <T>Publicly funded projects don't hand you their volume — <B>you finance the delivery</B> in equal quarterly instalments. Interim payments reimburse 70% as you go; on success the final payment settles the balance <B>plus a margin</B> (local ~15% → EU ~32%, improved by seats, PMs, S3 alignment and difficulty). On failure an audit claws you back to 60% of costs — a real loss. Every call shows its cash-flow deal and enabling conditions (members, influence, board, liquidity…) before you commit. Membership fees are your steady income; salaries inflate +1% every quarter.</T>

        <H t="Team rules"/>
        <T><B>One General Manager</B>, always. The GM manages up to 7 staff; each <B>Executive Director adds 7</B> (span of control). Balance rule: no role may exceed a third of the visible team. Legal Counsel is required to evolve past Stage 2 (1/2/3). Expanding hires <B>mandatory office staff</B> — a Regional Coordinator per region, a Country Manager per country — who can never be dismissed while the office exists. To hire, you need <B>three quarters of the new salary</B> in the treasury.</T>

        <H t="Network & geography"/>
        <T>Expand region by region across a real NUTS-2 map. New countries must <B>border your network</B> (ferry links count), and international reach is capped by maturity: a National Association manages <B>3</B> countries, a Cross-Border Metacluster <B>9</B>, an EU Platform <B>19</B>. Activating every region of a country earns a <B>national coverage bonus</B> (halved while a rival operates there). Each office adds coordination overhead and risk.</T>

        <H t="Influence & political seats"/>
        <T><B>Influence</B> is your standing with public authorities — earned by delivering projects and by comms, policy and research staff; it fades every quarter. Sustained influence wins permanent <B>seats</B>: the Regional S3 Committee, the National Cluster Platform and the EU High-Level Group — each with one chair, granting better margins, cheaper expansion, protection from poaching and slower rivals. Rivals race you for vacant chairs; take theirs back by out-influencing them (threshold +15).</T>

        <H t="Rivals"/>
        <T>Three rival clusters race you to Stage 5, each with a personality — Poacher, Brussels Insider, Expansionist, Deliverer or Discounter. They expand across the map, contest your funding calls when ahead, raid your members where networks overlap, and draw from the same <B>finite member market</B>. Fight back from the Rivals tab: <B>Talent Raids</B>, <B>PR Campaigns</B>, <B>Consortium pacts</B> (12-quarter truce, better margins), and <B>Acquisitions</B> of collapsing rivals (health ≤ 25). Rival health erodes under pressure — a rival at zero folds, and its members scatter. Collapsed rivals are eventually replaced by <B>new entrants</B>, so the field refills; only eliminating the <B>last</B> rival ends the race in market consolidation. If you lead the whole field at Metacluster level, rivals may form a temporary <B>coalition</B> against you — a consortium pact with any of them breaks it. The <B>Scout</B> operation reveals a rival's exact plans and blunts their poaching for four quarters.</T>

        <H t="The board"/>
        <T>The board watches your runway, influence, churn and project record. Completions and seats build confidence; failures, thin reserves and stagnation drain it. At zero, the cluster is dissolved.</T>

        <H t="Evolution"/>
        <T>Six stages: Cluster Initiative → Cluster Organisation → National Association → Cross-Border Metacluster → EU Platform → <B>Pan-European Cluster Network</B>. Each evolution demands staff, members, money, influence, geography and delivered projects — the requirements panel on the left always shows what's missing. From National Association onward the cluster becomes <B>cross-ecosystem</B>: permanently S3-aligned everywhere, but competing with every rival for members.</T>
        <T><B>Member composition.</B> Your members are SMEs (fee ×0.8, volatile), corporates (fee ×2.1; a 35%+ corporate share adds board confidence) and research institutes (fee ×0.5; a 20%+ research share improves research-project margins). Set a recruitment focus on the Members card to steer who joins. Regions with <B>Emerging</B> innovation status carry cohesion-fund intensity: richer regional and national margins, slightly riskier delivery.</T>
        <T><B>Staff.</B> Every hire is a named person with a skill level (1–5) that grows every 10 quarters and boosts their output by 10% per level; about one in eight is a star who starts at level 3. Top performers occasionally demand raises. <B>Scenarios</B> change your starting position, <B>achievements</B> reward particular feats, and a seed on the setup screen makes campaign starts reproducible — copy a <B>challenge code</B> from the report card so a friend can race the identical start. Shortcuts: Space = next quarter, 1–4 = panels, U = undo (Junior/Officer, one step), Esc = close.</T>

        <H t="Difficulty"/>
        <T><B>Junior</B> softens failure odds, margins, seed capital and rival pressure; <B>Officer</B> is a fair fight; <B>Expert</B> is the unforgiving original calibration. Old saves play on Expert.</T>
      </div>
    </Modal>
  );
}

// The setup map: Europe in outline, your country and region lit up as you choose them.
// The region a real cluster is based in, only when its name or city says so
// (directly or through a local-language name). Unmatched clusters return "".
function regionFromLabel(countryName, city, clusterLabel) {
  const regs = REGIONS_BY_COUNTRY[countryName] || [];
  if (regs.length === 1) return regs[0].name;
  const hay = `${clusterLabel || ""} ${city || ""}`.toLowerCase();
  const named = regs.find(r => {
    const n = r.name.toLowerCase();
    if (hay.includes(n)) return true;
    const stem = n.split(/[ -]/)[0];
    return stem.length >= 5 && hay.includes(stem);
  });
  if (named) return named.name;
  const viaAlias = Object.keys(REGION_ALIASES).find(al => hay.includes(al));
  const hit = viaAlias && regs.find(r => r.name === REGION_ALIASES[viaAlias]);
  return hit ? hit.name : "";
}
// Number-pair extraction for bounding boxes of SVG path strings.
const pathBox = d => {
  const n = String(d).match(/-?\d+\.?\d*/g) || [];
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for (let i=0;i+1<n.length;i+=2){ const x=+n[i], y=+n[i+1]; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  return { x0, y0, x1, y1, cx:(x0+x1)/2, cy:(y0+y1)/2 };
};
// NUTS-2 polygons of each region record in a country; far-flung outliers (overseas
// territories) are left out of the zoom frame so the mainland fills the view.
function countryRegionShapes(country) {
  return (REGION_RECORDS[country]||[]).map(rec => {
    const codes = rec.nuts && NUTS2_PATHS[rec.nuts] ? [rec.nuts] : [];
    const boxes = codes.map(k => pathBox(NUTS2_PATHS[k]));
    const box = boxes.reduce((m,b) => ({x0:Math.min(m.x0,b.x0),y0:Math.min(m.y0,b.y0),x1:Math.max(m.x1,b.x1),y1:Math.max(m.y1,b.y1)}), {x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity});
    return { rec, codes, box, cx:(box.x0+box.x1)/2, cy:(box.y0+box.y1)/2 };
  }).filter(r => r.codes.length);
}
function frameFor(shapes) {
  if (!shapes.length) return null;
  const xs = shapes.map(s=>s.cx).sort((a,b)=>a-b), ys = shapes.map(s=>s.cy).sort((a,b)=>a-b);
  const mx = xs[Math.floor(xs.length/2)], my = ys[Math.floor(ys.length/2)];
  const near = shapes.filter(s => Math.hypot(s.cx-mx, s.cy-my) < 140);
  const use = near.length ? near : shapes;
  const x0=Math.min(...use.map(s=>s.box.x0)), y0=Math.min(...use.map(s=>s.box.y0));
  const x1=Math.max(...use.map(s=>s.box.x1)), y1=Math.max(...use.map(s=>s.box.y1));
  const pad = Math.max(12, Math.max(x1-x0, y1-y0) * 0.14);
  return [x0-pad, y0-pad, (x1-x0)+pad*2, (y1-y0)+pad*2];
}
const EUROPE_VIEW = [-40, -30, 690, 680];

// The setup map is also a picker: click a country to zoom in, then click a
// region. Each region shows how many real clusters are based there.
function SetupMap({ country, region, counts, onCountry, onRegion, onEurope }) {
  const iso = country ? isoToNuts(NAME_TO_ISO[country] || "") : null;
  const shapes = useMemo(() => country ? countryRegionShapes(country) : [], [country]);
  const target = useMemo(() => (country && frameFor(shapes)) || EUROPE_VIEW, [country, shapes]);
  const [vb, setVb] = useState(target);
  const [hov, setHov] = useState(null);
  const vbRef = useRef(vb);
  useEffect(() => {
    const from = vbRef.current, to = target, t0 = (typeof performance !== "undefined" ? performance.now() : 0);
    if (typeof requestAnimationFrame === "undefined") { vbRef.current = to; setVb(to); return; }
    let raf;
    const step = now => {
      const t = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - t, 3);
      const cur = from.map((v,i) => v + (to[i]-v)*e);
      vbRef.current = cur; setVb(cur);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  const k = vb[2] / 560;                    // map units per screen pixel, roughly
  const zoomed = !!country;
  const label = hov || region || country;
  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <svg viewBox={vb.join(" ")} preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={country ? `Map with ${region || country} highlighted` : "Map of Europe"}
        style={{width:"100%",height:"100%",display:"block"}}>
        <path d={NEIGHBOUR_LAND} fill={THEME_DARK ? "#16244A" : "#E6EBF2"} stroke="none"/>
        <path d={CANDIDATE_LAND} fill={THEME_DARK ? "#1A2A55" : "#DCE4F1"} stroke="none"/>
        {NUTS0_KEYS.map(k0 => {
          const name = ISO_TO_NAME[nutsToIso(k0)];
          const pickable = !zoomed && name && REGION_RECORDS[name];
          const isSel = k0 === iso;
          return (
            <path key={k0} d={NUTS0_PATHS[k0]} data-country={name}
              fill={isSel ? (zoomed ? (THEME_DARK ? "#0F1B3D" : "#FFFFFF") : `${P.accent}30`) : hov && hov === name ? `${P.accent}22` : (THEME_DARK ? "#0F1B3D" : "#FFFFFF")}
              stroke={isSel ? P.accent : (THEME_DARK ? "#2C3D70" : "#C6D0DE")} strokeWidth={isSel ? 1.4 : 0.7} vectorEffect="non-scaling-stroke" strokeLinejoin="round"
              opacity={zoomed && !isSel ? 0.55 : 1}
              style={{cursor:pickable ? "pointer" : "default",transition:"fill .2s ease, opacity .3s ease"}}
              onMouseEnter={pickable ? () => setHov(name) : undefined} onMouseLeave={pickable ? () => setHov(null) : undefined}
              onClick={pickable && onCountry ? () => onCountry(name) : undefined}/>
          );
        })}
        {zoomed && shapes.map(sh => {
          const isSel = sh.rec.name === region, isHov = sh.rec.name === hov;
          return (
            <g key={sh.rec.name} data-region={sh.rec.name} style={{cursor:"pointer"}}
              onMouseEnter={() => setHov(sh.rec.name)} onMouseLeave={() => setHov(null)}
              onClick={() => onRegion && onRegion(sh.rec.name)}>
              {sh.codes.map(c => (
                <path key={c} d={NUTS2_PATHS[c]} fill={isSel ? P.accent : isHov ? `${P.accent}33` : (THEME_DARK ? "#13224A" : "#F7F9FC")}
                  stroke={isSel || isHov ? P.accent : (THEME_DARK ? "#3A4E86" : "#B9C5D8")} strokeWidth={isSel ? 1.6 : 0.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round"/>
              ))}
            </g>
          );
        })}
        {zoomed && counts && shapes.filter(sh => counts[sh.rec.name] > 0).map(sh => (
          <g key={`n-${sh.rec.name}`} pointerEvents="none">
            <circle cx={sh.cx} cy={sh.cy} r={9*k} fill={sh.rec.name === region ? "#FFFFFF" : P.accent} stroke="#FFFFFF" strokeWidth={1.5} vectorEffect="non-scaling-stroke"/>
            <text x={sh.cx} y={sh.cy + 3.6*k} textAnchor="middle" fontSize={10*k} fontWeight="700" fontFamily="Helvetica, Arial, sans-serif" fill={sh.rec.name === region ? P.accent : "#FFFFFF"}>{counts[sh.rec.name]}</text>
          </g>
        ))}
      </svg>
      {zoomed && onEurope && (
        <button className="btn link" onClick={onEurope} style={{position:"absolute",top:14,left:16}}>
          <Icon name="chevron-left" size={11} color={P.accent}/> Europe
        </button>
      )}
      <div style={{position:"absolute",left:20,bottom:18,fontSize:13,color:P.muted,pointerEvents:"none"}}>
        {label ? <span style={{color:P.text,fontWeight:600}}>{label}</span> : "Click a country to start"}
        {zoomed && !hov && !region ? <span>: click a region</span> : null}
        {zoomed && counts && (hov || region) && counts[hov || region] > 0 ? <span>, {counts[hov || region]} real cluster{counts[hov || region]===1?"":"s"}</span> : null}
      </div>
    </div>
  );
}


function Setup({ onStart, canResume, onResume, mobile, dark, onTheme, onOpenSlots }) {
  const [showRules, setShowRules] = useState(false);
  const [diff, setDiff] = useState("officer");
  const [scenario, setScenario] = useState("classic");
  const [seed, setSeed] = useState("");
  const [challengeIn, setChallengeIn] = useState("");
  const [challengeApplied, setChallengeApplied] = useState(false);
  const applyChallenge = code => {
    const p = parseChallenge(code);
    if (p) { setSeed(p.seed||""); if (DIFFICULTIES[p.difficulty]) setDiff(p.difficulty); if (SCENARIOS.some(x=>x.id===p.scenario)) setScenario(p.scenario); }
    setChallengeApplied(!!p);
    return !!p;
  };
  // A shared challenge link (?cm=CM1|…) sets up the identical campaign on open,
  // so nobody has to copy a code across by hand.
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("cm");
      if (code && parseChallenge(code)) {
        applyChallenge(code);
        setChallengeIn(code);
        // clear the parameter so a later reload starts fresh
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch (e) {}
  }, []);
  const [step, setStep]     = useState(0);
  const [country, setCountry] = useState("");
  const [region,  setRegion]  = useState("");
  const [sector,  setSector]  = useState(null);
  const [clusterName, setClusterName] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [adopted, setAdopted] = useState(null); // the registry profile you took on, if any
  // Choosing a registry profile fixes the country and ecosystem together, which
  // avoids offering combinations the registry has no profiles for.
  const registryMatches = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return ECCP_CLUSTERS
      .filter(c => c.e && ISO_TO_NAME[c.c] && EU_COUNTRIES[ISO_TO_NAME[c.c]] &&
                   (c.n.toLowerCase().includes(q) || (c.y||"").toLowerCase().includes(q)))
      .slice(0, 40);
  }, [nameQuery]);
  // Adopting a registry profile fills in everything it implies, so you land on
  // the launch step with a complete setup rather than an empty picker. The
  // registry records a city rather than a NUTS-2 region, so the region is a best
  // guess: the city's own region if the names match, otherwise a region that
  // actually lists this ecosystem as a priority, so the cluster starts aligned.
  // Cluster names usually carry their region in the local language ("Photonics
  // Bretagne"), while the game lists regions in English, so match through both.
  const guessRegion = (countryName, ecoName, city, clusterLabel) => {
    const regs = REGIONS_BY_COUNTRY[countryName] || [];
    if (!regs.length) return "";
    const hay = `${clusterLabel || ""} ${city || ""}`.toLowerCase();
    // Cluster names very often carry their region ("Lombardy Mobility Cluster",
    // "Silesian Aviation Cluster"), so the name is a better clue than the city.
    const named = regs.find(r => {
      const n = r.name.toLowerCase();
      if (hay.includes(n)) return true;
      const stem = n.split(/[ -]/)[0];
      return stem.length >= 5 && hay.includes(stem);
    });
    if (named) return named.name;
    const viaAlias = Object.keys(REGION_ALIASES).find(a => hay.includes(a));
    if (viaAlias) {
      const hit = regs.find(r => r.name === REGION_ALIASES[viaAlias]);
      if (hit) return hit.name;
    }
    const aligned = regs.find(r => ecosystemAligns(r, ecoName));
    return (aligned || regs[0]).name;
  };
  // Real clusters per region of the chosen country, for the map badges and the region list.
  const regionCounts = useMemo(() => {
    const counts = {}, byRegion = {};
    if (!country) return { counts, byRegion };
    const iso = NAME_TO_ISO[country];
    ECCP_CLUSTERS.forEach(c => {
      if (c.c !== iso) return;
      const r = c.r || regionFromLabel(country, c.y, c.n);
      if (!r) return;
      counts[r] = (counts[r]||0) + 1;
      (byRegion[r] = byRegion[r] || []).push(c);
    });
    return { counts, byRegion };
  }, [country]);
  const adoptCluster = c => {
    const cn = ISO_TO_NAME[c.c];
    const eco = ECOSYSTEMS.find(e => e.id === c.e);
    setClusterName(c.n);
    setCountry(cn);
    setSector(eco || null);
    setRegion(c.r || guessRegion(cn, eco?.name, c.y, c.n));
    setNameQuery("");
    setAdopted({ name: c.n, city: c.y, country: cn });
    setStep(2);
  };

  const sel = (active, col=P.accent) => ({
    padding:"9px 12px", borderRadius:8, border:`1px solid ${active?P.accent:P.border}`,
    background:active?`${P.accent}0F`:P.panel, color:P.text, boxShadow:active?`inset 0 0 0 1px ${P.accent}`:"none",
    cursor:"pointer", fontSize:13, fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight:500, textAlign:"left", transition:"all .1s", width:"100%", display:"block",
  });

  return (
    <div className="setup" style={{height:"100dvh",background:P.bg,display:"flex",padding:mobile?16:28,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',color:P.text,overflowY:"auto",overflowX:"hidden"}}>
      <div style={{width:"100%",maxWidth:1120,margin:"auto",display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(0,1fr) minmax(0,520px)",gap:mobile?18:40,alignItems:"stretch"}}>
      {!mobile && (
        <div className="setup-map" style={{position:"relative",alignSelf:"stretch",minHeight:480,borderRadius:16,overflow:"hidden",background:THEME_DARK?"#081131":"#DCE6F2"}}>
          <SetupMap country={country} region={region} counts={regionCounts.counts}
            onCountry={c => { setCountry(c); setRegion(""); setStep(1); }}
            onRegion={r => { setRegion(r); setStep(1); }}
            onEurope={() => { setCountry(""); setRegion(""); setStep(0); }}/>
        </div>
      )}
      <div style={{width:"100%",paddingBottom:8}}>
        <div style={{textAlign:"left",marginBottom:mobile?18:24}}>
          <div style={{fontSize:11,letterSpacing:0,fontWeight:600,color:P.muted,marginBottom:"clamp(6px,1.2vh,12px)",display:"inline-flex",alignItems:"center",gap:8}}>
            <span aria-hidden="true" style={{color:"#FFCC00",fontSize:14,lineHeight:1}}>★</span>EU industrial strategy simulation</div>
          <h1 className="brand-title" style={{fontSize:mobile?38:48,fontWeight:700,lineHeight:1,margin:"0 0 10px",letterSpacing:-2}}>Cluster Manager</h1>
          <div style={{fontSize:15,color:P.muted,lineHeight:1.45,maxWidth:"40ch"}}>Grow a regional cluster into an EU-wide cluster network.</div>
          {canResume && (
            <div style={{marginTop:16}}>
              <button className="btn" onClick={onResume} style={{padding:"12px 24px",borderRadius:8,border:"none",background:P.accent,color:P.onAccent,fontWeight:700,fontSize:15,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
                <Icon name="play" size={11} color="currentColor" style={{marginRight:8}}/> Continue saved game
              </button>
              
            </div>
          )}
          {onOpenSlots && (
            <div style={{marginTop:canResume?4:16}}>
              <button className="btn" onClick={onOpenSlots} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontWeight:700,fontSize:12,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',display:"inline-flex",alignItems:"center",gap:6}}>
                <Icon name="floppy-disk" size={12} color={P.muted}/> Load a saved slot
              </button>
            </div>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-start",gap:10,marginBottom:16}}>
          {[["Country","location-dot"],["Region","map-location-dot"],["Ecosystem","industry"]].map(([l,ic],i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:i<=step?P.accent:"transparent",border:`1px solid ${i<=step?P.accent:P.border}`}}><Icon name={ic} size={12} color={i<=step?P.onAccent:P.muted}/></span>
              <span style={{fontSize:13,fontWeight:i===step?600:400,color:i===step?P.text:P.muted}}>{l}</span>
              {i<2 && <div style={{width:28,height:1,background:P.border}}/>}
            </div>
          ))}
        </div>

        <div style={{background:P.panel,borderRadius:12,padding:mobile?18:24,border:`1px solid ${P.border}`,boxShadow:"0 1px 0 rgba(11,27,63,.04),0 10px 30px rgba(11,27,63,.08)"}}>
          {step===0 && (
            <>
              <div style={{marginBottom:18}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Scenario</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8}}>
                  {SCENARIOS.map(sc => (
                    <button key={sc.id} className="btn" onClick={() => setScenario(sc.id)} aria-pressed={scenario===sc.id} title={sc.desc}
                      style={{...sel(scenario===sc.id),display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,padding:"11px 12px",fontSize:12.5,fontWeight:500}}>
                      <Icon name={({classic:"flag",rescue:"hand-holding-dollar",late:"hourglass-half",merger:"circle-nodes"})[sc.id]||"flag"} size={16} color={scenario===sc.id?P.accent:P.muted}/>
                      {sc.name}
                    </button>
                  ))}
                </div>
                
                <details style={{marginTop:6}} open={!!challengeApplied || !!seed}>
                  <summary style={{fontSize:12.5,color:P.accent,cursor:"pointer",userSelect:"none"}}>Seed or challenge code</summary>
                <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
                  <input value={seed} onChange={e=>setSeed(e.target.value)} placeholder="Seed (optional)" aria-label="Optional seed for a reproducible campaign" title="Any text: two players with the same seed, scenario and difficulty get an identical campaign start"
                    style={{flex:"1 1 120px",minWidth:0,padding:"6px 9px",borderRadius:0,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',outline:"none"}}/>
                  <input value={challengeIn} onChange={e=>{ setChallengeIn(e.target.value); applyChallenge(e.target.value); }} placeholder="Paste challenge code…" aria-label="Paste a friend's challenge code" title="A friend's CM1 code sets seed, difficulty and scenario automatically"
                    style={{flex:"1 1 150px",minWidth:0,padding:"6px 9px",borderRadius:0,border:`1px dashed ${P.border}`,background:P.panel,color:P.text,fontSize:11,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',outline:"none"}}/>
                </div>
                </details>
                {challengeApplied && <div style={{fontSize:11.5,color:P.greenText,marginTop:5,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>✓ Challenge loaded: {DIFFICULTIES[diff]?.label} · {SCENARIOS.find(x=>x.id===scenario)?.name} · pick your country to match</div>}
              </div>
              <div style={{marginBottom:18}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Start as a real cluster</div>
                <input value={nameQuery} onChange={e=>setNameQuery(e.target.value)} placeholder="Search 1,400+ real clusters by name or city…" aria-label="Search real cluster organisations"
                  style={{width:"100%",boxSizing:"border-box",padding:"7px 10px",borderRadius:0,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontSize:12,outline:"none"}}/>
                {registryMatches.length > 0 && (
                  <div style={{maxHeight:168,overflowY:"auto",marginTop:6,border:`1px solid ${P.border}`,borderRadius:0}}>
                    {registryMatches.map((c,i) => (
                      <button key={`${c.n}-${i}`} className="btn" onClick={()=>adoptCluster(c)}
                        style={{display:"block",width:"100%",textAlign:"left",padding:"7px 10px",border:"none",borderBottom:`1px solid ${P.border}`,background:"transparent",color:P.text,fontSize:11.5,lineHeight:1.35}}>
                        <span style={{fontWeight:600}}>{c.n}</span>
                        <span style={{color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',fontSize:11.5}}>{"  "}{c.y ? c.y+", " : ""}{c.c} · {ECOSYSTEMS.find(e=>e.id===c.e)?.name || c.e}</span>
                      </button>
                    ))}
                  </div>
                )}
                {nameQuery.trim().length >= 2 && registryMatches.length === 0 && (
                  <div style={{fontSize:11.5,color:P.muted,marginTop:6}}>No match</div>
                )}
                <div style={{fontSize:11,color:P.muted,marginTop:7,lineHeight:1.45}}>
                  Names: European Cluster Collaboration Platform. Events are fiction.
                </div>
              </div>

              <div style={{marginBottom:2,fontSize:13,fontWeight:600}}>Or pick a country</div>
              
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:6,maxHeight:290,overflowY:"auto",paddingRight:4}}>
                {Object.keys(EU_COUNTRIES).sort().map(c => (
                  <button key={c} className="btn" style={sel(country===c)} onClick={() => { setCountry(c); setStep(1); }}>{c}</button>
                ))}
              </div>
            </>
          )}
          {step===1 && (
            <>
              <button className="btn" onClick={() => setStep(0)} style={{background:"none",border:"none",color:P.accent,fontSize:13,marginBottom:12,padding:0,fontFamily:"inherit",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}><Icon name="arrow-left" size={11} color={P.accent}/> Back</button>
              <div style={{marginBottom:10,fontSize:13,fontWeight:600}}>Region in {country}</div>
              
              {region && (
                <div className="region-pick" style={{marginBottom:14,padding:"12px 14px",borderRadius:10,background:P.bright}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                    <span style={{fontSize:14,fontWeight:600}}>{region}</span>
                    <button className="btn" onClick={() => setStep(2)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:P.accent,color:P.onAccent,fontSize:12.5,fontWeight:600}}>
                      Start my own cluster here
                    </button>
                  </div>
                  {(regionCounts.byRegion[region]||[]).length > 0 && (
                    <>
                      <div style={{fontSize:12,color:P.muted,margin:"10px 0 6px"}}>Or take over</div>
                      <div style={{display:"grid",gap:4,maxHeight:180,overflowY:"auto"}}>
                        {regionCounts.byRegion[region].map((c,i) => (
                          <button key={`${c.n}-${i}`} className="btn real-pick" onClick={() => { adoptCluster(c); setRegion(region); }}>
                            <span className="nm">{c.n}</span>
                            <span className="mu"><Icon name={(ECOSYSTEMS.find(e=>e.id===c.e)||{}).icon||"industry"} size={11} color={P.muted}/> {(ECOSYSTEMS.find(e=>e.id===c.e)||{}).name||"You choose the ecosystem"}{c.y ? `, ${c.y}` : ""}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:5,maxHeight:300,overflowY:"auto",paddingRight:4}}>
                {(REGION_RECORDS[country]||[]).map(rec => {
                  const strong = /Leader|Strong/.test(rec.ris||"");
                  return (
                    <button key={rec.name} className="btn" style={{...sel(region===rec.name), display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2, padding:"7px 11px"}} onClick={() => { setRegion(rec.name); setStep(1); }}>
                      <span style={{fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>{strong && <Icon name="star" size={10} color={P.accent}/>}{rec.name}</span>
                      <span style={{fontSize:12,color:P.muted}}>{(rec.ris||"not rated").toLowerCase()}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {step===2 && (
            <>
              <button className="btn" onClick={() => setStep(1)} style={{background:"none",border:"none",color:P.accent,fontSize:13,marginBottom:12,padding:0,fontFamily:"inherit",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}><Icon name="arrow-left" size={11} color={P.accent}/> Back</button>
              <div style={{marginBottom:2,fontSize:13,fontWeight:600}}>Industrial ecosystem</div>
              <div style={{marginBottom:10,fontSize:12,color:P.muted,display:"flex",alignItems:"center",gap:6}}><Icon name="bullseye" size={11} color={P.green}/>Priority in {region}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:6,maxHeight:280,overflowY:"auto",paddingRight:4}}>
                {[...ECOSYSTEMS].map(e => {
                  const rec = getRegion(country, region);
                  const aligned = rec ? ecosystemAligns(rec, e.name) : false;
                  return (
                    <button key={e.id} className="btn" style={{...sel(sector?.id===e.id, e.color), display:"flex", alignItems:"center", gap:9, padding:"7px 10px"}} onClick={() => setSector(e)}>
                      <Icon name={e.icon} size={18} color={e.color}/>
                      <span style={{flex:1,color:P.text,fontSize:12.5}}>{e.name}</span>
                      {aligned && <Icon name="bullseye" size={11} color={P.green} style={{flexShrink:0}}/>}
                    </button>
                  );
                })}
              </div>
              {sector && (
                <>
                  <div style={{marginTop:16}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Difficulty</div>
                    <div style={{display:"flex",gap:6}}>
                      {Object.values(DIFFICULTIES).map(d => (
                        <button key={d.id} className="btn" onClick={() => setDiff(d.id)} aria-pressed={diff===d.id} title={d.desc}
                          style={{...sel(diff===d.id),flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontWeight:500}}>
                          <Icon name={({junior:"seedling",officer:"user-tie",expert:"chess-knight"})[d.id]||"user-tie"} size={13} color={diff===d.id?P.accent:P.muted}/>{d.label}
                        </button>
                      ))}
                    </div>

                  </div>
                  <div style={{marginTop:14}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Home region</div>
                    <select value={region} onChange={e=>setRegion(e.target.value)} aria-label="Change your home region"
                      style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:8,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontSize:13,outline:"none"}}>
                      {(REGIONS_BY_COUNTRY[country]||[]).map(r => (
                        <option key={r.nuts+r.name} value={r.name}>
                          {r.name}{ecosystemAligns(r, sector.name) ? "  ◎" : ""}
                        </option>
                      ))}
                    </select>

                  </div>
                  <div style={{marginTop:14}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Cluster name</div>
                    <input value={clusterName} onChange={e=>setClusterName(e.target.value)} maxLength={70}
                      placeholder={`e.g. ${region} ${sector.name} Cluster`} aria-label="Name your cluster organisation"
                      style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:8,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontSize:13,outline:"none"}}/>

                  </div>
                  
                  <button className="btn orb" onClick={() => onStart(country, region, sector, diff, scenario, seed.trim(), clusterName.trim())} style={{marginTop:18,width:"100%"}}>
                    Start in {region}
                  </button>
                </>
              )}
            </>
          )}
        </div>
        {showRules && <RulesModal onClose={() => setShowRules(false)}/>}
      </div>
      {/* Quiet links below the grid, so the map and the setup card end on the same line */}
      <div style={{gridColumn:mobile?"auto":"2",display:"flex",alignItems:"center",gap:20,marginTop:mobile?0:-24,paddingLeft:2}}>
        <button className="btn link" onClick={() => setShowRules(true)}>
          <Icon name="circle-question" size={13} color={P.accent}/> How to play
        </button>
        <button className="btn link" onClick={onTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
          <Icon name={dark?"sun":"moon"} size={13} color={P.accent}/> {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GAME SHELL · MAP-CENTRIC LAYOUT
═══════════════════════════════════════════════════════════ */
// Collapsible key explaining what the map's colours and textures mean.
function MapLegend({ gs }) {
  const [open, setOpen] = useState(false);
  const sc = gs?.sector?.color || P.accent;
  const rivals = gs?.rivals || [];
  const Item = ({ swatch, label }) => (
    <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11.5,color:P.text,padding:"1px 0"}}>
      <span style={{flexShrink:0}}>{swatch}</span><span>{label}</span>
    </div>
  );
  const box = (fill, stroke, extra) => <span style={{display:"inline-block",width:14,height:10,borderRadius:0,background:fill,border:`1px solid ${stroke||"transparent"}`,...extra}}/>;
  return (
    <div style={{position:"absolute",left:8,bottom:8,zIndex:35,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
      {open ? (
        <div className="event-in glass" style={{padding:"9px 11px",minWidth:172}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700,color:P.muted,letterSpacing:0,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>Map key</span>
            <button className="btn" onClick={()=>setOpen(false)} aria-label="Close map key" style={{border:"none",background:"none",color:P.muted,fontSize:13,lineHeight:1,cursor:"pointer",padding:0,width:16,height:16}}>×</button>
          </div>
          <Item swatch={box(`${P.gold}B0`, P.gold)} label="Home region"/>
          <Item swatch={box(`${sc}A8`, sc)} label="Full national coverage"/>
          <Item swatch={box(`${sc}66`, sc)} label="Active region"/>
          <Item swatch={box(THEME_DARK?"#1F2A40":"#FFFFFF", "#C6D0DE")} label="Unexplored"/>
          <Item swatch={box(THEME_DARK?"#1E2C48":"#E2EAF7", THEME_DARK?"#34466D":"#B8C8E2")} label="Candidate country"/>
          <Item swatch={box(THEME_DARK?"#182234":"#EDF0F4", THEME_DARK?"#263247":"#D3D9E2")} label="Outside the Union"/>
          {rivals.length > 0 && (
            <Item swatch={<span style={{display:"inline-block",width:14,height:10,borderRadius:0,border:`1px solid ${rivals[0].color}`,background:`repeating-linear-gradient(45deg, ${rivals[0].color}44 0 2px, transparent 2px 4px)`}}/>} label="Rival territory"/>
          )}
          <Item swatch={<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:14,height:10}}><span style={{width:8,height:8,borderRadius:"50%",border:`1.5px solid ${P.purple}`,background:P.panel}}/></span>} label="Political seat"/>
          
        </div>
      ) : (
        <button className="btn" onClick={()=>setOpen(true)} title="Show map key" style={{display:"inline-flex",alignItems:"center",gap:5,background:P.panel,border:`1px solid ${P.border}`,borderRadius:0,padding:"5px 9px",fontSize:11.5,fontWeight:700,color:P.muted,boxShadow:"none"}}>
          <Icon name="circle-info" size={11} color={P.muted}/> Key
        </button>
      )}
    </div>
  );
}

// Compact quarter summary that floats in the corner of the map instead of a
// blocking modal. Auto-dismisses; click to expand the full breakdown.
function DigestCard({ gs, digestOn, reopenTick, onDigestToggle }) {
  const [shown, setShown] = useState(null);   // the digest currently displayed
  const [expanded, setExpanded] = useState(false);
  const seenRef = useRef(0);
  useEffect(() => {
    const d = gs.digest;
    if (!d || !digestOn || d.turn === seenRef.current || d.turn <= 0 || gs.gameOver || gs.gameWon) return;
    seenRef.current = d.turn;
    setShown(d); setExpanded(false);
    const t = setTimeout(() => setShown(cur => (cur && cur.turn === d.turn ? null : cur)), 6500);
    return () => clearTimeout(t);
  }, [gs.digest?.turn, digestOn, gs.gameOver, gs.gameWon]);
  useEffect(() => { // manual re-open from the header button
    if (reopenTick && gs.digest) { setShown(gs.digest); setExpanded(true); }
  }, [reopenTick]);
  if (!shown) return null;
  const d = shown;
  const chip = (val, label, fmtFn=(v=>v)) => {
    if (Math.round(val) === 0) return null;
    return <span key={label} style={{fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',fontWeight:700,fontSize:11,color:val>0?P.greenText:P.redText,whiteSpace:"nowrap"}}>{val>0?"+":""}{fmtFn(val)} {label}</span>;
  };
  const Row = ({ label, val, fmtFn=(v=>v), good }) => {
    if (Math.round(val) === 0) return null;
    const positive = good === undefined ? val > 0 : good;
    return (
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
        <span style={{color:P.muted}}>{label}</span>
        <span style={{fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',fontWeight:700,color:positive?P.greenText:P.redText}}>{val>0?"+":""}{fmtFn(val)}</span>
      </div>
    );
  };
  return (
    <div className="event-in glass digest-card" style={{position:"absolute",top:8,right:8,zIndex:40,width:expanded?250:210,maxWidth:"calc(100% - 16px)",background:P.panel,border:`1px solid ${d.evolved?P.gold:P.border}`,borderRadius:0,boxShadow:"none",overflow:"hidden"}}>
      <button className="btn" onClick={() => setExpanded(e=>!e)} aria-expanded={expanded} style={{width:"100%",textAlign:"left",background:"none",border:"none",padding:"8px 26px 8px 10px",cursor:"pointer",display:"block"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,paddingRight:18}}>
          <Icon name="clipboard-check" size={11} color={P.accent}/>
          <span style={{fontSize:11,fontWeight:700,color:P.muted,letterSpacing:0,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>Q{((d.turn-1)%4)+1} {2024+Math.floor((d.turn-1)/4)} review</span>
          <span style={{marginLeft:"auto",fontSize:11,color:P.muted}}>{expanded?"▲":"▼"}</span>
        </div>
        {d.evolved && <div style={{fontSize:11,fontWeight:700,color:P.goldText,marginBottom:4}}>⭐ Evolved to {d.evolved}!</div>}
        <div style={{display:"flex",flexWrap:"wrap",gap:"2px 10px"}}>
          {chip(d.dBudget, "", v=>fmt(Math.abs(v)))}
          {chip(d.dMembers, "mem")}
          {chip(d.dInfluence, "infl")}
          {chip(d.dBoard, "brd")}
        </div>
      </button>
      {expanded && (
        <div style={{padding:"0 10px 10px",borderTop:`1px solid ${P.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:P.muted,letterSpacing:0,margin:"7px 0 3px",fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>Cashflow</div>
          <Row label="Membership fees" val={d.qMember} fmtFn={v=>fmt(v)} good={true}/>
          <Row label="Project income" val={d.qProj} fmtFn={v=>fmt(v)} good={true}/>
          <Row label="Salaries" val={-d.qStaff} fmtFn={v=>fmt(Math.abs(v))} good={false}/>
          <Row label="Overheads" val={-d.qOverhead} fmtFn={v=>fmt(Math.abs(v))} good={false}/>
          <Row label="Member servicing" val={-(d.qServicing||0)} fmtFn={v=>fmt(Math.abs(v))} good={false}/>
          <Row label="Delivery costs" val={-d.qDelivery} fmtFn={v=>fmt(Math.abs(v))} good={false}/>
          {d.events.length > 0 && (
            <>
              <div style={{fontSize:11,fontWeight:700,color:P.muted,letterSpacing:0,margin:"7px 0 3px",fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>This quarter</div>
              {d.events.map((e,i) => (
                <div key={i} style={{fontSize:11.5,lineHeight:1.4,color:P.text,display:"flex",gap:5,alignItems:"flex-start",marginBottom:2}}>
                  <Icon name={e.t==="good"?"circle-check":"circle-exclamation"} size={9} color={e.t==="good"?P.green:P.red} style={{marginTop:2,flexShrink:0}}/>
                  <span>{e.txt}</span>
                </div>
              ))}
            </>
          )}
          {onDigestToggle && (
            <label style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontSize:11,color:P.muted,cursor:"pointer"}}>
              <input type="checkbox" checked={!!digestOn} onChange={onDigestToggle} style={{accentColor:P.accent,cursor:"pointer"}}/>
              Show automatically each quarter
            </label>
          )}
        </div>
      )}
      <button className="btn" onClick={() => setShown(null)} aria-label="Dismiss quarter review" style={{position:"absolute",top:6,right:6,width:16,height:16,minWidth:16,padding:0,borderRadius:"50%",border:"none",background:"transparent",color:P.muted,fontSize:12,lineHeight:1,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>×</button>
    </div>
  );
}


// The central milestone: a brief full-screen stage-advance flourish.
function StageBanner({ banner, sector }) {
  if (!banner) return null;
  const sc = sector?.color || "#3860ED";
  return (
    <div key={banner.key} style={{position:"fixed",inset:0,zIndex:2900,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}} aria-hidden="true">
      <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 50% 45%, ${sc}22, transparent 60%)`,animation:"fadeIn .4s ease both, floatUp 3.2s ease-in forwards"}}/>
      <div className="stage-pop" style={{textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:0,color:sc,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',marginBottom:8}}>Cluster evolved</div>
        <div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"center"}}>
          <span style={{fontSize:14,color:"#94a3b8",fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',fontWeight:700,textDecoration:"line-through",opacity:.6}}>{STAGES[banner.from]?.name}</span>
          <Icon name="arrow-up-right-dots" size={22} color={sc}/>
        </div>
        <div style={{fontSize:30,fontWeight:800,color:sc,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',marginTop:6,textShadow:`0 4px 24px ${sc}66`}}>{STAGES[banner.to]?.name}</div>
        <div style={{fontSize:11,color:"#64748b",marginTop:6,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>Stage {banner.to} of 5</div>
      </div>
    </div>
  );
}

const TUT_STEPS = [
  { t:"Build the first EU-wide cluster network", d:"Watch treasury, board and rivals.", i:"flag", done: () => false },
  { t:"Start a project", d:"Projects tab, then Start project.", i:"folder-open", done: gs => (gs.activeProjects||[]).length > 0 || (gs.completedProjects||[]).length > 0 },
  { t:"Hire a specialist", d:"Staff tab: a Communications Director recruits members.", i:"user-plus", done: gs => (gs.roster||[]).length > 1 },
  { t:"End the quarter", d:"Next quarter, or press Space.", i:"hourglass-half", done: (gs, t0) => gs.turn > t0 },
  { t:"You're set", d:"Expand, win seats, watch the Rivals tab.", i:"check-double", done: () => false },
];
function Tutorial({ gs }) {
  const [step, setStep] = useState(null); // null=unknown, -1=off, 0..n
  const t0 = useRef(gs.turn);
  useEffect(() => {
    if (step !== null) return;
    if (gs.turn > 2 || gs.stage > 0) { setStep(-1); return; }
    let p = null;
    try { p = (window.storage && window.storage.get) ? window.storage.get("cm_tut") : null; } catch(e) {}
    if (p && p.then) p.then(r => setStep(v => v !== null ? v : (r && r.value === "done" ? -1 : 0))).catch(() => setStep(v => v === null ? 0 : v));
    else setStep(0); // no storage: show the tutorial
  }, []);
  useEffect(() => {
    if (step === null || step < 0 || step >= TUT_STEPS.length) return;
    if (TUT_STEPS[step].done(gs, t0.current)) setStep(step + 1 < TUT_STEPS.length ? step + 1 : finish());
  }, [gs, step]);
  const finish = () => { try { window.storage?.set?.("cm_tut","done"); } catch(e) {} return -1; };
  if (step === null || step < 0 || step >= TUT_STEPS.length) return null;
  const st = TUT_STEPS[step];
  return (
    <div className="event-in glass tut" role="status" style={{position:"fixed",left:16,bottom:76,zIndex:2600,width:280,padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Icon name={st.i||"flag"} size={14} color={P.accent}/>
        <span style={{fontSize:13.5,fontWeight:600,color:P.text,flex:1}}>{st.t}</span>
        {step>0 && step<TUT_STEPS.length-1 && <span className="tnum" style={{fontSize:11.5,color:P.muted}}>{step}/{TUT_STEPS.length-2}</span>}
      </div>
      <div style={{fontSize:12.5,color:P.muted,margin:"6px 0 12px 24px",lineHeight:1.45}}>{st.d}</div>
      <div style={{display:"flex",gap:16,justifyContent:"flex-end",alignItems:"center"}}>
        <button className="btn link" style={{color:P.muted,fontSize:12.5}} onClick={() => setStep(finish())}>Skip</button>
        {(step === 0 || step === TUT_STEPS.length-1) && (
          <button className="btn" onClick={() => step === 0 ? setStep(1) : setStep(finish())} style={{padding:"7px 14px",borderRadius:8,border:"none",background:P.accent,color:P.onAccent,fontSize:12.5,fontWeight:600}}>{step===0?"Start":"Done"}</button>
        )}
      </div>
    </div>
  );
}

// What still wants a decision this quarter, as plates laid over the map. Flag
// yellow marks what will cost you if ignored; blue marks an opening. Each plate
// goes straight to the panel that deals with it.
const ATTN_ICON = { event:"circle-exclamation", gm:"user-tie", runway:"coins", board:"shield-halved",
  evolve:"arrow-up-right-dots", projects:"folder-open", staff:"user-plus", region:"map-location-dot" };
function AttentionQueue({ items, onGo, compact }) {
  if (!items || !items.length) return null;
  const shown = items.slice(0, compact ? 6 : 5);
  if (compact) {
    return (
      <div role="list" aria-label="Things that could use your attention" style={{flexShrink:0,display:"flex",gap:6,padding:"6px 10px",overflowX:"auto",background:P.panel,borderTop:`1px solid ${P.border}`}}>
        {shown.map(it => (
          <button key={it.id} role="listitem" className="btn" onClick={()=>onGo(it.go)}
            style={{flexShrink:0,maxWidth:240,textAlign:"left",padding:"6px 9px 6px 8px",border:`1px solid ${P.border}`,borderLeft:`3px solid ${it.urgent?P.red:P.accent}`,borderRadius:8,background:P.card,color:P.text,fontSize:11.5,fontWeight:it.urgent?700:400,lineHeight:1.3,whiteSpace:"normal"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:7}}><Icon name={ATTN_ICON[it.id]||"circle-info"} size={12} color={it.urgent?P.redText:P.accent}/>{it.text}</span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div role="list" aria-label="Things that could use your attention" style={{position:"absolute",top:10,left:10,zIndex:44,width:268,display:"flex",flexDirection:"column",gap:4}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:0,color:P.muted,padding:"0 2px 2px"}}>Before you end the quarter</div>
      {shown.map(it => (
        <button key={it.id} role="listitem" className="btn" onClick={()=>onGo(it.go)}
          style={{textAlign:"left",padding:"9px 12px 9px 11px",border:`1px solid ${P.border}`,borderLeft:`3px solid ${it.urgent?P.red:P.accent}`,borderRadius:10,background:P.panel,boxShadow:"0 1px 2px rgba(16,24,40,.05),0 4px 12px rgba(16,24,40,.06)",color:P.text,fontSize:12,fontWeight:it.urgent?600:400,lineHeight:1.35}}>
          <span style={{display:"flex",alignItems:"center",gap:9}}><Icon name={ATTN_ICON[it.id]||"circle-info"} size={13} color={it.urgent?P.redText:P.accent}/>{it.text}</span>
        </button>
      ))}
      {items.length > shown.length && <div style={{fontSize:11.5,color:P.muted,padding:"0 2px"}}>and {items.length - shown.length} more</div>}
    </div>
  );
}

function Game({ gs, dispatch, vw, auto, setAuto, dark, onTheme, canUndo, onUndo, snd, onSnd, textBig, onTextScale, digestOn, onDigestToggle }) {
  const [digestReopen, setDigestReopen] = useState(0);
  const [leftOpen, setLeftOpen] = useState(true);   // desktop: cluster summary panel
  // Panel sizes, set by dragging the edges and remembered between visits.
  const savedLayout = (() => { try { return JSON.parse(localStorage.getItem("cm_layout")||"{}"); } catch (e) { return {}; } })();
  const [leftW, setLeftW] = useState(savedLayout.leftW || 215);
  const [dockWSet, setDockWSet] = useState(savedLayout.dockW || null);
  const [logH, setLogH] = useState(savedLayout.logH || 212);
  const [dragging, setDragging] = useState(null);
  useEffect(() => { try { localStorage.setItem("cm_layout", JSON.stringify({ leftW, dockW: dockWSet, logH })); } catch (e) {} }, [leftW, dockWSet, logH]);
  // Drag from a handle: report the pointer's travel until release.
  const startDrag = (kind, e, onMove) => {
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY;
    setDragging(kind);
    const move = ev => onMove(ev.clientX - x0, ev.clientY - y0);
    const up = () => { setDragging(null); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const [dockOpen, setDockOpen] = useState(true);   // desktop: projects / staff / network / rivals
  // sound cues
  const sndRef = useRef({ turn: gs.turn, stage: gs.stage, won: !!gs.gameWon, ev: !!gs.pendingEvent, seats: seatsHeld(gs) });
  useEffect(() => {
    const p = sndRef.current;
    const seatsNow = seatsHeld(gs);
    if (gs.gameWon && !p.won) sfx.play("gold");
    else if (gs.stage > p.stage) sfx.play("fanfare");
    else if (seatsNow > p.seats) sfx.play("gold");
    else if (gs.pendingEvent && !p.ev) sfx.play(gs.pendingEvent.t === "good" ? "cash" : "alert");
    else if (gs.turn > p.turn) sfx.play("quarter");
    sndRef.current = { turn: gs.turn, stage: gs.stage, won: !!gs.gameWon, ev: !!gs.pendingEvent, seats: seatsNow };
  }, [gs.turn, gs.stage, gs.gameWon, gs.pendingEvent, gs.seats]);
  // keyboard shortcuts: Space=next quarter · U=undo · Esc=close · 1-4=panels
  useEffect(() => {
    const onKey = e => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); if (!gs.pendingEvent && !gs.gameOver && !gs.gameWon && byRole(gs.roster,"manager") >= 1) dispatch({type:"nextTurn"}); }
      else if (e.key === "u" || e.key === "U") { if (canUndo) onUndo?.(); }
      else if (e.key === "Escape") setModal(null);
      else if (["1","2","3","4"].includes(e.key)) { const t = ["projects","staff","network","rivals"][+e.key-1]; if (vw >= 1150) setRightTab(t); else setModal(t); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gs.pendingEvent, gs.gameOver, gs.gameWon, canUndo, onUndo, vw]);
  // Milestone celebrations: evolution, political seats, victory
  const celeRef = useRef({ stage: gs.stage, seats: seatsHeld(gs), won: !!gs.gameWon });
  const [burst, setBurst] = useState(null);
  const [stageBanner, setStageBanner] = useState(null);
  const stageRef = useRef(gs.stage);
  useEffect(() => {
    if (gs.stage > stageRef.current && !gs.gameWon) {
      setStageBanner({ from: stageRef.current, to: gs.stage, key: gs.stage });
      const t = setTimeout(() => setStageBanner(null), 3200);
      stageRef.current = gs.stage;
      return () => clearTimeout(t);
    }
    stageRef.current = gs.stage;
  }, [gs.stage, gs.gameWon]);
  useEffect(() => {
    const c = celeRef.current;
    const seatsNow = seatsHeld(gs);
    let fire = null;
    if (gs.gameWon && !c.won) fire = { key:`won-${gs.turn}`, gold:true };
    else if (gs.stage > c.stage) fire = { key:`st-${gs.stage}`, gold:false };
    else if (seatsNow > c.seats) fire = { key:`seat-${seatsNow}-${gs.turn}`, gold:true };
    celeRef.current = { stage: gs.stage, seats: seatsNow, won: !!gs.gameWon };
    if (fire) {
      setBurst(fire);
      const t = setTimeout(() => setBurst(null), 2700);
      return () => clearTimeout(t);
    }
  }, [gs.stage, gs.gameWon, gs.seats, gs.turn]);
  const [modal, setModal] = useState(null);
  const [sel, setSel]     = useState(null);
  const [rightTab, setRightTab] = useState("projects");
  const [showTip, setShowTip] = useState(gs?.turn === 0);

  const stage  = STAGES[gs?.stage] || STAGES[0];
  const ok     = gs ? canEvolve(gs) : false;
  const phone  = vw < 820;

  // Auto-advance pauses whenever an event needs attention
  useEffect(() => {
    if (gs && gs.pendingEvent && auto) setAuto(false);
  }, [gs?.pendingEvent]); // eslint-disable-line

  if (!gs) return null;

  const tipCard = false && (
    <div style={{position:"absolute",top:10,left:10,right:10,zIndex:50,maxWidth:380,margin:"0 auto",background:P.panel,borderRadius:0,border:`1px solid ${P.accent}`,boxShadow:"none",padding:"14px 16px",animation:"fadeUp .2s ease"}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:8,color:P.text}}>Quick orientation</div>
      <div style={{fontSize:11,color:P.muted,lineHeight:1.6,marginBottom:6}}>Watch <b style={{color:P.text}}>Treasury</b>, <b style={{color:P.text}}>Board</b> and the <b style={{color:P.text}}>rival race</b> each quarter. Any one hitting zero, or a rival finishing first, ends the run.</div>
      <div style={{fontSize:11,color:P.muted,lineHeight:1.6,marginBottom:6}}>• The project strip on screen shows each call's status live: green is on track, red is at risk of running out of cash before it finishes.</div>
      <div style={{fontSize:11,color:P.muted,lineHeight:1.6,marginBottom:10}}>• Hire the specialist a project needs before launching it, and tap any country on the map for details.</div>
      <button className="btn" onClick={()=>setShowTip(false)} style={{width:"100%",padding:"9px",borderRadius:0,border:"none",background:P.accent,color:P.onAccent,fontWeight:700,fontSize:12}}>Got it, let's go <Icon name="arrow-right" size={11} color={P.onAccent} style={{marginLeft:5}}/></button>
    </div>
  );

  const trends = statTrends(gs);
  const attention = attentionItems(gs);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const dockW = clamp(dockWSet || (vw>=1440?420:vw>=1150?372:320), 300, Math.max(320, Math.min(680, vw*0.45)));
  const leftWc = clamp(leftW, 190, 380);
  const goTo = id => { if (id==="event") return; if (!phone && ["projects","staff","network","rivals"].includes(id)) { setDockOpen(true); setRightTab(id); } else setModal(id); };
  const TopStat = ({ l, v, c=P.text, icon, tip, trend }) => (
    <div title={tip ? `${l}\n${tip}` : l} style={{display:"flex",alignItems:"center",gap:8,cursor:"help"}}>
      {icon && <Icon name={icon} size={15} color={P.muted}/>}
      <span className="sr">{l}</span>
      <span className="tnum" style={{fontSize:21,fontWeight:600,letterSpacing:-.4,lineHeight:1,color:c}}>{v}</span>
      {trend!=null && Math.abs(trend) > 0.05 && <span className="tnum" style={{fontSize:11,fontWeight:600,color:trend>0?P.greenText:P.redText}}>{trend>0?"+":"−"}{Math.abs(Math.round(trend*10)/10)}</span>}
    </div>
  );

  const sharedModals = (
    <>
      {gs.pendingEvent && <EventModal ev={gs.pendingEvent} onDismiss={(ci) => dispatch({type:"dismissEvent", choiceIdx:ci})}/>}
      {modal==="projects" && <ProjectsModal gs={gs} dispatch={dispatch} onClose={() => setModal(null)}/>}
      {modal==="staff"    && <StaffModal    gs={gs} dispatch={dispatch} onClose={() => setModal(null)}/>}
      {modal==="network"  && <NetworkModal  gs={gs} dispatch={dispatch} onClose={() => setModal(null)}/>}
      {modal==="rivals"   && <RivalsModal   gs={gs} dispatch={dispatch} onClose={() => setModal(null)}/>}
      {modal==="evolve"   && <EvolveModal   gs={gs} dispatch={dispatch} onClose={() => setModal(null)}/>}
      {modal==="log"      && <LogModal      gs={gs}                     onClose={() => setModal(null)}/>}
      {modal==="slots"    && <SaveSlots     gs={gs} onLoad={s => { dispatch({type:"loadState", state:s}); setModal(null); }} onClose={() => setModal(null)}/>}
      <Confetti burst={burst}/>
      <StageBanner banner={stageBanner} sector={gs.sector}/>
      <FloatingDeltas gs={gs}/>
      <Tutorial gs={gs}/>
      {modal==="stats"    && <StatsModal    gs={gs} dispatch={dispatch}  onClose={() => setModal(null)}/>}
      {modal==="rules"    && <RulesModal onClose={() => setModal(null)}/>}
    </>
  );

  /* ───────── MOBILE LAYOUT ───────── */
  if (phone) {
    const navBtn = (id, icon, label, color, badge) => (
      <button className="btn" onClick={() => setModal(id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 2px",border:"none",background:"none",color:modal===id?color:P.text,position:"relative"}}>
        <Icon name={icon} size={17} color={modal===id?color:P.muted}/>
        <span style={{fontSize:11,fontWeight:600,color:badge?darkHex(color,0.6):P.muted}}>{label}</span>
        {badge && <span style={{position:"absolute",top:4,right:"24%",width:7,height:7,borderRadius:"50%",background:color}}/>}
      </button>
    );

    return (
      <div style={{height:"100dvh",background:P.bg,color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {sharedModals}

        {/* Compact header */}
        <div style={{background:P.panel,borderBottom:`1px solid ${P.border}`,padding:"8px 12px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Icon name={gs.sector?.icon||"display"} size={18} color={gs.sector?.color||P.text}/>
            <div style={{flex:1,minWidth:0}}>
              <div title={gs.clusterName || gs.sector?.name} style={{fontSize:12,fontWeight:700,color:gs.sector?.color||P.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{gs.clusterName || gs.sector?.name}</div>
              <div style={{fontSize:11.5,color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{gs.clusterName ? `${stage.name} · ${gs.sector?.name}` : stage.name}</div>
            </div>
            {/* Re-opening the quarter review existed only in the desktop header,
                which left no way back to it on a phone once it faded. */}
            <button className="btn" onClick={() => gs.digest ? setDigestReopen(t=>t+1) : null} disabled={!gs.digest}
              title="Show the latest quarter review" aria-label="Show the latest quarter review"
              style={{padding:"5px 8px",borderRadius:0,border:`1px solid ${P.border}`,background:P.card,display:"inline-flex",opacity:gs.digest?1:0.4}}>
              <Icon name="clipboard-check" size={13} color={P.muted}/></button>
            <button className="btn" onClick={onSnd} title="Toggle sound" style={{padding:"5px 8px",borderRadius:0,border:`1px solid ${P.border}`,background:P.card,display:"inline-flex"}}><Icon name={snd?"volume-high":"volume-xmark"} size={13} color={P.muted}/></button>
            <button className="btn" onClick={onTheme} title="Toggle dark mode" style={{padding:"5px 8px",borderRadius:0,border:`1px solid ${P.border}`,background:P.card,display:"inline-flex"}}><Icon name={dark?"sun":"moon"} size={13} color={P.muted}/></button>
            <button className="btn" onClick={()=>setModal("rules")} title="Game rules" style={{padding:"5px 8px",borderRadius:0,border:`1px solid ${P.border}`,background:P.card,color:P.text,display:"inline-flex"}}><Icon name="circle-question" size={13} color={P.muted}/></button>
            <button className="btn" onClick={()=>setModal("stats")} style={{padding:"5px 10px",borderRadius:0,border:`1px solid ${P.border}`,background:P.card,color:P.text,fontSize:11,fontWeight:700}}>Stats ▾</button>
          </div>
          {/* Stat strip */}
          <div style={{display:"flex",gap:10,marginTop:8,overflowX:"auto",paddingBottom:2}}>
            <TopStat l="Period" v={<span key={gs.turn} className="flip-in">{`Q${gs.quarter} ${gs.year}`}</span>} c={P.text} icon="calendar-days"/>
            <TopStat l="Treasury" v={fmt(gs.budget||0)} c={(gs.budget||0)<20000?P.redText:P.text} icon="coins" trend={trends?.budget?.delta} tip={trendTitle(trends?.budget)}/>
            <TopStat l="Members" v={gs.members||0} c={P.text} icon="users" trend={trends?.members?.delta} tip={trendTitle(trends?.members,"Plus rival poaching, defections and events.")}/>
            <TopStat l="Influence" v={Math.round(gs.prestige||0)} c={P.text} icon="landmark" trend={trends?.influence?.delta} tip={trendTitle(trends?.influence,"Plus project deliveries, events, coups.")}/>
            <TopStat l="Board" v={`${Math.round(gs.boardConf||0)}`} c={(gs.boardConf||0)<30?P.redText:P.text} icon="shield-halved" trend={trends?.board?.delta} tip={trendTitle(trends?.board,"Plus completions +3, failures −8..−15, events.")}/>
            <TopStat l="Net Income" v={`${(gs.qNet||0)>=0?"+":""}${fmtN(gs.qNet||0)}`} c={(gs.qNet||0)>=0?P.accent:P.red} icon="chart-line" tip={trendTitle(trends?.budget,"Last quarter's actual cashflow.")}/>
          </div>
        </div>

        {/* Map */}
        <div className="map-sea" style={{flex:1,overflow:"hidden",position:"relative",minHeight:0}}>
          <EUMap gs={gs} sel={sel} setSel={setSel} dispatch={dispatch}/>
          <DigestCard gs={gs} digestOn={digestOn} reopenTick={digestReopen} onDigestToggle={onDigestToggle}/>
          <MapLegend gs={gs}/>
          {sel && <div style={{position:"absolute",bottom:8,left:8,fontSize:11.5,color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>tap country again to close</div>}
          {tipCard}
        </div>

        {/* Persistent project HUD: current calls and their status, always visible */}
        {(gs.activeProjects||[]).length > 0 && (
          <div style={{flexShrink:0,display:"flex",gap:6,padding:"7px 10px",background:P.panel,borderTop:`1px solid ${P.border}`,overflowX:"auto"}}>
            {gs.activeProjects.map((p, i) => {
              if (!p) return null;
              const prog = Math.min(1, 1 - ((p.endTurn||0)-(gs.turn||0)) / Math.max(1,p.dur||1));
              const st = projectStatus(p, gs);
              const left = Math.max(0,(p.endTurn||0)-(gs.turn||0));
              return (
                <button key={`hud-${i}`} className="btn" onClick={()=>setModal("projects")} style={{flexShrink:0,minWidth:128,textAlign:"left",padding:"6px 9px",borderRadius:0,border:`1px solid ${st.color}55`,background:P.card}}>
                  <div style={{fontSize:11,fontWeight:700,color:P.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:128}}>{p.name}</div>
                  <div style={{height:2.5,background:P.bright,borderRadius:0,marginTop:3}}>
                    <div style={{width:`${prog*100}%`,height:"100%",background:st.color,borderRadius:0}}/>
                  </div>
                  <div style={{fontSize:11,color:st.color,marginTop:2,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{left}Q · {st.label}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Evolve banner when ready */}
        {ok && (
          <button className="btn" onClick={()=>setModal("evolve")} style={{flexShrink:0,padding:"10px",border:"none",background:`${P.gold}`,color:P.text,fontWeight:700,fontSize:14,letterSpacing:0}}>
            READY TO EVOLVE <Icon name="arrow-right" size={12} color={P.bg} style={{margin:"0 6px"}}/> {STAGES[Math.min(5,gs.stage+1)].name}
          </button>
        )}

        <AttentionQueue items={attention} onGo={goTo} compact/>
        {/* Primary action row */}
        <div style={{flexShrink:0,display:"flex",gap:8,padding:"8px 10px",background:P.panel,borderTop:`1px solid ${P.border}`}}>
          {gs.pendingEvent ? (
            <button className="btn" onClick={()=>{
                if(gs.pendingEvent?.choices) return; // choices use EventModal buttons
                dispatch({type:"dismissEvent",choiceIdx:null});
              }} style={{flex:1,padding:"13px",borderRadius:0,border:"none",background:`linear-gradient(135deg,${P.orange},${P.red})`,color:P.onAccent,fontWeight:700,fontSize:15}}>
              <Icon name="bolt" size={14} color={P.onAccent} style={{marginRight:6}}/> {gs.pendingEvent?.choices ? "Decide below ↑" : "Resolve Event"}
            </button>
          ) : (
            <>
              <button className="btn cut" onClick={()=>dispatch({type:"nextTurn"})} style={{flex:1,padding:"13px",borderRadius:0,border:"none",background:`${P.accent}`,color:P.bg,fontWeight:700,fontSize:15,letterSpacing:0}}>
                {byRole(gs.roster,"manager")<1 ? "No General Manager — hire one" : <>Next Quarter</>}
              </button>
              <button className="btn" onClick={()=>setAuto(a=>!a)} style={{padding:"13px 16px",borderRadius:0,border:`1px solid ${auto?P.accent:P.border}`,background:auto?`${P.accent}22`:P.card,color:auto?P.accent:P.text,fontWeight:700,fontSize:15}}>
                {auto?<Icon name="pause" size={15}/>:<Icon name="forward" size={15}/>}
              </button>
            </>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{flexShrink:0,display:"flex",background:P.panel,borderTop:`1px solid ${P.border}`,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
          {navBtn("rivals","chess-knight","Rivals",P.red, (gs.rivals||[]).some(rv=>(rv.health??100)<=25))}
          {navBtn("projects","folder-open","Projects",P.blue, (gs.activeProjects||[]).length>0)}
          {navBtn("staff","users","Staff",P.purple)}
          {navBtn("network","earth-europe","Network",P.teal)}
          {navBtn("log","clipboard-list","Log",P.text)}
          {navBtn("evolve",ok?"rocket":"lock","Evolve",P.gold, ok)}
        </div>
      </div>
    );
  }

  /* ───────── DESKTOP LAYOUT ───────── */
  const BotBtn = ({ id, label, color, highlight }) => (
    <button className="btn" onClick={() => setModal(id)} style={{padding:"8px 15px",borderRadius:0,border:`1px solid ${highlight?`${color}99`:P.border}`,background:highlight?`${color}18`:P.card,color:highlight?darkHex(color,0.6):P.text,fontWeight:700,fontSize:13,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',letterSpacing:.3,display:"flex",alignItems:"center",gap:5}}>
      {label}
    </button>
  );

  return (
    <div style={{height:"100vh",background:P.bg,color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {sharedModals}

      {/* TOP BAR */}
      <div className="glass-flat" style={{background:P.panel,borderBottom:`1px solid ${P.border}`,padding:"8px 16px",display:"flex",alignItems:"center",gap:14,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:6}}>
          <div>
            <div title={gs.clusterName || gs.sector?.name || ""} style={{fontSize:14,fontWeight:600,color:P.text,maxWidth:280,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{gs.clusterName || gs.sector?.name || ""}</div>
            <div style={{fontSize:12,color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{stage.name}, {gs.region||""}</div>
          </div>
        </div>
        <button className="btn" onClick={()=>setModal("rules")} title="Game rules" style={{padding:"4px 10px",borderRadius:6,border:"1px solid transparent",background:"transparent",color:P.muted,fontSize:11.5,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,flexShrink:0}}>
          Rules
        </button>
        <button className="btn" onClick={onTheme} title={dark?"Switch to light mode":"Switch to dark mode"} style={{padding:"4px 9px",borderRadius:6,border:"1px solid transparent",background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name={dark?"sun":"moon"} size={12} color={P.muted}/>
        </button>
        <button className="btn" onClick={onSnd} title={snd?"Mute sound":"Enable sound"} style={{padding:"4px 9px",borderRadius:6,border:"1px solid transparent",background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name={snd?"volume-high":"volume-xmark"} size={12} color={P.muted}/>
        </button>
        <button className="btn" onClick={onTextScale} aria-pressed={textBig} title={textBig?"Normal text size":"Larger text size"} style={{padding:"4px 9px",borderRadius:6,border:"1px solid transparent",background:textBig?`${P.accent}0d`:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name="text-height" size={12} color={textBig?P.accent:P.muted}/>
        </button>
        <button className="btn" onClick={() => gs.digest ? setDigestReopen(t=>t+1) : null} title="Show the latest quarter review" style={{padding:"4px 9px",borderRadius:6,border:"1px solid transparent",background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name="clipboard-check" size={12} color={P.muted}/>
        </button>
        <button className="btn" onClick={()=>setModal("slots")} title="Save slots" style={{padding:"4px 9px",borderRadius:6,border:"1px solid transparent",background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name="floppy-disk" size={12} color={P.muted}/>
        </button>
        {canUndo && (
          <button className="btn" onClick={onUndo} title="Undo last quarter (U) — once per quarter, Junior & Officer only" style={{padding:"4px 10px",borderRadius:6,border:"1px solid transparent",background:"transparent",color:P.aoldText,fontSize:11.5,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,flexShrink:0}}>
            Undo
          </button>
        )}
        {gs.pendingEvent && (
          <div style={{fontSize:11.5,padding:"5px 10px",borderRadius:0,background:"transparent",border:"none",color:P.redText,fontWeight:600,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
            An event is waiting
          </div>
        )}
        <div style={{marginLeft:"auto",display:"flex",gap:28,alignItems:"flex-end",flexWrap:"wrap"}}>
          <TopStat l="Period"   v={<span key={gs.turn} className="flip-in">{`Q${gs.quarter} ${gs.year}`}</span>}        c={P.text} icon="calendar-days"/>
          <TopStat l="Treasury" v={fmt(gs.budget||0)}                   c={(gs.budget||0)<20000?P.redText:P.text} icon="coins"/>
          <TopStat l="Members"  v={gs.members||0}                       c={P.text} icon="users" trend={trends?.members?.delta} tip={trendTitle(trends?.members,"Plus rival poaching, defections and events.")}/>
          <TopStat l="Influence" v={Math.round(gs.prestige||0)}          c={P.text} icon="landmark" trend={trends?.influence?.delta} tip={trendTitle(trends?.influence,"Plus project deliveries, events, coups.")}/>
          <TopStat l="Board" v={`${Math.round(gs.boardConf||0)}%`} c={(gs.boardConf||0)<30?P.redText:P.text} icon="shield-halved" trend={trends?.board?.delta} tip={trendTitle(trends?.board,"Plus completions +3, failures −8..−15, events.")}/>
        </div>
      </div>

      {/* MAIN: the map owns the whole area; panels float over the sea and fold away */}
      <div className="map-sea" style={{flex:1,position:"relative",overflow:"hidden"}}>
        {/* The map and its overlays live in the space the open panels leave free,
            so nothing of Europe is hidden and the map recentres as panels fold. */}
        <div style={{position:"absolute",top:0,bottom:0,left:leftOpen?leftWc+1:0,right:dockOpen?dockW+1:0,transition:dragging?"none":"left .18s ease,right .18s ease"}}>
          <EUMap gs={gs} sel={sel} setSel={setSel} lift={150} dispatch={dispatch}/>
          <DigestCard gs={gs} digestOn={digestOn} reopenTick={digestReopen} onDigestToggle={onDigestToggle}/>
          <MapLegend gs={gs}/>
          {tipCard}
          <AttentionQueue items={attention} onGo={goTo}/>
          {/* Turn controls: a medallion ends the quarter, with the smaller controls beside it */}
          <div style={{position:"absolute",right:16,bottom:14,zIndex:45,display:"flex",alignItems:"flex-end",gap:12}}>
            <button className="btn glass" onClick={() => setModal("evolve")} title="What the next stage requires"
              style={{padding:"10px 14px",color:ok?P.accent:P.text,fontSize:12,fontWeight:ok?600:500,marginBottom:22}}>
              {(() => {
                // Stage goals at a glance: how many of the next stage's conditions are met
                const reqs = evolveReqs(gs); const met = reqs.filter(r => r.ok).length;
                return ok ? "Evolve now" : (gs.stage||0) >= 5 ? "Final stage" : `Stage goals ${met}/${reqs.length}`;
              })()}
            </button>
            <button className="btn orb-sm" onClick={()=>setAuto(a=>!a)} disabled={!!gs.pendingEvent} title="Advance quarters automatically until something needs you" aria-pressed={!!auto}
              style={{color:auto?P.accent:P.text,fontSize:12,fontWeight:600,marginBottom:22,opacity:gs.pendingEvent?0.5:1}}>
              {auto ? "Pause" : "Auto"}
            </button>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
              <button className="btn orb" onClick={() => dispatch({type:"nextTurn"})} disabled={!!gs.pendingEvent || byRole(gs.roster,"manager")<1}
                aria-label={gs.pendingEvent ? "Resolve the event first" : byRole(gs.roster,"manager")<1 ? "Hire a General Manager first" : "Next Quarter"}>
                <span style={{fontSize:15,fontWeight:600,color:"inherit"}}>{gs.pendingEvent ? "Resolve event first" : byRole(gs.roster,"manager")<1 ? "Hire a General Manager" : "Next quarter"}</span>
              </button>
              <div style={{padding:"2px 4px",fontSize:11,color:attention.length?P.accent:P.muted,whiteSpace:"nowrap",fontWeight:500}}>
                {attention.length ? `${attention.length} thing${attention.length===1?"":"s"} could use you first` : `Q${gs.quarter} ${gs.year} · all clear`}
              </div>
            </div>
          </div>
        </div>

        <div className="sheet sheet-left" style={{position:"absolute",left:0,top:0,bottom:0,zIndex:60,width:leftWc,overflow:"hidden",display:leftOpen?"flex":"none"}}>
          <LeftPanel gs={gs} dispatch={dispatch}/>
        </div>
        {leftOpen && <div className={`resizer col${dragging==="left"?" on":""}`} role="separator" aria-orientation="vertical" aria-label="Resize the summary panel" title="Drag to resize, double-click to reset"
          style={{left:leftWc-3}} onDoubleClick={() => setLeftW(215)}
          onPointerDown={e => { const w0 = leftWc; startDrag("left", e, dx => setLeftW(clamp(w0 + dx, 190, 380))); }}/>}
        <button className="btn" onClick={()=>setLeftOpen(o=>!o)} aria-expanded={leftOpen} aria-label={leftOpen?"Hide the cluster summary":"Show the cluster summary"} title={leftOpen?"Hide the cluster summary":"Show the cluster summary"}
          style={{position:"absolute",left:leftOpen?leftWc+1:0,top:"50%",transform:"translateY(-50%)",zIndex:61,width:18,height:58,padding:0,border:`1px solid ${P.border}`,borderRadius:"0 6px 6px 0",background:P.panel,color:P.accent,fontSize:13,transition:"left .18s ease"}}>{leftOpen?"‹":"›"}</button>
        <button className="btn" onClick={()=>setDockOpen(o=>!o)} aria-expanded={dockOpen} aria-label={dockOpen?"Hide the management panel":"Show the management panel"} title={dockOpen?"Hide the management panel":"Show the management panel"}
          style={{position:"absolute",right:dockOpen?dockW+1:0,top:"50%",transform:"translateY(-50%)",zIndex:61,width:18,height:58,padding:0,border:`1px solid ${P.border}`,borderRadius:"6px 0 0 6px",background:P.panel,color:P.accent,fontSize:13,transition:"right .18s ease"}}>{dockOpen?"›":"‹"}</button>

        {/* RIGHT DOCK: Projects / Staff / Network tabs + compact activity & log */}
        {dockOpen && <div className={`resizer col${dragging==="dock"?" on":""}`} role="separator" aria-orientation="vertical" aria-label="Resize the management panel" title="Drag to resize, double-click to reset"
          style={{right:dockW-5}} onDoubleClick={() => setDockWSet(null)}
          onPointerDown={e => { const w0 = dockW; startDrag("dock", e, dx => setDockWSet(clamp(w0 - dx, 300, Math.min(680, vw*0.45)))); }}/>}
        <div className="sheet sheet-right" style={{position:"absolute",right:0,top:0,bottom:0,zIndex:60,width:dockW,display:dockOpen?"flex":"none",flexDirection:"column",background:P.panel,borderLeft:`1px solid ${P.border}`,overflow:"hidden"}}>
          <div className="menu-tabs" role="tablist" style={{display:"flex",flexShrink:0,background:"transparent",borderBottom:`1px solid ${P.border}`}}>
            {[["projects","folder-open","Projects",P.blue],["staff","users","Staff",P.purple],["network","earth-europe","Network",P.teal],["rivals","chess-knight","Rivals",P.red]].map(([id,icon,lbl,col]) => (
              <button key={id} className="btn" onClick={()=>setRightTab(id)} aria-pressed={rightTab===id}
                style={{flex:1,padding:"11px 4px 8px",border:"none",borderBottom:`3px solid ${rightTab===id?P.gold:"transparent"}`,background:"transparent",color:rightTab===id?P.accent:P.muted,fontSize:12.5,fontWeight:rightTab===id?700:400}}>
                {lbl}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            <div key={rightTab} className="panel-fade menu-scope">
              {rightTab==="projects" && <ProjectsModal gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
              {rightTab==="staff"    && <StaffModal    gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
              {rightTab==="network"  && <NetworkModal  gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
              {rightTab==="rivals"   && <RivalsModal   gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
            </div>
          </div>
          <div style={{position:"relative",flexShrink:0}}>
            <div className={`resizer row${dragging==="log"?" on":""}`} role="separator" aria-orientation="horizontal" aria-label="Resize the projects and log area" title="Drag to resize, double-click to reset"
              style={{top:-4}} onDoubleClick={() => setLogH(212)}
              onPointerDown={e => { const h0 = logH; startDrag("log", e, (dx, dy) => setLogH(clamp(h0 - dy, 110, 560))); }}/>
          </div>
          <RightPanel gs={gs} compact height={logH}/>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GAME OVER
═══════════════════════════════════════════════════════════ */
function GameOver({ gs, onRestart }) {
  if (!gs) return null;
  const won = gs.gameWon;
  const rival = gs.rivalDefeat;
  const yrs = Math.floor((gs.turn||0)/4);
  const achvAll = { ...(gs.achv||{}), ...checkAchievements(gs).achv }; // wins set outside advanceTurn still register here
  const score = runScore(gs), grade = scoreGrade(score);
  const gradeCol = { S:P.gold, A:P.green, B:P.accent, C:P.blue, D:P.orange, E:P.red }[grade];
  const scen = scenarioOf(gs);
  const [shareMsg, setShareMsg] = useState(null);
  const copyText = async (text, ok) => {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); setShareMsg(ok); return; }
    } catch (e) {}
    setShareMsg("Couldn't copy automatically. Select the text and copy it by hand.");
  };
  const copyChallenge = () => copyText(challengeCode(gs), "Challenge code copied.");
  const copyLink      = () => copyText(challengeURL(gs), "Challenge link copied.");
  const copyResult    = () => copyText(shareSummary(gs, score, grade), "Result copied, ready to paste.");
  // The native share sheet is the natural route on a phone; fall back to copying.
  const shareNative = async () => {
    const text = shareSummary(gs, score, grade);
    try {
      if (navigator.share) { await navigator.share({ title: "Cluster Manager", text }); setShareMsg("Shared."); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    copyResult();
  };
  const hist = gs.history||[];
  return (
    <div style={{height:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',padding:20,overflowY:"auto"}}>
      <div style={{textAlign:"center",maxWidth:620,maxHeight:"100%",overflowY:"auto",padding:"20px 4px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><Icon name={won?"trophy":rival?"flag":"money-bill-wave"} size={40} color={won?P.accent:P.muted}/></div>
        {gs.clusterName ? <div style={{fontSize:13,fontWeight:500,color:P.muted,marginBottom:6}}>{gs.clusterName}</div> : null}
        <h1 style={{fontSize:34,fontWeight:700,color:P.text,margin:"0 0 10px",letterSpacing:-1,lineHeight:1.1}}>
          {won ? (gs.winType==="consolidation" ? "Market consolidated" : "Pan-European Cluster Network") : rival ? `Outpaced by ${rival}` : "Cluster dissolved"}
        </h1>
        <p style={{fontSize:14,color:P.muted,margin:"0 auto 26px",lineHeight:1.6,maxWidth:"48ch"}}>
          {won
            ? `You unified all EU clusters after ${gs.turn} quarters (${yrs} years). The ${gs.sector?.name||""} sector now speaks with one European voice.`
            : rival
            ? `${rival} formed a Pan-European Cluster Network after ${gs.turn} quarters while you reached ${STAGES[gs.stage]?.name||""}. Europe consolidated without you.`
            : `Your cluster ran out of resources after ${gs.turn} quarters. Final stage: ${STAGES[gs.stage]?.name||""}.`}
        </p>
        <dl className="end-figs">
          {[
            ["coins",            fmt(gs.budget||0),                   "Final treasury"],
            ["users",            fmtN(gs.members||0),                 "Members"],
            ["flag",             STAGES[gs.stage]?.name||"",          "Final stage"],
            ["check-double",     (gs.completedProjects||[]).length+"", "Projects done"],
            ["earth-europe",     (gs.countries||[]).length+"",         "Countries"],
            ["hourglass-half",   `${yrs} years`,                      `${gs.turn} quarters`],
            ["arrow-trend-up",   fmt(gs.peak?.budget||gs.budget||0),  "Peak treasury"],
            ["chess-knight",     (gs.rivalsGone||0)+"",               "Rivals gone"],
            ["landmark",         seatsHeld(gs)+"/3",                  "Seats held"],
          ].map(([ic,v,l]) => (
            <div key={l}><dt><Icon name={ic} size={12} color={P.muted}/>{l}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        {/* ── REPORT CARD ── */}
        <div className="modal-in glass" style={{padding:"18px 20px",marginBottom:22,textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
            <div style={{fontSize:44,fontWeight:800,color:gradeCol,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',lineHeight:1}}>{grade}</div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:P.muted,letterSpacing:0,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>Report card</div>
              <div style={{fontSize:16,fontWeight:700,color:P.text,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{fmtN(score)} points</div>
              <div style={{fontSize:11,color:P.muted}}>{scen.name} · {DIFFICULTIES[gs.difficulty]?.label||gs.difficulty}{gs.seedStr?` · seed "${gs.seedStr}"`:""}</div>
            </div>
          </div>
          {hist.length >= 3 && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"4px 12px",marginBottom:10}}>
              {[["Treasury","b",P.accent],["Members","m",P.gold],["Influence","p",P.purple],["Board","bc",P.green]].map(([lbl,k,col]) => (
                <div key={k}>
                  <div style={{fontSize:11,color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{lbl}</div>
                  <Sparkline data={hist.map(x=>x[k]||0)} color={col} w={120} h={24}/>
                </div>
              ))}
            </div>
          )}
          <div style={{fontSize:11,fontWeight:700,color:P.muted,letterSpacing:0,marginBottom:5,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>Achievements {Object.keys(achvAll).length}/{ACHIEVEMENTS.length}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            {ACHIEVEMENTS.map(a => {
              const got = !!achvAll[a.id];
              return <span key={a.id} className={`ach${got?" got":""}`} title={`${a.name}: ${a.desc}`}><Icon name={got?"star":"lock"} size={10} color={got?P.accent:P.muted}/>{a.name}</span>;
            })}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn link" onClick={shareNative} title="Share your result, with a link that loads this exact starting position">
              <Icon name="bullhorn" size={12} color={P.accent}/>
              Share result
            </button>
            <button className="btn link" onClick={copyResult} title="Copies a short summary of how the run went">
              <Icon name="clipboard-list" size={12} color={P.accent}/>
              Copy summary
            </button>
            {gs.seedStr && (
              <button className="btn link" onClick={copyLink} title="A link that opens the game with this challenge already loaded">
              <Icon name="link" size={12} color={P.accent}/>
                Copy challenge link
              </button>
            )}
            <button className="btn link" onClick={copyChallenge} title="Copies a CM1|… code: a friend can paste it on the setup screen and play the identical campaign, then compare report cards">
              <Icon name="chess-knight" size={12} color={P.accent}/>
              Copy challenge code
            </button>
            {gs.seedStr ? null : (
              <span style={{fontSize:11.5,color:P.muted,alignSelf:"center"}}>Start a seeded campaign to share a replayable challenge.</span>
            )}
            {hist.length >= 2 && (
              <button className="btn link" onClick={() => downloadCSV(gs)}><Icon name="file-csv" size={12} color={P.accent}/> Export run as CSV ⬇</button>
            )}
          </div>
          {shareMsg && (
            <div role="status" style={{marginTop:10,fontSize:12,color:P.greenText}}>{shareMsg}</div>
          )}
        </div>
        <button className="btn orb" onClick={onRestart} style={{margin:"0 auto"}}>
          Play again
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PERSISTENT SAVE (artifact storage API; no-op if unavailable)
═══════════════════════════════════════════════════════════ */
const SAVE_KEY = "cluster_manager_save_v1";
const hasStore = () => typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
async function saveGame(gs) {
  if (!gs) return;
  try { if (hasStore()) await window.storage.set(SAVE_KEY, JSON.stringify(gs)); } catch(e) {}
}
// Saves from before this update stored foreign first-regions without the "(ISO)" suffix
// and had no fullCountries field. Normalise them so coverage detection and the
// expansion list behave correctly.
function migrateSave(s) {
  if (!s) return s;
  if (!s.difficulty) s = { ...s, difficulty: "expert" }; // pre-difficulty saves used the original calibration
  if (!s.seats || typeof s.seats !== "object") s = { ...s, seats: {} };
  if (!s.rivalSeats || typeof s.rivalSeats !== "object") s = { ...s, rivalSeats: {} };
  if (!s.rivalOps || typeof s.rivalOps !== "object") s = { ...s, rivalOps: {} };
  if (!Array.isArray(s.history)) s = { ...s, history: [] };
  if (!s.mix) s = { ...s, mix: defaultMix(s.members||0, s.sector?.id) };
  if (!s.focus) s = { ...s, focus: "balanced" };
  if (!s.peak) s = { ...s, peak: { budget: s.budget||0, members: s.members||0 } };
  if (!s.achv) s = { ...s, achv: {} };
  s = { ...s, rivals: (s.rivals||[]).map(rv => rv.arch ? rv : { ...rv, arch: RIVAL_ARCHETYPES[3].id, health: rv.health ?? 70, truce: rv.truce||0 }) };
  const NATSPLIT_M = {"Bulgaria":"Severozapaden","Czechia":"Prague","Greece":"Attica","Croatia":"Pannonian Croatia","Hungary":"Budapest","Ireland":"Northern & Western","Lithuania":"Capital Region","Slovenia":"Eastern Slovenia","Slovakia":"Bratislava Region","Denmark":"Capital Region","Spain":"Andalusia","Italy":"Abruzzo","Poland":"Greater Poland","Portugal":"Alentejo","Romania":"Bucharest-Ilfov"};
  s = { ...s, regions: (s.regions||[]).map(rg => NATSPLIT_M[rg] || rg), region: NATSPLIT_M[s.region] || s.region };
  const homeRegions = new Set(EU_COUNTRIES[s.country]||[]);
  const regions = (s.regions||[]).map(r => {
    if (/ \([A-Z]{2}\)$/.test(r) || homeRegions.has(r)) return r;
    const owner = (s.countries||[]).find(c => c !== s.country && (EU_COUNTRIES[c]||[]).includes(r));
    return owner ? `${r} (${NAME_TO_ISO[owner]||owner})` : r;
  });
  const next = { ...s, regions };
  if (!Array.isArray(next.fullCountries)) next.fullCountries = computeFullCountries(next);
  return next;
}
async function loadGame() {
  try { if (hasStore()) { const r = await window.storage.get(SAVE_KEY); return r && r.value ? migrateSave(JSON.parse(r.value)) : null; } } catch(e) {}
  return null;
}
async function clearSave() {
  try { if (hasStore()) await window.storage.delete(SAVE_KEY); } catch(e) {}
}
// Manual save slots: lightweight metadata + full snapshot per slot
const SLOT_KEY = i => `cluster_manager_slot_${i}`;
const SLOT_COUNT = 3;
async function saveToSlot(i, gs) {
  if (!gs) return;
  try { if (hasStore()) await window.storage.set(SLOT_KEY(i), JSON.stringify(gs)); } catch(e) {}
}
async function loadSlot(i) {
  try { if (hasStore()) { const r = await window.storage.get(SLOT_KEY(i)); return r && r.value ? migrateSave(JSON.parse(r.value)) : null; } } catch(e) {}
  return null;
}
async function readSlots() {
  const out = [];
  for (let i=0;i<SLOT_COUNT;i++) {
    const s = await loadSlot(i);
    out.push(s ? { i, stage:s.stage||0, region:s.region, sector:s.sector?.name, turn:s.turn||0,
      label:`${s.sector?.name||"Cluster"} · ${s.region||"?"}`, year:2024+Math.floor((s.turn||0)/4), q:((s.turn||0)%4)+1 } : { i, empty:true });
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════
   SAVE EXPORT / IMPORT
   Saves live in browser storage, which is lost if you clear site data
   or move to another device. These turn a run into a portable string
   (or a small file) you can keep, move or send to someone else.
═══════════════════════════════════════════════════════════ */
const SAVE_CODE_TAG = "CMSAVE1";

// UTF-8-safe base64 both ways (btoa alone mangles non-ASCII region names).
function b64encode(str) {
  if (typeof TextEncoder !== "undefined" && typeof btoa !== "undefined") {
    const bytes = new TextEncoder().encode(str);
    let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }
  return Buffer.from(str, "utf8").toString("base64"); // node (tests)
}
function b64decode(b64) {
  if (typeof TextDecoder !== "undefined" && typeof atob !== "undefined") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8"); // node (tests)
}

// A short checksum so a truncated or mistyped code fails loudly rather than
// loading a half-broken campaign.
function saveChecksum(str) {
  let h = 2166136261;
  for (let i=0;i<str.length;i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).slice(0, 6);
}

// Floats like 61.58456424774336 cost ~15 characters each and no player will
// ever notice 2 decimal places, so round the whole tree on the way out.
function roundFloats(v) {
  if (typeof v === "number") return Number.isInteger(v) ? v : Math.round(v * 100) / 100;
  if (Array.isArray(v)) return v.map(roundFloats);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) o[k] = roundFloats(v[k]);
    return o;
  }
  return v;
}

// The quarter log and the pending digest are presentation-only and account for
// most of a save's bulk, so they're left out; history is trimmed to what the
// sparklines actually display.
function slimSave(gs) {
  return roundFloats({
    ...gs,
    log: [],
    digest: null,
    pendingEvent: gs.pendingEvent || null,
    history: (gs.history || []).slice(-60),
  });
}

function exportSave(gs) {
  if (!gs) return "";
  const json = JSON.stringify(slimSave(gs));
  return `${SAVE_CODE_TAG}.${saveChecksum(json)}.${b64encode(json)}`;
}

/* Returns { ok:true, state } or { ok:false, error }. Never throws, so the UI
   can show a plain-language reason. */
function importSave(code) {
  const raw = String(code || "").trim().replace(/\s+/g, "");
  if (!raw) return { ok:false, error:"Paste a save code first." };
  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== SAVE_CODE_TAG) {
    return { ok:false, error:"That doesn't look like a Cluster Manager save code." };
  }
  const [, sum, payload] = parts;
  let json;
  try { json = b64decode(payload); }
  catch { return { ok:false, error:"The code is damaged and couldn't be decoded." }; }
  if (saveChecksum(json) !== sum) {
    return { ok:false, error:"The code looks incomplete — copy the whole thing and try again." };
  }
  let parsed;
  try { parsed = JSON.parse(json); }
  catch { return { ok:false, error:"The code is damaged and couldn't be read." }; }
  if (!parsed || typeof parsed !== "object" || typeof parsed.turn !== "number" || !parsed.sector) {
    return { ok:false, error:"That code doesn't contain a valid campaign." };
  }
  return { ok:true, state: migrateSave({ ...parsed, log: parsed.log || [] }) };
}

// Download the current run as a small file, for players who'd rather keep a
// backup than hold a long string on a clipboard.
function downloadSave(gs) {
  try {
    const name = `cluster-manager-${(gs?.sector?.name||"run").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-Q${(gs?.turn||0)}.cmsave`;
    const blob = new Blob([exportSave(gs)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch(e) { return false; }
}

/* ═══ SaveSlots panel (shown in-game via the Log/menu and on Setup) ═══ */
function SaveSlots({ gs, onClose, onLoad }) {
  const [slots, setSlots] = useState(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");   // generated export code
  const [paste, setPaste] = useState(""); // code the player is restoring
  const [msg, setMsg] = useState(null);   // {t:"good"|"bad", x:string}
  const refresh = () => readSlots().then(setSlots);
  useEffect(() => { refresh(); }, []);
  const doSave = async i => { setBusy(true); await saveToSlot(i, gs); await refresh(); setBusy(false); };
  const doLoad = async i => { const s = await loadSlot(i); if (s && onLoad) onLoad(s); };
  return (
    <Modal title="Save Slots" icon="floppy-disk" iconColor={P.accent} onClose={onClose} width={440}>
      
      {!slots ? <div style={{color:P.muted,fontSize:12}}>Loading…</div> : slots.map(s => (
        <div key={s.i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",marginBottom:6,borderRadius:0,border:`1px solid ${P.border}`,background:P.card}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:s.empty?P.muted:P.text}}>{s.empty ? `Slot ${s.i+1} — empty` : s.label}</div>
            {!s.empty && <div style={{fontSize:11.5,color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{STAGES[s.stage]?.name} · Q{s.q} {s.year}</div>}
          </div>
          {gs && <button className="btn" disabled={busy} onClick={()=>doSave(s.i)} style={{padding:"5px 11px",borderRadius:0,border:`1px solid ${P.accent}`,background:"transparent",color:P.accent,fontSize:11,fontWeight:700}}>Save here</button>}
          {!s.empty && onLoad && <button className="btn" onClick={()=>doLoad(s.i)} style={{padding:"5px 11px",borderRadius:0,border:`1px solid ${P.border}`,background:"transparent",color:P.text,fontSize:11,fontWeight:700}}>Load</button>}
        </div>
      ))}

      <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${P.border}`}}>
        <Lbl t="Move a run between devices"/>
        <div style={{fontSize:11,color:P.muted,marginBottom:9,lineHeight:1.5}}>
          Slots live in this browser only — clearing site data or switching device loses them.
          A save code (or file) is a portable copy you can keep or send to someone else.
        </div>

        {gs && (
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              <button className="btn" onClick={()=>{ setCode(exportSave(gs)); setMsg(null); }} style={{padding:"6px 12px",borderRadius:0,border:`1px solid ${P.accent}`,background:"transparent",color:P.accent,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
                <Icon name="clipboard-list" size={11} color={P.accent}/> Create save code
              </button>
              <button className="btn" onClick={()=>{ setMsg(downloadSave(gs) ? {t:"good",x:"Save file downloaded."} : {t:"bad",x:"This browser blocked the download."}); }} style={{padding:"6px 12px",borderRadius:0,border:`1px solid ${P.border}`,background:"transparent",color:P.text,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
                <Icon name="floppy-disk" size={11} color={P.muted}/> Download file
              </button>
            </div>
            {code && (
              <div>
                <textarea readOnly value={code} onFocus={e=>e.target.select()} rows={3} aria-label="Your save code — copy all of it"
                  style={{width:"100%",boxSizing:"border-box",fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',fontSize:11,padding:8,borderRadius:0,border:`1px solid ${P.border}`,background:P.bright,color:P.text,resize:"vertical",lineHeight:1.35}}/>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
                  <button className="btn" onClick={async()=>{
                    let done=false;
                    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(code); done=true; } } catch(e) {}
                    setMsg(done ? {t:"good",x:"Save code copied to the clipboard."} : {t:"bad",x:"Couldn't copy automatically — select the text and copy it manually."});
                  }} style={{padding:"5px 11px",borderRadius:0,border:`1px solid ${P.accent}`,background:"transparent",color:P.accent,fontSize:11,fontWeight:700}}>Copy</button>
                  <span style={{fontSize:11.5,color:P.muted,fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif'}}>{code.length.toLocaleString()} characters — copy all of it</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <div style={{fontSize:11,fontWeight:700,color:P.text,marginBottom:5}}>Restore from a code or file</div>
          <textarea value={paste} onChange={e=>{ setPaste(e.target.value); setMsg(null); }} rows={2} placeholder="Paste a save code here…" aria-label="Paste a save code to restore a run"
            style={{width:"100%",boxSizing:"border-box",fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',fontSize:11,padding:8,borderRadius:0,border:`1px solid ${P.border}`,background:P.card,color:P.text,resize:"vertical"}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
            <button className="btn" disabled={!paste.trim()} onClick={()=>{
              const r = importSave(paste);
              if (r.ok && onLoad) { onLoad(r.state); }
              else setMsg({t:"bad",x:r.error||"That code could not be read."});
            }} style={{padding:"6px 12px",borderRadius:0,border:`1px solid ${paste.trim()?P.green:P.border}66`,background:paste.trim()?`${P.green}0d`:"transparent",color:paste.trim()?P.greenText:P.muted,fontSize:11,fontWeight:700}}>Restore this run</button>
            <label className="btn" style={{padding:"6px 12px",borderRadius:0,border:`1px solid ${P.border}`,background:"transparent",color:P.text,fontSize:11,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
              <Icon name="folder-open" size={11} color={P.muted}/> Choose a file
              <input type="file" accept=".cmsave,.txt,text/plain" style={{display:"none"}} onChange={e=>{
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const rd = new FileReader();
                rd.onload = () => { setPaste(String(rd.result||"").trim()); setMsg({t:"good",x:`Loaded ${f.name} — press “Restore this run”.`}); };
                rd.onerror = () => setMsg({t:"bad",x:"That file couldn't be read."});
                rd.readAsText(f);
                e.target.value = "";
              }}/>
            </label>
          </div>
        </div>

        {msg && (
          <div role="status" style={{marginTop:9,fontSize:11,padding:"7px 10px",borderRadius:0,lineHeight:1.45,
            border:`1px solid ${msg.t==="good"?P.green:P.red}55`,
            background:`${msg.t==="good"?P.green:P.red}0d`,
            color:msg.t==="good"?P.greenText:P.redText}}>{msg.x}</div>
        )}
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("setup");
  const [dark, setDark] = useState(false);
  useEffect(() => { // restore theme
    try { window.storage?.get?.("cm_theme").then(r => { if (r?.value === "dark") { applyTheme(true); setDark(true); } }).catch(()=>{}); } catch(e) {}
  }, []);
  const onTheme = useCallback(() => {
    setDark(d => {
      const nd = !d; applyTheme(nd);
      try { window.storage?.set?.("cm_theme", nd ? "dark" : "light"); } catch(e) {}
      return nd;
    });
  }, []);
  const [gs, setGs]         = useState(null);
  const [vw, setVw]         = useState(typeof window!=="undefined" ? window.innerWidth : 1200);
  const [auto, setAuto]     = useState(false);
  const [savedExists, setSavedExists] = useState(false);
  const [setupSlots, setSetupSlots] = useState(false);

  const undoRef = useRef(null); // { turn, snapshot } — one step, easier difficulties only
  const [undoTick, setUndoTick] = useState(0);
  const dispatch = useCallback(action => setGs(prev => {
    if (action?.type === "nextTurn" && prev && ["junior","officer"].includes(prev.difficulty)) {
      undoRef.current = { turn: prev.turn, snapshot: JSON.parse(JSON.stringify(prev)) };
      setUndoTick(t => t+1);
    }
    return reducer(prev, action);
  }), []);
  const canUndo = !!(gs && undoRef.current && gs.turn === (undoRef.current.turn||0) + 1 && !gs.gameOver && !gs.gameWon);
  const onUndo = useCallback(() => {
    if (undoRef.current) { setGs(undoRef.current.snapshot); undoRef.current = null; setUndoTick(t => t+1); }
  }, []);
  const [snd, setSnd] = useState(true);
  const [digestOn, setDigestOn] = useState(true);
  useEffect(() => { try { window.storage?.get?.("cm_digest").then(r => { if (r?.value === "off") setDigestOn(false); }).catch(()=>{}); } catch(e) {} }, []);
  const onDigestToggle = useCallback(() => setDigestOn(v => { const nv=!v; try { window.storage?.set?.("cm_digest", nv?"on":"off"); } catch(e){} return nv; }), []);
  const [textBig, setTextBig] = useState(false);
  useEffect(() => { try { window.storage?.get?.("cm_txtscale").then(r => { if (r?.value === "big") { applyTextScale(true); setTextBig(true); } }).catch(()=>{}); } catch(e) {} }, []);
  const onTextScale = useCallback(() => setTextBig(v => { const nv=!v; applyTextScale(nv); try { window.storage?.set?.("cm_txtscale", nv?"big":"normal"); } catch(e){} return nv; }), []);
  useEffect(() => { try { window.storage?.get?.("cm_snd").then(r => { if (r?.value === "off") { sfx.on = false; setSnd(false); } }).catch(()=>{}); } catch(e) {} }, []);
  const onSnd = useCallback(() => setSnd(v => { const nv = !v; sfx.on = nv; try { window.storage?.set?.("cm_snd", nv ? "on" : "off"); } catch(e) {} return nv; }), []);

  // Track viewport width for responsive layout
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); applyTextScale(textBig); }; // re-gate zoom across the mobile/desktop breakpoint
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); };
  }, [textBig]);

  // Check for an existing save on mount
  useEffect(() => { loadGame().then(s => { if (s) setSavedExists(true); }); }, []);

  // Auto-save after every state change while in game
  useEffect(() => { if (gs && screen==="game") saveGame(gs); }, [gs, screen]);

  // Auto-advance loop: tick a quarter ~every 900ms until an event/gameover
  useEffect(() => {
    if (!auto || !gs || gs.pendingEvent || gs.gameOver || gs.gameWon || screen!=="game") return;
    const id = setTimeout(() => dispatch({type:"nextTurn"}), 850);
    return () => clearTimeout(id);
  }, [auto, gs, screen, dispatch]);

  // Stop auto-advance on win/lose
  useEffect(() => { if (gs && (gs.gameOver || gs.gameWon)) setAuto(false); }, [gs?.gameOver, gs?.gameWon]);

  function startNew(c, r, s, d, scenarioId="classic", seedStr="", clusterName="") {
    setAuto(false); clearSave(); undoRef.current = null;
    const scen = SCENARIOS.find(x => x.id === scenarioId) || SCENARIOS[0];
    const R = Math.random;
    if (seedStr) Math.random = mulberry32(hashSeed(seedStr)); // seeded: identical campaign start for shared challenges
    let g = initState(c, r, s, d);
    if (scen.apply) g = scen.apply(g);
    Math.random = R;
    g = { ...g, scenario: scen.id, seedStr, clusterName: (clusterName||"").trim() };
    if (scen.id !== "classic") g.log = [{t:"info",txt:`SCENARIO: ${scen.name} — ${scen.desc}`}, ...(g.log||[])];
    setGs(g); setScreen("game");
  }
  async function resume() { const s = await loadGame(); if (s) { setGs(s); setScreen("game"); } }
  function restart() { setAuto(false); clearSave(); setSavedExists(false); setGs(null); setScreen("setup"); }

  const eff = gs?.gameWon ? "won" : gs?.gameOver ? "lost" : screen;
  return (
    <>
      <style>{CSS}</style>
      {eff==="setup" && <Setup onStart={startNew} canResume={savedExists} onResume={resume} mobile={vw<820} dark={dark} onTheme={onTheme} onOpenSlots={()=>setSetupSlots(true)}/>}
      {eff==="setup" && setupSlots && <SaveSlots gs={null} onLoad={s => { setGs(s); setScreen("game"); setSetupSlots(false); }} onClose={()=>setSetupSlots(false)}/>}
      {eff==="game"  && <Game gs={gs} dispatch={dispatch} vw={vw} auto={auto} setAuto={setAuto} dark={dark} onTheme={onTheme} canUndo={canUndo} onUndo={onUndo} snd={snd} onSnd={onSnd} textBig={textBig} onTextScale={onTextScale} digestOn={digestOn} onDigestToggle={onDigestToggle}/>}
      {(eff==="won"||eff==="lost") && <GameOver gs={gs} onRestart={restart}/>}
    </>
  );
}
