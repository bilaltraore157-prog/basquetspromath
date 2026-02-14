const API_EQUIPES = "https://698f9322dcc9a4df204aeb72.mockapi.io/equipes";
const API_USERS = "https://698f9322dcc9a4df204aeb72.mockapi.io/utilisateurs";

function changerOnglet(mode) {
    document.getElementById('section-gratuit').style.display = (mode === 'gratuit') ? 'block' : 'none';
    document.getElementById('section-pro').style.display = (mode === 'pro') ? 'block' : 'none';
    document.getElementById('btn-mode-gratuit').className = (mode === 'gratuit') ? 'active' : '';
    document.getElementById('btn-mode-pro').className = (mode === 'pro') ? 'active' : '';
    document.getElementById('result-area').style.display = 'none';
}

// FORCE LE NETTOYAGE DU CHAMP SUR MOBILE POUR ÉVITER LE BLOCAGE
function setupMobileFix(id) {
    const input = document.getElementById(id);
    
    // Si l'utilisateur clique, on vide le champ pour laisser la liste s'afficher proprement
    input.addEventListener('click', function() {
        this.value = '';
    });

    // Dès qu'une équipe est détectée, on ferme le clavier immédiatement
    input.addEventListener('input', function(e) {
        const val = e.target.value;
        const options = document.getElementById('nba-teams').options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value.toLowerCase() === val.toLowerCase()) {
                input.blur(); // Ferme le clavier
                break;
            }
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
        <tr class="row-total">
            <td>🏀 TOTAL MATCH</td>
            <td>${(parseFloat(dS.min)+parseFloat(eS.min)).toFixed(1)}</td>
            <td>${(parseFloat(dS.max)+parseFloat(eS.max)).toFixed(1)}</td>
            <td>${(parseFloat(dS.moy)+parseFloat(eS.moy)).toFixed(1)}</td>
        </tr>
    `;
    document.getElementById('result-area').style.display = 'block';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

async function analyserAutomatique() {
    const nD = document.getElementById('search-dom').value.trim();
    const nE = document.getElementById('search-ext').value.trim();
    
    if (!nD || !nE) {
        alert("Choisis bien les deux équipes dans la liste !");
        return;
    }

    try {
        const res = await fetch(API_EQUIPES);
        const data = await res.json();
        
        // Recherche plus flexible (insensible à la casse)
        const d = data.find(e => e.equipe.toLowerCase() === nD.toLowerCase());
        const e = data.find(e => e.equipe.toLowerCase() === nE.toLowerCase());

        if (d && e) {
            afficherTout(d.matchs.map(m=>m.score), e.matchs.map(m=>m.score));
        } else { 
            alert("Erreur : Assure-toi d'écrire le nom EXACT de l'équipe ou de la choisir dans la liste."); 
        }
    } catch (err) { alert("Erreur de connexion aux données."); }
}

function calculerManuel() {
    const sD = Array.from(document.querySelectorAll('#row-dom input')).map(i => parseInt(i.value) || 0);
    const sE = Array.from(document.querySelectorAll('#row-ext input')).map(i => parseInt(i.value) || 0);
    if (sD.includes(0) || sE.includes(0)) return alert("Remplissez tous les scores !");
    afficherTout(sD, sE);
}

function calculerSommesDirectes() {
    const dI = document.querySelectorAll('#row-dom input');
    const eI = document.querySelectorAll('#row-ext input');
    for (let i = 0; i < 5; i++) {
        const valD = parseInt(dI[i].value) || 0;
        const valE = parseInt(eI[i].value) || 0;
        document.getElementById(`t${i+1}`).innerText = (valD + valE) > 0 ? (valD + valE) : "-";
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
