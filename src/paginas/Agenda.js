import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './Agenda.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import {
  format, parseISO, isSameDay, startOfDay, isBefore, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, isToday, getDay
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Modal from '../componentes/Modal';
import Select from 'react-select';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = 'http://localhost:8000'; 
const getNomeConsulta = (consulta, pacientes = []) => {
  if (consulta.paciente && typeof consulta.paciente === 'object' && consulta.paciente.nome) {
    return consulta.paciente.nome;
  }
  if (typeof consulta.paciente === 'number') {
    const pacienteObj = pacientes.find(p => p.id_paciente === consulta.paciente); 
    if (pacienteObj) return pacienteObj.nome;
  }
  if (consulta.nome_paciente_temp) {
    return `${consulta.nome_paciente_temp} (Não Cad.)`;
  }
  return 'Paciente Indefinido';
};


const capitalize = (s) => {
  if (typeof s !== 'string') return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getDayName = (dayIndex) => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayIndex];
};

const getWeekDays = (date) => {
  const weekStartsOn = 1;
  const start = startOfWeek(date, { weekStartsOn, locale: ptBR });
  const weekDays = eachDayOfInterval({
    start: start,
    end: endOfWeek(date, { weekStartsOn, locale: ptBR })
  });
  return weekDays;
};

const horariosExcluidos = ['11:30', '12:00', '12:30', '13:00'];
const horarios = Array.from({ length: 20 }, (_, i) => {
  const hora = 8 + Math.floor(i / 2);
  const minuto = i % 2 === 0 ? '00' : '30';
  return `${hora.toString().padStart(2, '0')}:${minuto}`;
}).filter(horario => {
  return !horariosExcluidos.includes(horario);
});

const getDaysInMonthGrid = (date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startDate = startOfWeek(start, { weekStartsOn: 0, locale: ptBR });
  const endDate = endOfWeek(end, { weekStartsOn: 0, locale: ptBR });
  return eachDayOfInterval({ start: startDate, end: endDate });
};

