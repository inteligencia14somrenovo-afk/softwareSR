const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// =====================================================
// GET /alunos
//
// Professor → somente seus alunos
// Admin/Dev → todos os alunos da escola
// =====================================================

router.get("/", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }


    const professorId = req.session.professorId;


    // =====================================================
    // BUSCA O USUÁRIO AUTENTICADO
    // =====================================================

    const professorResult = await pool.query(
      `
      SELECT
        id,
        nome,
        role
      FROM professores
      WHERE id = $1
      `,
      [professorId]
    );


    if (professorResult.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }


    const usuario = professorResult.rows[0];


    // =====================================================
    // ADMIN / DEV
    // Busca todos os alunos da escola
    // =====================================================

    if (
      usuario.role === "admin" ||
      usuario.role === "dev"
    ) {

      const resultado = await pool.query(
        `
        SELECT
          a.id,
          a.professor_id,
          a.codigo_aluno,
          a.nome,
          a.nascimento,
          a.foto,
          a.instrumento,
          a.instrumento_especifico,
          a.unidade,
          a.status,
          a.created_at,
          a.updated_at,

          p.nome AS professor_nome

        FROM alunos a

        LEFT JOIN professores p
          ON p.id = a.professor_id

        ORDER BY a.nome ASC
        `
      );


      return res.json({
        sucesso: true,
        alunos: resultado.rows
      });

    }


    // =====================================================
    // PROFESSOR
    // Busca somente os próprios alunos
    // =====================================================

    const resultado = await pool.query(
      `
      SELECT
        id,
        professor_id,
        codigo_aluno,
        nome,
        nascimento,
        foto,
        instrumento,
        instrumento_especifico,
        unidade,
        status,
        created_at,
        updated_at
      FROM alunos
      WHERE professor_id = $1
      ORDER BY nome ASC
      `,
      [professorId]
    );


    res.json({
      sucesso: true,
      alunos: resultado.rows
    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar alunos:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar alunos."
    });

  }

});


// =====================================================
// POST /alunos
// Cria um aluno para o professor autenticado
// =====================================================

router.post("/", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;

    const {
      nome,
      nascimento,
      foto,
      instrumento,
      unidade
    } = req.body;


    if (
      !nome ||
      !nome.trim() ||
      !nascimento ||
      !instrumento ||
      !unidade
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Preencha todos os campos obrigatórios."
      });
    }


    const resultado = await pool.query(
      `
      INSERT INTO alunos (
        professor_id,
        nome,
        nascimento,
        foto,
        instrumento,
        instrumento_especifico,
        unidade
      )
      VALUES ($1, $2, $3, $4, $5, NULL, $6)
      RETURNING
        id,
        professor_id,
        codigo_aluno,
        nome,
        nascimento,
        foto,
        instrumento,
        instrumento_especifico,
        unidade,
        status,
        created_at,
        updated_at
      `,
      [
        professorId,
        nome.trim(),
        nascimento,
        foto || null,
        instrumento,
        unidade
      ]
    );


    res.status(201).json({
      sucesso: true,
      mensagem: "Aluno criado com sucesso.",
      aluno: resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao criar aluno:",
      error
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar aluno."
    });

  }

});


// =====================================================
// PUT /alunos/:id
//
// ATUALIZA DATA DE NASCIMENTO
//
// Professor:
// - pode cadastrar nascimento se ainda estiver vazio
// - depois de cadastrado, não pode alterar
//
// Admin / Dev:
// - podem cadastrar e alterar nascimento
// =====================================================

