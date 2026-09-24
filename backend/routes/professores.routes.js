const express = require("express");
const pool = require("../config/database");

const router = express.Router();


// =====================================================
// CONSTANTES
// =====================================================

const ROLES_PERMITIDOS = [
  "professor",
  "admin",
  "dev",
];

const ABA_PLANILHA = "Horário";


// =====================================================
// AUXILIAR
// Verifica se o usuário atual é Admin ou Dev
// =====================================================

async function obterUsuarioAdminDev(req) {

  if (!req.session.professorId) {
    return {
      autorizado: false,
      status: 401,
      mensagem: "Usuário não autenticado.",
    };
  }


  const resultado = await pool.query(
    `
    SELECT
      id,
      email,
      nome,
      role
    FROM professores
    WHERE id = $1
    `,
    [req.session.professorId]
  );


  if (resultado.rows.length === 0) {
    return {
      autorizado: false,
      status: 401,
      mensagem: "Usuário não encontrado.",
    };
  }


  const usuario = resultado.rows[0];


  if (
    usuario.role !== "admin" &&
    usuario.role !== "dev"
  ) {
    return {
      autorizado: false,
      status: 403,
      mensagem:
        "Acesso permitido somente para administradores.",
    };
  }


  return {
    autorizado: true,
    usuario,
  };
}


// =====================================================
// AUXILIAR
// Valida o tipo de acesso
// =====================================================

function validarRole(role) {

  return ROLES_PERMITIDOS.includes(role);

}


// =====================================================
// PUT /professores/perfil
// Atualiza o perfil do usuário autenticado
// =====================================================

router.put("/perfil", async (req, res) => {

  try {

    if (!req.session.professorId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado.",
      });
    }


    const { nome, foto_url } = req.body;


    const nomeFinal =
      typeof nome === "string" &&
      nome.trim() !== ""
        ? nome.trim()
        : null;


    const fotoFinal =
      typeof foto_url === "string" &&
      foto_url.trim() !== ""
        ? foto_url.trim()
        : null;


    const resultado = await pool.query(
      `
      UPDATE professores
      SET
        nome = $1,
        foto_url = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        id,
        email,
        nome,
        foto_url,
        instrumentos,
        perfil_configurado,
        role,
        created_at,
        updated_at
      `,
      [
        nomeFinal,
        fotoFinal,
        req.session.professorId,
      ]
    );


    if (resultado.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Professor não encontrado.",
      });
    }


    res.json({
      sucesso: true,
      mensagem: "Perfil atualizado com sucesso.",
      professor: resultado.rows[0],
    });


  } catch (error) {

    console.error(
      "❌ Erro ao atualizar perfil:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao salvar perfil.",
    });

  }

});


// =====================================================
// GET /professores
// Lista professores, administradores e desenvolvedores
// =====================================================

router.get("/", async (req, res) => {

  try {

    const acesso =
      await obterUsuarioAdminDev(req);


    if (!acesso.autorizado) {
      return res.status(acesso.status).json({
        sucesso: false,
        mensagem: acesso.mensagem,
      });
    }


    const resultado = await pool.query(
      `
      SELECT
        p.id,
        p.nome,
        p.email,
        p.role,
        p.foto_url,
        p.created_at,
        p.updated_at,

        COUNT(DISTINCT a.id)::integer AS total_alunos,

        pp.id AS planilha_id,
        pp.aba AS planilha_aba,
        pp.intervalo AS planilha_intervalo,

        CASE
          WHEN p.role = 'professor'
            THEN COALESCE(pp.ativo, false)
          ELSE true
        END AS planilha_ativa

      FROM professores p

      LEFT JOIN alunos a
        ON a.professor_id = p.id

      LEFT JOIN LATERAL (
        SELECT
          id,
          aba,
          intervalo,
          ativo
        FROM professores_planilha
        WHERE
          LOWER(TRIM(email)) =
          LOWER(TRIM(p.email))
        ORDER BY id DESC
        LIMIT 1
      ) pp ON true

      GROUP BY
        p.id,
        p.nome,
        p.email,
        p.role,
        p.foto_url,
        p.created_at,
        p.updated_at,
        pp.id,
        pp.aba,
        pp.intervalo,
        pp.ativo

      ORDER BY
        p.nome ASC
      `
    );


    res.json({
      sucesso: true,
      professores: resultado.rows,
    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar professores:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar professores.",
    });

  }

});


