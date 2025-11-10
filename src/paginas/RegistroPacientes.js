import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegistroPacientes.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPrint } from '@fortawesome/free-solid-svg-icons';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Modal from '../componentes/Modal';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const validaCPF = (cpf) => {
    if (!cpf) return false;
    const cpfLimpo = String(cpf).replace(/\D/g, ''); 

    if (cpfLimpo.length !== 11) return false;

    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

    return true;
};

//Breadcrumbs
const Breadcrumbs = ({ step }) => {
  
    const steps = ['Dados Pessoais', 'Anamnese 1', 'Anamnese 2', 'Concluir e Salvar'];
    const currentPath = steps.slice(0, step);
        return (
            <div className="breadcrumbs-container">
            {currentPath.map((name, index) => (
                <span key={index} className="breadcrumb-item">
                {name}
                {index < currentPath.length - 1 && <span className="separator">/</span>}
                </span>
            ))}
            </div>
        );
    };

    const DadosPessoais = ({ onNext, data, onChange, showToast }) => {
        const [ufs, setUfs] = useState([]);
        const [cidades, setCidades] = useState([]);
        const [isCidadesLoading, setIsCidadesLoading] = useState(false);

        useEffect(() => {
            const fetchUfs = async () => { try { const token = localStorage.getItem('access_token'); const response = await axios.get(`${API_BASE_URL}/api/ufs/`, { headers: { 'Authorization': `Bearer ${token}` } }); const ufsData = response.data.results || response.data || []; setUfs(ufsData); } catch (error) { console.error('Erro ao buscar UFs:', error); } }; fetchUfs();
        }, []);

        useEffect(() => {
        if (data.uf) {
        setIsCidadesLoading(true);
        setCidades([]); 

        const fetchCidades = async () => {
            try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            const response = await axios.get(`${API_BASE_URL}/api/cidades/by_uf/?uf_id=${data.uf}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCidades(response.data || []);
            } catch (error) {
            console.error('Erro ao buscar Cidades:', error);
            setCidades([]);
            } finally {
            setIsCidadesLoading(false);
            }
        };
        
        fetchCidades();
        } else {
        setCidades([]);
        setIsCidadesLoading(false);
        }
    }, [data.uf]);

        const handleValidateAndNext = (e) => {
        e.preventDefault();

        if (!validaCPF(data.cpf)) {
            showToast('CPF inválido! Por favor, verifique o número digitado.', 'error');
            return;
        }
        onNext();
    };

        return (
            <div className="dados-pessoais-container registro-tela">
            
            <h2 className="section-title">Dados Pessoais:</h2>
            
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Campos com * são obrigatórios.
            </p>

            <form onSubmit={handleValidateAndNext}>
                
                <div className="form-group">
                <label htmlFor="nome">Nome: *</label>
                <input type="text" id="nome" name="nome" value={data.nome || ''}
                    onChange={onChange} className="input-field" required 
                    title="Nome completo do paciente."
                />
                </div>
                
                <div className="form-group-inline">
                <div className="form-group">
                    <label htmlFor="cpf">CPF: *</label>
                    <input type="text" id="cpf" name="cpf" value={data.cpf || ''} onChange={onChange}
                    className="input-field" required 
                    title="CPF (apenas números)."
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="data_nasc">Data de Nascimento: *</label>
                    <input type="date" id="data_nasc" name="data_nasc" value={data.data_nasc || ''}
                    onChange={onChange} className="input-field" required 
                    title="Data de nascimento do paciente."
                    />
                </div>
                </div>
                
                <div className="form-group">
                <label htmlFor="telefone">Telefone:</label>
                <input type="text" id="telefone" name="telefone" value={data.telefone || ''}
                    onChange={onChange} className="input-field" 
                    title="Telefone principal (Ex: (42) 99999-8888)."
                />
                </div>

                <div className="form-group-inline">
                <div className="form-group">
                    <label htmlFor="uf">UF: *</label>
                    <select name="uf" id="uf" value={data.uf || ''} onChange={onChange}
                    className="input-field" required 
                    title="Selecione o estado (UF)."
                    >
                    <option value="">Selecione o Estado</option>
                    {ufs.map(uf => (
                        <option key={uf.id_uf} value={uf.id_uf}>{uf.sigla_uf}</option>
                    ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="cidade">Cidade: *</label>
                        <select 
                        name="cidade" 
                        id="cidade" 
                        value={data.cidade || ''} 
                        onChange={onChange}
                        className="input-field" 
                        required 
                        disabled={!data.uf || isCidadesLoading}
                        title="Selecione a cidade (requer UF selecionada)."
                    >
                    <option value="">Selecione a Cidade</option>
                    {cidades.map(cidade => (
                        <option key={cidade.id_cidade} value={cidade.id_cidade}>{cidade.nome_cidade}</option>
                    ))}
                    </select>
                </div>
                </div>
                
                <div className="form-group">
                <label htmlFor="logradouro">Endereço (Rua, Nº): *</label>
                <input type="text" id="logradouro" name="logradouro" value={data.logradouro || ''}
                    onChange={onChange} className="input-field" required 
                    title="Endereço (Rua, número, bairro, etc.)."
                />
                </div>
                
                <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" value={data.email || ''}
                    onChange={onChange} className="input-field" 
                    title="Email (opcional)."
                />
                </div>
                
                <div className="form-actions-full">
                <button type="submit" className="button-primary" title="Salvar dados pessoais e ir para a próxima etapa.">
                    Próximo
                </button>
                </div>
            </form>
            </div>
        );
    };

    const Anamnese1 = ({ onNext, onBack, data, onChange, showToast }) => {
    const handleValidateAndNext = (e) => {
        e.preventDefault();
        if (data.trat_medico && !data.trat_med_desc?.trim()) { showToast("Por favor, descreva o tratamento médico.", 'error'); return; }
        if (data.medicamento && !data.medicamento_desc?.trim()) { showToast("Por favor, descreva o medicamento utilizado.", 'error'); return; }
        if (data.sensi_dentes && !data.sensi_dentes_desc?.trim()) { showToast("Por favor, descreva a sensibilidade nos dentes.", 'error'); return; }
        onNext();
    };

    return (
        <div className="registro-tela">
        
        <h2 className="section-title">Registro de Anamnese (1/2):</h2>
        
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Campos com * são obrigatórios.
            Para as perguntas de seleção, a descrição é obrigatória se a opção for marcada.
        </p>
        
        <form onSubmit={handleValidateAndNext}>
            <div className="form-group-textarea">
            <label htmlFor="motivo_consulta">Motivo da consulta: *</label>
            <textarea id="motivo_consulta" name="motivo_consulta" value={data.motivo_consulta || ''}
                onChange={onChange} rows="2" className="input-field" required 
                title="Principal queixa ou motivo da visita."
            />
            </div>
            
            <div className="form-group-textarea">
            <label htmlFor="ultimo_trat">Último tratamento odontológico: *</label>
            <textarea id="ultimo_trat" name="ultimo_trat" value={data.ultimo_trat || ''}
                onChange={onChange} rows="2" className="input-field" required 
                title="Descreva o último tratamento e quando foi."
            />
            </div>
            
            <div className="form-checkbox-group">
            
            <label className="checkbox-label" title="Marque se o paciente está sob cuidados médicos.">
                <input type="checkbox" name="trat_medico" checked={data.trat_medico || false} onChange={onChange} /> 
                Em tratamento médico? {data.trat_medico && <input type="text" name="trat_med_desc" value={data.trat_med_desc || ''} onChange={onChange} className="input-conditional" placeholder="Qual?*" required />}
            </label>
            
            <label className="checkbox-label" title="Marque se o paciente utiliza algum remédio contínuo.">
                <input type="checkbox" name="medicamento" checked={data.medicamento || false} onChange={onChange} /> 
                Faz uso de medicamento?{data.medicamento && <input type="text" name="medicamento_desc" value={data.medicamento_desc || ''} onChange={onChange} className="input-conditional" placeholder="Qual?*" required />}
            </label>
            
            <label className="checkbox-label" title="Marque se o paciente já teve alergia ou reação à anestesia dental.">
                <input type="checkbox" name="reacao_anestesia" checked={data.reacao_anestesia || false} onChange={onChange} /> 
                Teve reação à anestesia?{data.reacao_anestesia && <input type="text" name="reacao_anest_desc" value={data.reacao_anest_desc || ''} onChange={onChange} className="input-conditional" placeholder="Qual?*" />}
            </label>
            
            <label className="checkbox-label" title="Marque se o paciente sente dor com frio, calor ou doces.">
                <input type="checkbox" name="sensi_dentes" checked={data.sensi_dentes || false} onChange={onChange} /> 
                Tem sensibilidade nos dentes?{data.sensi_dentes && <input type="text" name="sensi_dentes_desc" value={data.sensi_dentes_desc || ''} onChange={onChange} className="input-conditional" placeholder="Com quê?*" required />}
            </label>
            
            </div>
            
            <div className="form-actions">
                <button type="button" className="button-secondary" onClick={onBack} title="oltar para a etapa anterior (Dados Pessoais).">
                    Voltar
                </button>
                <button type="submit" className="button-primary" title="Salvar esta etapa e ir para a próxima (Anamnese 2/2).">
                    Próximo
                </button>
            </div>
        </form>
        </div>
    );
    };

    const Anamnese2 = ({ onNext, onBack, data, onChange, showToast }) => {
    const handleValidateAndNext = (e) => {
        e.preventDefault();
        if (data.range_apertamento && !data.range_apert_desc?.trim()) { showToast("Descreva sobre ranger/apertar os dentes.", 'error'); return; }
        if (data.gengiva_sangra && !data.gengiva_sang_desc?.trim()) { showToast("Descreva sobre o sangramento na gengiva.", 'error'); return; }
        if (data.fuma && !data.fuma_desc) { showToast("Informe a quantidade de cigarros.", 'error'); return; } 
        if (data.diabetico && !data.diabetico_desc?.trim()) { showToast("Descreva sobre a diabetes.", 'error'); return; }
        if (data.corte_sangra && !data.corte_sang_desc?.trim()) { showToast("Descreva sobre o sangramento.", 'error'); return; }
        if (data.prob_cardiaco && !data.prob_card_desc?.trim()) { showToast("Descreva o problema cardíaco.", 'error'); return; }
        if (data.dores_cabeca && !data.dores_cabeca_desc?.trim()) { showToast("Descreva as dores de cabeça.", 'error'); return; }
        if (data.desmaio_ataques && !data.desmaio_atq_desc?.trim()) { showToast("Descreva os desmaios/ataques.", 'error'); return; }
        if (data.pressao_art && !data.pressao_art_desc?.trim()) { showToast("Descreva a alteração na pressão.", 'error'); return; }
        onNext();
    };

        return (
            <div className="registro-tela">
            <h2 className="section-title">Registro de Anamnese (2/2):</h2>
            
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Para as perguntas de seleção, a descrição é obrigatória se a opção for marcada.
            </p>
            
            <form onSubmit={handleValidateAndNext}>
                <div className="form-checkbox-group">
                
                <label className="checkbox-label" title="Marque se o paciente range ou aperta os dentes, especialmente ao dormir.">
                    <input type="checkbox" name="range_apertamento" checked={data.range_apertamento || false} onChange={onChange} /> 
                    Range os dentes/apertamento?
                    {data.range_apertamento && <input type="text" name="range_apert_desc" value={data.range_apert_desc || ''} onChange={onChange} className="input-conditional" placeholder="Quando percebe?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se a gengiva sangra ao escovar ou espontaneamente.">
                    <input type="checkbox" name="gengiva_sangra" checked={data.gengiva_sangra || false} onChange={onChange} /> 
                    Gengiva sangra facilmente?
                    {data.gengiva_sangra && <input type="text" name="gengiva_sang_desc" value={data.gengiva_sang_desc || ''} onChange={onChange} className="input-conditional" placeholder="Ao escovar, espontaneamente?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se o paciente é fumante.">
                    <input type="checkbox" name="fuma" checked={data.fuma || false} onChange={onChange} /> 
                    Fumante?
                    {data.fuma && <input type="text" name="fuma_desc" value={data.fuma_desc || ''} onChange={onChange} className="input-conditional" placeholder="Cigarros ou Pod? Quantos cigarros por dia?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se o paciente tem diabetes (Tipo 1 ou 2).">
                    <input type="checkbox" name="diabetico" checked={data.diabetico || false} onChange={onChange} /> 
                    Diabético?
                    {data.diabetico && <input type="text" name="diabetico_desc" value={data.diabetico_desc || ''} onChange={onChange} className="input-conditional" placeholder="Tipo? Controlada?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se o paciente tem problemas de coagulação.">
                    <input type="checkbox" name="corte_sangra" checked={data.corte_sangra || false} onChange={onChange} /> 
                    Quando se corta, sangra muito? 
                    {data.corte_sangra && <input type="text" name="corte_sang_desc" value={data.corte_sang_desc || ''} onChange={onChange} className="input-conditional" placeholder="Por quanto tempo?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se o paciente tem alguma condição cardíaca.">
                    <input type="checkbox" name="prob_cardiaco" checked={data.prob_cardiaco || false} onChange={onChange} /> 
                    Tem problema cardíaco?
                    {data.prob_cardiaco && <input type="text" name="prob_card_desc" value={data.prob_card_desc || ''} onChange={onChange} className="input-conditional" placeholder="Qual?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se o paciente sofre de dores de cabeça frequentes ou enxaqueca.">
                    <input type="checkbox" name="dores_cabeca" checked={data.dores_cabeca || false} onChange={onChange} /> 
                    Dores de cabeça?
                    {data.dores_cabeca && <input type="text" name="dores_cabeca_desc" value={data.dores_cabeca_desc || ''} onChange={onChange} className="input-conditional" placeholder="Frequência?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se o paciente já teve episódios de desmaio ou convulsões.">
                    <input type="checkbox" name="desmaio_ataques" checked={data.desmaio_ataques || false} onChange={onChange} /> 
                    Já teve desmaios ou ataques?
                    {data.desmaio_ataques && <input type="text" name="desmaio_atq_desc" value={data.desmaio_atq_desc || ''} onChange={onChange} className="input-conditional" placeholder="Quando?*" required />}
                </label>
                
                <label className="checkbox-label" title="Marque se o paciente tem pressão alta ou baixa.">
                    <input type="checkbox" name="pressao_art" checked={data.pressao_art || false} onChange={onChange} /> 
                    Tem pressão arterial alterada?
                    {data.pressao_art && <input type="text" name="pressao_art_desc" value={data.pressao_art_desc || ''} onChange={onChange} className="input-conditional" placeholder="Alta ou baixa? Controlada?*" required />}
                </label>
                
                </div>
                
                <div className="form-actions">
                    <button type="button" className="button-secondary" onClick={onBack} title="Voltar para a etapa anterior (Anamnese 1/2).">
                        Voltar
                    </button>
                    <button type="submit" className="button-primary" title="Salvar esta etapa e ir para a tela de conclusão.">
                        Próximo
                    </button>
                </div>
            </form>
            </div>
        );
    };


  const Concluido = ({ formData, onSave, onBack, showToast }) => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    const handlePrint = () => {
        const formatDate = (dateString) => {
            if (!dateString) return "-";
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        };

        const renderBooleanField = (label, value, description) => {
            let desc = (value && description) ? ` (${description})` : '';
            return `<p style="margin: 5px 0;"><strong>${label}:</strong> ${value ? 'Sim' : 'Não'}${desc}</p>`;
        };

        let printHtml = `
            <html>
                <head>
                <title>Ficha de Anamnese - ${formData.nome}</title>
                   <style>
                        body { font-family: Arial, sans-serif; margin: 25px; }
                        h2, h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; color: #333; }
                        .section { margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <h2>Ficha de Anamnese</h2>
                    
                    <div class="section">
                        <h3>Dados do Paciente</h3>
                        <p><strong>Nome:</strong> ${formData.nome || '-'}</p>
                        <p><strong>CPF:</strong> ${formData.cpf || '-'}</p>
                        <p><strong>Data de Nascimento:</strong> ${formatDate(formData.data_nasc)}</p>
                    </div>

                    <div class="section">
                        <h3>Informações da Anamnese</h3>
                        <p><strong>Motivo da Consulta:</strong> ${formData.motivo_consulta || '-'}</p>
                        <p><strong>Último Tratamento Odontológico:</strong> ${formData.ultimo_trat || '-'}</p>
                    </div>

                    <div class="section">
                        <h3>Questionário</h3>
                        ${renderBooleanField('Em tratamento médico?', formData.trat_medico, formData.trat_med_desc)}
                        ${renderBooleanField('Faz uso de medicamento?', formData.medicamento, formData.medicamento_desc)}
                        ${renderBooleanField('Teve reação à anestesia?', formData.reacao_anestesia, formData.reacao_anest_desc)}
                        ${renderBooleanField('Tem sensibilidade nos dentes?', formData.sensi_dentes, formData.sensi_dentes_desc)}
                        ${renderBooleanField('Range os dentes/apertamento?', formData.range_apertamento, formData.range_apert_desc)}
                        ${renderBooleanField('Gengiva sangra facilmente?', formData.gengiva_sangra, formData.gengiva_sang_desc)}
                        ${renderBooleanField('Fumante?', formData.fuma, formData.fuma_desc)}
                        ${renderBooleanField('Diabético?', formData.diabetico, formData.diabetico_desc)}
                        ${renderBooleanField('Quando se corta, sangra muito?', formData.corte_sangra, formData.corte_sang_desc)}
                        ${renderBooleanField('Tem problema cardíaco?', formData.prob_cardiaco, formData.prob_card_desc)}
                        ${renderBooleanField('Dores de cabeça?', formData.dores_cabeca, formData.dores_cabeca_desc)}
                        ${renderBooleanField('Já teve desmaios ou ataques?', formData.desmaio_ataques, formData.desmaio_atq_desc)}
                        ${renderBooleanField('Tem pressão arterial alterada?', formData.pressao_art, formData.pressao_art_desc)}
                    </div>
                </body>
                </html>
        `;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };

        const handleFinalSave = async () => {
            setIsSaving(true);
            const success = await onSave();
            setIsSaving(false);
            if (success) {
            showToast('Paciente e anamnese cadastrados com sucesso!', 'success'); 
            navigate('/pacientes');
            }
        };

        return (
            <div className="registro-tela registro-concluido">
            
            <div className="icon-success"><FontAwesomeIcon icon={faCheck} /></div>
            <h2 className="section-title" style={{ color: '#000', fontSize: '1.5rem', marginBottom: '1rem' }}>
            Cadastro Concluído!
            </h2>
            <p style={{ color: '#555', fontSize: '1rem', marginBottom: '2rem' }}>
            Os dados do paciente e a anamnese foram preenchidos.
            </p>
            
            <button 
            onClick={handlePrint} 
            className="imprimir-button"
                    disabled={isSaving}
            title="Gera uma versão para impressão da ficha de anamnese."
            >
            <FontAwesomeIcon icon={faPrint} /> 
                    Imprimir Anamnese
            </button>

            <div className="form-actions">
            <button 
            type="button" 
            className="button-secondary" 
            onClick={onBack} 
            disabled={isSaving}
            title="Voltar para a etapa anterior (Anamnese 2)."
            >
            Voltar
            </button>
            <button 
            type="button" 
            className="button-primary" 
            onClick={handleFinalSave} 
            disabled={isSaving}
            title="Salva permanentemente o paciente e a anamnese no sistema."
            >
            {isSaving ? 'Salvando...' : 'Salvar e Concluir'}
            </button>
            </div>
            </div>
        );
    };

    function RegistroPacientes() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isAjudaOpen, setIsAjudaOpen] = useState(false);

    const handleNext = () => setStep(prevStep => prevStep + 1);
    const handleBack = () => setStep(prevStep => prevStep - 1);

    const handleInputChange = (e) => {
         const { name, value, type, checked } = e.target;
         const finalValue = type === 'checkbox' ? checked : value;

         setFormData(prevData => {
             const newData = { ...prevData, [name]: finalValue };

             if (name === 'uf') {
               newData.cidade = ''; 
            }
            return newData;
        });
    };

    const handleSave = async () => {
        console.log('handleSave iniciado. Dados atuais:', formData);
        try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            showToast('Token de autenticação não encontrado. Faça login novamente.', 'error');
            navigate('/');
            return false; 
        }
        
        const pacienteData = {
            nome: formData.nome,
            cpf: formData.cpf,
            data_nasc: formData.data_nasc,
            telefone: formData.telefone || null,
            logradouro: formData.logradouro,
            email: formData.email || null,
            cidade_id: parseInt(formData.cidade, 10) || null,
        };

        if (!pacienteData.nome || !pacienteData.cpf || !pacienteData.data_nasc || !pacienteData.cidade_id || !pacienteData.logradouro) {
            showToast("Erro: Dados Pessoais obrigatórios estão faltando.", 'error');
            setStep(1); 
            return false;
        }
        
        let pacienteResponse;
        try {
            pacienteResponse = await axios.post(`${API_BASE_URL}/api/pacientes/`, pacienteData, {
            headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Paciente salvo com sucesso:", pacienteResponse.data);
        } catch (pacienteError) {
            const errorMsg = pacienteError.response?.data ? JSON.stringify(pacienteError.response.data) : pacienteError.message;
            showToast(`Erro ao salvar dados do paciente: ${errorMsg}`, 'error');
            console.error('Erro ao salvar paciente:', pacienteError.response || pacienteError);
            return false;
        }
        
        const novoPacienteId = pacienteResponse.data.id_paciente;
        const anamneseData = {
            paciente: novoPacienteId, 
            data_anamnese: new Date().toISOString().split('T')[0],
            motivo_consulta: formData.motivo_consulta,
            ultimo_trat: formData.ultimo_trat,
            trat_medico: formData.trat_medico || false,
            trat_med_desc: formData.trat_medico ? (formData.trat_med_desc || null) : null,
            medicamento: formData.medicamento || false,
            medicamento_desc: formData.medicamento ? (formData.medicamento_desc || null) : null,
            reacao_anestesia: formData.reacao_anestesia || false,
            reacao_anest_desc: formData.reacao_anestesia ? (formData.reacao_anest_desc || null) : null,
            sensi_dentes: formData.sensi_dentes || false,
            sensi_dentes_desc: formData.sensi_dentes ? (formData.sensi_dentes_desc || null) : null,
            range_apertamento: formData.range_apertamento || false,
            range_apert_desc: formData.range_apertamento ? (formData.range_apert_desc || null) : null,
            gengiva_sangra: formData.gengiva_sangra || false,
            gengiva_sang_desc: formData.gengiva_sangra ? (formData.gengiva_sang_desc || null) : null,
            fuma: formData.fuma || false,
            fuma_desc: formData.fuma ? (formData.fuma_desc || null) : null,
            diabetico: formData.diabetico || false,
            diabetico_desc: formData.diabetico ? (formData.diabetico_desc || null) : null,
            corte_sangra: formData.corte_sangra || false,
            corte_sang_desc: formData.corte_sangra ? (formData.corte_sang_desc || null) : null,
            prob_cardiaco: formData.prob_cardiaco || false,
            prob_card_desc: formData.prob_cardiaco ? (formData.prob_card_desc || null) : null,
            dores_cabeca: formData.dores_cabeca || false,
            dores_cabeca_desc: formData.dores_cabeca ? (formData.dores_cabeca_desc || null) : null,
            desmaio_ataques: formData.desmaio_ataques || false,
            desmaio_atq_desc: formData.desmaio_ataques ? (formData.desmaio_atq_desc || null) : null,
            pressao_art: formData.pressao_art || false,
            pressao_art_desc: formData.pressao_art ? (formData.pressao_art_desc || null) : null,
        };

        try {
            await axios.post(`${API_BASE_URL}/api/anamneses/`, anamneseData, {
            headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Anamnese salva com sucesso.");
        } catch (anamneseError) {
            const errorMsg = anamneseError.response?.data ? JSON.stringify(anamneseError.response.data) : anamneseError.message;
            showToast(`Erro ao salvar anamnese: ${errorMsg}`, 'error');
            console.error('Erro ao salvar anamnese:', anamneseError.response || anamneseError);
            return false;
        }

        return true;
        
        } catch (err) { 
        if (err.response && err.response.status === 401) {
            showToast('Sua sessão expirou. Faça login novamente.', 'error');
            navigate('/');
        } else {
            showToast(`Erro inesperado durante o salvamento: ${err.message}`, 'error');
            console.error('Erro geral em handleSave:', err);
        }
        return false;
        }
    };

    const renderStep = () => {
        switch (step) {
        case 1:
            return <DadosPessoais onNext={handleNext} data={formData} onChange={handleInputChange} showToast={showToast} />;
        case 2:
            return <Anamnese1 onNext={handleNext} onBack={handleBack} data={formData} onChange={handleInputChange} showToast={showToast} />;
        case 3:
            return <Anamnese2 onNext={handleNext} onBack={handleBack} data={formData} onChange={handleInputChange} showToast={showToast} />;
        case 4:
            return <Concluido formData={formData} onSave={handleSave} onBack={handleBack} showToast={showToast} />;
        default:
            return <div>Etapa desconhecida</div>;
        }
    };

    return (
        <div className="pacientes-container">
        <Breadcrumbs step={step} />
        {renderStep()}
        <button 
                className="floating-help-button" 
                onClick={() => setIsAjudaOpen(true)}
                title="Ajuda sobre o cadastro de pacientes"
            >
                <FontAwesomeIcon icon={faQuestionCircle} />
            </button>

            <Modal
                isOpen={isAjudaOpen}
                onClose={() => setIsAjudaOpen(false)}
                titulo="Ajuda - Cadastro de Paciente"
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

export default RegistroPacientes;