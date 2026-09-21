"use client";

export interface Sessao {
  code: string;
  token: string;
  playerId: string;
}

const chave = "nao-vale:sessao";
const chaveTutorial = "nao-vale:tutorial";

const ouvintes = new Set<() => void>();

let cacheBruto: string | null = null;
let cacheSessao: Sessao | null = null;

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  window.addEventListener("storage", ouvinte);

  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", ouvinte);
  };
}

export function lerSessao(): Sessao | null {
  const bruto =
    window.sessionStorage.getItem(chave) ?? window.localStorage.getItem(chave);

  if (bruto !== cacheBruto) {
    cacheBruto = bruto;

    try {
      cacheSessao = bruto ? (JSON.parse(bruto) as Sessao) : null;
    } catch {
      cacheSessao = null;
    }
  }

  return cacheSessao;
}

export function sessaoDoServidor(): Sessao | null {
  return null;
}

export function guardarSessao(sessao: Sessao, apenasNestaAba = false) {
  const destino = apenasNestaAba ? window.sessionStorage : window.localStorage;

  destino.setItem(chave, JSON.stringify(sessao));
  avisar();
}

export function limparSessao() {
  window.sessionStorage.removeItem(chave);
  window.localStorage.removeItem(chave);
  avisar();
}

export function lerTutorialVisto(): boolean {
  return window.localStorage.getItem(chaveTutorial) === "1";
}

export function tutorialDoServidor(): boolean {
  return true;
}

export function marcarTutorialVisto() {
  window.localStorage.setItem(chaveTutorial, "1");
  avisar();
}
