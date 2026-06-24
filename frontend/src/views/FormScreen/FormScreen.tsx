import { useState } from "react";
import TextInput from "../../components/TextInput/TextInput";
import styles from "./FormScreen.module.css";

interface OrderRow {
  direction: string;
  angulation: string;
  duration: string;
}

export default function FormScreen() {
  // Iniciamos com uma fileira vazia
  const [rows, setRows] = useState<OrderRow[]>([
    { direction: "", angulation: "", duration: "" },
  ]);

  // Função para atualizar um campo específico de uma fileira específica
  const handleInputChange = (index: number, field: keyof OrderRow, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  // Adiciona uma nova fileira de campos
  const addRow = () => {
    setRows([...rows, { direction: "", angulation: "", duration: "" }]);
  };

  // Remove uma fileira específica pelo index
  const removeRow = (index: number) => {
    // Evita remover se só houver uma fileira (opcional, remova a validação se quiser permitir 0 fileiras)
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  function salvar() {
    console.log("Ordens enviadas:", rows);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sparki</h1>

        <p className={styles.subtitle}>
          Envie ordens ao Sparki, o carrinho que anda vruuummmmmm !!!
        </p>

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
                disabled={rows.length === 1} // Desabilita se for a única fileira restante
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

          <button className={styles.button} onClick={salvar}>
            Salvar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
}