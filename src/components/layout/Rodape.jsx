import { ChefHat } from "lucide-react";

/** Rodapé reutilizável. */
export default function Rodape({
  location, irParaInicio, irParaReceitas, criarReceita,
  abrirPerfil, sairDaConta, desabilitarSair,
}) {
  return (
    <footer className="rodape">
        <div className="rodape-conteudo">
          <div className="rodape-principal">
            {/* IDENTIDADE */}
            <div className="rodape-identidade">
              <button
                type="button"
                className="rodape-logo"
                onClick={irParaInicio}
                aria-label="My Kitchen - Ir para o início"
              >
                <span className="rodape-logo-icone">
                  <ChefHat
                    size={26}
                    strokeWidth={2}
                  />
                </span>

                <strong>My Kitchen</strong>
              </button>

              <p>
                Um cantinho especial para guardar,
                organizar e compartilhar suas
                receitas favoritas.
              </p>

              <span className="rodape-identidade-frase">
                Seu livro de receitas digital.
              </span>
            </div>

            {/* NAVEGAÇÃO */}
            <nav
              className="rodape-coluna"
              aria-label="Navegação do rodapé"
            >
              <h2>Navegação</h2>

              <button
                type="button"
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
                onClick={irParaReceitas}
                aria-current={
                  location.pathname === "/receitas"
                    ? "page"
                    : undefined
                }
              >
                Minhas receitas
              </button>

              <button
                type="button"
                onClick={criarReceita}
                aria-current={
                  location.pathname === "/receitas/nova"
                    ? "page"
                    : undefined
                }
              >
                Nova receita
              </button>
            </nav>

            {/* MINHA CONTA */}
            <nav
              className="rodape-coluna"
              aria-label="Opções da conta"
            >
              <h2>Minha conta</h2>

              <button
                type="button"
                onClick={abrirPerfil}
                aria-current={
                  location.pathname === "/perfil"
                    ? "page"
                    : undefined
                }
              >
                Meu perfil
              </button>

              <button
                type="button"
                onClick={sairDaConta}
                disabled={desabilitarSair}
              >
                Sair da conta
              </button>
            </nav>
          </div>

          {/* DIREITOS AUTORAIS */}
          <div className="rodape-inferior">
            <p>
              © {new Date().getFullYear()} My Kitchen.
              Todos os direitos reservados.
            </p>

            <span>
              Suas receitas, do seu jeito.
            </span>
          </div>
        </div>
      </footer>
  );
}
