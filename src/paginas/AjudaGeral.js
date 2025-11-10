import React, { useState } from 'react';
import './AjudaGeral.css';
import Modal from '../componentes/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

function AjudaGeral() {
const [isAjudaOpen, setIsAjudaOpen] = useState(false);

  return (
    <div className="ajuda-container">

      <h2>Ajuda Geral - Fluxo do Sistema</h2>

      <div className="ajuda-section">
        <h3>Visão Geral</h3>
        <p>
        Bem-vindo à ajuda do DrGus. Este sistema foi projetado para gerenciar o fluxo completo de um consultório odontológico,
        desde o cadastro do paciente até a finalização de um tratamento e seu respectivo pagamento.
        </p>
        <p>Abaixo está um resumo do que cada módulo principal faz.</p>
      </div>

      <div className="ajuda-section">
        <h3>Início</h3>
        <p>
        Esta é a sua tela principal. Ela serve como um resumo rápido das atividades mais importantes do dia:
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><b>Consultas do Dia:</b> Lista os agendamentos marcados para hoje.</li>
          <li><b>Pagamentos do Mês:</b> Mostra um resumo financeiro das parcelas que vencem no mês atual (previsto, pendente, vencido).</li>
          <li><b>Notificações:</b> Exibe os 4 alertas mais recentes sobre pendências (consultas, parcelas, orçamentos antigos).</li>
          <li><b>Acessos Rápidos:</b> Atalhos para as ações mais comuns, como cadastrar um novo paciente ou orçamento.</li>
        </ul>
      </div>

      <div className="ajuda-section">
        <h3>Pacientes (Cadastro e Histórico)</h3>
        <p>
        Este módulo é o coração do sistema, onde você gerencia as informações dos seus pacientes.
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><b>Listar Pacientes:</b> A tela principal lista todos os pacientes. Você pode buscar por nome/CPF e editar ou excluir um cadastro.</li>
          <li><b>Novo Paciente:</b> O botão "Novo Paciente" inicia um formulário de 4 etapas para cadastrar dados pessoais e a ficha de anamnese.</li>
          <li><b>Detalhes do Paciente:</b> Clicar no nome de um paciente leva à tela de detalhes, onde você pode ver:
        <ul style={{ paddingLeft: '20px', lineHeight: '1.4' }}>
          <li>Os dados cadastrais completos.</li>
          <li>A ficha de anamnese preenchida.</li>
          <li>O histórico de todos os Orçamentos e Tratamentos daquele paciente.</li>
        </ul>
          </li>
          <li><b>Fluxo de Tratamento:</b> É na tela de Detalhes do Paciente que você "Aprova" um orçamento, "Inicia" um tratamento e "Encerra" um tratamento.</li>
        </ul>
      </div>

      <div className="ajuda-section">
        <h3>Agenda</h3>
        <p>
        O módulo de Agenda é a sua ferramenta central para gerenciar todos os horários.
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>Visões (Mês, Semana, Dia):</strong> Você pode alternar entre as visualizações para ter uma visão macro (mês) ou micro (dia/semana) dos seus horários.
          </li>
          <li>
            <strong>Agendar:</strong> Clique em um horário vago (na visão de Semana ou Dia) ou em um dia livre (na visão de Mês) para abrir o formulário de "Nova Consulta".
          </li>
          <li>
            <strong>Bloqueios:</strong> O sistema automaticamente impede agendamentos em dias que já passaram e em Sábados ou Domingos (marcados como "Fechado").
          </li>
          <li>
            <strong>Paciente Não Cadastrado:</strong> Ao criar uma nova consulta, você pode usar o link "(Paciente não cadastrado)" para agendar rapidamente digitando apenas o nome, sem precisar fazer o cadastro completo.
          </li>
          <li>
            <strong>Detalhes da Consulta:</strong> Clicar em um agendamento já existente permite alterar o status (ex: de "Pendente" para "Confirmado"), reagendar ou excluir a consulta.
          </li>
        </ul>
      </div>

      <div className="ajuda-section">
        <h3>Orçamentos</h3>
        <p>
        Esta tela é focada na <b>criação</b> de um novo orçamento. O fluxo é:
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Selecionar o Paciente e a Data.</li>
          <li>Selecionar o Procedimento (ex: Restauração).</li>
          <li>Clicar no Odontograma (dente e faces), se o procedimento exigir.</li>
          <li>Adicionar o procedimento à lista.</li>
          <li>Definir o número de parcelas (opcional).</li>
          <li>Salvar o orçamento, que aparecerá no Histórico do paciente.</li>
        </ul>
      </div>

      <div className="ajuda-section">
        <h3>Tratamentos (Controle e Evolução)</h3>
        <p>
        O módulo de Tratamentos gerencia a execução dos planos que foram aprovados nos Orçamentos.
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <b>Criação:</b> Um tratamento é criado automaticamente após a aprovação de um orçamento.
          </li>
          <li>
            <b>Status:</b> Use os botões <b>Iniciar</b> e <b>Encerrar</b> para marcar o ciclo de vida do tratamento.
          </li>
          <li>
            <b>Evolução dos Itens:</b> A lista de tratamentos deve permitir que você marque cada procedimento individual (item) como Realizado conforme as sessões avançam.
          </li>
        </ul>
      </div>

      <div className="ajuda-section">
        <h3>Procedimentos (Serviços e Preços)</h3>
        <p>
        Esta é a área de Administração de Serviços. Ela permite que o consultório mantenha a lista de procedimentos, seus valores e regras atualizada de forma autônoma.
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <b>Adicionar/Editar:</b> Use o formulário e a tabela para cadastrar e modificar procedimentos, seus valores de referência e as regras de marcação (exige Dente/Face).
          </li>
          <li>
            <b>Regras:</b> A tabela mostra se um procedimento <b>exige</b> a marcação de Dente e/ou Face no Odontograma (usado na criação de Orçamentos).
          </li>
          <li>
            <b>Excluir:</b> Um procedimento <b>só pode ser excluído</b> se ele não estiver vinculado a nenhum orçamento existente.
          </li>
        </ul>
      </div>

      <div className="ajuda-section">
        <h3>Pagamentos</h3>
        <p>
        Esta tela é o seu controle financeiro.
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><b>Visão Geral (Padrão):</b> Ao abrir a tela, ela já mostra uma lista de todas as parcelas "Pendentes" e "Atrasadas" de <b>todos</b> os pacientes, permitindo uma visão rápida de quem está devendo.</li>
          <li><b>Filtrar por Paciente:</b> Você pode usar o seletor (opcional) para focar em um único paciente. Isso habilitará a aba "Histórico (Pagos)".</li>
          <li><b>Aba Histórico (Pagos):</b> Mostra todas as parcelas que já foram quitadas <b>apenas</b> pelo paciente que você selecionou no filtro.</li>
        </ul>
      </div>

      <div className="ajuda-section">
        <h3>Notificações</h3>
        <p>
        Esta tela é sua caixa de entrada de alertas. O sistema gera notificações automaticamente para:
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Consultas pendentes (no dia e na véspera).</li>
          <li>Parcelas pendentes (no dia e na véspera).</li>
          <li>Parcelas já atrasadas (resumo diário).</li>
          <li>Orçamentos aguardando aprovação há mais de 7 dias.</li>
        </ul>
        <p>Clicar em "OK" remove a notificação da lista.</p>
      </div>

      {/*Botão Flutuante de Ajuda*/}
      <button 
        className="floating-help-button" 
        onClick={() => setIsAjudaOpen(true)}
        title="Ajuda sobre esta página"
      >
        <FontAwesomeIcon icon={faQuestionCircle} />
      </button>

      {/*Modal de Ajuda*/}
      <Modal
      isOpen={isAjudaOpen}
      onClose={() => setIsAjudaOpen(false)}
      titulo="Ajuda - Ajuda Geral"
      footer={
      <button 
      className="modal-button modal-button-secondary" 
      onClick={() => setIsAjudaOpen(false)}
      title="Fechar esta janela."
      >
        Fechar
      </button>
      }
      >
      <p>Esta é a página de Ajuda Geral. Ela contém um resumo de todas as funcionalidades principais do sistema.</p>
      </Modal>

    </div>
  );
}

export default AjudaGeral;