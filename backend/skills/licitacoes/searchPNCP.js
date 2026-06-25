import { logger } from "../../observability/logger.js";

const PNCP_BASE = "https://pncp.gov.br/api/consulta/v1";

const MODALIDADES = {
  "pregao-eletronico": 6,
  "concorrencia": 2,
  "concurso": 3,
  "leilao": 4,
  "dialogo-competitivo": 5,
  "dispensa": 8,
  "inexigibilidade": 9,
  "pre-qualificacao": 7,
  "credenciamento": 10,
};

function formatDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function searchPNCP({
  palavraChave,
  modalidade,
  uf,
  dataInicial,
  dataFinal,
  pagina = 1,
  tamanhoPagina = 20,
} = {}) {
  const now = new Date();
  const di = dataInicial || formatDate(new Date(now.getTime() - 30 * 86400000));
  const df = dataFinal || formatDate(now);
  const mod = MODALIDADES[modalidade] ?? modalidade ?? 6;

  const params = new URLSearchParams({
    dataInicial: di,
    dataFinal: df,
    codigoModalidadeContratacao: String(mod),
    tamanhoPagina: String(Math.min(tamanhoPagina, 50)),
    pagina: String(pagina),
  });

  if (palavraChave?.trim()) params.set("palavraChave", palavraChave.trim());

  const url = `${PNCP_BASE}/contratacoes/publicacao?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("pncp.search.error", { status: res.status, body: body.slice(0, 200) });
      throw new Error(`PNCP retornou ${res.status}`);
    }

    const json = await res.json();
    const results = (json.data ?? []).map(normalizeEdital);

    return {
      editais: results,
      total: json.totalRegistros ?? 0,
      pagina: json.numeroPagina ?? pagina,
      totalPaginas: json.totalPaginas ?? 0,
    };
  } catch (err) {
    logger.error("pncp.search.fail", { url, error: err.message });
    throw err;
  }
}

export async function getEditalDetail(cnpjOrgao, anoCompra, sequencial) {
  const url = `${PNCP_BASE}/../pncp/v1/orgaos/${cnpjOrgao}/compras/${anoCompra}/${sequencial}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchPrecosReferencia({ palavraChave, pagina = 1 }) {
  const now = new Date();
  const di = formatDate(new Date(now.getTime() - 180 * 86400000));
  const df = formatDate(now);

  const params = new URLSearchParams({
    dataInicial: di,
    dataFinal: df,
    codigoModalidadeContratacao: "6",
    tamanhoPagina: "50",
    pagina: String(pagina),
  });
  if (palavraChave) params.set("palavraChave", palavraChave);

  const url = `${PNCP_BASE}/contratacoes/publicacao?${params}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { precos: [], stats: null };

    const json = await res.json();
    const homologados = (json.data ?? [])
      .filter((d) => d.valorTotalHomologado > 0)
      .map((d) => ({
        objeto: d.objetoCompra?.slice(0, 150),
        orgao: d.orgaoEntidade?.razaoSocial,
        uf: d.unidadeOrgao?.ufSigla,
        modalidade: d.modalidadeNome,
        valorEstimado: d.valorTotalEstimado,
        valorHomologado: d.valorTotalHomologado,
        desconto: d.valorTotalEstimado > 0
          ? Math.round((1 - d.valorTotalHomologado / d.valorTotalEstimado) * 100)
          : null,
        data: d.dataPublicacaoPncp?.slice(0, 10),
        pncp: d.numeroControlePNCP,
      }));

    if (!homologados.length) return { precos: [], stats: null };

    const valores = homologados.map((h) => h.valorHomologado);
    const stats = {
      total: homologados.length,
      media: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length),
      mediana: valores.sort((a, b) => a - b)[Math.floor(valores.length / 2)],
      minimo: Math.min(...valores),
      maximo: Math.max(...valores),
      descontoMedio: Math.round(
        homologados.filter((h) => h.desconto != null).reduce((a, h) => a + h.desconto, 0) /
        (homologados.filter((h) => h.desconto != null).length || 1)
      ),
    };

    return { precos: homologados.slice(0, 20), stats };
  } catch (err) {
    logger.error("pncp.precos.fail", { error: err.message });
    return { precos: [], stats: null };
  }
}

function normalizeEdital(raw) {
  return {
    id: raw.numeroControlePNCP,
    objeto: raw.objetoCompra,
    orgao: raw.orgaoEntidade?.razaoSocial,
    cnpjOrgao: raw.orgaoEntidade?.cnpj,
    uf: raw.unidadeOrgao?.ufSigla,
    municipio: raw.unidadeOrgao?.municipioNome,
    modalidade: raw.modalidadeNome,
    modalidadeId: raw.modalidadeId,
    modoDisputa: raw.modoDisputaNome,
    amparoLegal: raw.amparoLegal?.nome,
    processo: raw.processo,
    numeroCompra: raw.numeroCompra,
    srp: raw.srp,
    valorEstimado: raw.valorTotalEstimado,
    valorHomologado: raw.valorTotalHomologado,
    dataPublicacao: raw.dataPublicacaoPncp,
    dataAbertura: raw.dataAberturaProposta,
    dataEncerramento: raw.dataEncerramentoProposta,
    situacao: raw.situacaoCompraNome,
    linkOrigem: raw.linkSistemaOrigem,
    tipoInstrumento: raw.tipoInstrumentoConvocatorioNome,
    anoCompra: raw.anoCompra,
    sequencialCompra: raw.sequencialCompra,
  };
}
