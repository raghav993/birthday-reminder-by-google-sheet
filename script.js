async function init() {
try {

const API_URL = 'https://script.google.com/macros/s/AKfycbwyTXs8jhGfi8eD1NhQsww43JZKD-N8IcJMgYx3lhKAjVfHCueWMNKtsRmqoe8PJStQaA/exec';

const resp = await fetch(API_URL);
if(!resp.ok) throw new Error('Network response not ok: ' + resp.status);
const json = await resp.json();

const refDate = new Date();

const today = (json.today||[]).map(p=>({...p, BirthdayRaw: p.BirthdayRaw || p.Birthday || ''}));
const upcoming = (json.upcoming||[]).map(p=>({...p, BirthdayRaw: p.BirthdayRaw || p.Birthday || ''}));
const past = (json.past||[]).map(p=>({...p, BirthdayRaw: p.BirthdayRaw || p.Birthday || ''}));

todaySection.innerHTML = '';
upcomingSection.innerHTML = '';
pastSection.innerHTML = '';

if(!today || today.length===0){
    todaySection.innerHTML = `<div class="col-span-full p-8 bg-white rounded-2xl shadow-md text-center">No birthdays today 🕊️</div>`;
} else {
    today.forEach(p=> todaySection.appendChild(makeCard(p, refDate)));
    setTimeout(()=>{ if(window.confetti) confetti({particleCount:150, spread:70}); },400);
}

if(!upcoming || upcoming.length===0){
    upcomingSection.innerHTML = `<div class="col-span-full p-6 bg-white rounded-2xl shadow-md text-center">No upcoming birthdays found</div>`;
} else { upcoming.forEach(p=> upcomingSection.appendChild(makeCard(p, refDate))); }

if(!past || past.length===0){
    pastSection.innerHTML = `<div class="col-span-full p-6 bg-white rounded-2xl shadow-md text-center">No recent birthdays</div>`;
} else { past.forEach(p=> pastSection.appendChild(makeCard(p, refDate))); }

todayCount.textContent = `${today.length} listed`;
upcomingCount.textContent = `${upcoming.length} listed`;
pastCount.textContent = `${past.length} listed`;

// Filters
const searchInput = qs('#searchInput');
const monthFilter = qs('#monthFilter');

function applyFilters(){
    const q = searchInput.value.trim().toLowerCase();
    const m = monthFilter.value;

    const allNodes = Array.from(document.querySelectorAll('.card'))
        .map(n=>({
            el:n,
            name:n.querySelector('.name').textContent.toLowerCase(),
            bday:n.querySelector('.birthday').textContent
        }));

    allNodes.forEach(item=>{
        let show = true;

        if(q && !item.name.includes(q)) show = false;

        if(m !== 'all' && m!==''){
            const mon = item.bday ? new Date(item.bday + ' 2000').getMonth()+1 : null;
            if(mon !== null && String(mon) !== String(m)) show = false;
        }

        item.el.style.display = show ? '' : 'none';
    });
}

searchInput.addEventListener('input', applyFilters);
monthFilter.addEventListener('change', applyFilters);

loading.classList.add('hidden');
content.classList.remove('hidden');

gsap.from('.card',{opacity:0,y:10,stagger:0.06,duration:0.5});

}
catch(err){
    console.error(err);
    loading.classList.add('hidden');
    errorBox.classList.remove('hidden');
    qs('#errorMsg').textContent = 'Could not load birthdays. ' + (err.message || '');
}

}

init();     // CALL INIT()