router.put("/:id", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    const professorId = req.session.professorId;
    const alunoId = req.params.id;

    const { nascimento } = req.body;


    // =====================================================
    // BUSCA USUÁRIO AUTENTICADO
    // =====================================================

    const usuarioResult = await pool.query(
      `
      SELECT
        id,
        role
      FROM professores
      WHERE id = $1
      `,
      [professorId]
    );


    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });
    }


    const usuario = usuarioResult.rows[0];


    // =====================================================
    // BUSCA ALUNO
    //
    // Professor só pode acessar seu próprio aluno.
    // Admin / Dev podem acessar qualquer aluno.
    // =====================================================

    let alunoResult;


    if (
      usuario.role === "admin" ||
      usuario.role === "dev"
    ) {

      alunoResult = await pool.query(
        `
        SELECT
          id,
          professor_id,
          codigo_aluno,
          nome,
          nascimento,
          foto,
          instrumento,
          instrumento_especifico,
          unidade,
          status,
          created_at,
          updated_at
        FROM alunos
        WHERE id = $1
        `,
        [alunoId]
      );

    } else {

      alunoResult = await pool.query(
        `
        SELECT
          id,
          professor_id,
          codigo_aluno,
          nome,
          nascimento,
          foto,
          instrumento,
          instrumento_especifico,
          unidade,
          status,
          created_at,
          updated_at
        FROM alunos
        WHERE
          id = $1
          AND professor_id = $2
        `,
        [
          alunoId,
          professorId
        ]
      );

    }


    if (alunoResult.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });
    }


    const aluno = alunoResult.rows[0];


    // =====================================================
    // VALIDA DATA
    // =====================================================

    if (!nascimento) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe a data de nascimento."
      });
    }


    const dataNascimento =
      String(nascimento).trim();


    const formatoData =
      /^\d{4}-\d{2}-\d{2}$/;


    if (!formatoData.test(dataNascimento)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Data de nascimento inválida."
      });
    }


    // =====================================================
    // PROFESSOR
    //
    // Só pode preencher se ainda não existir nascimento.
    // =====================================================

    if (
      usuario.role !== "admin" &&
      usuario.role !== "dev"
    ) {

      if (aluno.nascimento) {
        return res.status(403).json({
          sucesso: false,
          mensagem:
            "A data de nascimento já foi cadastrada e não pode ser alterada pelo professor."
        });
      }

    }


    // =====================================================
    // ATUALIZA SOMENTE NASCIMENTO
    // =====================================================

    const resultado = await pool.query(
      `
      UPDATE alunos
      SET
        nascimento = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        professor_id,
        codigo_aluno,
        nome,
        nascimento,
        foto,
        instrumento,
        instrumento_especifico,
        unidade,
        status,
        created_at,
        updated_at
      `,
      [
        dataNascimento,
        alunoId
      ]
    );


    return res.json({
      sucesso: true,
      mensagem:
        "Data de nascimento salva com sucesso.",
      aluno: resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao atualizar nascimento do aluno:",
      error
    );

    return res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao salvar data de nascimento."
    });

  }

});


// =====================================================
// PUT /alunos/:id/instrumento
//
// ATUALIZA O INSTRUMENTO ESPECÍFICO
//
// Regras:
//
// Professor:
// - pode escolher uma vez
// - depois de escolhido, não pode alterar
//
// Admin / Dev:
// - podem escolher
// - podem alterar posteriormente
//
// Somente categorias ambíguas permitem escolha:
//
// guitarra/violao → guitarra OU violao
// teclado/piano   → teclado OU piano
// =====================================================

router.put("/:id/instrumento", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }


    const professorId =
      req.session.professorId;

    const alunoId =
      req.params.id;

    const {
      instrumento_especifico
    } = req.body;


    // =====================================================
    // VALIDA USUÁRIO
    // =====================================================

    const usuarioResult =
      await pool.query(
        `
        SELECT
          id,
          role
        FROM professores
        WHERE id = $1
        `,
        [professorId]
      );


    if (
      usuarioResult.rows.length === 0
    ) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado."
      });

    }


    const usuario =
      usuarioResult.rows[0];


    // =====================================================
    // BUSCA ALUNO
    //
    // Professor só pode acessar seu próprio aluno.
    // Admin / Dev podem acessar qualquer aluno.
    // =====================================================

    let alunoResult;


    if (
      usuario.role === "admin" ||
      usuario.role === "dev"
    ) {

      alunoResult =
        await pool.query(
          `
          SELECT
            id,
            professor_id,
            codigo_aluno,
            nome,
            nascimento,
            foto,
            instrumento,
            instrumento_especifico,
            unidade,
            status,
            created_at,
            updated_at
          FROM alunos
          WHERE id = $1
          `,
          [alunoId]
        );

    } else {

      alunoResult =
        await pool.query(
          `
          SELECT
            id,
            professor_id,
            codigo_aluno,
            nome,
            nascimento,
            foto,
            instrumento,
            instrumento_especifico,
            unidade,
            status,
            created_at,
            updated_at
          FROM alunos
          WHERE
            id = $1
            AND professor_id = $2
          `,
          [
            alunoId,
            professorId
          ]
        );

    }


    if (
      alunoResult.rows.length === 0
    ) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });

    }


    const aluno =
      alunoResult.rows[0];


    // =====================================================
    // VALIDA VALOR RECEBIDO
    // =====================================================

    const instrumentoEscolhido =
      String(
        instrumento_especifico || ""
      )
        .trim()
        .toLowerCase();


    const instrumentosValidos = [
      "guitarra",
      "violao",
      "ukulele",
      "contrabaixo",
      "teclado",
      "piano"
    ];


    if (
      !instrumentosValidos.includes(
        instrumentoEscolhido
      )
    ) {

      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Instrumento específico inválido."
      });

    }


  // =====================================================
