/***************************************
 * 1) Función para obtener el MCD de dos enteros
 ***************************************/
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      let temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  
  /***************************************
   * 2) Función para obtener el MCD de un array de enteros
   ***************************************/
  function gcdArray(nums) {
    if (nums.length === 0) return 1;
    let currentGCD = nums[0];
    for (let i = 1; i < nums.length; i++) {
      currentGCD = gcd(currentGCD, nums[i]);
    }
    return currentGCD;
  }
  
  /***************************************
   * 3) Parsear un término en {coef, vars: { x: exp, y: exp, ... }}
   ***************************************/
  function parseTerm(termStr) {
    // El término puede lucir como: "3x^2y", "-4xy^3", "x^2", "-y", etc.
    // 1) Identificamos signo
    let sign = 1;
    termStr = termStr.trim();
    if (termStr[0] === '-') {
      sign = -1;
      termStr = termStr.slice(1);
    } else if (termStr[0] === '+') {
      termStr = termStr.slice(1);
    }
    termStr = termStr.trim();
  
    // 2) Extraemos el coeficiente numérico inicial (si existe)
    //    Si no hay número, el coef es 1.
    let match = termStr.match(/^(\d+)/);
    let coef = 1;
    let rest = termStr;
    if (match) {
      coef = parseInt(match[1]);
      rest = termStr.slice(match[1].length);
    }
  
    // 3) Diccionario de variables y exponentes
    let vars = {};
  
    // 4) Buscar secuencias tipo x^2, y^3, z, etc. Ejemplo de regex simple:
    let varRegex = /([a-zA-Z])(\^\d+)?/g;
    let m;
    while ((m = varRegex.exec(rest)) !== null) {
      let variable = m[1];
      let exponentPart = m[2]; // puede ser algo como ^2, ^3, etc.
      let exponent = 1;
      if (exponentPart) {
        exponent = parseInt(exponentPart.slice(1)); // quitar el '^'
      }
      // Acumular en el diccionario
      vars[variable] = (vars[variable] || 0) + exponent;
    }
  
    return {
      coef: sign * coef,
      vars: vars
    };
  }
  
  /***************************************
   * 4) Parsear un polinomio en array de términos
   ***************************************/
  function parsePolynomial(polyStr) {
    // 1) Reemplazamos los '-' por '+-' para luego hacer split por '+'
    //    (salvo si es el primer caracter)
    let modified = polyStr.replace(/(?<!^)-/g, '+-');
    // 2) Dividir por '+'
    let termsStr = modified.split('+').map(s => s.trim()).filter(s => s !== '');
  
    // 3) Parsear cada término
    let terms = termsStr.map(t => parseTerm(t));
    return terms;
  }
  
  /***************************************
   * 5) Hallar el factor común:
   *    - MCD de coeficientes
   *    - Menor exponente de cada variable
   ***************************************/
  function findCommonFactor(terms) {
    // MCD de coeficientes
    let coefs = terms.map(t => t.coef);
    let commonCoef = gcdArray(coefs);
  
    // Hallar variables en total
    let allVars = {};
    terms.forEach(t => {
      for (let v in t.vars) {
        if (!allVars[v]) {
          allVars[v] = t.vars[v];
        } else {
          // No sumamos, solo marcamos que existe
          allVars[v] = Math.max(allVars[v], t.vars[v]);
        }
      }
    });
  
    // Para cada variable, encontrar el mínimo exponente en todos los términos
    let commonVars = {};
    for (let v in allVars) {
      let minExp = Infinity;
      terms.forEach(t => {
        let e = t.vars[v] || 0; // si no aparece en un término, exponente = 0
        if (e < minExp) minExp = e;
      });
      if (minExp > 0 && minExp !== Infinity) {
        commonVars[v] = minExp;
      }
    }
  
    return {
      coef: commonCoef,
      vars: commonVars
    };
  }
  
  /***************************************
   * 6) Construir la notación de un factor (coef + variables^exponente)
   ***************************************/
  function buildFactorString(coef, vars) {
    // Si coef = 1 o -1, y hay variables, a veces omitimos el 1
    // Pero aquí lo mostraremos salvo que no haya variables
    let coefStr = coef.toString();
    let varStr = '';
    // Ordenar variables alfabéticamente para consistencia
    let sortedVars = Object.keys(vars).sort();
    sortedVars.forEach(v => {
      let e = vars[v];
      if (e === 1) {
        varStr += v;
      } else {
        varStr += `${v}^${e}`;
      }
    });
  
    if (coef === 1 && varStr.length > 0) {
      coefStr = '';
    } else if (coef === -1 && varStr.length > 0) {
      coefStr = '-';
    }
  
    return coefStr + varStr;
  }
  
  /***************************************
   * 7) Dividir cada término por el factor común
   ***************************************/
  function divideTermByFactor(term, factor) {
    let newCoef = term.coef / factor.coef;
    let newVars = {};
  
    // Para cada variable en term.vars, restar el exponente
    for (let v in term.vars) {
      let originalExp = term.vars[v];
      let factorExp = factor.vars[v] || 0;
      let newExp = originalExp - factorExp;
      if (newExp > 0) {
        newVars[v] = newExp;
      }
    }
  
    return {
      coef: newCoef,
      vars: newVars
    };
  }
  
  /***************************************
   * 8) Construir la expresión a partir de un array de términos parseados
   ***************************************/
  function buildExpressionString(terms) {
    // Convertimos cada término en string y los unimos con +/-
    // Teniendo en cuenta el signo
    let result = '';
    terms.forEach((t, index) => {
      let s = buildFactorString(t.coef, t.vars);
      if (index === 0) {
        // primer término
        result += s;
      } else {
        if (t.coef >= 0) {
          result += '+' + s;
        } else {
          // s ya contendrá el signo si es negativo (p.e. "-2x")
          // pero si buildFactorString omite el -1, tenemos que manejarlo
          if (s.startsWith('-')) {
            result += s;
          } else {
            // (caso raro: si coef era -1 y buildFactorString devolvió solo "-x^2")
            result += s; 
          }
        }
      }
    });
  
    // Si result está vacío, significa que todo se canceló (caso polinomio 0)
    return result || '0';
  }
  
  /***************************************
   * 9) Manejo del botón "Factorizar"
   ***************************************/
  document.getElementById("factorBtn").addEventListener("click", function() {
    const userPolynomial = document.getElementById("userPolynomial").value.trim();
    const stepsContainer = document.getElementById("steps");
    stepsContainer.innerHTML = ""; // Limpiar pasos
  
    if (!userPolynomial) {
      stepsContainer.textContent = "Por favor, ingrese un polinomio válido.";
      return;
    }
  
    // 1) Parsear el polinomio
    let terms = parsePolynomial(userPolynomial);
    if (terms.length === 0) {
      stepsContainer.textContent = "No se pudo parsear el polinomio.";
      return;
    }
  
    // Mostrar paso 1: Expresión original
    let p1 = document.createElement("p");
    p1.innerHTML = `<span class="step-title">Paso 1:</span> 
                    Expresión original: $$${userPolynomial}$$`;
    stepsContainer.appendChild(p1);
  
    // 2) Hallar factor común
    let factor = findCommonFactor(terms);
  
    // Mostrar paso 2: MCD y factor común de variables
    let factorCoefStr = factor.coef.toString();
    let factorVarsStr = buildFactorString(1, factor.vars); // 1 para no duplicar el coef
    let p2 = document.createElement("p");
    p2.innerHTML = `<span class="step-title">Paso 2:</span> 
                    Factor común: $$${factorCoefStr}${factorVarsStr ? factorVarsStr : ''}$$`;
    stepsContainer.appendChild(p2);
  
    // 3) Dividir cada término por el factor
    let newTerms = terms.map(t => divideTermByFactor(t, factor));
  
    // Mostrar paso 3: División de cada término
    let p3 = document.createElement("p");
    let divisionHTML = `<span class="step-title">Paso 3:</span> Dividir cada término:<br><ul>`;
    terms.forEach((oldTerm, i) => {
      let newTerm = newTerms[i];
      let oldStr = buildFactorString(oldTerm.coef, oldTerm.vars);
      let newStr = buildFactorString(newTerm.coef, newTerm.vars);
      divisionHTML += `<li>$$\\frac{${oldStr}}{${factorCoefStr}${factorVarsStr}} = ${newStr}$$</li>`;
    });
    divisionHTML += `</ul>`;
    p3.innerHTML = divisionHTML;
    stepsContainer.appendChild(p3);
  
    // 4) Construir la expresión factorizada
    let factorStr = buildFactorString(factor.coef, factor.vars);
    let newExpressionStr = buildExpressionString(newTerms);
  
    // Mostrar paso 4: Resultado final
    let p4 = document.createElement("p");
    p4.classList.add("result");
    p4.innerHTML = `Expresión factorizada: $$${factorStr}\\bigl(${newExpressionStr}\\bigr)$$`;
    stepsContainer.appendChild(p4);
  
    // Renderizar con MathJax
    window.MathJax.typesetPromise([stepsContainer]);
  });
  