// =====================================================
// POST /professores
// Cria usuário + configuração da planilha
// =====================================================

router.post("/", async (req, res) => {

  const client = await pool.connect();


  try {

    const acesso =
      await obterUsuarioAdminDev(req);


    if (!acesso.autorizado) {
      return res.status(acesso.status).json({
        sucesso: false,
        mensagem: acesso.mensagem,
      });
    }


    const {
      nome,
      email,
      role = "professor",
      intervalo,
      ativo = true,
    } = req.body;


    const nomeFinal =
      typeof nome === "string" &&
      nome.trim() !== ""
        ? nome.trim()
        : null;


    const emailFinal =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";


    const intervaloFinal =
      typeof intervalo === "string"
        ? intervalo.trim()
        : "";


    const ativoFinal =
      typeof ativo === "boolean"
        ? ativo
        : true;


    // -------------------------------------------------
    // VALIDAÇÕES
    // -------------------------------------------------

    if (!nomeFinal) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe o nome do usuário.",
      });
    }


    if (!emailFinal) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe o e-mail do usuário.",
      });
    }


    if (!validarRole(role)) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Tipo de acesso inválido.",
      });
    }


    // Somente professor precisa de configuração
    // de planilha/intervalo.
    if (
      role === "professor" &&
      !intervaloFinal
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Informe o intervalo da planilha.",
      });
    }


    // -------------------------------------------------
    // VERIFICA E-MAIL DUPLICADO
    // -------------------------------------------------

    const usuarioExistente =
      await client.query(
        `
        SELECT id
        FROM professores
        WHERE
          LOWER(TRIM(email)) =
          LOWER(TRIM($1))
        LIMIT 1
        `,
        [emailFinal]
      );


    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Já existe um usuário cadastrado com esse e-mail.",
      });
    }


    // -------------------------------------------------
    // TRANSAÇÃO
    // -------------------------------------------------

    await client.query("BEGIN");


    // -------------------------------------------------
    // CRIA USUÁRIO
    // -------------------------------------------------

    const professorResult =
      await client.query(
        `
        INSERT INTO professores (
          email,
          nome,
          role,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          email,
          nome,
          foto_url,
          role,
          created_at,
          updated_at
        `,
        [
          emailFinal,
          nomeFinal,
          role,
        ]
      );


    const professor =
      professorResult.rows[0];


    // -------------------------------------------------
    // CRIA CONFIGURAÇÃO DE PLANILHA
    // Somente para Professor
    // -------------------------------------------------

    if (role === "professor") {

      await client.query(
        `
        INSERT INTO professores_planilha (
          nome,
          email,
          aba,
          intervalo,
          ativo,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          CURRENT_TIMESTAMP
        )
        `,
        [
          nomeFinal,
          emailFinal,
          ABA_PLANILHA,
          intervaloFinal,
          ativoFinal,
        ]
      );

    }


    await client.query("COMMIT");


    res.status(201).json({
      sucesso: true,
      mensagem:
        "Usuário criado com sucesso.",
      professor,
    });


  } catch (error) {

    await client.query("ROLLBACK");


    console.error(
      "❌ Erro ao criar usuário:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao criar usuário.",
    });


  } finally {

    client.release();

  }

});


// =====================================================
// PUT /professores/:id
// Edita usuário + configuração da planilha
// =====================================================

