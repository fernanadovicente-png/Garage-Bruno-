// Garage Bruno v3.1 — full logic
const I18N = {
  pt: {install:"Instalar",history:"Histórico",new:"Novo",save:"Guardar",pdf:"Exportar PDF",clientVehicle:"Cliente & Veículo",clientName:"Nome do cliente",phone:"Telefone",date:"Data",plate:"Matrícula",brand:"Marca",model:"Modelo",notes:"Observações",services:"Serviços",parts:"Peças",addLine:"+ Linha",service:"Serviço",part:"Peça",qty:"Qtd",unit:"Preço Un.",total:"Total",servicesTotal:"Total Serviços",partsTotal:"Total Peças",labor:"Mão de obra",hours:"Horas",rate:"Tarifa / hora",laborTotal:"Total Mão de Obra",grandTotal:"Total Global",historyTitle:"Histórico de intervenções",signedBy:"Assinado por",signatureDate:"Data",emptyName:"Indica o nome do cliente para guardar.",saved:"Guardado",savedMsg:"A intervenção foi guardada localmente.",exportInfo:"Usa a função imprimir do navegador e escolhe 'Guardar como PDF'."},
  fr: {install:"Installer",history:"Historique",new:"Nouveau",save:"Enregistrer",pdf:"Exporter PDF",clientVehicle:"Client & Véhicule",clientName:"Nom du client",phone:"Téléphone",date:"Date",plate:"Plaque",brand:"Marque",model:"Modèle",notes:"Remarques",services:"Prestations",parts:"Pièces",addLine:"+ Ligne",service:"Prestation",part:"Pièce",qty:"Qté",unit:"Prix U.",total:"Total",servicesTotal:"Total Prestations",partsTotal:"Total Pièces",labor:"Main-d'œuvre",hours:"Heures",rate:"Tarif / heure",laborTotal:"Total Main-d'œuvre",grandTotal:"Total Global",historyTitle:"Historique des interventions",signedBy:"Signé par",signatureDate:"Date",emptyName:"Indiquez le nom du client pour enregistrer.",saved:"Enregistré",savedMsg:"L'intervention a été enregistrée localement.",exportInfo:"Utilisez l'impression du navigateur et choisissez 'Enregistrer en PDF'."}
};
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Language & placeholders
function applyI18n(lang){
  $$("[data-i18n]").forEach(el=>{ const k=el.dataset.i18n; if(I18N[lang][k]) el.textContent = I18N[lang][k]; });
  $("#client").placeholder = lang==="fr"?"Ex: Jean Dupont":"Ex: João Silva";
  $("#brand").placeholder = lang==="fr"?"Ex: Renault":"Ex: VW";
  $("#model").placeholder = lang==="fr"?"Ex: Clio 1.2":"Ex: Golf 1.4 TSI";
  $("#notes").placeholder = lang==="fr"?"Remarques générales...":"Notas gerais...";
  refreshHistory();
}
const langSel = $("#lang");
langSel.value = localStorage.getItem("gb_lang") || "pt";
applyI18n(langSel.value);
langSel.addEventListener("change", ()=>{ localStorage.setItem("gb_lang", langSel.value); applyI18n(langSel.value); });

// Currency & VAT
const curSel = $("#currency");
const vatInput = $("#vat");
curSel.value = localStorage.getItem("gb_cur") || "CHF";
vatInput.value = localStorage.getItem("gb_vat") || "7.7";
curSel.addEventListener("change", ()=>{ localStorage.setItem("gb_cur", curSel.value); recalcAll(); refreshHistory(); });
vatInput.addEventListener("input", ()=>{ localStorage.setItem("gb_vat", vatInput.value); recalcAll(); });
function fmt(n){ return `${Number(n||0).toFixed(2)} ${curSel.value}`; }

// PWA install
let deferredPrompt = null;
const installBtn = $("#install");
installBtn.disabled = true;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.disabled = false;
});
installBtn.addEventListener("click", async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.disabled = true;
});

