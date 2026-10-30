function getCurrentWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

// Helper to get local date string (YYYY-MM-DD) matching user's local timezone
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper to get ISO date string (YYYY-MM-DD) for a specific weekday in a given ISO week
function getDateForWeekDay(week, year, dayIndex) {
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dow = simple.getUTCDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4) {
        ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
    } else {
        ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
    }
    ISOweekStart.setUTCDate(ISOweekStart.getUTCDate() + dayIndex);
    return ISOweekStart.toISOString().split('T')[0];
}

let isEditModeActive = false;
let selectedWeek = getCurrentWeekNumber(new Date());
let usersList = [];
let currentPlanMap = {}; // Global store so outside-click listener can access it safely
const participantsList = ["G", "J", "L", "M", "V", "Z"];
const standardDays = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];

document.addEventListener("DOMContentLoaded", async () => {
    if (!document.getElementById("mealsContainer")) return;

    await fetchUsers();
    loadWeek(selectedWeek);

    document.getElementById("prevWeekBtn").addEventListener("click", () => {
        selectedWeek--;
        loadWeek(selectedWeek);
    });

    document.getElementById("nextWeekBtn").addEventListener("click", () => {
        selectedWeek++;
        loadWeek(selectedWeek);
    });

    // Close active edit boxes when clicking anywhere outside
    document.addEventListener("click", (e) => {
        // Handle chef dropdown outside click
        document.querySelectorAll('[id^="chef-select-box-"]').forEach(box => {
            const dayName = box.id.replace('chef-select-box-', '');
            const displayWrap = document.getElementById(`chef-display-wrap-${dayName}`);
            const chefGroup = displayWrap?.closest('.group\\/chef');

            if (!box.contains(e.target) && !chefGroup?.contains(e.target)) {
                cancelChefSelector(dayName);
            }
        });

        // Handle meal title edit outside click
        document.querySelectorAll('[id^="title-edit-"]').forEach(editBox => {
            const dayName = editBox.id.replace('title-edit-', '');
            const displayBox = document.getElementById(`title-display-${dayName}`);

            if (!editBox.contains(e.target) && displayBox && !displayBox.contains(e.target)) {
                const item = currentPlanMap ? currentPlanMap[dayName] : null;
                const mealTitle = (!item || !item.meal_title) ? "Ikke planlagt endnu..." : item.meal_title;
                cancelEditMode(dayName, mealTitle, !item || !item.meal_title);
            }
        });
    });
});

async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            usersList = await response.json();
        }
    } catch (err) {
        console.error("Failed to load users list:", err);
    }
}

async function loadWeek(weekNum) {
    document.getElementById("weekLabel").textContent = `Uge ${weekNum}`;

    // Apply pale green background to body and top navigation when edit mode is active
    const topNav = document.getElementById('topNav');
    if (isEditModeActive) {
        document.body.classList.add('bg-[#eaf5ea]');
        if (topNav) {
            topNav.classList.remove('bg-white');
            topNav.classList.add('bg-[#eaf5ea]');
        }
    } else {
        document.body.classList.remove('bg-[#eaf5ea]');
        if (topNav) {
            topNav.classList.remove('bg-[#eaf5ea]');
            topNav.classList.add('bg-white');
        }
    }

    try {
        const response = await fetch(`/api/crumbs?week=${weekNum}`);
        if (!response.ok) throw new Error("Failed to fetch crumbs data");
        const data = await response.json();
        renderCrumbs(data, weekNum);
    } catch (err) {
        console.error("Error loading crumbs:", err);
        document.getElementById("mealsContainer").innerHTML = `
            <p class="text-xs text-slate-400 text-center py-8">Kunne ikke hente madplan for uge ${weekNum}.</p>
        `;
    }
}