router.put("/:id", async (req, res) => {

  const client = await pool.connect();


  try {

    const acesso =
      await obterUsuarioAdminDev(req);


    if (!acesso.autorizado) {
      return res.status(acesso.status).json({
        sucesso: false,
        mensagem: acesso.mensagem,
      });
    }


    const professorId =
      req.params.id;


    const {
      nome,
      email,
      role = "professor",
      intervalo,
      ativo = true,
    } = req.body;


    const nomeFinal =
      typeof nome === "string" &&
      nome.trim() !== ""
        ? nome.trim()
        : null;


    const emailFinal =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";


    const intervaloFinal =
      typeof intervalo === "string"
        ? intervalo.trim()
        : "";


    const ativoFinal =
      typeof ativo === "boolean"
        ? ativo
        : true;


    // -------------------------------------------------
    // VALIDAÇÕES
    // -------------------------------------------------

    if (
      !nomeFinal ||
      !emailFinal
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Nome e e-mail são obrigatórios.",
      });
    }


    if (!validarRole(role)) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Tipo de acesso inválido.",
      });
    }


    if (
      role === "professor" &&
      !intervaloFinal
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Informe o intervalo da planilha.",
      });
    }


    // -------------------------------------------------
    // BUSCA USUÁRIO
    // -------------------------------------------------

    const professorExistente =
      await client.query(
        `
        SELECT
          id,
          email,
          role
        FROM professores
        WHERE id = $1
        `,
        [professorId]
      );


    if (
      professorExistente.rows.length === 0
    ) {
      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Usuário não encontrado.",
      });
    }


    const usuarioAnterior =
      professorExistente.rows[0];


    // -------------------------------------------------
    // VERIFICA E-MAIL
    // -------------------------------------------------

    const emailEmUso =
      await client.query(
        `
        SELECT id
        FROM professores
        WHERE
          LOWER(TRIM(email)) =
          LOWER(TRIM($1))
          AND id <> $2
        LIMIT 1
        `,
        [
          emailFinal,
          professorId,
        ]
      );


    if (emailEmUso.rows.length > 0) {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Esse e-mail já está sendo usado por outro usuário.",
      });
    }


    const emailAntigo =
      usuarioAnterior.email;


    await client.query("BEGIN");


    // -------------------------------------------------
    // ATUALIZA USUÁRIO
    // -------------------------------------------------

    const professorResult =
      await client.query(
        `
        UPDATE professores
        SET
          nome = $1,
          email = $2,
          role = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING
          id,
          email,
          nome,
          foto_url,
          role,
          created_at,
          updated_at
        `,
        [
          nomeFinal,
          emailFinal,
          role,
          professorId,
        ]
      );


    const professor =
      professorResult.rows[0];


    // -------------------------------------------------
    // SE CONTINUA SENDO PROFESSOR
    // Atualiza configuração da planilha
    // -------------------------------------------------

    if (
      usuarioAnterior.role === "professor" &&
      role === "professor"
    ) {

      const planilhaResult =
        await client.query(
          `
          UPDATE professores_planilha
          SET
            nome = $1,
            email = $2,
            aba = $3,
            intervalo = $4,
            ativo = $5,
            updated_at = CURRENT_TIMESTAMP
          WHERE
            LOWER(TRIM(email)) =
            LOWER(TRIM($6))
          `,
          [
            nomeFinal,
            emailFinal,
            ABA_PLANILHA,
            intervaloFinal,
            ativoFinal,
            emailAntigo,
          ]
        );


      if (
        planilhaResult.rowCount === 0
      ) {

        await client.query(
          `
          INSERT INTO professores_planilha (
            nome,
            email,
            aba,
            intervalo,
            ativo,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            CURRENT_TIMESTAMP
          )
          `,
          [
            nomeFinal,
            emailFinal,
            ABA_PLANILHA,
            intervaloFinal,
            ativoFinal,
          ]
        );

      }

    }


    // -------------------------------------------------
    // SE DEIXOU DE SER PROFESSOR
    // Remove configuração da planilha
    // -------------------------------------------------

    if (
      usuarioAnterior.role === "professor" &&
      role !== "professor"
    ) {

      await client.query(
        `
        DELETE FROM professores_planilha
        WHERE
          LOWER(TRIM(email)) =
          LOWER(TRIM($1))
        `,
        [emailAntigo]
      );

    }


    // -------------------------------------------------
    // SE VIROU PROFESSOR
    // Cria configuração da planilha
    // -------------------------------------------------

    if (
      usuarioAnterior.role !== "professor" &&
      role === "professor"
    ) {

      await client.query(
        `
        INSERT INTO professores_planilha (
          nome,
          email,
          aba,
          intervalo,
          ativo,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          CURRENT_TIMESTAMP
        )
        `,
        [
          nomeFinal,
          emailFinal,
          ABA_PLANILHA,
          intervaloFinal,
          ativoFinal,
        ]
      );

    }


    await client.query("COMMIT");


    res.json({
      sucesso: true,
      mensagem:
        "Usuário atualizado com sucesso.",
      professor,
    });


  } catch (error) {

    await client.query("ROLLBACK");


    console.error(
      "❌ Erro ao editar usuário:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao editar usuário.",
    });


  } finally {

    client.release();

  }

});


