
function makeCard(person, refDate) {
    const template = document.getElementById("cardTemplate");
    const card = template.content.cloneNode(true);

    const img = card.querySelector(".avatar");
    const name = card.querySelector(".name");
    const birthday = card.querySelector(".birthday");
    const age = card.querySelector(".age");
    const genderBadge = card.querySelector(".genderBadge");

    // SAFE IMAGE LOADING
    img.onerror = () => {
        img.src = "https://via.placeholder.com/150?text=No+Image";
    };
    img.src = person.ImageURL || "https://via.placeholder.com/150?text=No+Image";

    name.textContent = person.Name;

    const dt = new Date(person.BirthdayRaw);
    if (!isNaN(dt)) {
        birthday.textContent = dt.toLocaleDateString();
        age.textContent = "Age: " + (refDate.getFullYear() - dt.getFullYear());
    }

    // GENDER BADGES
    if (person.Gender?.toLowerCase() === "male") {
        genderBadge.textContent = "♂";
        genderBadge.classList.add("genderMale");
    } else if (person.Gender?.toLowerCase() === "female") {
        genderBadge.textContent = "♀";
        genderBadge.classList.add("genderFemale");
    } else {
        genderBadge.textContent = "⚧";
        genderBadge.classList.add("genderOther");
    }

    return card;
}


async function init() {
try {

    // DOM ELEMENTS (important)
    const todaySection = document.getElementById("todaySection");
    const upcomingSection = document.getElementById("upcomingSection");
    const pastSection = document.getElementById("pastSection");

    const todayCount = document.getElementById("todayCount");
    const upcomingCount = document.getElementById("upcomingCount");
    const pastCount = document.getElementById("pastCount");

    const loading = document.getElementById("loading");
    const content = document.getElementById("content");
    const errorBox = document.getElementById("error");

    const API_URL = 'https://script.google.com/macros/s/AKfycbwyTXs8jhGfi8eD1NhQsww43JZKD-N8IcJMgYx3lhKAjVfHCueWMNKtsRmqoe8PJStQaA/exec';

    // FETCH API
    const resp = await fetch(API_URL);
    if (!resp.ok) throw new Error('Network response not ok: ' + resp.status);

    const json = await resp.json();
    console.log("API DATA:", json);  // Debug

    const refDate = new Date();

    const today = (json.today || []).map(p => ({ ...p }));
    const upcoming = (json.upcoming || []).map(p => ({ ...p }));
    const past = (json.past || []).map(p => ({ ...p }));

    // CLEAR UI
    todaySection.innerHTML = '';
    upcomingSection.innerHTML = '';
    pastSection.innerHTML = '';

    // TODAY
    if (today.length === 0) {
        todaySection.innerHTML =
          `<div class="col-span-full p-8 bg-white rounded-2xl shadow-md text-center">No birthdays today 🕊️</div>`;
    } else {
        today.forEach(p => todaySection.appendChild(makeCard(p, refDate)));
        setTimeout(() => window.confetti && confetti({ particleCount: 150, spread: 70 }), 400);
    }

    // UPCOMING
    if (upcoming.length === 0) {
        upcomingSection.innerHTML =
          `<div class="col-span-full p-6 bg-white rounded-2xl shadow-md text-center">No upcoming birthdays found</div>`;
    } else {
        upcoming.forEach(p => upcomingSection.appendChild(makeCard(p, refDate)));
    }

    // PAST
    if (past.length === 0) {
        pastSection.innerHTML =
          `<div class="col-span-full p-6 bg-white rounded-2xl shadow-md text-center">No recent birthdays</div>`;
    } else {
        past.forEach(p => pastSection.appendChild(makeCard(p, refDate)));
    }

    todayCount.textContent = `${today.length} listed`;
    upcomingCount.textContent = `${upcoming.length} listed`;
    pastCount.textContent = `${past.length} listed`;

    // FILTERS
    const searchInput = document.getElementById("searchInput");
    const monthFilter = document.getElementById("monthFilter");

    function applyFilters() {
        const q = searchInput.value.trim().toLowerCase();
        const m = monthFilter.value;

        document.querySelectorAll('.card').forEach(card => {
            const name = card.querySelector('.name').textContent.toLowerCase();
            const dateText = card.querySelector('.birthday').textContent;

            let show = true;

            if (q && !name.includes(q)) show = false;

            if (m !== "all") {
                const month = new Date(dateText + " 2000").getMonth() + 1;
                if (String(month) !== m) show = false;
            }

            card.style.display = show ? "" : "none";
        });
    }

    searchInput.addEventListener("input", applyFilters);
    monthFilter.addEventListener("change", applyFilters);

    loading.classList.add("hidden");
    content.classList.remove("hidden");

    gsap.from(".card", { opacity: 0, y: 10, stagger: 0.06, duration: 0.5 });

} catch (err) {
    console.error(err);
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
    document.getElementById("errorMsg").textContent = "Could not load birthdays: " + err.message;
}
}

init();
