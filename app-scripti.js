// === CONFIG ===
const SHEET_NAME = 'Sheet1';
const SHEET_ID_PROP = 'BIRTHDAY_SHEET_ID';   // DO NOT put your sheet ID here
const TIMEZONE = 'Asia/Kolkata';
const ERROR_NOTIFY_EMAIL = Session.getEffectiveUser().getEmail();

function setSpreadsheetId() {
  const id = "1-ZRQy6iiFu_2SbVALlp4zznMWDKj55jzpuTjk7NEyx0"; 
  PropertiesService.getScriptProperties().setProperty(SHEET_ID_PROP, id);
  Logger.log("Spreadsheet ID saved: " + id);
}
function cors(json) {
  return ContentService
    .createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseDate(s) {
  if (!s) return null;

  if (Object.prototype.toString.call(s) === "[object Date]") return s;

  s = String(s).trim();

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map(Number);
    return new Date(y, m - 1, d);
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function rowToObj(headers, r) {
  const obj = {};
  headers.forEach((h, i) => obj[h] = r[i]);
  return obj;
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendDailyBirthdayEmails() {
  try {
    const ssId = PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROP);

    if (!ssId) {
      const msg = "Spreadsheet ID NOT SET. Run: setSpreadsheetId('YOUR_ID')";
      MailApp.sendEmail(ERROR_NOTIFY_EMAIL, "Birthday Script Missing Sheet ID", msg);
      return;
    }

    const ss = SpreadsheetApp.openById(ssId);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      const msg = `Sheet "${SHEET_NAME}" not found.`;
      MailApp.sendEmail(ERROR_NOTIFY_EMAIL, "Birthday Script Sheet Missing", msg);
      return;
    }

    const raw = sheet.getDataRange().getValues();
    if (raw.length < 2) return;

    const headers = raw[0];
    const rows = raw.slice(1);

    const people = rows
      .filter(r => r.some(c => c))
      .map(r => rowToObj(headers, r));

    const now = new Date();
    const today = new Date(Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd"));

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sameMD = (d, x) => d.getDate() === x.getDate() && d.getMonth() === x.getMonth();

    const todays = [];
    const tomorrows = [];

    people.forEach(p => {
      const dob = parseDate(p.Birthday || p.BirthdayRaw || p.DOB);
      if (!dob) return;

      if (sameMD(dob, today)) todays.push(p);
      if (sameMD(dob, tomorrow)) tomorrows.push(p);
    });

    if (todays.length === 0 && tomorrows.length === 0) return;

    const allEmails = people.map(p => p.Email).filter(Boolean);
    const bdayEmails = [...todays, ...tomorrows].map(p => p.Email).filter(Boolean);
    const receivers = allEmails.filter(e => !bdayEmails.includes(e));

    let html = `<div style="font-family:Poppins,Arial">`;

    if (todays.length) {
      html += `<h2 style="background:#1565c0;padding:10px;color:white;border-radius:8px">🎂 Today's Birthdays</h2>`;
      todays.forEach(p => {
        html += `
        <div style="display:flex;align-items:center;margin:10px 0">
          <img src="${p.ImageURL}" 
               style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-right:10px"
               onerror="this.src='https://randomuser.me/api/portraits/lego/2.jpg'"/>
          <div>
            <strong>${p.Name}</strong><br>
            <small>${p.Birthday}</small>
          </div>
        </div>`;
      });
    }

    if (tomorrows.length) {
      html += `<h2 style="background:#6a1b9a;padding:10px;color:white;border-radius:8px">🎉 Tomorrow</h2>`;
      tomorrows.forEach(p => {
        html += `
        <div style="display:flex;align-items:center;margin:10px 0">
          <img src="${p.ImageURL}" 
               style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-right:10px"
               onerror="this.src='https://randomuser.me/api/portraits/lego/3.jpg'"/>
          <div>
            <strong>${p.Name}</strong><br>
            <small>${p.Birthday}</small>
          </div>
        </div>`;
      });
    }

    html += `<hr><small>Automated reminder — Birthday App</small></div>`;

    MailApp.sendEmail({
      to: ERROR_NOTIFY_EMAIL,
      bcc: receivers.join(","),
      subject: "🎂 Birthday Reminder (Today + Tomorrow)",
      htmlBody: html
    });

  } catch (err) {
    MailApp.sendEmail(ERROR_NOTIFY_EMAIL, "Birthday Script Error", err.toString());
  }
}

function testSendBirthdayEmail() {
  sendDailyBirthdayEmails();
}

function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) return respond({ error: 'Sheet not found' });

    const rows = sh.getDataRange().getValues();
    const [head, ...body] = rows;
    const list = body.filter(r => r.some(c => c !== '' && c !== null));

    const parse = s=>{
      if(!s) return null;
      s=String(s);
      if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)){
        const[d,m,y]=s.split("/").map(Number);
        return new Date(y,m-1,d);
      }
      const d=new Date(s);
      return isNaN(d)?null:d;
    };
    const start=d=>new Date(Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd'));
    const diff=(a,b)=>Math.round((start(b).getTime()-start(a).getTime())/8.64e7);
    const today=start(new Date());
    const outArr=[];

    list.forEach(r=>{
      const bd=parse(r[2]);
      if(!bd) return;
      const thisYear=new Date(today.getFullYear(),bd.getMonth(),bd.getDate());
      const d=diff(today,thisYear);
      if(d===0) outArr.push(obj(head,r,bd));
      else if(Math.abs(d)<=30 && d<0) outArr.push({ ...obj(head,r,bd), past:true, daysAgo:Math.abs(d) });
      else if(d>0) outArr.push({ ...obj(head,r,bd), upcoming:true, daysTo:d });
    });

    const todays=outArr.filter(p=>!p.past && !p.upcoming);
    const upcoming=outArr.filter(p=>p.upcoming);
    const past=outArr.filter(p=>p.past);

    upcoming.sort((a,b)=>a.daysTo-b.daysTo);
    past.sort((a,b)=>a.daysAgo-b.daysAgo);

    return respond({ today:todays, upcoming, past, all:outArr });
  } catch(err){
    return respond({ error:err.toString() });
  }
}
//old
// function doPost(e) {
//   try {
//     const ss = SpreadsheetApp.getActive();
//     const sh = ss.getSheetByName(SHEET_NAME);

