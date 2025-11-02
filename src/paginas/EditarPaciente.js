import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
// Vamos reutilizar o mesmo CSS da página de registro
import './RegistroPacientes.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function EditarPaciente() {
    const { id } = useParams(); // Pega o ID da URL
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        data_nasc: '',
        telefone: '',
        logradouro: '',
        email: '',
        uf: '',
        cidade: ''
    });
    const [ufs, setUfs] = useState([]);
    const [cidades, setCidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Efeito para buscar UFs (igual ao RegistroPacientes)
    useEffect(() => {
        const fetchUfs = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.get(`${API_BASE_URL}/api/ufs/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setUfs(response.data.results || response.data);
            } catch (error) {
                console.error('Erro ao buscar UFs:', error);
            }
        };
        fetchUfs();
    }, []);

    // Efeito para buscar Cidades quando a UF muda (igual ao RegistroPacientes)
    useEffect(() => {
        // Verifica se formData.uf existe e é um ID (número)
        if (formData.uf) {
            const fetchCidades = async () => {
                try {
                    const token = localStorage.getItem('access_token');
                    // Garante que estamos usando o ID da UF, não o objeto
                    const ufId = typeof formData.uf === 'object' ? formData.uf.id_uf : formData.uf;

                    const response = await axios.get(`${API_BASE_URL}/api/cidades/by_uf/?uf_id=${ufId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setCidades(response.data);
                } catch (error) {
                    console.error('Erro ao buscar Cidades:', error);
                    setCidades([]);
                }
            };
            fetchCidades();
        } else {
            setCidades([]);
        }
    }, [formData.uf]); // Roda quando 'formData.uf' mudar

    // Efeito para buscar os dados DO PACIENTE específico
    useEffect(() => {
        const fetchPaciente = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) throw new Error('Token não encontrado');

                const response = await axios.get(`${API_BASE_URL}/api/pacientes/${id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const data = response.data;

                // Formata a data para o input type="date" (YYYY-MM-DD)
                if (data.data_nasc) {
                    data.data_nasc = data.data_nasc.split('T')[0];
                }

                // O backend retorna o ID da cidade, então está correto
                // Mas se o backend retornasse o objeto cidade, faríamos:
                // data.cidade = data.cidade.id_cidade;
                // data.uf = data.cidade.uf; // (Isto precisaria de ajuste)
                
                setFormData(data);
                setLoading(false);
            } catch (err) {
                setError('Erro ao carregar dados do paciente.');
                setLoading(false);
                console.error(err);
            }
        };

        fetchPaciente();
    }, [id]); // Roda sempre que o ID mudar

    // Função para lidar com mudanças no formulário
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));

        // Se o usuário mudar o UF, limpe a cidade selecionada
        if (name === "uf") {
            setFormData(prevData => ({
                ...prevData,
                cidade: "",
            }));
        }
    };

    // Função para ENVIAR A ATUALIZAÇÃO (PUT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Garante que estamos enviando apenas os IDs
        const dadosParaSalvar = {
            ...formData,
            cidade: formData.cidade, // Deve ser o ID
            uf: formData.uf,       // Deve ser o ID
        };

        try {
            const token = localStorage.getItem('access_token');
            if (!token) throw new Error('Token não encontrado');

            // Enviamos os dados do formulário para o endpoint de UPDATE
            await axios.put(`${API_BASE_URL}/api/pacientes/${id}/`, dadosParaSalvar, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Paciente atualizado com sucesso!');
            navigate('/pacientes'); // Volta para a lista
        } catch (err) {
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            alert(`Erro ao atualizar paciente: ${errorMessage}`);
            console.error('Erro ao salvar:', err.response || err);
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>{error}</div>;

    return (
        // Usando as classes de 'RegistroPacientes.css'
        <div className="pacientes-container"> 
            <div className="dados-pessoais-container">
                <h2 className="section-title">Editar Dados Pessoais:</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome">Nome: *</label>
                        <input type="text" id="nome" name="nome" value={formData.nome || ''}
                            onChange={handleInputChange} className="input-field" required />
                    </div>

                    <div className="form-group-inline">
                        <div className="form-group">
                            <label htmlFor="cpf">CPF: *</label>
                            {/* Deixamos o CPF como readOnly para evitar erros de duplicidade */}
                            <input type="text" id="cpf" name="cpf" value={formData.cpf || ''}
                                onChange={handleInputChange} className="input-field" required readOnly />
                        </div>
                        <div className="form-group">
                            <label htmlFor="data_nasc">Data de Nascimento: *</label>
                            <input type="date" id="data_nasc" name="data_nasc" value={formData.data_nasc || ''}
                                onChange={handleInputChange} className="input-field" required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="telefone">Telefone:</label>
                        <input type="tel" id="telefone" name="telefone" value={formData.telefone || ''}
                            onChange={handleInputChange} className="input-field" />
                    </div>

                    <div className="form-group-inline">
                        <div className="form-group">
                            <label htmlFor="uf">UF: *</label>
                            {/* O 'value' deve ser o ID da UF */}
                            <select name="uf" id="uf" value={formData.uf || ''} onChange={handleInputChange} className="input-field" required>
                                <option value="">Selecione o Estado</option>
                                {ufs.map(uf => (
                                    <option key={uf.id_uf} value={uf.id_uf}>{uf.sigla_uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="cidade">Cidade: *</label>
                            {/* O 'value' deve ser o ID da Cidade */}
                            <select name="cidade" id="cidade" value={formData.cidade || ''} onChange={handleInputChange} className="input-field" required disabled={!formData.uf || cidades.length === 0}>
                                <option value="">Selecione a Cidade</option>
                                {cidades.map(cidade => (
                                    <option key={cidade.id_cidade} value={cidade.id_cidade}>{cidade.nome_cidade}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="logradouro">Endereço (Rua, Nº):</label>
                        <input type="text" id="logradouro" name="logradouro" value={formData.logradouro || ''}
                            onChange={handleInputChange} className="input-field" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" value={formData.email || ''}
                            onChange={handleInputChange} className="input-field" />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="button-secondary" onClick={() => navigate(-1)}>
                            Cancelar
                        </button>
                        <button type="submit" className="button-primary">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditarPaciente;