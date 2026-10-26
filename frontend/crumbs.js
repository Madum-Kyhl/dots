let selectedWeek = 44;
const CURRENT_WEEK_NUM = 44;

document.addEventListener("DOMContentLoaded", () => {
    // Only initialize if crumbs view elements exist
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
        // Fallback or empty state render if API isn't fully wired yet
        document.getElementById("mealsContainer").innerHTML = `
            <p class="text-xs text-slate-400 text-center py-8">Kunne ikke hente madplan for uge ${weekNum}.</p>
        `;
    }
}

function renderCrumbs(mealPlanData, weekNum) {
    const mealsContainer = document.getElementById("mealsContainer");
    mealsContainer.innerHTML = "";

    mealPlanData.forEach((item) => {
        const isCurrentWeekMonday = (weekNum === CURRENT_WEEK_NUM && item.day_name === "Mandag");
        
        const cardClasses = isCurrentWeekMonday
            ? "border-2 border-emerald-500 bg-[#f7fee7] shadow-md shadow-emerald-500/10"
            : "border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 shadow-sm";

        const card = document.createElement("div");
        card.className = `p-5 sm:p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between ${cardClasses}`;

        // Participants badges rendering loop can be wired here based on item.signups
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-extrabold uppercase tracking-wider ${isCurrentWeekMonday ? 'text-emerald-800' : 'text-slate-400'}">
                        ${item.day_name}
                    </span>
                    ${isCurrentWeekMonday ? `
                        <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md tracking-wide flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            I DAG
                        </span>
                    ` : ''}
                </div>
                <i data-lucide="utensils-crossed" class="w-4 h-4 ${isCurrentWeekMonday ? 'text-emerald-600' : 'text-slate-300'}"></i>
            </div>
            <div class="mb-5">
                <h3 class="text-lg sm:text-xl font-bold ${isCurrentWeekMonday ? 'text-slate-900' : 'text-slate-800'} tracking-tight leading-snug">
                    ${item.meal_title}
                </h3>
            </div>
            <div class="flex items-center justify-between pt-3 border-t ${isCurrentWeekMonday ? 'border-emerald-200/80' : 'border-slate-200/60'}">
                <div class="flex items-center space-x-2">
                    <div class="w-6.5 h-6.5 rounded-full ${isCurrentWeekMonday ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'} flex items-center justify-center">
                        <i data-lucide="chef-hat" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="text-xs">
                        <span class="text-slate-400 font-medium">Kok: </span>
                        <span class="font-bold text-slate-900">${item.chef_name || 'Ikke tildelt'}</span>
                    </div>
                </div>
            </div>
        `;
        mealsContainer.appendChild(card);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}