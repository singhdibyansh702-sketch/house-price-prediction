# PropIntel AI • Advanced Real Estate Valuation Engine & Smart Discovery (India)

A modern, clean, zero-dependency property price prediction web platform with an **Interactive Leaflet Map** and a **Natural Language Property Chatbot**, calibrated specifically for the Indian real estate market (INR / ₹). Designed as a college mini-project: simple, robust, well-structured, and easy to explain in a viva examination.

---

## 🚀 Key Features

### 1. Interactive Valuation Studio (Existing ML Engine)
- **Calibrated Indian Real Estate Model**: Formatted in Indian Rupees (`₹`), with automatic **Lakhs & Crores** denominations.
- **Locality Multipliers**: Bengaluru (₹7.2k/sqft), Mumbai (₹12.8k/sqft), Delhi NCR (₹8.9k/sqft), Hyderabad (₹6.4k/sqft), and Pune (₹5.8k/sqft).
- **Physical & Spatial Drivers**: Super built-up area (sq ft), BHK bedrooms, bathrooms, and property age depreciation.
- **Value-Driver Amenities**: Toggles for Clubhouse/Pool (+5%), 24/7 Security (+3%), Metro proximity (+6%), Covered Parking (+4%), Vastu compliance (+2.5%), and High Floor rise (+3.5%).
- **Financial Intelligence**: Instant estimation of **Monthly Home Loan EMI** (@ 8.5% p.a.) and **Rental Yield**.

### 2. Natural Language AI Property Chatbot
- **Conversational Query Parsing**: Accepts everyday natural language requirements, e.g.:
  - *"I want a 2 BHK in Mumbai under 80 lakh near metro."*
  - *"I want a 3 BHK house in Mumbai near school, hospital and metro."*
  - *"Looking for 3 BHK in Bengaluru near metro and hospital"*
- **Intelligent Parameter Extraction**:
  - **BHK**: Identifies 1, 2, 3, 4, 5 BHK configurations.
  - **Location**: Resolves target metro (Mumbai, Bengaluru, Delhi NCR, Hyderabad, Pune).
  - **Budget**: Automatically parses Lakhs and Crores (e.g. `under 80 lakh`, `below 1.5 cr`).
  - **Nearby Facilities**: Identifies preferences for schools, hospitals, metro, railway stations, and airport.
  - **Property Formats**: Detects apartments, builder floors, or villas/houses.
- **Conversational Flow & Follow-ups**: If the user omits essential information (like location), the chatbot asks a friendly follow-up: *"Which location or city are you interested in?"* and remembers previous preferences!
- **Quick Demo Prompt Chips**: Instant 1-click test queries for live viva presentations.

### 3. Interactive Leaflet + OpenStreetMap
- **Zero API Key Requirement**: Uses free OpenStreetMap tiles via Leaflet.js.
- **Facility Markers**: When any property is selected, the map highlights:
  - 🏠 **Property Location** (Indigo Pin)
  - 🏫 **Nearby School** (Green Pin)
  - 🏥 **Nearby Hospital** (Red Pin)
  - 🚇 **Nearby Metro Station** (Blue Pin)
  - 🚆 **Nearby Railway Station** (Purple Pin)
  - ✈️ **Nearby Airport** (Amber Pin)
- **Interactive Marker Popups**: Clicking any marker reveals the place name and approximate distance from the property.
- **Distance Breakdown Grid**: Clickable facility cards below the map that zoom directly into the landmark.
- **Fit View Control**: One-click control to smoothly frame the property and all 5 nearby facilities.

### 4. Seamless Model Connection
- **Unified Prediction Logic**: All search results and property cards compute their prices directly via the core `calculateValuation()` engine.
- **Two-way Synchronization**: Clicking **"Load in Studio"** on any property card auto-populates the valuation form parameters and triggers a live recalculation.

---

## 🛠️ Tech Stack

- **HTML5**: Semantic accessible layout with clear section hierarchy.
- **Vanilla CSS3**: Modern light-theme design system with custom properties, responsive grid, and zero CSS frameworks.
- **Vanilla JavaScript (ES6+)**: Zero build tools, modular functions, and lightweight rule-based NLP.
- **Leaflet.js & OpenStreetMap**: Free, client-side interactive mapping.

---

## 💻 Running Locally

1. Open a terminal in the project directory:
   ```bash
   cd "House price prediction ml"
   ```
2. Start a simple local server:
   ```bash
   # Using Python 3:
   python -m http.server 5500
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:5500
   ```

---

## 🎓 College Viva & Examination Q&A Guide

| Question | Viva-Ready Explanation |
| :--- | :--- |
| **How does the price prediction model work?** | We use a hedonic regression pricing model: `Valuation = (Base Rate × SqFt × Type Multiplier + Room Value) × (1 + Amenities Bonus) × (1 - Depreciation)`. The base rate varies by city locality, and age depreciates value by 1.2% per year up to 25%. |
| **How is the chatbot implemented?** | It uses a rule-based NLP pipeline with regular expressions and token keyword matching. It extracts BHK, location, budget in Lakhs/Crores, and desired amenities, maintains multi-turn state memory for missing fields, and filters the property dataset. |
| **How do you calculate distance to nearby landmarks?** | We use the **Haversine formula** to calculate the great-circle distance between two latitude/longitude pairs on a spherical Earth: $d = 2R \arcsin\left(\sqrt{\sin^2(\frac{\Delta \phi}{2}) + \cos \phi_1 \cos \phi_2 \sin^2(\frac{\Delta \lambda}{2})}\right)$. |
| **Why use Leaflet + OpenStreetMap instead of Google Maps API?** | Leaflet with OpenStreetMap is free, open-source, requires no credit card or API keys, and has zero quota restrictions or billing risks, making it ideal for college mini-projects. |
| **How does the chatbot connect to the existing model?** | Both the interactive form and the chatbot property search call the exact same `calculateValuation()` function in `app.js`. Every matching property is dynamically priced through the model. |