// VALIDA A COMPATIBILIDADE
// COM O INSTRUMENTO DA PLANILHA
// =====================================================

if (
  aluno.instrumento ===
    "guitarra/violao/ukulele/contrabaixo" ||
  aluno.instrumento === "guitarra/violao"
) {

  if (
    instrumentoEscolhido !== "guitarra" &&
    instrumentoEscolhido !== "violao" &&
    instrumentoEscolhido !== "ukulele" &&
    instrumentoEscolhido !== "contrabaixo"
  ) {

    return res.status(400).json({
      sucesso: false,
      mensagem:
        "Este aluno pode ser definido somente como Guitarra, Violão, Ukulele ou Contrabaixo."
    });

  }

} else if (
  aluno.instrumento === "teclado/piano"
) {

  if (
    instrumentoEscolhido !== "teclado" &&
    instrumentoEscolhido !== "piano"
  ) {

    return res.status(400).json({
      sucesso: false,
      mensagem:
        "Este aluno pode ser definido somente como Teclado ou Piano."
    });

  }

} else {

  return res.status(400).json({
    sucesso: false,
    mensagem:
      "Este aluno não possui um instrumento que necessite de definição específica."
  });

}

    // =====================================================
    // PROFESSOR
    //
    // Só pode escolher se ainda não houver escolha.
    // =====================================================

    if (
      usuario.role !== "admin" &&
      usuario.role !== "dev"
    ) {

      if (
        aluno.instrumento_especifico
      ) {

        return res.status(403).json({
          sucesso: false,
          mensagem:
            "O instrumento já foi definido e não pode ser alterado pelo professor."
        });

      }

    }


    // =====================================================
    // ATUALIZA INSTRUMENTO ESPECÍFICO
    // =====================================================

    const resultado =
      await pool.query(
        `
        UPDATE alunos
        SET
          instrumento_especifico = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING
          id,
          professor_id,
          codigo_aluno,
          nome,
          nascimento,
          foto,
          instrumento,
          instrumento_especifico,
          unidade,
          status,
          created_at,
          updated_at
        `,
        [
          instrumentoEscolhido,
          alunoId
        ]
      );


    return res.json({
      sucesso: true,
      mensagem:
        "Instrumento definido com sucesso.",
      aluno:
        resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao atualizar instrumento do aluno:",
      error
    );


    return res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao salvar instrumento."
    });

  }

});


// =====================================================
// DELETE /alunos/:id
// Exclui somente um aluno do professor autenticado
// =====================================================

router.delete("/:id", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }


    const professorId =
      req.session.professorId;

    const alunoId =
      req.params.id;


    const resultado =
      await pool.query(
        `
        DELETE FROM alunos
        WHERE
          id = $1
          AND professor_id = $2
        RETURNING id, nome
        `,
        [
          alunoId,
          professorId
        ]
      );


    if (
      resultado.rows.length === 0
    ) {

      return res.status(404).json({
        sucesso: false,
        mensagem: "Aluno não encontrado."
      });

    }


    res.json({
      sucesso: true,
      mensagem:
        "Aluno excluído com sucesso.",
      aluno:
        resultado.rows[0]
    });


  } catch (error) {

    console.error(
      "❌ Erro ao excluir aluno:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir aluno."
    });

  }

});


module.exports = router;