// Tables
const servicesTBody = $("#servicesTable tbody");
const partsTBody = $("#partsTable tbody");
function addRow(tbody, isService=true){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="desc" placeholder="${isService?(langSel.value==='fr'?'Prestation':'Serviço'):(langSel.value==='fr'?'Pièce':'Peça')}"></td>
    <td><input type="number" class="qty" step="0.01" value="1"></td>
    <td><input type="number" class="unit" step="0.01" value="0"></td>
    <td class="right line-total">0.00 ${curSel.value}</td>
    <td class="row-actions"><button class="btn ghost del">✖</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelectorAll("input").forEach(inp=>inp.addEventListener("input", recalcAll));
  tr.querySelector(".del").addEventListener("click", ()=>{ tr.remove(); recalcAll(); });
}
$("#addService").addEventListener("click", ()=>addRow(servicesTBody,true));
$("#addPart").addEventListener("click", ()=>addRow(partsTBody,false));
// initial rows
addRow(servicesTBody,true);
addRow(partsTBody,false);

// Calculations
function recalcSection(tbody){
  let sum = 0;
  tbody.querySelectorAll("tr").forEach(tr=>{
    const qty = parseFloat(tr.querySelector(".qty").value || "0");
    const unit = parseFloat(tr.querySelector(".unit").value || "0");
    const total = qty * unit; sum += total;
    tr.querySelector(".line-total").textContent = fmt(total);
  });
  return sum;
}
function recalcAll(){
  const s = recalcSection(servicesTBody);
  const p = recalcSection(partsTBody);
  $("#servicesSum").textContent = fmt(s);
  $("#partsSum").textContent = fmt(p);
  const labor = (parseFloat($("#laborHours").value||"0") * parseFloat($("#laborRate").value||"0"));
  $("#laborTotal").textContent = fmt(labor);
  const sub = s + p + labor;
  $("#subTotal").textContent = fmt(sub);
  const vat = sub * (parseFloat(vatInput.value||"0")/100);
  $("#vatValue").textContent = fmt(vat);
  $("#grandTotal").textContent = fmt(sub + vat);
}
$("#laborHours").addEventListener("input", recalcAll);
$("#laborRate").addEventListener("input", recalcAll);

