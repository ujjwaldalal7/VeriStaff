interface ExperienceLetterTemplateData {
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

  joiningDate: string;
  lastWorkingDay: string;

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

export const experienceLetterTemplate = (
  data: ExperienceLetterTemplateData
): string => {
  const companyName = escapeHtml(data.companyName);
  const employeeName = escapeHtml(data.employeeName);
  const employeeCode = escapeHtml(data.employeeCode);
  const designation = escapeHtml(data.designation);
  const department = escapeHtml(data.department);
  const documentNumber = escapeHtml(data.documentNumber);
  const issueDate = escapeHtml(data.issueDate);
  const joiningDate = escapeHtml(data.joiningDate);
  const lastWorkingDay = escapeHtml(data.lastWorkingDay);

  const logoSection = data.logoUrl
    ? `
      <img
        src="${data.logoUrl}"
        class="company-logo"
        alt="${companyName} logo"
      />
    `
    : `
      <div class="company-logo-placeholder">
        ${companyName.charAt(0).toUpperCase()}
      </div>
    `;

  const signatureSection = data.authorizedSignUrl
    ? `
      <img
        src="${data.authorizedSignUrl}"
        class="signature-image"
        alt="Authorized Signature"
      />
    `
    : `
      <div class="signature-space"></div>
    `;

  const watermarkSection = data.watermarkUrl
    ? `
      <div
        class="watermark"
        style="background-image: url('${data.watermarkUrl}');"
      ></div>
    `
    : "";

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

    html,
    body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      background: #ffffff;
    }

    body {
      font-family:
        Arial,
        Helvetica,
        sans-serif;

      color: #1f2937;
    }

    /*
     * EXACT A4 PAGE
     */

    .page {
      width: 210mm;
      height: 297mm;

      position: relative;

      overflow: hidden;

      background: #ffffff;

      padding:
        14mm
        16mm
        19mm
        16mm;
    }

    /*
     * WATERMARK
     */

    .watermark {
      position: absolute;

      top: 50%;
      left: 50%;

      width: 115mm;
      height: 115mm;

      transform:
        translate(-50%, -50%);

      background-position: center;
      background-repeat: no-repeat;
      background-size: contain;

      opacity: 0.045;

      z-index: 0;
    }

    /*
     * CONTENT
     */

    .content-wrapper {
      position: relative;
      z-index: 1;
    }

    /*
     * TOP BRAND BAR
     */

    .top-bar {
      height: 4px;

      background:
        linear-gradient(
          90deg,
          ${data.primaryColor},
          ${data.secondaryColor}
        );

      margin:
        -14mm
        -16mm
        9mm
        -16mm;
    }

    /*
     * HEADER
     */

    .header {
      display: flex;

      align-items: center;

      justify-content: space-between;

      padding-bottom: 9px;

      border-bottom:
        1px solid
        ${data.secondaryColor};
    }

    .company-section {
      display: flex;

      align-items: center;

      gap: 10px;
    }

    .company-logo {
      width: 48px;
      height: 48px;

      object-fit: contain;
    }

    .company-logo-placeholder {
      width: 48px;
      height: 48px;

      display: flex;

      align-items: center;
      justify-content: center;

      border-radius: 6px;

      background:
        ${data.primaryColor};

      color: white;

      font-size: 22px;

      font-weight: bold;
    }

    .company-name {
      font-size: 18px;

      font-weight: 700;

      color:
        ${data.primaryColor};

      max-width: 330px;
    }

    .document-meta {
      text-align: right;

      font-size: 8px;

      line-height: 1.5;

      color: #6b7280;
    }

    .document-number {
      font-weight: 700;

      color: #374151;
    }

    /*
     * TITLE
     */

    .title-section {
      text-align: center;

      margin-top: 18px;

      margin-bottom: 18px;
    }

    .title {
      margin: 0;

      font-size: 21px;

      letter-spacing: 1.2px;

      color:
        ${data.primaryColor};

      font-weight: 700;
    }

    .title-line {
      width: 55px;

      height: 2px;

      margin:
        7px
        auto
        0;

      background:
        ${data.secondaryColor};
    }

    /*
     * BODY
     */

    .body {
      font-size: 11.5px;

      line-height: 1.65;

      text-align: justify;
    }

    .body p {
      margin:
        0
        0
        11px;
    }

    .greeting {
      font-weight: 600;
    }

    /*
     * EMPLOYEE DETAILS
     */

    .details-card {
      margin:
        15px
        0;

      border:
        1px solid
        #e5e7eb;

      border-left:
        4px solid
        ${data.primaryColor};

      border-radius: 4px;

      padding:
        12px
        15px;

      background:
        #f8fafc;
    }

    .details-title {
      margin-bottom: 9px;

      font-size: 10px;

      font-weight: 700;

      text-transform: uppercase;

      letter-spacing: 0.7px;

      color:
        ${data.primaryColor};
    }

    .details-grid {
      display: grid;

      grid-template-columns:
        1fr 1fr;

      column-gap: 30px;

      row-gap: 7px;
    }

    .detail-item {
      display: flex;

      flex-direction: column;

      gap: 1px;
    }

    .detail-label {
      font-size: 7.5px;

      text-transform: uppercase;

      letter-spacing: 0.4px;

      color: #6b7280;
    }

    .detail-value {
      font-size: 10px;

      font-weight: 600;

      color: #111827;
    }

    /*
     * VERIFICATION
     */

    .verification-card {
      display: flex;

      align-items: center;

      gap: 14px;

      margin-top: 15px;

      padding: 10px;

      border:
        1px solid
        ${data.secondaryColor};

      border-radius: 5px;

      background:
        rgba(248, 250, 252, 0.95);
    }

    .qr-code {
      width: 72px;
      height: 72px;

      flex-shrink: 0;
    }

    .verification-content {
      flex: 1;
    }

    .verification-title {
      font-size: 9px;

      font-weight: 700;

      color:
        ${data.primaryColor};

      margin-bottom: 3px;
    }

    .verification-text {
      font-size: 8px;

      line-height: 1.4;

      color: #4b5563;
    }

    .verification-url {
      margin-top: 4px;

      font-size: 6.5px;

      line-height: 1.2;

      word-break: break-all;

      color: #6b7280;
    }

    /*
     * SIGNATURE
     */

    .signature-section {
      margin-top: 14px;

      display: flex;

      justify-content: flex-end;
    }

    .signature-box {
      width: 155px;

      text-align: center;
    }

    .signature-image {
      width: 125px;

      height: 38px;

      object-fit: contain;

      margin-bottom: 2px;
    }

    .signature-space {
      height: 38px;
    }

    .signature-line {
      border-top:
        1px solid
        #374151;

      padding-top: 4px;

      font-size: 8px;

      font-weight: 600;
    }

    .signature-subtitle {
      margin-top: 2px;

      font-size: 7px;

      color: #6b7280;
    }

    /*
     * FOOTER
     */

    .footer {
      position: absolute;

      bottom: 7mm;

      left: 16mm;

      right: 16mm;

      padding-top: 5px;

      border-top:
        1px solid
        #e5e7eb;

      text-align: center;

      font-size: 6.5px;

      line-height: 1.4;

      color: #6b7280;

      z-index: 2;
    }

    .footer-brand {
      color:
        ${data.primaryColor};

      font-weight: 700;
    }

  </style>

</head>

<body>

  <div class="page">

    ${watermarkSection}

    <div class="content-wrapper">

      <div class="top-bar"></div>

      <!-- HEADER -->

      <div class="header">

        <div class="company-section">

          ${logoSection}

          <div class="company-name">
            ${companyName}
          </div>

        </div>

        <div class="document-meta">

          <div>
            Issue Date: ${issueDate}
          </div>

          <div class="document-number">
            ${documentNumber}
          </div>

        </div>

      </div>

      <!-- TITLE -->

      <div class="title-section">

        <h1 class="title">
          EXPERIENCE CERTIFICATE
        </h1>

        <div class="title-line"></div>

      </div>

      <!-- BODY -->

      <div class="body">

        <p class="greeting">
          To Whom It May Concern,
        </p>

        <p>
          This is to certify that
          <strong>${employeeName}</strong>,
          Employee ID
          <strong>${employeeCode}</strong>,
          was employed with
          <strong>${companyName}</strong>
          as a
          <strong>${designation}</strong>
          in the
          <strong>${department}</strong>
          department.
        </p>

        <!-- EMPLOYEE DETAILS -->

        <div class="details-card">

          <div class="details-title">
            Employment Details
          </div>

          <div class="details-grid">

            <div class="detail-item">
              <div class="detail-label">
                Employee Name
              </div>

              <div class="detail-value">
                ${employeeName}
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                Employee ID
              </div>

              <div class="detail-value">
                ${employeeCode}
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                Designation
              </div>

              <div class="detail-value">
                ${designation}
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                Department
              </div>

              <div class="detail-value">
                ${department}
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                Date of Joining
              </div>

              <div class="detail-value">
                ${joiningDate}
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-label">
                Last Working Day
              </div>

              <div class="detail-value">
                ${lastWorkingDay}
              </div>
            </div>

          </div>

        </div>

        <p>
          During the period of employment,
          ${employeeName} performed the assigned
          responsibilities and duties to the satisfaction
          of the organization.
        </p>

        <p>
          We appreciate the contributions made during the
          tenure and wish ${employeeName} success in all
          future endeavors.
        </p>

        <p>
          This certificate has been digitally generated by
          VeriStaff and can be independently verified using
          the QR code provided below.
        </p>

        <!-- VERIFICATION -->

        <div class="verification-card">

          <img
            class="qr-code"
            src="${data.qrDataUrl}"
            alt="Document Verification QR Code"
          />

          <div class="verification-content">

            <div class="verification-title">
              DOCUMENT AUTHENTICITY
            </div>

            <div class="verification-text">
              Scan the QR code to independently verify
              the authenticity of this document through
              VeriStaff.
            </div>

            <div class="verification-url">
              ${escapeHtml(data.verificationUrl)}
            </div>

          </div>

        </div>

        <!-- SIGNATURE -->

        <div class="signature-section">

          <div class="signature-box">

            ${signatureSection}

            <div class="signature-line">
              Authorized Signatory
            </div>

            <div class="signature-subtitle">
              ${companyName}
            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- FOOTER -->

    <div class="footer">

      <span class="footer-brand">
        ${companyName}
      </span>

      ${
        data.footerAddress
          ? ` | ${escapeHtml(data.footerAddress)}`
          : ""
      }

      <br />

      Digitally generated and verifiable through VeriStaff.

    </div>

  </div>

</body>
</html>
`;
};