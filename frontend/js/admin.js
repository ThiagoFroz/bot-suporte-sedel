window.addEventListener('load', carregarDashboard);

async function carregarDashboard() {
  const tbody = document.getElementById('chamadosTabela');

  try {
    const dados = await api.get('/api/admin/dashboard');
    const niveis = Object.keys(dados.resumo.porNivel || {});

    document.getElementById('totalChamados').textContent = dados.resumo.total;
    document.getElementById('pendentesChamados').textContent = dados.resumo.pendentes;
    document.getElementById('niveisChamados').textContent = niveis.length;

    if (!dados.chamados.length) {
      tbody.innerHTML = '<tr><td colspan="7">Nenhum chamado registrado.</td></tr>';
      return;
    }

    tbody.innerHTML = dados.chamados.map((chamado) => `
      <tr>
        <td>${escapeHtml(chamado.numero || '')}</td>
        <td>${escapeHtml(chamado.solicitante || '')}</td>
        <td>${escapeHtml(chamado.setor || '')}</td>
        <td>${escapeHtml(chamado.nivel || '')}</td>
        <td>${escapeHtml(chamado.status || '')}</td>
        <td>${escapeHtml(chamado.data_abertura || '')}</td>
        <td>${escapeHtml(chamado.descricao || '')}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7">Nao foi possivel carregar os chamados.</td></tr>';
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
