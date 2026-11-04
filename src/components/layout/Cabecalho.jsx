import { ChefHat, LogOut } from "lucide-react";

/** Menu da área autenticada. */
export default function Cabecalho({
  location, nomeUsuario, emailUsuario, fotoUsuario, inicialUsuario,
  irParaInicio, irParaReceitas, abrirPerfil, sairDaConta, desabilitarSair,
}) {
  return (
    <header className="cabecalho">
        {/* LOGO */}
        <button
          type="button"
          className="logo"
          onClick={irParaInicio}
          aria-label="My Kitchen - Início"
        >
          <span className="logo-icone">
            <ChefHat size={25} />
          </span>

          <span>My Kitchen</span>
        </button>

        {/* NAVEGAÇÃO */}
        <nav
          className="menu-principal"
          aria-label="Navegação principal"
        >
          <button
            type="button"
            className={
              location.pathname === "/"
                ? "menu-link ativo"
                : "menu-link"
            }
            onClick={irParaInicio}
            aria-current={
              location.pathname === "/"
                ? "page"
                : undefined
            }
          >
            Início
          </button>

          <button
            type="button"
            className={
              location.pathname.startsWith(
                "/receitas"
              )
                ? "menu-link ativo"
                : "menu-link"
            }
            onClick={irParaReceitas}
            aria-current={
              location.pathname === "/receitas"
                ? "page"
                : undefined
            }
          >
            Receitas
          </button>
        </nav>

        {/* CONTA */}
        <div className="cabecalho-conta">
          <button
            type="button"
            className="perfil-usuario"
            title="Abrir meu perfil"
            aria-label={
              `Abrir perfil de ${nomeUsuario}`
            }
            aria-current={
              location.pathname === "/perfil"
                ? "page"
                : undefined
            }
            onClick={abrirPerfil}
          >
            <span className="perfil-avatar">
              {fotoUsuario ? (
                <img
                  src={fotoUsuario}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{inicialUsuario}</span>
              )}
            </span>

            <span className="perfil-dados">
              <strong className="perfil-nome">
                {nomeUsuario}
              </strong>

              <small className="perfil-email">
                {emailUsuario}
              </small>
            </span>
          </button>

          <button
            type="button"
            className="botao-sair"
            onClick={sairDaConta}
            disabled={desabilitarSair}
          >
            <LogOut size={17} />
            <span>Sair</span>
          </button>
        </div>
      </header>
  );
}