// Storage / History
const KEY = "gb_records_v3_1";
function listRecords(){ return (JSON.parse(localStorage.getItem(KEY)||"[]")).sort((a,b)=>b.ts-a.ts); }
function saveRecord(data, id=null){
  const arr = listRecords();
  if(id){ const i = arr.findIndex(x=>x.id===id); if(i>=0) arr[i] = {...arr[i], ...data, id}; else arr.unshift({...data, id}); }
  else { id = "R"+Math.random().toString(36).slice(2,9)+Date.now().toString(36); arr.unshift({...data, id}); }
  localStorage.setItem(KEY, JSON.stringify(arr));
  return id;
}
function deleteRecord(id){ localStorage.setItem(KEY, JSON.stringify(listRecords().filter(x=>x.id!==id))); }
function collectData(){
  return {
    ts: Date.now(),
    lang: langSel.value,
    currency: curSel.value,
    vat: vatInput.value,
    client: $("#client").value.trim(),
    phone: $("#phone").value.trim(),
    date: $("#date").value,
    plate: $("#plate").value.trim(),
    brand: $("#brand").value.trim(),
    model: $("#model").value.trim(),
    notes: $("#notes").value.trim(),
    services: Array.from(servicesTBody.querySelectorAll("tr")).map(tr=>({desc: tr.querySelector(".desc").value, qty: parseFloat(tr.querySelector(".qty").value||"0"), unit: parseFloat(tr.querySelector(".unit").value||"0")})),
    parts: Array.from(partsTBody.querySelectorAll("tr")).map(tr=>({desc: tr.querySelector(".desc").value, qty: parseFloat(tr.querySelector(".qty").value||"0"), unit: parseFloat(tr.querySelector(".unit").value||"0")})),
    laborHours: parseFloat($("#laborHours").value||"0"),
    laborRate: parseFloat($("#laborRate").value||"0"),
    totals: {
      services: $("#servicesSum").textContent,
      parts: $("#partsSum").textContent,
      labor: $("#laborTotal").textContent,
      sub: $("#subTotal").textContent,
      vat: $("#vatValue").textContent,
      grand: $("#grandTotal").textContent,
    }
  };
}
function fillData(d){
  langSel.value = d.lang || (localStorage.getItem("gb_lang")||"pt"); applyI18n(langSel.value);
  curSel.value = d.currency || (localStorage.getItem("gb_cur")||"CHF");
  vatInput.value = d.vat || (localStorage.getItem("gb_vat")||"7.7");
  $("#client").value = d.client || ""; $("#phone").value = d.phone || ""; $("#date").value = d.date || "";
  $("#plate").value = d.plate || ""; $("#brand").value = d.brand || ""; $("#model").value = d.model || "";
  $("#notes").value = d.notes || "";
  servicesTBody.innerHTML = ""; partsTBody.innerHTML = "";
  (d.services && d.services.length? d.services : [{desc:"",qty:1,unit:0}]).forEach(()=>addRow(servicesTBody,true));
  (d.services||[]).forEach((row,i)=>{ const tr=servicesTBody.querySelectorAll("tr")[i]; tr.querySelector(".desc").value=row.desc??""; tr.querySelector(".qty").value=row.qty??0; tr.querySelector(".unit").value=row.unit??0; });
  (d.parts && d.parts.length? d.parts : [{desc:"",qty:1,unit:0}]).forEach(()=>addRow(partsTBody,false));
  (d.parts||[]).forEach((row,i)=>{ const tr=partsTBody.querySelectorAll("tr")[i]; tr.querySelector(".desc").value=row.desc??""; tr.querySelector(".qty").value=row.qty??0; tr.querySelector(".unit").value=row.unit??0; });
  recalcAll();
}

// Toolbar
let currentId = null;
$("#new").addEventListener("click", ()=>{ currentId=null; fillData({services:[],parts:[]}); });
$("#save").addEventListener("click", ()=>{
  const d = collectData();
  if(!d.client){ alert(I18N[langSel.value].emptyName); return; }
  currentId = saveRecord(d, currentId);
  alert(I18N[langSel.value].saved + " ✅\n" + I18N[langSel.value].savedMsg);
  refreshHistory();
});
$("#pdf").addEventListener("click", ()=>{ alert(I18N[langSel.value].exportInfo); window.print(); });

// History dialog
const historyDlg = $("#history");
$("#historyBtn").addEventListener("click", ()=>{ refreshHistory(); historyDlg.showModal(); });
function refreshHistory(){
  const box = $("#historyList"); if(!box) return;
  const list = listRecords();
  box.innerHTML = "";
  list.forEach(item=>{
    const div = document.createElement("div");
    const title = `${item.client||'—'} · ${item.plate||''} · ${item.totals?.grand||''}`;
    div.className="history-item";
    div.innerHTML = `
      <div><div><strong>${title}</strong></div><div class="muted">${new Date(item.ts).toLocaleString()}</div></div>
      <div class="row-actions">
        <button class="btn" data-a="view">Ver</button>
        <button class="btn" data-a="edit">Editar</button>
        <button class="btn" data-a="dup">Duplicar</button>
        <button class="btn danger" data-a="del">Apagar</button>
      </div>`;
    div.querySelector('[data-a="view"]').addEventListener("click", ()=>fillData(item));
    div.querySelector('[data-a="edit"]').addEventListener("click", ()=>{ currentId=item.id; fillData(item); });
    div.querySelector('[data-a="dup"]').addEventListener("click", ()=>{ currentId=null; fillData(item); });
    div.querySelector('[data-a="del"]').addEventListener("click", ()=>{ if(confirm("Confirmar apagar?")){ deleteRecord(item.id); refreshHistory(); }});
    box.appendChild(div);
  });
}

// Initial calc
recalcAll();

// Service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js');
  });
}
