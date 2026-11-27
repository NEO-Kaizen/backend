import path from "node:path";
import SVGtoPDF from "svg-to-pdfkit";
import Config from "../../configs.ts";
import { getSettingsRow } from "../portalConfig/portalConfig.repository.ts";
import { readFile } from "node:fs/promises";
import PDFDocument from "pdfkit";

const MARGIN = 48;
const BOTTOM_MARGIN = 54;
const COLUMN_GAP = 20;
const FIELD_GAP = 5;
const BODY_SIZE = 10.5;
const LABEL_SIZE = 9;
const COLORS = {
  primary: "#00236F",
  secondary: "#0058BE",
  tint: "#D6E7FB",
  text: "#3C3E47",
  rule: "#E5E7EB",
};
const ASSETS = new URL("../../../assets/", import.meta.url);

interface Artwork {
  defaultLogo: string;
  inter: Buffer;
  montserrat: Buffer;
}

let artwork: Artwork | undefined;

async function loadArtwork(): Promise<Artwork> {
  if (artwork) return artwork;

  const [defaultLogo, inter, montserrat] = await Promise.all([
    readFile(new URL("MAAT-logo.svg", ASSETS), "utf8"),
    readFile(new URL("pdf/Inter-Regular.ttf", ASSETS)),
    readFile(new URL("pdf/Montserrat-SemiBold.ttf", ASSETS)),
  ]);

  artwork = { defaultLogo, inter, montserrat };
  return artwork;
}

async function loadPortalLogo(defaultLogo: string): Promise<string | Buffer> {
  const { logo_light_url } = await getSettingsRow();

  // O upload pelo painel ADM salva a imagem em /uploads/portal/.
  const name = /^\/uploads\/portal\/([\w.-]+\.(?:svg|png))$/i.exec(
    logo_light_url ?? "",
  )?.[1];

  if (!name) return defaultLogo;

  try {
    const data = await readFile(path.join(Config.UPLOAD_DIR, "portal", name));
    return name.toLowerCase().endsWith(".svg") ? data.toString("utf8") : data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaultLogo;
    throw error;
  }
}

type Document = PDFKit.PDFDocument;
type Field = readonly [label: string, value: string];

function contentWidth(doc: Document): number {
  return doc.page.width - 2 * MARGIN;
}

function ensureSpace(doc: Document, height: number): void {
  if (doc.y + height > doc.page.height - BOTTOM_MARGIN) doc.addPage();
}

function labelStyle(doc: Document): Document {
  return doc.font("Heading").fontSize(LABEL_SIZE).fillColor(COLORS.primary);
}

function bodyStyle(doc: Document): Document {
  return doc.font("Body").fontSize(BODY_SIZE).fillColor(COLORS.text);
}

function rule(doc: Document, y: number): void {
  doc
    .moveTo(MARGIN, y)
    .lineTo(doc.page.width - MARGIN, y)
    .lineWidth(0.75)
    .strokeColor(COLORS.rule)
    .stroke();
}

export function addSectionTitle(doc: Document, title: string): void {
  ensureSpace(doc, 62);
  doc.y += 14;
  doc.font("Heading").fontSize(12).fillColor(COLORS.primary).text(title);
  rule(doc, doc.y + 2);
  doc.y += 9;
}

export function addField(doc: Document, label: string, value: string): void {
  if (!value) return;
  ensureSpace(doc, 30);
  labelStyle(doc).text(label);
  bodyStyle(doc).text(value);
  doc.y += FIELD_GAP;
}

export function addFieldPair(doc: Document, left: Field, right: Field): void {
  if (!left[1] || !right[1]) {
    addField(doc, ...left);
    addField(doc, ...right);
    return;
  }

  const width = (contentWidth(doc) - COLUMN_GAP) / 2;
  const rowHeight = Math.max(
    ...[left, right].map(
      ([label, value]) =>
        labelStyle(doc).heightOfString(label, { width }) +
        bodyStyle(doc).heightOfString(value, { width }),
    ),
  );

  if (rowHeight > 48) {
    addField(doc, ...left);
    addField(doc, ...right);
    return;
  }

  ensureSpace(doc, rowHeight + FIELD_GAP);
  const y = doc.y;
  let bottom = y;
  for (const [index, [label, value]] of [left, right].entries()) {
    const x = MARGIN + index * (width + COLUMN_GAP);
    labelStyle(doc).text(label, x, y, { width });
    bodyStyle(doc).text(value, x, doc.y, { width });
    bottom = Math.max(bottom, doc.y);
  }
  doc.x = MARGIN;
  doc.y = bottom + FIELD_GAP;
}

