function getCurrentWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

let selectedWeek = getCurrentWeekNumber(new Date());
const participantsList = ["G", "J", "L", "M", "V", "Z"];

document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("mealsContainer")) return;

    loadWeek(selectedWeek);

    document.getElementById("prevWeekBtn").addEventListener("click", () => {
        selectedWeek--;
        loadWeek(selectedWeek);
    });

    document.getElementById("nextWeekBtn").addEventListener("click", () => {
        selectedWeek++;
        loadWeek(selectedWeek);
    });
});

async function loadWeek(weekNum) {
    document.getElementById("weekLabel").textContent = `Uge ${weekNum}`;
    
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
    const year = todayObj.getFullYear();
    const month = String(todayObj.getMonth() + 1).padStart(2, '0');
    const day = String(todayObj.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    // Standard list of weekdays in Danish if the database is missing days
    const standardDays = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];

    // Create a lookup map of the data received from the backend based on day name or date
    const planMap = {};
    if (Array.isArray(mealPlanData)) {
        mealPlanData.forEach(item => {
            planMap[item.day_name] = item;
        });
    }

    // Always iterate through all 7 days to ensure the week appears complete
    standardDays.forEach((dayName) => {
        const item = planMap[dayName];
        const isMissing = !item || !item.meal_title; // Tjek om dagen mangler data

        const isToday = item && (item.date === todayString);
        
        // Select classes: Dashed and muted if missing, otherwise normal/highlighted
        let cardClasses = "";
        if (isToday) {
            cardClasses = "border-2 border-emerald-500 bg-[#f4fbf4] shadow-md shadow-emerald-500/10";
        } else if (isMissing) {
            cardClasses = "border-2 border-dashed border-slate-200 bg-slate-50/20 opacity-75 shadow-none";
        } else {
            cardClasses = "border-2 border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 shadow-sm";
        }

        const card = document.createElement("div");
        card.className = `p-5 sm:p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between min-h-[170px] ${cardClasses}`;

        // Map signups if available from backend, otherwise default everyone to 'yes' (attending)
        const signupsMap = {};
        if (item && item.signups) {
            item.signups.forEach(s => {
                signupsMap[s.initials] = { status: s.status, note: s.note };
            });
        }

        const participantsHTML = participantsList.map(initial => {
            const info = signupsMap[initial] || { status: "yes" };
            const status = info.status;
            const note = info.note ? ` (${info.note})` : "";

            let circleStyle = "";
            let tooltipText = "";

            if (status === "yes" || status === "attending") {
                circleStyle = "bg-slate-900 text-white border border-slate-900";
                tooltipText = `${initial}: Spiser med${note}`;
            } else if (status === "maybe") {
                circleStyle = "bg-amber-400 text-slate-900 font-extrabold border-2 border-amber-500 ring-2 ring-amber-100";
                tooltipText = `${initial}: Måske${note}`;
            } else { 
                circleStyle = "bg-slate-200 text-slate-400 line-through border border-slate-300 opacity-60";
                tooltipText = `${initial}: Spiser ikke med${note}`;
            }

            return `
                <div class="tooltip-trigger relative inline-block" tabindex="0">
                    <div class="w-7 h-7 rounded-full ${circleStyle} flex items-center justify-center shadow-sm transition-transform cursor-pointer hover:scale-110">
                        <span class="text-xs font-bold leading-none">${initial}</span>
                    </div>
                    <div class="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none">
                        ${tooltipText}
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                    </div>
                </div>
            `;
        }).join("");

        const mealTitle = isMissing ? "Ikke planlagt endnu..." : item.meal_title;
        const chefName = isMissing ? "Ikke tildelt" : (item.chef_name || 'Ikke tildelt');

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
                </div>
                <i data-lucide="utensils-crossed" class="w-4 h-4 ${isToday ? 'text-emerald-600' : 'text-slate-300'}"></i>
            </div>
            <div class="mb-5">
                <h3 class="text-lg sm:text-xl font-bold ${isMissing ? 'text-slate-400 italic font-medium' : (isToday ? 'text-slate-900' : 'text-slate-800')} tracking-tight leading-snug">
                    ${mealTitle}
                </h3>
            </div>
            <div class="flex items-center justify-between pt-3 border-t ${isToday ? 'border-emerald-200/80' : 'border-slate-200/60'}">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 rounded-full ${isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'} flex items-center justify-center shadow-sm">
                        <i data-lucide="chef-hat" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="text-xs">
                        <span class="text-slate-400 font-medium">Kok: </span>
                        <span class="font-bold ${isMissing ? 'text-slate-400' : 'text-slate-900'}">${chefName}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-1 sm:space-x-1.5">
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