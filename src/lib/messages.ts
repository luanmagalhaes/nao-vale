export class ServiceError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ServiceError";
  }
}

export const mensagens = {
  400: "Faltou alguma informação no pedido.",
  401: "Você não está nessa sala.",
  403: "Essa jogada não é sua.",
  404: "Essa sala não existe.",
  409: "A sala mudou enquanto você jogava. Recarrega aí.",
  500: "Deu ruim aqui do nosso lado. Tenta de novo.",
} as const;

export function mensagemPara(status: number): string {
  if (status in mensagens) {
    return mensagens[status as keyof typeof mensagens];
  }

  return mensagens[500];
}
