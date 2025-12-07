const API_URL =
  "https://script.google.com/macros/s/AKfycbwIsWvWZHlR07GqbjJPxH_sEIB3LJJRXZA2CKJjhYksFlqd_UbG5jEzeQo4dC2sM-poOQ/exec";

const qs = (s) => document.querySelector(s);
function parseDOB(s) {
  if (!s) return null;
  s = String(s).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function prettyDate(d) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayName(d) {
  return d.toLocaleDateString("en-IN", { weekday: "long" });
}

async function saveDOB() {
  const modal = qs("#birthdayModal");
  
  const Name = qs("#newName").value.trim();
  const Email = qs("#newEmail").value.trim();
  const Birthday = qs("#newDOB").value;
  const ImageURL = qs("#newImage").value.trim();
  const Gender = qs("#newGender")?.value || "";

  if (!Name || !Email || !Birthday) {
    alert("⚠ Please fill Name, Email, DOB");
    return;
  }

  const payload = {
    action: "add",
    Name,
    Email,
    Birthday,
    ImageURL,
    Gender
  };

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)   // ❌ no headers → no CORS issue
    });

    const result = await resp.json();
    console.log(result);

    if (result.success) {
      alert("🎉 Birthday Saved Successfully!");
      modal.classList.add("hidden");
      window.location.reload();
    } else {
      alert("❌ Error: " + result.message);
    }
  } catch (err) {
    alert("❌ Network error: " + err.message);
  }
}

// async function saveDOB() {
//   const modal = qs("#birthdayModal");

//   const Name = qs("#newName").value.trim();
//   const Email = qs("#newEmail").value.trim();
//   const Birthday = qs("#newDOB").value;
//   const ImageURL = qs("#newImage").value.trim();
//   const Gender = qs("#newGender")?.value || "";

//   if (!Name || !Email || !Birthday) {
//     alert("⚠ Please fill Name, Email, DOB");
//     return;
//   }

//   const payload = {
//     action: "add",
//     Name,
//     Email,
//     Birthday,
//     ImageURL,
//     Gender
//   };

//   try {
//     const resp = await fetch(API_URL, {
//       method: "POST",
//       body: JSON.stringify(payload)   // ❌ no headers → no CORS issue
//     });

//     const result = await resp.json();
//     console.log(result);

//     if (result.success) {
//       alert("🎉 Birthday Saved Successfully!");
//       modal.classList.add("hidden");
//       window.location.reload();
//     } else {
//       alert("❌ Error: " + result.message);
//     }
//   } catch (err) {
//     alert("❌ Network error: " + err.message);
//   }
// }

function makeCard(person, refDate) {
  const dt = parseDOB(person.BirthdayRaw || "");
  const card = document.createElement("div");
  card.className = "card-item";
  if (dt) card.dataset.date = dt.toISOString();

  card.innerHTML = `
    <img class="card-img" src="${person.ImageURL || ""}" alt="avatar"/>
    <div class="card-info">
      <div class="card-name">${person.Name}</div>
      <div class="card-date">${
        dt ? `🎂 ${prettyDate(dt)} (${dayName(dt)})` : "DOB unknown"
      }</div>
      <div class="card-age">${
        dt ? `Turning ${refDate.getFullYear() - dt.getFullYear()}` : "--"
      }</div>
    </div>
  `;

  const img = card.querySelector(".card-img");
  img.onerror = () =>
    (img.src = `https://randomuser.me/api/portraits/lego/${Math.floor(
      Math.random() * 10 + 1
    )}.jpg`);

  card.onclick = () => openPopup(person, dt);
  return card;
}

