// Garage Bruno v2 — logic
const I18N = {
  pt: { install:"Instalar", history:"Histórico", new:"Novo", save:"Guardar", pdf:"Exportar PDF",
    clientVehicle:"Cliente & Veículo", clientName:"Nome do cliente", phone:"Telefone", date:"Data",
    plate:"Matrícula", brand:"Marca", model:"Modelo", notes:"Observações", services:"Serviços",
    parts:"Peças", addLine:"+ Linha", service:"Serviço", part:"Peça", qty:"Qtd", unit:"Preço Un.",
    total:"Total", servicesTotal:"Total Serviços", partsTotal:"Total Peças", labor:"Mão de obra",
    hours:"Horas", rate:"Tarifa / hora", laborTotal:"Total Mão de Obra", grandTotal:"Total Global",
    signature:"Assinatura", signatureHint:"Ao exportar o PDF, peça a assinatura do cliente.",
    signedBy:"Assinado por", signatureDate:"Data", historyTitle:"Histórico de intervenções",
    view:"Ver", edit:"Editar", del:"Apagar", duplicate:"Duplicar",
    saved:"Guardado", savedMsg:"A intervenção foi guardada localmente.",
    emptyName:"Indica o nome do cliente para guardar.",
    exportInfo:"A exportação usa a função de impressão do navegador. Escolhe 'Guardar como PDF'." },
  fr: { install:"Installer", history:"Historique", new:"Nouveau", save:"Enregistrer", pdf:"Exporter PDF",
    clientVehicle:"Client & Véhicule", clientName:"Nom du client", phone:"Téléphone", date:"Date",
    plate:"Plaque", brand:"Marque", model:"Modèle", notes:"Remarques", services:"Prestations",
    parts:"Pièces", addLine:"+ Ligne", service:"Prestation", part:"Pièce", qty:"Qté", unit:"Prix U.",
    total:"Total", servicesTotal:"Total Prestations", partsTotal:"Total Pièces", labor:"Main-d'œuvre",
    hours:"Heures", rate:"Tarif / heure", laborTotal:"Total Main-d'œuvre", grandTotal:"Total Global",
    signature:"Signature", signatureHint:"Lors de l'export PDF, demandez la signature du client.",
    signedBy:"Signé par", signatureDate:"Date", historyTitle:"Historique des interventions",
    view:"Voir", edit:"Éditer", del:"Supprimer", duplicate:"Dupliquer",
    saved:"Enregistré", savedMsg:"L'intervention a été enregistrée localement.",
    emptyName:"Indiquez le nom du client pour enregistrer.",
    exportInfo:"L'export utilise l'impression du navigateur. Choisissez 'Enregistrer au format PDF'." }
};
const $ = (s)=>document.querySelector(s); const $$=(s)=>Array.from(document.querySelectorAll(s));
let deferredPrompt=null, currentId=null;
const langSelect=$("#langSelect"); function applyI18n(lang){
  $$("[data-i18n]").forEach(el=>{ const k=el.dataset.i18n; el.textContent = I18N[lang][k] || el.textContent; });
  $("#clientName").placeholder = lang==="fr" ? "Ex: Jean Dupont" : "Ex: João Silva";
  $("#plate").placeholder = "Ex: VD 123456";
  $("#brand").placeholder = lang==="fr" ? "Ex: Renault" : "Ex: VW";
  $("#model").placeholder = lang==="fr" ? "Ex: Clio 1.2" : "Ex: Golf 1.4 TSI";
  $("#notes").placeholder = lang==="fr" ? "Remarques générales..." : "Notas gerais...";
  refreshHistory();
}
langSelect.addEventListener("change", ()=>{ const lang=langSelect.value; localStorage.setItem("gp_lang", lang); applyI18n(lang); });
applyI18n(localStorage.getItem("gp_lang")||"pt"); langSelect.value = localStorage.getItem("gp_lang")||"pt";

const currencySel=$("#currency"), vatInput=$("#vatInput");
currencySel.value = localStorage.getItem("gp_currency") || "CHF";
vatInput.value = localStorage.getItem("gp_vat") || "7.7";
currencySel.addEventListener("change", ()=>{ localStorage.setItem("gp_currency", currencySel.value); recalcAll(); refreshHistory(); });
vatInput.addEventListener("input", ()=>{ localStorage.setItem("gp_vat", vatInput.value); recalcAll(); });
function fmt(n){ const cur=currencySel.value||"CHF"; return `${Number(n||0).toFixed(2)} ${cur}`; }

