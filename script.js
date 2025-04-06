document.addEventListener('DOMContentLoaded', function() {
    const timezoneSelect = document.getElementById('timezone-select');
    const addClockBtn = document.getElementById('add-clock-btn');
    const clocksContainer = document.getElementById('clocks-container');
    
    // Timezone data with country codes
    const timezones = [
        { name: 'New York (EST)', timezone: 'America/New_York', countryCode: 'us' },
        { name: 'Los Angeles (PST)', timezone: 'America/Los_Angeles', countryCode: 'us' },
        { name: 'London (GMT)', timezone: 'Europe/London', countryCode: 'gb' },
        { name: 'Paris (CET)', timezone: 'Europe/Paris', countryCode: 'fr' },
        { name: 'Berlin (CET)', timezone: 'Europe/Berlin', countryCode: 'de' },
        { name: 'Tokyo (JST)', timezone: 'Asia/Tokyo', countryCode: 'jp' },
        { name: 'Sydney (AEST)', timezone: 'Australia/Sydney', countryCode: 'au' },
        { name: 'Beijing (CST)', timezone: 'Asia/Shanghai', countryCode: 'cn' },
        { name: 'Moscow (MSK)', timezone: 'Europe/Moscow', countryCode: 'ru' },
        { name: 'Dubai (GST)', timezone: 'Asia/Dubai', countryCode: 'ae' },
        { name: 'New Delhi (IST)', timezone: 'Asia/Kolkata', countryCode: 'in' },
        { name: 'São Paulo (BRT)', timezone: 'America/Sao_Paulo', countryCode: 'br' },
        { name: 'Mexico City (CST)', timezone: 'America/Mexico_City', countryCode: 'mx' },
        { name: 'Madrid (CET)', timezone: 'Europe/Madrid', countryCode: 'es' },
        { name: 'Rome (CET)', timezone: 'Europe/Rome', countryCode: 'it' },
    ];
    
    // Store all clocks for synchronized updates
    const allClocks = [];
    
    // Flag to control seconds display - load from localStorage or default to true
    let showSeconds = localStorage.getItem('showSeconds') !== null 
        ? localStorage.getItem('showSeconds') === 'true' 
        : true;
    
    // Load dark mode preference from localStorage or default to system preference
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let darkMode = localStorage.getItem('darkMode') !== null
        ? localStorage.getItem('darkMode') === 'true'
        : prefersDarkScheme;
    
    // Apply initial theme
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Add controls (seconds toggle and dark mode toggle)
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'controls';
    controlsDiv.innerHTML = `
        <label class="toggle-container">
            <input type="checkbox" id="show-seconds-toggle" ${showSeconds ? 'checked' : ''}>
            <span class="toggle-label">Show Seconds</span>
        </label>
        <label class="toggle-container">
            <input type="checkbox" id="dark-mode-toggle" ${darkMode ? 'checked' : ''}>
            <span class="toggle-label">Dark Mode</span>
        </label>
    `;
    
    // Insert the controls before the clocks container
    clocksContainer.parentNode.insertBefore(controlsDiv, clocksContainer);
    
    // Add event listener for the seconds toggle
    const secondsToggle = document.getElementById('show-seconds-toggle');
    secondsToggle.addEventListener('change', function() {
        showSeconds = this.checked;
        // Save preference to localStorage
        localStorage.setItem('showSeconds', showSeconds);
        updateAllClocks(); // Update all clocks immediately to reflect the change
    });
    
    // Add event listener for the dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('change', function() {
        darkMode = this.checked;
        // Save preference to localStorage
        localStorage.setItem('darkMode', darkMode);
        // Toggle dark mode class on body
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });
    
    // Populate timezone select
    timezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ timezone: tz.timezone, countryCode: tz.countryCode });
        option.textContent = tz.name;
        timezoneSelect.appendChild(option);
    });
    
    // Function to get country code from timezone
    function getCountryCodeFromTimezone(timezone) {
        // Map common timezones to country codes
        const timezoneMap = {
            'America/': 'us',
            'Europe/London': 'gb',
            'Europe/Paris': 'fr',
            'Europe/Berlin': 'de',
            'Europe/Madrid': 'es',
            'Europe/Rome': 'it',
            'Asia/Tokyo': 'jp',
            'Asia/Shanghai': 'cn',
            'Asia/Kolkata': 'in',
            'Australia/': 'au',
            'America/Sao_Paulo': 'br',
            'America/Mexico_City': 'mx',
            'Europe/Moscow': 'ru',
            'Asia/Dubai': 'ae'
        };
        
        // Check for exact matches first
        if (timezoneMap[timezone]) {
            return timezoneMap[timezone];
        }
        
        // Check for partial matches
        for (const prefix in timezoneMap) {
            if (timezone.startsWith(prefix)) {
                return timezoneMap[prefix];
            }
        }
        
        // Default to US if no match found
        return 'us';
    }
    
    // Function to save clocks to localStorage
    function saveClocks() {
        const clocksData = allClocks.map(clock => ({
            timezone: clock.timezone,
            countryCode: clock.countryCode
        }));
        localStorage.setItem('savedClocks', JSON.stringify(clocksData));
    }
    
    // Function to load clocks from localStorage
    function loadSavedClocks() {
        const savedClocks = localStorage.getItem('savedClocks');
        if (savedClocks) {
            try {
                const clocksData = JSON.parse(savedClocks);
                // Clear any default clocks
                allClocks.length = 0;
                clocksContainer.innerHTML = '';
                
                // Add saved clocks
                clocksData.forEach(clockData => {
                    addClock(clockData);
                });
            } catch (e) {
                console.error('Error loading saved clocks:', e);
                // If there's an error, add the default local clock
                addDefaultLocalClock();
            }
        } else {
            // If no saved clocks, add the default local clock
            addDefaultLocalClock();
        }
    }
    
    // Function to add default local clock
    function addDefaultLocalClock() {
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        addClock({
            timezone: localTimezone,
            countryCode: getCountryCodeFromTimezone(localTimezone)
        });
    }
    
    // Add clock button event listener
    addClockBtn.addEventListener('click', function() {
        if (timezoneSelect.value) {
            const tzData = JSON.parse(timezoneSelect.value);
            addClock(tzData);
            timezoneSelect.value = '';
            saveClocks(); // Save state after adding a clock
        }
    });
    
    // Function to add a new clock
    function addClock(tzData) {
        const clockId = 'clock-' + Date.now();
        const clockElement = document.createElement('div');
        clockElement.className = 'clock';
        clockElement.id = clockId;
        
        clockElement.innerHTML = `
            <button class="remove-btn" data-clock-id="${clockId}">×</button>
            <div class="clock-header">
                <img src="https://flagcdn.com/w20/${tzData.countryCode.toLowerCase()}.png" 
                     alt="${tzData.countryCode}" 
                     class="flag-icon">
                <span class="timezone-name">${getTimezoneName(tzData.timezone)}</span>
            </div>
            <div class="time"></div>
            <div class="date"></div>
        `;
        
        clocksContainer.appendChild(clockElement);
        
        // Add event listener to remove button
        clockElement.querySelector('.remove-btn').addEventListener('click', function() {
            document.getElementById(this.dataset.clockId).remove();
            // Remove clock from allClocks array
            const index = allClocks.findIndex(clock => clock.id === this.dataset.clockId);
            if (index !== -1) {
                allClocks.splice(index, 1);
                saveClocks(); // Save state after removing a clock
            }
        });
        
        // Store clock data for synchronized updates
        allClocks.push({
            id: clockId,
            element: clockElement,
            timezone: tzData.timezone,
            countryCode: tzData.countryCode
        });
        
        // Update this clock immediately
        updateClock(clockElement, tzData.timezone);
    }
    
    // Function to update a clock
    function updateClock(clockElement, timezone) {
        const now = new Date();
        
        // Format time for the specified timezone
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true,
            timeZone: timezone 
        };
        
        // Only include seconds if showSeconds is true
        if (showSeconds) {
            timeOptions.second = '2-digit';
        }
        
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: timezone 
        };
        
        const timeString = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
        const dateString = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
        
        clockElement.querySelector('.time').textContent = timeString;
        clockElement.querySelector('.date').textContent = dateString;
    }
    
    // Function to update all clocks simultaneously
    function updateAllClocks() {
        allClocks.forEach(clock => {
            updateClock(clock.element, clock.timezone);
        });
    }
    
    // Set up a single interval to update all clocks every second
    setInterval(updateAllClocks, 1000);
    
    // Function to get a friendly timezone name
    function getTimezoneName(timezone) {
        const parts = timezone.split('/');
        return parts[parts.length - 1].replace('_', ' ');
    }
    
    // Load saved clocks on startup
    loadSavedClocks();
});