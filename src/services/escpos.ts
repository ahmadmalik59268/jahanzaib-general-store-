import { Sale, PrinterSettings, KhataLedgerEntry } from '../types';

/**
 * Text sanitization for ESC/POS thermal printers (CP437).
 * Anything outside standard ASCII shifts columns and prints garbage glyphs.
 */
export function sanitizeEscPosText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[₨₹]/g, 'Rs.')
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '*')
    .replace(/[^\x20-\x7E\n\r]/g, (char) => {
      // Map common Urdu/Arabic/extended numbers to standard ASCII digits
      const code = char.charCodeAt(0);
      if (code >= 0x0660 && code <= 0x0669) {
        return String.fromCharCode(code - 0x0660 + 48); // Arabic-Indic digits
      }
      if (code >= 0x06f0 && code <= 0x06f9) {
        return String.fromCharCode(code - 0x06f0 + 48); // Eastern Arabic-Indic (Urdu) digits
      }
      // If it's a known accented letter
      return '?';
    });
}

/**
 * Center text within a given column width
 */
export function center(text: string, width: number): string {
  const clean = text.trim();
  if (clean.length >= width) return clean.slice(0, width);
  const leftPadding = Math.floor((width - clean.length) / 2);
  const rightPadding = width - clean.length - leftPadding;
  return ' '.repeat(leftPadding) + clean + ' '.repeat(rightPadding);
}

/**
 * Rule separator line of given width
 */
export function rule(width: number, char: string = '-'): string {
  return char.repeat(width);
}

/**
 * Left-aligned label and right-aligned value padded with spaces
 */
export function pair(left: string, right: string, width: number): string {
  const l = left.trim();
  const r = right.trim();
  const spaceNeeded = width - l.length - r.length;
  if (spaceNeeded >= 1) {
    return l + ' '.repeat(spaceNeeded) + r;
  }
  // If too long, truncate left or put on two lines
  const maxLeft = Math.max(1, width - r.length - 1);
  return l.slice(0, maxLeft) + ' ' + r;
}

/**
 * Word wrap text to column width
 */
