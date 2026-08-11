🎵 Sistema Escola de Música — Desenvolvimento

📌 Status atual

O sistema está sendo desenvolvido para auxiliar professores e gestores de uma escola de música no acompanhamento de alunos, presença, planos de aula, desenvolvimento e demais informações acadêmicas/administrativas.

Stack atual

- React
- Vite
- JavaScript
- CSS
- LocalStorage

Futuro

A estrutura está sendo desenvolvida pensando em uma futura migração para:

- Node.js
- Express
- PostgreSQL
- API REST
- Autenticação de usuários/professores

---

👨‍🎓 Módulo Alunos

Status: ✅ CONCLUÍDO

O módulo de alunos é atualmente a principal base de dados do sistema.

Funcionalidades implementadas

Cadastro

Cada aluno possui atualmente:

- Nome
- Data de nascimento
- Foto
- Instrumento
- Unidade
- Status
- Responsáveis

Os alunos possuem um "id" próprio para identificação.

---

✏️ Edição

É possível editar:

- Nome
- Data de nascimento
- Foto
- Instrumento
- Unidade

A edição mantém os demais dados do aluno.

---

🗑️ Exclusão

Alunos podem ser excluídos mediante confirmação.

Após a exclusão:

- O aluno é removido da lista.
- O estado é atualizado.
- O "localStorage" é atualizado.
- O Dashboard recebe a nova quantidade de alunos.

---

🔎 Pesquisa e filtros

O módulo possui pesquisa por:

- Nome
- Instrumento
- Unidade

Também existem filtros por:

- Unidade
- Instrumento
- Idade

---

📋 Detalhes do aluno

Cada aluno possui uma tela/modal de detalhes contendo:

- Foto
- Nome
- Status
- Instrumento
- Idade
- Unidade
- Aniversário
- Responsáveis

---

👨‍👩‍👧 Responsáveis

O módulo de responsáveis foi desenvolvido dentro dos detalhes do aluno.

Funcionalidades

- Adicionar responsável
- Editar responsável
- Excluir responsável
- Confirmar exclusão
- Foto do responsável
- Nome
- Telefone
- Visualização detalhada

Cada responsável possui seu próprio "id".

A estrutura atual é vinculada diretamente ao aluno:

{
    id: 1,
    nome: "João Silva",
    responsaveis: [
        {
            id: 123,
            nome: "Maria Silva",
            telefone: "99999-9999",
            foto: ""
        }
    ]
}

---

💾 Persistência

Atualmente os alunos são armazenados no:

localStorage

Chave utilizada:

alunos

O sistema salva automaticamente a lista sempre que o estado de alunos é alterado.

Isso inclui:

- Cadastro
- Edição
- Exclusão
- Responsáveis
- Alterações nos dados

---

📊 Integração com Dashboard

O Dashboard possui um card:

Alunos

Anteriormente o valor era fixo.

Agora ele é calculado dinamicamente através dos alunos armazenados.

Exemplo:

Alunos
   4

Quando um aluno é:

- adicionado → contador aumenta;
- excluído → contador diminui.

A atualização utiliza um evento:

window.dispatchEvent(
    new Event("alunosAtualizados")
);

A "TelaInicial" escuta esse evento e atualiza o contador.

---

🧱 Preparação para banco de dados

Apesar de o sistema utilizar "localStorage" atualmente, a estrutura está sendo desenvolvida pensando em uma futura API.

A entidade principal será futuramente semelhante a:

alunos
├── id
├── nome
├── nascimento
├── foto
├── instrumento
├── unidade
├── status
└── ...

E os responsáveis deverão possuir relacionamento com o aluno:

alunos
    │
    └── responsáveis

Futuramente isso poderá ser convertido para PostgreSQL através de relacionamento por "aluno_id".

---

📱 Responsividade

O módulo Alunos possui estilos para:

- Desktop
- Tablet
- Celular

Os cards de alunos se adaptam ao tamanho da tela.

A seção de responsáveis possui rolagem horizontal em telas menores.

---

🎨 CSS

Atualmente os estilos do módulo estão concentrados em:

Alunos.css

O arquivo contém estilos para:

- Cards de alunos
- Filtros
- Modal
- Detalhes
- Status
- Responsáveis
- Formulários
- Menu de ações
- Responsividade

---

🗂️ Estrutura atual relacionada

Alunos/
├── Alunos.jsx
├── Alunos.css
├── components/
│   ├── AlunoCard.jsx
│   ├── AlunosDetalhes.jsx
│   └── Responsaveis.jsx
└── utils/
    └── instrumentos.js

---

🔗 Relação com outros módulos

O módulo Alunos será uma das principais fontes de dados do sistema.

A arquitetura planejada é:

                 ALUNOS
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
    PRESENÇA   PLANOS      BANDAS
        │        AULA         │
        │          │          │
        └──────────┼──────────┘
                   ↓
               RELATÓRIOS

---

🔨 Próxima etapa

Presença

Status: ⏳ PRÓXIMO MÓDULO

A palavra-chave definida para retomar o desenvolvimento é:

presença

Antes de começar a implementação, serão definidas todas as funcionalidades do módulo.

A ideia é que Presença permita futuramente:

- Lista de alunos
- Registro de presença
- Falta
- Falta justificada
- Data da aula
- Observações
- Histórico
- Frequência individual
- Percentual de presença
- Filtros
- Integração com alunos
- Dados preparados para Relatórios

---

📊 Relatórios — futuro

O módulo de Relatórios será desenvolvido posteriormente e funcionará como uma camada de agregação de dados.

Possíveis fontes:

Alunos
Presença
Planos de aula
Desenvolvimento
Bandas

Possíveis relatórios:

Relatório individual

- Frequência
- Faltas
- Aulas
- Planos de aula
- Desenvolvimento
- Histórico

Relatório por unidade/turma

- Quantidade de alunos
- Frequência média
- Faltas
- Instrumentos
- Desenvolvimento

Relatório geral

- Total de alunos
- Crescimento
- Frequência
- Desempenho
- Unidades
- Professores
- Bandas

O módulo será desenvolvido somente depois que as fontes de dados estiverem estruturadas.

---

🚧 Ordem planejada de desenvolvimento

✅ Alunos
   │
   ↓
🔨 Presença
   │
   ↓
🔨 Planos de aula
   │
   ↓
🔨 Bandas
   │
   ↓
🔨 Relatórios
   │
   ↓
🔨 Configurações
   │
   ↓
🔨 Perfil

---

📝 Regra de desenvolvimento

As novas funcionalidades devem:

1. Funcionar de forma independente.
2. Utilizar dados já existentes quando possível.
3. Não duplicar informações desnecessariamente.
4. Persistir os dados corretamente.
5. Ser pensadas para futura migração para API/PostgreSQL.
6. Produzir dados que possam ser utilizados por outros módulos.
7. Manter a responsividade.
8. Evitar refatorações desnecessárias de funcionalidades já concluídas.

---

✅ Última etapa concluída

Módulo Alunos — finalizado.

Próximo módulo: Presença.

Palavra-chave para retomar:

presença