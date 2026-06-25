import { useState } from "react";
import TextInput from "../../components/TextInput/TextInput";
import styles from "./FormScreen.module.css";
import { SendMoveSequence } from "../../repository/MoveSequence"

interface OrderRow {
  direction: string;
  angulation: string;
  duration: string;
}

export default function FormScreen() {
  const [isFormSent, setIsFormSent] = useState(false);
  const [rows, setRows] = useState<OrderRow[]>([
    { direction: "", angulation: "", duration: "" },
  ]);
  
  // Estado para guardar mensagem de erro de validação (opcional, mas melhora a UX)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (index: number, field: keyof OrderRow, value: string) => {
    // Limpa o erro assim que o usuário voltar a digitar
    if (errorMessage) setErrorMessage(null);

    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { direction: "", angulation: "", duration: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

async function salvar() {
  const hasEmptyFields = rows.some(
    (row) =>
      !row.direction.trim() ||
      !row.angulation.trim() ||
      !row.duration.trim()
  );

  if (hasEmptyFields) {
    setErrorMessage(
      "Por favor, preencha todos os campos de todas as fileiras antes de salvar."
    );
    return;
  }

  setErrorMessage(null);
  setIsFormSent(true);

  try {
    const result = await SendMoveSequence(rows);

    if (result) {
      setRows([
        {
          direction: "",
          angulation: "",
          duration: "",
        },
      ]);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setIsFormSent(false);
  }
}

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sparki</h1>

        <p className={styles.subtitle}>
          Envie ordens ao Sparki, o carrinho que anda vruuummmmmm !!!
        </p>

        {/* Exibe o texto de erro na tela se houver algum campo vazio */}
        {errorMessage && (
          <div className={styles.errorAlert}>
            {errorMessage}
          </div>
        )}

        <div className={styles.formContainer}>
          {rows.map((row, index) => (
            <div key={index} className={styles.row}>
              <TextInput
                value={row.direction}
                onChange={(val) => handleInputChange(index, "direction", val)}
                placeholder="Insira direção"
              />

              <TextInput
                value={row.angulation}
                onChange={(val) => handleInputChange(index, "angulation", val)}
                placeholder="Insira a angulação"
              />

              <TextInput
                value={row.duration}
                onChange={(val) => handleInputChange(index, "duration", val)}
                placeholder="Insira a duração"
              />

              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeRow(index)}
                disabled={rows.length === 1}
                title="Remover fileira"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className={styles.actionsContainer}>
          <button type="button" className={styles.addButton} onClick={addRow}>
            + Adicionar Fileira
          </button>

         <button
            className={styles.button}
            onClick={salvar}
            disabled={isFormSent}
          >
            {isFormSent ? (
              <>
                <span className={styles.spinner}></span>
                Enviando...
              </>
            ) : (
              "Salvar Cadastro"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}