export function addParagraph(doc: Document, value: string): void {
  bodyStyle(doc).text(value);
}

export function addBullet(doc: Document, value: string): void {
  addParagraph(doc, `• ${value}`);
  doc.y += 3;
}

interface PdfHeader {
  protocol: string;
  title: string;
  status: string;
  generatedAt: string;
}

function renderHeader(doc: Document, header: PdfHeader, logo: string | Buffer): void {
  const width = contentWidth(doc);

  if (typeof logo === "string") {
    SVGtoPDF(doc, logo, MARGIN, MARGIN, {
      width: 108,
      height: 33,
      preserveAspectRatio: "xMinYMid meet",
      imageCallback: (href) =>
        /^data:image\/(png|jpeg);base64,/i.test(href) ? href : "",
    });
  } else {
    doc.image(logo, MARGIN, MARGIN, {
      fit: [108, 33],
      valign: "center",
    });
  }

  doc
    .font("Body")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(`Gerado em ${header.generatedAt}`, MARGIN + 120, MARGIN + 8, {
      width: width - 120,
      align: "right",
    });
  rule(doc, MARGIN + 42);
  labelStyle(doc).text("Relatório de solicitação", MARGIN, MARGIN + 56);
  doc
    .font("Heading")
    .fontSize(22)
    .fillColor(COLORS.primary)
    .text(header.title || "Relatório de solicitação", { lineGap: 3 });

  const padding = 13;
  const protocolWidth = 178;
  const statusX = MARGIN + padding + protocolWidth;
  const statusWidth = width - protocolWidth - 2 * padding;
  const statusStyle = () => doc.font("Heading").fontSize(12).fillColor(COLORS.secondary);
  const statusHeight = statusStyle().heightOfString(header.status, { width: statusWidth });
  const panelHeight = Math.max(60, 2 * padding + 15 + statusHeight);
  doc.y += 12;

  // Status personalizados extensos continuam no fluxo normal de texto.
  if (panelHeight > 110) {
    addField(doc, "Protocolo", header.protocol);
    addField(doc, "Status", header.status);
    return;
  }

  ensureSpace(doc, panelHeight);
  const top = doc.y;
  doc.roundedRect(MARGIN, top, width, panelHeight, 8).fill(COLORS.tint);
  labelStyle(doc).text("Protocolo", MARGIN + padding, top + padding, { lineBreak: false });
  labelStyle(doc).text("Status", statusX, top + padding, { lineBreak: false });
  doc
    .font("Heading")
    .fontSize(17)
    .fillColor(COLORS.primary)
    .text(header.protocol, MARGIN + padding, top + padding + 15, { lineBreak: false });
  statusStyle().text(header.status, statusX, top + padding + 15, { width: statusWidth });
  doc.x = MARGIN;
  doc.y = top + panelHeight;
}

function renderPageMargins(doc: Document, protocol: string): void {
  const { start, count } = doc.bufferedPageRange();
  for (let index = start; index < start + count; index++) {
    doc.switchToPage(index);
    if (index > start) {
      labelStyle(doc).text(`MAAT Flow  /  ${protocol}`, MARGIN, 23, { lineBreak: false });
      rule(doc, 39);
    }

    const footer = `Página ${index - start + 1} de ${count}`;
    const footerY = doc.page.height - 33;
    rule(doc, footerY - 8);
    doc.font("Body").fontSize(8).fillColor(COLORS.text);
    doc.text("MAAT Flow", MARGIN, footerY, { lineBreak: false });
    doc.text(footer, doc.page.width - MARGIN - doc.widthOfString(footer), footerY, {
      lineBreak: false,
    });
  }
}

export async function buildPdf(
  header: PdfHeader,
  render: (doc: Document) => void,
): Promise<Buffer> {
  const { defaultLogo, inter, montserrat } = await loadArtwork();
const logo = await loadPortalLogo(defaultLogo);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: BOTTOM_MARGIN, left: MARGIN, right: MARGIN },
      bufferPages: true,
      info: {
        Title: `Solicitação ${header.protocol}`,
        Author: "Portal MAAT",
        Subject: "Relatório de solicitação",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      doc.registerFont("Body", inter).registerFont("Heading", montserrat);
      renderHeader(doc, header, logo);
      render(doc);
      renderPageMargins(doc, header.protocol);
      doc.end();
    } catch (error) {
      doc.destroy();
      reject(error);
    }
  });
}
