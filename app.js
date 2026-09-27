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
   */
  const calculateValuation = () => {
    const selectedCityOption = citySelect.options[citySelect.selectedIndex];
    const baseRatePerSqft = parseFloat(selectedCityOption.dataset.rate) || 7200;
    const sqft = parseFloat(sqftInput.value) || 1850;
    const age = parseFloat(ageSlider.value) || 4;

    // Structural Type Multiplier
    let typeMultiplier = 1.0;
    if (currentPropertyType === 'apartment') typeMultiplier = 0.96;
    if (currentPropertyType === 'floor') typeMultiplier = 1.05;
    if (currentPropertyType === 'villa') typeMultiplier = 1.25;

    // Base area value
    let baseAreaValue = sqft * baseRatePerSqft * typeMultiplier;

    // Room configurations
    const roomValue = (currentBhk * 420000) + (currentBaths * 210000);

    // Amenities impact (+% on base)
    let amenitiesBonusPct = 0;
    if (amenityPool && amenityPool.checked) amenitiesBonusPct += 0.05;
    if (amenitySecurity && amenitySecurity.checked) amenitiesBonusPct += 0.03;
    if (amenityMetro && amenityMetro.checked) amenitiesBonusPct += 0.06;
    if (amenityParking && amenityParking.checked) amenitiesBonusPct += 0.04;
    if (amenityVastu && amenityVastu.checked) amenitiesBonusPct += 0.025;
    if (amenityFloorRise && amenityFloorRise.checked) amenitiesBonusPct += 0.035;

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

  // Initial Slider Visual Calibration
  updateSliderVisual(sqftSlider, 400, 8000);
  updateSliderVisual(ageSlider, 0, 30);
  refreshDashboard(false);
});