//     const body = JSON.parse(e.postData.contents || "{}");

//     if (body.action !== "add")
//       return respond({ success: false, message: "Unknown action" });

//     const d = new Date(body.Birthday);
//     if (isNaN(d))
//       return respond({ success: false, message: "Invalid DOB" });

//     sh.appendRow([
//       body.Name || "",
//       body.Email || "",
//       Utilities.formatDate(d, TIMEZONE, "dd/MM/yyyy"),
//       body.ImageURL || "",
//       body.Gender || ""
//     ]);

//     return respond({ success: true, message: "Birthday added" });

//   } catch (err) {
//     return respond({ success: false, message: err.toString() });
//   }
// }

//new
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    const ssId = PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROP);
    const ss = SpreadsheetApp.openById(ssId);
    const sh = ss.getSheetByName(SHEET_NAME);

    const dob = new Date(body.Birthday);
    if (isNaN(dob)) return cors({ success: false, message: "Invalid DOB" });

    const formattedDOB = Utilities.formatDate(dob, TIMEZONE, "dd/MM/yyyy");

    sh.appendRow([
      body.Name,
      body.Email,
      formattedDOB,
      body.ImageURL || "",
      body.Gender || ""
    ]);

    return cors({ success: true });

  } catch (err) {
    return cors({ success: false, message: err.toString() });
  }
}

function obj(h,r,d){
  const year=d.getFullYear();
  const age=new Date().getFullYear()-year;
  const day=d.toLocaleDateString("en-IN",{weekday:"long"});
  return { Name:r[0], Email:r[1], BirthdayRaw:r[2], ImageURL:r[3], Gender:r[4], DOB:d.toISOString(), Birthday:Utilities.formatDate(d,TIMEZONE,"dd MMM yyyy"), BirthdayDay:day, Age:age };
}

function respond(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}




