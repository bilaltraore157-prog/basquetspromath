const API_KEY = "7999234d3c7b31ea2ce94469a0079357";
const API_BASE = "https://v1.basketball.api-sports.io";
const MOCK_API_URL = "https://6991ed1b8f29113acd3cc96a.mockapi.io/utilisateur";

function changerOnglet(mode) {
    document.getElementById('section-gratuit').style.display = (mode === 'gratuit') ? 'block' : 'none';
    document.getElementById('section-pro').style.display = (mode === 'pro') ? 'block' : 'none';
    document.getElementById('btn-gratuit').classList.toggle('active', mode === 'gratuit');
    document.getElementById('btn-pro').classList.toggle('active', mode === 'pro');
}

function ecouterSaisieGratuite() {
    const inputsDom = document.querySelectorAll('#row-dom-gratuit .s-in');
    const inputsExt = document.querySelectorAll('#row-ext-gratuit .s-in');
    const affichageTotaux = document.querySelectorAll('#row-total-gratuit .s-in-total');

    inputsDom.forEach((input, index) => {
        const maj = () => {
            const d = parseInt(inputsDom[index].value) || 0;
            const e = parseInt(inputsExt[index].value) || 0;
            affichageTotaux[index].innerText = (d > 0 || e > 0) ? (d + e) : "-";
        };
        input.addEventListener('input', maj);
        inputsExt[index].addEventListener('input', maj);
    });
}

// --- NOUVEAU MODULE : PRÉDICTION OVER/UNDER ---
function ajouterPredictionOverUnder(zone) {
    const foot = document.getElementById(`foot-${zone}`);
    if (!foot) return;

    const cellules = foot.getElementsByTagName('td');
    const tMin = parseFloat(cellules[1].innerText);
    const tMax = parseFloat(cellules[2].innerText);
    const tMoy = parseFloat(cellules[3].innerText);

    const distanceMin = tMoy - tMin;
    const distanceMax = tMax - tMoy;

    let prediction = "";
    let ligneIdeale = 0;

    if (distanceMax < distanceMin) {
        prediction = "UNDER";
        ligneIdeale = (tMoy + tMax) / 2;
    } else {
        prediction = "OVER";
        ligneIdeale = (tMoy + tMin) / 2;
    }

    const divPred = document.createElement('div');
    divPred.id = `pred-box-${zone}`;
    divPred.style = "margin-top:15px; padding:15px; background:rgba(255,215,0,0.1); border:1px solid var(--gold); border-radius:12px; text-align:center;";
    
    const couleurPred = (prediction === "OVER") ? "#51cf66" : "#ff922b";

    divPred.innerHTML = `
        <div style="font-size:0.75em; color:#888; text-transform:uppercase; letter-spacing:1px;">Indicateur de Tendance</div>
        <div style="font-size:1.4em; font-weight:bold; color:${couleurPred}; margin:5px 0;">${prediction} ${Math.round(ligneIdeale)}</div>
        <div style="font-size:0.85em; color:var(--gold);">⭐ Fiabilité : Très sûr</div>
    `;

    const resCard = document.getElementById(`res-${zone}`);
    const oldPred = document.getElementById(`pred-box-${zone}`);
    if (oldPred) oldPred.remove();
    resCard.appendChild(divPred);
}

function afficherResultat(scoresD, scoresE, zone) {
    const cleanD = scoresD.filter(v => v > 0);
    const cleanE = scoresE.filter(v => v > 0);
    if (cleanD.length === 0 || cleanE.length === 0) return;

    const minD = Math.min(...cleanD); const maxD = Math.max(...cleanD);
    const moyD = parseFloat((cleanD.reduce((a,b)=>a+b, 0) / cleanD.length).toFixed(1));
    const minE = Math.min(...cleanE); const maxE = Math.max(...cleanE);
    const moyE = parseFloat((cleanE.reduce((a,b)=>a+b, 0) / cleanE.length).toFixed(1));

    const tMin = minD + minE; const tMax = maxD + maxE; 
    const tMoy = (moyD + moyE).toFixed(1);

    document.getElementById(`body-${zone}`).innerHTML = `
        <tr><td>🏠 Dom</td><td>${minD}</td><td>${maxD}</td><td style="color:gold">${moyD}</td></tr>
        <tr><td>🚌 Ext</td><td>${minE}</td><td>${maxE}</td><td style="color:gold">${moyE}</td></tr>`;

    document.getElementById(`foot-${zone}`).innerHTML = `
        <tr style="background:rgba(255,215,0,0.15); border-top: 2px solid gold;">
            <td style="color:gold">📊 TOTAL</td>
            <td style="color:#ff6b6b">${tMin}</td>
            <td style="color:#51cf66">${tMax}</td>
            <td style="color:gold; font-size:1.1em">${tMoy}</td>
        </tr>`;
    document.getElementById(`res-${zone}`).style.display = 'block';
}