export function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= width) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > width) {
        let remaining = word;
        while (remaining.length > width) {
          lines.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Formats a currency amount into standard clean string "Rs. 1,250"
 */
export function formatCurrency(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Single layout renderer: generates the monospaced text for a sale receipt.
 * Applied across 58mm (32 cols), 80mm (48 cols), WhatsApp sharing, and system printing.
 */
export function renderSaleReceiptText(sale: Sale, settings: PrinterSettings, width: number = settings.paperWidthChars): string {
  const lines: string[] = [];
  const divider = rule(width, '=');
  const thinDivider = rule(width, '-');

  // 1. Header
  const shopTitle = settings.shopNameEn || 'GENERAL STORE';
  lines.push(center(shopTitle.toUpperCase(), width));
  if (settings.shopNameUrdu) {
    // Also include romanized or sanitized store name
    lines.push(center('GENERAL STORE & KHATA', width));
  }
  if (settings.shopAddress) {
    lines.push(center(settings.shopAddress, width));
  }
  if (settings.shopPhone) {
    lines.push(center(`Tel: ${settings.shopPhone}`, width));
  }

  lines.push(divider);

  // 2. Receipt metadata
  const dateObj = new Date(sale.timestamp);
  const dateStr = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  lines.push(pair(`Bill: #${sale.receiptNo}`, dateStr, width));
  lines.push(pair(`Time: ${timeStr}`, `Type: ${sale.paymentMethod.toUpperCase()}`, width));

  if (sale.customerName) {
    lines.push(pair('Customer:', sale.customerName, width));
  }

  lines.push(divider);

  // 3. Table Column Headers
  lines.push(pair('ITEM DESCRIPTION', 'TOTAL', width));
  lines.push(thinDivider);

  // 4. Items List
  // Critical POS requirement: Item name on its own line, arithmetic right-aligned beneath it!
  // This guarantees long names never get crushed on 58mm (32 columns).
  for (const item of sale.items) {
    // English name preferred for thermal printers to prevent CP437 corruptions
    const itemName = item.product.nameEn || item.product.nameUrdu || 'Item';
    const wrappedName = wrap(itemName, width);
    for (const nameLine of wrappedName) {
      lines.push(nameLine);
    }

    const calcLeft = `  ${item.quantity} ${item.product.unit || 'pcs'} x ${item.unitPrice}`;
    const totalRight = `${Math.round(item.total).toLocaleString('en-US')}`;
    lines.push(pair(calcLeft, totalRight, width));
  }

  lines.push(thinDivider);

  // 5. Totals & Payment Summary
  lines.push(pair('Items Subtotal:', `${Math.round(sale.subtotal).toLocaleString('en-US')}`, width));

  if (sale.discount > 0) {
    lines.push(pair('Discount (-):', `${Math.round(sale.discount).toLocaleString('en-US')}`, width));
  }

  lines.push(pair('NET TOTAL:', `${formatCurrency(sale.finalTotal)}`, width));
  lines.push(thinDivider);

  // Payment Breakdown
  if (sale.paymentMethod === 'cash') {
    lines.push(pair('Payment Mode:', 'CASH (NAQD)', width));
    lines.push(pair('Cash Received:', `${formatCurrency(sale.cashReceived)}`, width));
    if (sale.changeDue > 0) {
      lines.push(pair('Change Returned:', `${formatCurrency(sale.changeDue)}`, width));
    }
  } else if (sale.paymentMethod === 'udhaar') {
    lines.push(pair('Payment Mode:', 'UDHAAR (CREDIT KHATA)', width));
    lines.push(pair('This Bill Amount:', `${formatCurrency(sale.udhaarAmount)}`, width));
    if (sale.previousCustomerBalance !== undefined) {
      lines.push(pair('Previous Khata Due:', `${formatCurrency(sale.previousCustomerBalance)}`, width));
      const totalKhata = sale.newCustomerBalance ?? (sale.previousCustomerBalance + sale.udhaarAmount);
      lines.push(pair('TOTAL KHATA BALANCE:', `${formatCurrency(totalKhata)}`, width));
    }
  } else if (sale.paymentMethod === 'split') {
    lines.push(pair('Payment Mode:', 'SPLIT (CASH + UDHAAR)', width));
    lines.push(pair('Cash Paid:', `${formatCurrency(sale.cashReceived)}`, width));
    lines.push(pair('Added to Khata:', `${formatCurrency(sale.udhaarAmount)}`, width));
    if (sale.previousCustomerBalance !== undefined) {
      lines.push(pair('Previous Khata Due:', `${formatCurrency(sale.previousCustomerBalance)}`, width));
      const totalKhata = sale.newCustomerBalance ?? (sale.previousCustomerBalance + sale.udhaarAmount);
      lines.push(pair('TOTAL KHATA BALANCE:', `${formatCurrency(totalKhata)}`, width));
    }
  }

  // 6. Footer Notes
  lines.push(divider);
  const footerNotice = settings.footerMessageEn || 'Thank you for your visit!';
  const wrappedFooter = wrap(footerNotice, width);
  for (const fLine of wrappedFooter) {
    lines.push(center(fLine, width));
  }
  lines.push(center('Software: Dukandar POS', width));

  return lines.join('\n');
}

/**
 * Render Khata Payment Received (Vasooli) slip
 */
export function renderVasooliReceiptText(entry: KhataLedgerEntry, settings: PrinterSettings, width: number = settings.paperWidthChars): string {
  const lines: string[] = [];
  const divider = rule(width, '=');
  const thinDivider = rule(width, '-');

  lines.push(center(settings.shopNameEn || 'GENERAL STORE', width));
  lines.push(center('PAYMENT RECEIPT (VASOOLI SLIP)', width));
  if (settings.shopPhone) lines.push(center(`Tel: ${settings.shopPhone}`, width));
  lines.push(divider);

  const dateObj = new Date(entry.date);
  lines.push(pair(`Receipt: #${entry.receiptNo || entry.id.slice(-6)}`, dateObj.toLocaleDateString('en-GB'), width));
  lines.push(pair('Customer:', entry.customerName, width));
  lines.push(thinDivider);

  lines.push(pair('Previous Balance:', formatCurrency(entry.previousBalance), width));
  lines.push(pair('Amount Received:', formatCurrency(entry.amount), width));
  lines.push(thinDivider);
  lines.push(pair('REMAINING BALANCE:', formatCurrency(entry.newBalance), width));

  if (entry.note) {
    lines.push(thinDivider);
    lines.push(pair('Note:', entry.note, width));
  }

  lines.push(divider);
  lines.push(center('Thank you for your timely payment!', width));
  lines.push(center(dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }), width));

  return lines.join('\n');
}

/**
 * Builds the exact raw ESC/POS byte sequence according to the POS specification:
 * - ESC @ (0x1B 0x40) init
 * - ESC t 0 (0x1B 0x74 0x00) select CP437
 * - US_ASCII text bytes
 * - ESC d 4 (0x1B 0x64 0x04) feed 4 lines
 * - GS V 66 0 (0x1D 0x56 0x42 0x00) partial cut
 */
export function buildEscPosByteStream(formattedText: string): Uint8Array {
  const sanitized = sanitizeEscPosText(formattedText);
  const textBytes: number[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i);
    // Standard ASCII 32..126 plus \n (10) and \r (13)
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      textBytes.push(code);
    } else {
      textBytes.push(63); // '?'
    }
  }

  const initCommand = [0x1B, 0x40]; // ESC @
  const codePageCommand = [0x1B, 0x74, 0x00]; // ESC t 0 (CP437)
  const feedLinesCommand = [0x1B, 0x64, 0x04]; // ESC d 4 (feed 4 lines)
  const cutCommand = [0x1D, 0x56, 0x42, 0x00]; // GS V 66 0 (partial cut)

  const totalLength =
    initCommand.length +
    codePageCommand.length +
    textBytes.length +
    feedLinesCommand.length +
    cutCommand.length;

  const result = new Uint8Array(totalLength);
  let offset = 0;

  result.set(initCommand, offset);
  offset += initCommand.length;

  result.set(codePageCommand, offset);
  offset += codePageCommand.length;

  result.set(textBytes, offset);
  offset += textBytes.length;

  result.set(feedLinesCommand, offset);
  offset += feedLinesCommand.length;

  result.set(cutCommand, offset);
  offset += cutCommand.length;

  return result;
}