// =====================================================
// PATCH /professores/:id/desativar
// Ativa ou desativa sincronização do Professor
// =====================================================

router.patch("/:id/desativar", async (req, res) => {

  const client = await pool.connect();


  try {

    const acesso =
      await obterUsuarioAdminDev(req);


    if (!acesso.autorizado) {
      return res.status(acesso.status).json({
        sucesso: false,
        mensagem: acesso.mensagem,
      });
    }


    const professorId =
      req.params.id;


    const professor =
      await client.query(
        `
        SELECT
          id,
          nome,
          email,
          role
        FROM professores
        WHERE id = $1
        `,
        [professorId]
      );



    if (
      professor.rows.length === 0
    ) {
      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Usuário não encontrado.",
      });
    }


    // Esse status representa a sincronização
    // da planilha e só existe para professores.
    if (
      professor.rows[0].role !== "professor"
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "A ativação e desativação da planilha só se aplica a professores.",
      });
    }


    const email =
      professor.rows[0].email;


    const planilha =
      await client.query(
        `
        SELECT
          id,
          ativo
        FROM professores_planilha
        WHERE
          LOWER(TRIM(email)) =
          LOWER(TRIM($1))
        ORDER BY id DESC
        LIMIT 1
        `,
        [email]
      );


    const estadoAtual =
      planilha.rows.length > 0
        ? planilha.rows[0].ativo
        : true;


    const novoEstado =
      !estadoAtual;


    await client.query("BEGIN");


    if (planilha.rows.length > 0) {

      await client.query(
        `
        UPDATE professores_planilha
        SET
          ativo = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE
          LOWER(TRIM(email)) =
          LOWER(TRIM($2))
        `,
        [
          novoEstado,
          email,
        ]
      );

    } else {

      await client.query(
        `
        INSERT INTO professores_planilha (
          nome,
          email,
          aba,
          intervalo,
          ativo,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          '',
          $4,
          CURRENT_TIMESTAMP
        )
        `,
        [
          professor.rows[0].nome,
          professor.rows[0].email,
          ABA_PLANILHA,
          novoEstado,
        ]
      );

    }


    await client.query("COMMIT");


    res.json({
      sucesso: true,
      ativo: novoEstado,
      mensagem: novoEstado
        ? "Professor ativado com sucesso."
        : "Professor desativado com sucesso.",
    });


  } catch (error) {

    await client.query("ROLLBACK");


    console.error(
      "❌ Erro ao alterar status do professor:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao alterar status do professor.",
    });


  } finally {

    client.release();

  }

});