$("#installBtn").disabled = true;
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; $("#installBtn").disabled=false; });
$("#installBtn").addEventListener("click", async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("#installBtn").disabled=true; });

function addRow(tbody, isService=true){
  const tr=document.createElement("tr");
  tr.innerHTML=`
    <td><input type="text" class="desc" placeholder="${isService?(langSelect.value==='fr'?'Prestation':'Serviço'):(langSelect.value==='fr'?'Pièce':'Peça')}"></td>
    <td><input type="number" class="qty" step="0.01" value="1"></td>
    <td><input type="number" class="unit" step="0.01" value="0"></td>
    <td class="right line-total">0.00</td>
    <td><button class="btn ghost del">✖</button></td>`;
  tbody.appendChild(tr);
  tr.querySelectorAll("input").forEach(inp=>inp.addEventListener("input", recalcAll));
  tr.querySelector(".del").addEventListener("click", ()=>{ tr.remove(); recalcAll(); });
}
const servicesTBody=$("#servicesTable tbody"), partsTBody=$("#partsTable tbody");
$("#addService").addEventListener("click", ()=>addRow(servicesTBody,true));
$("#addPart").addEventListener("click", ()=>addRow(partsTBody,false));
addRow(servicesTBody,true); addRow(partsTBody,false);

function recalcSection(tbody){
  let sum=0;
  tbody.querySelectorAll("tr").forEach(tr=>{
    const qty=parseFloat(tr.querySelector(".qty").value||"0");
    const unit=parseFloat(tr.querySelector(".unit").value||"0");
    const total=qty*unit; sum+=total;
    tr.querySelector(".line-total").textContent = fmt(total);
  });
  return sum;
}
function recalcAll(){
  const servicesSum=recalcSection(servicesTBody);
  const partsSum=recalcSection(partsTBody);
  $("#servicesSum").textContent = fmt(servicesSum);
  $("#partsSum").textContent = fmt(partsSum);
  const hours=parseFloat($("#laborHours").value||"0");
  const rate=parseFloat($("#laborRate").value||"0");
  const labor=hours*rate; $("#laborTotal").textContent = fmt(labor);
  const sub=servicesSum+partsSum+labor; $("#subTotal").textContent = fmt(sub);
  const vatRate=parseFloat(vatInput.value||"0")/100;
  const vatVal=sub*vatRate; $("#vatValue").textContent = fmt(vatVal);
  const grand=sub+vatVal; $("#grandTotal").textContent = fmt(grand);
}
$("#laborHours").addEventListener("input", recalcAll);
$("#laborRate").addEventListener("input", recalcAll);
recalcAll();

