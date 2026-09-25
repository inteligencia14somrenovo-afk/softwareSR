export const nomesInstrumentos = {
  // Cordas
  violao: "Cordas",
  guitarra: "Cordas",
  ukulele: "Cordas",
  contrabaixo: "Cordas",
  violino: "violino",

  // Teclas
  piano: "Teclas",
  teclado: "Teclas",

  // Outros
  canto: "Canto",
  bateria: "Bateria",

  // Categorias vindas diretamente da planilha
  "guitarra/violao/ukulele/contrabaixo": "Cordas",
  "guitarra/violao": "Cordas",
  "teclado/piano": "Teclas"
};


/**
 * Retorna a categoria do instrumento do aluno.
 *
 * Para guitarra, violão, ukulele e contrabaixo,
 * todos pertencem à categoria Cordas.
 *
 * Para teclado e piano, pertencem à categoria Teclas.
 */
export const obterNomeInstrumento = (aluno) => {
  if (!aluno) {
    return "Não informado";
  }

  return (
    nomesInstrumentos[aluno.instrumento] ||
    aluno.instrumento ||
    "Não informado"
  );
};