import Awesomplete from 'awesomplete/awesomplete.js';
import $ from 'jquery';

document.addEventListener('DOMContentLoaded', () => {

  $('#load-button').on('click', function() {
    loadCards();
    event.preventDefault();
  });

  document.getElementById('suggestInput').addEventListener('keypress', function(event) {
    if (event.keyCode == 13) {
      loadCards();
      event.preventDefault();
    }
  });

	function loadCards () {
	  let inputValue = document.getElementById('suggestInput').value;
	  inputValue = inputValue.slice(0, -2); //удаляю лишнюю запятую с пробелом в конце
	  inputValue = inputValue.split(', '); //преобразую в массив

	  fetch("http://lunrox.com:4486/compounds", {
	    method: "POST",
	    body: JSON.stringify(inputValue),
	    headers: {
	      "Content-Type": "application/x-www-form-urlencoded"
	    },
	  }) 
	    .then(response => response.json())
	    .then(json => {
	      // Превращаем JSON d вёрстку
	      let html = renderCompounds(json);
	      document.querySelector("#app").innerHTML = `
	        <div class="list">
	          ${html}
	        </div>
	      `;
	      MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	    });
	};


	function renderCompounds (data) {
	  return data
	    .map(
	      compound => `
	        <div class="card">
	          <div class="verh">
	            <div class="wrap">
	              <h2 class="compound">$\\ce{${compound.name}}$</h2>
	              <p class="ksp">$\\pu{${compound.ksp}}$</p>
	            </div>
	            <p class="comment">${compound.comment}</p>
	          </div>
	          <div class="niz">
	            <p class="dissotiation">$\\ce{${compound.dissotiation}}$</p>
	            <p class="color">${compound.color}</p>
	          </div>
	        </div>
	      `
	    )
	    .join(""); 
	};

	new Awesomplete('input[data-multiple]', {
	  minChars: 1,

		filter: function(text, input) {
			return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
		},

		item: function(text, input) {
			return Awesomplete.ITEM(text, input.match(/[^,]*$/)[0]);
		},

		replace: function(text) {
			var before = this.input.value.match(/^.+,\s*|/)[0];
			this.input.value = before + text + ", ";
	  },

	  list: ["H^1+", "Ac^3+", "Ag^1+", "Al^3+", "Am^3+", "Am^4+", "Au^1+", "Au^3+", "Ba^2+", "Be^2+", "Bi^3+", "BiO^1+", "Bi^3+", "BiO^1+", "Ca^2+", "Cd^2+", "[Cd(NH3)6]^2+", "Ce^3+", "Ce^4+", "CeO^2+", "Co^2+", "[Co(NH3)6]^2+", "[Co(NH3)6]^3+", "Co^3+", "Cr^2+", "Cr^3+", "[Cr(NH3)6]^3+", "Cs^1+", "Cu^2+", "Cu^1+", "Fe^2+", "Fe^3+", "Ga^3+", "Ge^4+", "Ga^2+", "HfO^2+", "Hg2^2+", "Hg^2+", "In^3+", "Ir^4+", "Ir^3+", "K^1+", "La^3+", "Li^1+", "Mg^2+", "Mn^2+", "Mn^3+", "Mn^4+", "Mo^4+", "(NH4)^1+", "Na^1+", "(NH3)^0", "Ni^2+", "[Ni(NH3)6]^2+", "Ni^2+", "NpO2^2+", "Pb^2+", "Pb^4+", "Pd^2+", "Pd^4+", "Po^2+", "Po^4+", "Pt^4+", "Pt^2+", "Pu^4+", "PuO2^2+", "Pu^3+", "PuO^2+", "Ra^2+", "Rb^1+", "Rb^1+", "Rh^3+", "Ru^3+", "Ru^4+", "Sb^3+", "Sc^3+", "Sn^2+", "Sn^4+", "Sr^2+", "Te^4+", "Th^4+", "Ti^4+", "Tl^1+", "Tl^3+", "(UO2)^2+", "U^3+", "U^4+", "VO^2+", "V^5+", "W^4+", "Y^3+", "Zn^2+", "Zn^4+", "(C4H7O2N2)^1-", "(C6H5)4B^1-", "(NH4)2[Fe(CN)6]^2-", "[(NH4)2Fe(CN)6]^2-", "[AuCl4]^1-", "[Co(CN)6]^3-", "[Co(NO2)6]^3-", "[Fe(CN)6]^4-", "[Fe(CN^1-)6]^3-", "[Fe(CN^1-)6]^4-", "[Hg(SCN)4]^2-", "[HgCl3]^1-", "[IrCl6]^2-", "[PdCl4]^2-", "[PdCl6]^2-", "[Pt(CN)4]^2-", "[PtCl4]^2-", "[PtCl6]^2-", "[PtF6]^2-", "[Sb(OH)6]^1-", "[SiF6]^1-", "[SnCl6]^2-", "AlF6^3-", "AsO3^3-", "AsO4^3-", "BeF4^2-", "BF4^1-", "BH4^1-", "BO2^1-", "Br^1-", "BrO3^1-", "C2H3O2^1-", "C2O4^2-", "C4H4O6^2-", "Cl^1-", "ClO2^1-", "ClO3^1-", "ClO4^1-", "CN^1-", "CO3^2-", "Cr2O7^2-", "CrO4^2-", "CrOH^1-", "F^1-", "GeF6^2-", "H2PO4^1-", "HAsO4^2-", "HfF6^2-", "Hg(SCN)4^2-", "HPO4^2-", "HVO4^2-", "I^1-", "IO3^1-", "IO4^1-", "IrCl6^2-", "KAsO4^2-", "KPO4^2-", "MnO4^1-", "MoO4^2-", "N3^1-", "NaAsO4^2-", "NH4AsO4^2-", "NH4PO4^2-", "NO2^1-", "NO3^1-", "O^2-", "OCN^1-", "OH^1-", "P2O7^4-", "PbO4^4-", "PO3F^2-", "PO4^2-", "PO4^3-", "ReO4^1-", "S^2-", "S2^2-", "S2O3^2-", "SCN^1-", "Se^2-", "SeCN^1-", "SeO3^2-", "SeO4^2-", "SiF6^1-", "SO3^2-", "SO3F^1-", "SO3NH2^1-", "SO4^2-", "TiF6^2-", "V2O7^4-", "VO3^1-", "VO3^3-", "VO4^3-", "WO4^2-", "ZrF6^2-"]
	  
	});
});
