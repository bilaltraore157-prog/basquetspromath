const API_EQUIPES = "https://698f9322dcc9a4df204aeb72.mockapi.io/equipes";
const API_USERS = "https://698f9322dcc9a4df204aeb72.mockapi.io/utilisateurs";

function changerOnglet(mode) {
    document.getElementById('section-gratuit').style.display = (mode === 'gratuit') ? 'block' : 'none';
    document.getElementById('section-pro').style.display = (mode === 'pro') ? 'block' : 'none';
    document.getElementById('btn-mode-gratuit').className = (mode === 'gratuit') ? 'active' : '';
    document.getElementById('btn-mode-pro').className = (mode === 'pro') ? 'active' : '';
}

function setupMobileFix(id) {
    const input = document.getElementById(id);
    input.addEventListener('input', function(e) {
        const val = e.target.value;
        const options = document.getElementById('nba-teams').options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === val) { input.blur(); break; }
        }
    });
}

function afficherTout(domArr, extArr) {
    const historyBody = document.getElementById('body-history');
    if(historyBody) {
        historyBody.innerHTML = `
            <tr><td>🏠 Dom</td>${domArr.map(s => `<td>${s}</td>`).join('')}</tr>
            <tr><td>🚌 Ext</td>${extArr.map(s => `<td>${s}</td>`).join('')}</tr>
            <tr style="color:#FFD700"><td>🔥 Tot</td>${domArr.map((s,i) => `<td>${s+extArr[i]}</td>`).join('')}</tr>
        `;
        document.getElementById('pro-matchs-history').style.display = 'block';
    }

    const calc = (arr) => ({
        min: Math.min(...arr), max: Math.max(...arr),
        moy: (arr.reduce((a, b) => a + b, 0) / 5).toFixed(1)
    });

    const dS = calc(domArr), eS = calc(extArr);
    document.getElementById('body-result').innerHTML = `
        <tr><td>🏠 Domicile</td><td>${dS.min}</td><td>${dS.max}</td><td>${dS.moy}</td></tr>
        <tr><td>🚌 Extérieur</td><td>${eS.min}</td><td>${eS.max}</td><td>${eS.moy}</td></tr>
        <tr style="color:#FFD700; font-weight:bold;">
            <td>🏀 TOTAL</td>
            <td>${(parseFloat(dS.min)+parseFloat(eS.min)).toFixed(1)}</td>
            <td>${(parseFloat(dS.max)+parseFloat(eS.max)).toFixed(1)}</td>
            <td>${(parseFloat(dS.moy)+parseFloat(eS.moy)).toFixed(1)}</td>
        </tr>
    `;
    document.getElementById('result-area').style.display = 'block';
}

async function analyserAutomatique() {
    const nD = document.getElementById('search-dom').value.trim();
    const nE = document.getElementById('search-ext').value.trim();
    if (!nD || !nE) return alert("Sélectionnez les deux équipes !");
    try {
        const res = await fetch(API_EQUIPES);
        const data = await res.json();
        const d = data.find(e => e.equipe === nD);
        const e = data.find(e => e.equipe === nE);
        if (d && e) { afficherTout(d.matchs.map(m=>m.score), e.matchs.map(m=>m.score)); }
        else { alert("Équipe introuvable."); }
    } catch (err) { alert("Erreur serveur."); }
}

function calculerManuel() {
    const sD = Array.from(document.querySelectorAll('#row-dom input')).map(i => parseInt(i.value) || 0);
    const sE = Array.from(document.querySelectorAll('#row-ext input')).map(i => parseInt(i.value) || 0);
    if (sD.includes(0) || sE.includes(0)) return alert("Scores incomplets !");
    afficherTout(sD, sE);
}

function calculerSommesDirectes() {
    const dI = document.querySelectorAll('#row-dom input');
    const eI = document.querySelectorAll('#row-ext input');
    for (let i = 0; i < 5; i++) {
        const valD = parseInt(dI[i].value) || 0;
        const valE = parseInt(eI[i].value) || 0;
        document.getElementById(`t${i+1}`).innerText = (valD + valE) || "-";
    }
}

(async function init() {
    const idCode = "BASQUET-" + Math.abs(screen.width * navigator.userAgent.length);
    document.getElementById('my-id').innerText = idCode;
    setupMobileFix('search-dom');
    setupMobileFix('search-ext');
    try {
        const res = await fetch(API_USERS);
        const users = await res.json();
        if (users.find(u => u.deviceID === idCode)) {
            document.getElementById('pro-unlocked').style.display = 'block';
            document.getElementById('pro-locked').style.display = 'none';
        }
    } catch (e) {}
})();