const KEY="gp_records_v2";
function listRecords(){ const arr=JSON.parse(localStorage.getItem(KEY)||"[]"); return arr.sort((a,b)=>b.ts-a.ts); }
function saveRecord(data,id=null){
  const arr=listRecords();
  if(id){ const idx=arr.findIndex(x=>x.id===id); if(idx>=0) arr[idx]={...arr[idx],...data,id}; else arr.unshift({...data,id}); }
  else { id="R"+Math.random().toString(36).slice(2,9)+Date.now().toString(36); arr.unshift({...data,id}); }
  localStorage.setItem(KEY, JSON.stringify(arr)); return id;
}
function deleteRecord(id){ const arr=listRecords().filter(x=>x.id!==id); localStorage.setItem(KEY, JSON.stringify(arr)); }
function collectData(){
  return {
    ts: Date.now(), lang: langSelect.value, currency: currencySel.value, vat: vatInput.value,
    clientName: $("#clientName").value.trim(), clientPhone: $("#clientPhone").value.trim(), date: $("#date").value,
    plate: $("#plate").value.trim(), brand: $("#brand").value.trim(), model: $("#model").value.trim(),
    notes: $("#notes").value.trim(),
    services: Array.from(servicesTBody.querySelectorAll("tr")).map(tr=>({ desc: tr.querySelector(".desc").value, qty: parseFloat(tr.querySelector(".qty").value||"0"), unit: parseFloat(tr.querySelector(".unit").value||"0") })),
    parts: Array.from(partsTBody.querySelectorAll("tr")).map(tr=>({ desc: tr.querySelector(".desc").value, qty: parseFloat(tr.querySelector(".qty").value||"0"), unit: parseFloat(tr.querySelector(".unit").value||"0") })),
    laborHours: parseFloat($("#laborHours").value||"0"), laborRate: parseFloat($("#laborRate").value||"0"),
    signedBy: $("#signedBy").value.trim(), signatureDate: $("#signatureDate").value,
    totals: { labor: $("#laborTotal").textContent, subTotal: $("#subTotal").textContent, vatValue: $("#vatValue").textContent, grand: $("#grandTotal").textContent, services: $("#servicesSum").textContent, parts: $("#partsSum").textContent }
  };
}
function fillData(d){
  langSelect.value=d.lang || (localStorage.getItem("gp_lang")||"pt"); applyI18n(langSelect.value);
  currencySel.value=d.currency || (localStorage.getItem("gp_currency")||"CHF");
  vatInput.value=d.vat || (localStorage.getItem("gp_vat")||"7.7");
  $("#clientName").value=d.clientName||""; $("#clientPhone").value=d.clientPhone||""; $("#date").value=d.date||"";
  $("#plate").value=d.plate||""; $("#brand").value=d.brand||""; $("#model").value=d.model||""; $("#notes").value=d.notes||"";
  servicesTBody.innerHTML=""; partsTBody.innerHTML="";
  (d.services && d.services.length? d.services : [{desc:"",qty:1,unit:0}]).forEach(()=>addRow(servicesTBody,true));
  (d.services||[]).forEach((row,i)=>{ const tr=servicesTBody.querySelectorAll("tr")[i]; tr.querySelector(".desc").value=row.desc??""; tr.querySelector(".qty").value=row.qty??0; tr.querySelector(".unit").value=row.unit??0; });
  (d.parts && d.parts.length? d.parts : [{desc:"",qty:1,unit:0}]).forEach(()=>addRow(partsTBody,false));
  (d.parts||[]).forEach((row,i)=>{ const tr=partsTBody.querySelectorAll("tr")[i]; tr.querySelector(".desc").value=row.desc??""; tr.querySelector(".qty").value=row.qty??0; tr.querySelector(".unit").value=row.unit??0; });
  $("#laborHours").value=d.laborHours??0; $("#laborRate").value=d.laborRate??0; $("#signedBy").value=d.signedBy||""; $("#signatureDate").value=d.signatureDate||"";
  recalcAll();
}
$("#newBtn").addEventListener("click", ()=>{ currentId=null; fillData({services:[], parts:[]}); });
$("#saveBtn").addEventListener("click", ()=>{
  const data=collectData(); if(!data.clientName){ alert(I18N[langSelect.value].emptyName); return; }
  currentId=saveRecord(data,currentId); alert(I18N[langSelect.value].saved+" ✅\n"+I18N[langSelect.value].savedMsg); refreshHistory();
});
$("#historyBtn").addEventListener("click", ()=>{ refreshHistory(); $("#history").showModal(); });
function refreshHistory(){
  const list=listRecords(); const box=$("#historyList"); if(!box) return; box.innerHTML="";
  list.forEach(item=>{
    const div=document.createElement("div");
    const title=`${item.clientName||'—'} · ${item.plate||''} · ${item.totals?.grand||''}`;
    div.className="history-item";
    div.innerHTML=`
      <div><div><strong>${title}</strong></div><div class="muted-text">${new Date(item.ts).toLocaleString()}</div></div>
      <div class="row-actions" style="display:flex;gap:6px;">
        <button class="btn" data-act="view">${I18N[langSelect.value].view}</button>
        <button class="btn" data-act="edit">${I18N[langSelect.value].edit}</button>
        <button class="btn" data-act="dup">${I18N[langSelect.value].duplicate}</button>
        <button class="btn danger" data-act="del">${I18N[langSelect.value].del}</button>
      </div>`;
    div.querySelector('[data-act="view"]').addEventListener("click", ()=>{ fillData(item); });
    div.querySelector('[data-act="edit"]').addEventListener("click", ()=>{ currentId=item.id; fillData(item); });
    div.querySelector('[data-act="dup"]').addEventListener("click", ()=>{ currentId=null; fillData(item); });
    div.querySelector('[data-act="del"]').addEventListener("click", ()=>{ if(confirm("Confirmar apagar?")){ deleteRecord(item.id); refreshHistory(); } });
    box.appendChild(div);
  });
}
$("#pdfBtn").addEventListener("click", ()=>{ alert(I18N[langSelect.value].exportInfo); window.print(); });

if('serviceWorker' in navigator){ window.addEventListener('load', ()=>{ navigator.serviceWorker.register('service-worker.js'); }); }
