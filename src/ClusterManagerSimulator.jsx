import { useState, useCallback, useEffect, useRef } from "react";

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

const REGIONS_BY_COUNTRY = {"Austria": [{"name": "Austria", "nuts": "AT", "ecos": ["Construction", "Cross-ecosystem", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Burgenland", "nuts": "AT11", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong"}, {"name": "Carinthia", "nuts": "AT21", "ecos": ["Electronics", "Energy Intensive Industries", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Lower Austria", "nuts": "AT12", "ecos": ["Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}, {"name": "Salzburg", "nuts": "AT32", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Tourism"], "ris": "Strong"}, {"name": "Styria", "nuts": "AT22", "ecos": ["Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Strong"}, {"name": "Tyrol", "nuts": "AT33", "ecos": ["Construction", "Cross-ecosystem", "Digital", "Energy-Renewables"], "ris": "Strong"}, {"name": "Upper Austria", "nuts": "AT31", "ecos": ["Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Vienna", "nuts": "AT13", "ecos": ["Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Vorarlberg", "nuts": "AT34", "ecos": ["Agri-food", "Cross-ecosystem", "Energy-Renewables", "Health", "Textiles"], "ris": "Strong"}], "Belgium": [{"name": "Brussels Capital Region", "nuts": "BE1", "ecos": ["Agri-food", "Construction", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Leader"}, {"name": "Flanders", "nuts": "BE2", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail"], "ris": "Leader"}, {"name": "Wallonia", "nuts": "BE3", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}], "Bulgaria": [{"name": "Severozapaden", "nuts": "BG31", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Severen tsentralen", "nuts": "BG32", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Severoiztochen", "nuts": "BG33", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Yugoiztochen", "nuts": "BG34", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Yugozapaden", "nuts": "BG41", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Yuzhen tsentralen", "nuts": "BG42", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}], "Cyprus": [{"name": "Cyprus", "nuts": "CY", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}], "Czech Republic": [{"name": "Prague", "nuts": "CZ01", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Central Bohemia", "nuts": "CZ02", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Southwest", "nuts": "CZ03", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Northwest", "nuts": "CZ04", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Northeast", "nuts": "CZ05", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Southeast", "nuts": "CZ06", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Central Moravia", "nuts": "CZ07", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Moravian-Silesia", "nuts": "CZ08", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}], "Germany": [{"name": "Baden-Württemberg", "nuts": "DE1", "ecos": ["Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong, Leader"}, {"name": "Bavaria", "nuts": "DE2", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong, Leader"}, {"name": "Berlin", "nuts": "DE3", "ecos": ["Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Brandenburg", "nuts": "DE4", "ecos": ["Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Bremen", "nuts": "DE5", "ecos": ["Aerospace and Defence", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Hamburg", "nuts": "DE6", "ecos": ["Aerospace and Defence", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Hesse", "nuts": "DE7", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong"}, {"name": "Lower Saxony", "nuts": "DE9", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong"}, {"name": "Mecklenburg-Vorpommern", "nuts": "DE8", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "North Rhine-Westphalia", "nuts": "DEA", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate, Strong, Leader"}, {"name": "Rhineland-Palatinate", "nuts": "DEB", "ecos": ["Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong"}, {"name": "Saarland", "nuts": "DEC", "ecos": ["Digital", "Electronics", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Saxony", "nuts": "DED", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate, Strong"}, {"name": "Saxony-Anhalt", "nuts": "DEE", "ecos": ["Agri-food", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Schleswig-Holstein", "nuts": "DEF", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Thuringia", "nuts": "DEG", "ecos": ["Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}], "Denmark": [{"name": "Capital Region", "nuts": "DK01", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "Zealand", "nuts": "DK02", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "Southern Denmark", "nuts": "DK03", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "Central Jutland", "nuts": "DK04", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}, {"name": "North Jutland", "nuts": "DK05", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Retail", "Textiles"], "ris": "Leader"}], "Estonia": [{"name": "Estonia", "nuts": "EE", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}], "Greece": [{"name": "Attica", "nuts": "EL30", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "North Aegean", "nuts": "EL41", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "South Aegean", "nuts": "EL42", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Crete", "nuts": "EL43", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Eastern Macedonia & Thrace", "nuts": "EL51", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Central Macedonia", "nuts": "EL52", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Western Macedonia", "nuts": "EL53", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Epirus", "nuts": "EL54", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Thessaly", "nuts": "EL61", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Ionian Islands", "nuts": "EL62", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Western Greece", "nuts": "EL63", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Central Greece", "nuts": "EL64", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Peloponnese", "nuts": "EL65", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}], "Spain": [{"name": "Andalusia", "nuts": "ES61", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Aragon", "nuts": "ES24", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Asturias", "nuts": "ES12", "ecos": ["Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Balearic Islands", "nuts": "ES53", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Basque Country", "nuts": "ES21", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Canary Islands", "nuts": "ES70", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate"}, {"name": "Cantabria", "nuts": "ES13", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Castile and León", "nuts": "ES41", "ecos": ["Agri-food", "Construction", "Digital", "Health"], "ris": "Moderate"}, {"name": "Castile-La Mancha", "nuts": "ES42", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Catalonia", "nuts": "ES51", "ecos": ["Agri-food", "Cross-ecosystem", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Extremadura", "nuts": "ES43", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate"}, {"name": "Galicia", "nuts": "ES11", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health"], "ris": "Moderate"}, {"name": "La Rioja", "nuts": "ES23", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Madrid", "nuts": "ES30", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Strong"}, {"name": "Murcia", "nuts": "ES62", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate"}, {"name": "Navarre", "nuts": "ES22", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Spain", "nuts": "ES", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Valencia", "nuts": "ES52", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Health", "Textiles", "Tourism"], "ris": "Strong"}], "Finland": [{"name": "Central Finland", "nuts": "FI193", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Textiles"], "ris": "Strong"}, {"name": "Central Ostrobothnia", "nuts": "FI1D5", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong"}, {"name": "Helsinki Uusimaa", "nuts": "FI1B1", "ecos": ["Agri-food", "Construction", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Leader"}, {"name": "Kainuu", "nuts": "FI1D8", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Kanta-Häme", "nuts": "FI1C2", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Textiles"], "ris": "Strong"}, {"name": "Kymenlaakso", "nuts": "FI1C4", "ecos": ["Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Lapland", "nuts": "FI1D7", "ecos": ["Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Tourism"], "ris": "Strong"}, {"name": "North Karelia", "nuts": "FI1D3", "ecos": ["Agri-food", "Creative and Cultural Industries", "Electronics", "Energy-Renewables", "Tourism"], "ris": "Strong"}, {"name": "North Ostrobothnia", "nuts": "FI1D9", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "North Savo", "nuts": "FI1D2", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Strong"}, {"name": "Ostrobothnia", "nuts": "FI195", "ecos": ["Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Pirkanmaa", "nuts": "FI197", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Health", "Tourism"], "ris": "Strong"}, {"name": "Päijät-Häme", "nuts": "FI1C3", "ecos": ["Agri-food", "Energy Intensive Industries", "Tourism"], "ris": "Strong"}, {"name": "Satakunta", "nuts": "FI196", "ecos": ["Agri-food", "Creative and Cultural Industries", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong"}, {"name": "South Karelia", "nuts": "FI1C5", "ecos": ["Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong"}, {"name": "South Ostrobothnia", "nuts": "FI194", "ecos": ["Agri-food", "Construction", "Digital", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "South Savo", "nuts": "FI1D1", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Proximity and Social Economy", "Tourism"], "ris": "Strong"}, {"name": "Southwest Finland", "nuts": "FI1C1", "ecos": ["Agri-food", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}], "France": [{"name": "Auvergne-Rhône-Alpes", "nuts": "FRK", "ecos": ["Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Textiles"], "ris": "Strong"}, {"name": "Bourgogne-Franche-Comté", "nuts": "FRC", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Brittany", "nuts": "FRH", "ecos": ["Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Centre-Val de Loire", "nuts": "FRB", "ecos": ["Construction", "Creative and Cultural Industries", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate"}, {"name": "Corsica", "nuts": "FRM0", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": ""}, {"name": "Grand Est", "nuts": "FRF", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Moderate"}, {"name": "Guadeloupe", "nuts": "FRY1", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Guyane", "nuts": "FRY3", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Proximity and Social Economy", "Tourism"], "ris": "Moderate"}, {"name": "Hauts-de-France", "nuts": "FRE", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate"}, {"name": "Martinique", "nuts": "FRY2", "ecos": ["Agri-food", "Construction", "Digital", "Health"], "ris": "Moderate"}, {"name": "Mayotte", "nuts": "FRY5", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Proximity and Social Economy", "Tourism"], "ris": "Moderate"}, {"name": "Normandy", "nuts": "FRD", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Nouvelle-Aquitaine", "nuts": "FRI", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate"}, {"name": "Occitanie", "nuts": "FRJ", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Pays de la Loire", "nuts": "FRG", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Moderate"}, {"name": "Provence-Alpes-Côte d'Azur", "nuts": "FRL", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Réunion", "nuts": "FRY4", "ecos": ["Agri-food", "Cross-ecosystem", "Tourism"], "ris": "Moderate"}, {"name": "Saint Martin", "nuts": "FRY1", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Île-de-France", "nuts": "FR1", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Leader"}], "Croatia": [{"name": "Pannonian Croatia", "nuts": "HR02", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Adriatic Croatia", "nuts": "HR03", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "City of Zagreb", "nuts": "HR05", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Northern Croatia", "nuts": "HR06", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}], "Hungary": [{"name": "Budapest", "nuts": "HU11", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Pest", "nuts": "HU12", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Central Transdanubia", "nuts": "HU21", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Western Transdanubia", "nuts": "HU22", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Southern Transdanubia", "nuts": "HU23", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Northern Hungary", "nuts": "HU31", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Northern Great Plain", "nuts": "HU32", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Southern Great Plain", "nuts": "HU33", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}], "Ireland": [{"name": "Northern & Western", "nuts": "IE04", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}, {"name": "Southern", "nuts": "IE05", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}, {"name": "Eastern & Midland", "nuts": "IE06", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}], "Italy": [{"name": "Abruzzo", "nuts": "ITF1", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Electronics", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate"}, {"name": "Aosta Valley", "nuts": "ITC2", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Emerging"}, {"name": "Basilicata", "nuts": "ITF5", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Calabria", "nuts": "ITF6", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Campania", "nuts": "ITF3", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate"}, {"name": "Emilia-Romagna", "nuts": "ITH5", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Strong"}, {"name": "Friuli-Venezia Giulia", "nuts": "ITH4", "ecos": ["Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Italy", "nuts": "IT", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Lazio", "nuts": "ITI4", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Liguria", "nuts": "ITC3", "ecos": ["Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Lombardy", "nuts": "ITC4", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Moderate"}, {"name": "Marche", "nuts": "ITI3", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate"}, {"name": "Molise", "nuts": "ITF2", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Piedmont", "nuts": "ITC1", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Puglia", "nuts": "ITF4", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate"}, {"name": "Sardinia", "nuts": "ITG2", "ecos": ["Construction", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Moderate"}, {"name": "Sicily", "nuts": "ITG1", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "South Tyrol", "nuts": "ITH1", "ecos": ["Agri-food", "Construction", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Trentino", "nuts": "ITH2", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong"}, {"name": "Tuscany", "nuts": "ITI1", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Moderate"}, {"name": "Umbria", "nuts": "ITI2", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Veneto", "nuts": "ITH3", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}], "Lithuania": [{"name": "Capital Region", "nuts": "LT01", "ecos": ["Digital", "Electronics", "Health"], "ris": "Moderate"}, {"name": "Central & Western Lithuania", "nuts": "LT02", "ecos": ["Digital", "Electronics", "Health"], "ris": "Moderate"}], "Luxembourg": [{"name": "Luxembourg", "nuts": "LU", "ecos": ["Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Strong"}], "Latvia": [{"name": "Latvia", "nuts": "LV", "ecos": ["Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}], "Malta": [{"name": "Malta", "nuts": "MT", "ecos": ["Aerospace and Defence", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}], "Netherlands": [{"name": "East Netherlands", "nuts": "NL2", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Health", "Textiles"], "ris": "Strong, Leader"}, {"name": "North Netherlands", "nuts": "NL1", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Strong, Leader"}, {"name": "South Netherlands", "nuts": "NL4", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Leader"}, {"name": "West Netherlands", "nuts": "NL3", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Strong, Leader"}], "Poland": [{"name": "Greater Poland", "nuts": "PL41", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Kuyavia-Pomerania", "nuts": "PL61", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Lesser Poland", "nuts": "PL21", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Lower Silesia", "nuts": "PL51", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Lublin", "nuts": "PL81", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Lubusz", "nuts": "PL43", "ecos": ["Agri-food", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Masovia", "nuts": "PL92", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Health"], "ris": "Emerging"}, {"name": "Opole", "nuts": "PL52", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Podlasie", "nuts": "PL84", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Poland", "nuts": "PL", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Pomerania", "nuts": "PL63", "ecos": ["Agri-food", "Construction", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Silesia", "nuts": "PL22", "ecos": ["Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Subcarpathia", "nuts": "PL82", "ecos": ["Aerospace and Defence", "Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Warmia-Masuria", "nuts": "PL62", "ecos": ["Agri-food", "Construction", "Energy-Renewables", "Tourism"], "ris": "Emerging"}, {"name": "West Pomerania", "nuts": "PL42", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Łódź", "nuts": "PL71", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles"], "ris": "Emerging"}, {"name": "Świętokrzyskie", "nuts": "PL72", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Emerging"}], "Portugal": [{"name": "Alentejo", "nuts": "PT18", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy", "Tourism"], "ris": "Emerging"}, {"name": "Algarve", "nuts": "PT15", "ecos": ["Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate"}, {"name": "Azores", "nuts": "PT20", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Centre", "nuts": "PT16", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Moderate"}, {"name": "Lisbon Metropolitan Area", "nuts": "PT17", "ecos": ["Agri-food", "Creative and Cultural Industries", "Cross-ecosystem", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Madeira", "nuts": "PT30", "ecos": ["Agri-food", "Digital", "Electronics", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "North", "nuts": "PT11", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Moderate"}, {"name": "Portugal", "nuts": "PT", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}], "Romania": [{"name": "Bucharest-Ilfov", "nuts": "RO32", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "Centre", "nuts": "RO12", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Emerging"}, {"name": "North-East", "nuts": "RO21", "ecos": ["Agri-food", "Cross-ecosystem", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Textiles", "Tourism"], "ris": "Emerging"}, {"name": "North-West", "nuts": "RO11", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries", "Health"], "ris": "Emerging"}, {"name": "Romania", "nuts": "RO", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Emerging"}, {"name": "South-East", "nuts": "RO22", "ecos": ["Agri-food", "Digital", "Mobility, Transport, Automotive", "Textiles", "Tourism"], "ris": "Emerging"}, {"name": "South-Muntenia", "nuts": "RO31", "ecos": ["Aerospace and Defence", "Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}, {"name": "South-West Oltenia", "nuts": "RO41", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "West", "nuts": "RO42", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Emerging"}], "Sweden": [{"name": "Blekinge", "nuts": "SE221", "ecos": ["Cross-ecosystem", "Digital", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Dalarna", "nuts": "SE312", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Strong"}, {"name": "Gotland", "nuts": "SE214", "ecos": ["Energy Intensive Industries", "Energy-Renewables"], "ris": "Strong"}, {"name": "Gävleborg", "nuts": "SE313", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Proximity and Social Economy"], "ris": "Strong"}, {"name": "Halland", "nuts": "SE231", "ecos": ["Agri-food", "Construction", "Cross-ecosystem", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Jämtland", "nuts": "SE322", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Jönköping", "nuts": "SE211", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Mobility, Transport, Automotive", "Retail", "Tourism"], "ris": "Strong"}, {"name": "Kalmar", "nuts": "SE213", "ecos": ["Agri-food", "Construction", "Energy Intensive Industries", "Energy-Renewables", "Health", "Tourism"], "ris": "Strong"}, {"name": "Kronoberg", "nuts": "SE212", "ecos": ["Agri-food", "Construction", "Digital", "Energy Intensive Industries"], "ris": "Strong"}, {"name": "Norrbotten", "nuts": "SE332", "ecos": ["Aerospace and Defence", "Creative and Cultural Industries", "Energy-Renewables", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Skåne", "nuts": "SE224", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Leader"}, {"name": "Stockholm", "nuts": "SE110", "ecos": ["Construction", "Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Södermanland", "nuts": "SE122", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Electronics", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Uppsala", "nuts": "SE121", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health"], "ris": "Leader"}, {"name": "Värmland", "nuts": "SE311", "ecos": ["Agri-food", "Creative and Cultural Industries", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Västerbotten", "nuts": "SE331", "ecos": ["Agri-food", "Construction", "Creative and Cultural Industries", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Strong"}, {"name": "Västernorrland", "nuts": "SE321", "ecos": ["Agri-food", "Digital", "Energy Intensive Industries", "Energy-Renewables", "Mobility, Transport, Automotive"], "ris": "Moderate"}, {"name": "Västmanland", "nuts": "SE125", "ecos": ["Digital", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Västra Götaland", "nuts": "SE232", "ecos": ["Aerospace and Defence", "Agri-food", "Creative and Cultural Industries", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Leader"}, {"name": "Örebro", "nuts": "SE124", "ecos": ["Agri-food", "Digital", "Mobility, Transport, Automotive"], "ris": "Leader"}, {"name": "Östergötland", "nuts": "SE123", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive"], "ris": "Leader"}], "Slovenia": [{"name": "Eastern Slovenia", "nuts": "SI03", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}, {"name": "Western Slovenia", "nuts": "SI04", "ecos": ["Agri-food", "Construction", "Digital", "Electronics", "Energy Intensive Industries", "Energy-Renewables", "Health", "Mobility, Transport, Automotive", "Tourism"], "ris": "Moderate"}], "Slovakia": [{"name": "Bratislava Region", "nuts": "SK01", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Western Slovakia", "nuts": "SK02", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Central Slovakia", "nuts": "SK03", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}, {"name": "Eastern Slovakia", "nuts": "SK04", "ecos": ["Agri-food", "Digital", "Electronics", "Energy Intensive Industries", "Health", "Mobility, Transport, Automotive"], "ris": "Emerging"}]};

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
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;background:var(--page-bg,#f0f4fb);overflow:hidden;font-size:13px;line-height:1.5}
html.dark{--page-bg:#0D1322;--scroll-bg:#1a2338;--scroll-thumb:#3a4a6e}
body{-webkit-text-size-adjust:100%;text-size-adjust:100%;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
::-webkit-scrollbar{width:5px;height:5px;background:var(--scroll-bg,#e4ecf7)}
::-webkit-scrollbar-thumb{background:var(--scroll-thumb,#aabdd8);border-radius:3px}

/* ── motion system ─────────────────────────────────────────── */
.btn{transition:transform .13s ease,box-shadow .13s ease,filter .13s ease,background .13s ease,border-color .13s ease}
.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 3px 10px rgba(20,40,90,.14)}
.btn:active:not(:disabled){transform:translateY(0) scale(.97);box-shadow:none}
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
.float-delta{position:absolute;font-family:'DM Mono',monospace;font-weight:700;font-size:12px;pointer-events:none;animation:floatUp 1.4s ease-out both;white-space:nowrap;text-shadow:0 1px 3px var(--delta-halo,rgba(255,255,255,.85)),0 0 2px var(--delta-halo,rgba(255,255,255,.85))}
html.dark .float-delta{--delta-halo:rgba(5,10,20,.92)}
.confetti-bit{position:absolute;top:-14px;width:8px;height:12px;border-radius:2px;animation:confettiFall var(--dur,2.3s) cubic-bezier(.3,.4,.6,1) var(--delay,0s) both;pointer-events:none}
.map-home{animation:breathe 3.6s ease-in-out infinite}
.map-new{animation:regionPop 1.6s ease-out both}
.map-contested{animation:shimmer 2.6s ease-in-out infinite}
/* The map sea fills its whole panel edge-to-edge; the dot grid is a fixed-size CSS
   layer so it stays crisp no matter how the SVG map scales inside it. */
.map-sea{background:radial-gradient(circle at 42% 36%, #fbfdff 0%, #eef3fb 70%, #e7edf7 100%)}
html.dark .map-sea{background:radial-gradient(circle at 42% 36%, #101a30 0%, #0b1220 70%, #0a1120 100%)}
.map-sea::before{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(#dbe4f2 1px, transparent 1px);
  background-size:15px 15px;opacity:.55}
html.dark .map-sea::before{background-image:radial-gradient(#1b2740 1px, transparent 1px);opacity:.6}
.threat-pulse{animation:threatPulse 2.4s ease-in-out infinite}
@keyframes threatPulse{0%,100%{box-shadow:0 0 0 0 var(--threat)}50%{box-shadow:0 0 0 3px color-mix(in srgb, var(--threat) 22%, transparent)}}
.sheen{position:relative;overflow:hidden}
.sheen::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.35) 50%,transparent 60%);background-size:250% 100%;background-position:120% 0;transition:background-position .01s}
.sheen:hover::after{animation:sheenSweep .8s ease}
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
@keyframes sheenSweep{from{background-position:120% 0}to{background-position:-30% 0}}
.stage-pop{animation:stagePop .5s cubic-bezier(.2,1.4,.4,1) both}
@keyframes stagePop{0%{opacity:0;transform:scale(.6) translateY(14px)}60%{opacity:1}100%{opacity:1;transform:scale(1) translateY(0)}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
.btn{cursor:pointer;border:none;font-family:'Montserrat',sans-serif;transition:all .12s;font-weight:700;-webkit-tap-highlight-color:transparent;touch-action:manipulation;font-size:inherit}
.btn:hover:not(:disabled){filter:brightness(0.88);transform:translateY(-1px)}
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
// EU Commission digital colour system (ECL v4, ec.europa.eu/component-library).
// Verified live from the official source, not an approximation.
const P = {
  bg:"#F8F9FD",     panel:"#FFFFFF",   card:"#F3F5FB",   border:"#CDD5EF",    // ecl-neutral-20/white/40/80
  bright:"#E0E5F5", text:"#26324B",    muted:"#546FA6",                      // ecl-neutral-60, ecl-dark-100, ecl-dark-80
  accent:"#3860ED", blue:"#004494",   gold:"#FF9D0A",                       // ecl-primary-100, ecl-branding, ecl-secondary-140
  red:"#DA1E28",    orange:"#F39811", green:"#24A148",                      // ecl-error, ecl-warning, ecl-success
  purple:"#5B4B8A", teal:"#5577F0",                                         // not ECL tokens: kept only to tell 3 rivals apart on the map
  // WCAG AA text variants: gold/green/red/sector colours are too light for small text on white
  goldText:"#8A5800", greenText:"#14713A", redText:"#B01722",
};
const P_LIGHT = { ...P };
const P_DARK = {
  bg:"#111829",     panel:"#161F36",   card:"#1C2742",   border:"#33436E",
  bright:"#273659", text:"#E8EDF9",    muted:"#97A8D2",
  accent:"#5C8AFF", blue:"#8AB4FF",   gold:"#FFB042",
  red:"#FF6C63",    orange:"#FFAE50", green:"#3AC96E",
  purple:"#A78BFA", teal:"#7D9BFF",
  goldText:"#FFC97C", greenText:"#63DB92", redText:"#FF9D96",
};
let THEME_DARK = false;
function applyTextScale(big) {
  if (typeof document === "undefined") return;
  // Inline font sizes are in px, so a root font-size change does nothing; zoom the app
  // container instead. Only on wider screens — on phones the fixed-height layout would
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
   ICONS: Font Awesome Free 6 (solid), embedded as raw path data.
   Source: github.com/FortAwesome/Font-Awesome (CC BY 4.0 / MIT).
   No external request, no npm dependency: works in-sandbox and
   in the standalone Vite build alike.
═══════════════════════════════════════════════════════════ */
const ICON_PATHS = {
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

/* ISO maps now come from clusterData.js (NAME_TO_ISO) */
const NAME_TO_ISO = DATA_NAME_TO_ISO;
const ISO_TO_NAME = Object.fromEntries(Object.entries(NAME_TO_ISO).map(([k,v])=>[v,k]));

/* ═══════════════════════════════════════════════════════════
   GAME DATA  ·  regions & ecosystems sourced from priorities.json
═══════════════════════════════════════════════════════════ */
// Region records (name, nuts, ecos[], ris) keyed by country, from the dataset.
// The dataset carries a country-level record (nuts = 2-letter ISO) alongside real
// NUTS-2 regions for some countries; a country is not a region of itself, so drop
// those — except where the country genuinely is a single NUTS-2 unit (EE, LV, MT...).
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

// 14 official EU industrial ecosystems, straight from the dataset.
const ECOSYSTEMS = DATA_ECOSYSTEMS;

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
  const mk = (i, sec, pace) => {
    const c = pick(); const arch = pickArch();
    return { id:"rv"+i, name:`${pickName()} ${String(sec.name).split(/[ ,]/)[0]}`,
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
  return { id:"rv"+n, name:`${name} ${String(sec?.name||"Cluster").split(/[ ,]/)[0]}`,
    country, countries:[country], sectorId:sec?.id, sectorName:sec?.name, icon:sec?.icon||"industry",
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
];

/* ── event selection: stage gates, state conditions, tokens, no repeat ── */
const EVENT_REQ = {
  misaligned:   s => !s.s3Aligned,
  lowBoard:     s => (s.boardConf||0) < 40,
  idle:         s => (s.activeProjects||[]).length === 0,
  manyProjects: s => (s.activeProjects||[]).length >= 3,
  multiCountry: s => (s.countries||[]).length >= 4,
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

// BUG FIX: overhead was ignoring hasFin due to operator precedence
const memberFee  = stage => ([500,1500,3000,5500,9000,16000][stage] ?? 500);
const calcOverhead = (stage, hasFin, regionCount=1) => {
  const base  = [2000,9000,30000,90000,280000,800000][stage] ?? 2000;
  const coord = 1 + 0.04 * Math.max(0, (regionCount||1) - 1); // every extra regional office adds 4% coordination overhead
  return Math.round(base * coord * (hasFin ? 0.80 : 1));
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
  const burn  = (gs.qStaff||0) + (gs.qOverhead||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
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
    F("salaries", -(gs.qStaff||0)), F("overheads", -(gs.qOverhead||0)), F("project delivery costs", -(gs.qDelivery||0)),
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
const FEE_W = { sme:0.78, corp:2.05, res:0.49 }; // weighted so the default 70/20/10 mix ≈ 1.0× fee income
const defaultMix = m => ({ sme:Math.round(m*0.7), corp:Math.round(m*0.2), res:Math.max(0,m-Math.round(m*0.7)-Math.round(m*0.2)) });
const mixOf = gs => {
  const mx = gs?.mix; const m = gs?.members||0;
  if (!mx) return defaultMix(m);
  const tot = (mx.sme||0)+(mx.corp||0)+(mx.res||0);
  if (tot === m) return mx;
  if (tot <= 0) return defaultMix(m);
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

const trendTitle = (t, extra) => !t ? "" :
  `Trend: ${t.delta>=0?"+":""}${Math.round(t.delta*10)/10}/quarter\n` +
  t.factors.map(f => `  ${f.v>=0?"+":""}${Math.round(f.v*10)/10}  ${f.l}`).join("\n") +
  (extra ? `\n${extra}` : "");

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
   INIT STATE  ·  starting conditions shaped by the region's real
   Regional Innovation Scoreboard tier and its S3 ecosystem fit.
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
    mix: defaultMix(Math.max(3, Math.round(baseMembers * mod.members))), focus: "balanced", peak: { budget: 0, members: 0 },
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
    qMember:0, qProj:0, qStaff:0, qOverhead:0, qDelivery:0, qInterim:0, qNet:0,
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

  // Staff-driven member growth
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

  // Finances (BUG FIX: calcOverhead now correctly applies Finance Director discount)
  const qMember   = Math.round(s.members * memberFee(s.stage) * feeMult(s));
  const qStaff    = staffCostQ(s.roster, s.turn);
  const qOverhead = calcOverhead(s.stage, fin > 0, (s.regions||[]).length);
  const qNet      = qMember + qProj - qStaff - qOverhead - qDelivery;
  s.budget    = Math.max(0, Math.round((s.budget||0) + qNet));
  s.qMember   = qMember;
  s.qProj     = qProj;
  s.qStaff    = qStaff;
  s.qOverhead = qOverhead;
  s.qDelivery = qDelivery;
  s.qInterim  = qInterim;
  s.qNet      = qNet;

  // Board confidence
  const burnRate = qStaff + qOverhead + Math.max(0, qDelivery - qInterim); // only the un-reimbursed exposure burns
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
  return { ...state, budget, members, prestige, roster, boardConf, rivals };
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
  return { ...state, fullCountries: full, prestige, members, boardConf, log };
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
      const firstRegion = (EU_COUNTRIES[action.country]||[])[0] || action.country;
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
   EU MAP · Real NUTS-2 basemap (Eurostat-derived) + interactive overlay
   Coordinate space: 609×600 (matches the baked PNG). Centroids calibrated.
═══════════════════════════════════════════════════════════════ */
const MAP_W = 609, MAP_H = 600;

// ── Vector basemap: Eurostat NUTS2json (2021, EPSG:3035, 1:20M), © EuroGeographics.
// Projected into the 609×600 viewBox at build time. Overseas territories clipped.
const NUTS2_PATHS = {"ES61":"M97.8 533.8L101.0 537.0L101.2 539.6L99.5 541.6L106.0 546.5L105.8 549.6L106.9 552.5L109.9 555.2L107.1 557.8L105.3 561.7L101.7 564.6L99.0 562.6L93.4 564.0L88.6 562.2L84.3 562.3L71.6 559.8L67.6 562.4L60.6 562.7L57.4 566.5L53.6 567.8L48.4 563.9L46.6 560.0L46.7 557.0L44.9 555.5L44.7 554.0L46.0 553.1L44.0 549.5L38.1 544.4L33.4 543.8L33.1 537.8L38.1 531.5L41.3 530.9L42.9 528.4L47.1 532.4L51.7 534.9L54.8 534.4L57.2 532.2L58.5 532.3L58.6 533.6L60.1 533.4L61.5 528.5L68.8 525.1L77.8 533.3L78.6 532.7L96.0 534.7Z","ES62":"M122.5 549.1L121.1 551.0L122.4 552.2L122.0 553.2L114.5 552.8L109.9 555.2L106.9 552.5L105.8 549.6L106.0 546.5L102.1 543.0L106.5 539.3L113.4 539.4L115.4 534.7L118.9 533.6L120.8 536.4L119.5 539.4L120.5 541.7L119.5 544.6Z","PT15":"M16.2 535.1L20.2 537.1L21.5 536.7L25.1 539.3L33.1 537.8L33.4 543.8L26.3 545.6L22.9 543.0L17.8 541.1L12.5 541.5Z","ES52":"M140.4 503.2L144.3 507.2L133.8 519.3L131.4 524.1L132.3 529.8L134.1 533.3L136.9 535.8L127.0 541.9L122.5 549.1L119.5 544.6L120.5 541.7L119.5 539.4L120.7 535.3L121.9 534.8L122.2 531.0L120.0 530.4L119.1 528.5L119.9 524.7L116.2 521.8L116.7 519.6L119.2 518.0L121.2 513.7L124.2 513.8L126.3 515.5L125.9 514.4L133.4 508.7L133.6 503.5L136.0 502.0ZM118.6 510.0L120.7 509.7L122.2 511.4L121.9 512.7L119.2 511.9Z","PT18":"M41.2 518.8L38.9 523.2L40.5 528.2L42.9 528.4L41.3 530.9L38.1 531.5L33.1 537.8L25.1 539.3L21.5 536.7L20.2 537.1L16.2 535.1L17.2 526.2L20.8 517.9L24.2 515.3L22.6 513.1L21.2 513.9L19.3 513.3L19.0 512.0L20.6 510.1L20.7 503.6L22.2 501.9L24.8 503.4L29.1 503.9L30.6 508.0L33.8 505.9L34.3 503.7L40.0 502.9L42.2 507.0L43.5 513.0L45.2 514.9Z","ES42":"M112.8 492.3L116.0 493.5L118.3 496.5L118.3 502.1L114.6 505.1L119.2 511.9L122.1 513.4L119.2 518.0L116.7 519.6L116.2 521.8L119.9 524.7L119.1 528.5L120.0 530.4L122.2 531.0L121.9 534.8L120.7 535.3L118.9 533.6L115.4 534.7L113.4 539.4L106.5 539.3L102.1 543.0L99.5 541.6L101.2 539.6L101.0 537.0L97.8 533.8L96.0 534.7L78.6 532.7L77.8 533.3L68.8 525.1L71.9 522.7L71.0 520.3L74.4 517.8L75.5 514.2L72.0 514.4L69.6 510.6L70.4 507.8L68.9 507.4L68.2 504.3L69.3 501.6L74.0 502.4L77.4 500.8L80.1 502.2L84.3 501.7L90.9 505.9L89.6 508.3L94.2 507.1L96.7 507.7L98.1 506.4L97.2 500.2L94.5 495.3L96.1 491.5L94.8 488.8L99.3 487.2L105.5 489.0L108.7 492.8ZM87.2 508.7L87.7 509.6L89.0 508.4L88.2 507.6Z","ES43":"M64.8 497.7L66.8 499.6L69.4 499.3L68.2 504.3L68.9 507.4L70.4 507.8L69.6 510.6L72.0 514.4L75.5 514.2L74.4 517.8L71.0 520.3L71.9 522.7L61.5 528.5L60.1 533.4L58.6 533.6L58.5 532.3L57.2 532.2L54.8 534.4L51.7 534.9L47.1 532.4L42.9 528.4L40.5 528.2L38.9 523.2L41.2 518.8L45.2 514.9L43.5 513.0L42.2 507.0L40.0 502.9L46.6 504.0L49.5 499.7L48.5 496.4L49.5 494.9L53.8 495.6L59.6 493.6L61.9 497.0L64.0 496.7Z","PT17":"M24.1 514.4L22.2 517.6L14.8 517.7L14.7 514.2L12.1 511.7L14.2 506.9L17.5 509.7L20.2 509.1L19.3 513.3L21.2 513.9L22.6 513.1Z","ES30":"M96.7 507.7L94.2 507.1L89.6 508.3L90.9 505.9L85.9 502.6L84.3 501.7L82.5 502.4L81.8 501.3L79.1 501.9L89.7 491.5L94.8 488.8L96.1 491.5L94.5 495.3L97.2 500.2L98.1 506.4ZM87.2 508.7L88.2 507.6L89.0 508.4L87.7 509.6Z","PT16":"M50.6 495.0L48.5 496.4L49.5 499.7L46.6 504.0L40.0 502.9L34.3 503.7L33.8 505.9L30.6 508.0L29.1 503.9L24.8 503.4L22.2 501.9L20.7 503.6L20.2 509.1L17.5 509.7L14.2 506.9L16.2 502.4L19.5 500.2L24.5 492.5L30.9 478.3L32.0 481.8L34.9 482.8L38.0 479.7L40.2 479.7L45.1 484.4L47.7 481.5L49.0 481.8L49.3 483.2L52.4 482.4L53.2 485.9L51.7 493.7Z","ES24":"M138.7 467.4L142.1 470.3L150.3 471.5L151.2 473.2L150.7 477.8L147.7 484.9L144.8 487.6L144.2 494.5L141.7 497.7L141.7 501.3L140.4 503.2L136.0 502.0L133.6 503.5L133.4 508.7L130.3 510.3L125.4 515.5L124.2 513.8L122.1 513.4L122.2 511.4L120.7 509.7L118.6 510.0L114.6 505.1L118.3 502.1L118.3 496.5L116.0 493.5L112.8 492.3L112.9 488.7L114.9 487.9L117.6 483.4L118.0 478.5L122.7 480.2L123.9 479.2L124.3 475.0L128.3 469.4L133.8 465.5L135.5 467.5ZM129.0 472.5L128.3 471.4L127.2 472.8Z","ES41":"M92.7 461.3L95.7 461.0L94.9 458.5L99.0 455.8L105.2 456.8L105.9 460.0L103.6 461.6L107.2 466.0L104.7 465.9L103.1 473.0L104.9 476.1L106.8 475.3L108.9 476.9L112.1 475.3L114.2 476.5L115.3 479.1L117.8 479.1L117.6 483.4L114.9 487.9L112.9 488.7L112.8 492.3L108.7 492.8L105.5 489.0L99.3 487.2L89.7 491.5L79.1 501.9L77.4 500.8L74.0 502.4L69.3 501.6L69.4 499.3L66.8 499.6L64.0 496.7L61.9 497.0L59.6 493.6L53.8 495.6L50.6 495.0L51.7 493.7L53.2 485.9L52.4 482.4L59.3 479.3L63.1 475.6L59.7 472.5L59.5 468.6L54.9 466.8L55.7 464.3L59.1 461.4L58.4 459.0L55.7 457.8L60.2 451.9L63.8 452.5L65.9 451.1L70.3 451.6L72.5 453.6L80.9 453.3L84.0 451.8L85.6 455.5L89.4 455.9ZM108.4 465.7L107.9 463.5L110.9 465.0L110.4 466.4Z","ES23":"M112.1 469.4L119.5 474.9L117.8 479.1L115.3 479.1L114.2 476.5L112.1 475.3L108.9 476.9L106.8 475.3L104.9 476.1L103.1 473.0L105.1 465.7L108.8 467.0L109.5 468.9Z","PT11":"M41.5 466.2L45.6 465.8L49.2 468.0L52.0 467.7L52.8 466.3L59.5 468.6L59.7 472.5L63.1 475.6L60.8 478.3L55.9 480.2L54.0 482.3L49.3 483.2L49.0 481.8L47.7 481.5L45.1 484.4L40.2 479.7L38.0 479.7L34.9 482.8L32.0 481.8L30.9 478.3L31.8 462.9L35.6 460.8L40.9 460.4L41.6 462.5L40.1 464.1L40.1 465.9Z","ES22":"M133.8 465.5L125.8 472.0L123.9 479.2L122.7 480.2L118.0 478.5L119.5 474.9L112.1 469.4L112.2 467.5L115.3 463.0L122.5 457.4L126.6 458.7L125.5 462.1L127.1 461.8ZM127.2 472.8L128.3 471.4L129.0 472.5Z","ITG2":"M263.0 515.3L260.6 519.7L261.8 522.4L259.5 537.8L253.5 536.6L252.6 539.8L250.7 541.8L247.5 541.4L246.0 539.1L244.5 540.1L244.5 532.5L246.5 525.6L244.9 524.3L245.8 519.1L244.9 516.5L243.8 513.8L241.9 513.3L242.7 508.9L246.5 509.5L250.2 507.9L255.3 502.8L259.3 504.5ZM244.5 505.9L243.2 504.8L244.1 504.2ZM243.6 536.6L243.0 538.7L242.2 537.6ZM243.4 507.2L242.9 508.6L241.8 507.7L242.5 506.6Z","FRM0":"M247.9 483.8L251.9 479.6L256.7 478.2L258.2 474.1L259.7 486.4L257.7 495.7L255.4 500.2L250.6 497.7L251.0 495.6L248.8 490.9Z","ITC3":"M255.9 446.6L259.4 447.6L259.2 450.1L261.7 450.8L265.7 456.1L263.0 455.7L255.0 450.8L250.6 449.8L244.6 454.5L242.9 457.6L235.4 460.0L235.4 458.2L238.5 454.3L241.5 454.7L244.5 447.8L252.1 447.3L252.8 445.7L255.1 447.3Z","ITC1":"M247.9 434.8L248.2 437.2L249.7 439.3L252.4 439.9L255.9 446.6L255.1 447.3L252.8 445.7L252.1 447.3L244.5 447.8L241.5 454.7L238.5 454.3L237.8 455.5L236.5 454.1L233.9 454.3L229.8 452.3L228.0 450.1L228.0 447.4L230.4 444.3L229.8 442.3L227.1 441.1L225.5 437.5L231.1 435.7L232.0 432.8L231.4 431.7L236.3 430.0L240.7 430.0L240.5 424.6L243.8 420.7L243.5 418.8L246.7 415.8L247.6 419.1L250.5 421.8L249.0 426.2L251.8 433.5L250.0 435.0Z","ITC4":"M275.3 426.3L273.0 430.0L273.1 433.3L277.8 438.1L279.7 438.3L282.4 440.9L271.4 441.5L264.2 438.0L262.2 439.1L260.1 438.0L258.4 439.0L257.0 445.1L255.9 445.4L252.4 439.9L249.7 439.3L248.2 437.2L247.9 434.8L250.0 435.0L251.8 433.5L249.0 426.2L250.5 421.8L251.8 422.3L252.7 426.3L254.2 425.6L254.1 423.1L256.7 419.6L257.5 415.2L258.9 415.5L260.4 418.4L264.4 417.4L266.5 419.5L267.3 419.0L266.0 415.7L266.7 413.8L267.9 413.1L270.7 414.7L272.6 416.0L271.4 417.8L271.5 426.5Z","ITC2":"M240.7 430.0L236.3 430.0L231.4 431.7L228.0 426.4L230.9 424.2L232.2 425.2L237.2 423.6L240.5 424.6Z","ES53":"M191.4 521.3L191.4 523.8L187.4 521.4L185.7 521.4L185.4 519.9L190.3 519.6ZM166.0 525.5L174.4 520.6L177.7 521.6L176.7 523.2L178.1 524.1L179.4 523.2L180.7 524.1L177.3 530.2L174.8 531.5L173.8 529.8L171.6 529.6L171.3 527.2L169.8 526.0L168.2 527.7ZM153.1 537.7L155.2 539.9L154.0 540.2L153.4 539.0L152.1 539.8ZM153.3 535.2L152.7 536.4L150.8 535.8L150.2 534.1L151.7 534.1L152.6 532.5L155.6 532.5L155.8 533.5Z","ES51":"M163.0 476.2L166.6 478.9L169.2 478.1L173.0 479.9L177.2 478.4L180.8 479.1L181.9 481.6L179.9 483.0L180.5 487.7L165.5 496.7L151.1 499.6L147.5 502.7L148.7 505.1L144.3 507.2L140.4 503.2L141.7 501.3L141.7 497.7L144.2 494.5L144.8 487.6L147.7 484.9L150.7 477.8L150.6 469.7L151.3 468.9L158.5 472.2L159.8 476.8Z","FRJ1":"M201.1 450.1L202.6 454.4L200.0 459.5L198.5 459.7L195.1 463.2L193.6 461.5L191.8 461.8L182.7 466.3L180.3 469.7L179.5 476.5L180.8 479.1L177.2 478.4L173.0 479.9L169.2 478.1L166.6 478.9L163.1 476.4L163.9 475.1L168.7 474.1L165.7 471.5L166.9 469.9L167.0 467.1L163.9 463.4L166.1 461.1L174.8 462.0L176.2 458.6L181.1 457.8L181.7 456.0L185.1 454.8L186.1 453.1L185.0 451.1L185.7 450.5L183.4 449.1L181.7 442.2L183.5 438.7L186.7 437.2L187.8 439.4L190.9 440.0L192.3 441.5L194.4 448.5Z","FRJ2":"M171.3 435.6L172.4 441.8L175.9 441.2L179.1 437.3L180.5 438.6L183.4 449.1L185.7 450.5L185.0 451.1L186.1 453.1L185.1 454.8L181.7 456.0L181.1 457.8L176.2 458.6L174.8 462.0L166.1 461.1L163.9 463.4L167.0 467.1L166.9 469.9L165.7 471.5L168.7 474.1L163.9 475.1L160.9 473.6L159.7 474.2L158.5 472.2L151.3 468.9L150.3 471.5L142.1 470.3L138.7 467.4L142.4 461.9L141.7 460.3L143.4 459.6L142.9 455.6L141.2 455.3L142.4 450.2L153.9 448.9L155.9 447.4L156.7 444.6L158.2 444.4L158.1 441.9L163.5 436.5L164.1 434.1L166.1 434.1L168.0 435.9Z","FRL0":"M225.5 437.5L227.1 441.1L229.8 442.3L230.4 444.3L228.0 447.4L228.0 450.1L229.8 452.3L233.9 454.3L236.5 454.1L237.8 455.5L235.4 458.2L235.4 460.0L225.4 466.3L224.2 469.7L214.2 471.1L212.4 469.0L209.1 468.3L208.1 466.2L205.2 466.0L203.1 464.4L200.3 465.2L198.7 463.8L195.1 463.2L198.5 459.7L200.0 459.5L202.6 454.4L201.2 449.1L203.8 450.7L205.3 448.0L205.8 449.8L211.1 453.3L213.4 452.2L213.0 450.3L210.9 449.2L213.3 444.9L217.9 441.9L221.7 441.1L221.1 437.0L223.1 438.2Z","FRK2":"M219.9 415.4L220.5 417.1L218.4 420.1L221.7 419.1L221.6 417.2L225.0 415.1L228.7 415.6L228.4 420.1L230.9 424.2L228.0 426.4L232.0 432.8L231.1 435.7L223.1 438.2L221.1 437.0L221.7 441.1L217.9 441.9L213.3 444.9L212.8 447.3L210.9 447.8L213.4 452.2L211.1 453.3L205.8 449.8L205.3 448.0L203.8 450.7L201.2 449.1L201.1 450.1L194.4 448.5L192.3 441.5L197.4 437.9L200.2 433.9L197.9 431.3L193.5 431.3L194.5 428.8L191.9 424.2L191.9 421.6L193.3 420.5L193.6 416.7L194.7 416.0L195.6 417.7L199.0 418.1L200.9 416.3L203.4 416.5L204.8 418.5L207.1 413.2L211.2 414.4L213.2 417.4L214.9 416.7L217.3 417.7Z","FRK1":"M192.3 407.9L193.3 411.3L196.0 413.0L195.8 415.2L193.6 416.7L193.3 420.5L191.9 421.6L191.9 424.2L194.5 428.8L193.5 431.3L197.9 431.3L200.2 433.9L197.4 437.9L192.3 441.5L190.9 440.0L187.8 439.4L186.7 437.2L183.5 438.7L181.7 442.2L179.1 437.3L175.9 441.2L172.4 441.8L171.3 435.6L173.7 431.3L176.9 429.1L177.1 422.1L179.2 419.6L179.1 416.8L176.3 411.9L179.8 410.0L181.4 407.5L185.5 406.5L187.6 408.4L190.9 408.8Z","FRI2":"M177.6 423.5L176.9 429.1L173.7 431.3L171.3 435.6L168.0 435.9L166.1 434.1L164.1 434.1L162.2 431.1L162.6 426.8L155.9 421.4L159.5 417.7L159.6 412.7L163.5 411.1L166.2 412.0L170.5 410.9L176.3 411.9L179.1 416.8L179.2 419.6L177.1 422.1Z","FRC2":"M229.6 392.5L232.9 397.8L230.7 398.9L231.6 400.6L224.9 407.0L224.2 410.0L219.9 415.4L217.3 417.7L214.9 416.7L213.2 417.4L211.2 414.4L212.7 410.9L212.6 407.4L211.1 405.4L214.5 400.2L213.5 394.1L216.6 393.8L217.2 391.7L221.6 388.7L223.0 390.0L227.3 390.5Z","FRC1":"M206.0 387.6L208.2 390.0L209.1 393.1L214.3 395.5L213.6 397.8L214.5 400.2L211.1 405.4L212.6 407.4L212.2 413.9L207.1 413.2L204.8 418.5L203.4 416.5L200.9 416.3L199.0 418.1L195.6 417.7L194.7 416.0L196.0 413.0L193.3 411.3L192.3 407.9L190.9 408.8L187.6 408.4L185.5 406.5L186.2 403.1L184.8 394.2L186.0 393.5L185.0 390.6L186.7 389.8L188.3 386.5L186.5 383.6L188.4 380.6L192.2 380.3L196.9 388.2L201.3 388.9Z","ES21":"M122.0 456.4L122.5 457.4L115.3 463.0L112.2 467.5L112.1 469.4L109.5 468.9L108.8 467.0L103.6 461.6L105.9 460.0L105.2 456.8L101.8 456.7L102.0 454.9L110.5 453.0L117.2 456.6ZM110.7 465.6L109.1 463.7L107.4 464.3L108.4 465.7L110.4 466.4Z","ES13":"M101.8 456.7L99.0 455.8L95.9 457.3L94.9 458.5L95.7 461.0L92.7 461.3L89.4 455.9L85.6 455.5L84.8 452.6L88.7 451.5L89.4 449.9L100.7 450.2L105.6 453.6L103.9 455.0L102.0 454.9Z","ES11":"M55.7 457.8L58.4 459.0L59.1 461.4L55.7 464.3L54.9 466.8L52.8 466.3L52.0 467.7L49.2 468.0L45.6 465.8L40.1 465.9L40.1 464.1L41.6 462.5L40.9 460.4L35.6 460.8L31.8 462.9L34.4 453.6L36.6 450.1L32.8 451.2L33.8 448.0L32.0 446.9L31.6 443.5L33.6 440.9L37.5 439.5L44.6 440.2L45.7 437.2L50.2 435.3L55.4 437.0L57.3 439.7L59.9 441.0L57.8 443.2L60.6 448.0L59.2 449.5L60.2 451.9Z","ES12":"M84.8 452.6L84.0 451.8L80.9 453.3L72.5 453.6L70.3 451.6L65.9 451.1L63.8 452.5L60.2 451.9L59.2 449.5L60.6 448.0L57.8 443.2L59.9 441.0L74.3 442.6L76.2 444.5L89.4 449.9L88.7 451.5Z","FRI1":"M158.9 440.9L158.2 444.4L156.7 444.6L155.9 447.4L153.9 448.9L142.4 450.2L141.2 455.3L142.9 455.6L143.4 459.6L141.7 460.3L142.4 461.9L138.7 467.4L135.5 467.5L133.8 465.5L127.1 461.8L125.5 462.1L126.6 458.7L122.0 456.4L125.6 454.0L131.9 436.7L133.2 435.6L132.1 433.6L134.8 422.4L135.9 421.9L138.6 426.1L142.4 427.0L142.9 428.9L146.8 430.5L155.9 421.4L157.6 423.5L160.4 424.2L162.6 426.8L162.2 431.1L164.1 434.1L163.5 436.5Z","FRI3":"M150.3 397.9L152.3 396.5L155.4 400.5L158.8 400.7L163.5 411.1L159.6 412.7L159.5 417.7L146.8 430.5L144.3 429.9L142.4 427.0L139.4 425.7L138.3 422.8L134.7 418.7L133.6 414.4L134.1 413.7L135.7 415.7L136.7 413.2L136.0 410.7L137.6 408.6L141.2 409.4L143.6 408.4L142.7 401.0L141.2 398.1L148.7 397.1Z","FRG0":"M162.8 380.5L162.7 384.5L159.7 388.5L156.9 389.8L155.3 389.4L152.3 396.5L150.3 397.9L148.7 397.1L141.2 398.1L142.7 401.0L143.6 408.4L141.2 409.4L135.7 409.1L129.8 404.5L126.7 398.1L129.0 395.3L127.2 393.2L127.3 391.2L124.1 389.9L124.0 388.6L129.3 385.1L137.7 383.1L139.2 384.2L142.1 380.6L142.9 372.4L147.7 373.9L152.5 373.1L153.8 376.1L157.4 375.2ZM126.1 395.8L125.1 394.4L126.2 394.5Z","FRH0":"M129.3 367.6L131.9 369.2L133.8 368.1L137.7 369.6L138.5 372.1L142.9 372.4L142.1 380.6L139.2 384.2L137.7 383.1L129.3 385.1L127.8 386.9L124.8 387.5L124.3 386.3L121.0 386.0L115.2 381.7L114.0 379.4L105.3 377.3L103.3 373.7L106.1 372.3L104.9 370.3L105.6 369.1L102.4 366.7L103.6 364.7L107.8 363.7L115.0 365.1L116.8 362.9L121.0 362.7L125.1 368.8ZM116.8 387.5L117.0 388.7L115.9 388.5L115.8 386.9Z","AT34":"M260.9 405.8L260.1 402.3L261.6 400.1L260.4 397.8L265.1 397.7L267.7 400.7L267.1 409.3Z","DE14":"M266.9 382.5L265.8 382.5L265.4 384.3L266.9 388.3L266.2 395.7L260.4 397.8L256.2 395.8L253.7 388.3L251.5 387.3L250.7 385.3L251.7 381.3L256.2 379.9L260.8 381.1L264.8 379.6L268.0 381.6Z","DE27":"M279.9 382.1L277.0 386.8L275.5 386.1L274.4 388.3L274.3 395.7L276.2 396.4L275.5 397.8L270.6 397.5L270.3 400.2L267.5 402.3L267.7 400.7L265.1 397.7L260.4 397.8L266.2 395.7L266.9 388.3L265.4 384.3L265.8 382.5L268.5 381.5L268.5 378.6L270.8 378.5L269.9 373.8L272.5 373.1L273.3 374.7L275.8 375.6L276.8 379.7Z","DE13":"M251.4 383.7L251.5 387.3L253.7 388.3L256.2 395.8L250.3 395.2L249.8 393.3L247.6 395.5L249.7 395.5L247.6 397.2L239.5 397.4L238.1 396.5L237.4 395.2L238.3 387.6L242.9 377.8L245.7 379.8L246.5 384.1L247.9 384.7L249.5 383.3Z","FRF1":"M239.5 385.4L238.3 387.6L237.4 395.2L238.1 396.5L235.7 399.1L233.9 399.1L229.9 392.3L234.2 384.3L233.0 383.3L233.0 380.5L234.7 379.5L235.3 377.2L232.4 374.2L232.9 372.7L237.7 373.8L239.5 372.1L242.5 372.3L246.0 373.7L241.3 379.6Z","FRF3":"M219.0 362.9L227.8 365.5L230.2 370.0L231.8 369.1L235.2 370.9L237.8 370.3L239.5 372.1L237.7 373.8L232.9 372.7L232.4 374.2L235.3 377.2L234.7 379.5L233.0 380.5L233.0 383.3L234.2 384.3L229.6 392.5L227.3 390.5L223.0 390.0L221.6 388.7L219.2 390.1L215.0 381.5L210.0 376.8L209.3 374.4L210.8 371.1L210.1 367.5L212.2 362.2L215.4 361.5L216.1 363.6Z","FRB0":"M180.8 380.4L181.8 382.9L183.2 383.9L186.5 383.6L188.3 386.5L186.7 389.8L185.0 390.6L186.0 393.5L184.8 394.2L186.2 403.1L185.5 406.5L181.4 407.5L179.8 410.0L176.3 411.9L170.5 410.9L166.2 412.0L163.5 411.1L158.8 400.7L155.4 400.5L152.3 396.5L155.3 389.4L156.9 389.8L159.7 388.5L162.7 384.5L162.8 378.4L165.0 376.6L164.0 372.6L169.9 371.5L172.0 369.0L172.7 373.7L175.7 377.5L176.2 380.5Z","FR10":"M179.2 365.4L184.2 368.0L189.5 367.9L193.6 372.7L192.9 374.5L194.0 376.6L192.2 380.3L188.4 380.6L186.5 383.6L183.2 383.9L180.8 380.4L176.2 380.5L175.7 377.5L172.7 373.7L172.1 367.3L174.7 364.4L175.6 365.4Z","FRF2":"M211.0 358.1L215.4 361.5L212.2 362.2L210.1 367.5L210.8 371.1L209.3 374.4L210.0 376.8L217.2 385.1L217.1 387.3L219.2 390.1L216.6 393.8L213.5 394.1L213.1 395.1L209.1 393.1L208.2 390.0L206.0 387.6L201.3 388.9L196.9 388.2L192.2 380.3L194.0 376.6L192.9 374.5L195.6 370.1L196.6 365.3L200.5 364.0L200.8 360.5L202.9 358.5L203.3 354.9L207.9 354.7L209.6 352.2L210.0 357.9Z","FRD1":"M159.9 359.2L160.1 367.4L163.2 370.6L165.0 376.6L162.8 378.4L162.8 380.5L157.4 375.2L153.8 376.1L152.5 373.1L147.7 373.9L138.5 372.1L137.7 369.6L138.6 368.8L138.6 360.9L137.2 351.8L143.3 352.8L144.3 358.8L146.3 358.0L154.4 360.9Z","FRD2":"M174.7 364.4L169.9 371.5L164.0 372.6L160.1 367.4L159.9 359.2L162.2 358.7L163.4 359.6L162.3 358.6L159.6 358.9L157.8 357.4L159.0 355.0L172.8 350.1L176.6 355.7Z","FRE2":"M184.4 348.9L184.0 350.8L203.3 354.9L202.9 358.5L200.8 360.5L200.5 364.0L196.6 365.3L195.6 370.1L193.6 372.7L189.5 367.9L184.2 368.0L174.7 364.4L176.6 355.7L172.8 350.1L175.5 348.0L175.2 346.0L178.2 346.1L181.0 348.7Z","BE34":"M222.4 350.0L222.7 352.5L219.4 357.8L220.9 361.0L219.9 363.0L216.1 363.6L215.4 361.5L211.0 358.1L212.5 356.1L211.7 354.1L214.5 353.2L216.2 348.8L219.2 349.2L219.6 350.9Z","BE35":"M214.5 353.2L211.7 354.1L212.5 356.1L211.0 358.1L210.0 357.9L209.6 352.2L207.9 354.7L205.4 355.4L204.7 350.1L207.5 349.2L207.7 345.5L212.1 344.1L214.4 348.0L216.2 348.8Z","BE33":"M221.8 342.8L225.1 345.0L224.8 346.9L226.1 347.4L226.9 350.3L223.9 353.4L222.4 350.0L219.6 350.9L219.2 349.2L214.9 348.4L212.1 344.1L212.6 342.3L216.9 343.1L219.7 341.8L221.1 343.5Z","BE32":"M199.9 341.3L207.7 345.5L207.5 349.2L204.7 350.1L205.4 355.4L202.3 354.5L203.1 350.2L201.6 348.1L198.2 348.3L197.4 345.5L194.2 344.7L193.1 340.7Z","DE12":"M261.1 366.2L252.5 370.0L253.6 375.5L252.2 377.0L251.8 383.1L247.9 384.7L246.5 384.1L245.7 379.8L242.9 377.8L248.9 368.4L248.3 363.5L250.0 364.6L250.9 363.4L253.8 365.4L259.0 362.3Z","DE11":"M266.3 364.3L266.9 369.6L269.9 373.8L270.8 378.5L268.5 378.6L268.5 381.5L264.8 379.6L260.8 381.1L256.2 379.9L251.7 381.3L252.2 377.0L253.6 375.5L252.5 370.0L261.1 366.2L258.6 360.6L261.6 360.2L264.8 365.1Z","DEC0":"M235.9 366.1L237.0 366.7L235.9 368.9L236.6 370.2L235.2 370.9L231.8 369.1L230.2 370.0L227.8 365.5L225.8 364.7L225.9 363.4L228.5 363.7L233.1 362.1L235.8 363.7Z","DEB3":"M245.8 355.9L247.6 357.5L249.0 366.4L246.0 373.7L239.5 372.1L236.6 370.2L235.9 368.9L237.0 366.7L235.4 365.6L235.8 363.7L238.5 361.1L240.5 362.1L243.4 359.2L240.5 355.7L241.4 354.9L242.9 356.7Z","LU00":"M227.3 358.8L225.8 364.7L219.9 363.0L220.9 361.0L219.4 357.8L222.7 352.5L223.9 353.4L224.2 356.2Z","DE71":"M259.9 349.3L262.6 350.7L260.2 353.0L260.2 354.6L259.0 355.2L257.6 354.2L254.6 355.5L256.0 360.9L255.4 364.5L253.8 365.4L250.9 363.4L250.0 364.6L248.3 363.5L248.6 361.0L247.0 356.6L245.9 355.8L242.9 356.7L241.5 355.2L251.1 348.7L253.8 349.3L255.2 348.3L258.7 349.9Z","DEB2":"M233.2 350.2L234.0 351.4L232.9 354.4L235.4 358.0L233.1 362.1L228.5 363.7L225.9 363.4L227.3 358.8L224.2 356.2L224.5 351.9L229.1 349.5L232.1 350.7Z","DE26":"M273.3 352.8L274.7 355.1L272.3 358.7L270.9 358.7L270.3 359.6L271.4 360.7L269.3 362.7L266.6 363.0L264.8 365.1L261.6 360.2L258.6 360.6L259.0 362.3L255.6 363.7L254.6 355.5L257.6 354.2L259.0 355.2L260.2 354.6L260.2 353.0L265.9 348.0L267.8 347.8L271.8 351.3L272.0 352.8Z","DEB1":"M245.3 351.8L240.5 355.7L243.4 359.2L242.7 360.5L241.2 360.7L240.5 362.1L238.5 361.1L235.8 363.7L233.1 362.1L235.4 358.0L232.9 354.4L234.0 351.4L230.9 349.3L232.7 346.7L238.3 344.3L242.7 340.9L245.5 345.0L245.7 346.4L243.5 349.7Z","DE72":"M258.7 349.9L255.2 348.3L253.8 349.3L251.1 348.7L247.8 351.6L245.3 351.8L243.5 349.7L245.7 346.4L246.1 342.8L249.4 340.3L254.6 340.9L256.4 342.6L261.3 344.4L259.9 349.3Z","FRE1":"M191.5 340.2L193.8 341.5L194.2 344.7L197.8 346.0L198.2 348.3L201.6 348.1L203.1 350.2L202.3 354.5L184.0 350.8L184.4 348.9L181.0 348.7L178.2 346.1L176.2 345.7L175.7 343.9L176.7 337.5L182.2 335.4L187.0 334.4L187.7 339.0L189.8 341.1Z","BE31":"M207.7 345.5L204.2 344.3L202.8 342.3L209.8 341.3L212.6 342.3L212.1 344.1Z","BE10":"M204.9 340.7L205.0 339.4L206.6 339.4L207.0 341.2L205.9 341.7Z","BE24":"M213.5 343.1L209.8 341.3L204.4 342.6L200.7 341.7L204.7 336.9L207.7 337.9L210.5 337.3L213.8 337.8ZM205.0 339.4L205.9 341.7L207.0 341.2L206.6 339.4Z","BE22":"M214.9 342.9L213.5 343.1L214.3 340.1L213.3 339.3L213.8 337.8L212.5 337.6L215.6 335.9L215.5 333.9L218.2 333.7L221.2 336.0L219.7 341.8L216.9 343.1Z","BE23":"M204.1 335.8L204.7 336.9L202.2 340.9L200.7 341.7L196.1 340.8L196.4 336.8L195.3 335.1L196.1 332.2L201.0 333.7L205.2 331.7L205.5 335.5Z","BE25":"M193.1 340.7L190.9 339.8L189.8 341.1L187.7 339.0L187.0 334.4L196.0 330.6L196.2 334.1L195.3 335.1L196.6 340.1L194.6 341.4Z","NL42":"M221.8 342.8L219.6 342.7L221.2 336.0L218.9 334.9L222.6 332.1L222.1 329.2L223.9 328.9L222.5 326.1L225.7 330.2L225.9 332.8L224.2 334.8L225.2 335.8L222.0 338.2L224.1 340.3L223.2 342.9Z","BE21":"M214.2 331.1L215.6 335.9L212.5 337.6L207.7 337.9L204.7 336.9L205.2 331.3L206.7 331.6L207.9 329.9L209.7 330.8L210.8 329.6L211.8 330.8Z","NL41":"M222.1 329.2L222.6 332.1L218.9 334.9L218.2 333.7L215.5 333.9L213.6 330.4L211.8 330.8L210.8 329.6L209.7 330.8L207.9 329.9L206.7 331.6L205.6 331.3L205.2 327.6L213.6 324.4L214.9 325.9L219.8 324.7L222.5 326.1L223.9 328.9Z","NL34":"M201.5 324.6L205.5 326.8L205.6 331.3L200.4 330.2L198.4 328.6L199.2 327.5L201.5 327.5ZM205.1 331.7L201.0 333.7L196.1 332.2L196.0 330.6Z","NL33":"M211.3 317.7L212.6 318.5L212.5 322.4L215.3 322.7L213.6 324.4L205.5 326.8L201.5 324.6L203.8 323.1L203.5 321.1L204.9 320.8L209.1 315.6L210.2 315.9L209.7 317.3Z","EL43":"M461.9 582.2L470.0 579.7L477.9 580.0L480.6 579.1L482.4 582.0L488.0 578.8L488.8 579.8L487.2 582.9L469.4 587.7L468.1 585.4L452.6 585.9L451.3 584.4L451.5 581.2L453.1 581.0L453.4 578.6L455.0 580.3L459.2 578.9ZM461.1 590.6L460.6 591.8L458.9 590.9Z","EL42":"M508.0 562.1L506.2 563.2L505.2 559.6L506.7 556.1L511.0 553.8L510.0 559.6ZM506.0 551.8L504.8 552.6L503.9 551.2ZM499.9 555.7L498.3 556.4L499.3 555.0ZM495.7 550.6L494.9 551.6L493.6 551.4L496.8 548.4L498.0 549.1ZM497.2 554.1L495.6 554.7L495.5 553.7ZM500.3 572.4L498.9 573.0L498.1 570.5L499.5 566.7ZM493.4 548.5L492.2 549.3L491.6 548.6L492.5 547.5ZM492.0 540.5L491.0 541.2L489.7 540.3L491.0 539.6ZM493.8 552.6L493.4 553.4L492.4 551.8L493.1 551.4ZM497.7 573.9L495.7 575.2L496.6 573.6ZM489.1 544.6L487.9 545.2L488.1 543.4L489.4 543.5ZM487.3 556.1L486.2 557.9L484.2 556.8L486.0 556.5L486.3 555.0ZM480.9 551.9L477.9 555.3L477.1 554.9L480.3 551.2ZM479.4 561.3L478.9 562.4L477.5 562.0L478.2 560.7ZM473.8 552.7L472.7 553.6L471.0 551.5L472.8 548.8L474.0 550.0ZM474.9 562.7L473.7 563.0L474.0 561.2ZM471.0 544.9L469.2 545.6L469.1 544.6ZM472.7 557.1L472.3 558.4L470.7 556.2ZM469.0 546.7L468.1 547.7L468.5 545.2ZM469.8 551.9L468.8 553.4L467.0 553.3L468.3 551.0ZM467.9 544.1L464.5 542.7L467.7 542.7ZM469.8 558.3L469.1 559.4L468.2 558.9L469.5 557.5ZM464.1 541.3L463.6 541.9L460.2 539.6L460.1 538.3L463.1 539.1ZM467.3 560.5L466.3 561.0L465.7 560.0L466.5 558.8ZM464.7 547.3L463.8 547.8L463.5 545.4ZM463.7 555.0L462.9 555.8L461.8 554.7L462.3 553.7ZM462.6 558.0L460.5 558.1L461.0 557.0ZM460.1 552.4L458.5 552.6L458.8 551.4ZM461.2 559.5L458.4 560.8L459.3 558.8ZM458.0 549.5L457.3 549.8L457.3 547.4ZM456.9 544.2L455.7 546.8L455.3 544.5Z","EL65":"M438.9 540.7L439.9 542.4L438.7 543.7L441.3 549.2L444.5 550.7L440.8 552.7L439.9 550.9L435.3 549.6L435.2 551.0L439.6 557.7L441.9 565.5L436.4 563.0L433.7 567.8L428.3 560.9L426.4 561.6L425.2 564.2L423.1 563.3L421.2 559.7L421.6 555.0L424.1 554.3L425.1 552.7L422.7 550.9L422.3 547.5L428.2 546.2L427.7 544.9L428.9 541.0L435.9 543.1L436.9 542.5L436.4 541.1Z","CY00":"M569.5 560.9L571.4 560.8L573.9 557.3L577.2 556.7L576.6 552.9L586.3 550.6L596.5 541.6L590.1 551.2L593.0 554.4L590.9 556.4L588.6 556.5L588.1 559.5L582.6 563.0L581.0 564.6L581.2 565.8L580.4 566.2L579.1 564.9L574.0 565.8Z","EL30":"M451.1 545.1L446.4 541.4L443.7 542.2L445.2 540.4L439.9 542.4L438.9 540.7L439.9 539.4L438.7 538.9L441.4 537.0L444.0 538.5L445.6 534.8L450.5 536.4L452.0 544.2ZM452.1 548.7L450.8 549.2L450.0 548.2L451.3 547.7ZM453.6 559.1L452.4 559.8L451.4 558.9L452.5 558.1ZM445.2 545.9L444.6 546.3L443.5 544.9L445.2 544.5ZM446.8 558.3L447.5 559.9L445.6 558.4ZM445.9 550.9L446.3 552.5L444.5 552.1ZM445.0 549.8L444.5 550.7L441.3 549.2L441.1 548.2L442.7 548.5L443.6 547.1ZM442.0 553.4L440.9 554.7L440.7 553.2ZM442.6 571.1L442.7 572.5L441.3 572.3L440.2 569.8L440.9 568.7Z","EL63":"M428.2 546.2L422.3 547.5L422.7 550.9L425.1 552.7L424.1 554.3L421.6 555.0L413.1 547.4L415.9 542.1L419.0 542.4L421.8 539.0L428.9 541.0L427.7 544.9ZM421.8 531.4L423.1 535.0L421.6 538.3L412.7 540.4L406.2 532.4L407.5 531.0L410.3 531.4L410.7 527.6L413.5 526.1L417.3 532.9L420.1 533.0Z","EL64":"M457.3 525.0L456.6 526.0L453.6 524.2L454.1 522.4ZM435.1 525.5L434.4 526.8L429.9 528.9L439.6 530.8L440.4 533.0L442.6 531.7L436.8 527.4L437.5 525.3L439.1 525.1L443.1 527.6L449.9 529.0L453.3 534.5L457.1 537.5L456.3 538.6L454.2 538.5L449.3 533.7L445.1 534.7L445.2 537.0L444.0 538.5L441.4 537.0L438.7 538.9L434.5 538.6L431.4 537.0L431.1 537.9L429.1 536.2L426.0 538.2L421.6 538.3L423.1 535.0L422.6 531.5L420.1 533.0L417.3 532.9L416.8 531.0L414.2 528.6L413.8 526.2L417.5 524.4L422.3 526.8L424.7 522.7L428.8 525.8ZM435.5 527.7L434.9 528.7L433.5 528.2L434.2 527.1Z","EL41":"M490.2 536.3L488.5 537.8L485.2 537.1L487.2 535.4ZM477.8 512.6L480.9 515.8L480.1 517.1L475.5 517.2L475.1 515.2L473.6 516.4L471.1 515.5L471.3 513.9L474.7 511.5L476.6 510.9ZM479.4 541.5L477.6 542.5L478.5 540.4L482.2 539.1ZM474.7 524.6L477.0 524.9L477.7 529.0L476.3 532.0L474.1 530.9L475.4 528.9L472.7 526.0ZM470.1 525.7L470.1 527.1L469.0 526.9L469.4 525.3ZM459.8 504.1L462.7 503.5L462.6 506.7L460.9 505.6L460.4 507.3L458.6 505.8ZM460.1 511.8L459.1 513.6L459.0 511.2Z","MT00":"M328.0 590.4L325.5 590.6L324.7 588.6ZM324.5 587.2L323.8 588.1L322.4 587.1Z","ITG1":"M333.7 565.0L335.6 566.5L336.8 570.0L334.7 573.3L334.7 576.2L326.7 574.8L324.0 571.5L315.0 568.9L304.2 562.9L301.2 563.0L298.0 559.6L298.8 555.9L302.0 553.5L305.0 555.2L306.5 553.0L309.2 552.2L315.0 555.8L323.6 554.7L328.6 552.1L333.1 552.2L339.1 549.3L338.9 551.6L335.5 557.5ZM330.0 544.5L330.8 547.2L328.5 545.4ZM305.3 590.6L305.6 592.0L304.3 592.0L303.7 591.1ZM293.2 577.0L291.4 575.9L293.2 576.2Z","ITF3":"M328.5 496.7L331.7 500.5L332.1 502.6L335.7 503.4L335.6 505.8L333.3 507.2L339.8 516.3L338.2 520.0L334.4 521.0L329.0 517.6L329.4 514.7L326.5 510.6L322.5 511.5L321.5 509.4L316.7 507.2L313.0 501.9L315.6 497.8L316.6 498.7L317.7 497.1L322.3 498.8ZM316.1 509.7L315.6 510.8L314.3 510.5L314.4 509.4Z","ITF2":"M328.5 496.7L322.3 498.8L317.7 497.1L316.6 498.7L314.9 494.1L317.3 492.9L318.4 490.8L320.3 490.8L321.7 492.5L324.9 487.1L329.7 489.2L329.6 493.0L327.7 494.9Z","ITI4":"M301.3 479.3L304.0 478.6L304.8 477.2L306.9 477.7L307.4 479.4L304.9 479.9L304.4 481.9L307.0 486.5L303.2 487.5L303.8 489.0L308.3 492.2L314.9 494.1L315.6 497.8L313.0 501.9L307.1 501.1L304.2 502.1L298.4 498.5L283.5 483.8L287.0 479.4L287.0 476.9L288.8 476.0L289.9 478.3L292.8 479.3L296.3 483.1ZM295.0 491.7L297.0 491.7L296.6 490.4Z","ITF1":"M318.4 490.8L317.3 492.9L314.9 494.1L308.3 492.2L303.8 489.0L303.2 487.5L307.0 486.5L304.4 481.9L304.9 479.9L307.4 479.4L306.9 477.7L309.2 475.8L313.7 474.1L316.8 480.0L324.9 487.1L321.7 492.5L320.3 490.8Z","ITI2":"M299.2 465.3L301.3 473.5L305.3 474.9L304.0 478.6L301.3 479.3L296.3 483.1L292.8 479.3L289.9 478.3L288.8 476.0L289.5 470.5L291.6 468.7L290.8 466.2L292.4 463.0L297.5 465.8Z","ITI3":"M309.8 464.6L313.7 474.1L306.9 477.7L304.8 477.2L305.3 474.9L301.3 473.5L299.2 465.3L297.5 465.8L292.4 463.0L294.7 458.1L297.6 459.1L298.7 456.8L308.8 462.6Z","ITI1":"M275.3 454.9L279.9 455.1L282.4 453.1L286.1 454.6L286.1 458.7L293.5 461.2L290.8 466.2L291.6 468.7L289.5 470.5L289.3 475.4L287.0 476.9L287.0 479.4L283.5 483.8L279.7 483.4L279.6 481.3L275.2 477.1L274.1 474.5L271.8 474.2L271.6 469.2L269.1 463.8L268.6 460.0L261.7 450.8L264.2 449.2L272.9 454.9ZM277.5 484.1L276.4 485.2L275.9 484.2L276.4 483.5ZM270.9 476.1L270.7 478.2L267.0 478.0L266.6 477.2ZM264.0 472.8L263.2 473.9L262.6 472.9L263.3 471.6Z","ITH5":"M264.2 438.0L271.4 441.5L273.7 440.7L284.8 441.6L289.5 440.2L292.2 440.9L294.0 443.2L292.6 442.8L292.6 446.0L294.1 452.7L298.7 456.8L297.6 459.1L295.6 457.8L295.6 456.7L293.1 460.4L291.0 460.7L286.1 458.7L286.1 454.6L282.4 453.1L279.9 455.1L272.9 454.9L264.2 449.2L261.7 450.8L259.2 450.1L259.4 447.6L255.9 446.6L257.7 443.0L257.2 441.2L260.1 438.0L262.2 439.1Z","EL61":"M448.5 517.0L448.4 518.2L447.0 518.3L447.8 516.4ZM448.0 521.5L447.5 522.2L446.4 521.4L446.4 518.8ZM444.6 521.6L444.1 522.7L442.6 521.6ZM441.2 521.1L440.9 522.8L439.9 522.3L439.9 521.1ZM428.2 510.3L432.3 515.9L438.7 521.6L437.4 522.8L435.5 520.5L432.8 520.9L432.3 522.5L435.1 525.5L428.8 525.8L424.7 522.7L422.3 526.8L417.5 524.4L413.5 526.1L413.3 523.6L410.3 521.1L409.5 518.4L411.0 515.0L418.9 513.9L418.7 511.9L420.7 507.9L422.3 508.7L423.5 507.9L426.7 510.8ZM435.9 522.4L436.5 524.0L435.2 524.1Z","EL53":"M411.0 515.0L408.3 514.8L406.6 510.7L404.7 508.1L403.3 507.9L406.2 502.9L404.8 499.1L414.7 496.3L414.5 498.4L416.8 500.2L417.8 503.3L421.2 505.9L418.7 511.9L418.9 513.9Z","EL52":"M443.7 490.1L443.5 491.7L439.6 496.3L442.0 499.7L444.1 500.4L444.2 501.7L442.2 501.0L440.6 502.9L444.5 505.2L444.5 507.7L439.9 504.1L435.3 504.7L431.5 503.4L429.7 501.8L429.7 499.2L426.2 502.5L426.4 507.8L428.2 510.3L426.7 510.8L423.5 507.9L422.3 508.7L420.7 507.9L421.2 505.9L417.8 503.3L416.8 500.2L414.5 498.4L416.1 493.3L419.5 491.5L421.1 492.1L425.9 490.6L426.2 488.1L427.3 487.3L436.5 485.1L439.3 488.4ZM441.0 508.1L441.1 509.0L437.0 509.0L436.0 505.7Z","ITF6":"M350.1 525.2L358.3 529.3L359.0 536.7L355.7 537.2L351.8 540.4L352.3 545.1L347.8 550.4L346.2 554.4L341.9 555.0L340.5 553.6L340.3 550.4L342.3 548.6L343.5 545.2L342.6 542.8L347.0 539.9L339.7 521.9L341.2 520.5L343.8 521.9L346.7 521.3L348.3 517.8L350.9 517.8L349.5 523.2Z","EL62":"M409.3 536.4L408.7 537.8L408.4 535.6ZM408.3 548.9L410.4 550.6L409.6 552.0L406.7 549.8L407.4 548.1ZM405.6 541.5L408.4 545.5L402.1 544.3L402.7 541.9L404.4 541.4L404.2 539.3ZM407.6 541.5L406.6 541.7L405.3 539.3L406.5 539.4ZM406.6 536.2L404.1 536.7L404.9 533.1L405.7 532.8ZM394.4 523.3L395.0 524.6L390.0 519.6L390.7 518.8L393.6 518.6L393.0 520.3Z","EL54":"M410.3 521.1L413.3 523.6L413.5 526.1L410.4 528.7L405.5 530.3L401.7 526.1L399.4 525.8L396.9 521.0L394.9 520.1L397.7 520.2L398.4 517.5L399.5 517.8L398.7 514.7L401.8 512.6L403.3 507.9L404.7 508.1L406.6 510.7L408.3 514.8L411.0 515.0L409.5 518.4Z","ITF5":"M351.2 507.8L351.4 511.3L353.4 512.9L350.9 517.8L348.3 517.8L346.7 521.3L343.8 521.9L341.2 520.5L339.7 521.9L338.2 520.0L339.8 516.3L333.3 507.2L335.6 505.8L335.7 503.4L339.8 501.6L341.7 502.9L342.3 504.9L344.2 505.0L347.2 508.0Z","ITF4":"M359.3 504.1L367.2 507.2L373.0 512.3L374.6 514.9L373.6 520.6L369.5 519.2L367.7 515.4L365.0 513.5L361.4 513.6L356.4 510.7L353.4 512.9L351.4 511.3L351.2 507.8L347.2 508.0L344.2 505.0L342.3 504.9L341.7 502.9L339.8 501.6L335.7 503.4L332.1 502.6L327.7 494.9L329.6 493.0L329.7 489.2L342.1 488.6L342.8 490.8L339.7 494.2L341.4 496.7L355.0 501.5ZM335.2 485.1L334.2 486.2L333.6 484.8Z","HR03":"M369.7 475.1L371.1 477.2L359.2 470.8L361.8 470.4ZM327.0 430.9L326.2 433.0L324.4 433.5L324.8 436.2L327.4 436.6L330.3 438.9L333.6 438.7L334.4 441.4L336.3 442.3L338.8 445.6L339.7 450.3L350.8 460.0L354.2 461.6L354.4 463.6L359.4 468.4L358.3 471.2L356.2 470.6L356.9 469.3L355.6 467.8L350.5 464.8L345.7 465.1L346.7 463.2L344.7 462.0L338.7 462.3L336.2 458.8L330.6 455.8L327.9 452.2L328.2 450.5L329.7 449.6L324.6 445.6L323.3 437.8L321.8 436.7L321.7 438.5L319.3 437.9L318.7 434.6L317.3 433.5L312.4 442.6L311.3 441.9L308.0 436.3L306.9 431.5L317.0 430.4L319.0 427.3L322.4 430.5L324.0 429.7ZM354.2 469.4L353.4 470.8L347.6 471.4L347.3 470.7L350.8 470.1L352.0 468.9ZM351.0 467.0L351.2 467.7L348.5 467.4ZM346.9 466.3L347.4 467.9L344.0 467.2ZM345.0 481.0L343.0 480.6L344.6 479.8ZM342.0 470.1L339.7 469.7L342.0 469.2ZM329.9 456.4L330.2 458.5L328.8 457.6ZM329.1 456.4L328.4 457.1L327.1 456.0L326.0 454.4L326.6 453.4ZM327.5 448.1L327.7 449.5L325.9 446.9ZM324.9 451.6L325.2 453.6L323.8 452.5ZM322.6 442.1L321.8 442.6L321.1 441.4L322.5 440.7ZM321.1 449.0L320.0 449.2L320.2 447.3ZM318.4 445.1L318.8 446.4L317.2 446.2L316.8 440.2L317.6 438.9L319.2 444.9ZM317.3 436.2L317.1 437.9L316.0 436.8L316.6 435.7Z","EL51":"M471.5 485.1L468.3 489.8L467.0 488.3L456.4 487.8L452.8 490.8L448.5 490.1L444.5 494.5L441.2 494.4L443.7 490.1L439.3 488.4L436.5 485.1L441.3 482.9L441.5 481.7L447.0 480.2L450.9 482.6L452.3 482.0L456.6 483.1L464.9 480.7L467.7 478.0L465.9 473.6L469.2 472.8L472.2 474.0L473.5 477.6L470.5 480.6ZM465.2 495.7L463.5 496.5L461.8 495.5L464.5 494.6ZM452.9 494.7L451.2 496.2L449.7 494.4L450.0 493.0L451.0 492.2Z","BG41":"M428.9 456.3L431.2 458.3L436.0 456.6L439.2 460.5L441.9 460.8L443.2 463.1L437.3 464.9L438.5 467.4L436.1 471.5L437.3 477.0L441.2 479.2L441.3 482.9L427.9 487.3L427.8 480.5L425.4 476.1L420.7 474.7L418.4 472.5L420.2 470.0L418.1 463.8L421.7 462.1L424.0 456.6L426.2 457.5Z","BG42":"M449.4 459.5L450.3 462.7L452.2 463.4L452.1 467.8L455.5 468.9L458.3 467.2L460.7 468.5L462.2 467.4L465.0 468.2L465.5 465.1L469.1 465.3L470.9 470.3L468.9 471.4L469.2 472.8L465.9 473.6L467.4 476.1L467.2 479.3L456.6 483.1L452.3 482.0L450.9 482.6L447.0 480.2L441.5 481.7L441.2 479.2L437.3 477.0L436.1 471.5L438.5 467.4L437.3 464.9L440.4 463.4L442.9 463.9L441.9 460.8L443.5 459.9L446.4 460.5Z","BG34":"M473.8 450.5L475.6 449.7L483.6 450.1L483.8 452.0L480.5 456.9L483.0 457.8L488.6 463.6L482.9 465.6L479.0 464.1L476.4 464.7L475.3 466.5L470.9 468.7L469.1 465.3L465.5 465.1L465.0 468.2L462.2 467.4L460.7 468.5L458.3 467.2L455.5 468.9L452.1 467.8L452.2 463.4L450.3 462.7L449.5 459.3L461.4 455.7L464.3 451.4L467.5 451.4L467.9 452.4Z","BG31":"M429.8 445.4L435.8 445.8L440.0 444.1L450.0 443.7L449.1 444.6L450.2 449.1L448.9 452.1L447.7 452.3L447.1 455.9L449.4 459.5L446.4 460.5L439.2 460.5L436.0 456.6L431.2 458.3L428.9 456.3L426.2 457.5L417.3 452.3L414.8 448.1L414.8 444.7L416.9 442.7L417.3 440.4L421.9 442.6L420.3 445.6L422.2 446.5L427.0 444.9Z","BG32":"M470.1 438.6L467.8 444.0L465.8 445.4L462.8 443.7L459.5 444.5L458.9 446.3L462.7 453.0L461.4 455.7L449.5 459.3L447.1 455.9L447.7 452.3L448.9 452.1L450.2 449.1L449.1 444.6L453.0 443.3L458.7 436.5L467.9 431.5L471.7 430.8L473.5 432.2L477.2 431.9L472.8 436.6L472.7 438.5Z","BG33":"M484.0 441.8L483.0 444.3L483.6 450.1L475.6 449.7L467.9 452.4L467.5 451.4L464.3 451.4L462.7 453.0L458.9 446.3L459.5 444.5L461.1 443.7L465.8 445.4L467.8 444.0L470.1 438.6L472.7 438.5L472.8 436.6L477.2 431.9L479.8 431.2L481.4 433.4L488.5 433.4L489.4 437.1L488.8 439.2L485.2 439.9Z","RO41":"M442.9 432.8L443.1 437.6L440.9 439.8L442.7 442.8L442.2 444.1L435.8 445.8L427.0 444.9L422.2 446.5L420.3 445.6L421.9 442.6L417.3 440.4L414.3 436.9L417.1 435.0L416.6 434.1L413.0 433.0L410.3 437.0L408.5 435.4L409.9 434.9L410.2 431.7L412.6 431.8L414.6 423.2L424.8 419.7L424.6 417.7L434.9 413.9L436.2 426.2L439.4 427.7L441.4 432.6Z","RO31":"M446.0 414.0L453.0 411.4L456.0 415.5L458.4 415.9L461.3 420.7L468.5 420.2L475.5 418.3L480.0 423.2L479.6 425.3L478.8 426.8L471.7 430.8L467.9 431.5L458.7 436.5L453.0 443.3L442.2 444.1L442.7 442.8L440.9 439.8L443.1 437.6L442.9 432.8L441.4 432.6L439.4 427.7L436.2 426.2L434.9 413.9L441.6 412.7L444.7 415.3ZM459.2 430.8L460.3 426.7L458.1 422.9L454.5 424.7L454.2 427.8L455.1 430.9L457.7 431.7Z","RO32":"M454.2 427.8L454.5 424.7L458.1 422.9L460.3 426.7L459.2 430.8L457.7 431.7L455.1 430.9Z","RO42":"M411.4 404.3L414.3 405.2L419.0 409.8L422.3 415.9L424.6 417.7L424.8 419.7L414.6 423.2L412.6 431.8L410.2 431.7L409.9 434.9L404.0 434.9L400.2 432.9L402.3 431.5L400.3 429.9L400.7 426.6L395.0 425.2L392.3 422.8L391.6 418.5L389.8 418.0L384.4 413.2L389.4 411.9L390.0 409.9L393.0 409.8L395.6 406.4L395.4 403.6L396.7 402.5L403.7 401.6L408.6 404.8Z","HR02":"M354.8 421.5L364.1 422.0L366.4 419.3L369.0 418.6L370.1 424.3L371.8 425.0L371.3 427.4L376.7 430.4L373.1 431.4L373.6 434.4L372.6 436.1L370.7 436.4L369.1 433.8L366.3 433.0L360.2 432.9L358.2 434.4L347.4 432.3L342.9 433.1L340.2 437.0L336.6 434.1L334.4 433.8L333.6 438.7L330.3 438.9L327.4 436.6L324.8 436.2L324.4 433.5L326.2 433.0L328.5 429.8L327.8 425.3L330.6 427.7L336.8 429.2L337.5 426.9L341.6 427.1L342.9 425.6L341.7 424.2L343.5 422.5L343.8 419.5L345.0 418.7L348.5 421.5L350.4 419.6Z","HR05":"M335.0 422.4L337.2 421.1L338.1 423.7L334.6 426.9L333.3 425.7Z","HR06":"M345.0 418.7L343.8 419.5L343.5 422.5L341.7 424.2L342.9 425.6L341.6 427.1L337.5 426.9L336.8 429.2L330.6 427.7L327.8 425.3L331.5 423.7L332.0 421.4L330.9 418.0L336.4 414.0L338.3 414.1L337.5 412.3L338.9 411.4L344.7 414.0L350.4 419.6L348.5 421.5ZM337.2 421.1L333.7 423.6L333.3 425.7L334.6 426.9L338.1 423.7Z","HU23":"M367.6 403.1L368.6 405.5L367.7 407.0L368.5 412.4L367.2 416.6L368.3 417.2L368.2 418.9L366.4 419.3L364.1 422.0L354.8 421.5L350.4 419.6L345.0 414.5L346.4 414.4L348.3 412.2L348.7 407.8L359.2 402.1L359.6 405.3L363.6 405.0L364.9 406.0Z","HU33":"M398.2 396.0L396.7 402.5L395.4 403.6L395.6 406.4L393.0 409.8L390.0 409.9L389.4 411.9L384.4 413.2L377.8 413.0L373.6 416.9L371.4 416.8L368.2 418.9L368.3 417.2L367.2 416.6L368.5 412.4L367.7 400.2L370.7 398.3L372.0 399.6L374.2 397.9L377.2 400.2L380.6 398.8L380.7 402.2L382.5 402.2L384.7 401.7L385.1 400.1L387.5 399.2L390.2 393.7L393.7 394.7L394.3 397.0L396.7 397.4Z","HU22":"M354.8 395.5L353.6 396.7L352.7 394.7L346.7 395.7L347.6 401.0L346.2 402.1L350.6 406.7L348.7 407.8L348.3 412.2L346.4 414.4L341.6 412.2L337.8 406.2L335.5 406.1L339.0 403.4L338.5 397.8L340.7 396.0L340.7 393.4L337.9 392.6L339.8 391.1L344.7 391.1L345.7 386.1L352.2 389.6L354.4 389.7Z","HU21":"M363.5 391.4L367.7 400.2L367.6 403.1L364.9 406.0L363.6 405.0L359.6 405.3L359.2 402.1L350.6 406.7L346.2 402.1L347.6 401.0L346.7 395.7L352.7 394.7L353.6 396.7L354.8 395.5L354.4 389.7L364.9 387.2L365.3 389.7Z","ITH3":"M294.3 416.1L292.7 418.5L294.3 420.7L293.4 422.4L296.6 426.4L300.3 425.6L301.8 428.7L296.9 431.1L294.9 430.8L290.6 434.9L294.7 440.6L294.0 443.2L292.2 440.9L289.5 440.2L284.8 441.6L282.4 440.9L274.0 435.0L273.0 430.0L275.3 426.3L276.2 428.4L278.8 428.5L281.6 423.8L285.1 423.6L285.3 421.9L287.8 420.1L286.5 418.1L286.5 414.8L289.4 412.2L296.4 412.0L296.7 413.8Z","SI04":"M318.9 425.4L317.8 424.2L313.7 424.4L312.8 426.2L313.9 430.9L308.4 431.6L307.9 430.6L311.2 428.4L307.5 425.7L307.7 423.1L306.2 421.7L307.8 419.7L304.8 417.4L308.0 415.2L308.3 413.7L316.7 414.6L322.4 418.2L321.0 420.5L323.1 421.9L321.2 425.7Z","ITH2":"M278.8 428.5L276.2 428.4L275.3 426.3L271.5 426.5L271.4 417.8L272.6 416.0L278.9 415.0L278.9 418.6L279.8 419.3L283.5 417.2L284.9 415.0L286.5 414.8L286.5 418.1L287.8 420.1L285.3 421.9L285.1 423.6L281.6 423.8Z","ITH4":"M307.5 425.7L309.7 426.6L311.2 428.4L310.5 429.2L309.2 429.2L309.1 427.6L307.3 426.1L305.3 427.2L302.2 426.7L301.8 428.7L300.3 425.6L296.6 426.4L293.4 422.4L294.3 420.7L292.7 418.5L296.9 412.3L308.3 413.7L308.0 415.2L304.8 417.4L307.8 419.7L306.2 421.7L307.7 423.1Z","SI03":"M337.5 412.3L338.3 414.1L336.4 414.0L330.9 418.0L332.0 421.4L331.5 423.7L327.3 425.9L328.5 429.8L327.0 430.9L324.0 429.7L322.4 430.5L319.0 427.3L317.0 430.4L313.9 430.9L312.8 426.2L313.7 424.4L317.8 424.2L321.2 425.7L323.1 421.9L321.0 420.5L322.4 418.2L318.3 415.8L321.9 411.5L328.7 410.6L330.4 409.3L334.6 409.5L334.2 406.8L337.8 406.2L341.6 412.2L338.9 411.4Z","ITH1":"M294.0 411.7L292.4 412.7L289.4 412.2L288.5 413.9L284.9 415.0L283.5 417.2L279.8 419.3L278.9 418.6L278.9 415.0L272.6 416.0L270.7 414.7L270.0 412.2L270.8 409.2L276.9 410.6L278.8 407.3L285.7 406.9L289.8 405.1L291.1 405.3L290.2 407.9Z","AT21":"M303.7 404.3L307.3 405.1L308.8 406.7L310.6 406.6L313.1 404.5L315.9 405.4L320.8 404.2L322.7 406.0L323.7 410.6L318.3 415.7L316.7 414.6L296.4 412.0L299.2 409.5L295.8 404.6L300.7 405.6Z","AT33":"M294.0 411.7L290.0 406.5L293.6 403.8L295.8 404.6L299.2 409.5L296.4 412.0ZM294.6 395.8L295.7 398.3L293.3 400.8L289.3 402.0L289.8 405.1L285.7 406.9L278.8 407.3L276.9 410.6L270.8 409.2L269.9 407.1L267.1 409.3L267.5 402.3L270.3 400.2L270.6 397.5L275.5 397.8L277.0 400.1L281.5 399.3L283.9 396.7L290.0 396.1L290.3 394.7Z","AT22":"M331.6 394.7L335.4 396.9L334.0 398.0L335.3 404.0L334.2 406.8L334.6 409.5L323.7 410.6L322.7 406.0L320.8 404.2L315.9 405.4L313.1 404.5L310.6 406.6L308.8 406.7L310.1 403.1L309.4 401.5L306.5 401.1L306.1 397.9L307.8 397.5L307.4 394.6L308.6 393.6L314.1 395.2L318.4 392.5L322.8 392.5L325.9 391.1Z","AT32":"M302.5 389.2L302.5 391.8L305.2 393.9L306.5 401.1L309.4 401.5L310.1 403.1L308.8 406.7L307.3 405.1L303.7 404.3L300.7 405.6L293.6 403.8L289.8 405.1L289.3 402.0L293.3 400.8L295.7 398.3L294.8 395.2L295.9 394.9L298.6 397.8L299.9 397.4L300.2 395.0L298.5 393.9L299.0 391.7L297.6 389.5Z","AT11":"M337.9 392.6L340.7 393.4L340.7 396.0L338.5 397.8L339.0 403.4L334.2 406.8L335.3 404.0L334.0 398.0L336.6 396.2L337.2 389.0L339.4 388.3L342.1 385.7L343.7 385.7L344.5 384.3L345.7 386.1L344.7 391.1L339.8 391.1Z","HU11":"M369.1 394.6L367.2 394.2L366.3 392.0L368.1 390.2L371.1 392.4Z","HU12":"M373.1 387.6L378.6 393.6L380.6 398.8L377.2 400.2L374.2 397.9L372.0 399.6L370.7 398.3L367.7 400.2L363.5 391.4L365.6 388.1L363.9 384.9L365.3 383.1L367.0 385.9ZM369.1 394.6L371.1 392.4L368.1 390.2L366.3 392.0L367.2 394.2Z","HU32":"M398.2 396.0L396.7 397.4L394.3 397.0L393.7 394.7L390.2 393.7L387.5 399.2L385.1 400.1L384.7 401.7L380.7 402.2L381.2 400.1L380.0 395.8L374.5 389.8L377.7 388.2L383.2 391.0L389.3 384.7L389.8 380.2L392.7 379.6L393.5 377.2L397.9 375.2L400.1 372.2L406.0 376.3L408.4 376.0L409.5 378.3L407.5 381.3L405.2 381.8L402.0 385.6Z","AT13":"M338.2 382.6L339.0 384.5L334.6 384.3L337.0 381.9Z","SK01":"M344.5 384.3L341.6 379.3L342.5 377.5L346.8 375.6L346.8 377.9L349.2 382.1L346.7 385.9L345.7 386.1Z","HU31":"M399.8 372.7L397.9 375.2L393.5 377.2L392.7 379.6L389.8 380.2L389.3 384.7L383.2 391.0L377.7 388.2L374.5 389.8L373.1 387.6L366.0 385.1L365.3 383.1L371.0 381.7L372.6 379.2L376.1 380.2L377.5 379.7L380.0 377.3L382.1 372.8L384.6 371.8L388.6 372.4L391.7 370.7L395.8 373.8Z","SK02":"M359.4 375.5L360.9 378.5L362.9 377.8L364.1 381.1L366.3 381.1L366.2 382.7L363.9 384.9L364.9 387.2L354.4 389.7L352.2 389.6L346.7 385.9L349.2 382.1L346.8 377.9L346.8 375.6L342.5 377.5L342.3 376.2L344.5 372.0L349.7 371.5L353.9 367.7L354.7 364.0L356.2 363.0L359.1 365.7L359.1 368.6L360.8 368.7L362.8 371.9Z","SK03":"M373.4 362.7L375.1 364.4L375.2 367.5L378.3 367.6L378.2 370.2L380.1 373.8L381.4 374.1L377.5 379.7L376.1 380.2L372.6 379.2L371.0 381.7L366.2 382.7L366.3 381.1L364.1 381.1L362.9 377.8L360.9 378.5L359.4 375.5L362.8 371.9L360.8 368.7L359.1 368.6L359.1 365.7L356.2 363.0L358.6 359.6L361.6 359.0L363.4 360.5L365.1 360.2L368.0 356.5L370.5 359.6L371.9 359.8L372.3 362.6Z","SK04":"M402.7 360.2L399.9 369.5L400.1 372.2L395.8 373.8L391.7 370.7L388.6 372.4L384.6 371.8L381.4 374.1L380.1 373.8L378.2 370.2L378.3 367.6L375.2 367.5L375.1 364.4L373.4 362.7L375.5 362.5L376.2 360.3L378.7 358.6L380.8 358.1L384.6 359.3L386.3 357.2L389.2 356.5L394.5 356.6L397.0 358.9Z","AT31":"M317.4 378.7L319.4 379.8L320.9 384.1L318.7 385.4L315.9 384.6L315.6 386.8L316.3 388.7L318.8 390.3L318.9 392.6L314.1 395.2L308.6 393.6L307.4 394.6L307.8 397.5L306.1 397.9L305.2 393.9L302.5 391.8L302.5 389.2L297.6 389.5L296.2 387.6L303.2 383.0L304.4 379.3L306.8 380.5L307.8 376.1L311.0 378.9Z","DE21":"M284.5 376.8L284.4 379.6L286.6 380.1L287.9 382.6L290.6 384.3L293.1 382.5L298.3 386.0L296.2 387.6L299.0 391.7L298.5 393.9L300.2 395.0L299.9 397.4L298.6 397.8L295.9 394.9L293.7 395.8L290.3 394.7L290.0 396.1L283.9 396.7L281.5 399.3L276.7 400.1L275.5 397.8L276.2 396.4L274.3 395.7L274.4 388.3L275.5 386.1L277.0 386.8L280.0 382.4L276.8 379.7L275.8 375.6L278.6 372.5L280.1 373.1L280.7 371.9L284.3 374.6Z","AT12":"M342.3 376.2L341.6 379.3L344.5 384.3L343.7 385.7L342.1 385.7L339.4 388.3L337.2 389.0L337.4 393.0L336.6 396.2L335.4 396.9L325.9 391.1L319.4 392.9L318.8 390.3L316.3 388.7L315.9 384.6L318.7 385.4L320.9 384.1L319.4 379.8L317.4 378.7L320.0 375.1L320.7 371.5L335.0 374.9L337.8 373.4L341.5 374.7ZM339.0 384.5L337.0 381.9L334.6 384.3Z","DE22":"M306.8 380.5L304.4 379.3L303.2 383.0L298.3 386.0L293.1 382.5L290.6 384.3L287.9 382.6L286.6 380.1L284.4 379.6L284.3 374.6L283.0 374.0L283.7 372.9L287.9 374.0L289.1 377.0L292.0 375.0L292.7 372.4L300.2 369.8L307.8 376.1Z","DE25":"M279.4 363.2L280.3 362.1L281.9 362.4L282.4 361.3L282.4 366.2L279.1 367.8L280.7 371.9L280.1 373.1L278.6 372.5L275.8 375.6L273.3 374.7L272.5 373.1L269.9 373.8L268.3 372.4L266.9 369.6L266.6 363.0L269.3 362.7L270.1 361.1L275.5 360.5L277.3 363.2Z","CZ03":"M306.4 363.8L316.0 363.0L317.2 361.3L319.1 362.4L319.4 366.3L326.2 369.4L326.9 372.0L326.5 372.7L320.7 371.5L320.0 375.1L317.4 378.7L311.0 378.9L304.5 373.0L303.0 372.9L298.1 367.3L295.9 366.8L291.5 360.3L293.0 357.8L297.0 357.2L302.1 354.3L306.5 357.0Z","CZ06":"M339.3 360.0L340.1 363.0L340.9 361.8L343.7 365.0L344.1 367.9L349.7 371.5L344.5 372.0L342.3 376.2L341.5 374.7L337.8 373.4L335.0 374.9L326.5 372.7L326.2 369.4L318.9 365.3L319.1 362.4L322.0 361.2L322.1 359.0L324.8 356.8L334.9 360.7Z","DE23":"M295.8 370.9L292.7 372.4L292.0 375.0L289.1 377.0L287.9 374.0L283.7 372.9L283.0 374.0L280.7 371.9L279.1 367.8L282.4 366.2L282.4 361.3L285.5 359.0L286.0 356.8L289.8 355.3L293.0 357.8L291.5 360.3L294.1 364.9L300.2 369.8Z","DE24":"M286.0 349.3L287.9 351.0L289.8 355.3L286.0 356.8L285.5 359.0L281.9 362.4L277.3 363.2L275.5 360.5L272.5 361.3L270.3 359.6L272.3 358.7L274.7 355.1L273.3 352.8L274.3 352.3L273.4 350.6L275.5 350.1L278.2 352.0L278.9 348.6L280.1 348.0L282.6 349.8Z","CZ02":"M323.9 352.7L324.8 356.8L322.1 359.0L322.0 361.2L319.1 362.4L317.2 361.3L316.0 363.0L306.4 363.8L306.5 357.0L302.1 354.3L304.7 351.9L312.2 348.6L313.3 346.8L315.0 347.0L318.3 344.8L320.3 346.0L320.5 349.0L323.0 350.0ZM314.1 352.2L311.3 353.7L312.4 356.0L315.4 355.2L315.9 353.7Z","RO22":"M473.9 396.1L475.9 404.5L480.4 408.3L484.5 408.3L491.5 403.4L493.9 404.1L495.2 406.1L495.9 412.1L491.2 414.7L489.5 416.8L487.0 423.9L488.5 433.4L481.4 433.4L479.8 431.2L473.5 432.2L471.7 430.8L478.8 426.8L479.6 425.3L480.0 423.2L476.4 418.7L461.3 420.7L458.4 415.9L456.0 415.5L453.0 411.4L455.1 409.0L455.3 401.8L460.7 399.9L464.2 397.1L466.7 397.0L468.1 399.1L468.3 397.0Z","RO12":"M447.7 392.2L449.3 396.4L452.1 397.6L455.3 401.8L455.1 409.0L453.0 411.4L444.7 415.3L441.6 412.7L436.7 413.2L424.6 417.7L422.3 415.9L416.4 407.0L411.4 404.3L411.2 402.5L412.5 401.3L415.6 402.2L419.1 400.8L422.1 401.9L426.2 401.1L427.3 394.6L429.8 394.8L434.0 388.4L436.1 387.1L438.3 387.3L439.7 385.7L442.9 386.4L446.0 392.2Z","RO11":"M432.8 377.6L435.0 380.9L436.1 387.1L434.0 388.4L429.8 394.8L427.3 394.6L426.2 401.1L422.1 401.9L419.1 400.8L415.6 402.2L412.5 401.3L411.2 402.5L411.4 404.3L408.6 404.8L403.7 401.6L396.7 402.5L402.0 385.6L405.2 381.8L407.5 381.3L412.4 375.1L416.1 376.8L416.8 376.0L424.2 376.4L427.9 374.7Z","RO21":"M471.1 384.2L474.1 390.6L473.9 396.1L468.3 397.0L468.1 399.1L466.7 397.0L464.2 397.1L460.7 399.9L455.3 401.8L452.1 397.6L449.3 396.4L447.7 392.2L446.0 392.2L442.9 386.4L439.7 385.7L438.3 387.3L436.1 387.1L435.0 380.9L432.8 377.6L434.3 377.0L436.0 373.9L444.6 370.8L446.6 366.8L451.4 364.7L454.1 366.2L459.2 373.3L470.1 382.1Z","LT01":"M410.0 272.4L410.2 267.7L406.0 268.3L404.7 266.9L404.9 264.0L406.9 260.4L404.8 259.1L401.9 252.7L403.6 250.2L411.6 256.6L415.1 255.6L414.8 252.2L424.0 250.2L423.6 251.9L420.4 253.1L419.7 255.6L417.3 257.3L416.4 259.7L417.1 263.3L416.4 267.4L418.9 270.0L417.0 270.7L415.8 268.6L412.4 271.9Z","CZ07":"M356.2 363.0L354.7 364.0L353.9 367.7L349.7 371.5L344.1 367.9L343.7 365.0L340.9 361.8L340.1 363.0L338.4 356.2L339.0 349.9L340.3 348.6L339.1 345.7L345.0 348.4L343.3 350.5L342.9 355.2L346.0 355.3L351.4 359.8L355.4 360.1L356.9 361.5Z","CZ08":"M357.9 352.8L358.6 355.4L360.8 356.7L361.6 359.0L358.6 359.6L356.9 361.5L355.4 360.1L351.4 359.8L346.0 355.3L342.9 355.2L343.3 350.5L345.0 348.4L348.1 347.5L347.5 350.0L349.8 352.4L351.8 350.8L355.1 352.8Z","PL21":"M379.7 344.9L384.9 341.6L385.4 347.9L387.4 350.4L386.7 351.1L389.2 356.5L386.3 357.2L384.6 359.3L380.8 358.1L378.7 358.6L376.2 360.3L375.5 362.5L372.3 362.6L371.9 359.8L370.5 359.6L367.1 353.9L363.3 351.3L366.8 343.6L371.2 341.0L374.7 341.2L376.9 345.5Z","PL22":"M362.6 333.2L365.5 335.1L368.3 335.3L368.2 337.7L371.2 341.0L366.8 343.6L363.3 351.3L367.1 353.9L368.0 356.5L365.1 360.2L363.4 360.5L360.8 356.7L358.6 355.4L357.9 352.8L355.1 352.8L351.8 350.8L351.8 349.0L355.6 347.3L354.8 343.8L356.9 342.1L355.5 339.9L356.6 333.6Z","PL82":"M407.3 337.1L409.8 339.1L402.7 351.9L405.7 360.0L397.0 358.9L394.5 356.6L389.2 356.5L386.7 351.1L387.4 350.4L385.4 347.9L384.9 341.6L390.2 335.4L390.6 333.1L393.3 332.6L394.9 335.2L398.0 335.5L398.1 338.7L400.1 339.9L404.0 339.4Z","PL52":"M351.1 332.3L356.6 333.6L355.5 339.9L356.9 342.1L354.8 343.8L355.6 347.3L351.8 349.0L351.8 350.8L349.8 352.4L347.5 350.0L348.1 347.5L345.0 348.4L339.1 345.7L342.2 342.3L345.2 333.0L347.2 332.4L348.8 333.6Z","PL72":"M387.4 329.2L389.2 328.7L390.6 333.1L390.2 335.4L384.9 341.6L379.7 344.9L376.9 345.5L374.7 341.2L371.2 341.0L368.2 337.7L369.3 332.5L371.1 332.8L370.6 329.9L374.3 326.5L378.3 328.9L380.2 328.3L385.6 330.1Z","PL81":"M406.7 318.2L408.3 321.8L413.6 328.0L412.6 329.1L414.3 331.5L414.4 334.6L411.3 336.6L409.8 339.1L407.3 337.1L404.0 339.4L400.1 339.9L398.1 338.7L398.0 335.5L394.9 335.2L393.3 332.6L390.6 333.1L388.6 321.7L385.8 320.0L388.3 318.2L388.2 313.3L395.0 311.6L395.4 310.3L397.8 309.7L399.3 306.3L405.4 309.2L405.3 314.8Z","PL71":"M367.0 311.3L370.3 313.9L371.4 316.4L374.6 317.8L375.3 320.0L373.1 321.5L374.6 324.0L374.3 326.5L370.6 329.9L371.1 332.8L369.3 332.5L368.3 335.3L365.5 335.1L363.7 333.3L356.6 333.6L351.1 332.3L350.1 329.5L352.6 327.3L353.0 320.6L355.3 320.5L355.3 317.0L358.3 313.6L357.9 311.9L360.2 310.6L364.2 312.3Z","PL41":"M341.0 307.0L348.8 310.2L350.7 309.3L354.9 312.0L357.9 311.9L358.3 313.6L355.3 317.0L355.3 320.5L353.0 320.6L352.6 327.3L350.1 329.5L351.1 332.3L348.8 333.6L346.0 329.4L344.1 328.4L343.8 326.1L340.8 325.4L339.7 326.6L336.5 327.0L334.0 324.2L329.2 322.3L325.8 319.0L324.3 309.8L325.7 308.1L325.5 303.3L328.1 303.2L331.0 300.2L332.1 298.4L330.1 296.0L333.8 292.2L335.0 294.2L339.1 294.5L338.2 296.5L339.9 298.2L339.3 302.8L341.3 304.4Z","CZ01":"M314.1 352.2L315.9 353.7L315.4 355.2L312.4 356.0L311.3 353.7Z","CZ05":"M324.1 341.4L329.7 343.5L333.4 343.6L332.2 346.2L336.1 351.1L337.6 351.4L339.0 349.9L338.2 353.9L339.3 360.0L334.9 360.7L324.8 356.8L323.0 350.0L320.5 349.0L320.3 346.0L318.3 344.8L315.0 347.0L313.3 346.8L312.0 345.0L311.9 343.6L314.3 340.8L315.9 341.3L318.1 340.2L318.8 337.9L320.8 338.2L322.4 341.2Z","CZ04":"M302.1 354.3L297.0 357.2L293.0 357.8L289.8 355.3L287.9 351.0L290.4 352.8L293.1 349.4L295.5 348.6L296.9 349.3L304.2 343.5L311.6 340.2L310.9 337.7L312.8 337.8L314.3 340.8L311.9 343.6L313.3 346.8L312.2 348.6L304.7 351.9Z","DED4":"M296.9 349.3L295.5 348.6L293.1 349.4L290.4 352.8L286.0 349.3L285.6 347.3L290.1 345.0L289.3 342.6L293.5 340.7L293.1 339.8L296.1 335.7L299.0 335.3L304.2 343.5Z","DEG0":"M280.0 333.8L281.1 338.0L288.9 340.5L289.5 338.0L291.1 338.2L293.5 340.7L289.3 342.6L290.1 345.0L288.1 346.6L286.1 346.5L286.0 349.3L282.6 349.8L280.1 348.0L278.9 348.6L278.2 352.0L275.5 350.1L273.4 350.6L274.3 352.3L272.0 352.8L271.8 351.3L267.8 347.8L265.9 348.0L266.3 346.0L264.4 345.7L265.7 340.1L267.2 339.8L267.6 337.6L264.7 333.7L272.7 329.2L275.0 329.6L275.7 332.7Z","PL51":"M340.8 325.4L343.8 326.1L344.1 328.4L346.0 329.4L347.2 332.4L345.2 333.0L342.2 342.3L339.1 345.7L340.3 348.6L337.6 351.4L336.1 351.1L332.2 346.2L333.4 343.6L322.4 341.2L320.8 338.2L318.8 337.9L318.1 340.2L316.4 340.4L318.0 335.8L317.5 332.1L319.4 330.5L321.0 330.8L321.9 329.1L324.0 329.7L325.0 329.0L327.8 324.5L330.6 325.7L331.9 323.9L334.0 324.2L336.5 327.0L339.7 326.6Z","DED2":"M316.4 340.4L315.9 341.3L314.3 340.8L313.8 338.7L310.9 337.7L311.6 340.2L304.2 343.5L301.5 338.5L300.2 338.3L299.0 332.4L300.9 331.7L305.6 332.6L308.8 329.7L314.7 328.6L316.9 330.4L318.1 333.5Z","DED5":"M289.5 338.0L288.2 335.0L288.4 330.7L297.2 328.4L298.6 329.8L299.0 335.3L296.1 335.7L293.1 339.8Z","DEE0":"M288.3 340.3L281.1 338.0L280.0 333.8L275.7 332.7L275.0 329.6L272.7 329.2L271.2 323.1L275.4 322.2L276.1 320.4L276.2 316.9L275.0 315.3L275.7 314.8L273.1 309.8L280.6 307.3L281.5 305.7L284.8 308.0L287.0 308.0L288.2 309.6L287.6 314.4L289.1 315.2L288.9 321.1L298.1 324.9L297.2 328.4L288.4 330.7L288.2 335.0L289.5 338.0Z","PL43":"M325.7 315.9L325.8 319.0L331.9 323.9L330.6 325.7L327.8 324.5L325.0 329.0L324.0 329.7L321.9 329.1L321.0 330.8L319.4 330.5L317.5 332.1L316.9 330.4L315.2 329.7L313.2 324.6L314.4 320.4L311.8 315.2L312.7 313.0L311.9 311.3L313.9 310.3L315.1 307.0L317.5 307.2L325.4 302.4L325.7 308.1L324.3 309.8Z","PL91":"M383.2 304.5L387.3 309.6L387.2 313.5L384.2 313.3L381.7 316.3L374.8 315.8L371.5 311.4L371.7 309.1L374.6 304.5L381.7 306.1Z","PL92":"M389.0 298.3L389.6 299.6L390.9 299.4L391.1 302.3L393.7 305.4L399.3 306.3L397.8 309.7L395.4 310.3L395.0 311.6L388.2 313.3L388.3 318.2L385.8 320.0L388.6 321.7L389.2 328.7L385.6 330.1L380.2 328.3L378.3 328.9L374.3 326.5L374.6 324.0L373.1 321.5L375.3 320.0L374.6 317.8L371.4 316.4L370.3 313.9L367.0 311.3L364.2 312.3L360.2 310.6L361.5 304.3L360.6 301.3L363.0 300.6L362.5 298.5L364.4 296.4L368.1 296.8L380.8 289.2L382.2 293.7L386.8 298.7ZM381.2 315.9L384.2 313.3L387.2 313.5L387.3 309.6L383.2 304.5L381.7 306.1L374.6 304.5L371.7 309.1L371.5 311.4L374.8 315.8Z","PL61":"M363.3 297.4L363.0 300.6L360.6 301.3L361.5 304.3L360.2 310.6L354.9 312.0L350.7 309.3L348.8 310.2L341.0 307.0L341.3 304.4L339.3 302.8L339.9 298.2L338.2 296.5L339.5 292.7L341.6 292.7L345.3 288.9L347.9 290.1L351.7 289.8L352.4 291.1L356.1 290.9L358.2 293.7L362.0 294.8Z","PL84":"M405.3 294.6L405.8 298.1L401.9 301.5L399.3 306.3L393.7 305.4L391.1 302.3L390.9 299.4L389.6 299.6L389.0 298.3L386.8 298.7L382.2 293.7L380.8 289.2L385.8 287.3L390.7 282.2L390.8 280.0L387.6 275.8L389.8 272.6L391.3 271.9L397.3 275.3Z","PL62":"M389.8 272.6L387.6 275.8L390.8 280.0L390.7 282.2L383.2 289.0L380.2 289.3L368.1 296.8L364.4 296.4L363.3 297.4L362.0 294.8L358.2 293.7L356.1 290.9L359.4 285.0L355.8 282.0L355.9 279.3L357.4 279.1L360.8 275.8L378.0 275.3Z","PL63":"M359.1 275.8L355.8 278.3L355.8 282.0L359.4 285.0L356.1 290.9L352.4 291.1L351.7 289.8L347.9 290.1L345.3 288.9L341.6 292.7L339.5 292.7L339.1 294.5L335.0 294.2L333.8 292.2L333.5 289.0L334.3 288.0L332.3 286.9L331.5 283.3L332.1 279.8L330.5 277.2L335.6 274.0L345.8 271.3L349.3 277.7L356.5 277.7Z","LT02":"M402.5 234.9L405.4 238.3L410.5 238.3L418.7 243.5L421.2 243.5L421.5 248.7L424.0 250.2L414.8 252.2L415.1 255.6L411.6 256.6L403.6 250.2L401.9 252.7L402.1 254.7L404.9 257.8L404.8 259.1L406.9 260.4L404.9 264.0L404.7 266.9L406.0 268.3L410.2 267.7L410.1 275.0L406.8 277.2L404.5 276.7L398.0 278.0L397.3 275.3L395.2 273.5L391.3 271.9L389.8 272.6L388.2 269.4L389.1 265.0L385.7 261.3L381.0 262.6L373.7 259.8L372.8 260.5L368.6 247.2L372.3 242.6L377.3 239.6L382.2 239.8L384.7 238.8L386.3 239.9L392.4 238.0L396.4 239.1L399.8 237.9Z","LV00":"M420.2 211.9L421.7 211.5L422.3 213.0L425.7 214.9L425.8 222.0L427.6 221.6L433.2 230.1L429.5 239.5L424.9 239.8L422.9 242.9L418.7 243.5L410.5 238.3L405.4 238.3L402.5 234.9L399.8 237.9L396.4 239.1L392.4 238.0L386.3 239.9L384.7 238.8L382.2 239.8L377.3 239.6L372.3 242.6L368.6 247.2L367.1 242.8L366.7 234.9L369.0 231.1L368.8 226.1L370.6 221.4L377.6 217.4L378.7 219.8L383.9 223.3L385.9 227.0L389.0 228.2L392.0 227.1L394.9 223.2L392.7 212.0L398.1 208.1L400.8 207.4L407.4 209.4L410.6 212.8L413.0 213.6L416.0 211.2Z","EE00":"M408.9 181.5L416.2 180.4L417.6 178.7L419.2 179.6L417.1 187.7L414.9 191.3L418.9 200.7L422.0 205.2L420.7 206.9L420.2 211.9L416.0 211.2L413.0 213.6L410.6 212.8L407.4 209.4L400.8 207.4L398.1 208.1L392.7 212.0L392.4 204.3L391.0 204.2L388.6 206.0L386.3 205.2L383.2 201.4L383.2 198.7L381.7 199.3L381.1 192.1L385.4 189.2L385.0 187.9L386.4 188.0L387.7 185.7L390.7 185.4L390.8 183.6L393.4 184.3L395.9 183.4L397.9 180.6L399.0 181.7L399.4 180.7ZM381.6 201.5L382.1 203.1L380.1 203.5L381.2 204.7L377.1 209.1L373.8 210.2L373.3 213.9L372.2 215.0L372.9 211.4L369.9 209.5L369.6 205.9L371.1 206.4L374.6 202.8L378.3 202.4L380.5 200.9ZM378.4 194.7L380.4 195.5L378.8 196.1ZM373.8 195.0L378.3 198.3L374.5 201.6L371.9 198.3Z","SE11":"M339.0 201.0L336.7 200.8L333.7 205.0L328.9 202.4L327.9 199.4L329.9 191.4L333.6 189.8L335.9 187.3L336.6 182.6L338.5 181.4L342.5 188.8L340.2 190.4L340.5 195.6L341.5 193.8L341.9 195.2ZM337.6 203.4L336.3 203.1L337.2 202.0Z","DE40":"M309.6 299.6L309.2 304.1L307.3 305.9L307.5 308.0L312.7 313.0L311.8 315.2L314.4 320.4L313.2 324.6L314.7 328.6L308.8 329.7L305.6 332.6L300.9 331.7L299.0 332.4L297.2 328.4L298.1 324.9L288.9 321.1L289.1 315.2L287.6 314.4L288.2 309.6L287.0 308.0L284.8 308.0L278.2 304.3L280.6 304.0L282.0 302.3L286.2 300.5L295.4 303.1L299.9 301.2L303.7 297.0L305.1 298.3L307.4 298.2L307.3 300.8ZM299.3 315.8L303.3 315.9L303.5 314.9L300.0 311.6L297.7 312.5L297.2 315.4Z","DE30":"M303.3 315.9L297.8 315.9L297.7 312.5L300.0 311.6L302.2 313.2Z","PL42":"M333.8 292.2L330.1 296.0L332.1 298.4L328.1 303.2L325.5 303.3L324.6 302.2L323.4 304.2L320.9 304.5L317.5 307.2L315.1 307.0L313.9 310.3L311.9 311.3L307.5 308.0L307.3 305.9L309.2 304.1L309.9 300.8L307.8 293.5L310.2 293.5L310.8 291.3L307.1 291.2L307.2 289.7L311.2 288.3L312.2 289.2L313.2 287.4L325.2 282.5L330.5 277.2L332.1 279.8L331.5 283.3L332.3 286.9L334.3 288.0L333.5 289.0Z","DE80":"M301.2 282.9L298.6 284.2L298.0 285.8L299.6 287.0L302.9 286.1L304.5 288.8L307.2 289.7L307.1 290.8L304.1 291.3L307.8 293.5L309.6 299.6L307.3 300.8L307.4 298.2L305.1 298.3L303.7 297.0L299.9 301.2L295.4 303.1L286.2 300.5L282.0 302.3L280.6 304.0L278.2 304.3L275.1 300.8L271.4 300.4L274.9 295.6L273.0 292.9L274.4 290.4L276.8 289.5L278.5 290.5L281.7 287.4L289.5 284.0L290.2 281.9L292.5 283.1L294.4 282.0L296.5 282.6L297.7 278.1L299.1 280.7L300.8 279.5L300.2 281.2Z","DK02":"M283.1 260.4L285.1 261.1L285.1 259.7L286.7 260.8L286.0 262.1L287.9 262.7L286.5 265.6L288.6 267.3L286.1 269.5L286.1 271.1L287.2 272.7L289.1 273.2L287.0 274.6L284.4 279.4L279.7 279.3L275.3 276.6L275.4 274.9L277.7 273.9L280.3 275.5L284.1 273.4L281.5 270.0L277.6 269.1L275.5 261.0L280.9 257.0L282.4 261.7Z","DK01":"M314.9 269.9L314.3 271.5L310.4 269.9L311.0 266.5ZM291.9 261.3L291.9 263.1L291.0 262.5L291.3 260.9ZM290.6 262.7L286.0 262.1L286.7 260.8L285.1 259.7L283.1 260.4L283.3 256.4L286.8 254.0L289.5 255.1ZM282.0 252.1L282.1 253.6L281.1 253.5Z","SE22":"M315.1 246.4L317.0 246.1L320.1 248.7L321.8 248.4L319.6 253.0L317.8 251.1L315.4 252.3L309.9 252.5L309.3 254.7L308.0 253.9L305.3 257.9L306.4 262.5L305.4 264.9L297.3 266.4L294.2 265.6L293.2 263.4L293.9 260.6L289.2 252.1L291.3 251.7L290.6 248.8L292.3 248.2L295.1 250.0L303.3 246.5L310.8 248.4ZM293.1 266.2L292.0 265.6L292.9 264.5Z","SE21":"M347.1 218.5L344.2 223.8L344.4 226.4L345.7 227.5L340.6 236.6L338.5 226.6L342.9 219.6ZM326.0 249.0L325.3 250.0L324.5 245.0L329.4 230.6ZM314.0 225.9L315.7 223.4L319.2 223.3L319.4 219.1L322.1 218.2L326.0 221.0L326.1 227.9L324.4 233.7L325.1 235.0L321.8 248.4L320.1 248.7L317.0 246.1L310.8 248.4L303.3 246.5L297.6 248.3L295.9 242.0L299.1 239.1L296.8 237.0L294.0 238.1L293.7 236.5L298.3 229.5L299.0 221.7L301.1 221.4L304.5 218.5L306.6 219.8L309.6 219.1L311.6 225.8Z","SE23":"M302.6 204.8L304.7 209.6L305.9 209.2L307.2 210.6L304.5 218.5L301.1 221.4L299.0 221.7L298.3 229.5L293.7 236.5L294.0 238.1L296.8 237.0L299.1 239.1L295.9 242.0L297.6 248.3L295.1 250.0L293.1 249.5L292.2 245.4L287.2 240.4L284.4 232.4L282.9 233.0L282.8 229.9L282.1 229.0L281.3 229.9L281.0 227.2L279.6 227.2L280.2 225.0L276.3 216.1L275.2 206.5L276.5 204.7L278.3 207.8L279.6 207.4L281.1 201.9L283.2 202.5L284.3 201.5L287.3 203.7L288.6 202.9L290.7 208.5L293.7 209.9L294.7 209.6L295.1 206.4L296.5 204.5Z","SE12":"M336.6 182.6L335.9 187.3L329.4 192.3L327.9 199.4L328.9 202.4L331.0 203.4L330.7 206.6L328.3 207.6L328.5 209.1L324.4 209.5L326.0 211.1L327.3 215.8L324.7 220.1L322.1 218.2L319.4 219.1L319.2 223.3L315.7 223.4L314.0 225.9L311.6 225.8L309.6 219.1L306.6 219.8L304.5 218.5L307.2 210.6L305.9 209.2L304.7 209.6L302.6 204.8L303.4 197.6L302.7 187.8L304.9 187.8L306.2 186.6L311.2 190.0L313.3 187.9L314.1 184.6L318.1 185.6L325.0 181.4L326.1 175.3L328.8 176.8L331.1 175.4L334.5 179.3L335.3 177.3L337.0 179.8Z","SE31":"M326.1 175.3L325.0 181.4L318.1 185.6L314.1 184.6L313.3 187.9L311.2 190.0L306.2 186.6L304.9 187.8L302.7 187.8L303.4 197.6L302.6 204.8L296.5 204.5L295.1 206.4L294.7 209.6L290.7 208.5L288.6 202.9L287.3 203.7L284.3 201.5L283.2 202.5L281.1 201.9L280.1 196.3L281.6 194.3L281.0 191.8L284.0 190.5L286.2 187.3L286.9 180.7L284.0 172.5L287.2 171.3L288.4 167.5L286.4 163.3L282.6 160.3L283.5 151.2L287.4 152.0L289.5 154.5L291.3 154.7L291.4 156.9L293.8 161.0L301.1 161.6L302.2 156.9L305.8 157.1L305.8 154.6L308.0 152.3L307.2 149.9L309.3 148.5L324.3 150.5L323.8 155.3L325.1 158.3L323.3 158.2L322.4 160.7Z","SE32":"M315.0 119.8L317.0 121.0L322.3 121.3L327.4 119.3L328.7 121.2L332.3 122.9L335.2 126.8L333.6 131.3L331.6 130.7L327.8 142.1L323.8 146.9L324.3 150.5L309.3 148.5L307.2 149.9L308.0 152.3L305.8 154.6L305.8 157.1L302.2 156.9L301.1 161.6L293.8 161.0L291.4 156.9L291.3 154.7L289.5 154.5L287.4 152.0L283.5 151.2L281.4 145.4L282.2 138.9L280.7 134.3L281.7 129.0L285.3 122.6L289.0 120.5L294.9 121.2L295.8 118.4L295.2 114.5L292.2 111.7L296.1 103.0L305.9 113.0L306.8 112.6Z","SE33":"M362.7 82.4L356.1 85.1L353.5 84.0L353.4 85.5L350.8 84.7L350.4 90.6L349.0 90.8L348.9 94.3L347.4 93.7L345.2 102.8L348.6 109.1L343.9 120.9L340.2 123.1L338.3 126.5L336.8 125.7L336.6 127.1L327.4 119.3L322.3 121.3L317.0 121.0L309.9 116.2L306.8 112.6L305.9 113.0L296.1 103.0L297.4 91.3L296.3 86.1L299.8 85.5L302.7 83.1L301.9 79.8L307.4 69.9L305.1 63.3L307.1 61.2L308.3 55.7L311.4 51.8L315.5 53.4L316.5 50.3L315.8 44.2L317.6 43.4L327.4 45.3L328.4 38.0L327.2 34.5L329.1 33.5L340.1 41.4L346.7 43.3L347.9 45.6L351.3 48.0L351.9 56.2L354.1 56.8L353.9 60.8L357.7 66.0L357.7 75.4ZM354.4 89.8L352.7 89.4L352.9 87.8Z","FI20":"M354.2 182.0L353.6 183.3L352.3 182.7L352.8 180.7ZM350.5 178.5L350.2 180.3L349.1 180.1L350.4 181.8L351.0 180.4L350.6 183.0L345.0 180.5L345.8 177.7L347.2 179.5L347.1 176.8Z","FI1B":"M400.4 165.5L400.4 167.5L397.9 167.6L398.3 169.2L397.3 170.5L391.5 171.7L386.2 177.0L382.9 177.5L381.5 179.4L377.3 180.4L376.0 181.8L373.3 180.6L374.0 177.7L378.5 174.9L379.3 167.3L384.4 167.8L385.2 166.0L388.0 164.7L388.4 162.5L391.3 162.6L392.8 163.9L394.9 162.5L397.0 162.6L397.4 161.5L400.8 164.0Z","FI1C":"M411.9 159.4L411.0 161.8L408.1 164.1L405.5 163.6L402.0 166.2L400.4 165.5L400.8 164.0L397.4 161.5L397.0 162.6L394.9 162.5L392.8 163.9L391.3 162.6L388.4 162.5L388.0 164.7L385.2 166.0L384.4 167.8L379.3 167.3L378.5 174.9L373.1 179.0L369.5 180.1L368.6 176.5L367.0 177.5L365.7 173.8L364.0 176.1L362.1 172.1L358.4 173.2L358.5 170.0L357.1 167.3L358.0 164.4L361.5 164.4L364.5 166.0L369.1 163.3L369.5 162.1L377.2 162.1L380.5 157.0L384.9 154.6L384.4 152.7L388.3 150.9L388.4 147.8L390.9 145.7L394.8 147.5L395.0 150.2L397.7 152.5L400.4 152.0L401.9 153.3L404.6 152.5L406.2 149.3L417.6 142.4L419.2 139.1L423.0 135.7L418.5 147.7ZM365.8 176.8L366.4 178.2L365.3 179.3L364.6 177.0ZM364.2 178.4L363.0 179.1L363.0 177.9L364.0 177.5ZM362.8 177.2L361.5 177.7L361.9 174.1ZM362.8 179.6L361.8 179.9L361.9 178.4ZM358.2 175.2L359.1 177.6L357.9 176.9Z","FI19":"M377.8 119.5L378.8 116.8L384.2 118.4L385.8 117.7L388.8 125.2L388.1 127.0L391.4 128.8L392.9 132.4L394.3 133.0L394.5 136.4L392.1 139.1L396.1 145.9L394.8 147.5L390.9 145.7L388.4 147.8L388.3 150.9L384.4 152.7L384.9 154.6L380.5 157.0L377.2 162.1L369.5 162.1L369.1 163.3L364.5 166.0L361.5 164.4L358.0 164.4L357.4 154.3L354.8 149.5L353.9 143.6L350.6 137.3L350.6 133.1L352.0 133.8L352.3 130.0L353.0 130.5L354.0 127.1L356.0 125.4L358.3 125.9L357.4 123.1L359.2 119.5L359.2 116.6L366.0 117.5L368.1 122.7L374.1 126.2L376.6 124.9L376.4 121.3ZM351.9 128.9L350.9 129.6L349.4 128.0L349.9 126.0L351.2 126.3Z","FI1D":"M378.7 22.9L377.5 25.3L378.6 26.7L378.6 31.9L380.5 35.6L385.9 38.0L391.9 43.4L390.1 56.2L399.7 67.9L403.1 73.9L401.0 75.8L402.0 77.0L402.3 81.9L403.9 83.3L404.2 87.9L407.5 89.9L409.5 94.5L413.7 97.9L413.9 102.8L412.1 105.5L417.0 108.8L423.5 111.3L427.8 115.6L427.5 123.4L423.0 135.7L419.2 139.1L417.6 142.4L406.2 149.3L403.6 153.0L401.9 153.3L400.4 152.0L397.7 152.5L395.0 150.2L394.8 147.5L396.1 145.9L392.1 139.1L394.5 136.4L394.3 133.0L392.9 132.4L391.4 128.8L388.1 127.0L388.8 125.2L385.8 117.7L384.2 118.4L378.8 116.8L376.4 121.3L376.6 124.9L374.1 126.2L368.1 122.7L366.0 117.5L360.5 116.5L363.8 114.4L363.8 112.1L365.3 112.0L369.5 98.1L373.7 95.8L371.7 86.6L369.9 84.7L363.0 83.1L357.7 75.4L357.7 66.0L353.9 60.8L354.1 56.8L351.9 56.2L351.3 48.0L347.9 45.6L346.7 43.3L340.1 41.4L329.1 33.5L330.1 32.6L332.0 33.1L331.6 30.2L332.8 28.8L334.8 28.9L341.3 37.1L346.4 37.6L348.9 36.0L350.1 33.7L356.7 36.5L357.9 35.2L357.9 31.9L360.1 29.9L358.6 17.0L360.5 12.4L363.9 11.9L368.0 8.0L371.6 11.3L376.5 12.4L378.7 15.3L377.4 19.8ZM370.7 94.9L370.3 95.7L368.5 94.3L370.2 93.2Z","DEA2":"M241.4 338.3L242.0 340.6L240.6 342.6L232.7 346.7L231.0 348.2L231.2 349.9L226.9 350.3L226.1 347.4L224.8 346.9L225.1 345.0L223.2 342.9L224.1 340.3L222.0 338.2L225.2 335.8L228.3 338.5L230.4 338.8L236.7 337.0L237.1 335.4Z","DE73":"M262.6 335.0L263.3 333.4L264.7 333.7L267.6 337.6L267.2 339.8L265.7 340.1L264.7 343.9L264.4 345.7L266.3 346.0L265.9 348.0L262.6 350.7L259.9 349.3L261.3 344.4L256.4 342.6L254.6 340.9L249.4 340.3L250.1 338.1L251.7 337.4L251.5 334.6L254.7 331.4L256.7 332.3L259.6 329.1L262.2 330.2L261.1 333.8Z","DEA5":"M248.0 327.6L250.5 329.0L250.2 332.0L254.7 331.4L251.5 334.6L251.7 337.4L250.1 338.1L248.0 342.1L246.1 342.8L245.5 345.0L241.4 338.3L235.7 334.1L235.2 331.3L235.7 330.1L237.4 330.7L239.2 327.5L247.0 328.5Z","DEA1":"M234.1 330.4L237.1 335.4L236.7 337.0L230.4 338.8L228.3 338.5L224.2 334.8L225.9 332.8L225.7 330.2L223.4 326.3L224.0 324.9L225.8 323.9L233.4 326.8L232.4 329.5L233.4 330.9Z","DEA4":"M256.5 316.3L255.0 319.9L259.5 326.2L259.6 329.1L256.7 332.3L254.0 331.0L252.6 332.1L250.2 332.0L250.5 329.0L248.0 327.6L245.8 322.0L249.1 321.1L249.7 318.6L248.0 315.4L252.2 314.7L252.5 316.4L255.9 315.0Z","DEA3":"M244.0 327.9L239.2 327.5L237.4 330.7L235.7 330.1L235.2 331.3L232.4 329.5L233.4 326.8L228.2 325.2L232.1 323.5L232.1 320.5L240.2 316.6L241.0 314.9L244.5 317.5L244.7 320.8L243.6 321.5L245.8 322.0L248.0 327.6L247.0 328.5Z","DE91":"M272.5 329.2L264.7 333.7L263.3 333.4L262.6 335.0L261.1 333.8L262.2 330.2L259.4 329.1L262.2 325.6L267.5 323.1L268.1 320.1L265.8 318.5L268.4 315.7L269.9 309.5L273.1 309.8L276.2 316.9L275.4 322.2L271.2 323.1Z","DE92":"M265.8 318.5L268.1 320.1L267.5 323.1L262.2 325.6L259.4 329.1L259.5 326.2L255.0 319.9L256.5 316.3L255.9 315.0L252.5 316.4L252.2 314.7L248.0 315.4L248.3 311.8L251.8 308.4L252.4 305.6L254.5 306.2L254.8 307.9L256.5 308.1L260.7 312.2L268.2 314.7L268.4 315.7Z","NL21":"M231.2 311.2L231.7 314.3L234.9 315.2L235.3 318.6L232.1 320.5L228.3 318.2L226.1 318.3L225.7 314.8L223.3 313.3L223.1 312.0L224.4 310.9L222.8 308.5L226.1 307.9L226.6 310.7L229.2 312.0Z","DE94":"M246.1 297.7L247.4 299.4L248.4 298.7L248.4 296.3L251.0 297.6L250.2 302.5L252.4 305.6L251.8 308.4L248.3 311.8L248.0 315.4L249.7 318.6L249.1 321.1L245.8 322.0L243.6 321.5L244.7 320.8L244.5 317.5L241.0 314.9L240.2 316.6L235.3 318.6L234.9 315.2L231.7 314.3L231.9 311.9L234.9 311.9L237.1 306.2L238.0 300.5L235.4 299.8L238.3 294.3L245.5 294.4L247.0 297.3ZM234.9 294.4L234.6 296.0L233.7 294.4ZM233.1 295.1L233.4 296.7L232.1 296.4Z","NL22":"M228.3 318.2L232.1 320.5L232.1 323.5L228.2 325.2L225.8 323.9L223.4 326.3L219.8 324.7L214.9 325.9L213.6 324.4L215.3 322.7L220.0 322.8L218.2 317.6L223.3 313.3L225.7 314.8L226.1 318.3Z","NL31":"M220.0 322.8L212.5 322.4L212.0 317.5L214.4 316.4L215.0 318.6L217.6 316.8Z","NL23":"M218.2 317.6L215.1 315.0L216.0 314.4L215.1 311.8L218.5 308.9L222.8 308.5L224.4 310.9L223.1 312.0L223.3 313.3Z","NL32":"M216.7 304.8L218.5 308.9L215.1 311.8L216.0 314.4L215.1 315.0L217.6 316.8L215.0 318.6L214.4 316.4L211.3 317.7L209.7 317.3L210.2 315.9L209.1 315.6L212.3 303.6L213.4 302.0L214.1 302.8L213.2 306.1Z","IE05":"M88.0 285.3L88.1 288.4L93.2 288.0L94.9 289.5L95.7 288.6L99.2 289.5L98.2 291.1L98.8 292.3L101.8 291.7L103.0 292.7L98.6 298.9L98.6 301.3L92.9 299.4L92.0 300.4L88.0 299.8L85.3 301.5L73.1 305.0L66.3 305.1L63.9 303.5L63.8 301.2L60.2 300.7L60.6 298.7L58.3 296.4L61.6 293.5L59.6 291.8L60.0 290.7L63.7 290.9L66.0 287.9L70.7 287.5L68.2 285.4L73.6 279.4L76.6 279.2L77.4 282.2L80.3 282.0L82.2 283.5L85.7 281.1L86.8 282.8L85.2 285.9ZM62.6 304.5L61.3 303.9L62.8 303.4Z","IE06":"M105.2 285.1L104.9 289.4L103.0 292.7L101.8 291.7L98.8 292.3L98.2 291.1L99.2 289.5L95.7 288.6L94.9 289.5L93.2 288.0L88.1 288.4L88.0 285.3L85.2 285.9L86.8 282.8L85.7 281.1L88.0 277.7L88.4 273.8L90.0 270.9L93.4 269.7L94.5 272.4L98.8 273.7L103.3 271.4L103.6 270.3L106.9 270.1L107.3 271.7L105.5 272.4L106.5 279.5L104.9 282.9Z","IE04":"M95.3 258.5L90.6 260.2L92.4 264.4L97.2 267.3L98.9 265.9L99.1 264.2L100.9 263.4L103.6 268.0L103.3 271.4L98.8 273.7L94.5 272.4L93.4 269.7L90.0 270.9L86.5 280.7L82.2 283.5L80.3 282.0L77.4 282.2L76.8 277.2L70.3 275.6L69.5 272.6L67.5 271.7L68.5 269.2L70.2 269.0L70.9 266.9L73.3 266.2L70.3 263.1L72.3 263.1L71.9 258.3L78.6 259.3L80.0 262.3L81.9 260.9L84.9 261.5L89.7 258.3L89.9 257.2L85.9 254.7L89.2 252.8L92.1 248.7L98.1 248.5L98.9 251.4L101.3 247.8L104.0 249.6L96.8 256.4L94.7 256.8ZM89.8 250.5L88.9 251.1L88.8 249.3ZM70.1 261.8L69.4 263.4L68.9 262.3L69.3 261.3Z","NL13":"M231.9 311.9L231.2 311.2L229.2 312.0L226.6 310.7L226.1 307.9L228.7 306.9L228.3 304.0L230.0 302.5L233.3 304.6L236.0 308.6L234.9 311.9Z","DE93":"M258.2 291.9L264.7 299.4L268.5 299.2L275.1 300.8L277.2 303.8L281.5 305.7L280.6 307.3L273.1 309.8L269.9 309.5L268.2 314.7L260.7 312.2L256.5 308.1L254.8 307.9L255.2 304.3L250.2 302.5L250.4 298.4L251.9 297.6L250.7 296.2L250.9 293.1L252.5 291.4L253.6 292.4Z","NL12":"M216.7 304.8L223.7 299.1L227.3 298.6L228.2 300.2L227.0 302.8L229.1 305.8L226.1 307.9L218.5 308.9ZM222.7 297.9L221.7 298.4L221.1 297.6L222.1 296.8ZM217.7 299.3L216.8 298.7L217.7 297.8L218.7 298.5Z","NL11":"M236.3 301.6L237.4 302.6L236.0 308.6L233.3 304.6L230.0 302.5L228.3 304.0L227.0 302.8L228.2 300.2L227.3 298.6L233.0 298.0Z","DE50":"M252.4 305.6L250.2 302.5L255.2 304.3L254.5 306.2ZM251.0 297.6L250.7 296.2L251.9 297.6L250.4 298.4Z","DE60":"M263.1 298.0L262.7 297.1L266.2 294.6L268.5 299.2L264.7 299.4ZM250.9 289.6L250.1 291.1L249.4 290.7Z","DEF0":"M277.9 282.7L276.4 282.8L275.4 281.2L277.2 281.2ZM259.8 275.8L264.7 276.7L265.8 279.1L265.2 281.3L267.1 282.5L267.1 283.9L268.8 282.6L272.4 284.6L274.6 283.4L275.9 284.4L275.9 286.4L273.1 288.6L274.4 290.4L273.2 294.0L274.9 295.6L271.4 300.4L268.5 299.2L267.1 295.1L266.2 294.6L262.7 297.1L258.2 291.9L255.8 291.7L253.9 289.2L255.1 288.5L254.1 285.2L252.6 284.2L254.5 282.3L254.3 280.2L252.3 274.4ZM252.8 280.3L252.6 281.7L251.3 281.2ZM251.6 278.3L249.8 277.6L251.8 277.2ZM249.7 278.7L249.2 279.4L248.6 278.4L249.5 277.2ZM249.7 275.0L248.7 275.0L249.4 273.1ZM245.2 286.0L245.0 287.5L243.9 285.9Z","DK03":"M272.5 277.2L271.8 275.7L274.0 271.3ZM269.3 263.1L270.7 265.3L271.8 263.7L273.1 270.0L271.6 273.8L266.7 272.0L266.6 270.0L264.4 268.8L263.2 264.2ZM269.9 274.9L269.4 276.1L268.3 274.7ZM259.8 275.8L252.3 274.4L252.6 266.7L251.4 265.3L250.4 266.7L249.2 263.3L248.5 264.1L247.4 263.4L248.4 258.9L250.8 259.6L259.7 257.5L262.3 261.1L263.3 263.0L261.7 266.1L262.5 268.7L261.2 270.0L261.2 272.3L263.6 271.9L265.8 274.9L261.4 274.8ZM251.7 271.5L250.6 271.1L250.9 269.5L252.0 269.6Z","DK04":"M280.1 243.7L280.2 245.0L279.4 244.9L278.8 243.9ZM259.2 245.0L263.5 246.9L268.3 244.9L269.7 247.4L273.1 247.6L273.9 250.0L272.1 253.2L270.2 254.0L269.5 251.7L268.1 253.2L267.5 258.2L265.2 258.8L265.3 261.0L262.3 261.1L259.7 257.5L250.8 259.6L248.4 258.9L249.9 257.1L248.0 253.3L248.8 245.1L253.1 248.1L256.3 242.4L257.3 245.9ZM271.4 259.8L270.4 258.9L271.2 257.9ZM271.1 257.1L270.2 257.7L270.8 255.6ZM252.4 246.1L251.1 244.9L252.4 244.5Z","DK05":"M276.5 234.9L276.0 235.5L275.8 233.6ZM275.4 235.1L274.9 236.1L273.4 235.2L275.2 234.1ZM267.2 244.8L263.5 246.9L259.2 245.0L257.3 239.5L255.8 239.9L253.6 244.5L250.5 244.5L249.6 242.3L252.5 237.8L259.9 236.6L265.0 230.0L269.5 228.2L270.2 234.8Z"};
const NUTS0_PATHS = {"ES":"M191.4 521.3L191.4 523.8L187.4 521.4L185.7 521.4L185.4 519.9L190.3 519.6ZM166.0 525.5L174.4 520.6L177.7 521.6L176.7 523.2L178.1 524.1L179.4 523.2L180.7 524.1L177.3 530.2L174.8 531.5L173.8 529.8L171.6 529.6L171.3 527.2L169.8 526.0L168.2 527.7ZM89.4 449.9L100.7 450.2L105.6 453.6L110.5 453.0L117.2 456.6L122.0 456.4L126.6 458.7L125.5 462.1L127.1 461.8L133.8 465.5L135.5 467.5L138.7 467.4L142.1 470.3L150.3 471.5L151.3 468.9L158.5 472.2L159.8 476.8L163.0 476.2L166.6 478.9L169.2 478.1L173.0 479.9L177.2 478.4L180.8 479.1L181.9 481.6L179.9 483.0L180.5 487.7L165.5 496.7L151.1 499.6L147.5 502.7L148.7 505.1L144.3 507.2L133.8 519.3L131.4 524.1L132.3 529.8L134.1 533.3L136.9 535.8L127.0 541.9L121.1 551.0L122.4 552.2L122.0 553.2L114.5 552.8L109.9 555.2L107.1 557.8L105.3 561.7L101.7 564.6L99.0 562.6L93.4 564.0L88.6 562.2L84.3 562.3L71.6 559.8L67.6 562.4L60.6 562.7L57.4 566.5L53.6 567.8L48.4 563.9L46.6 560.0L46.7 557.0L44.9 555.5L44.7 554.0L46.0 553.1L44.0 549.5L38.1 544.4L33.4 543.8L33.1 537.8L38.1 531.5L41.3 530.9L42.9 528.4L40.5 528.2L38.9 523.2L41.2 518.8L45.2 514.9L43.5 513.0L42.2 507.0L40.0 502.9L46.6 504.0L49.5 499.7L48.5 496.4L51.7 493.7L53.2 485.9L52.4 482.4L59.3 479.3L63.1 475.6L59.7 472.5L59.5 468.6L52.8 466.3L52.0 467.7L49.2 468.0L45.6 465.8L40.1 465.9L40.1 464.1L41.6 462.5L40.9 460.4L35.6 460.8L31.8 462.9L34.4 453.6L36.6 450.1L32.8 451.2L33.8 448.0L32.0 446.9L31.6 443.5L33.6 440.9L37.5 439.5L44.6 440.2L45.7 437.2L50.2 435.3L55.4 437.0L57.3 439.7L59.9 441.0L74.3 442.6L76.2 444.5ZM153.1 537.7L155.2 539.9L154.0 540.2L153.4 539.0L152.1 539.8ZM153.3 535.2L152.7 536.4L150.8 535.8L150.2 534.1L151.7 534.1L152.6 532.5L155.6 532.5L155.8 533.5Z","FR":"M247.9 483.8L251.9 479.6L256.7 478.2L258.2 474.1L259.7 486.4L257.7 495.7L255.4 500.2L250.6 497.7L251.0 495.6L248.8 490.9ZM187.0 334.4L187.7 339.0L189.8 341.1L193.1 340.7L194.2 344.7L197.4 345.5L198.2 348.3L201.6 348.1L203.1 350.2L202.3 354.5L205.4 355.4L207.9 354.7L209.6 352.2L210.0 357.9L215.4 361.5L216.1 363.6L219.9 363.0L225.8 364.7L227.8 365.5L230.2 370.0L231.8 369.1L235.2 370.9L237.8 370.3L239.5 372.1L246.0 373.7L241.3 379.6L238.3 387.6L237.4 395.2L238.1 396.5L235.7 399.1L233.9 399.1L232.9 397.8L230.7 398.9L231.6 400.6L224.9 407.0L224.2 410.0L220.9 413.1L219.9 415.4L220.5 417.1L218.4 420.1L221.7 419.1L221.6 417.2L225.0 415.1L228.7 415.6L228.4 420.1L230.9 424.2L228.0 426.4L232.0 432.8L231.1 435.7L225.5 437.5L227.1 441.1L229.8 442.3L230.4 444.3L228.0 447.4L228.0 450.1L229.8 452.3L233.9 454.3L236.5 454.1L237.8 455.5L235.4 458.2L235.4 460.0L225.4 466.3L224.2 469.7L214.2 471.1L212.4 469.0L209.1 468.3L208.1 466.2L205.2 466.0L203.1 464.4L200.3 465.2L198.7 463.8L195.1 463.2L193.6 461.5L191.8 461.8L182.7 466.3L180.3 469.7L179.5 476.5L180.8 479.1L177.2 478.4L173.0 479.9L169.2 478.1L166.6 478.9L163.1 476.4L163.9 475.1L160.9 473.6L159.7 474.2L158.5 472.2L151.3 468.9L150.3 471.5L142.1 470.3L138.7 467.4L135.5 467.5L133.8 465.5L127.1 461.8L125.5 462.1L126.6 458.7L122.5 457.4L122.0 456.4L125.6 454.0L131.9 436.7L133.2 435.6L132.1 433.6L134.8 422.4L135.9 421.9L138.6 426.1L139.4 425.7L138.3 422.8L134.7 418.7L133.6 414.4L134.1 413.7L135.7 415.7L136.7 413.2L136.0 410.7L137.6 408.6L135.7 409.1L129.8 404.5L126.7 398.1L129.0 395.3L127.2 393.2L127.3 391.2L124.1 389.9L124.3 386.3L121.0 386.0L115.2 381.7L114.0 379.4L105.3 377.3L103.3 373.7L106.1 372.3L104.9 370.3L105.6 369.1L102.4 366.7L103.6 364.7L107.8 363.7L115.0 365.1L116.8 362.9L121.0 362.7L125.1 368.8L129.3 367.6L131.9 369.2L133.8 368.1L137.7 369.6L138.6 368.8L138.6 360.9L137.2 351.8L143.3 352.8L144.3 358.8L146.3 358.0L154.4 360.9L162.2 358.7L163.3 359.7L157.8 357.4L159.0 355.0L172.8 350.1L175.5 348.0L175.2 346.0L176.2 345.7L176.7 337.5ZM126.1 395.8L125.1 394.4L126.2 394.5ZM116.8 387.5L117.0 388.7L115.9 388.5L115.8 386.9Z","PT":"M41.5 466.2L45.6 465.8L49.2 468.0L52.0 467.7L52.8 466.3L59.5 468.6L59.7 472.5L63.1 475.6L59.3 479.3L52.4 482.4L53.2 485.9L51.7 493.7L48.5 496.4L49.5 499.7L46.6 504.0L40.0 502.9L42.2 507.0L43.5 513.0L45.2 514.9L41.2 518.8L38.9 523.2L40.5 528.2L42.9 528.4L41.3 530.9L38.1 531.5L33.1 537.8L33.4 543.8L26.3 545.6L22.9 543.0L17.8 541.1L12.5 541.5L16.2 535.1L17.2 526.2L20.8 517.9L14.8 517.7L14.7 514.2L12.1 511.7L16.2 502.4L19.5 500.2L29.5 482.7L30.9 478.3L31.8 462.9L35.6 460.8L40.9 460.4L41.6 462.5L40.1 464.1L40.1 465.9Z","IT":"M294.0 411.7L308.3 413.7L308.0 415.2L304.8 417.4L307.8 419.7L306.2 421.7L307.7 423.1L307.5 425.7L311.2 428.4L309.2 429.2L309.1 427.6L307.3 426.1L305.3 427.2L302.2 426.7L301.8 428.7L296.9 431.1L294.9 430.8L290.6 434.9L294.7 440.6L294.0 443.2L292.6 442.8L294.1 452.7L298.7 456.8L308.8 462.6L316.8 480.0L324.9 487.1L329.7 489.2L342.1 488.6L342.8 490.8L339.7 494.2L341.4 496.7L367.2 507.2L374.6 514.9L373.6 520.6L369.5 519.2L367.7 515.4L365.0 513.5L361.4 513.6L356.4 510.7L353.4 512.9L349.5 523.2L350.1 525.2L358.3 529.3L359.0 536.7L355.7 537.2L351.8 540.4L352.3 545.1L347.8 550.4L346.2 554.4L341.9 555.0L340.5 553.6L340.3 550.4L342.3 548.6L343.5 545.2L342.6 542.8L347.0 539.9L339.7 521.9L338.2 520.0L334.4 521.0L329.0 517.6L329.4 514.7L326.5 510.6L322.5 511.5L321.5 509.4L316.7 507.2L313.0 501.9L307.1 501.1L304.2 502.1L298.4 498.5L289.9 489.6L288.4 489.2L285.9 485.3L283.5 483.8L279.7 483.4L279.6 481.3L275.2 477.1L274.1 474.5L271.8 474.2L271.6 469.2L267.2 457.3L255.0 450.8L250.6 449.8L244.6 454.5L242.9 457.6L235.4 460.0L235.4 458.2L237.8 455.5L236.5 454.1L233.9 454.3L229.8 452.3L228.0 450.1L228.0 447.4L230.4 444.3L229.8 442.3L227.1 441.1L225.5 437.5L231.1 435.7L232.0 432.8L228.0 426.4L230.9 424.2L232.2 425.2L237.2 423.6L240.5 424.6L243.8 420.7L243.5 418.8L246.7 415.8L247.6 419.1L251.8 422.3L252.7 426.3L254.2 425.6L254.1 423.1L256.7 419.6L257.5 415.2L258.9 415.5L260.4 418.4L264.4 417.4L266.5 419.5L267.3 419.0L266.0 415.7L266.7 413.8L267.9 413.1L270.7 414.7L270.8 409.2L276.9 410.6L278.8 407.3L285.7 406.9L291.1 405.3L290.2 407.9ZM295.0 491.7L297.0 491.7L296.6 490.4ZM335.2 485.1L334.2 486.2L333.6 484.8ZM333.7 565.0L335.6 566.5L336.8 570.0L334.7 573.3L334.7 576.2L326.7 574.8L324.0 571.5L315.0 568.9L304.2 562.9L301.2 563.0L298.0 559.6L298.8 555.9L302.0 553.5L305.0 555.2L306.5 553.0L309.2 552.2L315.0 555.8L323.6 554.7L328.6 552.1L333.1 552.2L339.1 549.3L338.9 551.6L335.5 557.5ZM330.0 544.5L330.8 547.2L328.5 545.4ZM316.1 509.7L315.6 510.8L314.3 510.5L314.4 509.4ZM305.3 590.6L305.6 592.0L304.3 592.0L303.7 591.1ZM293.2 577.0L291.4 575.9L293.2 576.2ZM277.5 484.1L276.4 485.2L275.9 484.2L276.4 483.5ZM270.9 476.1L270.7 478.2L267.0 478.0L266.6 477.2ZM264.0 472.8L263.2 473.9L262.6 472.9L263.3 471.6ZM263.0 515.3L260.6 519.7L261.8 522.4L259.5 537.8L253.5 536.6L252.6 539.8L250.7 541.8L247.5 541.4L246.0 539.1L244.5 540.1L244.5 532.5L246.5 525.6L244.9 524.3L245.8 519.1L244.9 516.5L243.8 513.8L241.9 513.3L242.7 508.9L246.5 509.5L250.2 507.9L255.3 502.8L259.3 504.5ZM244.5 505.9L243.2 504.8L244.1 504.2ZM243.6 536.6L243.0 538.7L242.2 537.6ZM243.4 507.2L242.9 508.6L241.8 507.7L242.5 506.6Z","SI":"M337.5 412.3L338.3 414.1L336.4 414.0L330.9 418.0L332.0 421.4L331.5 423.7L327.3 425.9L328.5 429.8L327.0 430.9L324.0 429.7L322.4 430.5L319.0 427.3L317.0 430.4L308.4 431.6L307.9 430.6L311.2 428.4L307.5 425.7L307.7 423.1L306.2 421.7L307.8 419.7L304.8 417.4L308.0 415.2L308.3 413.7L316.7 414.6L318.3 415.7L323.7 410.6L334.6 409.5L334.2 406.8L335.5 406.1L337.8 406.2L341.6 412.2L338.9 411.4Z","AT":"M342.3 376.2L341.6 379.3L345.7 386.1L344.7 391.1L339.8 391.1L337.9 392.6L340.7 393.4L340.7 396.0L338.5 397.8L339.0 403.4L334.2 406.8L334.6 409.5L323.7 410.6L318.3 415.7L316.7 414.6L294.0 411.7L290.2 407.9L291.1 405.3L285.7 406.9L278.8 407.3L276.9 410.6L270.8 409.2L269.9 407.1L267.1 409.3L260.9 405.8L260.1 402.3L261.6 400.1L260.4 397.8L265.1 397.7L267.7 400.7L267.5 402.3L270.3 400.2L270.6 397.5L275.5 397.8L277.0 400.1L281.5 399.3L283.9 396.7L290.0 396.1L290.3 394.7L293.7 395.8L295.9 394.9L298.6 397.8L299.9 397.4L300.2 395.0L298.5 393.9L299.0 391.7L296.2 387.6L303.2 383.0L304.4 379.3L306.8 380.5L307.8 376.1L311.0 378.9L317.4 378.7L320.0 375.1L320.7 371.5L335.0 374.9L337.8 373.4L341.5 374.7Z","LU":"M227.3 358.8L225.8 364.7L219.9 363.0L220.9 361.0L219.4 357.8L222.7 352.5L223.9 353.4L224.2 356.2Z","CZ":"M316.4 340.4L318.1 340.2L318.8 337.9L320.8 338.2L322.4 341.2L333.4 343.6L332.2 346.2L336.1 351.1L337.6 351.4L340.3 348.6L339.1 345.7L345.0 348.4L348.1 347.5L347.5 350.0L349.8 352.4L351.8 350.8L355.1 352.8L357.9 352.8L358.6 355.4L360.8 356.7L361.6 359.0L358.6 359.6L354.7 364.0L353.9 367.7L349.7 371.5L344.5 372.0L342.3 376.2L341.5 374.7L337.8 373.4L335.0 374.9L320.7 371.5L320.0 375.1L317.4 378.7L311.0 378.9L294.1 364.9L291.5 360.3L293.0 357.8L289.8 355.3L287.9 351.0L290.4 352.8L293.1 349.4L295.5 348.6L296.9 349.3L304.2 343.5L311.6 340.2L310.9 337.7L313.8 338.7L314.3 340.8L315.9 341.3Z","MT":"M328.0 590.4L325.5 590.6L324.7 588.6ZM324.5 587.2L323.8 588.1L322.4 587.1Z","CY":"M569.5 560.9L571.4 560.8L573.9 557.3L577.2 556.7L576.6 552.9L586.3 550.6L596.5 541.6L590.1 551.2L593.0 554.4L590.9 556.4L588.6 556.5L588.1 559.5L582.6 563.0L581.0 564.6L581.2 565.8L580.4 566.2L579.1 564.9L574.0 565.8Z","EL":"M508.0 562.1L506.2 563.2L505.2 559.6L506.7 556.1L511.0 553.8L510.0 559.6ZM506.0 551.8L504.8 552.6L503.9 551.2ZM499.9 555.7L498.3 556.4L499.3 555.0ZM495.7 550.6L494.9 551.6L493.6 551.4L496.8 548.4L498.0 549.1ZM497.2 554.1L495.6 554.7L495.5 553.7ZM500.3 572.4L498.9 573.0L498.1 570.5L499.5 566.7ZM493.4 548.5L492.2 549.3L491.6 548.6L492.5 547.5ZM492.0 540.5L491.0 541.2L489.7 540.3L491.0 539.6ZM493.8 552.6L493.4 553.4L492.4 551.8L493.1 551.4ZM497.7 573.9L495.7 575.2L496.6 573.6ZM490.2 536.3L488.5 537.8L485.2 537.1L487.2 535.4ZM489.1 544.6L487.9 545.2L488.1 543.4L489.4 543.5ZM471.5 485.1L468.3 489.8L467.0 488.3L456.4 487.8L452.8 490.8L448.5 490.1L444.5 494.5L439.9 495.0L439.6 496.3L442.0 499.7L444.1 500.4L444.2 501.7L442.2 501.0L440.6 502.9L444.5 505.2L444.5 507.7L439.9 504.1L435.3 504.7L431.5 503.4L429.7 501.8L429.7 499.2L427.0 501.1L426.4 507.8L432.3 515.9L438.7 521.6L437.4 522.8L435.5 520.5L432.8 520.9L432.3 522.5L435.1 525.5L434.4 526.8L429.9 528.9L439.6 530.8L440.4 533.0L442.6 531.7L436.8 527.4L437.5 525.3L439.1 525.1L443.1 527.6L449.9 529.0L453.3 534.5L457.1 537.5L456.3 538.6L454.2 538.5L449.3 533.7L445.1 534.7L450.5 536.4L452.0 544.2L451.1 545.1L446.4 541.4L443.7 542.2L445.2 540.4L438.7 543.7L441.1 548.2L442.7 548.5L443.6 547.1L445.0 549.8L444.5 550.7L440.8 552.7L439.9 550.9L435.3 549.6L439.6 557.7L441.9 565.5L436.4 563.0L433.7 567.8L428.3 560.9L426.4 561.6L425.2 564.2L423.1 563.3L421.2 559.7L421.6 555.0L413.1 547.4L415.9 542.1L419.0 542.4L421.8 539.0L435.9 543.1L436.9 542.5L436.4 541.1L438.9 540.7L439.9 539.4L431.4 537.0L431.1 537.9L429.1 536.2L426.0 538.2L423.3 537.6L412.7 540.4L406.2 532.4L407.5 531.0L410.3 531.4L410.4 528.7L405.5 530.3L401.7 526.1L399.4 525.8L396.9 521.0L394.9 520.1L397.7 520.2L398.4 517.5L399.5 517.8L398.7 514.7L401.8 512.6L406.2 502.9L404.8 499.1L414.7 496.3L416.1 493.3L419.5 491.5L421.1 492.1L425.9 490.6L426.2 488.1L427.3 487.3L436.5 485.1L441.3 482.9L441.5 481.7L447.0 480.2L450.9 482.6L452.3 482.0L456.6 483.1L464.9 480.7L467.7 478.0L465.9 473.6L469.2 472.8L472.2 474.0L473.5 477.6L470.5 480.6ZM477.8 512.6L480.9 515.8L480.1 517.1L475.5 517.2L475.1 515.2L473.6 516.4L471.1 515.5L471.3 513.9L474.7 511.5L476.6 510.9ZM487.3 556.1L486.2 557.9L484.2 556.8L486.0 556.5L486.3 555.0ZM479.4 541.5L477.6 542.5L478.5 540.4L482.2 539.1ZM461.9 582.2L470.0 579.7L477.9 580.0L480.6 579.1L482.4 582.0L488.0 578.8L488.8 579.8L487.2 582.9L469.4 587.7L468.1 585.4L452.6 585.9L451.3 584.4L451.5 581.2L453.1 581.0L453.4 578.6L455.0 580.3L459.2 578.9ZM474.7 524.6L477.0 524.9L477.7 529.0L476.3 532.0L474.1 530.9L475.4 528.9L472.7 526.0ZM480.9 551.9L477.9 555.3L477.1 554.9L480.3 551.2ZM479.4 561.3L478.9 562.4L477.5 562.0L478.2 560.7ZM465.2 495.7L463.5 496.5L461.8 495.5L464.5 494.6ZM470.1 525.7L470.1 527.1L469.0 526.9L469.4 525.3ZM473.8 552.7L472.7 553.6L471.0 551.5L472.8 548.8L474.0 550.0ZM474.9 562.7L473.7 563.0L474.0 561.2ZM471.0 544.9L469.2 545.6L469.1 544.6ZM459.8 504.1L462.7 503.5L462.6 506.7L460.9 505.6L460.4 507.3L458.6 505.8ZM472.7 557.1L472.3 558.4L470.7 556.2ZM469.0 546.7L468.1 547.7L468.5 545.2ZM469.8 551.9L468.8 553.4L467.0 553.3L468.3 551.0ZM467.9 544.1L464.5 542.7L467.7 542.7ZM469.8 558.3L469.1 559.4L468.2 558.9L469.5 557.5ZM460.1 511.8L459.1 513.6L459.0 511.2ZM464.1 541.3L463.6 541.9L460.2 539.6L460.1 538.3L463.1 539.1ZM467.3 560.5L466.3 561.0L465.7 560.0L466.5 558.8ZM464.7 547.3L463.8 547.8L463.5 545.4ZM463.7 555.0L462.9 555.8L461.8 554.7L462.3 553.7ZM452.9 494.7L451.2 496.2L449.7 494.4L450.0 493.0L451.0 492.2ZM457.3 525.0L456.6 526.0L453.6 524.2L454.1 522.4ZM462.6 558.0L460.5 558.1L461.0 557.0ZM460.1 552.4L458.5 552.6L458.8 551.4ZM461.2 559.5L458.4 560.8L459.3 558.8ZM458.0 549.5L457.3 549.8L457.3 547.4ZM456.9 544.2L455.7 546.8L455.3 544.5ZM461.1 590.6L460.6 591.8L458.9 590.9ZM448.5 517.0L448.4 518.2L447.0 518.3L447.8 516.4ZM448.0 521.5L447.5 522.2L446.4 521.4L446.4 518.8ZM452.1 548.7L450.8 549.2L450.0 548.2L451.3 547.7ZM453.6 559.1L452.4 559.8L451.4 558.9L452.5 558.1ZM444.6 521.6L444.1 522.7L442.6 521.6ZM441.0 508.1L441.1 509.0L437.0 509.0L436.0 505.7ZM445.2 545.9L444.6 546.3L443.5 544.9L445.2 544.5ZM446.8 558.3L447.5 559.9L445.6 558.4ZM445.9 550.9L446.3 552.5L444.5 552.1ZM441.2 521.1L440.9 522.8L439.9 522.3L439.9 521.1ZM442.0 553.4L440.9 554.7L440.7 553.2ZM435.9 522.4L436.5 524.0L435.2 524.1ZM442.6 571.1L442.7 572.5L441.3 572.3L440.2 569.8L440.9 568.7ZM435.5 527.7L434.9 528.7L433.5 528.2L434.2 527.1ZM409.3 536.4L408.7 537.8L408.4 535.6ZM408.3 548.9L410.4 550.6L409.6 552.0L406.7 549.8L407.4 548.1ZM405.6 541.5L408.4 545.5L402.1 544.3L402.7 541.9L404.4 541.4L404.2 539.3ZM407.6 541.5L406.6 541.7L405.3 539.3L406.5 539.4ZM406.6 536.2L404.1 536.7L404.9 533.1L405.7 532.8ZM394.4 523.3L395.0 524.6L390.0 519.6L390.7 518.8L393.6 518.6L393.0 520.3Z","BG":"M429.8 445.4L435.8 445.8L440.0 444.1L453.0 443.3L458.7 436.5L467.9 431.5L471.7 430.8L473.5 432.2L479.8 431.2L481.4 433.4L488.5 433.4L489.4 437.1L488.8 439.2L485.2 439.9L484.0 441.8L483.0 444.3L483.8 452.0L480.5 456.9L483.0 457.8L488.6 463.6L482.9 465.6L479.0 464.1L476.4 464.7L475.3 466.5L470.9 468.7L470.9 470.3L468.9 471.4L469.2 472.8L465.9 473.6L467.7 478.0L464.9 480.7L456.6 483.1L452.3 482.0L450.9 482.6L447.0 480.2L441.5 481.7L441.3 482.9L436.5 485.1L427.9 487.3L427.8 480.5L425.4 476.1L420.7 474.7L418.4 472.5L420.2 470.0L418.1 463.8L421.7 462.1L424.0 456.6L417.3 452.3L414.8 448.1L414.8 444.7L416.9 442.7L417.3 440.4L421.9 442.6L420.3 445.6L422.2 446.5L427.0 444.9Z","HR":"M345.0 414.5L350.4 419.6L357.9 422.1L364.1 422.0L366.4 419.3L369.0 418.6L370.1 424.3L371.8 425.0L371.3 427.4L376.7 430.4L373.1 431.4L373.6 434.4L372.6 436.1L370.7 436.4L369.1 433.8L366.3 433.0L360.2 432.9L358.2 434.4L347.4 432.3L342.9 433.1L340.2 437.0L336.6 434.1L334.4 433.8L333.6 438.7L334.4 441.4L336.3 442.3L338.8 445.6L339.7 450.3L350.8 460.0L354.2 461.6L354.4 463.6L359.4 468.4L358.3 471.2L356.2 470.6L356.9 469.3L355.6 467.8L350.5 464.8L345.7 465.1L346.7 463.2L344.7 462.0L338.7 462.3L336.2 458.8L330.6 455.8L327.9 452.2L328.2 450.5L329.7 449.6L324.6 445.6L323.3 437.8L321.8 436.7L321.7 438.5L319.3 437.9L318.7 434.6L317.3 433.5L312.4 442.6L308.0 436.3L306.9 431.5L317.0 430.4L319.0 427.3L322.4 430.5L324.0 429.7L327.0 430.9L328.5 429.8L327.3 425.9L331.5 423.7L332.0 421.4L330.9 418.0L336.4 414.0L338.3 414.1L337.5 412.3L338.9 411.4ZM369.7 475.1L371.1 477.2L359.2 470.8L361.8 470.4ZM354.2 469.4L353.4 470.8L347.6 471.4L347.3 470.7L350.8 470.1L352.0 468.9ZM351.0 467.0L351.2 467.7L348.5 467.4ZM346.9 466.3L347.4 467.9L344.0 467.2ZM345.0 481.0L343.0 480.6L344.6 479.8ZM342.0 470.1L339.7 469.7L342.0 469.2ZM329.9 456.4L330.2 458.5L328.8 457.6ZM329.1 456.4L328.4 457.1L327.1 456.0L326.0 454.4L326.6 453.4ZM327.5 448.1L327.7 449.5L325.9 446.9ZM324.9 451.6L325.2 453.6L323.8 452.5ZM322.6 442.1L321.8 442.6L321.1 441.4L322.5 440.7ZM321.1 449.0L320.0 449.2L320.2 447.3ZM318.4 445.1L318.8 446.4L317.2 446.2L316.8 440.2L317.6 438.9L319.2 444.9ZM317.3 436.2L317.1 437.9L316.0 436.8L316.6 435.7Z","RO":"M460.2 373.9L470.1 382.1L473.3 387.5L473.9 396.1L475.9 404.5L477.5 406.3L480.4 408.3L484.5 408.3L491.5 403.4L493.9 404.1L495.2 406.1L495.9 412.1L491.2 414.7L489.5 416.8L487.0 423.9L488.5 433.4L481.4 433.4L479.8 431.2L473.5 432.2L471.7 430.8L467.9 431.5L458.7 436.5L453.0 443.3L440.0 444.1L435.8 445.8L427.0 444.9L422.2 446.5L420.3 445.6L421.9 442.6L417.3 440.4L414.3 436.9L417.1 435.0L416.6 434.1L413.0 433.0L410.3 437.0L408.4 435.3L404.0 434.9L400.2 432.9L402.3 431.5L400.3 429.9L400.7 426.6L395.0 425.2L392.3 422.8L391.6 418.5L389.8 418.0L384.4 413.2L389.4 411.9L390.0 409.9L393.0 409.8L394.3 408.6L402.0 385.6L405.2 381.8L407.5 381.3L412.4 375.1L416.1 376.8L416.8 376.0L424.2 376.4L427.9 374.7L432.8 377.6L434.3 377.0L436.0 373.9L444.6 370.8L446.6 366.8L451.4 364.7L454.1 366.2Z","HU":"M399.8 372.7L404.5 374.4L406.0 376.3L408.4 376.0L409.5 378.3L407.5 381.3L405.2 381.8L402.0 385.6L396.7 402.5L395.4 403.6L395.6 406.4L393.0 409.8L390.0 409.9L389.4 411.9L384.4 413.2L377.8 413.0L373.6 416.9L371.4 416.8L370.6 418.2L366.4 419.3L364.1 422.0L357.9 422.1L350.4 419.6L348.5 416.9L341.6 412.2L337.8 406.2L335.5 406.1L339.0 403.4L338.5 397.8L340.7 396.0L340.7 393.4L337.9 392.6L339.8 391.1L344.7 391.1L345.7 386.1L352.2 389.6L359.0 389.2L364.9 387.2L363.9 384.9L365.3 383.1L371.0 381.7L372.6 379.2L376.1 380.2L377.5 379.7L380.0 377.3L382.1 372.8L384.6 371.8L388.6 372.4L391.7 370.7L395.8 373.8Z","SK":"M373.4 362.7L375.5 362.5L376.2 360.3L378.7 358.6L380.8 358.1L384.6 359.3L386.3 357.2L389.2 356.5L394.5 356.6L397.0 358.9L402.7 360.2L399.8 372.7L395.8 373.8L391.7 370.7L388.6 372.4L384.6 371.8L382.1 372.8L380.0 377.3L377.5 379.7L376.1 380.2L372.6 379.2L371.0 381.7L365.3 383.1L363.9 384.9L364.9 387.2L359.0 389.2L352.2 389.6L345.7 386.1L343.4 383.5L341.6 379.3L344.5 372.0L349.7 371.5L353.9 367.7L354.7 364.0L358.6 359.6L361.6 359.0L363.4 360.5L365.1 360.2L368.0 356.5L370.5 359.6L371.9 359.8L372.3 362.6Z","PL":"M359.1 275.8L355.8 278.3L355.9 279.3L357.4 279.1L360.8 275.8L378.0 275.3L391.3 271.9L397.3 275.3L399.5 282.2L403.8 289.8L405.8 298.1L401.9 301.5L399.8 306.3L405.4 309.2L405.3 314.8L408.3 321.8L413.6 328.0L412.6 329.1L414.3 331.5L414.4 334.6L411.3 336.6L402.7 351.9L405.7 360.0L397.0 358.9L394.5 356.6L389.2 356.5L386.3 357.2L384.6 359.3L380.8 358.1L378.7 358.6L376.2 360.3L375.5 362.5L372.3 362.6L371.9 359.8L370.5 359.6L368.0 356.5L365.1 360.2L363.4 360.5L360.8 356.7L358.6 355.4L357.9 352.8L355.1 352.8L351.8 350.8L349.8 352.4L347.5 350.0L348.1 347.5L345.0 348.4L339.1 345.7L340.3 348.6L337.6 351.4L336.1 351.1L332.2 346.2L333.4 343.6L322.4 341.2L320.8 338.2L318.8 337.9L318.1 340.2L316.4 340.4L318.1 333.5L316.9 330.4L315.2 329.7L313.2 324.6L314.4 320.4L311.8 315.2L312.7 313.0L307.5 308.0L307.3 305.9L309.2 304.1L309.9 300.8L307.8 293.5L310.2 293.5L310.8 291.3L307.1 291.2L307.2 289.7L311.2 288.3L312.2 289.2L313.2 287.4L325.2 282.5L328.5 278.2L339.5 272.7L345.8 271.3L349.3 277.7L352.7 278.4L356.5 277.7Z","LT":"M402.5 234.9L405.4 238.3L410.5 238.3L418.7 243.5L421.2 243.5L421.5 248.7L424.0 250.2L423.6 251.9L420.4 253.1L419.7 255.6L417.3 257.3L416.4 259.7L417.1 263.3L416.4 267.4L418.9 270.0L417.0 270.7L415.8 268.6L412.4 271.9L410.0 272.4L410.1 275.0L406.8 277.2L404.5 276.7L398.0 278.0L397.3 275.3L395.2 273.5L391.3 271.9L389.8 272.6L388.2 269.4L389.1 265.0L385.7 261.3L381.0 262.6L373.7 259.8L372.8 260.5L368.6 247.2L372.3 242.6L377.3 239.6L382.2 239.8L384.7 238.8L386.3 239.9L392.4 238.0L396.4 239.1L399.8 237.9Z","LV":"M420.2 211.9L421.7 211.5L422.3 213.0L425.7 214.9L425.8 222.0L427.6 221.6L433.2 230.1L429.5 239.5L424.9 239.8L422.9 242.9L418.7 243.5L410.5 238.3L405.4 238.3L402.5 234.9L399.8 237.9L396.4 239.1L392.4 238.0L386.3 239.9L384.7 238.8L382.2 239.8L377.3 239.6L372.3 242.6L368.6 247.2L367.1 242.8L366.7 234.9L369.0 231.1L368.8 226.1L370.6 221.4L377.6 217.4L378.7 219.8L383.9 223.3L385.9 227.0L389.0 228.2L392.0 227.1L394.9 223.2L392.7 212.0L398.1 208.1L400.8 207.4L407.4 209.4L410.6 212.8L413.0 213.6L416.0 211.2Z","EE":"M408.9 181.5L416.2 180.4L417.6 178.7L419.2 179.6L417.1 187.7L414.9 191.3L418.9 200.7L422.0 205.2L420.7 206.9L420.2 211.9L416.0 211.2L413.0 213.6L410.6 212.8L407.4 209.4L400.8 207.4L398.1 208.1L392.7 212.0L392.4 204.3L391.0 204.2L388.6 206.0L386.3 205.2L383.2 201.4L383.2 198.7L381.7 199.3L381.1 192.1L385.4 189.2L385.0 187.9L386.4 188.0L387.7 185.7L390.7 185.4L390.8 183.6L393.4 184.3L395.9 183.4L397.9 180.6L399.0 181.7L399.4 180.7ZM381.6 201.5L382.1 203.1L380.1 203.5L381.2 204.7L377.1 209.1L373.8 210.2L373.3 213.9L372.2 215.0L372.9 211.4L369.9 209.5L369.6 205.9L371.1 206.4L374.6 202.8L378.3 202.4L380.5 200.9ZM378.4 194.7L380.4 195.5L378.8 196.1ZM373.8 195.0L378.3 198.3L374.5 201.6L371.9 198.3Z","FI":"M378.7 22.9L377.5 25.3L378.6 26.7L378.6 31.9L380.5 35.6L385.9 38.0L391.9 43.4L390.1 56.2L399.7 67.9L403.1 73.9L401.0 75.8L402.0 77.0L402.3 81.9L403.9 83.3L404.2 87.9L407.5 89.9L409.5 94.5L413.7 97.9L413.9 102.8L412.1 105.5L417.0 108.8L423.5 111.3L427.8 115.6L427.5 123.4L418.5 147.7L411.0 161.8L408.1 164.1L405.5 163.6L402.0 166.2L400.4 165.5L400.4 167.5L397.9 167.6L398.3 169.2L397.3 170.5L391.5 171.7L386.2 177.0L382.9 177.5L381.5 179.4L377.3 180.4L376.0 181.8L373.3 180.6L374.0 177.7L373.1 179.0L369.5 180.1L368.6 176.5L367.0 177.5L365.7 173.8L364.0 176.1L362.1 172.1L358.4 173.2L358.5 170.0L357.1 167.3L358.0 164.4L357.4 154.3L354.8 149.5L353.9 143.6L350.6 137.3L350.6 133.1L352.0 133.8L352.9 128.5L356.0 125.4L358.3 125.9L357.4 123.1L359.2 119.5L359.2 116.6L363.8 114.4L363.8 112.1L365.3 112.0L369.5 98.1L373.7 95.8L371.7 86.6L369.9 84.7L363.0 83.1L357.7 75.4L357.7 66.0L353.9 60.8L354.1 56.8L351.9 56.2L351.3 48.0L347.9 45.6L346.7 43.3L340.1 41.4L329.1 33.5L330.1 32.6L332.0 33.1L331.6 30.2L332.8 28.8L334.8 28.9L341.3 37.1L346.4 37.6L348.9 36.0L350.1 33.7L356.7 36.5L357.9 35.2L357.9 31.9L360.1 29.9L358.6 17.0L360.5 12.4L363.9 11.9L368.0 8.0L371.6 11.3L376.5 12.4L378.7 15.3L377.4 19.8ZM370.7 94.9L370.3 95.7L368.5 94.3L370.2 93.2ZM365.8 176.8L366.4 178.2L365.3 179.3L364.6 177.0ZM364.2 178.4L363.0 179.1L363.0 177.9L364.0 177.5ZM362.8 177.2L361.5 177.7L361.9 174.1ZM362.8 179.6L361.8 179.9L361.9 178.4ZM351.9 128.9L350.9 129.6L349.4 128.0L349.9 126.0L351.2 126.3ZM358.2 175.2L359.1 177.6L357.9 176.9ZM354.2 182.0L353.6 183.3L352.3 182.7L352.8 180.7ZM350.5 178.5L350.2 180.3L349.1 180.1L350.4 181.8L351.0 180.4L350.6 183.0L345.0 180.5L345.8 177.7L347.2 179.5L347.1 176.8Z","BE":"M214.2 331.1L215.5 333.9L218.2 333.7L221.2 336.0L219.6 342.7L223.2 342.9L225.1 345.0L224.8 346.9L226.1 347.4L226.9 350.3L223.9 353.4L222.7 352.5L221.3 353.7L219.4 357.8L220.9 361.0L219.9 363.0L216.1 363.6L215.4 361.5L210.0 357.9L210.1 352.6L205.4 355.4L202.3 354.5L203.1 350.2L201.6 348.1L198.2 348.3L197.4 345.5L194.2 344.7L193.1 340.7L189.8 341.1L187.7 339.0L187.0 334.4L196.0 330.6L196.1 332.2L201.0 333.7L205.2 331.3L206.7 331.6L207.9 329.9L209.7 330.8L210.8 329.6L211.8 330.8Z","DE":"M259.8 275.8L264.7 276.7L265.8 279.1L265.2 281.3L267.1 282.5L267.1 283.9L268.8 282.6L272.4 284.6L274.6 283.4L275.9 284.4L275.9 286.4L273.1 288.6L274.4 290.4L276.8 289.5L278.5 290.5L281.7 287.4L289.5 284.0L290.2 281.9L292.5 283.1L294.4 282.0L296.5 282.6L297.7 278.1L299.1 280.7L300.8 279.5L300.2 281.2L301.2 282.9L298.6 284.2L298.0 285.8L299.6 287.0L302.9 286.1L304.5 288.8L307.2 289.7L307.1 290.8L304.1 291.3L307.8 293.5L309.9 300.8L309.2 304.1L307.3 305.9L307.5 308.0L312.7 313.0L311.8 315.2L314.4 320.4L313.2 324.6L315.2 329.7L316.9 330.4L318.0 335.8L315.9 341.3L314.3 340.8L312.8 337.8L310.9 337.7L311.6 340.2L304.2 343.5L296.9 349.3L295.5 348.6L293.1 349.4L290.4 352.8L287.9 351.0L289.8 355.3L293.0 357.8L291.5 360.3L294.1 364.9L307.8 376.1L306.8 380.5L304.4 379.3L303.2 383.0L296.2 387.6L299.0 391.7L298.5 393.9L300.2 395.0L299.9 397.4L298.6 397.8L295.9 394.9L293.7 395.8L290.3 394.7L290.0 396.1L283.9 396.7L281.5 399.3L277.0 400.1L275.5 397.8L270.6 397.5L270.3 400.2L267.5 402.3L267.7 400.7L265.1 397.7L260.4 397.8L258.2 396.3L250.3 395.2L249.8 393.3L247.6 395.5L249.7 395.5L247.6 397.2L239.5 397.4L237.4 395.2L238.3 387.6L241.3 379.6L246.0 373.7L239.5 372.1L237.8 370.3L235.2 370.9L231.8 369.1L230.2 370.0L227.8 365.5L225.8 364.7L227.3 358.8L224.2 356.2L223.9 353.4L226.9 350.3L226.1 347.4L224.8 346.9L225.1 345.0L223.2 342.9L224.1 340.3L222.0 338.2L225.2 335.8L224.2 334.8L225.9 332.8L225.7 330.2L223.4 326.3L225.8 323.9L228.2 325.2L232.1 323.5L232.1 320.5L235.3 318.6L234.9 315.2L231.7 314.3L231.9 311.9L234.9 311.9L237.1 306.2L238.0 300.5L235.4 299.8L238.3 294.3L245.5 294.4L247.4 299.4L248.4 298.7L248.4 296.3L251.0 297.6L250.9 293.1L252.5 291.4L253.6 292.4L258.2 291.9L255.8 291.7L253.9 289.2L255.1 288.5L254.1 285.2L252.6 284.2L254.5 282.3L254.3 280.2L252.3 274.4ZM277.9 282.7L276.4 282.8L275.4 281.2L277.2 281.2ZM252.8 280.3L252.6 281.7L251.3 281.2ZM251.6 278.3L249.8 277.6L251.8 277.2ZM250.9 289.6L250.1 291.1L249.4 290.7ZM249.7 278.7L249.2 279.4L248.6 278.4L249.5 277.2ZM249.7 275.0L248.7 275.0L249.4 273.1ZM245.2 286.0L245.0 287.5L243.9 285.9ZM234.9 294.4L234.6 296.0L233.7 294.4ZM233.1 295.1L233.4 296.7L232.1 296.4Z","NL":"M236.3 301.6L237.4 301.9L237.1 306.2L234.9 311.9L231.9 311.9L231.7 314.3L234.9 315.2L235.3 318.6L232.1 320.5L232.1 323.5L228.2 325.2L225.8 323.9L223.4 326.3L225.7 330.2L225.9 332.8L224.2 334.8L225.2 335.8L222.0 338.2L224.1 340.3L223.2 342.9L219.6 342.7L221.2 336.0L218.2 333.7L215.5 333.9L213.6 330.4L211.8 330.8L210.8 329.6L209.7 330.8L207.9 329.9L206.7 331.6L200.4 330.2L198.4 328.6L199.2 327.5L201.5 327.5L201.5 324.6L203.8 323.1L203.5 321.1L204.9 320.8L209.1 315.6L213.4 302.0L214.1 302.8L213.2 306.1L216.7 304.8L223.7 299.1L233.0 298.0ZM222.7 297.9L221.7 298.4L221.1 297.6L222.1 296.8ZM217.7 299.3L216.8 298.7L217.7 297.8L218.7 298.5ZM205.1 331.7L201.0 333.7L196.1 332.2L196.0 330.6Z","IE":"M95.3 258.5L90.6 260.2L92.4 264.4L97.2 267.3L98.9 265.9L99.1 264.2L100.9 263.4L103.6 268.0L103.6 270.3L106.9 270.1L107.3 271.7L105.5 272.4L106.5 279.5L104.9 282.9L104.9 289.4L98.6 298.9L98.6 301.3L92.9 299.4L92.0 300.4L88.0 299.8L85.3 301.5L73.1 305.0L66.3 305.1L63.9 303.5L63.8 301.2L60.2 300.7L60.6 298.7L58.3 296.4L61.6 293.5L59.6 291.8L60.0 290.7L63.7 290.9L66.0 287.9L70.7 287.5L68.2 285.4L73.6 279.4L76.6 279.2L77.0 278.2L76.8 277.2L70.3 275.6L69.5 272.6L67.5 271.7L68.5 269.2L70.2 269.0L70.9 266.9L73.3 266.2L70.3 263.1L72.3 263.1L71.9 258.3L78.6 259.3L80.0 262.3L81.9 260.9L84.9 261.5L89.7 258.3L89.9 257.2L85.9 254.7L89.2 252.8L92.1 248.7L98.1 248.5L98.9 251.4L101.3 247.8L104.0 249.6L96.8 256.4L94.7 256.8ZM89.8 250.5L88.9 251.1L88.8 249.3ZM62.6 304.5L61.3 303.9L62.8 303.4ZM70.1 261.8L69.4 263.4L68.9 262.3L69.3 261.3Z","DK":"M314.9 269.9L314.3 271.5L310.4 269.9L311.0 266.5ZM291.9 261.3L291.9 263.1L291.0 262.5L291.3 260.9ZM290.6 262.7L289.1 262.0L286.5 264.0L286.5 265.6L288.6 267.3L286.1 269.5L286.1 271.1L287.2 272.7L289.1 273.2L287.0 274.6L284.4 279.4L279.7 279.3L275.3 276.6L276.1 273.9L280.3 275.5L284.1 273.4L281.5 270.0L277.6 269.1L275.5 261.0L280.9 257.0L282.4 261.7L283.7 258.6L283.3 256.4L286.8 254.0L289.5 255.1ZM282.0 252.1L282.1 253.6L281.1 253.5ZM280.1 243.7L280.2 245.0L279.4 244.9L278.8 243.9ZM276.5 234.9L276.0 235.5L275.8 233.6ZM275.4 235.1L274.9 236.1L273.4 235.2L275.2 234.1ZM272.5 277.2L271.8 275.7L274.0 271.3ZM267.2 244.8L268.3 244.9L269.7 247.4L273.1 247.6L273.9 250.0L272.1 253.2L270.2 254.0L269.5 251.7L268.1 253.2L267.5 258.2L265.2 258.8L265.3 261.0L262.3 261.1L263.3 263.0L261.7 266.1L262.5 268.7L261.2 270.0L261.2 272.3L263.6 271.9L265.8 274.9L261.4 274.8L258.6 276.1L252.3 274.4L252.6 266.7L251.4 265.3L250.4 266.7L249.2 263.3L248.5 264.1L247.4 263.4L248.4 258.9L249.9 257.1L248.0 253.3L248.1 247.4L248.8 245.1L253.1 248.1L256.3 242.4L257.3 245.9L259.2 245.0L257.3 239.5L255.8 239.9L253.6 244.5L250.5 244.5L249.6 242.3L252.5 237.8L259.9 236.6L265.0 230.0L269.5 228.2L270.2 234.8ZM269.3 263.1L270.7 265.3L271.8 263.7L273.1 270.0L271.6 273.8L266.7 272.0L266.6 270.0L264.4 268.8L263.2 264.2ZM271.4 259.8L270.4 258.9L271.2 257.9ZM271.1 257.1L270.2 257.7L270.8 255.6ZM269.9 274.9L269.4 276.1L268.3 274.7ZM251.7 271.5L250.6 271.1L250.9 269.5L252.0 269.6ZM252.4 246.1L251.1 244.9L252.4 244.5Z","SE":"M362.7 82.4L356.1 85.1L353.5 84.0L353.4 85.5L350.8 84.7L350.4 90.6L349.0 90.8L348.9 94.3L347.4 93.7L345.2 102.8L348.6 109.1L343.9 120.9L340.2 123.1L338.3 126.5L336.8 125.7L336.6 127.1L335.2 126.8L333.6 131.3L331.6 130.7L327.8 142.1L323.8 146.9L324.8 149.1L323.8 155.3L325.1 158.3L323.3 158.2L322.4 160.7L326.1 175.3L328.8 176.8L331.1 175.4L334.5 179.3L335.3 177.3L337.0 179.8L336.6 182.6L338.5 181.4L342.5 188.8L340.2 190.4L340.5 195.6L341.5 193.8L341.9 195.2L339.0 201.0L336.7 200.8L333.7 205.0L331.0 203.4L330.7 206.6L328.3 207.6L328.5 209.1L324.4 209.5L326.0 211.1L327.3 215.8L324.7 220.1L326.0 221.0L326.1 227.9L324.4 233.7L325.1 235.0L324.0 242.2L321.5 250.1L319.6 253.0L317.8 251.1L315.4 252.3L309.9 252.5L309.3 254.7L308.0 253.9L305.3 257.9L306.4 262.5L305.4 264.9L297.3 266.4L294.2 265.6L293.2 263.4L293.9 260.6L289.2 252.1L291.3 251.7L290.6 248.8L292.3 248.2L292.2 245.4L287.2 240.4L284.4 232.4L282.9 233.0L282.8 229.9L282.1 229.0L281.3 229.9L281.0 227.2L279.6 227.2L280.2 225.0L276.3 216.1L275.2 206.5L276.5 204.7L278.3 207.8L279.6 207.4L281.1 201.9L280.1 196.3L281.6 194.3L281.0 191.8L284.0 190.5L286.2 187.3L286.9 180.7L284.0 172.5L287.2 171.3L288.4 166.1L282.6 160.3L283.5 151.2L281.4 145.4L282.2 138.9L280.7 134.3L281.7 129.0L285.3 122.6L289.0 120.5L294.9 121.2L295.8 118.4L295.2 114.5L292.2 111.7L297.2 99.8L297.4 91.3L296.3 86.1L299.8 85.5L302.7 83.1L301.9 79.8L307.4 69.9L305.1 63.3L307.1 61.2L308.3 55.7L311.4 51.8L315.5 53.4L316.5 50.3L315.8 44.2L317.6 43.4L327.4 45.3L328.4 38.0L327.2 34.5L329.1 33.5L340.1 41.4L346.7 43.3L347.9 45.6L351.3 48.0L351.9 56.2L354.1 56.8L353.9 60.8L357.7 66.0L357.7 75.4ZM354.4 89.8L352.7 89.4L352.9 87.8ZM347.1 218.5L344.2 223.8L344.4 226.4L345.7 227.5L340.6 236.6L338.5 226.6L342.9 219.6ZM337.6 203.4L336.3 203.1L337.2 202.0ZM326.0 249.0L325.3 250.0L324.5 245.0L329.4 230.6ZM293.1 266.2L292.0 265.6L292.9 264.5Z"};
const MAP_CENT = {"ES":[92.5,501.8],"FR":[178.7,409.5],"PT":[34.6,501.8],"IT":[293.6,465.0],"SI":[321.5,419.6],"AT":[312.1,395.6],"LU":[223.2,359.3],"CZ":[323.2,358.9],"MT":[326.1,589.9],"CY":[582.1,557.3],"EL":[428.7,519.4],"BG":[452.1,458.6],"HR":[341.3,435.0],"RO":[439.5,408.6],"HU":[372.4,397.2],"SK":[370.0,371.5],"PL":[362.2,315.1],"LT":[397.3,254.6],"LV":[401.4,227.6],"EE":[402.5,196.1],"FI":[382.7,105.0],"BE":[208.8,343.9],"DE":[269.4,339.1],"NL":[220.4,317.3],"IE":[85.1,281.0],"DK":[259.5,252.7],"SE":[314.2,146.9]};
// Land borders derived from shared geometry + maritime links (IE–FR, MT–IT, CY–EL, DK–SE, EE–FI).
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

function EUMap({ gs, sel, setSel }) {
  const [hov, setHov] = useState(null);
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
  const focus    = sel || hov;

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
        <text x={tx+8} y={ty+15} fontSize={11} fill={P.text} fontFamily="Montserrat,sans-serif" fontWeight={700}>{name}</text>
        <FAGlyph name={isH?"star":isA?"diamond":"circle-outline"} x={tx+8} y={ty+20.5} size={9} color={isH||isF?P.gold:isA?sc:P.muted}/>
        <text x={tx+21} y={ty+29} fontSize={10} fill={isH||isF?P.goldText:isA?darkHex(sc):P.muted} fontFamily="DM Mono,monospace">{isH?"HOME COUNTRY":isF?"FULL NATIONAL COVERAGE":isA?"ACTIVE":"UNEXPLORED"}</text>
        {isA && <text x={tx+8} y={ty+42} fontSize={9} fill={P.muted} fontFamily="DM Mono,monospace">{rCnt} region{rCnt!==1?"s":""} active</text>}
        <text x={tx+8} y={isA?ty+53:ty+41} fontSize={9} fill={P.muted} fontFamily="DM Mono,monospace">{(EU_COUNTRIES[name]||[]).length} regions available</text>
        {rivHere.map((rv, k) => (
          <text key={`rt-${rv.id}`} x={tx+20} y={(isA?ty+65:ty+53)+k*11} fontSize={9} fill={rv.color} fontFamily="DM Mono,monospace">{rv.name} · {STAGES[rv.stage]?.name}</text>
        ))}
        {sel && (
          <g pointerEvents="auto" style={{cursor:"pointer"}} onClick={(e) => { e.stopPropagation(); setSel && setSel(null); }}>
            <circle cx={tx+tw-11} cy={ty+11} r={8} fill={P.card} stroke={P.border} strokeWidth={1}/>
            <text x={tx+tw-11} y={ty+14.5} textAnchor="middle" fontSize={11} fill={P.muted} fontFamily="DM Mono,monospace">×</text>
          </g>
        )}
      </g>
    );
  }

  const coverageLabel = `Map of Europe. Your cluster is active in ${(gs.regions||[]).length} region${(gs.regions||[]).length===1?"":"s"} across ${(gs.countries||[]).length} countr${(gs.countries||[]).length===1?"y":"ies"}. ${(gs.rivals||[]).length} rival${(gs.rivals||[]).length===1?"":"s"} on the board.`;
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label={coverageLabel} style={{width:"100%",height:"100%",display:"block"}} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {/* Clicking open water / background closes a pinned tooltip. The sea + dot texture
          now lives on the map panel (see .map-sea) so it fills the whole window rather
          than a letterboxed square. */}
      <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="transparent" onClick={() => setSel && setSel(null)}/>

      {/* NUTS-2 basemap: every region is a real border polygon. Active regions fill with the sector colour. */}
      <g stroke="#B9C6E2" strokeWidth={0.4} strokeLinejoin="round" pointerEvents="none">
        {Object.entries(NUTS2_PATHS).map(([k, d]) => {
          const isHome = homeNuts && nutsMatch(k, homeNuts);
          const active = isHome || codes.some(c => nutsMatch(k, c));
          const iso    = nutsToIso(k.slice(0,2));
          const full   = fullSet.has(iso);
          const fill   = isHome ? `${P.gold}B0` : active ? (full ? `${sc}A8` : `${sc}66`) : (THEME_DARK ? "#22304F" : "#E9EEF8");
          const pop    = popCode && nutsMatch(k, popCode);
          return <path key={k} d={d} fill={fill}
            className={pop ? "map-new" : isHome ? "map-home" : undefined}
            style={pop || isHome ? {color: isHome ? P.gold : sc, stroke: isHome ? P.gold : "none"} : undefined}/>;
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
            <text x={p.x} y={p.y+2.6} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={darkHex(p.col,0.7)} fontFamily="DM Mono,monospace">{p.label}</text>
          </g>
        ));
      })()}

      {/* Focus outline */}
      {focus && NUTS0_PATHS[isoToNuts(focus)] && (
        <path d={NUTS0_PATHS[isoToNuts(focus)]} fill="none" stroke={P.accent} strokeWidth={2} strokeLinejoin="round" pointerEvents="none"/>
      )}

      {/* Labels on active countries */}
      {NUTS0_KEYS.filter(k => activeSet.has(nutsToIso(k))).map(k => {
        const iso = nutsToIso(k); const c = MAP_CENT[k]; if (!c) return null;
        return <text key={`lbl-${k}`} x={c[0]} y={c[1]-10} textAnchor="middle" fontSize={iso===homeISO?9.5:8} fontFamily="DM Mono,monospace" fontWeight="700" fill={iso===homeISO||fullSet.has(iso)?P.goldText:darkHex(sc)} pointerEvents="none" style={{userSelect:"none"}} stroke="#FFFFFF" strokeWidth={2} paintOrder="stroke">{iso}</text>;
      })}

      {/* Hit areas: the country shapes themselves */}
      {NUTS0_KEYS.map(k => {
        const iso = nutsToIso(k);
        return <path key={`hit-${k}`} d={NUTS0_PATHS[k]} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHov(iso)} onMouseLeave={()=>setHov(null)}
          onClick={()=>setSel && setSel(sel===iso?null:iso)}/>;
      })}

      {/* Enlarged tap targets: these countries' polygons are below comfortable touch size */}
      {["MT","LU","CY","SI","BE","EE","SK"].map(k => {
        const c = MAP_CENT[k]; if (!c) return null;
        const iso = nutsToIso(k);
        return <circle key={`hitc-${k}`} cx={c[0]} cy={c[1]} r={14} fill="transparent" style={{cursor:"pointer"}}
          onMouseEnter={()=>setHov(iso)} onMouseLeave={()=>setHov(null)}
          onClick={()=>setSel && setSel(sel===iso?null:iso)}/>;
      })}

      {tip}

      {/* Rival legend */}
      {rivals.map((rv, ri) => (
        <g key={`leg-${rv.id}`} pointerEvents="none">
          <rect x={6} y={7+ri*12} width={5.5} height={5.5} rx={1.2} fill={rv.color}/>
          <text x={15} y={12.5+ri*12} fontSize={9} fill={rv.stage>(gs?.stage||0)?rv.color:P.muted} fontFamily="DM Mono,monospace">{rv.name} · {STAGES[rv.stage]?.name}</text>
        </g>
      ))}

      {/* Watermark */}
      <text x={MAP_W-6} y={MAP_H-6} textAnchor="end" fontSize={10} fill={P.muted} fontFamily="DM Mono,monospace" opacity={0.5}>{STAGES[gs?.stage||0]?.name} · Quarter {gs?.quarter||1} {gs?.year||2024} · {diffOf(gs).label}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════ */
const Lbl = ({ t }) => (
  <div style={{fontSize:11,color:P.muted,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{t}</div>
);

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
    <div style={{fontSize:10.5,lineHeight:1.5,maxWidth:280,margin:"0 auto"}}>{hint}</div>
  </div>
);
const ProgressRing = ({ pct, color, size=30, stroke=3.5, label }) => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0,transform:"rotate(-90deg)"}} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={P.bright} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{transition:"stroke-dashoffset .65s cubic-bezier(.22,1,.36,1)"}}/>
      {label != null && <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fontSize={8.5} fontWeight={700} fill={darkHex(color,0.65)} fontFamily="DM Mono,monospace" transform={`rotate(90 ${size/2} ${size/2})`}>{label}</text>}
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
        <span key={it.id} className="float-delta" style={{position:"relative",color:it.good?P.greenText:P.redText,animationDelay:`${i*0.12}s`,background:THEME_DARK?"rgba(11,18,32,.82)":"rgba(255,255,255,.82)",padding:"2px 10px",borderRadius:20,border:`1px solid ${it.good?P.green:P.red}44`}}>{it.label}</span>
      ))}
    </div>
  );
}

const Bar = ({ val, max=100, color, h=4 }) => (
  <div style={{height:h,background:P.bright,borderRadius:h,overflow:"hidden",marginTop:3}}>
    <div className="bar-fill" style={{width:`${Math.min(100,Math.max(0,(val/max)*100))}%`,height:"100%",background:color,borderRadius:h}}/>
  </div>
);

const MiniStat = ({ l, v, c=P.text }) => (
  <div style={{background:P.card,borderRadius:6,padding:"7px 10px",border:`1px solid ${P.border}`}}>
    <div style={{fontSize:10,color:P.muted,marginBottom:3,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:0.3}}>{l}</div>
    <div style={{fontSize:16,fontWeight:700,color:c,fontFamily:"'DM Mono',monospace"}}>{v}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   LEFT PANEL
═══════════════════════════════════════════════════════════ */
// Tap-or-hover popover: makes the hover-only tooltips reachable on touch screens
function InfoDot({ text, label, children, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);
  if (!text) return children || null;
  return (
    <span ref={ref} style={{position:"relative",display:"inline-flex",alignItems:"center",...style}}>
      {children}
      <button className="btn" aria-label={label||"More information"} aria-expanded={open}
        onClick={e => { e.stopPropagation(); setOpen(o=>!o); }}
        onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}
        style={{marginLeft:4,width:14,height:14,minWidth:14,borderRadius:"50%",border:`1px solid ${P.border}`,background:P.card,color:P.muted,fontSize:9,fontWeight:700,lineHeight:1,padding:0,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"help",flexShrink:0}}>i</button>
      {open && (
        <span role="tooltip" style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",zIndex:400,width:"max-content",maxWidth:230,padding:"8px 10px",borderRadius:6,background:THEME_DARK?"#0b1220":"#1B2740",color:"#fff",fontSize:10.5,lineHeight:1.5,fontWeight:400,whiteSpace:"pre-wrap",boxShadow:"0 6px 22px rgba(0,0,0,.35)",fontFamily:"'Open Sans',sans-serif",textAlign:"left",pointerEvents:"none"}}>{text}</span>
      )}
    </span>
  );
}

const Trend = ({ t }) => !t ? null : (
  <span style={{fontSize:10,fontWeight:700,fontFamily:"'DM Mono',monospace",color:t.delta>0.05?P.greenText:t.delta<-0.05?P.redText:P.muted}}>
    {t.delta>0.05?"▲":t.delta<-0.05?"▼":"■"} {t.delta>=0?"+":""}{Math.round(t.delta*10)/10}/Q
  </span>
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
  const burnRate = (gs.qStaff||0) + (gs.qOverhead||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
  const runway   = burnRate > 0 ? Math.round((gs.budget||0) / Math.max(1,burnRate)) : 99;
  const failRate = failPct(gs);
  const decay    = [2,3,4,5,6,8][gs.stage] ?? 2;

  return (
    <div style={{width:215,flexShrink:0,display:"flex",flexDirection:"column",gap:7,padding:"10px 8px 10px 10px",overflowY:"auto",background:P.panel,borderRight:`1px solid ${P.border}`}}>
      {/* Sector + Stage */}
      <div style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${stage.color}44`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <Icon name={gs.sector?.icon||"display"} size={20} color={gs.sector?.color||P.text}/>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:gs.sector?.color||P.text,lineHeight:1.1}}>{gs.sector?.name||""}{(gs.stage||0)>=2 && <span title="As a national body your cluster spans every industrial ecosystem" style={{marginLeft:6,fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:3,border:`1px solid ${P.gold}66`,background:`${P.gold}14`,color:P.goldText,letterSpacing:.4,fontFamily:"'DM Mono',monospace",verticalAlign:"middle"}}>CROSS-ECOSYSTEM</span>}</div>
            <div style={{fontSize:9,color:P.muted}}>{gs.region||""}{gs.regionNuts?` · ${gs.regionNuts}`:""}</div>
            <div style={{fontSize:10,color:P.muted,marginTop:1}}>Regional Innovation Scoreboard: {gs.regionRis||"not rated"} · {gs.s3Aligned?<span style={{color:P.green,display:"inline-flex",alignItems:"center",gap:3}}><Icon name="bullseye" size={9} color={P.green}/> Smart Specialisation aligned</span>:<span style={{color:P.orange}}>outside Smart Specialisation</span>}</div>
          </div>
        </div>
        <div style={{padding:"4px 8px",borderRadius:4,background:`${stage.color}18`,border:`1px solid ${stage.color}33`,display:"inline-flex",alignItems:"center",gap:5}}>
          <span style={{width:5,height:5,borderRadius:"50%",background:stage.color,display:"inline-block"}}/>
          <span style={{fontSize:9,fontWeight:700,color:stage.color,letterSpacing:.5}}>{stage.name}</span>
        </div>
      </div>

      {/* Budget */}
      <div className={pBudget} style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
        <Lbl t="Treasury"/>
        <div style={{fontSize:22,fontWeight:700,color:(gs.budget||0)<20000?P.red:P.accent,fontFamily:"'DM Mono',monospace"}}>{fmt(Math.round(tBudget))}</div>
        <div style={{fontSize:9,color:P.muted,marginTop:3}}>
          <span style={{color:(gs.qNet||0)>=0?P.accent:P.red}}>{(gs.qNet||0)>=0?"+":""}{fmt(gs.qNet||0)}/quarter</span>
          {" · "}runway: <span style={{color:runway<3?P.red:runway<6?P.orange:P.green}}>{runway>=99?"∞":`${runway}Q`}</span>
          {(gs.rivals||[]).filter(r=>r.stage>gs.stage).length>0 && (
            <span style={{color:P.red}}>{" · "}rival pressure -{Math.min(3,(gs.rivals||[]).filter(r=>r.stage>gs.stage).length)*6}% income</span>
          )}
        </div>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:9,fontFamily:"'DM Mono',monospace"}}>
          <div style={{color:P.accent}}>+{fmt(gs.qMember||0)}<div style={{color:P.muted}}>members</div></div>
          <div style={{color:(gs.qProj||0)>0?P.blue:P.muted}}>+{fmt(gs.qProj||0)}<div style={{color:P.muted}}>projects</div></div>
          <div style={{color:P.red}}>-{fmt(gs.qStaff||0)}<div style={{color:P.muted}}>staff</div></div>
          <div style={{color:P.orange}}>-{fmt(gs.qOverhead||0)}<div style={{color:P.muted}}>overhead</div></div>
          {(gs.qDelivery||0) > 0 && <div style={{color:P.purple,gridColumn:"1 / -1"}}>-{fmt(gs.qDelivery||0)}<div style={{color:P.muted}}>delivery costs ({fmt(gs.qInterim||0)} covered by interim payments)</div></div>}
        </div>
      </div>

      {/* Members */}
      <div className={pMembers} style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
        <div style={{display:"flex",alignItems:"center"}}><Lbl t="Members"/><InfoDot label="Members trend" text={trendTitle(trends?.members, "Plus rival poaching, defections and event effects.")}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:22,fontWeight:700,color:P.gold,fontFamily:"'DM Mono',monospace"}}>{Math.round(tMembers)}</span>
          <Trend t={trends?.members}/>
        </div>
        <div style={{fontSize:9,color:P.muted}}>fee {fmt(memberFee(gs.stage))}/quarter · mix ×{(Math.round(feeMult(gs)*100)/100).toFixed(2)}</div>
        {(() => { const mx = mixOf(gs), m = Math.max(1, gs.members||1); return (
          <div style={{marginTop:6}} title={`Member composition\nSMEs ${mx.sme} (fee ×0.8, volatile)\nCorporates ${mx.corp} (fee ×2.1, board +1 at 35%+)\nResearch ${mx.res} (fee ×0.5, research margins +2pp at 20%+)`}>
            <div style={{display:"flex",height:5,borderRadius:3,overflow:"hidden",border:`1px solid ${P.border}`}}>
              <div style={{width:`${Math.round(mx.sme/m*100)}%`,background:P.accent}}/>
              <div style={{width:`${Math.round(mx.corp/m*100)}%`,background:P.gold}}/>
              <div style={{flex:1,background:P.purple}}/>
            </div>
            <div style={{fontSize:8.5,color:P.muted,marginTop:2,fontFamily:"'DM Mono',monospace"}}>SME {Math.round(mx.sme/m*100)}% · corp {Math.round(mx.corp/m*100)}% · research {Math.round(mx.res/m*100)}%</div>
            <div style={{display:"flex",gap:3,marginTop:5,flexWrap:"wrap"}}>
              {Object.entries(MIX_FOCUS).map(([fid, fo]) => (
                <button key={fid} className="btn" title={`Recruitment focus: ${fo.label} — new members join ${Math.round(fo.sme*100)}% SME / ${Math.round(fo.corp*100)}% corporate / ${Math.round(fo.res*100)}% research`}
                  onClick={() => dispatch({type:"setFocus", focus:fid})}
                  style={{padding:"2px 7px",borderRadius:4,fontSize:8.5,fontFamily:"'DM Mono',monospace",border:`1px solid ${(gs.focus||"balanced")===fid?P.accent:P.border}`,background:(gs.focus||"balanced")===fid?`${P.accent}18`:"transparent",color:(gs.focus||"balanced")===fid?P.accent:P.muted}}>
                  {fo.label}
                </button>
              ))}
            </div>
          </div>
        ); })()}
        <div style={{marginTop:6}}>
          <div style={{display:"flex",height:5,borderRadius:3,overflow:"hidden",border:`1px solid ${P.border}`}}>
            <div style={{width:`${Math.min(100,Math.round(((gs.members||0)/Math.max(1,marketPool(gs)))*100))}%`,background:gs.sector?.color||P.accent}}/>
            <div style={{width:`${Math.min(100,Math.round((rivalPressure(gs)/Math.max(1,marketPool(gs)))*100))}%`,background:P.red,opacity:.6}}/>
            <div style={{flex:1,background:P.bg}}/>
          </div>
          <div style={{fontSize:8.5,color:P.muted,marginTop:2,fontFamily:"'DM Mono',monospace"}}>market {Math.round(marketShare(gs)*100)}% claimed (you + rivals)</div>
        </div>
      </div>

      {/* Influence + Political Integration */}
      <div className={pInfl} style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
        <div style={{display:"flex",alignItems:"center"}}><Lbl t="Influence"/><InfoDot label="Influence trend" text={trendTitle(trends?.influence, "Plus one-off effects: project deliveries, events, coups.")}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:20,fontWeight:700,color:P.purple,fontFamily:"'DM Mono',monospace"}}>{Math.round(tInfl)}</span>
          <span style={{display:"inline-flex",alignItems:"baseline",gap:8}}><Trend t={trends?.influence}/><span style={{fontSize:9,color:P.muted}}>/ 100</span></span>
        </div>
        <Bar val={gs.prestige||0} color={P.purple}/>
        <div style={{fontSize:9,color:P.muted,marginTop:4}}>political standing with public authorities · fades -{decay}/quarter at stage {gs.stage}</div>
        <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${P.border}`}}>
          <div style={{fontSize:8,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:5}}>Political Integration</div>
          <div style={{display:"flex",gap:4}}>
            {seatStatus(gs).map(st => {
              const rvColor = st.heldBy ? ((gs.rivals||[]).find(r=>r.id===st.heldBy)?.color || P.red) : null;
              return (
                <span key={st.id} title={st.held?`${st.label} · ${st.effects}`:st.heldBy?`${st.label} · chaired by ${st.holderName} — needs: ${st.reqs.filter(r=>!r.ok).map(r=>r.l).join(", ")||"displacement next quarter"}`:`${st.label} · needs: ${st.reqs.filter(r=>!r.ok).map(r=>r.l).join(", ")||"granted next quarter"}`}
                  style={{flex:1,textAlign:"center",fontSize:8.5,fontWeight:700,padding:"3px 0",borderRadius:3,letterSpacing:.4,fontFamily:"'DM Mono',monospace",
                    border:`1px solid ${st.held?P.gold:rvColor||P.border}`,background:st.held?`${P.gold}18`:rvColor?`${rvColor}14`:"transparent",color:st.held?P.goldText:rvColor||P.muted}}>
                  {st.short}
                </span>
              );
            })}
          </div>
          {seatsHeld(gs)===0 && <div style={{fontSize:8.5,color:P.muted,marginTop:4,lineHeight:1.4}}>earn seats in policy bodies for lasting advantages · see Statistics</div>}
        </div>
      </div>

      {/* Board Confidence */}
      <div className={pBoard} style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${(gs.boardConf||0)<30?`${P.red}55`:P.border}`}}>
        <div style={{display:"flex",alignItems:"center"}}><Lbl t="Board Confidence"/><InfoDot label="Board confidence trend" text={trendTitle(trends?.board, "Plus one-off effects: project completions +3, failures −8..−15, events.")}/></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <span style={{fontSize:20,fontWeight:700,color:(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green,fontFamily:"'DM Mono',monospace"}}>{Math.round(tBoard)}</span>
          <span style={{display:"inline-flex",alignItems:"baseline",gap:8}}><Trend t={trends?.board}/><span style={{fontSize:9,color:P.muted}}>/ 100</span></span>
        </div>
        <Bar val={gs.boardConf||0} color={(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green}/>
        {(gs.boardConf||0)<30 && <div style={{display:"flex",alignItems:"center",gap:5,fontSize:9,color:P.red,marginTop:4}}><Icon name="triangle-exclamation" size={9} color={P.red}/>Crisis: +3% extra churn</div>}
      </div>

      {/* Staff summary */}
      <div style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
        <Lbl t="Staff"/>
        <div style={{fontSize:18,fontWeight:700,color:P.text,fontFamily:"'DM Mono',monospace"}}>{staffTotal(gs.roster)}</div>
        <div style={{fontSize:9,color:P.muted}}>cost {fmt(staffCostQ(gs.roster, gs.turn))}/quarter · salaries +1%/Q</div>
        <div style={{fontSize:9,color:P.muted,marginTop:2}}>fail risk: <span style={{color:failRate>25?P.red:failRate>15?P.orange:P.green}}>{failRate}%</span></div>
      </div>

      {/* Evolution requirements */}
      {gs.stage < 5 && (
        <div style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
          <Lbl t={<><Icon name="arrow-right" size={10} color={P.muted} style={{marginRight:5}}/>{STAGES[Math.min(5,gs.stage+1)]?.name||""}</>}/>
          {reqs.map((r,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:"'DM Mono',monospace",lineHeight:1.9,color:r.ok?P.green:P.muted}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4}}>{r.ok?<Icon name="check" size={9} color={P.green}/>:<Icon name="circle" size={4} color={P.muted}/>} {r.l}</span>
              <span>{r.money?fmt(r.cur):r.cur}/{r.money?fmt(r.req):r.req}</span>
            </div>
          ))}
          <div style={{marginTop:4,fontSize:9,color:P.muted}}>Cost: <span style={{color:P.red}}>{fmt(evolveCost(gs.stage))}</span></div>
        </div>
      )}

      {/* Network */}
      <div style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
        <Lbl t="Network"/>
        <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:P.blue}}>{(gs.countries||[]).length} countr{(gs.countries||[]).length===1?"y":"ies"}</div>
        <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:P.teal}}>{(gs.regions||[]).length} region{(gs.regions||[]).length!==1?"s":""}</div>
        <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:P.muted,marginTop:2}}>{(gs.completedProjects||[]).length} projects done</div>
        {(gs.fullCountries||[]).length > 0 && <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:P.goldText,marginTop:2}}>{(gs.fullCountries||[]).length} countr{(gs.fullCountries||[]).length===1?"y":"ies"} fully covered</div>}
      </div>

      {/* Director governance panel */}
      {byRole(gs.roster,"director") > 0 && (
        <div style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.accent}44`}}>
          <Lbl t={<><Icon name="award" size={11} color={P.text} style={{marginRight:5}}/>Governance · {byRole(gs.roster,"director")} Director{byRole(gs.roster,"director")>1?"s":""}</>}/>
          <div style={{fontSize:10,color:P.text,lineHeight:1.7}}>
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
        <div style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.border}`}}>
          <Lbl t={<><Icon name="chess-knight" size={11} color={P.text} style={{marginRight:5}}/>Rival Race · first to Pan-European Cluster Network</>}/>
          {(gs.rivals||[]).map(rv => (
            <div key={rv.id} style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:"'DM Mono',monospace"}}>
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
function RightPanel({ gs, compact }) {
  if (!gs) return null;
  const logColors = { project:P.blue, good:P.green, bad:P.red };
  const active = gs.activeProjects || [];
  const log    = gs.log || [];

  return (
    <div style={{width:compact?"auto":230,height:compact?212:"auto",flexShrink:0,display:"flex",flexDirection:"column",background:P.panel,borderLeft:compact?"none":`1px solid ${P.border}`,borderTop:compact?`1px solid ${P.border}`:"none",overflow:"hidden"}}>
      {/* Active projects */}
      <div style={{padding:compact?"8px 10px 6px":"10px 10px 8px",borderBottom:`1px solid ${P.border}`,flexShrink:0,maxHeight:compact?96:"none",overflowY:compact?"auto":"visible"}}>
        <Lbl t={`Active Projects (${active.length})`}/>
        {active.length===0 && <div style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>No active projects</div>}
        {active.map((p, i) => {
          if (!p) return null;
          const prog = Math.min(1, 1 - ((p.endTurn||0)-(gs.turn||0)) / Math.max(1,p.dur||1));
          const st = projectStatus(p, gs);
          return (
            <div key={`ap-${i}`} style={{marginBottom:8,padding:"7px 8px",background:P.card,borderRadius:6,border:`1px solid ${P.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:4}}>
                <div style={{fontSize:10,fontWeight:700,lineHeight:1.3}}>{p.name||""}</div>
                <span style={{flexShrink:0,fontSize:9,fontWeight:600,color:st.color,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}><Icon name="circle" size={7} color={st.color}/> {st.label}</span>
              </div>
              <div style={{height:2.5,background:P.bright,borderRadius:2}}>
                <div style={{width:`${prog*100}%`,height:"100%",background:st.color,borderRadius:2,transition:"width .4s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>
                <span style={{color:st.color}}>{Math.max(0,(p.endTurn||0)-(gs.turn||0))}Q left</span>
                <span>{fmt(projBudget(p,p.partners||0))}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event log */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        <Lbl t="Event Log"/>
        {log.slice(0,40).map((e, i) => (
          <div key={`log-${i}-${(e?.txt||"").slice(0,18)}`} className={i===0?"log-in":undefined} style={{fontSize:10,lineHeight:1.5,marginBottom:5,paddingBottom:5,borderBottom:`1px solid ${P.border}11`,color:logColors[e?.t]||P.text,display:"flex",gap:5,alignItems:"flex-start"}}>
            <Icon name={LOG_ICON[e?.t]||"circle-info"} size={10} color={logColors[e?.t]||P.muted} style={{marginTop:2}}/>
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
      <div className="modal-in" style={{background:P.panel,borderRadius:phone?0:12,maxWidth:phone?"100%":width,width:"100%",border:phone?"none":`1px solid ${P.border}`,maxHeight:phone?"100%":"92vh",height:phone?"100%":"auto",display:"flex",flexDirection:"column",boxShadow:phone?"none":"0 18px 50px rgba(8,20,50,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:phone?"16px 16px":"13px 18px",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:9,fontWeight:700,fontSize:phone?18:15,color:P.text}}>
            {icon && <Icon name={icon} size={phone?17:15} color={iconColor||P.accent}/>}
            {title}
          </div>
          <button className="btn" onClick={onClose} style={{background:phone?P.card:"none",border:`1px solid ${P.border}`,color:P.text,borderRadius:6,padding:phone?"7px 12px":"5px 9px",display:"flex",alignItems:"center"}}><Icon name="xmark" size={phone?14:12}/></button>
        </div>
        <div style={{padding:"16px 18px",overflowY:"auto",flex:1}}>{children}</div>
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
  const burn    = (gs.qStaff||0) + (gs.qOverhead||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
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
    <div style={{background:P.card,borderRadius:8,padding:14,border:`1px solid ${cc}33`}}>
      {/* required specialist for this category */}
      <div style={{display:"flex",gap:5,marginBottom:7,flexWrap:"wrap",alignItems:"center"}}>
        {[
          {t:p.cat.toUpperCase(), c:cc},
          {t:p.fund.toUpperCase(), c:fc},
          {t:`${p.dur}Q`, c:P.muted},
          {t:`${p.sr}+ staff`, c:P.muted},
          {t:`${shownFail}% fail`, c:shownFail>25?P.red:shownFail>15?P.orange:P.green},
          ...(contest.rivals.length>0 ? [{t:`CONTESTED by ${contest.rivals.map(r=>r.name.split(" ")[0]).join(", ")}`, c:P.red}] : []),
          {t:`MARGIN ≈${Math.round(margin*100)}%`, c:P.green},
        ].map((x,i) => (
          <span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:3,border:`1px solid ${x.c}44`,background:`${x.c}14`,color:x.c,fontFamily:"'DM Mono',monospace"}}>{x.t}</span>
        ))}
        {reqDef && (
          <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,padding:"2px 7px",borderRadius:3,border:`1px solid ${cc}44`,background:`${cc}14`,color:cc,fontFamily:"'DM Mono',monospace"}}>
            <Icon name={reqDef.icon} size={9} color={cc}/> needs {reqDef.name}
          </span>
        )}
      </div>
      <div style={{fontWeight:700,fontSize:15,marginBottom:3,color:P.text}}>{p.name}</div>
      <div style={{fontSize:11,color:P.muted,marginBottom:8,lineHeight:1.5}}>{p.desc}</div>
      {conds.length > 0 && (
        <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
          {conds.map((c,i) => (
            <span key={i} style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,padding:"2px 7px",borderRadius:3,border:`1px solid ${(c.ok?P.green:P.red)}55`,background:`${c.ok?P.green:P.red}10`,color:c.ok?P.greenText:P.redText,fontFamily:"'DM Mono',monospace"}}>
              <Icon name={c.ok?"check":"xmark"} size={9} color={c.ok?P.greenText:P.redText}/>{c.l}
            </span>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:12,fontSize:10,color:P.muted,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>
        <span>minimum {p.mem} members</span>
        {(p.part||0)>0 && <span>{partners} partners</span>}
        <span>+{p.pres} influence</span>
        <span>+{p.mg} members</span>
      </div>
      {(p.part||0) > 0 && (
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <span style={{fontSize:10,color:P.muted,whiteSpace:"nowrap"}}>Partners: {partners}</span>
          <input type="range" min={p.part} max={(p.part||0)+10} value={partners} onChange={e => setPartners(Number(e.target.value))}/>
          <span style={{fontSize:14,fontWeight:700,color:P.accent,fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmt(budget)} <span style={{fontSize:9,color:P.muted,fontWeight:400}}>volume</span></span>
        </div>
      )}
      {(p.part||0)===0 && <div style={{fontSize:14,fontWeight:700,color:P.accent,fontFamily:"'DM Mono',monospace",marginBottom:6}}>{fmt(budget)} <span style={{fontSize:9,color:P.muted,fontWeight:400}}>volume</span></div>}
      <div style={{fontSize:10,color:P.muted,marginBottom:10,fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
        Delivery costs <span style={{color:P.redText}}>{fmt(spendQ)}/Q for {p.dur}Q</span>, of which interim payments reimburse {Math.round(INTERIM_RATE*100)}% as you go · success pays the balance plus <span style={{color:P.greenText}}>≈{fmt(expGain)} margin</span> · failure is audited down to {Math.round(FAIL_RECOVERY*100)}% of costs (clawback)
      </div>
      <button className="btn" disabled={gs && (gs.budget||0) < need} onClick={() => onStart(p, partners)} style={{padding:"6px 14px",borderRadius:6,border:"none",background:cc,color:"#fff",fontWeight:700,fontSize:12,fontFamily:"'Montserrat',sans-serif"}}>Launch · invest {fmt(spendQ)}/Q <Icon name="arrow-right" size={11} color="#fff" style={{marginLeft:5}}/></button>
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
      <div style={{fontSize:11,color:P.muted,marginBottom:14,display:"flex",gap:16,flexWrap:"wrap"}}>
        <span>Failure risk: <strong style={{color:failRate>25?P.red:failRate>15?P.orange:P.green}}>{failRate}%</strong></span>
        <span>PM -12%/hire · Legal -8%/hire · risk rises with stage & network size</span>
        <span style={{color:atCap?P.orange:P.muted}}>capacity {(gs.activeProjects||[]).length}/{cap} · +1 per PM, max {1+(gs.stage||0)} at this stage</span>
        <span>{(gs.activeProjects||[]).length} running · {(gs.completedProjects||[]).length} completed</span>
      </div>
      {avail.length===0 && (
        <div style={{textAlign:"center",padding:32,color:P.muted}}>
          <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><Icon name="magnifying-glass" size={24} color={P.muted}/></div>
          {atCap
            ? `All ${cap} project slot${cap!==1?"s":""} in use, or recent calls are on cooldown. Hire Project Managers (up to the stage cap) and wait for new call rounds.`
            : "Each category needs a specialist on staff (research → Analyst, comms → Communications Director, training → Training Coordinator, lobbying → Lobbyist, network → General Manager) and every call has its own enabling conditions. Hire, grow influence and members, expand, or evolve to unlock projects."}
        </div>
      )}
      <div style={{display:"grid",gap:10,maxHeight:panel?"none":"52vh",overflowY:panel?"visible":"auto",paddingRight:panel?0:4}}>
        {avail.map(p => (
          <ProjCard key={p.id} p={p} gs={gs} failRate={failRate} onStart={(pp,n) => { dispatch({type:"startProject",p:pp,n}); onClose(); }}/>
        ))}
      </div>
      {locked.length > 0 && (
        <>
          <div style={{margin:"14px 0 8px",fontSize:10,color:P.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,fontFamily:"'DM Mono',monospace"}}>Calls not yet within reach · unmet enabling conditions</div>
          <div style={{display:"grid",gap:6}}>
            {locked.map(p => (
              <div key={p.id} style={{background:P.card,borderRadius:6,padding:"8px 12px",border:`1px solid ${P.border}`,opacity:.78}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,color:P.text}}>{p.name}</span>
                  <span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{p.fund.toUpperCase()} · {fmt(projBudget(p, p.part||0))}</span>
                </div>
                <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                  {projectConditions(p, gs).filter(c => !c.ok).map((c,i) => (
                    <span key={i} style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,padding:"2px 7px",borderRadius:3,border:`1px solid ${P.red}55`,background:`${P.red}10`,color:P.redText,fontFamily:"'DM Mono',monospace"}}><Icon name="xmark" size={9} color={P.redText}/>{c.l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
   STAFF MODAL · BUG FIX: action now uses roleId, not r
═══════════════════════════════════════════════════════════ */
function StaffModal({ gs, dispatch, onClose, panel }) {
  if (!gs) return null;
  const roster   = gs.roster || [];
  const train    = byRole(roster,"trainer");
  const hr       = byRole(roster,"hr");
  const failRate = failPct(gs);
  const churnPct = Math.max(1, Math.round((6 - train*0.8 - hr*1)*10)/10);
  const infl     = Math.round((salaryInfl(gs.turn)-1)*100);

  const body = (
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        <MiniStat l="Total Staff"    v={staffTotal(roster)}              c={P.purple}/>
        <MiniStat l="Quarterly Cost" v={`-${fmt(staffCostQ(roster, gs.turn))}`}  c={P.red}/>
        <MiniStat l="Churn Rate"     v={`${churnPct}%/quarter`}             c={P.blue}/>
        <MiniStat l="Fail Risk"      v={`${failRate}%`}                 c={P.orange}/>
      </div>
      <div style={{fontSize:10,color:P.muted,marginBottom:6,fontFamily:"'DM Mono',monospace"}}>Salary inflation: labour costs are up {infl}% since founding and rise +1% every quarter, for new hires and the whole payroll.</div>
      <div style={{fontSize:10,color:visibleStaff(roster)>=staffSpan(roster)?P.redText:P.muted,marginBottom:14,fontFamily:"'DM Mono',monospace"}}>Management capacity: {visibleStaff(roster)}/{staffSpan(roster)} (the GM manages 7; each Executive Director adds 7) · balance rule: max {roleCap(roster)} per role · exactly one General Manager.</div>

      {visibleStaff(roster) <= 1 && (
        <div style={{marginBottom:14}}><EmptyState icon="users" title="Just you and your General Manager" hint="Hire specialists below to unlock projects and grow: a Communications Director recruits members, a Project Manager cuts delivery risk, an Analyst runs research bids. The GM can supervise 7 people."/></div>
      )}
      {roster.length > 0 && (
        <>
          <Lbl t={`Current Team (${roster.length})`}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:6,marginBottom:16}}>
            {STAFF_ROLES.filter(def => byRole(roster, def.id) > 0).map(def => {
              const idxs = roster.map((r,i)=>({r,i})).filter(x => x.r?.role === def.id);
              const count = idxs.length;
              // Firing releases the most recent hire of that role (cheapest severance first)
              const newest = idxs.reduce((a,b) => ((b.r.hiredTurn||0) >= (a.r.hiredTurn||0) ? b : a), idxs[0]);
              const senior = ((gs.turn||0) - (newest.r.hiredTurn||0)) >= 12;
              const sev = Math.round(roleCost(def, gs.turn) * (senior ? 2 : 1));
              const seniors = idxs.filter(x => ((gs.turn||0) - (x.r.hiredTurn||0)) >= 12).length;
              return (
                <div key={`team-${def.id}`} style={{background:P.card,borderRadius:6,padding:"9px 12px",border:`1px solid ${P.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:P.text,display:"flex",alignItems:"center",gap:6}}>
                      {def.icon && <Icon name={def.icon} size={13} color={P.purple}/>} {def.name}{count>1 && <span style={{color:P.accent,fontFamily:"'DM Mono',monospace"}}>×{count}</span>}
                      {seniors>0 && <span style={{display:"inline-flex",alignItems:"center",gap:2,fontSize:9,color:P.goldText,fontFamily:"'DM Mono',monospace"}}><Icon name="star" size={9} color={P.gold}/>{seniors}</span>}
                    </div>
                    <div style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>-{fmt(roleCost(def, gs.turn)*count)}/quarter{count>1?" total":""}</div>
                    <div title={idxs.map(x => `${x.r.name||"—"} · level ${skillOf(x.r)}`).join("\n")} style={{fontSize:9,color:P.muted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:210}}>
                      {idxs.slice(0,2).map(x => `${(x.r.name||"—").split(" ")[0]} L${skillOf(x.r)}`).join(" · ")}{count>2?` · +${count-2} more`:""}
                      {idxs.some(x=>skillOf(x.r)>=4) && <Icon name="star" size={8} color={P.gold} style={{marginLeft:4}}/>}
                    </div>
                  </div>
                  {def.hidden
                    ? <span style={{fontSize:9,padding:"3px 8px",borderRadius:4,border:`1px solid ${P.border}`,color:P.muted,fontFamily:"'DM Mono',monospace"}}>mandatory</span>
                    : <button className="btn" title={count>1?"Releases the most recent hire (lowest severance)":""} onClick={() => dispatch({type:"fire",idx:newest.i})} style={{padding:"3px 9px",borderRadius:4,border:`1px solid ${P.red}44`,background:"transparent",color:P.red,fontSize:10,whiteSpace:"nowrap"}}>Fire {count>1?"one ":""}-{fmt(sev)}</button>}
                </div>
              );
            })}
          </div>
        </>
      )}

      <Lbl t="Hire Staff"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10,maxHeight:panel?"none":"40vh",overflowY:panel?"visible":"auto"}}>
        {STAFF_ROLES.filter(r => !r.hidden).map(staffRole => {
          const price   = roleCost(staffRole, gs.turn);
          const blockReason = hireBlockReason(gs, staffRole.id);
          const afford  = (gs.budget||0) >= price * 3 && !blockReason;
          const count   = byRole(roster, staffRole.id);
          // BUG FIX: capture roleId in a stable variable, dispatch uses roleId not staffRole
          const roleId  = staffRole.id;
          return (
            <div key={`hire-${roleId}`} style={{background:P.card,borderRadius:8,padding:12,border:`1px solid ${P.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div><Icon name={staffRole.icon} size={17} color={P.purple}/></div>
                {count > 0 && <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,background:`${P.purple}22`,color:P.purple,fontFamily:"'DM Mono',monospace"}}>{count}×</span>}
              </div>
              <div style={{fontWeight:700,fontSize:13,marginBottom:3,color:P.text}}>{staffRole.name}</div>
              <div style={{fontSize:10,color:P.muted,marginBottom:8,lineHeight:1.5}}>{staffRole.desc}{blockReason && <span style={{display:"block",fontSize:9,color:P.redText,marginTop:4,fontFamily:"'DM Mono',monospace"}}>{blockReason}</span>}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:P.red,fontFamily:"'DM Mono',monospace"}}>-{fmt(price)}/quarter</span>
                <button
                  className="btn"
                  disabled={!afford}
                  onClick={() => dispatch({type:"hire",roleId})}
                  style={{padding:"5px 12px",borderRadius:5,border:"none",background:afford?P.accent:P.bright,color:afford?P.card:P.muted,fontWeight:700,fontSize:11,fontFamily:"'Montserrat',sans-serif"}}
                >
                  Hire
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
      <div style={{fontSize:10,color:P.muted,marginBottom:10,lineHeight:1.5}}>Rival clusters race you to the Pan-European Cluster Network. Contain them, out-politick them, or buy them out: if every rival folds, you win by <strong style={{color:P.text}}>market consolidation</strong> — but collapsed rivals are eventually replaced by new entrants.</div>
      {(gs.coalitionUntil||0) > (gs.turn||0) && (
        <div style={{background:`${P.red}12`,border:`1.5px solid ${P.red}55`,borderRadius:6,padding:"8px 12px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
          <span className="wiggle" style={{display:"inline-flex"}}><Icon name="triangle-exclamation" size={13} color={P.red}/></span>
          <div style={{fontSize:10,color:P.redText,lineHeight:1.5}}><strong>RIVAL COALITION</strong> active for {(gs.coalitionUntil||0)-(gs.turn||0)} more quarters: their progress +10%, poaching +25%. Signing a consortium pact with any rival breaks it.</div>
        </div>
      )}
      <div style={{background:P.card,borderRadius:6,padding:"8px 12px",border:`1px solid ${P.border}`,marginBottom:12}}>
        <div style={{fontSize:9,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>Member market in your territory · {Math.round(share*100)}% claimed</div>
        <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",border:`1px solid ${P.border}`}}>
          <div style={{width:`${youPct}%`,background:gs.sector?.color||P.accent}} title={`You: ${gs.members||0} members`}/>
          <div style={{width:`${rvPct}%`,background:P.red,opacity:.7}} title="Rival pressure"/>
          <div style={{flex:1,background:P.bg}} title="Untapped market"/>
        </div>
        <div style={{fontSize:9,color:P.muted,marginTop:4,fontFamily:"'DM Mono',monospace"}}>you {youPct}% · rivals {rvPct}% · open {Math.max(0,100-youPct-rvPct)}% — recruitment slows as the pool empties; expansion grows the pool</div>
      </div>
      {(gs.rivals||[]).length===0 && <div style={{textAlign:"center",padding:24,color:P.goldText,fontWeight:700}}>No rivals remain. The market is yours.</div>}
      <div style={{display:"grid",gap:10}}>
        {(gs.rivals||[]).map(rv => {
          const arch = archOf(rv);
          const shared = sharedCountries(gs, rv);
          const truce = (rv.truce||0) > (gs.turn||0);
          const seatsHeldByRv = SEATS.filter(st => (gs.rivalSeats||{})[st.id]===rv.id);
          const hp = Math.max(0, Math.min(100, rv.health ?? 70));
          // Threat: rival is at/above your stage, or close behind and near a stage-up, or contests you
          const rvRank = (rv.stage||0)*100 + (rv.progress||0);
          const myRank = (gs.stage||0)*100 + (gs.stageProgress||0);
          const ahead = rvRank >= myRank;
          const closing = !ahead && (rv.stage||0) >= (gs.stage||0) && (rv.progress||0) >= 75;
          const threat = !truce && (ahead || closing || shared.length > 0);
          const threatBorder = threat ? (ahead ? P.red : P.orange) : `${rv.color}44`;
          return (
            <div key={rv.id} className={threat ? "threat-pulse" : undefined} style={{background:P.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${threatBorder}`,"--threat":threat?(ahead?P.red:P.orange):"transparent"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{width:9,height:9,borderRadius:2,background:rv.color,display:"inline-block"}}/>
                  <span style={{fontWeight:700,fontSize:13,color:P.text}}>{rv.name}</span>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,border:`1px solid ${rv.color}55`,color:rv.color,fontFamily:"'DM Mono',monospace"}}>{arch.label}</span>
                  {truce && <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,border:`1px solid ${P.green}55`,background:`${P.green}10`,color:P.greenText,fontFamily:"'DM Mono',monospace"}}>TRUCE until Q{rv.truce}</span>}
                  {threat && !truce && <span className="wiggle" style={{fontSize:9,padding:"2px 7px",borderRadius:3,border:`1px solid ${ahead?P.red:P.orange}`,background:`${ahead?P.red:P.orange}12`,color:ahead?P.redText:P.orange,fontFamily:"'DM Mono',monospace",display:"inline-flex",alignItems:"center",gap:3}}><Icon name="triangle-exclamation" size={8} color={ahead?P.red:P.orange}/>{ahead?"AHEAD OF YOU":"THREAT"}</span>}
                </div>
                <span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{STAGES[rv.stage]?.name} · {rv.members||0} members · {(rv.countries||[]).length} countr{(rv.countries||[]).length===1?"y":"ies"}</span>
              </div>
              <div style={{fontSize:9.5,color:P.muted,margin:"4px 0 7px"}}>{arch.blurb}{shared.length>0 && <> · <span style={{color:P.redText}}>contests you in {shared.join(", ")}</span></>}{seatsHeldByRv.length>0 && <> · <span style={{color:P.goldText}}>holds: {seatsHeldByRv.map(s=>s.label).join(", ")}</span></>}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontSize:8.5,color:P.muted,marginBottom:2,fontFamily:"'DM Mono',monospace"}}>progress to next stage</div>
                  <div style={{height:5,background:P.bg,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(100,rv.progress||0)}%`,height:"100%",background:rv.color}}/></div>
                </div>
                <div>
                  <div style={{fontSize:8.5,color:P.muted,marginBottom:2,fontFamily:"'DM Mono',monospace"}}>health {Math.round(hp)}{hp<=25 && <span style={{color:P.redText}}> · collapsing — acquirable</span>}</div>
                  <div style={{height:5,background:P.bg,borderRadius:3,overflow:"hidden"}}><div style={{width:`${hp}%`,height:"100%",background:hp>60?P.green:hp>30?P.orange:P.red}}/></div>
                </div>
              </div>
              {(rv.scoutedUntil||0) > (gs.turn||0) && (() => {
                const owned = new Set(rv.countries||[]);
                const target = (NUTS_BORDERS[NAME_TO_ISO[rv.country]]||[]).map(iso => ISO_TO_NAME[iso]).find(n => n && !owned.has(n));
                return (
                  <div style={{fontSize:9,color:P.tealText||P.blue,fontFamily:"'DM Mono',monospace",margin:"4px 0",padding:"4px 8px",background:`${P.blue}0d`,borderRadius:4,border:`1px dashed ${P.blue}44`}}>
                    <Icon name="magnifying-glass-chart" size={9} color={P.blue}/> INTEL ({(rv.scoutedUntil||0)-(gs.turn||0)}Q): progress {Math.round(rv.progress||0)}% to {STAGES[Math.min(5,(rv.stage||0)+1)]?.name} · next target: {target||"consolidating home market"} · poaching blunted −15%
                  </div>
                );
              })()}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(RIVAL_OPS).map(([opId, op]) => {
                  const cost = op.cost(gs, rv);
                  const ready = opReady(gs, rv.id, opId);
                  const cdLeft = Math.max(0, ((gs.rivalOps||{})[`${rv.id}:${opId}`]||0) - (gs.turn||0));
                  const blocked = !ready ? `available in ${cdLeft}Q`
                    : (gs.budget||0) < cost ? "insufficient funds"
                    : opId==="pact" && (gs.prestige||0) < 50 ? "needs influence 50+"
                    : opId==="pact" && truce ? "truce already active"
                    : opId==="acquire" && hp > 25 ? "target too healthy (health ≤ 25)"
                    : null;
                  const type = { raid:"rivalRaid", pr:"rivalPR", pact:"rivalPact", acquire:"rivalAcquire", scout:"rivalScout" }[opId];
                  return (
                    <button key={opId} className="btn" disabled={!!blocked} title={blocked || op.desc}
                      onClick={() => dispatch({type, rid:rv.id})}
                      style={{padding:"5px 10px",borderRadius:5,border:`1px solid ${P.border}`,background:"transparent",color:blocked?P.muted:P.text,fontSize:10,fontFamily:"'Montserrat',sans-serif",display:"inline-flex",alignItems:"center",gap:5}}>
                      <Icon name={op.icon} size={10} color={blocked?P.muted:P.text}/>{op.label} · {fmt(cost)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
  if (panel) return <div style={{padding:"12px 14px 18px"}}>{body}</div>;
  return (
    <Modal title="Rival Clusters" icon="chess-knight" iconColor={P.red} onClose={onClose} width={700}>{body}</Modal>
  );
}

function NetworkModal({ gs, dispatch, onClose, panel }) {
  const [regCountry, setRegCountry] = useState(null);
  if (!gs) return null;
  const sc       = gs.sector?.color || P.accent;
  const prestige = gs.prestige || 0;
  const regDisc0 = (gs.seats||{}).regional ? 0.75 : 1; // Regional S3 Committee seat
  const natDisc0 = (gs.seats||{}).national ? 0.80 : 1; // National Cluster Platform seat
  const rCost    = Math.round((prestige*1400 + 30000) * regDisc0);
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div style={{background:P.card,borderRadius:8,padding:12,border:`1px solid ${P.border}`,gridColumn:"1 / -1"}}>
          <Lbl t={`Your Network · ${(gs.regions||[]).length} regions in ${(gs.countries||[]).length}/${countryCap(gs)} countries`}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,maxHeight:120,overflowY:"auto"}}>
            {(gs.countries||[]).map(c => {
              const total  = (EU_COUNTRIES[c]||[]).length;
              const active = (EU_COUNTRIES[c]||[]).filter(n => (gs.regions||[]).includes(regionLabelFor(gs, c, n))).length;
              const full   = (gs.fullCountries||[]).includes(c);
              const home   = c === gs.country;
              const col    = full ? P.goldText : home ? P.goldText : darkHex(sc);
              const bg     = full ? `${P.gold}20` : home ? `${P.gold}12` : `${sc}14`;
              return (
                <span key={c} title={`${c}: ${active}/${total} regions active${full?" · fully covered":""}`}
                  style={{fontSize:10,padding:"2px 8px",borderRadius:3,background:bg,border:`1px solid ${full?P.gold:home?`${P.gold}66`:`${sc}33`}`,color:col,fontFamily:"'DM Mono',monospace"}}>
                  {NAME_TO_ISO[c]||c} {active}/{total}{full && " ●"}{home && <Icon name="star" size={8} color={P.goldText} style={{marginLeft:3}}/>}
                </span>
              );
            })}
          </div>
          <div style={{fontSize:8.5,color:P.muted,marginTop:5,fontFamily:"'DM Mono',monospace"}}>● fully covered · ★ home country · activate every region of a country for a national coverage bonus</div>
        </div>
      </div>

      {gs.stage >= 1 && avR.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:P.text}}>Expand to New Region · <span style={{color:P.red}}>{fmt(rCost)}</span>{(gs.seats||{}).regional && <span style={{fontSize:9,color:P.goldText,marginLeft:6}}>−25% S3 Committee seat</span>}</div>
          <div style={{fontSize:10,color:P.muted,marginBottom:8}}>Cost scales with influence · Stage 1+ required · every new region hires a mandatory Regional Coordinator ({fmt(coordSalary)}/quarter) and adds +4% coordination overhead.</div>
          {(() => {
            const byCountry = {};
            avR.forEach(o => { (byCountry[o.c] = byCountry[o.c] || []).push(o); });
            const cs = Object.keys(byCountry).sort((a,b) => (a===gs.country?-1:b===gs.country?1:a.localeCompare(b)));
            const selC = byCountry[regCountry] ? regCountry : cs[0];
            return (
              <>
                {cs.length > 1 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                    {cs.map(c => (
                      <button key={c} className="btn" onClick={() => setRegCountry(c)} aria-pressed={selC===c}
                        style={{padding:"3px 9px",borderRadius:4,fontSize:10,fontFamily:"'DM Mono',monospace",border:`1px solid ${selC===c?P.accent:P.border}`,background:selC===c?`${P.accent}0d`:"transparent",color:selC===c?P.accent:P.muted}}>
                        {NAME_TO_ISO[c]||c} · {byCountry[c].length}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:150,overflowY:"auto"}}>
                  {(byCountry[selC]||[]).map(o => (
                    <button key={`${o.c}-${o.n}`} className="btn" disabled={budget<rCost} onClick={() => dispatch({type:"expandRegion",region:regionLabel(o),cost:rCost})} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${sc}44`,background:"transparent",color:budget<rCost?P.muted:darkHex(sc),fontSize:11,fontFamily:"'Montserrat',sans-serif"}}>+ {o.n}</button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {gs.stage >= 2 && avC.length > 0 && (
        <div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:P.text}}>Expand to New Country · <span style={{color:P.red}}>{fmt(cCost)}</span>{(gs.seats||{}).national && <span style={{fontSize:9,color:P.goldText,marginLeft:6}}>−20% National Platform seat</span>}</div>
          <div style={{fontSize:10,color:P.muted,marginBottom:8}}>Cost scales with influence · Stage 2+ required · only countries <strong style={{color:P.text}}>bordering your network</strong> (incl. ferry links) are open · international reach {String((gs.countries||[]).length)}/{capC} at this stage · every new country hires a mandatory Country Manager ({fmt(mgrSalary)}/quarter) and raises failure & event risk.</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:200,overflowY:"auto"}}>
            {avC.map(c => {
              const contested = occupied.has(c);
              const cost = contested ? Math.round(cCost*1.5) : cCost;
              return (
                <button key={c} className="btn" disabled={budget<cost} onClick={() => dispatch({type:"expandCountry",country:c,cost})} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:5,border:`1px solid ${contested?P.red:P.gold}44`,background:"transparent",color:budget<cost?P.muted:contested?P.redText:P.goldText,fontSize:11,fontFamily:"'Montserrat',sans-serif"}}>+ {c}{contested && <Icon name="chess-knight" size={10} color={P.orange} title="Rival present: cost ×1.5"/>}</button>
              );
            })}
          </div>
        </div>
      )}

      {gs.stage >= 2 && atCap && (gs.countries||[]).length < 27 && (
        <div style={{fontSize:10,color:P.goldText,marginTop:6,fontWeight:600}}>International reach {String((gs.countries||[]).length)}/{capC}: a {STAGES[gs.stage]?.name} can credibly operate in at most {capC} countries — evolve to expand further.</div>
      )}
      {gs.stage >= 2 && !atCap && avC.length===0 && Object.keys(EU_COUNTRIES).some(c => !(gs.countries||[]).includes(c)) && (
        <div style={{fontSize:10,color:P.muted,marginTop:6}}>No unclaimed country currently borders your network.</div>
      )}
      {gs.stage < 1 && <div style={{textAlign:"center",padding:28,color:P.muted}}>Reach Cluster Organisation (Stage 1) to expand geographically.</div>}
    </>
  );
  if (panel) return <div style={{padding:"12px 14px 18px"}}>{body}</div>;
  return (
    <Modal title="Geographic Network" icon="earth-europe" iconColor={P.teal} onClose={onClose} width={680}>{body}</Modal>
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
  return (
    <Modal title="Stage Evolution" icon="rocket" iconColor={P.gold} onClose={onClose} width={520}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{padding:"8px 16px",borderRadius:6,background:`${stage.color}18`,border:`1px solid ${stage.color}44`,color:stage.color,fontSize:14,fontWeight:700}}>{stage.name}</div>
          <Icon name="arrow-right" size={20} color={P.muted}/>
          <div style={{padding:"8px 16px",borderRadius:6,background:`${next.color}18`,border:`1px solid ${next.color}44`,color:next.color,fontSize:14,fontWeight:700}}>{next.name}</div>
        </div>
      </div>
      <Lbl t="Requirements"/>
      <div style={{display:"grid",gap:6,marginBottom:16}}>
        {reqs.map((r,i) => (
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderRadius:6,background:r.ok?`${P.green}12`:`${P.red}10`,border:`1px solid ${r.ok?P.green:P.red}44`}}>
            <span style={{fontSize:12,color:r.ok?P.green:P.red,display:"inline-flex",alignItems:"center",gap:5}}><Icon name={r.ok?"check":"xmark"} size={11} color={r.ok?P.green:P.red}/> {r.l}</span>
            <span style={{fontSize:12,fontFamily:"'DM Mono',monospace",color:r.ok?P.green:P.red}}>{r.money?fmt(r.cur):r.cur} / {r.money?fmt(r.req):r.req}</span>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 14px",borderRadius:8,background:P.card,border:`1px solid ${P.border}`,marginBottom:16,fontSize:11,color:P.muted}}>
        Evolution cost: <strong style={{color:P.red}}>{fmt(cost)}</strong>
      </div>
      <button className="btn" disabled={!ok} onClick={() => { dispatch({type:"evolve"}); onClose(); }} style={{width:"100%",padding:13,borderRadius:8,border:"none",background:ok?`linear-gradient(135deg,${stage.color},${next.color})`:P.bright,color:ok?"#fff":P.muted,fontWeight:700,fontSize:15,fontFamily:"'Montserrat',sans-serif"}}>
        {ok ? <><Icon name="rocket" size={15} color="#fff" style={{marginRight:7}}/>Evolve Now</> : "Requirements Not Met"}
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
          <div key={i} style={{padding:"7px 10px",borderRadius:5,marginBottom:4,background:P.card,border:`1px solid ${(cols[e?.t]||P.border)}22`,display:"flex",gap:7,alignItems:"flex-start"}}>
            <Icon name={LOG_ICON[e?.t]||"circle-info"} size={11} color={cols[e?.t]||P.muted} style={{marginTop:2}}/>
            <div style={{fontSize:10,color:cols[e?.t]||P.text,lineHeight:1.5}}>{e?.txt||""}</div>
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
      <div className="event-in" style={{background:P.panel,borderRadius:14,padding:28,maxWidth:480,width:"100%",border:`2px solid ${col}`,boxShadow:"0 12px 46px rgba(0,0,0,.28)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:9,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:3,marginBottom:10,fontFamily:"'DM Mono',monospace"}}><span className={headAnim} style={{display:"inline-flex"}}><Icon name={headingIcon} size={11} color={col}/></span>{heading}</div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:10,color:P.text,lineHeight:1.3}}>{ev.n}</h2>
        <p style={{fontSize:13,color:P.muted,lineHeight:1.75,marginBottom:16}}>{ev.d}</p>
        {!isChoice && lines.length > 0 && (
          <div style={{background:P.bright,borderRadius:8,padding:"10px 14px",marginBottom:20,display:"flex",gap:14,flexWrap:"wrap"}}>
            {lines.map((l,i) => {
              const neg = l.startsWith("Budget -")||l.startsWith("Members -")||l.startsWith("Influence -")||l.startsWith("Staff");
              return <span key={i} style={{fontSize:12,fontWeight:700,color:neg?P.red:P.green,fontFamily:"'DM Mono',monospace"}}>{l}</span>;
            })}
          </div>
        )}
        {isChoice ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {(ev.choices||[]).map((ch, i) => (
              <button key={i} className="btn" onClick={()=>onDismiss(i)} style={{width:"100%",padding:"12px 16px",borderRadius:9,border:`1.5px solid ${i===0?P.blue:P.border}`,background:i===0?P.blue:P.bright,color:i===0?"#fff":P.text,fontWeight:700,fontSize:14,textAlign:"left",display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",columnGap:12,rowGap:4,minWidth:0}}>
                <span style={{flexShrink:0}}>{ch.label}</span>
                <span style={{fontSize:10,opacity:0.75,fontFamily:"'DM Mono',monospace",textAlign:"right",flex:"1 1 auto",minWidth:0,overflowWrap:"anywhere",lineHeight:1.5}}>{fxLine(ch.fx||{})}</span>
              </button>
            ))}
          </div>
        ) : (
          <button className="btn" onClick={()=>onDismiss(null)} style={{width:"100%",padding:13,borderRadius:9,border:"none",background:col,color:"#fff",fontWeight:700,fontSize:15}}>
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
  const burnRate = (gs.qStaff||0) + (gs.qOverhead||0) + Math.max(0, (gs.qDelivery||0) - (gs.qInterim||0));
  const runway   = burnRate > 0 ? Math.round((gs.budget||0) / Math.max(1,burnRate)) : 99;
  const failRate = failPct(gs);
  const decay    = [2,3,4,5,6,8][gs.stage] ?? 2;
  const next     = STAGES[Math.min(5,gs.stage+1)];

  const Card = ({children, title}) => <div title={title||undefined} style={{background:P.card,borderRadius:8,padding:"11px 13px",border:`1px solid ${P.border}`,cursor:title?"help":"default"}}>{children}</div>;

  return (
    <Modal title="Cluster Dashboard" icon="gauge-high" iconColor={P.accent} onClose={onClose} width={560}>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Card>
          <Lbl t="Treasury"/>
          <div style={{fontSize:26,fontWeight:700,color:(gs.budget||0)<20000?P.red:P.accent,fontFamily:"'DM Mono',monospace"}}>{fmt(gs.budget||0)}</div>
          <div style={{fontSize:11,color:P.muted,marginTop:4}}>
            <span style={{color:(gs.qNet||0)>=0?P.accent:P.red}}>{(gs.qNet||0)>=0?"+":""}{fmt(gs.qNet||0)}/quarter</span>
            {" · runway "}<span style={{color:runway<3?P.red:runway<6?P.orange:P.green}}>{runway>=99?"∞":runway+"Q"}</span>
          </div>
          <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11,fontFamily:"'DM Mono',monospace"}}>
            <div style={{color:P.accent}}>+{fmt(gs.qMember||0)} <span style={{color:P.muted}}>members</span></div>
            <div style={{color:(gs.qProj||0)>0?P.blue:P.muted}}>+{fmt(gs.qProj||0)} <span style={{color:P.muted}}>projects</span></div>
            <div style={{color:P.red}}>-{fmt(gs.qStaff||0)} <span style={{color:P.muted}}>staff</span></div>
            <div style={{color:P.orange}}>-{fmt(gs.qOverhead||0)} <span style={{color:P.muted}}>overhead</span></div>
            {(gs.qDelivery||0) > 0 && <div style={{color:P.purple,gridColumn:"1 / -1"}}>-{fmt(gs.qDelivery||0)} <span style={{color:P.muted}}>delivery ({fmt(gs.qInterim||0)} interim-covered)</span></div>}
          </div>
        </Card>

        {(gs.activeProjects||[]).length === 0 && avail.length > 0 && (
          <Card><EmptyState icon="folder-open" title="No active projects" hint="Launch a call below to start earning. Projects pre-finance in instalments, interim payments cover 70% as you deliver, and success pays a margin on top."/></Card>
        )}
        {(gs.activeProjects||[]).length > 0 && (
          <Card>
            <Lbl t={`Active Projects (${gs.activeProjects.length})`}/>
            {gs.activeProjects.map((p, i) => {
              if (!p) return null;
              const prog = Math.min(1, 1 - ((p.endTurn||0)-(gs.turn||0)) / Math.max(1,p.dur||1));
              const pst = projectStatus(p, gs);
              return (
                <div key={`spr-${i}`} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                  <ProgressRing pct={prog} color={pst.color} label={`${Math.round(prog*100)}%`}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2,gap:6}}>
                      <span style={{fontWeight:600,color:P.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                      <span style={{color:pst.color,fontWeight:600,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}><Icon name="circle" size={7} color={pst.color}/> {pst.label}</span>
                    </div>
                    <div style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{Math.max(0,(p.endTurn||0)-(gs.turn||0))}Q left · {fmt(projBudget(p,p.partners||0))}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Card title={trendTitle(statTrends(gs)?.members, "Plus rival poaching, defections and events.")}>
            <Lbl t="Members"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span style={{fontSize:22,fontWeight:700,color:P.gold,fontFamily:"'DM Mono',monospace"}}>{gs.members||0}</span>
              <Trend t={statTrends(gs)?.members}/>
            </div>
            <div style={{fontSize:10,color:P.muted}}>fee {fmt(memberFee(gs.stage))}/quarter · mix ×{(Math.round(feeMult(gs)*100)/100).toFixed(2)}</div>
            {(() => { const mx = mixOf(gs), m = Math.max(1, gs.members||1); return (
              <div style={{marginTop:5}}>
                <div style={{display:"flex",height:5,borderRadius:3,overflow:"hidden",border:`1px solid ${P.border}`}}>
                  <div style={{width:`${Math.round(mx.sme/m*100)}%`,background:P.accent}} title={`SMEs ${mx.sme}`}/>
                  <div style={{width:`${Math.round(mx.corp/m*100)}%`,background:P.gold}} title={`Corporates ${mx.corp}`}/>
                  <div style={{flex:1,background:P.purple}} title={`Research ${mx.res}`}/>
                </div>
                <div style={{fontSize:8.5,color:P.muted,marginTop:2,fontFamily:"'DM Mono',monospace"}}>SME {Math.round(mx.sme/m*100)}% · corp {Math.round(mx.corp/m*100)}% · res {Math.round(mx.res/m*100)}%{cohesionShare(gs)>0?` · cohesion regions ${Math.round(cohesionShare(gs)*100)}%`:""}</div>
                {dispatch && (
                  <div style={{display:"flex",gap:3,marginTop:5,flexWrap:"wrap"}}>
                    {Object.entries(MIX_FOCUS).map(([fid, fo]) => (
                      <button key={fid} className="btn" onClick={() => dispatch({type:"setFocus", focus:fid})}
                        style={{padding:"2px 7px",borderRadius:4,fontSize:8.5,fontFamily:"'DM Mono',monospace",border:`1px solid ${(gs.focus||"balanced")===fid?P.accent:P.border}`,background:(gs.focus||"balanced")===fid?`${P.accent}18`:"transparent",color:(gs.focus||"balanced")===fid?P.accent:P.muted}}>
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
                <button className="btn" onClick={() => downloadCSV(gs)} title="Export the full run history as CSV" style={{padding:"2px 8px",borderRadius:4,border:`1px solid ${P.border}`,background:"transparent",color:P.muted,fontSize:9,fontFamily:"'DM Mono',monospace"}}>CSV ⬇</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"6px 14px",marginTop:2}}>
                {[["Treasury","b",P.accent],["Members","m",P.gold],["Influence","p",P.purple],["Board","bc",P.green]].map(([lbl,k,col]) => (
                  <div key={k}>
                    <div style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{lbl}</div>
                    <Sparkline data={(gs.history||[]).slice(-60).map(x=>x[k]||0)} color={col}/>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card>
            <Lbl t="Staff"/>
            <div style={{fontSize:22,fontWeight:700,color:P.text,fontFamily:"'DM Mono',monospace"}}>{staffTotal(gs.roster)}</div>
            <div style={{fontSize:10,color:P.muted}}>fail risk <span style={{color:failRate>25?P.red:failRate>15?P.orange:P.green}}>{failRate}%</span></div>
          </Card>
        </div>

        <Card>
          <Lbl t="Influence"/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:22,fontWeight:700,color:P.purple,fontFamily:"'DM Mono',monospace"}}>{Math.round(gs.prestige||0)}</span>
            <span style={{fontSize:10,color:P.muted}}>fades -{decay}/quarter</span>
          </div>
          <Bar val={gs.prestige||0} color={P.purple}/>
          <div style={{fontSize:10,color:P.muted,marginTop:6,lineHeight:1.5}}>Your political standing with regional, national and EU authorities. Earned by delivering projects and by communications, policy and research staff; it fades every quarter without visibility work. Gatekeeps calls, evolution and political seats.</div>
          <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${P.border}`}}>
            <div style={{fontSize:10,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>Political Integration · seats in policy bodies</div>
            {seatStatus(gs).map(st => (
              <div key={st.id} style={{marginBottom:9,padding:"8px 10px",borderRadius:6,border:`1px solid ${st.held?`${P.gold}66`:P.border}`,background:st.held?`${P.gold}0d`:"transparent"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:st.held?P.goldText:P.text}}>{st.label}</span>
                  {st.held && <span style={{fontSize:8.5,fontWeight:700,color:P.goldText,letterSpacing:.5,fontFamily:"'DM Mono',monospace"}}>SEAT HELD</span>}
                  {!st.held && st.heldBy && <span style={{fontSize:8.5,fontWeight:700,color:P.redText,letterSpacing:.5,fontFamily:"'DM Mono',monospace"}}>CHAIRED BY {String(st.holderName||"").toUpperCase()}</span>}
                </div>
                <div style={{fontSize:9,color:P.muted,margin:"3px 0 6px"}}>{st.effects}</div>
                {!st.held && (
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {st.reqs.map((c,i) => (
                      <span key={i} style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9.5,padding:"2px 7px",borderRadius:3,border:`1px solid ${(c.ok?P.green:P.red)}55`,background:`${c.ok?P.green:P.red}10`,color:c.ok?P.greenText:P.redText,fontFamily:"'DM Mono',monospace"}}>
                        <Icon name={c.ok?"check":"xmark"} size={8} color={c.ok?P.greenText:P.redText}/>{c.l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Lbl t="Board Confidence"/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:22,fontWeight:700,color:(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green,fontFamily:"'DM Mono',monospace"}}>{Math.round(gs.boardConf||0)}</span>
            <span style={{fontSize:10,color:P.muted}}>/ 100</span>
          </div>
          <Bar val={gs.boardConf||0} color={(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green}/>
          {(gs.boardConf||0)<30 && <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:P.red,marginTop:4}}><Icon name="triangle-exclamation" size={10} color={P.red}/>Crisis: +3% extra member churn</div>}
        </Card>

        {gs.stage < 5 && (
          <Card>
            <Lbl t={<>Evolve <Icon name="arrow-right" size={10} color={P.muted} style={{margin:"0 4px"}}/>{next?.name||""}</>}/>
            <div style={{display:"grid",gap:4,marginTop:2}}>
              {reqs.map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:"'DM Mono',monospace",color:r.ok?P.green:P.muted}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>{r.ok?<Icon name="check" size={9} color={P.green}/>:<Icon name="circle" size={4} color={P.muted}/>} {r.l}</span>
                  <span>{r.money?fmt(r.cur):r.cur} / {r.money?fmt(r.req):r.req}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:6,fontSize:10,color:P.muted}}>Evolution cost: <span style={{color:P.red}}>{fmt(evolveCost(gs.stage))}</span></div>
          </Card>
        )}

        {(gs.rivals||[]).length > 0 && (
          <Card>
            <Lbl t={<><Icon name="chess-knight" size={11} color={P.text} style={{marginRight:5}}/>Rival Race · first to a Pan-European Cluster Network</>}/>
            {(gs.rivals||[]).map(rv => (
              <div key={rv.id} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:"'DM Mono',monospace"}}>
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
          <div style={{display:"flex",gap:16,fontSize:12,fontFamily:"'DM Mono',monospace"}}>
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
  const H = ({t}) => <div style={{fontSize:12,fontWeight:700,color:P.blue,textTransform:"uppercase",letterSpacing:.8,margin:"16px 0 6px",fontFamily:"'Montserrat',sans-serif"}}>{t}</div>;
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
        <T><B>One General Manager</B>, always. The GM manages up to 7 staff; each <B>Executive Director adds 7</B> (span of control). Balance rule: no role may exceed a third of the visible team. Legal Counsel is required to evolve past Stage 2 (1/2/3). Expanding hires <B>mandatory office staff</B> — a Regional Coordinator per region, a Country Manager per country — who can never be dismissed while the office exists.</T>

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
  const [step, setStep]     = useState(0);
  const [country, setCountry] = useState("");
  const [region,  setRegion]  = useState("");
  const [sector,  setSector]  = useState(null);

  const sel = (active, col=P.accent) => ({
    padding:"6px 11px", borderRadius:5, border:`1px solid ${active?col:P.border}`,
    background:active?`${col}14`:P.card, color:active?col:P.text,
    cursor:"pointer", fontSize:13, fontFamily:"'Montserrat',sans-serif",
    fontWeight:500, textAlign:"left", transition:"all .1s", width:"100%", display:"block",
  });

  return (
    <div style={{height:"100dvh",background:P.bg,display:"flex",padding:mobile?16:24,fontFamily:"'Open Sans',sans-serif",color:P.text,overflowY:"auto",overflowX:"hidden"}}>
      <div style={{maxWidth:740,width:"100%",margin:"auto",paddingBottom:8}}>
        <div style={{textAlign:"center",marginBottom:mobile?22:"clamp(14px,3vh,32px)"}}>
          <div style={{fontSize:9,letterSpacing:5,color:P.muted,textTransform:"uppercase",marginBottom:"clamp(6px,1.2vh,12px)"}}>EU Industrial Strategy Simulation</div>
          <h1 style={{fontSize:mobile?40:"clamp(34px,6.5vh,54px)",fontWeight:700,lineHeight:1,marginBottom:"clamp(6px,1.2vh,10px)",letterSpacing:-2,background:`linear-gradient(135deg,${P.accent},${P.gold})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CLUSTER<br/>MANAGER</h1>
          <div style={{fontSize:12,color:P.muted,marginBottom:14}}>From a local cluster initiative to a Pan-European Cluster Network</div>
          {canResume && (
            <div style={{marginTop:16}}>
              <button className="btn" onClick={onResume} style={{padding:"12px 28px",borderRadius:9,border:`1px solid ${P.accent}`,background:`${P.accent}1a`,color:P.accent,fontWeight:700,fontSize:15,fontFamily:"'Montserrat',sans-serif"}}>
                <Icon name="play" size={11} color="currentColor" style={{marginRight:7}}/> Continue Saved Game
              </button>
              <div style={{fontSize:10,color:P.muted,marginTop:8}}>or start a new game below</div>
            </div>
          )}
          {onOpenSlots && (
            <div style={{marginTop:canResume?4:16}}>
              <button className="btn" onClick={onOpenSlots} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${P.border}`,background:P.panel,color:P.muted,fontWeight:700,fontSize:12,fontFamily:"'Montserrat',sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
                <Icon name="floppy-disk" size={11} color={P.muted}/> Load from a save slot
              </button>
            </div>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:"clamp(10px,2.2vh,22px)"}}>
          {["Country","Region","Ecosystem"].map((l,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:i<step?P.accent:"transparent",border:`1.5px solid ${i<=step?P.accent:P.border}`,color:i<step?P.bg:i===step?P.accent:P.muted}}>{i<step?<Icon name="check" size={10} color={P.bg}/>:(i+1)}</div>
              <span style={{fontSize:11,color:i===step?P.accent:P.muted}}>{l}</span>
              {i<2 && <div style={{width:18,height:1,background:P.border}}/>}
            </div>
          ))}
        </div>

        <div style={{background:P.panel,borderRadius:12,padding:24,border:`1px solid ${P.border}`}}>
          {step===0 && (
            <>
              <div style={{marginBottom:8,padding:"11px 13px",borderRadius:8,border:`1px solid ${P.border}`,background:P.card}}>
                <div style={{fontSize:10,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Scenario</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {SCENARIOS.map(sc => (
                    <button key={sc.id} className="btn" onClick={() => setScenario(sc.id)} aria-pressed={scenario===sc.id} title={sc.desc}
                      style={{padding:"6px 11px",borderRadius:6,border:`1.5px solid ${scenario===sc.id?P.gold:P.border}`,background:scenario===sc.id?`${P.gold}0f`:P.panel,color:scenario===sc.id?P.goldText:P.text,fontWeight:700,fontSize:11,fontFamily:"'Montserrat',sans-serif"}}>
                      {sc.name}
                    </button>
                  ))}
                </div>
                <div style={{fontSize:10,color:P.muted,marginTop:5,minHeight:24,lineHeight:1.4}}>{SCENARIOS.find(x=>x.id===scenario)?.desc}</div>
                <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
                  <input value={seed} onChange={e=>setSeed(e.target.value)} placeholder="Seed (optional)" aria-label="Optional seed for a reproducible campaign" title="Any text: two players with the same seed, scenario and difficulty get an identical campaign start"
                    style={{flex:"1 1 120px",minWidth:0,padding:"6px 9px",borderRadius:5,border:`1px solid ${P.border}`,background:P.panel,color:P.text,fontSize:11,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
                  <input value={challengeIn} onChange={e=>{ setChallengeIn(e.target.value); applyChallenge(e.target.value); }} placeholder="Paste challenge code…" aria-label="Paste a friend's challenge code" title="A friend's CM1 code sets seed, difficulty and scenario automatically"
                    style={{flex:"1 1 150px",minWidth:0,padding:"6px 9px",borderRadius:5,border:`1px dashed ${P.border}`,background:P.panel,color:P.text,fontSize:11,fontFamily:"'DM Mono',monospace",outline:"none"}}/>
                </div>
                {challengeApplied && <div style={{fontSize:10,color:P.greenText,marginTop:5,fontFamily:"'DM Mono',monospace"}}>✓ Challenge loaded: {DIFFICULTIES[diff]?.label} · {SCENARIOS.find(x=>x.id===scenario)?.name} · pick your country to match</div>}
              </div>
              <div style={{marginBottom:2,fontSize:14,fontWeight:700}}>Select your country</div>
              <div style={{marginBottom:12,fontSize:11,color:P.muted}}>Where your cluster is based. You can expand into other countries later.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(128px,1fr))",gap:5,maxHeight:290,overflowY:"auto",paddingRight:4}}>
                {Object.keys(EU_COUNTRIES).sort().map(c => (
                  <button key={c} className="btn" style={sel(country===c)} onClick={() => { setCountry(c); setStep(1); }}>{c}</button>
                ))}
              </div>
            </>
          )}
          {step===1 && (
            <>
              <button className="btn" onClick={() => setStep(0)} style={{background:"none",border:"none",color:P.accent,fontSize:13,marginBottom:12,padding:0,fontFamily:"inherit",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}><Icon name="arrow-left" size={11} color={P.accent}/> Back</button>
              <div style={{marginBottom:2,fontSize:14,fontWeight:700}}>Region in <span style={{color:P.accent}}>{country}</span></div>
              <div style={{marginBottom:12,fontSize:11,color:P.muted,display:"flex",alignItems:"flex-start",gap:5}}><Icon name="star" size={11} color={P.gold} style={{marginTop:2,flexShrink:0}}/><span>{(REGION_RECORDS[country]||[]).length} regions. The star icon marks a stronger Regional Innovation Scoreboard tier, meaning more budget and members at the start.</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:5,maxHeight:300,overflowY:"auto",paddingRight:4}}>
                {(REGION_RECORDS[country]||[]).map(rec => {
                  const strong = /Leader|Strong/.test(rec.ris||"");
                  return (
                    <button key={rec.name} className="btn" style={{...sel(region===rec.name), display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2, padding:"7px 11px"}} onClick={() => { setRegion(rec.name); setStep(2); }}>
                      <span style={{fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>{strong && <Icon name="star" size={10} color={P.gold}/>}{rec.name}</span>
                      <span style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{rec.nuts} · Regional Innovation Scoreboard: {rec.ris||"not rated"} · {(rec.ecos||[]).filter(e=>e!=="Cross-ecosystem").length} ecosystems</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {step===2 && (
            <>
              <button className="btn" onClick={() => setStep(1)} style={{background:"none",border:"none",color:P.accent,fontSize:13,marginBottom:12,padding:0,fontFamily:"inherit",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}><Icon name="arrow-left" size={11} color={P.accent}/> Back</button>
              <div style={{marginBottom:2,fontSize:14,fontWeight:700}}>Industrial Ecosystem</div>
              <div style={{marginBottom:12,fontSize:11,color:P.muted,display:"flex",alignItems:"flex-start",gap:5}}><Icon name="bullseye" size={11} color={P.accent} style={{marginTop:2,flexShrink:0}}/><span>marks a real Smart Specialisation priority of <span style={{color:P.accent}}>{region}</span> · choosing it gives a lasting bonus. Other sectors are harder to grow here.</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:5,maxHeight:280,overflowY:"auto",paddingRight:4}}>
                {[...ECOSYSTEMS].map(e => {
                  const rec = getRegion(country, region);
                  const aligned = rec ? ecosystemAligns(rec, e.name) : false;
                  return (
                    <button key={e.id} className="btn" style={{...sel(sector?.id===e.id, e.color), display:"flex", alignItems:"center", gap:9, padding:"7px 10px"}} onClick={() => setSector(e)}>
                      <Icon name={e.icon} size={18} color={e.color}/>
                      <span style={{flex:1,color:sector?.id===e.id?e.color:P.text,fontSize:12}}>{e.name}</span>
                      {aligned && <Icon name="bullseye" size={11} color={P.green} style={{flexShrink:0}}/>}
                    </button>
                  );
                })}
              </div>
              {sector && (
                <>
                  <div style={{marginTop:16}}>
                    <div style={{fontSize:10,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.6,marginBottom:6}}>Difficulty</div>
                    <div style={{display:"flex",gap:6}}>
                      {Object.values(DIFFICULTIES).map(d => (
                        <button key={d.id} className="btn" onClick={() => setDiff(d.id)} aria-pressed={diff===d.id}
                          style={{flex:1,padding:"8px 6px",borderRadius:6,border:`1.5px solid ${diff===d.id?P.accent:P.border}`,background:diff===d.id?`${P.accent}0d`:P.card,color:diff===d.id?P.accent:P.text,fontWeight:700,fontSize:12,fontFamily:"'Montserrat',sans-serif"}}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div style={{fontSize:10,color:P.muted,marginTop:5,minHeight:26,lineHeight:1.4}}>{DIFFICULTIES[diff].desc}</div>
                  </div>
                  <div style={{fontSize:10,color:P.muted,marginTop:10,lineHeight:1.4}}>Scenario <strong style={{color:P.goldText}}>{SCENARIOS.find(x=>x.id===scenario)?.name}</strong>{seed?` · seed "${seed.trim()}"`:""} — change these on the first step.</div>
                  <button className="btn" onClick={() => onStart(country, region, sector, diff, scenario, seed.trim())} style={{marginTop:10,width:"100%",padding:13,borderRadius:8,background:`linear-gradient(135deg,${P.accent},${P.blue})`,color:P.bg,fontWeight:700,fontSize:15,fontFamily:"'Montserrat',sans-serif",letterSpacing:.3}}>
                    <Icon name={sector.icon} size={14} color="#fff" style={{marginRight:6}}/> Launch {sector.name} cluster in {region} <Icon name="arrow-right" size={12} color="#fff" style={{marginLeft:6}}/>
                  </button>
                </>
              )}
            </>
          )}
        </div>
        <div style={{textAlign:"center",marginTop:12,display:"flex",justifyContent:"center",gap:8}}>
          <button className="btn" onClick={onTheme} title="Toggle dark mode" style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${P.border}`,background:P.panel,display:"inline-flex",alignItems:"center"}}>
            <Icon name={dark?"sun":"moon"} size={12} color={P.muted}/>
          </button>
          <button className="btn" onClick={() => setShowRules(true)} style={{padding:"6px 16px",borderRadius:6,border:`1px solid ${P.border}`,background:P.panel,color:P.blue,fontSize:11,fontWeight:700,fontFamily:"'Montserrat',sans-serif",display:"inline-flex",alignItems:"center",gap:6}}>
            <Icon name="circle-question" size={12} color={P.blue}/> How to Play · Game Rules
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:10,fontSize:9,color:P.muted,opacity:.65,fontFamily:"'DM Mono',monospace",letterSpacing:.5}}>vibecoded by DDE</div>
        {showRules && <RulesModal onClose={() => setShowRules(false)}/>}
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
    <div style={{display:"flex",alignItems:"center",gap:7,fontSize:10,color:P.text,padding:"1px 0"}}>
      <span style={{flexShrink:0}}>{swatch}</span><span>{label}</span>
    </div>
  );
  const box = (fill, stroke, extra) => <span style={{display:"inline-block",width:14,height:10,borderRadius:2,background:fill,border:`1px solid ${stroke||"transparent"}`,...extra}}/>;
  return (
    <div style={{position:"absolute",left:8,bottom:8,zIndex:35,fontFamily:"'Open Sans',sans-serif"}}>
      {open ? (
        <div className="event-in" style={{background:P.panel,border:`1px solid ${P.border}`,borderRadius:9,padding:"9px 11px",boxShadow:"0 6px 22px rgba(10,25,60,.16)",minWidth:172}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:9,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.8,fontFamily:"'DM Mono',monospace"}}>Map key</span>
            <button className="btn" onClick={()=>setOpen(false)} aria-label="Close map key" style={{border:"none",background:"none",color:P.muted,fontSize:13,lineHeight:1,cursor:"pointer",padding:0,width:16,height:16}}>×</button>
          </div>
          <Item swatch={box(`${P.gold}B0`, P.gold)} label="Home region"/>
          <Item swatch={box(`${sc}A8`, sc)} label="Full national coverage"/>
          <Item swatch={box(`${sc}66`, sc)} label="Active region"/>
          <Item swatch={box(THEME_DARK?"#22304F":"#E9EEF8", "#B9C6E2")} label="Unexplored"/>
          {rivals.length > 0 && (
            <Item swatch={<span style={{display:"inline-block",width:14,height:10,borderRadius:2,border:`1px solid ${rivals[0].color}`,background:`repeating-linear-gradient(45deg, ${rivals[0].color}44 0 2px, transparent 2px 4px)`}}/>} label="Rival territory"/>
          )}
          <Item swatch={<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:14,height:10}}><span style={{width:8,height:8,borderRadius:"50%",border:`1.5px solid ${P.purple}`,background:P.panel}}/></span>} label="Political seat"/>
          <div style={{fontSize:8.5,color:P.muted,marginTop:5,lineHeight:1.4,fontStyle:"italic"}}>Dashed lines link your territories; a shimmer marks contested countries.</div>
        </div>
      ) : (
        <button className="btn" onClick={()=>setOpen(true)} title="Show map key" style={{display:"inline-flex",alignItems:"center",gap:5,background:P.panel,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 9px",fontSize:10,fontWeight:700,color:P.muted,boxShadow:"0 3px 12px rgba(10,25,60,.12)"}}>
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
    return <span key={label} style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:11,color:val>0?P.greenText:P.redText,whiteSpace:"nowrap"}}>{val>0?"+":""}{fmtFn(val)} {label}</span>;
  };
  const Row = ({ label, val, fmtFn=(v=>v), good }) => {
    if (Math.round(val) === 0) return null;
    const positive = good === undefined ? val > 0 : good;
    return (
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
        <span style={{color:P.muted}}>{label}</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:positive?P.greenText:P.redText}}>{val>0?"+":""}{fmtFn(val)}</span>
      </div>
    );
  };
  return (
    <div className="event-in" style={{position:"absolute",top:8,right:8,zIndex:40,width:expanded?250:210,maxWidth:"calc(100% - 16px)",background:P.panel,border:`1px solid ${d.evolved?P.gold:P.border}`,borderRadius:9,boxShadow:"0 6px 22px rgba(10,25,60,.18)",overflow:"hidden"}}>
      <button className="btn" onClick={() => setExpanded(e=>!e)} aria-expanded={expanded} style={{width:"100%",textAlign:"left",background:"none",border:"none",padding:"8px 26px 8px 10px",cursor:"pointer",display:"block"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,paddingRight:18}}>
          <Icon name="clipboard-check" size={11} color={P.accent}/>
          <span style={{fontSize:9,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.8,fontFamily:"'DM Mono',monospace"}}>Q{((d.turn-1)%4)+1} {2024+Math.floor((d.turn-1)/4)} review</span>
          <span style={{marginLeft:"auto",fontSize:9,color:P.muted}}>{expanded?"▲":"▼"}</span>
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
          <div style={{fontSize:8.5,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.8,margin:"7px 0 3px",fontFamily:"'DM Mono',monospace"}}>Cashflow</div>
          <Row label="Membership fees" val={d.qMember} fmtFn={v=>fmt(v)} good={true}/>
          <Row label="Project income" val={d.qProj} fmtFn={v=>fmt(v)} good={true}/>
          <Row label="Salaries" val={-d.qStaff} fmtFn={v=>fmt(Math.abs(v))} good={false}/>
          <Row label="Overheads" val={-d.qOverhead} fmtFn={v=>fmt(Math.abs(v))} good={false}/>
          <Row label="Delivery costs" val={-d.qDelivery} fmtFn={v=>fmt(Math.abs(v))} good={false}/>
          {d.events.length > 0 && (
            <>
              <div style={{fontSize:8.5,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:.8,margin:"7px 0 3px",fontFamily:"'DM Mono',monospace"}}>This quarter</div>
              {d.events.map((e,i) => (
                <div key={i} style={{fontSize:10,lineHeight:1.4,color:P.text,display:"flex",gap:5,alignItems:"flex-start",marginBottom:2}}>
                  <Icon name={e.t==="good"?"circle-check":"circle-exclamation"} size={9} color={e.t==="good"?P.green:P.red} style={{marginTop:2,flexShrink:0}}/>
                  <span>{e.txt}</span>
                </div>
              ))}
            </>
          )}
          {onDigestToggle && (
            <label style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontSize:9.5,color:P.muted,cursor:"pointer"}}>
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
        <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:sc,fontFamily:"'DM Mono',monospace",marginBottom:8}}>Cluster evolved</div>
        <div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"center"}}>
          <span style={{fontSize:14,color:"#94a3b8",fontFamily:"'Montserrat',sans-serif",fontWeight:700,textDecoration:"line-through",opacity:.6}}>{STAGES[banner.from]?.name}</span>
          <Icon name="arrow-up-right-dots" size={22} color={sc}/>
        </div>
        <div style={{fontSize:30,fontWeight:800,color:sc,fontFamily:"'Montserrat',sans-serif",marginTop:6,textShadow:`0 4px 24px ${sc}66`}}>{STAGES[banner.to]?.name}</div>
        <div style={{fontSize:11,color:"#64748b",marginTop:6,fontFamily:"'DM Mono',monospace"}}>Stage {banner.to} of 5</div>
      </div>
    </div>
  );
}

const TUT_STEPS = [
  { t:"Welcome, cluster manager", d:"Your goal: grow this initiative into the Pan-European Cluster Network before any rival — or outlast them all. Watch three numbers: Treasury, Board Confidence, and the rival race.", done: () => false },
  { t:"1 · Launch a project", d:"Open Projects (right panel or bottom bar) and launch a call. Projects are investments: you pre-finance delivery, interim payments cover 70%, success pays a margin.", done: gs => (gs.activeProjects||[]).length > 0 || (gs.completedProjects||[]).length > 0 },
  { t:"2 · Hire your first specialist", d:"Open Staff and hire a Communications Director — they recruit members and build influence. Your General Manager can supervise up to 7 people.", done: gs => (gs.roster||[]).length > 1 },
  { t:"3 · End the quarter", d:"Press Next Quarter (or Space). Salaries are paid, projects progress, members pay fees, and rivals move. Hover any stat for its trend.", done: (gs, t0) => gs.turn > t0 },
  { t:"You're on your own now", d:"Expand the network, win political seats, keep the board happy — and keep an eye on the Rivals tab. Good luck. (Full manual under Rules.)", done: () => false },
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
    <div className="event-in" style={{position:"fixed",left:14,bottom:76,zIndex:2600,maxWidth:300,background:P.panel,border:`2px solid ${P.accent}`,borderRadius:10,padding:"12px 14px",boxShadow:"0 8px 30px rgba(10,25,60,.25)"}}>
      <div style={{fontSize:9,fontWeight:700,color:P.accent,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4,fontFamily:"'DM Mono',monospace"}}>Tutorial {step>0?`· ${step}/${TUT_STEPS.length-2}`:""}</div>
      <div style={{fontSize:12,fontWeight:700,color:P.text,marginBottom:4}}>{st.t}</div>
      <div style={{fontSize:10.5,color:P.muted,lineHeight:1.55,marginBottom:8}}>{st.d}</div>
      <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
        <button className="btn" onClick={() => setStep(finish())} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${P.border}`,background:"transparent",color:P.muted,fontSize:10}}>Skip tutorial</button>
        {(step === 0 || step === TUT_STEPS.length-1) && (
          <button className="btn" onClick={() => step === 0 ? setStep(1) : setStep(finish())} style={{padding:"4px 12px",borderRadius:5,border:"none",background:P.accent,color:"#fff",fontSize:10,fontWeight:700}}>{step===0?"Start":"Got it"}</button>
        )}
      </div>
    </div>
  );
}

function Game({ gs, dispatch, vw, auto, setAuto, dark, onTheme, canUndo, onUndo, snd, onSnd, textBig, onTextScale, digestOn, onDigestToggle }) {
  const [digestReopen, setDigestReopen] = useState(0);
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

  const tipCard = showTip && (
    <div style={{position:"absolute",top:10,left:10,right:10,zIndex:50,maxWidth:380,margin:"0 auto",background:P.panel,borderRadius:10,border:`1px solid ${P.accent}55`,boxShadow:"0 6px 24px rgba(20,40,80,.18)",padding:"14px 16px",animation:"fadeUp .2s ease"}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:8,color:P.text}}>Quick orientation</div>
      <div style={{fontSize:11,color:P.muted,lineHeight:1.6,marginBottom:6}}>Watch <b style={{color:P.text}}>Treasury</b>, <b style={{color:P.text}}>Board</b> and the <b style={{color:P.text}}>rival race</b> each quarter. Any one hitting zero, or a rival finishing first, ends the run.</div>
      <div style={{fontSize:11,color:P.muted,lineHeight:1.6,marginBottom:6}}>• The project strip on screen shows each call's status live: green is on track, red is at risk of running out of cash before it finishes.</div>
      <div style={{fontSize:11,color:P.muted,lineHeight:1.6,marginBottom:10}}>• Hire the specialist a project needs before launching it, and tap any country on the map for details.</div>
      <button className="btn" onClick={()=>setShowTip(false)} style={{width:"100%",padding:"9px",borderRadius:7,border:"none",background:P.accent,color:"#fff",fontWeight:700,fontSize:12}}>Got it, let's go <Icon name="arrow-right" size={11} color="#fff" style={{marginLeft:5}}/></button>
    </div>
  );

  const trends = statTrends(gs);
  const TopStat = ({ l, v, c=P.text, icon, tip, trend }) => (
    <div title={tip||undefined} style={{display:"flex",flexDirection:"column",alignItems:"flex-end",cursor:tip?"help":"default"}}>
      <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:P.muted,textTransform:"uppercase",letterSpacing:.5,fontFamily:"'DM Mono',monospace"}}>
        {icon && <Icon name={icon} size={9} color={P.muted}/>}{l}
      </span>
      <span style={{fontSize:15,fontWeight:700,color:c,fontFamily:"'DM Mono',monospace"}}>{v}{trend!=null && <span style={{fontSize:9,marginLeft:4,color:trend>0.05?P.greenText:trend<-0.05?P.redText:P.muted}}>{trend>0.05?"▲":trend<-0.05?"▼":"■"}{trend>=0?"+":""}{Math.round(trend*10)/10}</span>}</span>
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
      {modal==="slots"    && <SaveSlots     gs={gs} onLoad={s => dispatch({type:"loadState", state:s})} onClose={() => setModal(null)}/>}
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
        <span style={{fontSize:9,fontWeight:600,color:badge?darkHex(color,0.6):P.muted}}>{label}</span>
        {badge && <span style={{position:"absolute",top:4,right:"24%",width:7,height:7,borderRadius:"50%",background:color}}/>}
      </button>
    );

    return (
      <div style={{height:"100dvh",background:P.bg,color:P.text,fontFamily:"'Open Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {sharedModals}

        {/* Compact header */}
        <div style={{background:P.panel,borderBottom:`1px solid ${P.border}`,padding:"8px 12px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Icon name={gs.sector?.icon||"display"} size={18} color={gs.sector?.color||P.text}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:gs.sector?.color||P.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{gs.sector?.name}</div>
              <div style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{stage.name}</div>
            </div>
            <button className="btn" onClick={onSnd} title="Toggle sound" style={{padding:"5px 8px",borderRadius:6,border:`1px solid ${P.border}`,background:P.card,display:"inline-flex"}}><Icon name={snd?"volume-high":"volume-xmark"} size={13} color={P.muted}/></button>
            <button className="btn" onClick={onTheme} title="Toggle dark mode" style={{padding:"5px 8px",borderRadius:6,border:`1px solid ${P.border}`,background:P.card,display:"inline-flex"}}><Icon name={dark?"sun":"moon"} size={13} color={P.muted}/></button>
            <button className="btn" onClick={()=>setModal("rules")} title="Game rules" style={{padding:"5px 8px",borderRadius:6,border:`1px solid ${P.border}`,background:P.card,color:P.text,display:"inline-flex"}}><Icon name="circle-question" size={13} color={P.muted}/></button>
            <button className="btn" onClick={()=>setModal("stats")} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${P.border}`,background:P.card,color:P.text,fontSize:11,fontWeight:700}}>Stats ▾</button>
          </div>
          {/* Stat strip */}
          <div style={{display:"flex",gap:10,marginTop:8,overflowX:"auto",paddingBottom:2}}>
            <TopStat l="Period" v={<span key={gs.turn} className="flip-in">{`Q${gs.quarter} ${gs.year}`}</span>} c={P.blue} icon="map"/>
            <TopStat l="Treasury" v={fmt(gs.budget||0)} c={(gs.budget||0)<20000?P.red:P.accent} icon="sack-dollar"/>
            <TopStat l="Members" v={gs.members||0} c={P.gold} icon="users" trend={trends?.members?.delta} tip={trendTitle(trends?.members,"Plus rival poaching, defections and events.")}/>
            <TopStat l="Influence" v={Math.round(gs.prestige||0)} c={P.purple} icon="star" trend={trends?.influence?.delta} tip={trendTitle(trends?.influence,"Plus project deliveries, events, coups.")}/>
            <TopStat l="Board Confidence" v={`${Math.round(gs.boardConf||0)}`} c={(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green} icon="shield-halved" trend={trends?.board?.delta} tip={trendTitle(trends?.board,"Plus completions +3, failures −8..−15, events.")}/>
            <TopStat l="Net Income" v={`${(gs.qNet||0)>=0?"+":""}${fmtN(gs.qNet||0)}`} c={(gs.qNet||0)>=0?P.accent:P.red} icon="chart-line" tip={trendTitle(trends?.budget,"Last quarter's actual cashflow.")}/>
          </div>
        </div>

        {/* Map */}
        <div className="map-sea" style={{flex:1,overflow:"hidden",position:"relative",minHeight:0}}>
          <EUMap gs={gs} sel={sel} setSel={setSel}/>
          <DigestCard gs={gs} digestOn={digestOn} reopenTick={digestReopen} onDigestToggle={onDigestToggle}/>
          <MapLegend gs={gs}/>
          {sel && <div style={{position:"absolute",bottom:8,left:8,fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>tap country again to close</div>}
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
                <button key={`hud-${i}`} className="btn" onClick={()=>setModal("projects")} style={{flexShrink:0,minWidth:128,textAlign:"left",padding:"6px 9px",borderRadius:7,border:`1px solid ${st.color}55`,background:P.card}}>
                  <div style={{fontSize:9,fontWeight:700,color:P.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:128}}>{p.name}</div>
                  <div style={{height:2.5,background:P.bright,borderRadius:2,marginTop:3}}>
                    <div style={{width:`${prog*100}%`,height:"100%",background:st.color,borderRadius:2}}/>
                  </div>
                  <div style={{fontSize:8,color:st.color,marginTop:2,fontFamily:"'DM Mono',monospace"}}>{left}Q · {st.label}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Evolve banner when ready */}
        {ok && (
          <button className="btn" onClick={()=>setModal("evolve")} style={{flexShrink:0,padding:"10px",border:"none",background:`linear-gradient(135deg,${P.gold},${P.orange})`,color:P.text,fontWeight:700,fontSize:14,letterSpacing:.5}}>
            <Icon name="rocket" size={15} color={P.bg} style={{marginRight:7}}/> READY TO EVOLVE <Icon name="arrow-right" size={12} color={P.bg} style={{margin:"0 6px"}}/> {STAGES[Math.min(5,gs.stage+1)].name}
          </button>
        )}

        {/* Primary action row */}
        <div style={{flexShrink:0,display:"flex",gap:8,padding:"8px 10px",background:P.panel,borderTop:`1px solid ${P.border}`}}>
          {gs.pendingEvent ? (
            <button className="btn" onClick={()=>{
                if(gs.pendingEvent?.choices) return; // choices use EventModal buttons
                dispatch({type:"dismissEvent",choiceIdx:null});
              }} style={{flex:1,padding:"13px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.orange},${P.red})`,color:"#fff",fontWeight:700,fontSize:15}}>
              <Icon name="bolt" size={14} color="#fff" style={{marginRight:6}}/> {gs.pendingEvent?.choices ? "Decide below ↑" : "Resolve Event"}
            </button>
          ) : (
            <>
              <button className="btn sheen" onClick={()=>dispatch({type:"nextTurn"})} style={{flex:1,padding:"13px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${P.accent},${P.blue})`,color:P.bg,fontWeight:700,fontSize:15,letterSpacing:.5}}>
                {byRole(gs.roster,"manager")<1 ? "No General Manager — hire one" : <><Icon name="forward" size={14} color={P.bg} style={{marginRight:6}}/>Next Quarter</>}
              </button>
              <button className="btn" onClick={()=>setAuto(a=>!a)} style={{padding:"13px 16px",borderRadius:9,border:`1px solid ${auto?P.accent:P.border}`,background:auto?`${P.accent}22`:P.card,color:auto?P.accent:P.text,fontWeight:700,fontSize:15}}>
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
    <button className="btn" onClick={() => setModal(id)} style={{padding:"8px 15px",borderRadius:7,border:`1px solid ${highlight?`${color}99`:P.border}`,background:highlight?`${color}18`:P.card,color:highlight?darkHex(color,0.6):P.text,fontWeight:700,fontSize:13,fontFamily:"'Montserrat',sans-serif",letterSpacing:.3,display:"flex",alignItems:"center",gap:5}}>
      {label}
    </button>
  );

  return (
    <div style={{height:"100vh",background:P.bg,color:P.text,fontFamily:"'Open Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {sharedModals}

      {/* TOP BAR */}
      <div style={{background:P.panel,borderBottom:`1px solid ${P.border}`,padding:"8px 16px",display:"flex",alignItems:"center",gap:14,flexShrink:0,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Icon name={gs.sector?.icon||"display"} size={18} color={gs.sector?.color||P.text}/>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:gs.sector?.color||P.text}}>{gs.sector?.name||""}</div>
            <div style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{gs.region||""} · {gs.country||""}</div>
          </div>
        </div>
        <div style={{padding:"3px 10px",borderRadius:20,background:`${stage.color}18`,border:`1px solid ${stage.color}44`,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <span style={{width:5,height:5,borderRadius:"50%",background:stage.color,display:"inline-block"}}/>
          <span style={{fontSize:9,fontWeight:700,color:stage.color,letterSpacing:.5,fontFamily:"'DM Mono',monospace"}}>{stage.name}</span>
        </div>
        <button className="btn" onClick={()=>setModal("rules")} title="Game rules" style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",color:P.muted,fontSize:10,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,flexShrink:0}}>
          <Icon name="circle-question" size={12} color={P.muted}/> Rules
        </button>
        <button className="btn" onClick={onTheme} title={dark?"Switch to light mode":"Switch to dark mode"} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name={dark?"sun":"moon"} size={12} color={P.muted}/>
        </button>
        <button className="btn" onClick={onSnd} title={snd?"Mute sound":"Enable sound"} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name={snd?"volume-high":"volume-xmark"} size={12} color={P.muted}/>
        </button>
        <button className="btn" onClick={onTextScale} aria-pressed={textBig} title={textBig?"Normal text size":"Larger text size"} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${textBig?P.accent:P.border}`,background:textBig?`${P.accent}0d`:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name="text-height" size={12} color={textBig?P.accent:P.muted}/>
        </button>
        <button className="btn" onClick={() => gs.digest ? setDigestReopen(t=>t+1) : null} title="Show the latest quarter review" style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name="clipboard-check" size={12} color={P.muted}/>
        </button>
        <button className="btn" onClick={()=>setModal("slots")} title="Save slots" style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",display:"inline-flex",alignItems:"center",flexShrink:0}}>
          <Icon name="floppy-disk" size={12} color={P.muted}/>
        </button>
        {canUndo && (
          <button className="btn" onClick={onUndo} title="Undo last quarter (U) — once per quarter, Junior & Officer only" style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${P.gold}66`,background:`${P.gold}0d`,color:P.goldText,fontSize:10,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,flexShrink:0}}>
            <Icon name="rotate-left" size={11} color={P.goldText}/> Undo
          </button>
        )}
        {gs.pendingEvent && (
          <div style={{fontSize:10,padding:"5px 10px",borderRadius:5,background:`${P.orange}22`,border:`1px solid ${P.orange}55`,color:P.orange,fontFamily:"'DM Mono',monospace",animation:"pulse 1s infinite"}}>
            <Icon name="bolt" size={10} color={P.orange} style={{marginRight:4}}/> EVENT PENDING
          </div>
        )}
        <div style={{marginLeft:"auto",display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <TopStat l="Period"   v={<span key={gs.turn} className="flip-in">{`Q${gs.quarter} ${gs.year}`}</span>}        c={P.blue} icon="map"/>
          <TopStat l="Treasury" v={fmt(gs.budget||0)}                   c={(gs.budget||0)<20000?P.red:P.accent} icon="sack-dollar"/>
          <TopStat l="Members"  v={gs.members||0}                       c={P.gold} icon="users" trend={trends?.members?.delta} tip={trendTitle(trends?.members,"Plus rival poaching, defections and events.")}/>
          <TopStat l="Influence" v={Math.round(gs.prestige||0)}          c={P.purple} icon="star" trend={trends?.influence?.delta} tip={trendTitle(trends?.influence,"Plus project deliveries, events, coups.")}/>
          <TopStat l="Board Confidence" v={`${Math.round(gs.boardConf||0)}%`} c={(gs.boardConf||0)<30?P.red:(gs.boardConf||0)<55?P.orange:P.green} icon="shield-halved" trend={trends?.board?.delta} tip={trendTitle(trends?.board,"Plus completions +3, failures −8..−15, events.")}/>
          <button className="btn" onClick={()=>setAuto(a=>!a)} disabled={!!gs.pendingEvent} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${auto?P.accent:P.border}`,background:auto?`${P.accent}22`:P.card,color:auto?P.accent:P.text,fontWeight:700,fontSize:13}}>
            {auto?<><Icon name="pause" size={12} style={{marginRight:5}}/>Pause Auto-advance</>:<><Icon name="forward" size={12} style={{marginRight:5}}/>Auto-advance</>}
          </button>
          <button
            className="btn sheen"
            onClick={() => dispatch({type:"nextTurn"})}
            disabled={!!gs.pendingEvent}
            style={{padding:"9px 20px",borderRadius:8,border:"none",background:gs.pendingEvent?P.bright:`linear-gradient(135deg,${P.accent},${P.blue})`,color:gs.pendingEvent?P.muted:P.bg,fontWeight:700,fontSize:14,fontFamily:"'Montserrat',sans-serif",letterSpacing:.5}}
          >
            {gs.pendingEvent ? "Resolve Event First" : byRole(gs.roster,"manager")<1 ? "No General Manager — hire one" : <><Icon name="forward" size={13} color={P.bg} style={{marginRight:6}}/>Next Quarter</>}
          </button>
        </div>
      </div>

      {/* MAIN: Left | Map | Right */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <LeftPanel gs={gs} dispatch={dispatch}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div className="map-sea" style={{flex:1,overflow:"hidden",position:"relative"}}>
            <EUMap gs={gs} sel={sel} setSel={setSel}/>
            <DigestCard gs={gs} digestOn={digestOn} reopenTick={digestReopen} onDigestToggle={onDigestToggle}/>
            <MapLegend gs={gs}/>
            {tipCard}
          </div>
          <div style={{background:P.panel,borderTop:`1px solid ${P.border}`,padding:"8px 12px",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",flexShrink:0}}>
            <div style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>
              {(gs.completedProjects||[]).length} done · {(gs.activeProjects||[]).length} running · manage projects, staff and network in the panel on the right
            </div>
            <div style={{flex:1}}/>
            <BotBtn id="evolve" label={ok ? <><Icon name="rocket" size={13} color={P.gold}/> EVOLVE NOW</> : <><Icon name="lock" size={13} color={P.muted}/> Evolve</>} color={ok?P.gold:P.muted} highlight={ok}/>
          </div>
        </div>
        {/* RIGHT DOCK: Projects / Staff / Network tabs + compact activity & log */}
        <div style={{width:vw>=1440?420:vw>=1150?372:320,flexShrink:0,display:"flex",flexDirection:"column",background:P.panel,borderLeft:`1px solid ${P.border}`,overflow:"hidden"}}>
          <div style={{display:"flex",flexShrink:0,borderBottom:`1px solid ${P.border}`}}>
            {[["projects","folder-open","Projects",P.blue],["staff","users","Staff",P.purple],["network","earth-europe","Network",P.teal],["rivals","chess-knight","Rivals",P.red]].map(([id,icon,lbl,col]) => (
              <button key={id} className="btn" onClick={()=>setRightTab(id)} aria-pressed={rightTab===id}
                style={{flex:1,padding:"9px 4px",border:"none",borderBottom:`2px solid ${rightTab===id?col:"transparent"}`,background:rightTab===id?`${col}0d`:"transparent",color:rightTab===id?darkHex(col,0.6):P.muted,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <Icon name={icon} size={12} color={rightTab===id?col:P.muted}/>{lbl}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            <div key={rightTab} className="panel-fade">
              {rightTab==="projects" && <ProjectsModal gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
              {rightTab==="staff"    && <StaffModal    gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
              {rightTab==="network"  && <NetworkModal  gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
              {rightTab==="rivals"   && <RivalsModal   gs={gs} dispatch={dispatch} onClose={()=>{}} panel/>}
            </div>
          </div>
          <RightPanel gs={gs} compact/>
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
  const copyChallenge = () => { try { navigator.clipboard?.writeText(challengeCode(gs)); } catch(e) {} };
  const hist = gs.history||[];
  return (
    <div style={{height:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",color:P.text,fontFamily:"'Open Sans',sans-serif",padding:20,overflowY:"auto"}}>
      <div style={{textAlign:"center",maxWidth:620,maxHeight:"100%",overflowY:"auto",padding:"20px 4px"}}>
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><Icon name={won?"trophy":rival?"flag":"money-bill-wave"} size={64} color={won?P.gold:rival?P.red:P.muted}/></div>
        <h1 style={{fontSize:44,fontWeight:700,color:won?P.accent:P.red,marginBottom:12,letterSpacing:-1}}>
          {won ? (gs.winType==="consolidation" ? "Market Consolidation!" : "Pan-European Cluster Network!") : rival ? `Outpaced by ${rival}` : "Cluster Dissolved"}
        </h1>
        <p style={{fontSize:14,color:P.muted,marginBottom:30,lineHeight:1.7}}>
          {won
            ? `You unified all EU clusters after ${gs.turn} quarters (${yrs} years). The ${gs.sector?.name||""} sector now speaks with one European voice.`
            : rival
            ? `${rival} formed a Pan-European Cluster Network after ${gs.turn} quarters while you reached ${STAGES[gs.stage]?.name||""}. Europe consolidated without you.`
            : `Your cluster ran out of resources after ${gs.turn} quarters. Final stage: ${STAGES[gs.stage]?.name||""}.`}
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:30}}>
          {[
            [fmt(gs.budget||0),           "Final Budget",     P.accent],
            [fmtN(gs.members||0),         "Members",          P.gold],
            [STAGES[gs.stage]?.name||"",  "Final Stage",      STAGES[gs.stage]?.color||P.text],
            [(gs.completedProjects||[]).length+"","Projects Done",P.blue],
            [(gs.countries||[]).length+" countries","Network", P.teal],
            [gs.turn+"Q / "+yrs+"yrs",    "Total Time",       P.muted],
            [fmt(gs.peak?.budget||gs.budget||0), "Peak Treasury", P.green],
            [(gs.rivalsGone||0)+"",       "Rivals Eliminated", P.red],
            [seatsHeld(gs)+" / 3",        "Seats Held",       P.purple],
          ].map(([v,l,c]) => (
            <div key={l} style={{background:P.panel,borderRadius:10,padding:"14px 12px",border:`1px solid ${P.border}`}}>
              <div style={{fontSize:18,fontWeight:700,color:c,fontFamily:"'DM Mono',monospace"}}>{v}</div>
              <div style={{fontSize:9,color:P.muted,marginTop:4,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
            </div>
          ))}
        </div>
        {/* ── REPORT CARD ── */}
        <div className="modal-in" style={{background:P.panel,border:`2px solid ${gradeCol}`,borderRadius:12,padding:"14px 18px",marginBottom:18,textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
            <div style={{fontSize:44,fontWeight:800,color:gradeCol,fontFamily:"'Montserrat',sans-serif",lineHeight:1}}>{grade}</div>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'DM Mono',monospace"}}>Campaign Report Card</div>
              <div style={{fontSize:16,fontWeight:700,color:P.text,fontFamily:"'DM Mono',monospace"}}>{fmtN(score)} points</div>
              <div style={{fontSize:9.5,color:P.muted}}>{scen.name} · {DIFFICULTIES[gs.difficulty]?.label||gs.difficulty}{gs.seedStr?` · seed "${gs.seedStr}"`:""}</div>
            </div>
          </div>
          {hist.length >= 3 && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"4px 12px",marginBottom:10}}>
              {[["Treasury","b",P.accent],["Members","m",P.gold],["Influence","p",P.purple],["Board","bc",P.green]].map(([lbl,k,col]) => (
                <div key={k}>
                  <div style={{fontSize:8.5,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{lbl}</div>
                  <Sparkline data={hist.map(x=>x[k]||0)} color={col} w={120} h={24}/>
                </div>
              ))}
            </div>
          )}
          <div style={{fontSize:9,fontWeight:700,color:P.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontFamily:"'DM Mono',monospace"}}>Achievements · {Object.keys(achvAll).length}/{ACHIEVEMENTS.length}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            {ACHIEVEMENTS.map(a => {
              const got = !!achvAll[a.id];
              return <span key={a.id} title={`${a.name}: ${a.desc}`} style={{fontSize:9,padding:"3px 8px",borderRadius:4,fontFamily:"'DM Mono',monospace",border:`1px solid ${got?P.gold+"88":P.border}`,background:got?`${P.gold}14`:"transparent",color:got?P.goldText:P.muted,opacity:got?1:0.55}}>{got?"★ ":""}{a.name}</span>;
            })}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn" onClick={copyChallenge} title="Copies a CM1|… code: a friend can paste it on the setup screen and play the identical campaign, then compare report cards"
              style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${P.accent}66`,background:`${P.accent}0d`,color:P.accent,fontSize:10,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
              <Icon name="chess-knight" size={10} color={P.accent} style={{marginRight:5}}/>Copy challenge code
            </button>
            {hist.length >= 2 && (
              <button className="btn" onClick={() => downloadCSV(gs)} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${P.border}`,background:"transparent",color:P.muted,fontSize:10,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>Export run as CSV ⬇</button>
            )}
          </div>
        </div>
        <button className="btn" onClick={onRestart} style={{padding:"14px 48px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${P.accent},${P.blue})`,color:P.bg,fontWeight:700,fontSize:18,fontFamily:"'Montserrat',sans-serif"}}>
          Play Again
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
  if (!s.mix) s = { ...s, mix: defaultMix(s.members||0) };
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

/* ═══ SaveSlots panel (shown in-game via the Log/menu and on Setup) ═══ */
function SaveSlots({ gs, onClose, onLoad }) {
  const [slots, setSlots] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => readSlots().then(setSlots);
  useEffect(() => { refresh(); }, []);
  const doSave = async i => { setBusy(true); await saveToSlot(i, gs); await refresh(); setBusy(false); };
  const doLoad = async i => { const s = await loadSlot(i); if (s && onLoad) onLoad(s); };
  return (
    <Modal title="Save Slots" icon="floppy-disk" iconColor={P.accent} onClose={onClose} width={440}>
      <div style={{fontSize:11,color:P.muted,marginBottom:10,lineHeight:1.5}}>Your game autosaves continuously. These three slots are manual checkpoints you can return to — handy before a risky expansion or a new scenario.</div>
      {!slots ? <div style={{color:P.muted,fontSize:12}}>Loading…</div> : slots.map(s => (
        <div key={s.i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",marginBottom:6,borderRadius:8,border:`1px solid ${P.border}`,background:P.card}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:s.empty?P.muted:P.text}}>{s.empty ? `Slot ${s.i+1} — empty` : s.label}</div>
            {!s.empty && <div style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{STAGES[s.stage]?.name} · Q{s.q} {s.year}</div>}
          </div>
          {gs && <button className="btn" disabled={busy} onClick={()=>doSave(s.i)} style={{padding:"5px 11px",borderRadius:5,border:`1px solid ${P.accent}66`,background:`${P.accent}0d`,color:P.accent,fontSize:11,fontWeight:700}}>Save here</button>}
          {!s.empty && onLoad && <button className="btn" onClick={()=>doLoad(s.i)} style={{padding:"5px 11px",borderRadius:5,border:`1px solid ${P.border}`,background:"transparent",color:P.text,fontSize:11,fontWeight:700}}>Load</button>}
        </div>
      ))}
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

  function startNew(c, r, s, d, scenarioId="classic", seedStr="") {
    setAuto(false); clearSave(); undoRef.current = null;
    const scen = SCENARIOS.find(x => x.id === scenarioId) || SCENARIOS[0];
    const R = Math.random;
    if (seedStr) Math.random = mulberry32(hashSeed(seedStr)); // seeded: identical campaign start for shared challenges
    let g = initState(c, r, s, d);
    if (scen.apply) g = scen.apply(g);
    Math.random = R;
    g = { ...g, scenario: scen.id, seedStr };
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
