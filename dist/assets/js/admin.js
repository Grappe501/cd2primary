
// Overlay 29: Audit Renderer Alignment

async function loadAudit(teamId, submissionId) {
  const res = await fetch(`/api/admin-audit-list?teamId=${teamId}&submissionId=${submissionId}`);
  const data = await res.json();
  const audits = data?.data?.audits || [];

  const container = document.getElementById("auditContainer");
  container.innerHTML = "";

  audits.forEach(a => {
    const div = document.createElement("div");
    div.className = "audit-entry";
    div.innerHTML = `
      <strong>${a.action}</strong><br/>
      Reviewed At: ${a.reviewedAt}<br/>
      Reviewed By: ${a.reviewedBy}
    `;
    container.appendChild(div);
  });
}