// =====================================================
// DELETE /professores/:id
// Exclusão definitiva — SOMENTE DEV
// =====================================================

router.delete("/:id", async (req, res) => {

  const client = await pool.connect();


  try {

    const acesso =
      await obterUsuarioAdminDev(req);


    if (!acesso.autorizado) {
      return res.status(acesso.status).json({
        sucesso: false,
        mensagem: acesso.mensagem,
      });
    }


    if (
  acesso.usuario.role !== "admin" &&
  acesso.usuario.role !== "dev"
) {
  return res.status(403).json({
    sucesso: false,
    mensagem:
      "Você não tem permissão para excluir usuários.",
  });
}


    const professorId =
      req.params.id;


    // Impede excluir a própria conta
    if (
      Number(professorId) ===
      Number(acesso.usuario.id)
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Você não pode excluir sua própria conta.",
      });
    }


    const professor =
      await client.query(
        `
        SELECT
          id,
          nome,
          email,
          role
        FROM professores
        WHERE id = $1
        `,
        [professorId]
      );


    if (
      professor.rows.length === 0
    ) {
      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Usuário não encontrado.",
      });
    }


// -------------------------------------------------
// VERIFICA SE O PROFESSOR ESTÁ DESATIVADO
// -------------------------------------------------

const statusPlanilha =
  await client.query(
    `
    SELECT
      ativo
    FROM professores_planilha
    WHERE
      LOWER(TRIM(email)) =
      LOWER(TRIM($1))
    ORDER BY id DESC
    LIMIT 1
    `,
    [professor.rows[0].email]
  );


const estaAtivo =
  statusPlanilha.rows.length === 0
    ? true
    : statusPlanilha.rows[0].ativo;


if (estaAtivo) {

  return res.status(409).json({
    sucesso: false,
    mensagem:
      "Este usuário precisa estar desativado antes de ser excluído definitivamente.",
  });

}


    await client.query("BEGIN");


    // Remove configuração de planilha,
    // caso exista.
    await client.query(
      `
      DELETE FROM professores_planilha
      WHERE
        LOWER(TRIM(email)) =
        LOWER(TRIM($1))
      `,
      [professor.rows[0].email]
    );


    // Remove usuário.
    await client.query(
      `
      DELETE FROM professores
      WHERE id = $1
      `,
      [professorId]
    );


    await client.query("COMMIT");


    res.json({
      sucesso: true,
      mensagem:
        "Usuário excluído definitivamente.",
    });


  } catch (error) {

    await client.query("ROLLBACK");


    console.error(
      "❌ Erro ao excluir usuário:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao excluir usuário.",
    });


  } finally {

    client.release();

  }

});


// =====================================================
// GET /professores/:id/alunos
// Lista os alunos de um professor
// =====================================================

router.get("/:id/alunos", async (req, res) => {

  try {

    const acesso =
      await obterUsuarioAdminDev(req);


    if (!acesso.autorizado) {
      return res.status(acesso.status).json({
        sucesso: false,
        mensagem: acesso.mensagem,
      });
    }


    const professorId =
      req.params.id;


    const professor =
      await pool.query(
        `
        SELECT
          id,
          nome,
          email,
          foto_url,
          role
        FROM professores
        WHERE
          id = $1
          AND role = 'professor'
        `,
        [professorId]
      );


    if (
      professor.rows.length === 0
    ) {
      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Professor não encontrado.",
      });
    }


    const alunos =
      await pool.query(
        `
        SELECT
          id,
          codigo_aluno,
          nome,
          nascimento,
          foto,
          instrumento,
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
      professor:
        professor.rows[0],
      alunos:
        alunos.rows,
    });


  } catch (error) {

    console.error(
      "❌ Erro ao buscar alunos do professor:",
      error
    );


    res.status(500).json({
      sucesso: false,
      mensagem:
        "Erro ao buscar alunos do professor.",
    });

  }

});


module.exports = router;