import React, { useState } from "react";
import "./FormScreen.module.css";
import TextInput from "../../components/TextInput/TextInput";

const FormScreen: React.FC = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");

  const handleSubmit = () => {
    console.log({
      nome,
      email,
      telefone,
      cidade,
    });
  };

  return (
    <div className="page-container">
      <div className="form-card">
        <h1 className="form-title">Cadastro</h1>

        <p className="form-subtitle">
          Preencha suas informações abaixo
        </p>

        <TextInput
          label="Nome"
          value={nome}
          onChange={setNome}
          placeholder="Digite seu nome"
        />

        <TextInput
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="Digite seu email"
        />

        <TextInput
          label="Telefone"
          value={telefone}
          onChange={setTelefone}
          placeholder="Digite seu telefone"
        />

        <TextInput
          label="Cidade"
          value={cidade}
          onChange={setCidade}
          placeholder="Digite sua cidade"
        />

        <button
          className="submit-button"
          onClick={handleSubmit}
        >
          Salvar Cadastro
        </button>
      </div>
    </div>
  );
};

export default FormScreen;