/** Validación de DNI, NIE, CIF y código REGA. */

const LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE";

export const normalizar = (s: string) => s.toUpperCase().replace(/[\s.-]/g, "");

export function esDniValido(valor: string): boolean {
  const v = normalizar(valor);
  const m = /^(\d{8})([A-Z])$/.exec(v);
  return !!m && LETRAS_DNI[Number(m[1]) % 23] === m[2];
}

export function esNieValido(valor: string): boolean {
  const v = normalizar(valor);
  const m = /^([XYZ])(\d{7})([A-Z])$/.exec(v);
  if (!m) return false;
  const numero = Number(`${"XYZ".indexOf(m[1])}${m[2]}`);
  return LETRAS_DNI[numero % 23] === m[3];
}

/** CIF: letra de tipo de sociedad, 7 dígitos y control (número o letra según el tipo). */
export function esCifValido(valor: string): boolean {
  const v = normalizar(valor);
  const m = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(v);
  if (!m) return false;
  const digitos = m[2].split("").map(Number);
  let suma = 0;
  digitos.forEach((d, i) => {
    if (i % 2 === 0) {
      const doble = d * 2;
      suma += Math.floor(doble / 10) + (doble % 10);
    } else suma += d;
  });
  const control = (10 - (suma % 10)) % 10;
  const letraControl = "JABCDEFGHI"[control];
  const c = m[3];
  if ("PQRSNW".includes(m[1])) return c === letraControl;
  if ("ABEH".includes(m[1])) return c === String(control);
  return c === String(control) || c === letraControl;
}

export const esNifPersonaValido = (v: string) => esDniValido(v) || esNieValido(v);
export const esNifValido = (v: string) => esNifPersonaValido(v) || esCifValido(v);

/** REGA: "ES" + 12 dígitos. Si el ganadero escribe solo los números, se añade "ES". */
export function normalizarRega(valor: string): string {
  const v = normalizar(valor);
  return /^\d{12}$/.test(v) ? `ES${v}` : v;
}
export const esRegaValido = (valor: string) => /^ES\d{12}$/.test(normalizarRega(valor));