function renderCrumbs(mealPlanData, weekNum) {
    const mealsContainer = document.getElementById("mealsContainer");
    mealsContainer.innerHTML = "";

    const todayObj = new Date();
    const currentYear = todayObj.getFullYear();
    const todayString = getLocalDateString(todayObj);

    // Create a lookup map of the data received from the backend based on day name or date
    currentPlanMap = {};
    if (Array.isArray(mealPlanData)) {
        mealPlanData.forEach(item => {
            currentPlanMap[item.day_name] = item;
        });
    }

    // Always iterate through all 7 days to ensure the week appears complete
    standardDays.forEach((dayName, index) => {
        const item = currentPlanMap[dayName];
        const isMissing = !item || !item.meal_title || item.meal_title === "Ikke planlagt endnu...";
        const dayDate = (item && item.date) ? item.date : getDateForWeekDay(weekNum, currentYear, index);

        const isToday = (dayDate === todayString);
        const hasNoChef = !isMissing && (!item || !item.chef_id);

        // Select classes: Dashed and muted if missing, otherwise normal/highlighted
        let cardClasses = "";
        if (isToday) {
            cardClasses = "border-2 border-emerald-500 bg-[#f4fbf4] shadow-md shadow-emerald-500/10";
        } else if (isMissing) {
            cardClasses = "border-2 border-dashed border-slate-200 bg-white opacity-75 shadow-none";
        } else if (hasNoChef) {
            cardClasses = "border-2 border-rose-300 bg-rose-50/80 shadow-sm";
        } else {
            cardClasses = "border-2 border-slate-200/90 bg-white hover:bg-slate-50 shadow-sm";
        }

        const card = document.createElement("div");
        card.id = `card-${dayName}`;
        card.className = `p-5 sm:p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between min-h-[170px] ${cardClasses}`;

        // Map signups if available from backend, otherwise default everyone to 'unanswered'
        const signupsMap = {};
        if (item && item.signups) {
            item.signups.forEach(s => {
                signupsMap[s.initials] = { status: s.status, note: s.note };
            });
        }

        const participantsHTML = participantsList.map(initial => {
            const info = signupsMap[initial] || { status: "unanswered" };
            const status = info.status;
            const note = info.note ? ` (${info.note})` : "";

            let circleStyle = "";
            let tooltipText = "";
            let innerText = initial;

            if (status === "yes") {
                circleStyle = "bg-emerald-600 text-white border border-emerald-600";
                tooltipText = `${initial}: Spiser med${note}`;
            } else if (status === "maybe") {
                circleStyle = "bg-amber-400 text-slate-900 font-extrabold border-2 border-amber-500 ring-2 ring-amber-100";
                tooltipText = `${initial}: Måske${note}`;
            } else if (status === "no") {
                circleStyle = "bg-rose-100 text-rose-700 border border-rose-300 line-through";
                tooltipText = `${initial}: Afbud${note}`;
            } else {
                circleStyle = "bg-slate-50 text-slate-400 border border-dashed border-slate-300";
                tooltipText = `${initial}: Ubesvaret`;
            }

            // Fallback crumb id if the day has no plan yet (0 or null)
            const crumbId = item ? item.id : 0;

            return `
                <div class="tooltip-trigger relative inline-block ${isEditModeActive ? 'cursor-pointer' : 'pointer-events-none'} flex-shrink-0" tabindex="0" 
                     onclick="handleBadgeClick(${crumbId}, '${initial}', '${status}', ${weekNum}, '${dayDate}', '${dayName}', ${currentYear})"
                     title="Klik for at ændre status">
                    <div class="w-7 h-7 rounded-full ${circleStyle} flex items-center justify-center shadow-sm transition-transform ${isEditModeActive ? 'hover:scale-110' : ''}">
                        <span class="text-xs font-bold leading-none">${innerText}</span>
                    </div>
                    <div class="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none">
                        ${tooltipText}
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                    </div>
                </div>
            `;
        }).join("");

        const mealTitle = isMissing ? "Ikke planlagt endnu..." : item.meal_title;
        const crumbId = item ? item.id : 0;
        const currentChefId = item ? item.chef_id : null;
        const currentChefObj = usersList.find(u => u.id === currentChefId);
        const chefDisplayName = currentChefObj ? currentChefObj.name : "Ikke valgt";

        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-extrabold uppercase tracking-wider ${isToday ? 'text-emerald-800' : 'text-slate-400'}">
                        ${dayName}
                    </span>
                    ${isToday ? `
                        <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md tracking-wide flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            I DAG
                        </span>
                    ` : ''}
                    ${isMissing ? `
                        <span class="px-2 py-0.5 text-[10px] font-semibold bg-slate-200 text-slate-500 rounded-md tracking-wide">
                            MANGLER
                        </span>
                    ` : ''}
                    ${hasNoChef ? `
                        <span class="px-2 py-0.5 text-[10px] font-semibold bg-rose-200 text-rose-800 rounded-md tracking-wide">
                            MANGLER KOK
                        </span>
                    ` : ''}
                </div>
                <i data-lucide="utensils-crossed" class="w-4 h-4 ${isToday ? 'text-emerald-600' : 'text-slate-300'}"></i>
            </div>
            
            <!-- Meal Title & Edit Trigger -->
            <div class="mb-5 flex items-center justify-between">
                <div id="title-display-${dayName}" class="flex items-center space-x-2 flex-1 ${isEditModeActive ? 'cursor-pointer group/title' : 'pointer-events-none'}" onclick="enableEditMode('${dayName}', \`${mealTitle}\`, ${crumbId}, '${dayDate}', ${weekNum}, ${currentYear})" title="Klik for at redigere ret">
                    <h3 class="text-lg sm:text-xl font-bold ${isMissing ? 'text-slate-400 italic font-medium' : (isToday ? 'text-slate-900' : 'text-slate-800')} ${isEditModeActive ? 'group-hover/title:text-emerald-600' : ''} tracking-tight leading-snug transition-colors">
                        ${mealTitle}
                    </h3>
                    <button class="p-1 text-slate-400 ${isEditModeActive ? 'group-hover/title:text-emerald-600 opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'} transition-colors">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Inline Edit Container (Hidden by default) -->
                <div id="title-edit-${dayName}" class="hidden flex-1 items-center gap-2" onclick="event.stopPropagation()">
                    <input type="text" id="input-${dayName}" value="${isMissing ? '' : mealTitle}" 
                           oninput="checkMealInputChanges('${dayName}', \`${isMissing ? '' : mealTitle}\`)"
                           class="flex-1 px-3 py-1.5 text-sm font-semibold text-slate-900 bg-white border border-emerald-500 rounded-xl focus:outline-none ring-2 ring-emerald-100 shadow-inner">
                    <button id="save-btn-${dayName}" disabled 
                            onclick="saveMealTitle(${crumbId}, '${dayDate}', ${weekNum}, '${dayName}', ${currentYear})"
                            class="p-1.5 bg-emerald-600 text-white rounded-lg opacity-50 cursor-not-allowed transition-all shadow-sm hover:bg-emerald-700" title="Gem">
                        <i data-lucide="check" class="w-4 h-4"></i>
                    </button>
                    <button onclick="cancelEditMode('${dayName}', \`${mealTitle}\`, ${isMissing})" 
                            class="p-1.5 bg-rose-100 text-rose-700 rounded-lg transition-all shadow-sm hover:bg-rose-200" title="Annuller">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

           <!-- Chef Selector & Signups Footer -->
            <div class="flex items-center justify-between pt-3 border-t gap-2 flex-wrap ${isToday ? 'border-emerald-200/80' : (hasNoChef ? 'border-rose-200' : 'border-slate-200/60')}">
                <div class="flex items-center space-x-2">
                    <div class="text-xs flex items-center space-x-1.5 ${isEditModeActive ? 'cursor-pointer group/chef' : 'pointer-events-none'}" onclick="toggleChefSelector('${dayName}')" title="Klik for at skifte kok">
                        <div class="w-6 h-6 rounded-full ${isToday ? 'bg-emerald-100 text-emerald-800' : (hasNoChef ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600')} flex items-center justify-center shadow-sm flex-shrink-0 transition-transform ${isEditModeActive ? 'group-hover/chef:scale-110' : ''}">
                            <i data-lucide="chef-hat" class="w-3.5 h-3.5"></i>
                        </div>
                        <span class="text-slate-400 font-medium ${isEditModeActive ? 'group-hover/chef:text-emerald-600' : ''} transition-colors" title="Klik for at skifte kok">Kok:</span>

                        <!-- Static Display Name & Dropdown Arrow Icon -->
                        <div id="chef-display-wrap-${dayName}" class="flex items-center space-x-1">
                            <span id="chef-text-${dayName}" class="font-bold text-slate-900 ${isEditModeActive ? 'group-hover/chef:text-emerald-600' : ''} transition-colors">
                                ${chefDisplayName}
                            </span>
                            <button class="p-1 text-slate-400 ${isEditModeActive ? 'group-hover/chef:text-emerald-600 opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'} transition-colors">
                                <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>

                        <!-- Active Dropdown & Rosa X Cancel Button -->
                        <div id="chef-select-box-${dayName}" class="hidden items-center space-x-1" onclick="event.stopPropagation()">
                            <select id="chef-dropdown-${dayName}"
                                    onchange="updateChef(${crumbId}, '${dayDate}', ${weekNum}, '${dayName}', ${currentYear}, this.value)"
                                    class="px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-emerald-500 rounded-lg focus:outline-none shadow-sm cursor-pointer">
                                <option value="">-- IKKE VALGT --</option>
                                ${usersList.map(u => `<option value="${u.id}" ${currentChefId === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                            </select>
                            <button onclick="cancelChefSelector('${dayName}')" 
                                    class="p-1.5 bg-rose-100 text-rose-700 rounded-lg transition-all shadow-sm hover:bg-rose-200 cursor-pointer" title="Annuller">
                                <i data-lucide="x" class="w-3 h-3"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Signups Row -->
                <div class="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
                    ${participantsHTML}
                </div>
            </div>
        `;
        mealsContainer.appendChild(card);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Toggle Chef Dropdown on Click & Immediately Open Dropdown on Mobile/Desktop
window.toggleChefSelector = function(clickedDayName) {
    if (!isEditModeActive) return; // Do nothing if edit mode is off
    // Hide all other open chef select boxes and show their display wraps
    document.querySelectorAll('[id^="chef-select-box-"]').forEach(box => {
        const boxDayName = box.id.replace('chef-select-box-', '');
        if (boxDayName !== clickedDayName) {
            cancelChefSelector(boxDayName);
        }
    });

    // Also close any active meal title edit modes
    document.querySelectorAll('[id^="title-edit-"]').forEach(editBox => {
        const dayName = editBox.id.replace('title-edit-', '');
        const item = currentPlanMap ? currentPlanMap[dayName] : null;
        const mealTitle = (!item || !item.meal_title) ? "Ikke planlagt endnu..." : item.meal_title;
        cancelEditMode(dayName, mealTitle, !item || !item.meal_title);
    });

    const displayWrap = document.getElementById(`chef-display-wrap-${clickedDayName}`);
    const selectBox = document.getElementById(`chef-select-box-${clickedDayName}`);
    const selectDropdown = document.getElementById(`chef-dropdown-${clickedDayName}`);

    if (displayWrap && selectBox) {
        displayWrap.classList.add('hidden');
        selectBox.classList.remove('hidden');
        selectBox.classList.add('flex');

        if (selectDropdown) {
            selectDropdown.focus();
            try {
                if (typeof selectDropdown.showPicker === 'function') {
                    selectDropdown.showPicker();
                } else {
                    selectDropdown.click();
                }
            } catch (e) {}
        }
    }
}

window.cancelChefSelector = function(dayName) {
    const displayWrap = document.getElementById(`chef-display-wrap-${dayName}`);
    const selectBox = document.getElementById(`chef-select-box-${dayName}`);

    if (displayWrap && selectBox) {
        selectBox.classList.remove('flex');
        selectBox.classList.add('hidden');
        displayWrap.classList.remove('hidden');
    }
}

window.updateChef = async function(crumbId, dayDate, weekNum, dayName, year, chefId) {
    const parsedChefId = (chefId === "" || chefId === null || chefId === "null") ? null : Number(chefId);

    try {
        const response = await fetch('/api/crumbs/chef', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crumbId: crumbId || 0,
                date: dayDate,
                weekNumber: weekNum,
                year: year,
                dayName: dayName,
                chefId: parsedChefId
            })
        });

        if (!response.ok) throw new Error("Failed to update chef");

        loadWeek(weekNum);
    } catch (err) {
        console.error("Error updating chef:", err);
    }
}

// Inline Edit Handlers
window.enableEditMode = function(dayName, originalTitle, crumbId, dayDate, weekNum, year) {
    if (!isEditModeActive) return; // Do nothing if edit mode is off
    // Cancel any active chef selectors first
    document.querySelectorAll('[id^="chef-select-box-"]').forEach(box => {
        cancelChefSelector(box.id.replace('chef-select-box-', ''));
    });

    // Also cancel any other active meal title edit modes
    document.querySelectorAll('[id^="title-edit-"]').forEach(editBox => {
        const otherDayName = editBox.id.replace('title-edit-', '');
        if (otherDayName !== dayName) {
            const item = currentPlanMap ? currentPlanMap[otherDayName] : null;
            const otherTitle = (!item || !item.meal_title) ? "Ikke planlagt endnu..." : item.meal_title;
            cancelEditMode(otherDayName, otherTitle, !item || !item.meal_title);
        }
    });

    document.getElementById(`title-display-${dayName}`).classList.add('hidden');
    document.getElementById(`title-edit-${dayName}`).classList.remove('hidden');

    const inputField = document.getElementById(`input-${dayName}`);
    if (originalTitle === "Ikke planlagt endnu...") {
        inputField.value = "";
    } else {
        inputField.value = originalTitle;
    }
    inputField.focus();
    inputField.setSelectionRange(inputField.value.length, inputField.value.length);
}

window.cancelEditMode = function(dayName, originalTitle, isMissing) {
    document.getElementById(`title-edit-${dayName}`).classList.add('hidden');
    document.getElementById(`title-display-${dayName}`).classList.remove('hidden');
}

window.checkMealInputChanges = function(dayName, originalTitle) {
    const inputVal = document.getElementById(`input-${dayName}`).value.trim();
    const saveBtn = document.getElementById(`save-btn-${dayName}`);
    const cleanOriginal = originalTitle === "Ikke planlagt endnu..." ? "" : originalTitle;

    if (inputVal !== cleanOriginal && inputVal.length > 0) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        saveBtn.disabled = true;
        saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

window.saveMealTitle = async function(crumbId, dayDate, weekNum, dayName, year) {
    const inputVal = document.getElementById(`input-${dayName}`).value.trim();
    if (!inputVal) return;

    try {
        const response = await fetch('/api/crumbs/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crumbId: crumbId,
                date: dayDate,
                weekNumber: weekNum,
                year: year,
                dayName: dayName,
                mealTitle: inputVal
            })
        });

        if (!response.ok) throw new Error("Failed to update meal title");

        loadWeek(weekNum);
    } catch (err) {
        console.error("Error saving meal title:", err);
    }
}

// 1-Click Cycle Handler
window.handleBadgeClick = async function(crumbId, initials, currentStatus, weekNum) {
    if (!isEditModeActive) return;

    if (!crumbId) {
        alert("Denne dag har ikke fået tildelt en madplan endnu, så der kan ikke tilmeldes.");
        return;
    }

    // Cycle logic: unanswered/no -> yes -> maybe -> no -> yes
    let nextStatus = "yes";
    if (currentStatus === "yes") nextStatus = "maybe";
    else if (currentStatus === "maybe") nextStatus = "no";
    else if (currentStatus === "no") nextStatus = "yes";
    else nextStatus = "yes";

    try {
        const response = byIdRoute => fetch(`/api/crumbs/${crumbId}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initials, status: nextStatus })
        });
        
        const responseObj = await fetch(`/api/crumbs/${crumbId}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initials, status: nextStatus })
        });

        if (!responseObj.ok) throw new Error("Failed to update signup");

        loadWeek(weekNum);
    } catch (err) {
        console.error("Error updating status:", err);
    }
}

window.toggleGlobalEditMode = function(isActive) {
    isEditModeActive = isActive;
    loadWeek(selectedWeek); // Reloads the week view to instantly apply/remove interactivity and background color
}