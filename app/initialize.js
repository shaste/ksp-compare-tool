import Tagify from '@yaireo/tagify';
import $ from 'jquery';

document.addEventListener('DOMContentLoaded', () => {
  let currentTag = null;
  let enter = false;
  let compounds = [];
  let $logSwitch;
  let isChecked = false;
  let isCompareOpen = false;

	function loadCards () {
    const preInputValue = tagify.value;
    const inputValue = preInputValue.map(function(element) {
      return element.value;
    });

	  fetch("/api/compounds", {
	    method: "POST",
	    body: JSON.stringify(inputValue),
	    headers: {
	      "Content-Type": "application/x-www-form-urlencoded"
	    },
	  }) 
	    .then(response => response.json())
	    .then(json => {
	      // JSON to markup
        let html = renderCompounds(json);
        
        if (html.length !== 0) {
          document.querySelector("#app").innerHTML = `
            <div class="subtitle">
              <h3>Possible products</h3>
              <label for="minus-log">
                &minus;log
                <input 
                  type="checkbox" 
                  class="toggle-switch" 
                  id="minus-log" 
                  ${isChecked ? 'checked' : ''}
                  >
              </label>
            </div>
	          <div class="list">
              ${html}
	          </div>
          `;
        } else {
          document.querySelector("#app").innerHTML = `
            <div class="no-compounds">
              <p>These ions don't form insoluble compounds</p>
            </div>
          `;
        }

        // Check -log state
        $logSwitch = $('#minus-log, #minus-log-menu');
        toggleSwitch();

        // Prettify chem formulas
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"app"]);

        // Check .card in list and select already selected
        updateSelectedList(); 
        

        $logSwitch.change(function(){
          this.checked ? isChecked = true : isChecked = false;
          toggleSwitch();
        });

        $('#app .card').on('click', function() {
          const compoundName = $(this).attr('data-compound-name'); 
          const compoundId = $(this).attr('data-compound-id'); 
          
          // add to compare and select card after click in list
          if (!$(this).hasClass('selected')) { 
            compounds.push({'name': compoundName, 'id': compoundId});
            $(this).clone().appendTo('.compare-menu .compare-menu-container');
            $(this).addClass('selected');
            $('.compare-menu').addClass('shown');
          } else {
            // unselect card
            $(this).removeClass('selected');
            compounds = compounds.filter(item => item.id !== compoundId);
            
            // remove card with THIS data-compound-id from compare-menu
            $('.compare-menu .card').each(function(index, element){ 
              const compareCompoundId = element.dataset.compoundId;
              if (compareCompoundId === compoundId) {
                element.remove();
              }
            });
          }

          // pop up small compare-menu after selecting first card
          // and adding compound names there
          if (compounds.length > 0) {
            $('.compare-small').html(
              compounds.map(
                compound => 
                  `<div class="micro-card">$\\ce{${compound.name}}$</div>`
                )
                .join('')
            );
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"small-compounds"]);
          } else {
            $('.compare-menu').removeClass('shown');
          }
        });

        $('.compare-title').on('click', function(){
          $('.compare-menu').addClass('opened');
          setTimeout(function() { // чтобы не дергалась ширина боди
            $('body').css('position', 'fixed')
          }, 100)
        });

        $('button.hide-btn').on('click', function(){
          $('.compare-menu').removeClass('opened');
          $('body').css('position', '');
        });
	    });
      
      // delete card from compare-menu after click on × 
      $('.compare-menu').on('click', '.card .erase-btn', function() {
        compounds = compounds.filter(
          item => item.id !== $(this).parent().attr('data-compound-id')
        );
        $(this).parent().remove();
    
        updateSelectedList();

        if (compounds.length > 0) {
          $('.compare-small').html(
            compounds.map(
              compound => 
                `<div class="micro-card">$\\ce{${compound.name}}$</div>`
              )
              .join('')
          );
          MathJax.Hub.Queue(["Typeset",MathJax.Hub,"small-compounds"]);
        } else {
          $('.compare-menu').removeClass('shown opened');
          $('body').css('position', '');
        }
      });
	}

	function renderCompounds(data) {
	  return data
	    .map(
	      compound => `
	        <div class="card" data-compound-name="${compound.name}" data-compound-id="${compound._id.$oid}">
	          <div class="verh">
	            <div class="wrap">
	              <h2 class="compound">$\\ce{${compound.name}}$</h2>
                <p class="ksp">
                  <span class="scientific">$\\pu{${compound.ksp}}$</span>
                  <span class="minus-log">$\\pu{${-Math.log10(compound.ksp).toFixed(2)}}$</span>
                </p>
	            </div>
	            <p class="comment">${compound.comment}</p>
	          </div>
	          <div class="niz">
	            <p class="dissociation">$\\ce{${compound.dissotiation}}$</p>
              <div class="colors">                
                ${compound.colors.map(color => {
                  function borderColor () {
                    if (color.code === '#FFFFFF') {
                      return 'rgba(0, 0, 0, 0.15)';
                    } 
                  }

                  return `
                    <div 
                      class="color-sample" 
                      style="background-color:${color.code}; border: 1px solid ${borderColor()};">
                    </div>
                  `
                }).join("")}
              </div>
            </div>
            <button class="erase-btn">
              <svg viewBox="0 0 10 10">
                <g>
                  <line x1="0" y1="0" x2="10" y2="10"/>
                  <line x1="10" y1="0" x2="0" y2="10"/>
                </g>
              </svg>
            </button>
	        </div>
	      `
	    )
	    .join(""); 
  }

  const input = document.querySelector('input[name=ions]');

  const tagify = new Tagify(input, {
    enforceWhitelist: true,
    skipInvalid: true,
    dropdown: {
      enabled: 1,
      maxItems: 100,
    },
    'autocomplete.enabled': false,
    templates : {
      tag : function(v, tagData){
          try{
          return `
            <tag title='${v}' contenteditable='false' spellcheck="false" class='tagify__tag value='${v}'>
              <x title='remove tag' class='tagify__tag__removeBtn'></x>
              <div>
                <span class='tagify__tag-text'>${tagData.output}</span>
              </div>
            </tag>
            `;
          }
          catch(err){}
      },

      dropdownItem : function(tagData){
          try{
          return `
            <div class='tagify__dropdown__item'>
                <span>${tagData.output}</span>
            </div>
            `
          }
          catch(err){}
      }
    },
    whitelist: [
      { value: "H^1+", output: "H<sup>1+</sup>" },
      { value: "Ac^3+", output: "Ac<sup>3+</sup>" },
      { value: "Ag^1+", output: "Ag<sup>1+</sup>" },
      { value: "Al^3+", output: "Al<sup>3+</sup>" },
      { value: "Am^3+", output: "Am<sup>3+</sup>" },
      { value: "Am^4+", output: "Am<sup>4+</sup>" },
      { value: "Au^1+", output: "Au<sup>1+</sup>" },
      { value: "Au^3+", output: "Au<sup>3+</sup>" },
      { value: "Ba^2+", output: "Ba<sup>2+</sup>" },
      { value: "Be^2+", output: "Be<sup>2+</sup>" },
      { value: "Bi^3+", output: "Bi<sup>3+</sup>" },
      { value: "BiO^1+", output: "BiO<sup>1+</sup>" },
      { value: "Bi^3+", output: "Bi<sup>3+</sup>" },
      { value: "BiO^1+", output: "BiO<sup>1+</sup>" },
      { value: "Ca^2+", output: "Ca<sup>2+</sup>" },
      { value: "Cd^2+", output: "Cd<sup>2+</sup>" },
      { value: "[Cd(NH3)6]^2+", output: "[Cd(NH<sub>3</sub>)<sub>6</sub>]<sup>2+</sup>" },
      { value: "Ce^3+", output: "Ce<sup>3+</sup>" },
      { value: "Ce^4+", output: "Ce<sup>4+</sup>" },
      { value: "CeO^2+", output: "CeO<sup>2+</sup>" },
      { value: "Co^2+", output: "Co<sup>2+</sup>" },
      { value: "[Co(NH3)6]^2+", output: "[Co(NH<sub>3</sub>)<sub>6</sub>]<sup>2+</sup>" },
      { value: "[Co(NH3)6]^3+", output: "[Co(NH<sub>3</sub>)<sub>6</sub>]<sup>3+</sup>" },
      { value: "Co^3+", output: "Co<sup>3+</sup>" },
      { value: "Cr^2+", output: "Cr<sup>2+</sup>" },
      { value: "Cr^3+", output: "Cr<sup>3+</sup>" },
      { value: "[Cr(NH3)6]^3+", output: "[Cr(NH<sub>3</sub>)<sub>6</sub>]<sup>3+</sup>" },
      { value: "Cs^1+", output: "Cs<sup>1+</sup>" },
      { value: "Cu^2+", output: "Cu<sup>2+</sup>" },
      { value: "Cu^1+", output: "Cu<sup>1+</sup>" },
      { value: "Fe^2+", output: "Fe<sup>2+</sup>" },
      { value: "Fe^3+", output: "Fe<sup>3+</sup>" },
      { value: "Ga^3+", output: "Ga<sup>3+</sup>" },
      { value: "Ge^4+", output: "Ge<sup>4+</sup>" },
      { value: "Ga^2+", output: "Ga<sup>2+</sup>" },
      { value: "HfO^2+", output: "HfO<sup>2+</sup>" },
      { value: "Hg2^2+", output: "Hg<sub>2</sub><sup>2+</sup>" },
      { value: "Hg^2+", output: "Hg<sup>2+</sup>" },
      { value: "In^3+", output: "In<sup>3+</sup>" },
      { value: "Ir^4+", output: "Ir<sup>4+</sup>" },
      { value: "Ir^3+", output: "Ir<sup>3+</sup>" },
      { value: "K^1+", output: "K<sup>1+</sup>" },
      { value: "La^3+", output: "La<sup>3+</sup>" },
      { value: "Li^1+", output: "Li<sup>1+</sup>" },
      { value: "Mg^2+", output: "Mg<sup>2+</sup>" },
      { value: "Mn^2+", output: "Mn<sup>2+</sup>" },
      { value: "Mn^3+", output: "Mn<sup>3+</sup>" },
      { value: "Mn^4+", output: "Mn<sup>4+</sup>" },
      { value: "Mo^4+", output: "Mo<sup>4+</sup>" },
      { value: "(NH4)^1+", output: "(NH<sub>4</sub>)<sup>1+</sup>" },
      { value: "Na^1+", output: "Na<sup>1+</sup>" },
      { value: "(NH3)^0", output: "(NH<sub>3</sub>)<sup>0</sup>" },
      { value: "Ni^2+", output: "Ni<sup>2+</sup>" },
      { value: "[Ni(NH3)6]^2+", output: "[Ni(NH<sub>3</sub>)<sub>6</sub>]<sup>2+</sup>" },
      { value: "NpO2^2+", output: "NpO<sub>2</sub><sup>2+</sup>" },
      { value: "Pb^2+", output: "Pb<sup>2+</sup>" },
      { value: "Pb^4+", output: "Pb<sup>4+</sup>" },
      { value: "Pd^2+", output: "Pd<sup>2+</sup>" },
      { value: "Pd^4+", output: "Pd<sup>4+</sup>" },
      { value: "Po^2+", output: "Po<sup>2+</sup>" },
      { value: "Po^4+", output: "Po<sup>4+</sup>" },
      { value: "Pt^4+", output: "Pt<sup>4+</sup>" },
      { value: "Pt^2+", output: "Pt<sup>2+</sup>" },
      { value: "Pu^4+", output: "Pu<sup>4+</sup>" },
      { value: "PuO2^2+", output: "PuO<sub>2</sub><sup>2+</sup>" },
      { value: "Pu^3+", output: "Pu<sup>3+</sup>" },
      { value: "PuO^2+", output: "PuO<sup>2+</sup>" },
      { value: "Ra^2+", output: "Ra<sup>2+</sup>" },
      { value: "Rb^1+", output: "Rb<sup>1+</sup>" },
      { value: "Rb^1+", output: "Rb<sup>1+</sup>" },
      { value: "Rh^3+", output: "Rh<sup>3+</sup>" },
      { value: "Ru^3+", output: "Ru<sup>3+</sup>" },
      { value: "Ru^4+", output: "Ru<sup>4+</sup>" },
      { value: "Sb^3+", output: "Sb<sup>3+</sup>" },
      { value: "Sc^3+", output: "Sc<sup>3+</sup>" },
      { value: "Sn^2+", output: "Sn<sup>2+</sup>" },
      { value: "Sn^4+", output: "Sn<sup>4+</sup>" },
      { value: "Sr^2+", output: "Sr<sup>2+</sup>" },
      { value: "Te^4+", output: "Te<sup>4+</sup>" },
      { value: "Th^4+", output: "Th<sup>4+</sup>" },
      { value: "Ti^4+", output: "Ti<sup>4+</sup>" },
      { value: "Tl^1+", output: "Tl<sup>1+</sup>" },
      { value: "Tl^3+", output: "Tl<sup>3+</sup>" },
      { value: "(UO2)^2+", output: "(UO<sub>2</sub>)<sup>2+</sup>" },
      { value: "U^3+", output: "U<sup>3+</sup>" },
      { value: "U^4+", output: "U<sup>4+</sup>" },
      { value: "VO^2+", output: "VO<sup>2+</sup>" },
      { value: "V^5+", output: "V<sup>5+</sup>" },
      { value: "W^4+", output: "W<sup>4+</sup>" },
      { value: "Y^3+", output: "Y<sup>3+</sup>" },
      { value: "Zn^2+", output: "Zn<sup>2+</sup>" },
      { value: "Zn^4+", output: "Zn<sup>4+</sup>" },
      { value: "(C4H7O2N2)^1-", output: "(C<sub>4</sub>H<sub>7</sub>O<sub>2</sub>N<sub>2</sub>)<sup>1−</sup>" },
      { value: "(C6H5)4B^1-", output: "(C<sub>6</sub>H<sub>5</sub>)<sub>4</sub>B<sup>1−</sup>" },
      { value: "(NH4)2[Fe(CN)6]^2-", output: "(NH<sub>4</sub>)<sub>2</sub>[Fe(CN)<sub>6</sub>]<sup>2−</sup>" },
      { value: "[(NH4)2Fe(CN)6]^2-", output: "[(NH<sub>4</sub>)<sub>2</sub>Fe(CN)<sub>6</sub>]<sup>2−</sup>" },
      { value: "[AuCl4]^1-", output: "[AuCl<sub>4</sub>]<sup>1−</sup>" },
      { value: "[Co(CN)6]^3-", output: "[Co(CN)<sub>6</sub>]<sup>3−</sup>" },
      { value: "[Co(NO2)6]^3-", output: "[Co(NO<sub>2</sub>)<sub>6</sub>]<sup>3−</sup>" },
      { value: "[Fe(CN)6]^4-", output: "[Fe(CN)<sub>6</sub>]<sup>4−</sup>" },
      { value: "[Fe(CN^1-)6]^3-", output: "[Fe(CN<sup>1−</sup>)<sub>6</sub>]<sup>3−</sup>" },
      { value: "[Fe(CN^1-)6]^4-", output: "[Fe(CN<sup>1−</sup>)<sub>6</sub>]<sup>4−</sup>" },
      { value: "[Hg(SCN)4]^2-", output: "[Hg(SCN)<sub>4</sub>]<sup>2−</sup>" },
      { value: "[HgCl3]^1-", output: "[HgCl<sub>3</sub>]<sup>1−</sup>" },
      { value: "[IrCl6]^2-", output: "[IrCl<sub>6</sub>]<sup>2−</sup>" },
      { value: "[PdCl4]^2-", output: "[PdCl<sub>4</sub>]<sup>2−</sup>" },
      { value: "[PdCl6]^2-", output: "[PdCl<sub>6</sub>]<sup>2−</sup>" },
      { value: "[Pt(CN)4]^2-", output: "[Pt(CN)<sub>4</sub>]<sup>2−</sup>" },
      { value: "[PtCl4]^2-", output: "[PtCl<sub>4</sub>]<sup>2−</sup>" },
      { value: "[PtCl6]^2-", output: "[PtCl<sub>6</sub>]<sup>2−</sup>" },
      { value: "[PtF6]^2-", output: "[PtF<sub>6</sub>]<sup>2−</sup>" },
      { value: "[Sb(OH)6]^1-", output: "[Sb(OH)<sub>6</sub>]<sup>1−</sup>" },
      { value: "[SiF6]^1-", output: "[SiF<sub>6</sub>]<sup>1−</sup>" },
      { value: "[SnCl6]^2-", output: "[SnCl<sub>6</sub>]<sup>2−</sup>" },
      { value: "AlF6^3-", output: "AlF<sub>6</sub><sup>3−</sup>" },
      { value: "AsO3^3-", output: "AsO<sub>3</sub><sup>3−</sup>" },
      { value: "AsO4^3-", output: "AsO<sub>4</sub><sup>3−</sup>" },
      { value: "BeF4^2-", output: "BeF<sub>4</sub><sup>2−</sup>" },
      { value: "BF4^1-", output: "BF<sub>4</sub><sup>1−</sup>" },
      { value: "BH4^1-", output: "BH<sub>4</sub><sup>1−</sup>" },
      { value: "BO2^1-", output: "BO<sub>2</sub><sup>1−</sup>" },
      { value: "Br^1-", output: "Br<sup>1−</sup>" },
      { value: "BrO3^1-", output: "BrO<sub>3</sub><sup>1−</sup>" },
      { value: "C2H3O2^1-", output: "C<sub>2</sub>H<sub>3</sub>O<sub>2</sub><sup>1−</sup>" },
      { value: "C2O4^2-", output: "C<sub>2</sub>O<sub>4</sub><sup>2−</sup>" },
      { value: "C4H4O6^2-", output: "C<sub>4</sub>H<sub>4</sub>O<sub>6</sub><sup>2−</sup>" },
      { value: "Cl^1-", output: "Cl<sup>1−</sup>" },
      { value: "ClO2^1-", output: "ClO<sub>2</sub><sup>1−</sup>" },
      { value: "ClO3^1-", output: "ClO<sub>3</sub><sup>1−</sup>" },
      { value: "ClO4^1-", output: "ClO<sub>4</sub><sup>1−</sup>" },
      { value: "CN^1-", output: "CN<sup>1−</sup>" },
      { value: "CO3^2-", output: "CO<sub>3</sub><sup>2−</sup>" },
      { value: "Cr2O7^2-", output: "Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup>" },
      { value: "CrO4^2-", output: "CrO<sub>4</sub><sup>2−</sup>" },
      { value: "CrOH^1-", output: "CrOH<sup>1−</sup>" },
      { value: "F^1-", output: "F<sup>1−</sup>" },
      { value: "GeF6^2-", output: "GeF<sub>6</sub><sup>2−</sup>" },
      { value: "H2PO4^1-", output: "H<sub>2</sub>PO4<sup>1−</sup>" },
      { value: "HAsO4^2-", output: "HAsO<sub>4</sub><sup>2−</sup>" },
      { value: "HfF6^2-", output: "HfF<sub>6</sub><sup>2−</sup>" },
      { value: "Hg(SCN)4^2-", output: "Hg(SCN)<sub>4</sub><sup>2−</sup>" },
      { value: "HPO4^2-", output: "HPO<sub>4</sub><sup>2−</sup>" },
      { value: "HVO4^2-", output: "HVO<sub>4</sub><sup>2−</sup>" },
      { value: "I^1-", output: "I<sup>1−</sup>" },
      { value: "IO3^1-", output: "IO<sub>3</sub><sup>1−</sup>" },
      { value: "IO4^1-", output: "IO<sub>4</sub><sup>1−</sup>" },
      { value: "IrCl6^2-", output: "IrCl<sub>6</sub><sup>2−</sup>" },
      { value: "KAsO4^2-", output: "KAsO<sub>4</sub><sup>2−</sup>" },
      { value: "KPO4^2-", output: "KPO<sub>4</sub><sup>2−</sup>" },
      { value: "MnO4^1-", output: "MnO<sub>4</sub><sup>1−</sup>" },
      { value: "MoO4^2-", output: "MoO<sub>4</sub><sup>2−</sup>" },
      { value: "N3^1-", output: "N<sub>3</sub><sup>1−</sup>" },
      { value: "NaAsO4^2-", output: "NaAsO<sub>4</sub><sup>2−</sup>" },
      { value: "NH4AsO4^2-", output: "NH<sub>4</sub>AsO<sub>4</sub><sup>2−</sup>" },
      { value: "NH4PO4^2-", output: "NH<sub>4</sub>PO<sub>4</sub><sup>2−</sup>" },
      { value: "NO2^1-", output: "NO<sub>2</sub><sup>1−</sup>" },
      { value: "NO3^1-", output: "NO<sub>3</sub><sup>1−</sup>" },
      { value: "O^2-", output: "O<sup>2−</sup>", searchBy: "o, o2" },
      { value: "OCN^1-", output: "OCN<sup>1−</sup>" },
      { value: "OH^1-", output: "OH<sup>1−</sup>" },
      { value: "P2O7^4-", output: "P<sub>2</sub>O<sub>7</sub><sup>4−</sup>" },
      { value: "PbO4^4-", output: "PbO<sub>4</sub><sup>4−</sup>" },
      { value: "PO3F^2-", output: "PO<sub>3</sub>F<sup>2−</sup>" },
      { value: "PO4^2-", output: "PO<sub>4</sub><sup>2−</sup>" },
      { value: "PO4^3-", output: "PO<sub>4</sub><sup>3−</sup>" },
      { value: "ReO4^1-", output: "ReO<sub>4</sub><sup>1−</sup>" },
      { value: "S^2-", output: "S<sup>2−</sup>", searchBy: "s, s2" },
      { value: "S2^2-", output: "S<sub>2</sub><sup>2−</sup>" },
      { value: "S2O3^2-", output: "S<sub>2</sub>O<sub>3</sub><sup>2−</sup>" },
      { value: "SCN^1-", output: "SCN<sup>1−</sup>" },
      { value: "Se^2-", output: "Se<sup>2−</sup>" },
      { value: "SeCN^1-", output: "SeCN<sup>1−</sup>" },
      { value: "SeO3^2-", output: "SeO<sub>3</sub><sup>2−</sup>" },
      { value: "SeO4^2-", output: "SeO<sub>4</sub><sup>2−</sup>" },
      { value: "SiF6^1-", output: "SiF<sub>6</sub><sup>1−</sup>" },
      { value: "SO3^2-", output: "SO<sub>3</sub><sup>2−</sup>" },
      { value: "SO3F^1-", output: "SO<sub>3</sub>F<sup>1−</sup>" },
      { value: "SO3NH2^1-", output: "SO<sub>3</sub>NH<sub>2</sub><sup>1−</sup>" },
      { value: "SO4^2-", output: "SO<sub>4</sub><sup>2−</sup>" },
      { value: "TiF6^2-", output: "TiF<sub>6</sub><sup>2−</sup>" },
      { value: "V2O7^4-", output: "V<sub>2</sub>O<sub>7</sub><sup>4−</sup>" },
      { value: "VO3^1-", output: "VO<sub>3</sub><sup>1−</sup>" },
      { value: "VO3^3-", output: "VO<sub>3</sub><sup>3−</sup>" },
      { value: "VO4^3-", output: "VO<sub>4</sub><sup>3−</sup>" },
      { value: "WO4^2-", output: "WO<sub>4</sub><sup>2−</sup>" },
      { value: "ZrF6^2-", output: "ZrF<sub>6</sub><sup>2−</sup>" }
    ]
  });

  function updateSelectedList() {
    $('#app .card').each(function(index, element){
      let compoundId = element.dataset.compoundId;
      if (compounds.some(item => item.id === compoundId)) {
        element.classList.add('selected');
      } else {
        element.classList.remove('selected');
      }
    });
  }

  function toggleSwitch() {
    if (isChecked) {
      $('.scientific').hide();
      $('.minus-log').show();
      $('.ksp').css('padding-top', '3px');
      $logSwitch.prop('checked', true);
    } else {
      $('.scientific').show();
      $('.minus-log').hide();
      $('.ksp').css('padding-top', '0');
      $logSwitch.prop('checked', false);
    }
  }

  $('#load-button').on('click', function() {
    loadCards();
    event.preventDefault();
  });

  tagify.on('input', function (event) {
    currentTag = event.detail.value;
  });
  
  tagify.on('dropdown:select', function() {
    enter = false;
  });
  
  tagify.on('dropdown:hide', function() {
    setTimeout(function() {
      enter = true;
    }, 300)
  });
  
  // TODO Отслеживать момент, когда все теги удалены?
  $(tagify.DOM.input).keyup(function (event) {  
    if (event.keyCode == 13 && currentTag !== '' && currentTag !== null && enter !== false) {
      loadCards();
    }
  });

  $('.menu-icon').on('click', function(){
    $('.menu-opened').toggle();
  });

  $('html').click(function(event) {
    if (!$(event.target).hasClass('menu-icon') && !$(event.target).hasClass('menu-opened')) {
      if ($('.menu-opened:visible').length === 1 && !$(event.target).parents('.menu-opened').length) {
        $('.menu-opened').toggle();
      }
    }
  });

  $('.clear-btn').on('click', function(){
    compounds = [];
    $('.compare-menu .card').remove();
    
    updateSelectedList();
    
    $('.compare-menu').removeClass('shown');
    $('body').css('position', '');
  });
});