async function init() {
  const loading = qs("#loading");
  const content = qs("#content");
  const errorUI = qs("#error");
  const errorMsgEl = qs("#errorMsg");
  const todayBanner = qs("#bigTodayFrame");

  try {
    const resp = await fetch(API_URL);
    if (!resp.ok) throw new Error("API not reachable");

    const json = await resp.json();

    const refDate = new Date();
    const today = json.today || [];
    const upcoming = json.upcoming || [];
    const past = json.past || [];

    const gt = qs("#todaySection .gridCards");
    const gu = qs("#upcomingSection .gridCards");
    const gp = qs("#pastSection .gridCards");

    if (gt) gt.innerHTML = "";
    if (gu) gu.innerHTML = "";
    if (gp) gp.innerHTML = "";

    const add = (el, p) => el.appendChild(makeCard(p, refDate));
    if (gt) today.forEach((p) => add(gt, p));
    if (gu) upcoming.forEach((p) => add(gu, p));
    if (gp) past.forEach((p) => add(gp, p));

    // ✅ Today Banner Large Frame Logic
    if (today.length > 0) {
      const p = today[0];
      const dt = parseDOB(p.BirthdayRaw || "");
      const day = dt ? dayName(dt) : "";
      const pretty = dt ? prettyDate(dt) : p.BirthdayRaw;
      const ageNumber = dt ? refDate.getFullYear() - dt.getFullYear() : "--";

      todayBanner.classList.remove("hidden");
      qs("#dynamicTodayImg").src = p.ImageURL || "";
      qs("#dynamicTodayImg").onerror = () => {
        qs(
          "#dynamicTodayImg"
        ).src = `https://randomuser.me/api/portraits/lego/${Math.floor(
          Math.random() * 10 + 1
        )}.jpg`;
      };

      qs("#dynamicTodayName").textContent = `🎉 Happy Birthday, ${p.Name}! 🎉`;
      qs("#dynamicTodayDate").textContent = `📅 ${pretty}`;
      qs("#dynamicTodayDay").textContent = `🎁 ${day}`;
      qs(
        "#todayCount"
      ).textContent = `🎂 ${today.length} birthdays today (Age ${ageNumber})`;

      setTimeout(() => confetti({ particleCount: 120, spread: 80 }), 400);
    } else {
      // ✅ Agar kisi ka birthday nahi hai
      if (todayBanner) todayBanner.classList.remove("hidden");
      qs("#dynamicTodayName").textContent = "No birthdays today 🎈";
      qs("#todayCount").textContent = "0 listed";
    }

    loading.classList.add("hidden");
    content.classList.remove("hidden");
  } catch (err) {
    console.error("Load error:", err);
    loading.classList.add("hidden");
    errorUI.classList.remove("hidden");
    errorMsgEl.textContent = err.message;
  }
}

// ✅ SEARCH + MONTH FILTER
function applyFilters() {
  const q = qs("#searchInput").value.trim().toLowerCase();
  const m = qs("#monthFilter").value;

  document.querySelectorAll(".card-item").forEach((card) => {
    const name = card.querySelector(".card-name").textContent.toLowerCase();
    const dt = new Date(card.dataset.date);
    let show = true;
    if (q && !name.includes(q)) show = false;
    if (m !== "all" && !isNaN(dt)) {
      if (String(dt.getMonth() + 1) !== m) show = false;
    }
    card.style.display = show ? "" : "none";
  });
}

function setupModal() {
  const modal = qs("#birthdayModal");
  qs("#openModalBtn").onclick = () => modal.classList.remove("hidden");
  qs("#closeModalBtn").onclick = () => modal.classList.add("hidden");
  qs("#saveBirthdayBtn").onclick = saveDOB;
}
// ✅ DARK MODE TOGGLE
qs("#themeToggle").onclick = () => {
  document.body.classList.toggle("theme-dark");
};

window.onload = () => {
  init();
  qs("#searchInput").oninput = applyFilters;
  qs("#monthFilter").onchange = applyFilters;
  setupModal();
};

// ✅ POPUP OPEN ON CLICK
function openPopup(person, dt) {
  const popup = qs("#detailPopup");
  const img = qs("#pImg");
  const name = qs("#pName");
  const dateEl = qs("#pDate");
  const dayEl = qs("#pDay");
  const age = qs("#detailAge");

  popup.classList.add("show");
  popup.style.display = "flex";

  img.src = person.ImageURL;
  name.textContent = person.Name;

  if (dt && !isNaN(dt)) {
    dateEl.textContent = dt.toLocaleDateString("en-IN", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
    dayEl.textContent = dt.toLocaleDateString("en-IN", { weekday: "long" });
    age.textContent = new Date().getFullYear() - dt.getFullYear();
  } else {
    dateEl.textContent = person.Birthday;
    dayEl.textContent = "";
    age.textContent = "--";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("detailPopup");
  document.getElementById("popupCloseBtn")?.addEventListener("click", () => {
    popup.classList.remove("show");
    popup.style.display = "none";
  });
});
