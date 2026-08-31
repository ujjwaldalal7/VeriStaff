interface PayslipTemplateData {
  companyName: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerAddress?: string | null;
  authorizedSignUrl?: string | null;

  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;

  monthYear: string;

  basicSalary: string;
  hra: string;
  allowances: string;
  deductions: string;
  grossSalary: string;
  netSalary: string;

  documentNumber: string;
  issueDate: string;

  verificationUrl: string;
  qrDataUrl: string;
}

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const payslipTemplate = (
  data: PayslipTemplateData
): string => {
  const companyName = escapeHtml(data.companyName);
  const employeeName = escapeHtml(data.employeeName);

  const logo = data.logoUrl
    ? `<img src="${data.logoUrl}" class="logo" alt="Company logo" />`
    : `<div class="logo-placeholder">${companyName.charAt(0)}</div>`;

  const watermark = data.watermarkUrl
    ? `<div class="watermark" style="background-image:url('${data.watermarkUrl}')"></div>`
    : "";

  const signature = data.authorizedSignUrl
    ? `<img src="${data.authorizedSignUrl}" class="signature" alt="Authorized signature" />`
    : `<div class="signature-space"></div>`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />

<style>
  @page {
    size: A4;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 210mm;
    height: 297mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #1f2937;
    background: white;
  }

  .page {
    position: relative;
    width: 210mm;
    height: 297mm;
    padding: 14mm 16mm 19mm;
    overflow: hidden;
  }

  .content {
    position: relative;
    z-index: 2;
  }

  .watermark {
    position: absolute;
    width: 115mm;
    height: 115mm;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
    opacity: 0.045;
    z-index: 0;
  }

  .top-bar {
    height: 4px;
    margin: -14mm -16mm 9mm;
    background: linear-gradient(
      90deg,
      ${data.primaryColor},
      ${data.secondaryColor}
    );
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid ${data.secondaryColor};
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .logo-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    background: ${data.primaryColor};
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 22px;
    font-weight: bold;
  }

  .company-name {
    color: ${data.primaryColor};
    font-size: 18px;
    font-weight: 700;
  }

  .document-meta {
    text-align: right;
    font-size: 8px;
    line-height: 1.6;
    color: #6b7280;
  }

  .document-number {
    color: #374151;
    font-weight: 700;
  }

  .title {
    text-align: center;
    margin: 18px 0;
  }

  .title h1 {
    margin: 0;
    color: ${data.primaryColor};
    font-size: 21px;
    letter-spacing: 1px;
  }

  .title p {
    margin: 5px 0 0;
    color: #6b7280;
    font-size: 10px;
  }

  .employee-card {
    border: 1px solid #e5e7eb;
    border-left: 4px solid ${data.primaryColor};
    background: #f8fafc;
    border-radius: 4px;
    padding: 12px 15px;
  }

  .section-title {
    color: ${data.primaryColor};
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    margin-bottom: 10px;
  }

  .employee-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px 30px;
  }

  .label {
    color: #6b7280;
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: .4px;
  }

  .value {
    margin-top: 2px;
    font-size: 10px;
    font-weight: 600;
  }

  .salary-section {
    margin-top: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .salary-heading {
    padding: 8px 12px;
    background: ${data.primaryColor};
    color: white;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .salary-header,
  .salary-row {
    display: grid;
    grid-template-columns: 1fr 120px;
  }

  .salary-header {
    background: #f8fafc;
    font-size: 8px;
    font-weight: 700;
    color: #4b5563;
  }

  .salary-header div,
  .salary-row div {
    padding: 7px 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  .amount {
    text-align: right;
  }

  .salary-row {
    font-size: 9px;
  }

  .gross-row {
    background: #f8fafc;
    font-weight: 700;
  }

  .net-pay {
    margin-top: 14px;
    padding: 12px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${data.primaryColor};
    color: white;
    border-radius: 4px;
  }

  .net-label {
    font-size: 10px;
    font-weight: 700;
  }

  .net-value {
    font-size: 17px;
    font-weight: 700;
  }

  .bottom-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 20px;
  }

  .verification {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 65%;
  }

  .qr {
    width: 65px;
    height: 65px;
  }

  .verification-title {
    color: ${data.primaryColor};
    font-size: 8px;
    font-weight: 700;
  }

  .verification-text {
    margin-top: 3px;
    font-size: 7px;
    line-height: 1.4;
    color: #6b7280;
  }

  .verification-url {
    margin-top: 3px;
    font-size: 5.5px;
    word-break: break-all;
    color: #6b7280;
  }

  .signature-box {
    width: 145px;
    text-align: center;
  }

  .signature {
    width: 120px;
    height: 38px;
    object-fit: contain;
  }

  .signature-space {
    height: 38px;
  }

  .signature-line {
    border-top: 1px solid #374151;
    padding-top: 4px;
    font-size: 8px;
    font-weight: 600;
  }

  .footer {
    position: absolute;
    left: 16mm;
    right: 16mm;
    bottom: 7mm;
    padding-top: 5px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 6.5px;
    color: #6b7280;
    z-index: 2;
  }

  .footer strong {
    color: ${data.primaryColor};
  }
</style>
</head>

<body>

<div class="page">

  ${watermark}

  <div class="content">

    <div class="top-bar"></div>

    <div class="header">

      <div class="brand">
        ${logo}

        <div class="company-name">
          ${companyName}
        </div>
      </div>

      <div class="document-meta">
        <div>Issue Date: ${escapeHtml(data.issueDate)}</div>
        <div class="document-number">
          ${escapeHtml(data.documentNumber)}
        </div>
      </div>

    </div>

    <div class="title">
      <h1>PAYSLIP</h1>
      <p>For ${escapeHtml(data.monthYear)}</p>
    </div>

    <div class="employee-card">

      <div class="section-title">
        Employee Details
      </div>

      <div class="employee-grid">

        <div>
          <div class="label">Employee Name</div>
          <div class="value">${employeeName}</div>
        </div>

        <div>
          <div class="label">Employee ID</div>
          <div class="value">
            ${escapeHtml(data.employeeCode)}
          </div>
        </div>

        <div>
          <div class="label">Designation</div>
          <div class="value">
            ${escapeHtml(data.designation)}
          </div>
        </div>

        <div>
          <div class="label">Department</div>
          <div class="value">
            ${escapeHtml(data.department)}
          </div>
        </div>

      </div>

    </div>

    <div class="salary-section">

      <div class="salary-heading">
        Salary Statement
      </div>

      <div class="salary-header">
        <div>Description</div>
        <div class="amount">Amount (INR)</div>
      </div>

      <div class="salary-row">
        <div>Basic Salary</div>
        <div class="amount">${data.basicSalary}</div>
      </div>

      <div class="salary-row">
        <div>House Rent Allowance (HRA)</div>
        <div class="amount">${data.hra}</div>
      </div>

      <div class="salary-row">
        <div>Other Allowances</div>
        <div class="amount">${data.allowances}</div>
      </div>

      <div class="salary-row gross-row">
        <div>Gross Earnings</div>
        <div class="amount">${data.grossSalary}</div>
      </div>

      <div class="salary-row">
        <div>Total Deductions</div>
        <div class="amount">- ${data.deductions}</div>
      </div>

    </div>

    <div class="net-pay">
      <div class="net-label">
        NET SALARY
      </div>

      <div class="net-value">
        INR ${data.netSalary}
      </div>
    </div>

    <div class="bottom-section">

      <div class="verification">

        <img
          class="qr"
          src="${data.qrDataUrl}"
          alt="Verification QR"
        />

        <div>
          <div class="verification-title">
            DOCUMENT AUTHENTICITY
          </div>

          <div class="verification-text">
            Scan this QR code to verify this payslip
            through VeriStaff.
          </div>

          <div class="verification-url">
            ${escapeHtml(data.verificationUrl)}
          </div>
        </div>

      </div>

      <div class="signature-box">

        ${signature}

        <div class="signature-line">
          Authorized Signatory
        </div>

      </div>

    </div>

  </div>

  <div class="footer">

    <strong>${companyName}</strong>

    ${
      data.footerAddress
        ? ` | ${escapeHtml(data.footerAddress)}`
        : ""
    }

    <br />

    This is a digitally generated and verifiable payslip.

  </div>

</div>

</body>
</html>
`;
};