function Agenda() {
  const { showToast } = useToast();
  const [agendamentos, setAgendamentos] = useState([]);
  const [view, setView] = useState('semanal');
  const [dataAtual, setDataAtual] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isUnregisteredPatient, setIsUnregisteredPatient] = useState(false);
  const [unregisteredPatientName, setUnregisteredPatientName] = useState("");
  const [novoAgendamento, setNovoAgendamento] = useState({
    paciente: "",
    data_consulta: "",
    horario_consulta: "",
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [isPacientesLoading, setIsPacientesLoading] = useState(false);
  const navigate = useNavigate();
  const [modalView, setModalView] = useState('details');
  const [isAjudaOpen, setIsAjudaOpen] = useState(false);
  
  const minDate = format(new Date(), 'yyyy-MM-dd');
  const todayStartOfDay = startOfDay(new Date());

  const toggleUnregistered = () => {
    setIsUnregisteredPatient(prev => !prev);
    setUnregisteredPatientName("");
    setNovoAgendamento(prev => ({ ...prev, paciente: "" }));
  };

  const fetchAgendamentos = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token de autenticação não encontrado.');
      const response = await axios.get(`${API_BASE_URL}/api/agendamentos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let agendamentosData = response.data.results || response.data || [];
      if (!Array.isArray(agendamentosData)) {
        console.error("API não retornou um array:", agendamentosData);
        agendamentosData = [];
        setError('Formato de dados inesperado da API.');
      }
      setAgendamentos(agendamentosData);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.error('Sua sessão expirou. Redirecionando para login.');
        navigate('/login');
      } else {
        setError('Não foi possível carregar os agendamentos.');
        console.error('Erro ao buscar agendamentos:', err);
      }
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    const initData = async () => {
      await Promise.all([
        fetchAgendamentos(),
      ]);
      setLoading(false);
    };
    initData();
  }, [fetchAgendamentos]);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const buscarPacientesDoModal = async () => {
      console.log("MODAL DEBUG: 1. Modal abriu, buscando pacientes...");
      setIsPacientesLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Token de autenticação não encontrado.');

        // Busca na rota /api/pacientes/ (que envia 'id_paciente')
        const response = await axios.get(`${API_BASE_URL}/api/pacientes/`, { 
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("MODAL DEBUG: 2. API respondeu:", response.data);

        const dadosBrutos = response.data.results || response.data || []; 

        if (Array.isArray(dadosBrutos)) {
          setPacientes(dadosBrutos); 
          console.log("MODAL DEBUG: 3. Dados salvos no estado.");
        } else {
          console.error("MODAL DEBUG: ERRO! A API não retornou um array.");
          setPacientes([]);
        }

      } catch (err) { 
        console.error('MODAL DEBUG: ERRO! A requisição falhou:', err.response || err.message);
        setError("Falha ao carregar pacientes. Verifique o console.");
      } finally {
        console.log("MODAL DEBUG: 4. Finalizando, desligando 'Buscando...'.");
        setIsPacientesLoading(false);
      }
    };

    buscarPacientesDoModal();

  }, [showForm]);

  const opcoesPacientes = useMemo(() => {
    return pacientes.map(p => ({
      value: p.id_paciente, 
      label: p.nome
    }));
  }, [pacientes]);

  const handleNavegacao = (diasOuMeses) => {
    let novaData = new Date(dataAtual);
    if (view === 'mensal') {
      novaData = diasOuMeses > 0 ? addMonths(dataAtual, 1) : subMonths(dataAtual, 1);
    } else if (view === 'semanal') {
      novaData.setDate(dataAtual.getDate() + diasOuMeses);
    } else {
      novaData.setDate(dataAtual.getDate() + (diasOuMeses > 0 ? 1 : -1));
    }
    setDataAtual(novaData);
  };

  const isPrevDisabled = () => {
    const today = startOfDay(new Date());
    if (view === 'mensal') {
      return isBefore(startOfMonth(subMonths(dataAtual, 1)), startOfMonth(today));
    } else if (view === 'semanal') {
      return isBefore(startOfDay(subDays(dataAtual, 7)), today);
    } else {
      return isBefore(startOfDay(subDays(dataAtual, 1)), today);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoAgendamento(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmitAgendamento = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      showToast("Erro: ID do usuário não encontrado. Faça login novamente.");
      return;
    }

    let agendamentoData = {
      data_consulta: novoAgendamento.data_consulta,
      horario_consulta: novoAgendamento.horario_consulta,
      observacoes: novoAgendamento.observacoes || null,
      usuario: parseInt(userId),
    };

    if (isUnregisteredPatient) {
      if (!unregisteredPatientName.trim()) {
        showToast('Por favor, insira o nome do paciente não cadastrado.');
        return;
      }
      agendamentoData.nome_paciente_temp = unregisteredPatientName.trim();
      agendamentoData.paciente = null;
    } else {
      if (!novoAgendamento.paciente) {
        showToast('Por favor, selecione um paciente cadastrado.');
        return;
      }
      agendamentoData.paciente = parseInt(novoAgendamento.paciente);
      agendamentoData.nome_paciente_temp = null;
    }
    
    const dataConsulta = parseISO(novoAgendamento.data_consulta);
    if (getDay(dataConsulta) === 0 || getDay(dataConsulta) === 6) { 
      showToast('Não é possível agendar consultas aos Sábados ou Domingos.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/api/agendamentos/`, agendamentoData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showToast('Consulta agendada com sucesso!');
      setIsUnregisteredPatient(false);
      setUnregisteredPatientName("");
      setShowForm(false);
      fetchAgendamentos();
    } catch (err) {
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (err.response && err.response.data) {
        const responseData = err.response.data;
        if (responseData.non_field_errors) {
          errorMessage = responseData.non_field_errors.join(' ');
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (typeof responseData === 'object') {
          const firstKey = Object.keys(responseData)[0];
          errorMessage = Array.isArray(responseData[firstKey]) ? `${firstKey}: ${responseData[firstKey].join(' ')}` : `${firstKey}: ${responseData[firstKey]}`;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else {
        errorMessage = err.message;
      }
      showToast(`Erro ao criar agendamento: ${errorMessage}`);
    }
  };


  const weekDays = useMemo(() => getWeekDays(dataAtual), [dataAtual]);
  const monthDays = useMemo(() => getDaysInMonthGrid(dataAtual), [dataAtual]);

  const handleAppointmentClick = (agendamento) => {
    const paciente = pacientes.find(p => p.id_paciente === agendamento.paciente);
    setSelectedAgendamento(agendamento);
    setSelectedPaciente(paciente);
    setNewStatus(agendamento.status || 'pendente');
    setModalView('details');
    setShowDetailModal(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedAgendamento || !newStatus) return;
    try {
      const token = localStorage.getItem('access_token');
      const agendamentoId = selectedAgendamento.id_consulta;
      const response = await axios.patch(
        `${API_BASE_URL}/api/agendamentos/${agendamentoId}/`,
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setAgendamentos(prevAgendamentos =>
        prevAgendamentos.map(ag =>
          ag.id_consulta === agendamentoId ? response.data : ag
        )
      );
      setShowDetailModal(false);
      setSelectedAgendamento(null);
      setSelectedPaciente(null);
    } catch (err) {
      console.error("Erro ao atualizar o status:", err.response?.data || err.message);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAgendamento) return;
    try {
      const token = localStorage.getItem('access_token');
      const agendamentoId = selectedAgendamento.id_consulta;
      await axios.delete(
        `${API_BASE_URL}/api/agendamentos/${agendamentoId}/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setAgendamentos(prevAgendamentos =>
        prevAgendamentos.filter(ag => ag.id_consulta !== agendamentoId)
      );
      setShowDetailModal(false);
      setSelectedAgendamento(null);
      setSelectedPaciente(null);
    } catch (err) {
      console.error("Erro ao excluir a consulta:", err.response?.data || err.message);
    }
  };

  const handleCellClick = (day, hora) => {
    const [slotHour, slotMinute] = hora.split(':').map(Number);
    const slotTime = new Date(day);
    slotTime.setHours(slotHour, slotMinute, 0, 0);
    const now = new Date();
    
    if (getDay(day) === 0 || getDay(day) === 6) {
      return; 
    }
    if (isBefore(slotTime, now)) {
      return; 
    }

    const dataFormatada = format(day, 'yyyy-MM-dd');
    const horaFormatada = hora.substring(0, 5);
    setNovoAgendamento(prevState => ({
      ...prevState,
      data_consulta: dataFormatada,
      horario_consulta: horaFormatada,
      paciente: "",
    }));
    setShowForm(true);
  };

  const renderHeaders = () => {
    if (view === 'semanal') {
      return weekDays.map(day => (
        <th key={day.toISOString()}>
          <div>{capitalize(getDayName(getDay(day)))}</div>
          <div className="day-number">{format(day, 'dd', { locale: ptBR })}</div>
        </th>
      ));
    } else {
      const dayToShow = dataAtual;
      return (
        <th key={dayToShow.toISOString()}>
          <div>{capitalize(getDayName(getDay(dayToShow)))}</div>
          <div className="day-number">{format(dayToShow, 'dd', { locale: ptBR })}</div>
        </th>
      );
    }
  };

  const renderCells = (hora) => {
    const daysToRender = view === 'semanal' ? weekDays : [dataAtual];
    const [slotHour, slotMinute] = hora.split(':').map(Number);
    const now = new Date();

    return daysToRender.map(day => {
      const slotStart = new Date(day);
      slotStart.setHours(slotHour, slotMinute, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + 30);
      
      const agendamento = agendamentos.find(ag => {
        try {
          const agendamentoDate = parseISO(ag.data_consulta);
          const [agHour, agMinute] = ag.horario_consulta.split(':').map(Number);
          const agendamentoTime = new Date(agendamentoDate);
          agendamentoTime.setHours(agHour, agMinute, 0, 0);
          return isSameDay(agendamentoDate, day) &&
            agendamentoTime >= slotStart &&
            agendamentoTime < slotEnd;
        } catch (e) {
          console.error("Erro ao processar data/hora do agendamento:", ag, e);
          return false;
        }
      });

      const isPastSlot = isBefore(slotStart, now);
      const isSunday = getDay(day) === 0;
      const isSaturday = getDay(day) === 6;
      const isClickable = !agendamento && !isPastSlot && !isSunday && !isSaturday;

      return (
        <td
          key={`${day.toISOString()}-${hora}`}
          onClick={isClickable ? () => handleCellClick(day, hora) : null}
          className={
            !agendamento
              ? (isPastSlot || isSunday || isSaturday ? 'cell-past' : 'cell-empty')
              : 'cell-filled'
          }
        >
          {agendamento && (
            <div
              className={`appointment-cell status-${agendamento.status || 'pendente'}`}
              onClick={(e) => { e.stopPropagation(); handleAppointmentClick(agendamento); }}
              title={`Clique para ver detalhes de: ${getNomeConsulta(agendamento, pacientes)}`}
            >
              {agendamento.horario_consulta.substring(0, 5)} -
              {getNomeConsulta(agendamento, pacientes)}
            </div>
          )}
          {!agendamento && (isSunday || isSaturday) && <div className="cell-closed-text">Fechado</div>}
          {!agendamento && isPastSlot && !isSunday && !isSaturday && <div className="cell-past-text">Encerrado</div>}
        </td>
      );
    });
  };

  const renderMonthlyView = () => {
    const appointmentsByDay = agendamentos.reduce((acc, ag) => {
      const dateKey = format(parseISO(ag.data_consulta), 'yyyy-MM-dd');
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {});
    const startOfCurrentMonth = startOfMonth(dataAtual);
    const endOfCurrentMonth = endOfMonth(dataAtual);
    const weekDaysNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="monthly-grid-wrapper">
        <div className="month-header-row">
          {weekDaysNames.map(day => (
            <div key={day} className="month-day-name">{capitalize(day)}</div>
          ))}
        </div>
        <div className="month-days-grid">
          {monthDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = day >= startOfCurrentMonth && day <= endOfCurrentMonth;
            const isPastDay = isBefore(startOfDay(day), todayStartOfDay);
            const isTodayMark = isToday(day);
            const appointmentCount = appointmentsByDay[dateKey] || 0;
            let dayClasses = 'month-day-cell';
            if (!isCurrentMonth) dayClasses += ' outside-month';
            if (isPastDay) dayClasses += ' cell-past-monthly';
            if (isTodayMark) dayClasses += ' is-today';
            
            const isSunday = getDay(day) === 0;
            const isSaturday = getDay(day) === 6;
            const isClickable = isCurrentMonth && !isPastDay && !isSunday && !isSaturday;
            
            return (
              <div
                key={dateKey}
                className={dayClasses}
                onClick={() => {
                  if (isClickable) {
                    setDataAtual(day);
                    setView('diaria');
                  }
                }}
                title={isClickable ? "Ver detalhes do dia" : (isSunday || isSaturday ? "Fechado" : "Dia passado")}
              >
                <div className="day-number-monthly">{format(day, 'd')}</div>
                {isCurrentMonth && (
                  <div className="monthly-status-footer">
                    {appointmentCount > 0 ? (
                      <div className="appointment-count">
                        {appointmentCount} {appointmentCount === 1 ? 'consulta' : 'consultas'}
                      </div>
                    ) : (
                      isSunday || isSaturday ? (
                        <div className="cell-closed-text">Fechado</div>
                      ) : isPastDay ? (
                        <div className="cell-past-text">Encerrado</div>
                      ) : (
                        <div className="no-appointment-label">Livre</div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatAndCapitalizeHeader = (date, view) => {
    if (view === 'semanal') {
      const weekStartsOn = 1;
      const start = startOfWeek(date, { weekStartsOn, locale: ptBR });
      const end = endOfWeek(date, { weekStartsOn, locale: ptBR });
      const startDateFormatted = format(start, 'dd/MM');
      const endDateFormatted = format(end, 'dd/MM');
      return `${startDateFormatted} - ${endDateFormatted}`;
    }
    const fullHeaderDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    return capitalize(fullHeaderDate);
  };

  if (loading) return <div className="loading-message">Carregando agenda...</div>;
  
  return (
    <div className="agenda-container">
      <div className="agenda-header-content">
        <div className="date-navigation">
          <button
            className="nav-button"
            onClick={() => handleNavegacao(view === 'semanal' ? -7 : (view === 'mensal' ? -1 : -1))}
            disabled={isPrevDisabled()}
            title={view === 'mensal' ? "Mês anterior" : (view === 'semanal' ? "Semana anterior" : "Dia anterior")}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="current-display-date">
            {view === 'mensal'
              ? capitalize(format(dataAtual, 'MMMM yyyy', { locale: ptBR }))
              : formatAndCapitalizeHeader(dataAtual, view)}
          </span>
          <button 
            className="nav-button" 
            onClick={() => handleNavegacao(view === 'semanal' ? 7 : (view === 'mensal' ? 1 : 1))}
            title={view === 'mensal' ? "Próximo mês" : (view === 'semanal' ? "Próxima semana" : "Próximo dia")}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        <button 
          className="novo-agendamento-button" 
          onClick={() => setShowForm(true)}
          title="Adicionar uma nova consulta na agenda"
        >
          <FontAwesomeIcon icon={faPlus} /> Nova consulta
        </button>
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="nova-consulta-card" onClick={(e) => e.stopPropagation()}>
            <h3>Nova Consulta</h3>
            <form onSubmit={handleSubmitAgendamento} className="nova-consulta-form">
              <div className="form-group-compact">
                <div className="form-label-with-action" style={{ display: 'block' }}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={toggleUnregistered}
                    title={isUnregisteredPatient ? "Selecionar Paciente Cadastrado" : "Habilitar nome manual"}
                    style={{ paddingLeft: '0', textDecoration: 'underline', marginTop: '2px' }} 
                  >
                    {isUnregisteredPatient ? '<< Usar Lista de Cadastrados' : 'Agendar paciente não cadastrado'}
                  </button>
                  <label htmlFor="paciente">Nome do Paciente:</label>
                </div>
                {isUnregisteredPatient ? (
                  <input
                    type="text"
                    id="unregistered_paciente_name"
                    name="unregistered_paciente_name"
                    value={unregisteredPatientName}
                    onChange={(e) => setUnregisteredPatientName(e.target.value)}
                    className="input-field"
                    placeholder="Digite o nome do paciente..."
                    required
                    title="Nome do paciente que não possui cadastro."
                  />
                ) : (
                  <Select
                    id="paciente"
                    name="paciente"
                    options={opcoesPacientes}
                    value={opcoesPacientes.find(p => p.value === novoAgendamento.paciente)}
                    onChange={(opcaoSelecionada) => {
                      const eventoSimulado = {
                        target: {
                          name: 'paciente',
                          value: opcaoSelecionada ? opcaoSelecionada.value : "" 
                        }
                      };
                      handleInputChange(eventoSimulado);
                    }}
                    className="input-field-react-select"
                    classNamePrefix="react-select"
                    isLoading={isPacientesLoading}
                    placeholder={
                      isPacientesLoading 
                        ? "Buscando pacientes..." 
                        : "Digite ou selecione o paciente..."
                    }
                    isSearchable={true}
                    isClearable={true}
                    required
                    title="Selecione um paciente já cadastrado."
                  />
                )}
              </div>
              <div className="form-group-inline">
                <div className="form-group-compact">
                  <label htmlFor="data_consulta">Data: *</label>
                  <input
                    type="date"
                    id="data_consulta"
                    name="data_consulta"
                    value={novoAgendamento.data_consulta}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    min={minDate}
                    title="Data da consulta."
                  />
                </div>
                <div className="form-group-compact">
                  <label htmlFor="horario_consulta">Hora: *</label>
                  <select
                    id="horario_consulta"
                    name="horario_consulta"
                    value={novoAgendamento.horario_consulta}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    title="Horário da consulta."
                  >
                    <option value="">--:--</option>
                    {horarios.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions-footer">
                <button type="button" className="button-secondary" onClick={() => setShowForm(false)} title="Cancelar e fechar">Cancelar</button>
                <button type="submit" className="button-primary" title="Salvar a nova consulta">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*VISUALIZAÇÃO DA AGENDA*/}
      <div className="schedule-options">
        <div className="schedule-options-left">
          <span className="horarios-text">
            {view === 'mensal' ? 'Visualização Mensal' : 'Horários'}
          </span>
          <span className="separator-text">|</span>
          <span className="current-month">
            {capitalize(format(dataAtual, 'MMMM', { locale: ptBR }))}
          </span>
        </div>
        <div className="view-toggle">
          <button className={`toggle-button ${view === 'mensal' ? 'active' : ''}`} onClick={() => setView('mensal')} title="Alternar para visualização mensal">Mês</button>
          <button className={`toggle-button ${view === 'semanal' ? 'active' : ''}`} onClick={() => setView('semanal')} title="Alternar para visualização semanal">Semana</button>
          <button className={`toggle-button ${view === 'diaria' ? 'active' : ''}`} onClick={() => setView('diaria')} title="Alternar para visualização diária">Dia</button>
        </div>
      </div>
      
      {view === 'mensal' ? (
        renderMonthlyView()
      ) : (
        <div className="schedule-table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="horario-col">Horário</th>
                {renderHeaders()}
              </tr>
            </thead>
            <tbody>
              {horarios.map(hora => (
                <tr key={hora}>
                  <td className="horario-col">{hora}</td>
                  {renderCells(hora)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/*LEGENDA*/}
      {view !== 'mensal' && (
        <div className="legend-fixed-footer">
          <div className="legend">
            <div className="legend-item"><span className="status-indicator confirmado"></span> Confirmado</div>
            <div className="legend-item"><span className="status-indicator pendente"></span> Pendente</div>
            <div className="legend-item"><span className="status-indicator cancelado"></span> Cancelado</div>
            <div className="legend-item"><span className="status-indicator reagendado"></span> Reagendado</div>
          </div>
        </div>
      )}
      
      {/*MODAL DE DETALHES DA CONSULTA*/}
      {showDetailModal && selectedAgendamento && (
        <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalView === 'details' ? (
              <>
                <h3>Detalhes da Consulta</h3>
                <p>
                  <strong>Paciente:</strong>{' '}
                  {selectedPaciente?.nome
                    ? selectedPaciente.nome
                    : selectedAgendamento?.nome_paciente_temp
                      ? `${selectedAgendamento.nome_paciente_temp} (Não Cad.)`
                      : 'Paciente Indefinido'}
                </p>
                <p><strong>Data:</strong> {format(parseISO(selectedAgendamento.data_consulta), 'dd/MM/yyyy')}</p>
                <p><strong>Hora:</strong> {selectedAgendamento.horario_consulta.substring(0, 5)}</p>
                <div className="form-group-compact">
                  <label htmlFor="status" title="Mude o status da consulta (Ex: de Pendente para Confirmado)">Alterar Status:</label>
                  <select
                    id="status"
                    className="input-field"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="reagendado">Reagendado</option>
                  </select>
                </div>
                <div className="form-actions-footer" style={{ justifyContent: 'space-between', marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => setModalView('confirmDelete')}
                    title="Excluir esta consulta permanentemente"
                  >
                    Excluir
                  </button>
                  <div>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setShowDetailModal(false)}
                      title="Fechar esta janela"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={handleSaveStatus}
                      style={{ marginLeft: '10px' }}
                      title="Salvar o novo status desta consulta"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              //MODAL DE CONFIRMAR EXCLUSÃO
              <>
                <h3>Confirmar Exclusão</h3>
                <p>Tem certeza que deseja excluir esta consulta?</p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Esta ação não pode ser desfeita.</p>
                <div className="form-actions-footer" style={{ justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setModalView('details')}
                    title="Não excluir e voltar"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={handleDeleteAppointment}
                    style={{ marginLeft: '10px' }}
                    title="Confirmar exclusão"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/*BOTÃO E MODAL DE AJUDA*/}
      <button 
        className="floating-help-button" 
        onClick={() => setIsAjudaOpen(true)}
        title="Ajuda sobre esta página"
      >
        <FontAwesomeIcon icon={faQuestionCircle} />
      </button>

      <Modal
        isOpen={isAjudaOpen}
        onClose={() => setIsAjudaOpen(false)}
        titulo="Ajuda - Agenda"
        footer={
          <button 
            className="modal-button modal-button-secondary" 
            onClick={() => setIsAjudaOpen(false)}
          >
            Fechar
          </button>
        }
      >
        <p>Esta tela guia você pelo cadastro de um novo paciente em 4 etapas:</p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>
            <strong>Dados Pessoais:</strong> Informações básicas de cadastro e contato. Campos com * (asterisco) são obrigatórios.
          </li>
          <li>
            <strong>Anamnese 1 e 2:</strong> Questionário de saúde. Os campos "Motivo da consulta" e "Último tratamento" são obrigatórios. Nas demais perguntas (checkboxes), a descrição se torna obrigatória caso a opção seja marcada (selecionada).
          </li>
          <li>
            <strong>Concluir e Salvar:</strong> Permite salvar o paciente no sistema e imprimir a ficha de anamnese.
          </li>
        </ul>
      </Modal>
    </div>
  );
}

export default Agenda;