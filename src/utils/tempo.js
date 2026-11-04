
/*
  Funções para trabalhar com o tempo das receitas.

  O Supabase armazena o tempo total em minutos.
*/

// Converte minutos em horas e minutos para o formulário.
export function separarTempo(totalMinutos) {
  const total = Number(totalMinutos);

  if (!Number.isInteger(total) || total <= 0) {
    return {
      horas: "0",
      minutos: "",
    };
  }

  return {
    horas: String(Math.floor(total / 60)),
    minutos: String(total % 60),
  };
}

// Valida e converte os dois campos para minutos.
// Retorna null quando o tempo não é válido.
export function calcularTempo(horas, minutos) {
  const textoHoras = String(horas).trim();
  const textoMinutos = String(minutos).trim();

  const horasValidas =
    textoHoras === "" || /^\d+$/.test(textoHoras);

  const minutosValidos =
    textoMinutos === "" || /^\d+$/.test(textoMinutos);

  if (!horasValidas || !minutosValidos) {
    return null;
  }

  const numeroHoras = Number(textoHoras || 0);
  const numeroMinutos = Number(textoMinutos || 0);

  if (
    !Number.isSafeInteger(numeroHoras) ||
    !Number.isSafeInteger(numeroMinutos) ||
    numeroHoras < 0 ||
    numeroHoras > 24 ||
    numeroMinutos < 0 ||
    numeroMinutos > 59
  ) {
    return null;
  }

  const total = numeroHoras * 60 + numeroMinutos;

  // Mantém o limite anterior de 24 horas.
  if (total < 1 || total > 1440) {
    return null;
  }

  return total;
}

// Exibe o tempo de forma natural para o usuário.
export function formatarTempo(totalMinutos) {
  const total = Number(totalMinutos);

  if (!Number.isInteger(total) || total <= 0) {
    return "Não informado";
  }

  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  if (horas === 0) {
    return `${minutos} min`;
  }

  if (minutos === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${minutos} min`;
}