function calculer() {
    const sD = Array.from(document.querySelectorAll('#row-dom-gratuit input')).map(i => parseInt(i.value) || 0);
    const sE = Array.from(document.querySelectorAll('#row-ext-gratuit input')).map(i => parseInt(i.value) || 0);
    afficherResultat(sD, sE, 'gratuit');
    ajouterPredictionOverUnder('gratuit'); // Appel prédiction
}

async function extrairePro() {
    const tA = document.getElementById('team-a').value.trim();
    const tB = document.getElementById('team-b').value.trim();
    const status = document.getElementById('status-pro');
    if (!tA || !tB) return alert("Entrez les deux équipes !");
    status.innerHTML = "⏳ Analyse en cours...";

    try {
        const h = { "x-rapidapi-key": API_KEY, "x-rapidapi-host": "v1.basketball.api-sports.io" };
        const [rA, rB] = await Promise.all([
            fetch(`${API_BASE}/teams?search=${tA}`, { headers: h }),
            fetch(`${API_BASE}/teams?search=${tB}`, { headers: h })
        ]);
        const dA = await rA.json(); const dB = await rB.json();
        const idA = dA.response[0].id; const idB = dB.response[0].id;

        const resH = await fetch(`${API_BASE}/games?h2h=${idA}-${idB}`, { headers: h });
        const dH = await resH.json();

        const matches = dH.response
            .filter(g => g.status.short === "FT")
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        let mHtml = ""; const scD = []; const scE = [];
        matches.forEach(m => {
            const dateStr = new Date(m.date).toLocaleDateString('fr-FR');
            const isHomeA = m.teams.home.id === idA;
            const sDom = m.scores.home.total; const sExt = m.scores.away.total;
            const tMatch = sDom + sExt;

            if (isHomeA) { scD.push(sDom); scE.push(sExt); } 
            else { scD.push(sExt); scE.push(sDom); }
            
            mHtml += `<tr>
                <td>${dateStr}</td>
                <td style="${isHomeA?'color:gold':''}">${m.teams.home.name.substring(0,8)}</td>
                <td style="font-weight:bold">${sDom}-${sExt}</td>
                <td style="${!isHomeA?'color:gold':''}">${m.teams.away.name.substring(0,8)}</td>
                <td style="color:gold; font-weight:bold">${tMatch}</td>
            </tr>`;
        });

        document.getElementById('list-matches-pro').innerHTML = mHtml;
        document.getElementById('check-matches-pro').style.display = 'block';
        status.innerHTML = "✅ Scores synchronisés !";
        afficherResultat(scD, scE, 'pro');
        ajouterPredictionOverUnder('pro'); // Appel prédiction
    } catch (e) { status.innerHTML = "❌ " + e.message; }
}

async function verifier() {
    let id = localStorage.getItem('nba_pro_id') || "BASQUET-" + Math.floor(Math.random()*90000);
    localStorage.setItem('nba_pro_id', id);
    document.getElementById('my-id').innerText = id;
    try {
        const r = await fetch(MOCK_API_URL);
        const users = await r.json();
        const u = users.find(user => user.deviceID === id || user.deviceI === id);
        if (u && new Date() <= new Date(u.dateFin)) {
            document.getElementById('pro-unlocked').style.display = 'block';
            document.getElementById('pro-locked').style.display = 'none';
        } else {
            document.getElementById('pro-locked').style.display = 'block';
        }
    } catch (e) { console.log("Erreur sécu"); }
}

window.onload = () => {
    verifier();
    ecouterSaisieGratuite();
};
