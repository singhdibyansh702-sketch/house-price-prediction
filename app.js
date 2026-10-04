/**
 * PropIntel AI • Interactive Client Controller
 * Powers bidirectional sliders, segmented controls, amenities multipliers,
 * real-time valuation calculations in INR, EMI estimation, and count-up animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const form = document.getElementById('valuationForm');
  const predictBtn = document.getElementById('predictBtn');
  const resetBtn = document.getElementById('resetDefaults');

  // Inputs
  const citySelect = document.getElementById('citySelect');
  const typePills = document.querySelectorAll('.type-pill');
  const sqftInput = document.getElementById('sqftInput');
  const sqftSlider = document.getElementById('sqftSlider');
  const bhkButtons = document.querySelectorAll('#bhkSelector .seg-btn');
  const bathButtons = document.querySelectorAll('#bathSelector .seg-btn');
  const ageSlider = document.getElementById('ageSlider');
  const ageStatusLabel = document.getElementById('ageStatusLabel');
  
  // Amenities Checkboxes
  const amenityPool = document.getElementById('amenityPool');
  const amenitySecurity = document.getElementById('amenitySecurity');
  const amenityMetro = document.getElementById('amenityMetro');
  const amenityParking = document.getElementById('amenityParking');
  const amenityVastu = document.getElementById('amenityVastu');
  const amenityFloorRise = document.getElementById('amenityFloorRise');

  // Archetype Presets
  const archetypeBtns = document.querySelectorAll('.archetype-btn');

  // Output Displays
  const priceValue = document.getElementById('priceValue');
  const wordValueBadge = document.getElementById('wordValueBadge');
  const localityEchoText = document.getElementById('localityEchoText');
  const rangeMin = document.getElementById('rangeMin');
  const rangeMax = document.getElementById('rangeMax');
  const sqftRateDisplay = document.getElementById('sqftRateDisplay');
  const emiDisplay = document.getElementById('emiDisplay');
  const rentDisplay = document.getElementById('rentDisplay');
  const liveTimestamp = document.getElementById('liveTimestamp');

  // State
  let currentPropertyType = 'floor'; // apartment, floor, villa
  let currentBhk = 3;
  let currentBaths = 3;

  /**
   * Format number in Indian Numbering System (without currency symbol)
   */
  const formatIndianNumber = (val) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(Math.round(val));
  };

  /**
   * Convert number into Indian currency words (Lakhs & Crores)
   */
  const formatIndianWords = (val) => {
    if (val >= 10000000) {
      const cr = (val / 10000000).toFixed(2);
      return `₹${cr} Crore`;
    } else if (val >= 100000) {
      const lakh = (val / 100000).toFixed(2);
      return `₹${lakh} Lakh`;
    }
    return `₹${formatIndianNumber(val)}`;
  };

  /**
   * Update slider background fill dynamically
   */
  const updateSliderVisual = (slider, min, max) => {
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-pct', `${pct}%`);
  };

  /**
   * Descriptive condition label for age
   */
  const getAgeLabel = (age) => {
    if (age === 0) return 'Brand New (Ready to Move)';
    if (age <= 2) return `${age} Years (Newly Constructed)`;
    if (age <= 5) return `${age} Years (Well Maintained)`;
    if (age <= 12) return `${age} Years (Mature Construction)`;
    return `${age} Years (Established Legacy)`;
  };

  /**
   * Core Calibrated Indian ML Valuation Engine
   * Evaluates the active UI form (when params is null) or any given property specification object.
   */
  const calculateValuation = (params = null) => {
    let baseRatePerSqft = 7200;
    let sqft = 1850;
    let age = 4;
    let propType = currentPropertyType;
    let bhk = currentBhk;
    let baths = currentBaths;

    let hasPool = amenityPool && amenityPool.checked;
    let hasSecurity = amenitySecurity && amenitySecurity.checked;
    let hasMetro = amenityMetro && amenityMetro.checked;
    let hasParking = amenityParking && amenityParking.checked;
    let hasVastu = amenityVastu && amenityVastu.checked;
    let hasFloorRise = amenityFloorRise && amenityFloorRise.checked;

    if (params) {
      const cityRates = {
        mumbai: 12800,
        bengaluru: 7200,
        delhi: 8900,
        hyderabad: 6400,
        pune: 5800
      };
      baseRatePerSqft = cityRates[params.city] || 7200;
      sqft = params.sqft || 1850;
      age = (params.age !== undefined) ? params.age : 4;
      propType = params.type || 'apartment';
      bhk = params.bhk || 2;
      baths = params.baths || 2;

      if (params.amenities) {
        hasPool = !!params.amenities.pool;
        hasSecurity = !!params.amenities.security;
        hasMetro = !!params.amenities.metro;
        hasParking = !!params.amenities.parking;
        hasVastu = !!params.amenities.vastu;
        hasFloorRise = !!params.amenities.floorRise;
      }
    } else {
      const selectedCityOption = citySelect.options[citySelect.selectedIndex];
      baseRatePerSqft = parseFloat(selectedCityOption.dataset.rate) || 7200;
      sqft = parseFloat(sqftInput.value) || 1850;
      age = parseFloat(ageSlider.value) || 4;
      propType = currentPropertyType;
      bhk = currentBhk;
      baths = currentBaths;
    }

    // Structural Type Multiplier
    let typeMultiplier = 1.0;
    if (propType === 'apartment') typeMultiplier = 0.96;
    if (propType === 'floor') typeMultiplier = 1.05;
    if (propType === 'villa') typeMultiplier = 1.25;

    // Base area value
    let baseAreaValue = sqft * baseRatePerSqft * typeMultiplier;

    // Room configurations
    const roomValue = (bhk * 420000) + (baths * 210000);

    // Amenities impact (+% on base)
    let amenitiesBonusPct = 0;
    if (hasPool) amenitiesBonusPct += 0.05;
    if (hasSecurity) amenitiesBonusPct += 0.03;
    if (hasMetro) amenitiesBonusPct += 0.06;
    if (hasParking) amenitiesBonusPct += 0.04;
    if (hasVastu) amenitiesBonusPct += 0.025;
    if (hasFloorRise) amenitiesBonusPct += 0.035;

    // Age depreciation (1.2% per year up to 25%)
    const depreciationPct = Math.min(age * 0.012, 0.25);

    // Total Calculation
    let valuation = (baseAreaValue + roomValue) * (1 + amenitiesBonusPct) * (1 - depreciationPct);

    // Round to nearest 10,000
    valuation = Math.max(1800000, Math.round(valuation / 10000) * 10000);

    return {
      total: valuation,
      ratePerSqft: Math.round(valuation / sqft),
      lower: Math.round((valuation * 0.96) / 10000) * 10000,
      upper: Math.round((valuation * 1.04) / 10000) * 10000,
      // 80% Loan, 8.5% interest, 20 yrs: Monthly EMI multiplier approx ~0.008678 on loan amount
      emi: Math.round((valuation * 0.80) * 0.008678),
      // Rental yield ~3.6% annual
      rent: Math.round((valuation * 0.036) / 12 / 100) * 100
    };
  };

  /**
   * Animate number count-up
   */
  let currentAnimationId = null;
  const animateValue = (start, end, duration = 400) => {
    if (currentAnimationId) cancelAnimationFrame(currentAnimationId);

    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + (end - start) * ease);

      priceValue.textContent = formatIndianNumber(val);

      if (progress < 1) {
        currentAnimationId = requestAnimationFrame(update);
      } else {
        wordValueBadge.textContent = formatIndianWords(end);
      }
    };
    currentAnimationId = requestAnimationFrame(update);
  };

  /**
   * Refresh all dashboard indicators
   */
  const refreshDashboard = (animate = false) => {
    const res = calculateValuation();

    const selectedCityName = citySelect.options[citySelect.selectedIndex].text.split('(')[0].trim();
    if (localityEchoText) localityEchoText.textContent = selectedCityName;

    const currentVal = parseInt(priceValue.textContent.replace(/[^0-9]/g, ''), 10) || 15480000;

    if (animate) {
      animateValue(currentVal, res.total, 450);
    } else {
      priceValue.textContent = formatIndianNumber(res.total);
      wordValueBadge.textContent = formatIndianWords(res.total);
    }

    rangeMin.textContent = formatIndianWords(res.lower);
    rangeMax.textContent = formatIndianWords(res.upper);
    sqftRateDisplay.textContent = `₹${formatIndianNumber(res.ratePerSqft)}`;
    emiDisplay.innerHTML = `₹${formatIndianNumber(res.emi)}<small>/mo</small>`;
    rentDisplay.innerHTML = `₹${formatIndianNumber(res.rent)}<small>/mo</small>`;

    const now = new Date();
    liveTimestamp.textContent = `Updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // --- Event Bindings ---

  // 1. Sqft Slider & Input Sync
  sqftSlider.addEventListener('input', () => {
    sqftInput.value = sqftSlider.value;
    updateSliderVisual(sqftSlider, 400, 8000);
    refreshDashboard(false);
  });

  sqftInput.addEventListener('input', () => {
    let val = parseFloat(sqftInput.value) || 400;
    if (val > 8000) val = 8000;
    sqftSlider.value = val;
    updateSliderVisual(sqftSlider, 400, 8000);
    refreshDashboard(false);
  });

  // 2. Age Slider & Label Sync
  ageSlider.addEventListener('input', () => {
    const val = parseInt(ageSlider.value, 10);
    ageStatusLabel.textContent = getAgeLabel(val);
    updateSliderVisual(ageSlider, 0, 30);
    refreshDashboard(false);
  });

  // 3. City Selection
  citySelect.addEventListener('change', () => {
    refreshDashboard(true);
  });

  // 4. Property Type Pills
  typePills.forEach(pill => {
    pill.addEventListener('click', () => {
      typePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPropertyType = pill.dataset.type;
      refreshDashboard(true);
    });
  });

  // 5. BHK Buttons
  bhkButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bhkButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBhk = parseInt(btn.dataset.val, 10);
      refreshDashboard(true);
    });
  });

  // 6. Bath Buttons
  bathButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bathButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBaths = parseInt(btn.dataset.val, 10);
      refreshDashboard(true);
    });
  });

  // 7. Amenities Toggles
  const amenityCheckboxes = [amenityPool, amenitySecurity, amenityMetro, amenityParking, amenityVastu, amenityFloorRise];
  amenityCheckboxes.forEach(cb => {
    if (cb) {
      cb.addEventListener('change', () => {
        refreshDashboard(true);
      });
    }
  });

  // 8. Archetype Preset Buttons
  archetypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      archetypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Populate values
      sqftInput.value = btn.dataset.sqft;
      sqftSlider.value = btn.dataset.sqft;
      updateSliderVisual(sqftSlider, 400, 8000);

      ageSlider.value = btn.dataset.age;
      ageStatusLabel.textContent = getAgeLabel(parseInt(btn.dataset.age, 10));
      updateSliderVisual(ageSlider, 0, 30);

      // Set City
      citySelect.value = btn.dataset.city;

      // Set Type
      currentPropertyType = btn.dataset.type;
      typePills.forEach(p => {
        p.classList.toggle('active', p.dataset.type === currentPropertyType);
      });

      // Set BHK
      currentBhk = parseInt(btn.dataset.beds, 10);
      bhkButtons.forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.val, 10) === currentBhk);
      });

      // Set Baths
      currentBaths = parseInt(btn.dataset.baths, 10);
      bathButtons.forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.val, 10) === currentBaths);
      });

      refreshDashboard(true);
    });
  });

  // 9. Reset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (archetypeBtns[0]) archetypeBtns[0].click();
    });
  }

  // 10. Explicit CTA Button (Simulates heavy ML model re-run)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    predictBtn.classList.add('is-loading');

    setTimeout(() => {
      predictBtn.classList.remove('is-loading');
      refreshDashboard(true);
    }, 450);
  });

  // ==========================================================================
  // SECTION 2 & 3: REAL ESTATE DATASET, CHATBOT NLP & INTERACTIVE MAP
  // ==========================================================================

  /**
   * Verified Residential Property Dataset for Indian Metros
   * Complete with real coordinates, architectural features, and nearby facilities:
   * School, Hospital, Metro, Railway Station, and Airport.
   */
  const PROPERTIES_DATASET = [
    // --- Mumbai ---
    {
      id: 'mum-1',
      name: 'Malad Metro Residency',
      city: 'mumbai',
      cityName: 'Mumbai',
      locality: 'Malad West, Link Road',
      coords: [19.1860, 72.8485],
      bhk: 2,
      baths: 1,
      sqft: 490,
      type: 'apartment',
      age: 8,
      amenities: { pool: false, security: true, metro: true, parking: false, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'Vibgyor High School', coords: [19.1830, 72.8450], distanceKm: 0.4 },
        { type: 'hospital', name: 'Zenith Multi Speciality Hospital', coords: [19.1890, 72.8510], distanceKm: 0.5 },
        { type: 'metro', name: 'Malad West Metro Line 2A', coords: [19.1870, 72.8495], distanceKm: 0.2 },
        { type: 'railway', name: 'Malad Western Railway Station', coords: [19.1875, 72.8565], distanceKm: 0.9 },
        { type: 'airport', name: 'CSM International Airport Mumbai', coords: [19.0896, 72.8656], distanceKm: 11.8 }
      ]
    },
    {
      id: 'mum-2',
      name: 'Dahisar Metro Heights',
      city: 'mumbai',
      cityName: 'Mumbai',
      locality: 'Dahisar East, Highway Access',
      coords: [19.2550, 72.8640],
      bhk: 2,
      baths: 2,
      sqft: 530,
      type: 'apartment',
      age: 7,
      amenities: { pool: false, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'St. Louis High School', coords: [19.2520, 72.8610], distanceKm: 0.5 },
        { type: 'hospital', name: 'Crystal Hospital Dahisar', coords: [19.2580, 72.8670], distanceKm: 0.6 },
        { type: 'metro', name: 'Anand Nagar Metro Station Line 2A', coords: [19.2565, 72.8655], distanceKm: 0.3 },
        { type: 'railway', name: 'Dahisar Railway Station', coords: [19.2510, 72.8580], distanceKm: 1.1 },
        { type: 'airport', name: 'CSM International Airport Mumbai', coords: [19.0896, 72.8656], distanceKm: 16.2 }
      ]
    },
    {
      id: 'mum-3',
      name: 'Powai Lakeview Heights',
      city: 'mumbai',
      cityName: 'Mumbai',
      locality: 'Hiranandani Gardens, Powai',
      coords: [19.1176, 72.9060],
      bhk: 3,
      baths: 3,
      sqft: 1420,
      type: 'apartment',
      age: 2,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: true },
      nearbyFacilities: [
        { type: 'school', name: 'Hiranandani Foundation School', coords: [19.1190, 72.9085], distanceKm: 0.3 },
        { type: 'hospital', name: 'Dr L H Hiranandani Hospital', coords: [19.1150, 72.9110], distanceKm: 0.6 },
        { type: 'metro', name: 'IIT Powai Metro Station', coords: [19.1220, 72.9045], distanceKm: 0.5 },
        { type: 'railway', name: 'Kanjurmarg Central Railway Station', coords: [19.1285, 72.9280], distanceKm: 2.4 },
        { type: 'airport', name: 'CSM International Airport Mumbai', coords: [19.0896, 72.8656], distanceKm: 7.2 }
      ]
    },
    {
      id: 'mum-4',
      name: 'Bandra SeaBreeze House',
      city: 'mumbai',
      cityName: 'Mumbai',
      locality: 'Pali Hill, Bandra West',
      coords: [19.0620, 72.8270],
      bhk: 3,
      baths: 3,
      sqft: 1850,
      type: 'villa',
      age: 5,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'St. Stanislaus High School', coords: [19.0580, 72.8310], distanceKm: 0.6 },
        { type: 'hospital', name: 'Lilavati Hospital & Research Centre', coords: [19.0510, 72.8290], distanceKm: 1.2 },
        { type: 'metro', name: 'Bandra Metro Station', coords: [19.0590, 72.8360], distanceKm: 0.9 },
        { type: 'railway', name: 'Bandra Terminus Railway Station', coords: [19.0625, 72.8420], distanceKm: 1.6 },
        { type: 'airport', name: 'CSM International Airport Mumbai', coords: [19.0896, 72.8656], distanceKm: 8.5 }
      ]
    },
    {
      id: 'mum-5',
      name: 'Andheri Courtyard Suites',
      city: 'mumbai',
      cityName: 'Mumbai',
      locality: 'Lokhandwala, Andheri West',
      coords: [19.1410, 72.8280],
      bhk: 1,
      baths: 1,
      sqft: 450,
      type: 'apartment',
      age: 6,
      amenities: { pool: false, security: true, metro: true, parking: false, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'Lokhandwala Foundation School', coords: [19.1435, 72.8310], distanceKm: 0.4 },
        { type: 'hospital', name: 'Kokilaben Dhirubhai Ambani Hospital', coords: [19.1310, 72.8285], distanceKm: 1.1 },
        { type: 'metro', name: 'D.N. Nagar Metro Station', coords: [19.1305, 72.8355], distanceKm: 0.7 },
        { type: 'railway', name: 'Andheri Western Railway Station', coords: [19.1197, 72.8464], distanceKm: 2.8 },
        { type: 'airport', name: 'CSM International Airport Mumbai', coords: [19.0896, 72.8656], distanceKm: 7.5 }
      ]
    },

    // --- Bengaluru ---
    {
      id: 'blr-1',
      name: 'Whitefield Green Meadows',
      city: 'bengaluru',
      cityName: 'Bengaluru',
      locality: 'Whitefield, ITPL Main Road',
      coords: [12.9850, 77.7340],
      bhk: 2,
      baths: 2,
      sqft: 950,
      type: 'apartment',
      age: 4,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'The Deens Academy', coords: [12.9730, 77.7450], distanceKm: 1.2 },
        { type: 'hospital', name: 'Manipal Hospital Whitefield', coords: [12.9810, 77.7380], distanceKm: 0.6 },
        { type: 'metro', name: 'Hopefarm Metro Station', coords: [12.9840, 77.7530], distanceKm: 0.4 },
        { type: 'railway', name: 'Whitefield Railway Station', coords: [12.9960, 77.7610], distanceKm: 2.9 },
        { type: 'airport', name: 'Kempegowda International Airport', coords: [13.1986, 77.7066], distanceKm: 29.5 }
      ]
    },
    {
      id: 'blr-2',
      name: 'Indiranagar Prestige Boulevard',
      city: 'bengaluru',
      cityName: 'Bengaluru',
      locality: 'Indiranagar 100ft Road',
      coords: [12.9784, 77.6408],
      bhk: 3,
      baths: 3,
      sqft: 1850,
      type: 'floor',
      age: 3,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'National Public School Indiranagar', coords: [12.9750, 77.6430], distanceKm: 0.4 },
        { type: 'hospital', name: 'Chinmaya Mission Hospital', coords: [12.9805, 77.6385], distanceKm: 0.3 },
        { type: 'metro', name: 'Indiranagar Purple Line Metro', coords: [12.9784, 77.6387], distanceKm: 0.2 },
        { type: 'railway', name: 'KSR Bengaluru City Railway Station', coords: [12.9781, 77.5695], distanceKm: 7.8 },
        { type: 'airport', name: 'Kempegowda International Airport', coords: [13.1986, 77.7066], distanceKm: 32.0 }
      ]
    },
    {
      id: 'blr-3',
      name: 'HSR Sector 2 Gardenia Villa',
      city: 'bengaluru',
      cityName: 'Bengaluru',
      locality: 'HSR Layout, Sector 2',
      coords: [12.9121, 77.6446],
      bhk: 4,
      baths: 4,
      sqft: 2800,
      type: 'villa',
      age: 4,
      amenities: { pool: true, security: true, metro: false, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'Cambridge Public School HSR', coords: [12.9140, 77.6420], distanceKm: 0.4 },
        { type: 'hospital', name: 'Narayana Multispeciality Hospital', coords: [12.9090, 77.6490], distanceKm: 0.6 },
        { type: 'metro', name: 'Silk Board Metro Station', coords: [12.9175, 77.6235], distanceKm: 2.4 },
        { type: 'railway', name: 'Carmelaram Railway Station', coords: [12.9130, 77.7010], distanceKm: 6.2 },
        { type: 'airport', name: 'Kempegowda International Airport', coords: [13.1986, 77.7066], distanceKm: 38.0 }
      ]
    },
    {
      id: 'blr-4',
      name: 'Electronic City Horizon',
      city: 'bengaluru',
      cityName: 'Bengaluru',
      locality: 'Electronic City Phase 1',
      coords: [12.8399, 77.6770],
      bhk: 2,
      baths: 2,
      sqft: 880,
      type: 'apartment',
      age: 5,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'Sorsfort International School', coords: [12.8450, 77.6710], distanceKm: 0.8 },
        { type: 'hospital', name: 'Cloudnine Hospital E-City', coords: [12.8420, 77.6740], distanceKm: 0.4 },
        { type: 'metro', name: 'Electronic City Yellow Line Metro', coords: [12.8410, 77.6755], distanceKm: 0.3 },
        { type: 'railway', name: 'Heelalige Railway Station', coords: [12.8250, 77.7210], distanceKm: 5.1 },
        { type: 'airport', name: 'Kempegowda International Airport', coords: [13.1986, 77.7066], distanceKm: 46.0 }
      ]
    },

    // --- Delhi NCR ---
    {
      id: 'del-1',
      name: 'DLF The Crest Gated Villa',
      city: 'delhi',
      cityName: 'Delhi NCR',
      locality: 'Gurugram, Golf Course Road',
      coords: [28.4595, 77.0980],
      bhk: 4,
      baths: 4,
      sqft: 3600,
      type: 'villa',
      age: 3,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'The Shri Ram School Moulsari', coords: [28.4890, 77.0920], distanceKm: 3.4 },
        { type: 'hospital', name: 'Fortis Memorial Research Institute', coords: [28.4550, 77.0720], distanceKm: 2.6 },
        { type: 'metro', name: 'Sector 54 Chowk Rapid Metro', coords: [28.4580, 77.1020], distanceKm: 0.4 },
        { type: 'railway', name: 'Gurgaon Railway Station', coords: [28.4720, 77.0120], distanceKm: 9.1 },
        { type: 'airport', name: 'Indira Gandhi International Airport', coords: [28.5562, 77.1000], distanceKm: 12.8 }
      ]
    },
    {
      id: 'del-2',
      name: 'Noida Expressway Habitat',
      city: 'delhi',
      cityName: 'Delhi NCR',
      locality: 'Sector 137, Noida Expressway',
      coords: [28.5138, 77.4042],
      bhk: 2,
      baths: 2,
      sqft: 1050,
      type: 'apartment',
      age: 4,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: true },
      nearbyFacilities: [
        { type: 'school', name: 'Shiv Nadar School Noida', coords: [28.5080, 77.4010], distanceKm: 0.7 },
        { type: 'hospital', name: 'Felix Hospital Sector 137', coords: [28.5150, 77.4020], distanceKm: 0.3 },
        { type: 'metro', name: 'Sector 137 Aqua Line Metro', coords: [28.5145, 77.4055], distanceKm: 0.2 },
        { type: 'railway', name: 'Anand Vihar Terminal', coords: [28.6502, 77.3150], distanceKm: 18.5 },
        { type: 'airport', name: 'IGI Airport Terminal 3', coords: [28.5562, 77.1000], distanceKm: 35.0 }
      ]
    },
    {
      id: 'del-3',
      name: 'Cyber City Floor Residences',
      city: 'delhi',
      cityName: 'Delhi NCR',
      locality: 'DLF Phase 2, Gurugram',
      coords: [28.4900, 77.0890],
      bhk: 3,
      baths: 3,
      sqft: 1950,
      type: 'floor',
      age: 2,
      amenities: { pool: false, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'American Excelsior School', coords: [28.4870, 77.0850], distanceKm: 0.5 },
        { type: 'hospital', name: 'Medanta - The Medicity', coords: [28.4390, 77.0420], distanceKm: 5.8 },
        { type: 'metro', name: 'Cyber City Rapid Metro', coords: [28.4920, 77.0910], distanceKm: 0.3 },
        { type: 'railway', name: 'Gurgaon Railway Station', coords: [28.4720, 77.0120], distanceKm: 7.8 },
        { type: 'airport', name: 'IGI Airport Terminal 3', coords: [28.5562, 77.1000], distanceKm: 9.5 }
      ]
    },

    // --- Hyderabad ---
    {
      id: 'hyd-1',
      name: 'Kondapur Green Palms',
      city: 'hyderabad',
      cityName: 'Hyderabad',
      locality: 'Kondapur, Botanical Garden Rd',
      coords: [17.4620, 78.3560],
      bhk: 2,
      baths: 2,
      sqft: 950,
      type: 'apartment',
      age: 4,
      amenities: { pool: false, security: true, metro: true, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'Arbor International School', coords: [17.4650, 78.3520], distanceKm: 0.5 },
        { type: 'hospital', name: 'KIMS Hospitals Kondapur', coords: [17.4640, 78.3590], distanceKm: 0.4 },
        { type: 'metro', name: 'Raidurg Metro Station', coords: [17.4405, 78.3780], distanceKm: 2.8 },
        { type: 'railway', name: 'Lingampalli Railway Station', coords: [17.4830, 78.3180], distanceKm: 4.5 },
        { type: 'airport', name: 'Rajiv Gandhi International Airport', coords: [17.2403, 78.4294], distanceKm: 27.0 }
      ]
    },
    {
      id: 'hyd-2',
      name: 'Hitec City Vista Towers',
      city: 'hyderabad',
      cityName: 'Hyderabad',
      locality: 'Madhapur, Hitec City',
      coords: [17.4504, 78.3808],
      bhk: 3,
      baths: 3,
      sqft: 1650,
      type: 'apartment',
      age: 2,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: true },
      nearbyFacilities: [
        { type: 'school', name: 'Oakridge International School', coords: [17.4360, 78.3750], distanceKm: 1.8 },
        { type: 'hospital', name: 'Medicover Hospitals Hitec City', coords: [17.4470, 78.3790], distanceKm: 0.4 },
        { type: 'metro', name: 'Hitec City Metro Station', coords: [17.4485, 78.3820], distanceKm: 0.3 },
        { type: 'railway', name: 'Lingampalli Railway Station', coords: [17.4830, 78.3180], distanceKm: 7.4 },
        { type: 'airport', name: 'Rajiv Gandhi International Airport', coords: [17.2403, 78.4294], distanceKm: 25.5 }
      ]
    },
    {
      id: 'hyd-3',
      name: 'Gachibowli Royal Villa',
      city: 'hyderabad',
      cityName: 'Hyderabad',
      locality: 'Financial District, Gachibowli',
      coords: [17.4190, 78.3450],
      bhk: 4,
      baths: 4,
      sqft: 3100,
      type: 'villa',
      age: 3,
      amenities: { pool: true, security: true, metro: false, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'The Gaudium School Financial Dist', coords: [17.4150, 78.3400], distanceKm: 0.6 },
        { type: 'hospital', name: 'Continental Hospitals', coords: [17.4210, 78.3480], distanceKm: 0.4 },
        { type: 'metro', name: 'Raidurg Metro Station', coords: [17.4405, 78.3780], distanceKm: 4.1 },
        { type: 'railway', name: 'Lingampalli Railway Station', coords: [17.4830, 78.3180], distanceKm: 8.2 },
        { type: 'airport', name: 'Rajiv Gandhi International Airport', coords: [17.2403, 78.4294], distanceKm: 24.0 }
      ]
    },

    // --- Pune ---
    {
      id: 'pun-1',
      name: 'Kharadi Waterfront Park',
      city: 'pune',
      cityName: 'Pune',
      locality: 'Kharadi, EON Free Zone',
      coords: [18.5515, 73.9480],
      bhk: 2,
      baths: 2,
      sqft: 860,
      type: 'apartment',
      age: 3,
      amenities: { pool: true, security: true, metro: false, parking: true, vastu: true, floorRise: false },
      nearbyFacilities: [
        { type: 'school', name: 'Victorious Kidss Educares', coords: [18.5560, 73.9440], distanceKm: 0.6 },
        { type: 'hospital', name: 'Manipal Hospital Kharadi', coords: [18.5520, 73.9390], distanceKm: 0.9 },
        { type: 'metro', name: 'Ramwadi Metro Station', coords: [18.5540, 73.9180], distanceKm: 3.2 },
        { type: 'railway', name: 'Hadapsar Railway Station', coords: [18.5190, 73.9320], distanceKm: 4.2 },
        { type: 'airport', name: 'Pune International Airport', coords: [18.5822, 73.9197], distanceKm: 5.2 }
      ]
    },
    {
      id: 'pun-2',
      name: 'Baner Heights Residences',
      city: 'pune',
      cityName: 'Pune',
      locality: 'Baner Road, High Street',
      coords: [18.5590, 73.7868],
      bhk: 3,
      baths: 3,
      sqft: 1450,
      type: 'apartment',
      age: 2,
      amenities: { pool: true, security: true, metro: true, parking: true, vastu: true, floorRise: true },
      nearbyFacilities: [
        { type: 'school', name: 'The Orchid School Baner', coords: [18.5620, 73.7890], distanceKm: 0.4 },
        { type: 'hospital', name: 'Jupiter Hospital Baner', coords: [18.5605, 73.7915], distanceKm: 0.5 },
        { type: 'metro', name: 'Balewadi Metro Station', coords: [18.5710, 73.7780], distanceKm: 1.6 },
        { type: 'railway', name: 'Pune Junction Railway Station', coords: [18.5284, 73.8744], distanceKm: 11.0 },
        { type: 'airport', name: 'Pune International Airport', coords: [18.5822, 73.9197], distanceKm: 15.5 }
      ]
    }
  ];

  // --- Map State & Helpers ---
  let leafletMap = null;
  let mapMarkersLayer = null;
  let activeSelectedProperty = null;
  let facilityMarkerReferences = {};

  /**
   * Haversine formula to compute approximate spherical distance in km
   */
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10;
  };

  /**
   * Helper to return emoji by facility type
   */
  const getFacilityEmoji = (type) => {
    switch (type) {
      case 'school': return '🏫';
      case 'hospital': return '🏥';
      case 'metro': return '🚇';
      case 'railway': return '🚆';
      case 'airport': return '✈️';
      default: return '📍';
    }
  };

  /**
   * Helper to return human label by facility type
   */
  const getFacilityLabel = (type) => {
    switch (type) {
      case 'school': return 'School';
      case 'hospital': return 'Hospital';
      case 'metro': return 'Metro Station';
      case 'railway': return 'Railway Station';
      case 'airport': return 'Airport';
      default: return 'Facility';
    }
  };

  /**
   * Create custom styled Leaflet DivIcon
   */
  const createMapMarkerIcon = (emoji, colorClass) => {
    if (typeof L === 'undefined') return null;
    return L.divIcon({
      className: 'custom-map-pin-container',
      html: `
        <div class="custom-map-pin ${colorClass}">
          <span class="pin-icon">${emoji}</span>
        </div>
      `,
      iconSize: colorClass === 'pin-prop' ? [38, 38] : [32, 32],
      iconAnchor: colorClass === 'pin-prop' ? [19, 38] : [16, 32],
      popupAnchor: [0, -32]
    });
  };

  /**
   * Initialize Leaflet + OpenStreetMap
   */
  const initLeafletMap = () => {
    const mapElement = document.getElementById('propertyMap');
    if (!mapElement || typeof L === 'undefined') return;

    // Center on Mumbai default coordinates
    leafletMap = L.map('propertyMap', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([19.1176, 72.9060], 13);

    // Free OpenStreetMap Tile Layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    mapMarkersLayer = L.featureGroup().addTo(leafletMap);

    // Initial map resize fix
    setTimeout(() => {
      leafletMap.invalidateSize();
    }, 250);
  };

  /**
   * Display a property and its 5 nearby facilities on the Leaflet map
   */
  const displayPropertyOnMap = (property) => {
    if (!leafletMap || !mapMarkersLayer || !property) return;

    activeSelectedProperty = property;
    mapMarkersLayer.clearLayers();
    facilityMarkerReferences = {};

    // 1. Calculate valuation for this property using the existing model!
    const valuation = calculateValuation(property);

    // 2. Add Property Marker
    const propIcon = createMapMarkerIcon('🏠', 'pin-prop');
    const propMarker = L.marker(property.coords, {
      icon: propIcon,
      title: property.name,
      zIndexOffset: 1000
    }).addTo(mapMarkersLayer);

    const propPopup = `
      <div class="map-popup-card property-popup">
        <span class="popup-badge property">🏠 Selected Property</span>
        <h4 class="popup-name">${property.name}</h4>
        <p class="popup-meta">${property.locality}</p>
        <p class="popup-specs">${property.bhk} BHK • ${property.sqft} sq ft • ${property.type.toUpperCase()}</p>
        <div class="popup-price-tag">Predicted Price: <strong>${formatIndianWords(valuation.total)}</strong></div>
      </div>
    `;
    propMarker.bindPopup(propPopup);

    // 3. Add Nearby Facilities Markers
    property.nearbyFacilities.forEach(fac => {
      // Calculate dynamic spherical distance for viva accuracy
      const computedDist = calculateHaversineDistance(
        property.coords[0], property.coords[1],
        fac.coords[0], fac.coords[1]
      );
      const displayDist = fac.distanceKm || computedDist;

      const facIcon = createMapMarkerIcon(getFacilityEmoji(fac.type), `pin-${fac.type}`);
      const facMarker = L.marker(fac.coords, {
        icon: facIcon,
        title: fac.name
      }).addTo(mapMarkersLayer);

      const facPopup = `
        <div class="map-popup-card">
          <span class="popup-badge ${fac.type}">${getFacilityEmoji(fac.type)} ${getFacilityLabel(fac.type)}</span>
          <h4 class="popup-name">${fac.name}</h4>
          <p class="popup-dist">📍 Approx. <strong>${displayDist} km</strong> from ${property.name}</p>
        </div>
      `;
      facMarker.bindPopup(facPopup);
      facilityMarkerReferences[fac.type] = { marker: facMarker, facility: fac, distance: displayDist };
    });

    // 4. Update Map Topbar Information
    const mapPropertyName = document.getElementById('mapPropertyName');
    const mapPropertyMeta = document.getElementById('mapPropertyMeta');
    if (mapPropertyName) mapPropertyName.textContent = property.name;
    if (mapPropertyMeta) {
      mapPropertyMeta.textContent = `${property.locality} • ${property.bhk} BHK (${property.sqft} sq ft) • Predicted: ${formatIndianWords(valuation.total)}`;
    }

    // 5. Update Facilities Breakdown Panel Below Map
    renderFacilitiesBreakdown(property);

    // 6. Smoothly Fit All Markers into View
    try {
      leafletMap.fitBounds(mapMarkersLayer.getBounds().pad(0.18), { animate: true });
    } catch (e) {
      leafletMap.setView(property.coords, 14);
    }

    // Open property popup
    setTimeout(() => {
      propMarker.openPopup();
    }, 350);
  };

  /**
   * Render the 5 Nearby Facilities Breakdown stat cards below the map
   */
  const renderFacilitiesBreakdown = (property) => {
    const grid = document.getElementById('facilitiesBadgesGrid');
    if (!grid || !property) return;

    grid.innerHTML = '';
    property.nearbyFacilities.forEach(fac => {
      const dist = fac.distanceKm || calculateHaversineDistance(
        property.coords[0], property.coords[1],
        fac.coords[0], fac.coords[1]
      );

      const card = document.createElement('div');
      card.className = 'facility-stat-card';
      card.title = `Click to zoom into ${fac.name} on the map`;
      card.innerHTML = `
        <div class="stat-icon">${getFacilityEmoji(fac.type)}</div>
        <div class="stat-content">
          <span class="stat-type-label">${getFacilityLabel(fac.type)}</span>
          <span class="stat-dist-val">${dist} km</span>
          <span class="stat-place-name" title="${fac.name}">${fac.name}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (leafletMap && facilityMarkerReferences[fac.type]) {
          const item = facilityMarkerReferences[fac.type];
          leafletMap.setView(fac.coords, 15, { animate: true });
          setTimeout(() => {
            item.marker.openPopup();
          }, 250);
        }
      });

      grid.appendChild(card);
    });
  };

  /**
   * Select a property: highlights card and updates map
   */
  const selectProperty = (property) => {
    if (!property) return;
    activeSelectedProperty = property;

    // Highlight card in list
    const cards = document.querySelectorAll('.property-card');
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.id === property.id);
    });

    // Update map
    displayPropertyOnMap(property);
  };

  /**
   * Load any property into the Top Valuation Studio Form
   */
  const loadPropertyIntoStudio = (property) => {
    if (!property) return;

    // 1. City
    citySelect.value = property.city;

    // 2. Sqft
    sqftInput.value = property.sqft;
    sqftSlider.value = property.sqft;
    updateSliderVisual(sqftSlider, 400, 8000);

    // 3. Age
    ageSlider.value = property.age;
    ageStatusLabel.textContent = getAgeLabel(property.age);
    updateSliderVisual(ageSlider, 0, 30);

    // 4. Type
    currentPropertyType = property.type;
    typePills.forEach(p => {
      p.classList.toggle('active', p.dataset.type === currentPropertyType);
    });

    // 5. BHK
    currentBhk = property.bhk;
    bhkButtons.forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val, 10) === currentBhk);
    });

    // 6. Baths
    currentBaths = property.baths;
    bathButtons.forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val, 10) === currentBaths);
    });

    // 7. Amenities
    if (amenityPool) amenityPool.checked = !!property.amenities.pool;
    if (amenitySecurity) amenitySecurity.checked = !!property.amenities.security;
    if (amenityMetro) amenityMetro.checked = !!property.amenities.metro;
    if (amenityParking) amenityParking.checked = !!property.amenities.parking;
    if (amenityVastu) amenityVastu.checked = !!property.amenities.vastu;
    if (amenityFloorRise) amenityFloorRise.checked = !!property.amenities.floorRise;

    // Reset archetypes highlight
    archetypeBtns.forEach(b => b.classList.remove('active'));

    // Trigger studio valuation
    refreshDashboard(true);

    // Smooth scroll to studio
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /**
   * Render list of Property Cards
   */
  const renderPropertyCards = (propertiesList) => {
    const container = document.getElementById('propertyCardsWrapper');
    const countBadge = document.getElementById('resultsCounterPill');
    if (!container) return;

    container.innerHTML = '';

    if (!propertiesList || propertiesList.length === 0) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--r-lg); border: 1px solid var(--border-subtle);">
          <p style="font-weight: 600; margin-bottom: 0.5rem;">No properties found matching criteria.</p>
          <p style="font-size: 0.85rem;">Try modifying your budget or search terms.</p>
        </div>
      `;
      if (countBadge) countBadge.textContent = '0 properties found';
      return;
    }

    if (countBadge) {
      countBadge.textContent = `${propertiesList.length} properties displayed`;
    }

    propertiesList.forEach((prop, idx) => {
      // Calculate ML valuation via the existing calculateValuation engine!
      const valuation = calculateValuation(prop);

      const card = document.createElement('div');
      card.className = `property-card ${idx === 0 ? 'active' : ''}`;
      card.dataset.id = prop.id;

      // Extract distances
      const schoolFac = prop.nearbyFacilities.find(f => f.type === 'school');
      const hospFac = prop.nearbyFacilities.find(f => f.type === 'hospital');
      const metroFac = prop.nearbyFacilities.find(f => f.type === 'metro');
      const railFac = prop.nearbyFacilities.find(f => f.type === 'railway');
      const airFac = prop.nearbyFacilities.find(f => f.type === 'airport');

      card.innerHTML = `
        <div class="card-top-row">
          <div class="card-title-wrap">
            <h4 class="card-prop-name">${prop.name}</h4>
            <span class="card-prop-loc">${prop.locality}</span>
          </div>
          <div class="card-badges">
            <span class="badge-city">${prop.cityName}</span>
            <span class="badge-type">${prop.type}</span>
          </div>
        </div>

        <div class="card-price-row">
          <div>
            <span class="card-price-label">Predicted Price: </span>
            <span class="card-price-value">₹${formatIndianNumber(valuation.total)}</span>
          </div>
          <span class="card-price-words">${formatIndianWords(valuation.total)}</span>
        </div>

        <div class="card-specs-row">
          <div class="spec-item">
            <span class="spec-val">${prop.bhk} BHK</span>
            <span class="spec-key">Bedrooms</span>
          </div>
          <div class="spec-item">
            <span class="spec-val">${prop.baths}</span>
            <span class="spec-key">Bathrooms</span>
          </div>
          <div class="spec-item">
            <span class="spec-val">${formatIndianNumber(prop.sqft)}</span>
            <span class="spec-key">sq ft</span>
          </div>
          <div class="spec-item">
            <span class="spec-val">${prop.age}y</span>
            <span class="spec-key">Age</span>
          </div>
        </div>

        <div class="card-facilities-section">
          <span class="facilities-title">Nearby Facilities & Distances</span>
          <div class="facilities-tags-list">
            ${schoolFac ? `<span class="fac-tag" title="${schoolFac.name}">🏫 School: <strong>${schoolFac.distanceKm} km</strong></span>` : ''}
            ${hospFac ? `<span class="fac-tag" title="${hospFac.name}">🏥 Hospital: <strong>${hospFac.distanceKm} km</strong></span>` : ''}
            ${metroFac ? `<span class="fac-tag" title="${metroFac.name}">🚇 Metro: <strong>${metroFac.distanceKm} km</strong></span>` : ''}
            ${railFac ? `<span class="fac-tag" title="${railFac.name}">🚆 Railway: <strong>${railFac.distanceKm} km</strong></span>` : ''}
            ${airFac ? `<span class="fac-tag" title="${airFac.name}">✈️ Airport: <strong>${airFac.distanceKm} km</strong></span>` : ''}
          </div>
        </div>

        <div class="card-actions-row">
          <button type="button" class="btn-card-map">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            View on Map
          </button>
          <button type="button" class="btn-card-studio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polyline>
            </svg>
            Load in Studio
          </button>
        </div>
      `;

      // Click card to select
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-card-studio')) {
          e.stopPropagation();
          loadPropertyIntoStudio(prop);
          selectProperty(prop);
          return;
        }
        selectProperty(prop);
      });

      container.appendChild(card);
    });
  };

  // --- Natural Language Chatbot Engine ---
  let pendingChatCriteria = null;
  const chatThread = document.getElementById('chatThread');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const quickChips = document.querySelectorAll('.quick-chip');
  const fitMapBoundsBtn = document.getElementById('fitMapBoundsBtn');
  const showAllBtn = document.getElementById('showAllPropertiesBtn');

  /**
   * Append message into chat thread UI
   */
  const appendChatMessage = (content, sender = 'bot') => {
    if (!chatThread) return;

    const row = document.createElement('div');
    row.className = `chat-bubble-row ${sender}`;
    row.innerHTML = `
      <div class="chat-avatar">${sender === 'bot' ? '🤖' : '👤'}</div>
      <div class="chat-bubble">
        <p>${content}</p>
      </div>
    `;
    chatThread.appendChild(row);
    chatThread.scrollTop = chatThread.scrollHeight;
  };

  /**
   * Natural Language Parser: extracts BHK, City, Budget, and Facilities
   */
  const parseUserQuery = (query) => {
    const text = query.toLowerCase();

    // 1. BHK Extraction
    let bhk = null;
    const bhkMatch = text.match(/(\d+)\s*(?:bhk|bedroom|bed|rooms?)/i);
    if (bhkMatch) {
      bhk = parseInt(bhkMatch[1], 10);
    } else if (/\b1\s*bhk\b|\b1bhk\b|\b1\s*bed\b|\bstudio\b/i.test(text)) {
      bhk = 1;
    } else if (/\b2\s*bhk\b|\b2bhk\b|\b2\s*bed\b/i.test(text)) {
      bhk = 2;
    } else if (/\b3\s*bhk\b|\b3bhk\b|\b3\s*bed\b/i.test(text)) {
      bhk = 3;
    } else if (/\b4\s*bhk\b|\b4bhk\b|\b4\s*bed\b/i.test(text)) {
      bhk = 4;
    } else if (/\b5\s*bhk\b|\b5bhk\b|\b5\s*bed\b/i.test(text)) {
      bhk = 5;
    }

    // 2. City / Locality Extraction
    let city = null;
    let cityName = null;
    if (/mumbai|bombay|powai|bandra|andheri|malad|dahisar/i.test(text)) {
      city = 'mumbai';
      cityName = 'Mumbai';
    } else if (/bengaluru|bangalore|whitefield|indiranagar|hsr|electronic city/i.test(text)) {
      city = 'bengaluru';
      cityName = 'Bengaluru';
    } else if (/delhi|ncr|gurugram|gurgaon|noida/i.test(text)) {
      city = 'delhi';
      cityName = 'Delhi NCR';
    } else if (/hyderabad|hitec|gachibowli|kondapur|madhapur/i.test(text)) {
      city = 'hyderabad';
      cityName = 'Hyderabad';
    } else if (/pune|kharadi|baner|wakad|viman/i.test(text)) {
      city = 'pune';
      cityName = 'Pune';
    }

    // 3. Budget Extraction (Crores or Lakhs)
    let maxBudget = null;
    const crMatch = text.match(/(?:under|below|less than|within|budget|max|upto|up to)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i);
    if (crMatch) {
      maxBudget = parseFloat(crMatch[1]) * 10000000;
    } else {
      const lakhMatch = text.match(/(?:under|below|less than|within|budget|max|upto|up to)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l\b)/i);
      if (lakhMatch) {
        maxBudget = parseFloat(lakhMatch[1]) * 100000;
      }
    }

    // 4. Nearby Facilities Extraction
    const facilities = [];
    if (/school|college|education/i.test(text)) facilities.push('school');
    if (/hospital|clinic|doctor|medical|health/i.test(text)) facilities.push('hospital');
    if (/metro|subway/i.test(text)) facilities.push('metro');
    if (/railway|train|rail\b|station/i.test(text)) facilities.push('railway');
    if (/airport|flight|plane/i.test(text)) facilities.push('airport');

    // 5. Property Format
    let propertyType = null;
    if (/villa|house|bungalow|independent/i.test(text)) {
      propertyType = 'villa';
    } else if (/floor|builder floor/i.test(text)) {
      propertyType = 'floor';
    } else if (/apartment|flat|society/i.test(text)) {
      propertyType = 'apartment';
    }

    return { bhk, city, cityName, maxBudget, facilities, propertyType };
  };

  /**
   * Filter dataset based on parsed criteria
   */
  const filterProperties = (criteria) => {
    let results = PROPERTIES_DATASET.slice();

    // Filter by city
    if (criteria.city) {
      results = results.filter(p => p.city === criteria.city);
    }

    // Filter by BHK
    if (criteria.bhk) {
      const exactBhk = results.filter(p => p.bhk === criteria.bhk);
      if (exactBhk.length > 0) {
        results = exactBhk;
      } else {
        // Fallback to adjacent BHK if strict produces none
        results = results.filter(p => Math.abs(p.bhk - criteria.bhk) <= 1);
      }
    }

    // Filter by Property Format (if specified)
    if (criteria.propertyType) {
      const typeMatches = results.filter(p => p.type === criteria.propertyType);
      if (typeMatches.length > 0) {
        results = typeMatches;
      }
    }

    // Filter by Budget (with 5% buffer)
    if (criteria.maxBudget) {
      const budgetMatches = results.filter(p => {
        const val = calculateValuation(p);
        return val.total <= (criteria.maxBudget * 1.05);
      });
      if (budgetMatches.length > 0) {
        results = budgetMatches;
      }
    }

    // Prioritize properties with requested nearby facilities close by
    if (criteria.facilities && criteria.facilities.length > 0) {
      results.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        criteria.facilities.forEach(f => {
          const facA = a.nearbyFacilities.find(item => item.type === f);
          const facB = b.nearbyFacilities.find(item => item.type === f);
          if (facA && facA.distanceKm <= 1.5) scoreA += 1;
          if (facB && facB.distanceKm <= 1.5) scoreB += 1;
        });
        return scoreB - scoreA;
      });
    }

    return results;
  };

  /**
   * Handle Chatbot User Query
   */
  const handleChatQuery = (rawQuery) => {
    const query = rawQuery.trim();
    if (!query) return;

    // Display user message in chat
    appendChatMessage(query, 'user');

    // Parse query
    let parsed = parseUserQuery(query);

    // Context check: If previous turn asked for location and user provided it
    if (pendingChatCriteria && !parsed.city) {
      // Re-check if the new query is a city or contains city
      const cityCheck = parseUserQuery(`in ${query}`);
      if (cityCheck.city) {
        parsed = { ...pendingChatCriteria, city: cityCheck.city, cityName: cityCheck.cityName };
        pendingChatCriteria = null;
      }
    }

    // If city is still missing, politely ask the user
    if (!parsed.city) {
      pendingChatCriteria = parsed;
      setTimeout(() => {
        appendChatMessage(
          "Which location or city are you interested in? (e.g., <strong>Mumbai</strong>, <strong>Bengaluru</strong>, <strong>Delhi NCR</strong>, <strong>Hyderabad</strong>, or <strong>Pune</strong>)",
          'bot'
        );
      }, 300);
      return;
    }

    // Clear pending context
    pendingChatCriteria = null;

    // Construct friendly acknowledgment string
    let ackParts = [];
    if (parsed.bhk) ackParts.push(`${parsed.bhk} BHK`);
    if (parsed.propertyType) {
      ackParts.push(parsed.propertyType === 'villa' ? 'houses' : `${parsed.propertyType} properties`);
    } else {
      ackParts.push('properties');
    }
    ackParts.push(`in ${parsed.cityName}`);
    if (parsed.maxBudget) {
      ackParts.push(`under ${formatIndianWords(parsed.maxBudget)}`);
    }
    if (parsed.facilities && parsed.facilities.length > 0) {
      const facNames = parsed.facilities.map(f => {
        if (f === 'metro') return 'a metro station';
        if (f === 'school') return 'schools';
        if (f === 'hospital') return 'hospitals';
        if (f === 'railway') return 'a railway station';
        if (f === 'airport') return 'the airport';
        return f;
      });
      ackParts.push(`near ${facNames.join(' and ')}`);
    }

    const ackMessage = `Okay. Searching for ${ackParts.join(' ')}...`;

    setTimeout(() => {
      appendChatMessage(ackMessage, 'bot');

      // Filter properties
      const matches = filterProperties(parsed);

      setTimeout(() => {
        if (matches.length > 0) {
          appendChatMessage(
            `I found <strong>${matches.length} properties</strong> matching your requirements. The matching listings and interactive map locations are shown below:`,
            'bot'
          );
          renderPropertyCards(matches);
          selectProperty(matches[0]);
        } else {
          const cityFallback = PROPERTIES_DATASET.filter(p => p.city === parsed.city);
          appendChatMessage(
            `No exact matches found under that budget in ${parsed.cityName}. Showing ${cityFallback.length} available alternative properties in ${parsed.cityName}:`,
            'bot'
          );
          renderPropertyCards(cityFallback);
          if (cityFallback.length > 0) selectProperty(cityFallback[0]);
        }

        // Smooth scroll to results
        const resultsSec = document.getElementById('resultsSection');
        if (resultsSec) {
          resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    }, 250);
  };

  // --- Event Bindings for Chatbot & Map ---

  // Chat Form Submit
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput.value;
      chatInput.value = '';
      handleChatQuery(val);
    });
  }

  // Quick Query Chips
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      if (chatInput) chatInput.value = q;
      handleChatQuery(q);
    });
  });

  // Fit All Map Markers Button
  if (fitMapBoundsBtn) {
    fitMapBoundsBtn.addEventListener('click', () => {
      if (leafletMap && mapMarkersLayer) {
        try {
          leafletMap.fitBounds(mapMarkersLayer.getBounds().pad(0.18), { animate: true });
        } catch (e) {
          if (activeSelectedProperty) {
            leafletMap.setView(activeSelectedProperty.coords, 14);
          }
        }
      }
    });
  }

  // Show All Properties Button
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      renderPropertyCards(PROPERTIES_DATASET);
      if (PROPERTIES_DATASET.length > 0) {
        selectProperty(PROPERTIES_DATASET[0]);
      }
    });
  }

  // Synchronize city selection in top studio with map when user changes dropdown
  citySelect.addEventListener('change', () => {
    const selectedCity = citySelect.value;
    const matchingProp = PROPERTIES_DATASET.find(p => p.city === selectedCity);
    if (matchingProp) {
      selectProperty(matchingProp);
    }
  });

  // --- Initial Launch Setup ---
  initLeafletMap();
  renderPropertyCards(PROPERTIES_DATASET);
  if (PROPERTIES_DATASET.length > 0) {
    selectProperty(PROPERTIES_DATASET[0]);
  }

  // Initial Slider Visual Calibration
  updateSliderVisual(sqftSlider, 400, 8000);
  updateSliderVisual(ageSlider, 0, 30);
  refreshDashboard(false);
});

